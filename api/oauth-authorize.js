import crypto from "node:crypto";
function b64(v){return Buffer.from(v).toString("base64url")}
function sign(value,secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url")}
export default function handler(req,res){
  const q=req.query||{};
  if(req.method!=="GET") return res.status(405).send("Method not allowed");
  const {client_id,redirect_uri,state,code_challenge,code_challenge_method}=q;
  if(!client_id||!redirect_uri) return res.status(400).send("Missing OAuth parameters");
  const payload=b64(JSON.stringify({client_id,redirect_uri,code_challenge:code_challenge||"",method:code_challenge_method||"S256",exp:Date.now()+300000}));
  const sig=sign(payload,process.env.MCP_CLIENT_SECRET||"link-chatgpt-local-secret");
  const code=`${payload}.${sig}`;
  const safeRedirect=String(redirect_uri);
  const html=`<!doctype html><meta charset="utf-8"><title>LINK CONTROL · Autorizar</title>
  <style>body{font-family:Inter,system-ui,sans-serif;background:#f5f5f2;color:#222;display:grid;place-items:center;min-height:100vh;margin:0}.box{max-width:520px;background:#fff;border:1px solid #ddd;border-radius:18px;padding:32px;box-shadow:0 18px 50px #0001}button{border:0;border-radius:10px;padding:12px 18px;background:#111;color:#fff;font-weight:700;cursor:pointer}.muted{color:#666;line-height:1.5}</style>
  <div class="box"><small>LINK CONTROL · CHATGPT CONNECTOR</small><h1>Autorizar acceso</h1><p class="muted">ChatGPT podrá consultar y operar el Sales OS mediante las herramientas autorizadas del conector.</p><form method="GET" action="${safeRedirect}"><input type="hidden" name="code" value="${code}"><input type="hidden" name="state" value="${state||""}"><button>Autorizar LINK CONTROL</button></form></div>`;
  res.setHeader("Content-Type","text/html; charset=utf-8");res.status(200).send(html);
}
