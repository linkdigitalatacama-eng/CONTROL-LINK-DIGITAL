const TOOLS=[
 {name:"link_dashboard",description:"Devuelve el estado ejecutivo del Sales OS: pipeline, tareas, agenda, prospectos y clientes activos.",inputSchema:{type:"object",properties:{}}},
 {name:"link_search_prospects",description:"Busca prospectos por estado, industria, ciudad o texto.",inputSchema:{type:"object",properties:{query:{type:"string"},status:{type:"string"},industry:{type:"string"},city:{type:"string"},limit:{type:"number"}}}},
 {name:"link_get_client",description:"Obtiene la ficha 360 de un cliente por id.",inputSchema:{type:"object",properties:{client_id:{type:"string"}},required:["client_id"]}},
 {name:"link_update_pipeline",description:"Mueve una oportunidad a una etapa del pipeline y registra la próxima acción.",inputSchema:{type:"object",properties:{prospect_id:{type:"string"},stage:{type:"string"},next_action:{type:"string"},next_action_at:{type:"string"}} ,required:["prospect_id","stage"]}},
 {name:"link_create_task",description:"Crea una acción de seguimiento ligada opcionalmente a cliente o prospecto.",inputSchema:{type:"object",properties:{title:{type:"string"},client_id:{type:"string"},prospect_id:{type:"string"},due_at:{type:"string"},priority:{type:"string"},notes:{type:"string"}},required:["title"]}},
 {name:"link_add_memory",description:"Agrega una memoria o aprendizaje a la inteligencia de un cliente.",inputSchema:{type:"object",properties:{client_id:{type:"string"},title:{type:"string"},content:{type:"string"},kind:{type:"string"}},required:["client_id","content"]}},
 {name:"link_add_source",description:"Agrega una fuente documental a la inteligencia de un cliente.",inputSchema:{type:"object",properties:{client_id:{type:"string"},title:{type:"string"},source_url:{type:"string"},content:{type:"string"},kind:{type:"string"}},required:["client_id","content"]}},
 {name:"link_ask_client_ai",description:"Consulta la inteligencia de un cliente usando sus datos, memorias y fuentes almacenadas.",inputSchema:{type:"object",properties:{client_id:{type:"string"},question:{type:"string"}},required:["client_id","question"]}}
];

function auth(req){
 const expected=process.env.MCP_ACCESS_TOKEN;
 if(!expected) return true; // setup may be public in local development
 return String(req.headers.authorization||"")===`Bearer ${expected}`;
}
async function supa(path,opts={}){
 const base=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key) throw new Error("Supabase server configuration missing");
 const r=await fetch(`${base}/rest/v1/${path}`,{...opts,headers:{"apikey":key,"Authorization":`Bearer ${key}`,"Content-Type":"application/json","Prefer":"return=representation",...(opts.headers||{})}});
 const text=await r.text(); let data={}; try{data=text?JSON.parse(text):{}}catch{data={raw:text}};
 if(!r.ok) throw new Error(data?.message||data?.hint||`Supabase HTTP ${r.status}`);
 return data;
}
function result(data){return {content:[{type:"text",text:JSON.stringify(data,null,2)}]}}

async function callTool(name,a){
 switch(name){
  case "link_dashboard":{
   const [p,c,t,e]=await Promise.all([
    supa("prospects?select=id,name,stage,score,next_action,next_action_at&order=updated_at.desc&limit=100"),
    supa("clients?select=id,name,status,next_action,next_action_at&order=updated_at.desc&limit=100"),
    supa("tasks?select=id,title,status,priority,due_at&order=due_at.asc&limit=50"),
    supa("calendar_events?select=id,title,start_at,end_at,status&order=start_at.asc&limit=50")
   ]);
   return result({prospects:p,clients:c,tasks:t,calendar:e});
  }
  case "link_search_prospects":{
   const q=encodeURIComponent(a.query||"");
   const parts=["select=*","order=score.desc,updated_at.desc",`limit=${Math.min(Number(a.limit)||20,100)}`];
   if(a.status)parts.push(`stage=eq.${encodeURIComponent(a.status)}`);
   if(a.industry)parts.push(`industry=ilike.*${encodeURIComponent(a.industry)}*`);
   if(a.city)parts.push(`city=ilike.*${encodeURIComponent(a.city)}*`);
   if(a.query)parts.push(`or=(name.ilike.*${q}*,website.ilike.*${q}*,instagram.ilike.*${q}*)`);
   return result(await supa(`prospects?${parts.join("&")}`));
  }
  case "link_get_client":{
   const [c,m,s,o,k]=await Promise.all([
    supa(`clients?id=eq.${encodeURIComponent(a.client_id)}&select=*`),
    supa(`client_memories?client_id=eq.${encodeURIComponent(a.client_id)}&select=*&order=created_at.desc&limit=50`),
    supa(`client_sources?client_id=eq.${encodeURIComponent(a.client_id)}&select=*&order=created_at.desc&limit=50`),
    supa(`opportunities?client_id=eq.${encodeURIComponent(a.client_id)}&select=*&order=updated_at.desc&limit=50`),
    supa(`tasks?client_id=eq.${encodeURIComponent(a.client_id)}&select=*&order=due_at.asc&limit=50`)
   ]);
   return result({client:c?.[0]||null,memories:m,sources:s,opportunities:o,tasks:k});
  }
  case "link_update_pipeline":{
   const patch={stage:a.stage,updated_at:new Date().toISOString()};
   if(a.next_action!==undefined)patch.next_action=a.next_action;
   if(a.next_action_at!==undefined)patch.next_action_at=a.next_action_at;
   return result(await supa(`prospects?id=eq.${encodeURIComponent(a.prospect_id)}`,{method:"PATCH",body:JSON.stringify(patch)}));
  }
  case "link_create_task":{
   const row={title:a.title,client_id:a.client_id||null,prospect_id:a.prospect_id||null,due_at:a.due_at||null,priority:a.priority||"media",notes:a.notes||"",status:"pendiente"};
   return result(await supa("tasks",{method:"POST",body:JSON.stringify(row)}));
  }
  case "link_add_memory":{
   return result(await supa("client_memories",{method:"POST",body:JSON.stringify({client_id:a.client_id,title:a.title||"Memoria LINK",content:a.content,kind:a.kind||"insight"})}));
  }
  case "link_add_source":{
   return result(await supa("client_sources",{method:"POST",body:JSON.stringify({client_id:a.client_id,title:a.title||"Fuente",source_url:a.source_url||null,content:a.content,kind:a.kind||"note"})}));
  }
  case "link_ask_client_ai":{
   const [c,m,s,o]=await Promise.all([
    supa(`clients?id=eq.${encodeURIComponent(a.client_id)}&select=*`),
    supa(`client_memories?client_id=eq.${encodeURIComponent(a.client_id)}&select=title,content,kind&order=created_at.desc&limit=30`),
    supa(`client_sources?client_id=eq.${encodeURIComponent(a.client_id)}&select=title,content,source_url,kind&order=created_at.desc&limit=30`),
    supa(`opportunities?client_id=eq.${encodeURIComponent(a.client_id)}&select=title,stage,value,next_action&order=updated_at.desc&limit=20`)
   ]);
   const context=JSON.stringify({client:c?.[0]||null,memories:m,sources:s,opportunities:o});
   const base=(process.env.APP_URL||`https://${process.env.VERCEL_URL||"localhost"}`).replace(/\/$/,"");
   const r=await fetch(`${base}/api/ai-gateway`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:"openrouter",model:process.env.OPENROUTER_MODEL||"openai/gpt-5.5",messages:[
    {role:"system",content:"Eres LINK Intelligence. Responde sólo usando el contexto del cliente. Si falta información dilo. Cita fuentes por título cuando uses contenido documental. Sé operativo y orientado a ventas."},
    {role:"user",content:`CONTEXTO:${context}\\n\\nPREGUNTA:${a.question}`}
   ])});
   const data=await r.json();
   return result({answer:data.content||data.error||"Sin respuesta",meta:data.meta||null});
  }
  default: throw new Error("Unknown tool");
 }
}
export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Use POST for MCP messages"});
 if(!auth(req)) return res.status(401).json({jsonrpc:"2.0",error:{code:-32001,message:"Unauthorized"}});
 try{
  const b=req.body||{};
  if(b.method==="initialize") return res.status(200).json({jsonrpc:"2.0",id:b.id,result:{protocolVersion:"2024-11-05",capabilities:{tools:{listChanged:false}},serverInfo:{name:"LINK CONTROL Sales OS",version:"1.0.0"}}});
  if(b.method==="tools/list") return res.status(200).json({jsonrpc:"2.0",id:b.id,result:{tools:TOOLS}});
  if(b.method==="tools/call"){const r=await callTool(b.params?.name,b.params?.arguments||{});return res.status(200).json({jsonrpc:"2.0",id:b.id,result:r});}
  if(b.method==="ping") return res.status(200).json({jsonrpc:"2.0",id:b.id,result:{}});
  return res.status(200).json({jsonrpc:"2.0",id:b.id,error:{code:-32601,message:"Method not found"}});
 }catch(e){return res.status(500).json({jsonrpc:"2.0",id:req.body?.id||null,error:{code:-32000,message:e.message||"MCP error"}});}
}
