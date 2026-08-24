export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).send("Method not allowed");
  const endpoint=`${(process.env.APP_URL||`https://${req.headers.host}`).replace(/\/$/,"")}/api/mcp`;
  res.setHeader("Content-Type","text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control","no-cache, no-transform");
  res.setHeader("Connection","keep-alive");
  res.write(`event: endpoint\ndata: ${endpoint}\n\n`);
  res.end();
}
