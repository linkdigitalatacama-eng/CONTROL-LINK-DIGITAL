import { createHash, randomBytes } from 'node:crypto';

const cleanUrl = x => String(x || '').replace(/\/$/, '');
const supa = () => ({
  url: cleanUrl(process.env.SUPABASE_URL || ''),
  key: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || ''
});

function headers(key, extra = {}) {
  return { apikey: key, 'Content-Type': 'application/json', ...extra };
}

async function readJson(r) {
  const text = await r.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

async function requireUser(req) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) throw Object.assign(new Error('Debes iniciar sesión en LINK CONTROL para administrar las API.'), { status: 401 });
  const token = auth.slice(7).trim();
  const { url, key } = supa();
  if (!url || !key) throw Object.assign(new Error('Supabase no está configurado en Vercel'), { status: 500 });
  const r = await fetch(`${url}/auth/v1/user`, { headers: headers(key, { Authorization: `Bearer ${token}` }) });
  const data = await readJson(r);
  if (!r.ok || !data?.id) throw Object.assign(new Error('Sesión de LINK no válida o expirada.'), { status: 401 });
  return { token, user: data };
}

function makeKey() {
  return `lk_live_${randomBytes(32).toString('base64url')}`;
}
function hashKey(key) { return createHash('sha256').update(key).digest('hex'); }
function prefix(key) { return `${key.slice(0, 15)}…`; }

async function createKey(req, res, body) {
  const { token, user } = await requireUser(req);
  const { url, key } = supa();
  const name = String(body.name || 'LINK API').trim().slice(0, 100) || 'LINK API';
  const scopes = Array.isArray(body.scopes) && body.scopes.length ? body.scopes.map(String).slice(0, 20) : ['events:write'];
  const rawKey = makeKey();
  const r = await fetch(`${url}/rest/v1/gateway_api_keys`, {
    method: 'POST',
    headers: headers(key, { Authorization: `Bearer ${token}`, Prefer: 'return=representation' }),
    body: JSON.stringify({ owner_id: user.id, name, key_prefix: prefix(rawKey), key_hash: hashKey(rawKey), scopes })
  });
  const data = await readJson(r);
  if (!r.ok) throw Object.assign(new Error(data?.message || data?.hint || 'Supabase rechazó la creación de la API.'), { status: 502, detail: data });
  const row = Array.isArray(data) ? data[0] : data;
  return res.status(201).json({ ok: true, key: rawKey, warning: 'Guarda esta clave ahora. LINK no vuelve a mostrar la clave completa.', api_key: { id: row.id, name: row.name, prefix: row.key_prefix, scopes: row.scopes, status: row.status, created_at: row.created_at } });
}

async function listKeys(req, res) {
  const { token, user } = await requireUser(req);
  const { url, key } = supa();
  const r = await fetch(`${url}/rest/v1/gateway_api_keys?select=id,name,key_prefix,scopes,status,last_used_at,created_at,revoked_at&owner_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc`, { headers: headers(key, { Authorization: `Bearer ${token}` }) });
  const data = await readJson(r);
  if (!r.ok) throw Object.assign(new Error(data?.message || 'No se pudieron cargar las API.'), { status: 502 });
  return res.status(200).json({ ok: true, keys: Array.isArray(data) ? data : [] });
}

async function revokeKey(req, res, body) {
  const { token } = await requireUser(req);
  const { url, key } = supa();
  const id = String(body.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Falta el id de la API.' });
  const r = await fetch(`${url}/rest/v1/rpc/gateway_revoke_api_key`, { method: 'POST', headers: headers(key, { Authorization: `Bearer ${token}` }), body: JSON.stringify({ p_id: id }) });
  const data = await readJson(r);
  if (!r.ok) throw Object.assign(new Error(data?.message || 'No se pudo revocar la API.'), { status: 502 });
  return res.status(200).json({ ok: Boolean(data), revoked: Boolean(data) });
}

async function recordEvent(req, res, body) {
  const { url, key } = supa();
  if (!url || !key) return res.status(500).json({ error: 'Supabase no está configurado en Vercel' });
  const apiKey = String(req.headers['x-link-api-key'] || (String(req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : '') || body.api_key || '').trim();
  if (!apiKey) return res.status(401).json({ error: 'Falta X-LINK-API-Key.' });
  const eventType = String(body.event || body.event_type || '').trim().slice(0, 120);
  if (!eventType) return res.status(400).json({ error: 'Falta event/event_type.' });
  const idem = String(req.headers['x-link-idempotency-key'] || body.idempotency_key || '').trim().slice(0, 240) || null;
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : body;
  const r = await fetch(`${url}/rest/v1/rpc/gateway_record_api_event`, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify({ p_key: apiKey, p_event_type: eventType, p_source: String(body.source || 'api').slice(0, 80), p_external_id: String(body.external_id || '').slice(0, 240) || null, p_idempotency_key: idem, p_payload: payload })
  });
  const data = await readJson(r);
  if (!r.ok) {
    const status = r.status === 401 || r.status === 403 ? r.status : 502;
    return res.status(status).json({ error: data?.message || data?.hint || 'API key inválida o evento rechazado.' });
  }
  return res.status(202).json(data);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const action = String(req.query?.action || (req.body && req.body.action) || 'health');
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (req.method === 'GET' && action === 'health') return res.status(200).json({ ok: true, service: 'LINK Gateway API', protocol: 'events:v1', endpoint: '/api/gateway?action=event' });
    if (req.method === 'GET' && action === 'keys') return await listKeys(req, res);
    if (req.method === 'POST' && action === 'keys') return await createKey(req, res, body);
    if (req.method === 'POST' && action === 'revoke') return await revokeKey(req, res, body);
    if (req.method === 'POST' && action === 'event') return await recordEvent(req, res, body);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Error interno', ...(e.detail ? { detail: e.detail } : {}) });
  }
}
