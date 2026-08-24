export default function handler(req,res){
  const base=(process.env.APP_URL||`https://${req.headers.host}`).replace(/\/$/,"");
  res.status(200).json({
    issuer:base,
    authorization_endpoint:`${base}/oauth/authorize`,
    token_endpoint:`${base}/oauth/token`,
    registration_endpoint:`${base}/oauth/register`,
    response_types_supported:["code"],
    grant_types_supported:["authorization_code"],
    code_challenge_methods_supported:["S256"],
    token_endpoint_auth_methods_supported:["client_secret_post","none"]
  });
}
