export default function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  res.setHeader("Cache-Control","no-store");
  res.status(200).json({
    ok:true,
    app:"LINK CONTROL · Sales OS",
    supabaseUrl:process.env.SUPABASE_URL||"",
    supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||"",
    ai:{
      provider:process.env.DEFAULT_AI_PROVIDER||"openrouter",
      model:process.env.OPENROUTER_MODEL||"openai/gpt-5.5",
      configured:Boolean(process.env.OPENROUTER_API_KEY),
      gateway:"/api/ai-gateway"
    },
    calendar:{gateway:"/api/calendar-gateway"},
    mcp:{endpoint:"/api/mcp",sse:"/api/sse"}
  });
}
