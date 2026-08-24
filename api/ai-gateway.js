
const DEFAULT_TIMEOUT_MS = 45000;
const MAX_MESSAGES = 40;
const MAX_INPUT_CHARS = 50000;

function json(res, status, body, origin = "") {
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(body);
}

function allowedOrigin(req) {
  const origin = req.headers.origin || "";
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  // Same-origin browser calls often have an Origin. If no allowlist is configured,
  // allow the deployment origin and local development only.
  if (!origin) return "";
  if (configured.includes(origin)) return origin;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  if (host && origin === `${proto}://${host}`) return origin;

  if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return origin;
  return null;
}

async function requireAuthIfEnabled(req) {
  if (process.env.REQUIRE_SUPABASE_AUTH !== "true") return { ok: true };
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return { ok: false, status: 401, error: "Authentication required" };

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return { ok: false, status: 500, error: "Supabase auth is enabled but server env is incomplete" };

  const r = await fetch(`${supabaseUrl.replace(/\/$/,"")}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: anonKey }
  });
  if (!r.ok) return { ok: false, status: 401, error: "Invalid session" };
  return { ok: true, user: await r.json() };
}

function configuredProviders() {
  return {
    openai: { configured: Boolean(process.env.OPENAI_API_KEY), defaultModel: process.env.OPENAI_MODEL || "gpt-5.6-luna" },
    openrouter: { configured: Boolean(process.env.OPENROUTER_API_KEY), defaultModel: process.env.OPENROUTER_MODEL || "openai/gpt-5.5" },
    ollama: { configured: Boolean(process.env.OLLAMA_BASE_URL), defaultModel: process.env.OLLAMA_MODEL || "llama3.2" },
    gateway: { configured: Boolean(process.env.AI_GATEWAY_BASE_URL), defaultModel: process.env.AI_GATEWAY_MODEL || "" }
  };
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw new Error("messages must be a non-empty array");
  if (messages.length > MAX_MESSAGES) throw new Error(`Too many messages; max ${MAX_MESSAGES}`);

  let total = 0;
  const clean = messages.map(m => {
    const role = String(m?.role || "");
    if (!["system","user","assistant"].includes(role)) throw new Error(`Unsupported role: ${role}`);
    const content = typeof m?.content === "string" ? m.content : "";
    total += content.length;
    return { role, content };
  });
  if (total > MAX_INPUT_CHARS) throw new Error(`Input too large; max ${MAX_INPUT_CHARS} characters`);
  return clean;
}

function ensureAllowedModel(model) {
  const allowed = (process.env.ALLOWED_AI_MODELS || "").split(",").map(s=>s.trim()).filter(Boolean);
  if (!allowed.length || !model) return;
  if (!allowed.includes(model)) throw new Error("Requested model is not in ALLOWED_AI_MODELS");
}

function withTimeout(ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function fetchJson(url, options) {
  const t = withTimeout(Number(process.env.AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
  try {
    const r = await fetch(url, { ...options, signal: t.signal });
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { raw: text }; }
    if (!r.ok) {
      const upstream = data?.error?.message || data?.message || data?.error || `Upstream HTTP ${r.status}`;
      throw new Error(typeof upstream === "string" ? upstream : JSON.stringify(upstream));
    }
    return data;
  } finally {
    t.done();
  }
}

function extractResponsesText(data) {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
      else if (typeof content?.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function chatCompatibleUrl(base) {
  let x = String(base || "").replace(/\/+$/,"");
  if (!x) throw new Error("AI_GATEWAY_BASE_URL is missing");
  if (/\/chat\/completions$/.test(x)) return x;
  if (/\/v1$/.test(x)) return `${x}/chat/completions`;
  return `${x}/v1/chat/completions`;
}

async function callOpenAI({ model, messages, temperature }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const system = messages.filter(m=>m.role==="system").map(m=>m.content).join("\n\n");
  const input = messages.filter(m=>m.role!=="system").map(m=>({ role:m.role, content:m.content }));
  const chosen = model || process.env.OPENAI_MODEL || "gpt-5.6-luna";
  ensureAllowedModel(chosen);

  const body = { model: chosen, input };
  if (system) body.instructions = system;
  // Do not force temperature: some reasoning models/providers may reject it.
  if (Number.isFinite(temperature) && process.env.OPENAI_SEND_TEMPERATURE === "true") body.temperature = temperature;

  const data = await fetchJson("https://api.openai.com/v1/responses", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
    body:JSON.stringify(body)
  });
  return { content: extractResponsesText(data), model: data.model || chosen, provider:"openai", id:data.id };
}

async function callOpenRouter({ model, messages, temperature }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  const chosen = model || process.env.OPENROUTER_MODEL || "openai/gpt-5.5";
  ensureAllowedModel(chosen);

  const body = { model:chosen, messages, stream:false };
  if (Number.isFinite(temperature)) body.temperature = temperature;

  const headers = {
    "Content-Type":"application/json",
    "Authorization":`Bearer ${key}`
  };
  if (process.env.APP_URL) headers["HTTP-Referer"] = process.env.APP_URL;
  headers["X-Title"] = process.env.APP_TITLE || "LINK CONTROL";

  const data = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST", headers, body:JSON.stringify(body)
  });
  return { content:data?.choices?.[0]?.message?.content || "", model:data.model || chosen, provider:"openrouter", id:data.id };
}

async function callOllama({ model, messages, temperature }) {
  const base = process.env.OLLAMA_BASE_URL;
  if (!base) throw new Error("OLLAMA_BASE_URL is not configured");
  const chosen = model || process.env.OLLAMA_MODEL || "llama3.2";
  ensureAllowedModel(chosen);

  const body = { model:chosen, messages, stream:false };
  if (Number.isFinite(temperature)) body.temperature = temperature;

  const data = await fetchJson(`${base.replace(/\/+$/,"")}/v1/chat/completions`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":"Bearer ollama" },
    body:JSON.stringify(body)
  });
  return { content:data?.choices?.[0]?.message?.content || "", model:data.model || chosen, provider:"ollama", id:data.id };
}

async function callGenericGateway({ model, messages, temperature }) {
  const url = chatCompatibleUrl(process.env.AI_GATEWAY_BASE_URL);
  const key = process.env.AI_GATEWAY_API_KEY || "";
  const chosen = model || process.env.AI_GATEWAY_MODEL || "";
  if (!chosen) throw new Error("No model configured for generic gateway");
  ensureAllowedModel(chosen);

  const headers = { "Content-Type":"application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;
  const body = { model:chosen, messages, stream:false };
  if (Number.isFinite(temperature)) body.temperature = temperature;

  const data = await fetchJson(url,{ method:"POST",headers,body:JSON.stringify(body) });
  return { content:data?.choices?.[0]?.message?.content || "", model:data.model || chosen, provider:"gateway", id:data.id };
}

async function routeProvider(provider, args) {
  if (provider === "openai") return callOpenAI(args);
  if (provider === "openrouter") return callOpenRouter(args);
  if (provider === "ollama") return callOllama(args);
  if (provider === "gateway") return callGenericGateway(args);
  throw new Error("Unsupported provider");
}

export default async function handler(req,res) {
  const origin = allowedOrigin(req);
  if (origin === null) return json(res,403,{error:"Origin not allowed"});
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();

  const auth = await requireAuthIfEnabled(req);
  if (!auth.ok) return json(res,auth.status || 401,{error:auth.error},origin || "");

  if (req.method === "GET") {
    return json(res,200,{
      ok:true,
      gateway:"LINK AI Gateway",
      version:"1.0",
      providers:configuredProviders(),
      authRequired:process.env.REQUIRE_SUPABASE_AUTH === "true"
    },origin || "");
  }
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"},origin || "");

  try {
    const provider = String(req.body?.provider || "openrouter");
    const messages = sanitizeMessages(req.body?.messages);
    const model = req.body?.model ? String(req.body.model) : undefined;
    const temperature = typeof req.body?.temperature === "number" ? req.body.temperature : undefined;
    const probe = Boolean(req.body?.probe);
    const started = Date.now();

    const result = await routeProvider(provider,{
      model,
      messages: probe ? [{role:"user",content:"Responde exactamente: OK"}] : messages,
      temperature: probe ? 0 : temperature
    });

    return json(res,200,{
      ok:true,
      content:result.content,
      meta:{
        provider:result.provider,
        model:result.model,
        upstreamId:result.id || null,
        latencyMs:Date.now()-started,
        probe
      }
    },origin || "");
  } catch(error) {
    const message = error?.name === "AbortError" ? "AI upstream timeout" : (error?.message || "Gateway request failed");
    return json(res,502,{ok:false,error:message},origin || "");
  }
}
