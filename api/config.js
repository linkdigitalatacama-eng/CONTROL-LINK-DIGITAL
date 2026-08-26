export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  const supabaseUrl=process.env.SUPABASE_URL||"";
  const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||"";

  if(req.method==="POST"){
    try{
      const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});
      if(body.action==='mission_event'){
        if(!supabaseUrl||!supabaseKey)return res.status(500).json({error:"Supabase no está configurado en Vercel"});
        const sessionId=String(body.session_id||'').slice(0,100);
        const event=String(body.event||'').slice(0,80);
        const stage=String(body.stage||'').slice(0,80);
        if(!sessionId||!event)return res.status(400).json({error:"Faltan datos de misión"});
        const payload=body.payload&&typeof body.payload==='object'?body.payload:{};
        const allowed={session_id:sessionId,event,stage,prospect_id:body.prospect_id?String(body.prospect_id).slice(0,120):null,client_id:body.client_id?String(body.client_id).slice(0,120):null,payload};
        const headers={apikey:supabaseKey,'Content-Type':'application/json',Prefer:'return=representation'};
        if(!supabaseKey.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${supabaseKey}`;
        const r=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/mission_events`,{method:'POST',headers,body:JSON.stringify(allowed)});
        const text=await r.text();
        if(!r.ok)return res.status(502).json({error:'Supabase rechazó el evento de misión',detail:text.slice(0,500),status:r.status});
        const rows=JSON.parse(text);return res.status(201).json({ok:true,event_id:rows?.[0]?.id||null});
      }
      if(body.website_url_hidden)return res.status(400).json({error:"Invalid submission"});
      const required=['name','business_name','email','industry','business_stage','offer','ideal_customer','website','website_goal','website_type','timeline','consent'];
      for(const key of required){
        if(key==='consent'?body[key]!==true:!String(body[key]||'').trim())return res.status(400).json({error:`Falta completar: ${key}`});
      }
      if(!supabaseUrl||!supabaseKey)return res.status(500).json({error:"Supabase no está configurado en Vercel"});
      const allowed={
        source:String(body.source||'website-funnel').slice(0,80),name:String(body.name).slice(0,160),email:String(body.email).slice(0,240),phone:String(body.phone||'').slice(0,80),
        business_name:String(body.business_name).slice(0,180),city:String(body.city||'').slice(0,120),industry:String(body.industry).slice(0,160),website:String(body.website||'').slice(0,500),instagram:String(body.instagram||'').slice(0,240),whatsapp:String(body.whatsapp||'').slice(0,80),
        business_stage:String(body.business_stage).slice(0,100),offer:String(body.offer).slice(0,4000),ideal_customer:String(body.ideal_customer).slice(0,4000),
        sales_channels:Array.isArray(body.sales_channels)?body.sales_channels.slice(0,20).map(String):[],monthly_sales_band:String(body.monthly_sales_band||'').slice(0,100),average_ticket_band:String(body.average_ticket_band||'').slice(0,100),current_tools:Array.isArray(body.current_tools)?body.current_tools.slice(0,20).map(String):[],
        website_goal:String(body.website_goal).slice(0,180),website_type:String(body.website_type).slice(0,120),website_pages:Array.isArray(body.website_pages)?body.website_pages.slice(0,30).map(String):[],website_features:Array.isArray(body.website_features)?body.website_features.slice(0,30).map(String):[],
        content_status:String(body.content_status||'').slice(0,100),brand_status:String(body.brand_status||'').slice(0,100),main_problem:String(body.main_problem||'').slice(0,4000),desired_result:String(body.desired_result||'').slice(0,4000),timeline:String(body.timeline).slice(0,100),budget_band:String(body.budget_band||'').slice(0,100),notes:String(body.notes||'').slice(0,4000),answers:body,
        metadata:{user_agent:req.headers['user-agent']||'',referer:req.headers.referer||'',received_via:'LINK intake'}
      };
      const headers={apikey:supabaseKey,'Content-Type':'application/json',Prefer:'return=representation'};
      if(!supabaseKey.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${supabaseKey}`;
      const r=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/client_intakes`,{method:'POST',headers,body:JSON.stringify(allowed)});
      const text=await r.text();
      if(!r.ok)return res.status(502).json({error:'Supabase rechazó el registro',detail:text.slice(0,500),status:r.status});
      const rows=JSON.parse(text);return res.status(201).json({ok:true,intake_id:rows?.[0]?.id||null});
    }catch(error){return res.status(500).json({error:error?.message||'Error interno'});}
  }

  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  res.status(200).json({
    ok:true,app:"LINK CONTROL · Sales OS",supabaseUrl,
    supabasePublishableKey:supabaseKey,
    ai:{provider:process.env.DEFAULT_AI_PROVIDER||"openrouter",model:process.env.OPENROUTER_MODEL||"openai/gpt-5.5",configured:Boolean(process.env.OPENROUTER_API_KEY),gateway:"/api/ai-gateway"},
    calendar:{gateway:"/api/calendar-gateway"},mcp:{endpoint:"/api/mcp",sse:"/api/sse"}
  });
}
