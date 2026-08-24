
const DEFAULT_TIMEZONE = "America/Santiago";

function send(res,status,body){res.status(status).json(body)}

async function getAccessToken(){
  const {GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_REFRESH_TOKEN}=process.env;
  if(!GOOGLE_CLIENT_ID||!GOOGLE_CLIENT_SECRET||!GOOGLE_REFRESH_TOKEN)throw new Error("Google Calendar OAuth environment variables are incomplete");
  const body=new URLSearchParams({
    client_id:GOOGLE_CLIENT_ID,
    client_secret:GOOGLE_CLIENT_SECRET,
    refresh_token:GOOGLE_REFRESH_TOKEN,
    grant_type:"refresh_token"
  });
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  const data=await r.json();
  if(!r.ok)throw new Error(data.error_description||data.error||"Unable to refresh Google access token");
  return data.access_token;
}

async function googleFetch(url,options={}){
  const token=await getAccessToken();
  const r=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(options.headers||{})}});
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!r.ok)throw new Error(data.error?.message||`Google Calendar HTTP ${r.status}`);
  return data;
}

function calendarUrl(calendarId,path=""){
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId||"primary")}${path}`;
}
function googleEventBody(event){
  const timezone=event.timezone||DEFAULT_TIMEZONE;
  return {
    summary:event.title,
    description:event.description||"",
    start:{dateTime:event.start,timeZone:timezone},
    end:{dateTime:event.end,timeZone:timezone},
    attendees:(event.attendees||[]).filter(Boolean).map(email=>({email})),
    reminders:event.reminders||{useDefault:false,overrides:[{method:"email",minutes:30},{method:"popup",minutes:10}]}
  };
}

export default async function handler(req,res){
  if(req.method==="GET"){
    return send(res,200,{
      ok:true,
      gateway:"LINK Calendar Gateway",
      configured:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_REFRESH_TOKEN),
      defaultCalendar:process.env.GOOGLE_CALENDAR_ID||"primary",
      notifyEmail:process.env.CALENDAR_NOTIFY_EMAIL||"linkdigitalatacama@gmail.com"
    });
  }
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  try{
    const action=String(req.body?.action||"");
    const calendarId=String(req.body?.calendarId||process.env.GOOGLE_CALENDAR_ID||"primary");

    if(action==="create"){
      const body=googleEventBody(req.body.event||{});
      const data=await googleFetch(calendarUrl(calendarId,"/events?sendUpdates=all"),{method:"POST",body:JSON.stringify(body)});
      return send(res,200,{ok:true,event:{id:data.id,htmlLink:data.htmlLink,status:data.status}});
    }
    if(action==="update"){
      const eventId=String(req.body?.eventId||"");if(!eventId)throw new Error("eventId required");
      const body=googleEventBody(req.body.event||{});
      const data=await googleFetch(calendarUrl(calendarId,`/events/${encodeURIComponent(eventId)}?sendUpdates=all`),{method:"PATCH",body:JSON.stringify(body)});
      return send(res,200,{ok:true,event:{id:data.id,htmlLink:data.htmlLink,status:data.status}});
    }
    if(action==="delete"){
      const eventId=String(req.body?.eventId||"");if(!eventId)throw new Error("eventId required");
      await googleFetch(calendarUrl(calendarId,`/events/${encodeURIComponent(eventId)}?sendUpdates=all`),{method:"DELETE"});
      return send(res,200,{ok:true});
    }
    if(action==="list"){
      const timeMin=encodeURIComponent(req.body?.timeMin||new Date().toISOString());
      const timeMax=req.body?.timeMax?`&timeMax=${encodeURIComponent(req.body.timeMax)}`:"";
      const data=await googleFetch(calendarUrl(calendarId,`/events?singleEvents=true&orderBy=startTime&timeMin=${timeMin}${timeMax}`));
      return send(res,200,{ok:true,events:(data.items||[]).map(e=>({id:e.id,title:e.summary,start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,htmlLink:e.htmlLink,status:e.status}))});
    }
    return send(res,400,{error:"Unsupported action"});
  }catch(error){
    return send(res,500,{ok:false,error:error?.message||"Calendar gateway failed"});
  }
}
