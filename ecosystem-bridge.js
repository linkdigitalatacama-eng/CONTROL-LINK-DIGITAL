(() => {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cfg = { client:null, user:null };
  const toast = (msg) => { const t=document.getElementById('toast'); if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);} };
  async function boot(){
    try {
      const r=await fetch('/api/config',{cache:'no-store'}); const c=await r.json();
      if(c.supabaseUrl&&c.supabasePublishableKey){
        const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        cfg.client=mod.createClient(c.supabaseUrl,c.supabasePublishableKey);
        const {data}=await cfg.client.auth.getSession(); cfg.user=data.session?.user||null;
      }
    } catch {}
    injectNav(); injectEcosystemButton(); wireGlobalClicks();
  }
  function injectNav(){
    const nav=document.getElementById('nav'); if(!nav||nav.dataset.ecosystem==='1') return;
    nav.dataset.ecosystem='1';
    const add=(label,icon,handler,cls='')=>{const b=document.createElement('button');b.className=cls;b.innerHTML=`<i>${icon}</i><span>${label}</span>`;b.addEventListener('click',handler);nav.appendChild(b);};
    add('✦ Primer contacto','＋',()=>location.href='/intake.html?source=sales-os');
    add('🎯 Misión','◎',()=>location.href='/mission.html');
    add('⌁ Gateway','↗',()=>location.href='/gateway.html','gateway-nav');
    add('Ecosistema','◈',openEcosystem);
    const s=document.createElement('style');s.textContent='.nav .gateway-nav{background:var(--accent);color:var(--accentText)}.nav .gateway-nav i{color:inherit}';document.head.appendChild(s);
  }
  function injectEcosystemButton(){
    if(document.getElementById('ecosystemFab')) return;
    const b=document.createElement('button');b.id='ecosystemFab';b.className='btn small';b.textContent='◈ Ecosistema';b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:9998';b.onclick=openEcosystem;document.body.appendChild(b);
  }
  async function count(t){if(!cfg.client||!cfg.user)return 0;try{const {count}=await cfg.client.from(t).select('*',{count:'exact',head:true});return count||0}catch{return 0}}
  async function openEcosystem(){
    const m=document.getElementById('modal'),b=document.getElementById('modalBackdrop');if(!m||!b)return;
    m.innerHTML=`<div class="modal-head"><div><p class="eyebrow">LINK ECOSYSTEM</p><h2>Todo conectado.</h2><p class="muted">Estado real de Sales OS, Supabase, Gateway, Misiones e IA.</p></div><button class="close" onclick="closeModal()">×</button></div><div id="ecosystemLive" class="grid3"><div class="empty">Leyendo Supabase…</div></div><div style="height:10px"></div><section class="panel" style="background:var(--card2)"><p class="eyebrow">IA GATEWAY</p><div id="aiGatewayStatus" class="muted">Comprobando OpenRouter…</div><div class="actions" style="margin-top:10px"><button class="btn primary" onclick="location.href='/api/ai-gateway'">Estado API</button><button class="btn" onclick="location.href='/gateway.html'">Abrir Gateway</button></div></section>`;
    m.classList.add('open');b.classList.add('open');
    const [prospects,opportunities,clients,tasks,events,gateway,missions,intakes]=await Promise.all(['prospects','opportunities','clients','tasks','calendar_events','link_gateway_connections','client_missions','client_intakes'].map(count));
    document.getElementById('ecosystemLive').innerHTML=[['Primeros contactos',intakes],['Prospectos',prospects],['Oportunidades',opportunities],['Clientes',clients],['Acciones',tasks],['Calendario',events],['Gateway',gateway],['Misiones',missions]].map(([l,v])=>`<section class="panel metric"><p class="eyebrow">${l}</p><strong>${v}</strong><span>${cfg.user?'Supabase':'inicia sesión para datos'}</span></section>`).join('');
    try{const r=await fetch('/api/ai-gateway',{cache:'no-store'}),d=await r.json(),p=d.providers?.openrouter;document.getElementById('aiGatewayStatus').innerHTML=p?.configured?`<span class="badge">✓ OPENROUTER CONFIGURADO</span> · ${esc(p.defaultModel)}`:`<span class="badge">⚠ OPENROUTER SIN API KEY</span> · falta OPENROUTER_API_KEY en Vercel`;}catch{document.getElementById('aiGatewayStatus').textContent='No se pudo consultar el AI Gateway';}
  }
  function wireGlobalClicks(){
    document.addEventListener('click',async e=>{const el=e.target.closest('button');if(!el||el.dataset.ecoLogged==='1')return;el.dataset.ecoLogged='1';if(!cfg.client||!cfg.user)return;const label=(el.innerText||el.textContent||'').trim().slice(0,120);if(!label)return;try{await cfg.client.from('app_events').insert({id:'evt_'+crypto.randomUUID(),event_type:'ui.click',module:'sales_os',entity_type:'button',payload:{label,page:document.getElementById('crumb')?.textContent||''}})}catch{}} ,true);
  }
  window.addEventListener('load',()=>setTimeout(boot,300));
})();
