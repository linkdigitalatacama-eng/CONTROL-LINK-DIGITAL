export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const body=req.body||{};
  const clientId="link-chatgpt";
  const clientSecret=process.env.MCP_CLIENT_SECRET||"link-chatgpt-local-secret";
  res.status(201).json({
    client_id:clientId,
    client_secret:clientSecret,
    client_id_issued_at:Math.floor(Date.now()/1000),
    token_endpoint_auth_method:"client_secret_post",
    redirect_uris:body.redirect_uris||[]
  });
}
