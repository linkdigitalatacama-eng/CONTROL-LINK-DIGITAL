/* LINK MISSION · integración segura con LINK CONTROL Sales OS
   No reemplaza el Sales OS: añade accesos al menú y abre la experiencia de misión.
*/
(function(){
  'use strict';
  const MISSION_URL='/mission.html';
  function addMissionNav(){
    const nav=document.getElementById('nav');
    if(!nav || nav.querySelector('[data-link-mission]')) return;
    const btn=document.createElement('button');
    btn.setAttribute('data-link-mission','true');
    btn.innerHTML='<i>🎯</i><span>Misión</span>';
    btn.title='LINK Misión · avanzar las 6 etapas';
    btn.addEventListener('click',()=>{ window.location.href=MISSION_URL; });
    nav.appendChild(btn);
  }
  function addGatewayNav(){
    const nav=document.getElementById('nav');
    if(!nav || nav.querySelector('[data-link-gateway]')) return;
    const btn=document.createElement('button');
    btn.setAttribute('data-link-gateway','true');
    btn.innerHTML='<i>⌁</i><span>Gateway</span>';
    btn.title='LINK Gateway · conectar apps';
    btn.addEventListener('click',()=>{ window.location.href='/gateway.html'; });
    nav.appendChild(btn);
  }
  function addMissionHero(){
    const view=document.getElementById('view');
    if(!view || view.querySelector('[data-link-mission-card]')) return;
    const hero=view.querySelector('.hero');
    if(!hero) return;
    const card=document.createElement('div');
    card.setAttribute('data-link-mission-card','true');
    card.style.cssText='margin-top:16px;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 2px 10px rgba(0,0,0,.02)';
    card.innerHTML='<div><p class="eyebrow" style="margin-bottom:4px">LINK MISSION · 6 ETAPAS</p><strong style="font-size:15px">Convierte una oportunidad en una relación.</strong><div class="muted" style="font-size:12px;margin-top:4px">Marketing → Ventas → Cierre → Onboarding → Entrega → Posventa</div></div><button class="btn primary" type="button">Abrir misión →</button>';
    card.querySelector('button').addEventListener('click',()=>{window.location.href=MISSION_URL;});
    hero.appendChild(card);
  }
  function run(){ addMissionNav(); addGatewayNav(); addMissionHero(); }
  document.addEventListener('DOMContentLoaded',run);
  const observer=new MutationObserver(run);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(run,250); setTimeout(run,1000);
})();
