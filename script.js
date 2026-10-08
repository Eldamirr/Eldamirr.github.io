const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];

$("#year").textContent=new Date().getFullYear();

const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro=$("#page-intro");
const introCount=$("#intro-count");
const introBar=$("#intro-bar");
const introStatus=$(".intro-status span");

function finishIntro(){
  document.body.classList.add("ready");
  intro?.classList.add("done");
}

if(reduced){
  finishIntro();
}else{
  let p=0;
  const stages=[[0,"INITIALIZING"],[28,"LOADING ASSETS"],[58,"BUILDING INTERFACE"],[82,"FINALIZING"]];
  const timer=setInterval(()=>{
    p=Math.min(100,p+Math.max(2,Math.round((100-p)*.11)));
    if(introCount) introCount.textContent=p+"%";
    if(introBar) introBar.style.width=p+"%";
    let label=stages[0][1];
    for(const [n,t] of stages) if(p>=n) label=t;
    if(introStatus) introStatus.textContent=label;
    if(p>=100){
      clearInterval(timer);
      if(introStatus) introStatus.textContent="READY";
      setTimeout(finishIntro,180);
    }
  },38);
  addEventListener("load",()=>{if(p<84)p=84},{once:true});
  setTimeout(()=>{p=100},1250);
}

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.1,rootMargin:"0px 0px -6% 0px"});
$$(".reveal").forEach(el=>revealObserver.observe(el));

function animateCounter(el){
  if(el.dataset.done)return;
  el.dataset.done="1";
  const target=Number(el.dataset.count||0);
  const suffix=el.dataset.suffix||"";
  if(reduced){el.textContent=target+suffix;return}
  const start=performance.now();
  const duration=1200;
  const tick=now=>{
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    const value=Math.round(target*eased)+suffix;
    if(el.textContent!==value)el.textContent=value;
    if(t<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const countObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      animateCounter(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
},{threshold:.55});
$$("[data-count]").forEach(el=>countObserver.observe(el));

const progress=$("#scroll-progress-bar");
let scrollTick=false;
function updateScroll(){
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress) progress.style.width=(max>0?scrollY/max*100:0)+"%";
  scrollTick=false;
}
addEventListener("scroll",()=>{
  if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll)}
},{passive:true});
updateScroll();

const toggle=$(".menu-toggle");
const mobileMenu=$("#mobile-menu");
function setMenu(open){
  toggle?.classList.toggle("active",open);
  toggle?.setAttribute("aria-expanded",String(open));
  mobileMenu?.classList.toggle("open",open);
  mobileMenu?.setAttribute("aria-hidden",String(!open));
  document.body.classList.toggle("menu-open",open);
}
toggle?.addEventListener("click",()=>setMenu(!toggle.classList.contains("active")));
$$(".mobile-menu a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("resize",()=>{if(innerWidth>900)setMenu(false)},{passive:true});

$(".current-grid .server-card").forEach(card=>card.setAttribute("draggable","false"));

const discordId="1019613116209823874";
const avatar=$("#discord-avatar");
const discordName=$("#discord-name");
const statusDot=$("#discord-status-dot");
const statusText=$("#discord-status-text");
const statusLabels={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"};

async function updateDiscordPresence(){
  if(document.hidden)return;
  try{
    const res=await fetch("https://api.lanyard.rest/v1/users/"+discordId,{cache:"no-store"});
    if(!res.ok)throw new Error("presence");
    const json=await res.json();
    const d=json.data;
    const user=d.discord_user||{};
    if(discordName) discordName.textContent=user.username?"@"+user.username:"@caesrov";
    if(avatar && user.avatar){
      avatar.src=`https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.webp?size=128`;
    }
    const state=d.discord_status||"offline";
    if(statusText) statusText.textContent=statusLabels[state]||"Offline";
    if(statusDot) statusDot.className=state;
  }catch{
    if(statusText) statusText.textContent="Join Lanyard to enable live status";
    if(statusDot) statusDot.className="offline";
  }
}
updateDiscordPresence();
setInterval(updateDiscordPresence,60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateDiscordPresence()});

if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  requestAnimationFrame(()=>note.classList.add("show"));
  setTimeout(()=>note.classList.remove("show"),4200);
  setTimeout(()=>note.remove(),4800);
}
