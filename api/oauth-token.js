import crypto from "node:crypto";
function sign(value,secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url")}
function verify(code,secret){
  const [payload,sig]=String(code||"").split(".");
  if(!payload||!sig||sign(payload,secret)!==sig) throw new Error("invalid_grant");
  const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
  if(Date.now()>data.exp) throw new Error("invalid_grant");
  return data;
}
function pkce(verifier){
  return crypto.createHash("sha256").update(String(verifier||"")).digest("base64url");
}
export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"invalid_request"});
  try{
    const b=req.body||{};
    const secret=process.env.MCP_CLIENT_SECRET||"link-chatgpt-local-secret";
    if(b.client_secret && b.client_secret!==secret) throw new Error("invalid_client");
    const data=verify(b.code,secret);
    if(data.code_challenge && pkce(b.code_verifier)!==data.code_challenge) throw new Error("invalid_grant");
    const token=process.env.MCP_ACCESS_TOKEN;
    if(!token) throw new Error("server_not_configured");
    res.status(200).json({access_token:token,token_type:"Bearer",expires_in:86400,scope:"link_control"});
  }catch(e){res.status(e.message==="server_not_configured"?500:400).json({error:e.message||"invalid_grant"});}
}
