const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];

const year=$("#year");
if(year) year.textContent=new Date().getFullYear();

const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scroll reveal: enable hidden states only after the observer is successfully created.
if(!reduced && "IntersectionObserver" in window){
  try{
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:.10,rootMargin:"0px 0px -7% 0px"});

    $$(".reveal").forEach(el=>revealObserver.observe(el));
    document.documentElement.classList.add("motion-ready");

    requestAnimationFrame(()=>{
      $$(".hero-reveal").forEach(el=>el.classList.add("hero-visible"));
      $(".discord-presence")?.classList.add("visible");
    });
  }catch(e){
    document.documentElement.classList.remove("motion-ready");
  }
}

// Counters
function animateCounter(el){
  if(el.dataset.done)return;
  el.dataset.done="1";
  const target=Number(el.dataset.count||0);
  const suffix=el.dataset.suffix||"";
  if(reduced){el.textContent=target+suffix;return}
  const start=performance.now();
  const duration=1050;
  const frame=now=>{
    const t=Math.min(1,(now-start)/duration);
    const e=1-Math.pow(1-t,3);
    el.textContent=Math.round(target*e)+suffix;
    if(t<1)requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
if("IntersectionObserver" in window){
  const counterObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },{threshold:.45});
  $$("[data-count]").forEach(el=>counterObserver.observe(el));
}else{
  $$("[data-count]").forEach(animateCounter);
}

// Scroll progress
const progress=$("#scroll-progress-bar");
let ticking=false;
function updateProgress(){
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress) progress.style.width=(max>0?scrollY/max*100:0)+"%";
  ticking=false;
}
addEventListener("scroll",()=>{
  if(!ticking){
    ticking=true;
    requestAnimationFrame(updateProgress);
  }
},{passive:true});
updateProgress();

// Mobile menu
const toggle=$(".menu-toggle");
const menu=$("#mobile-menu");
function setMenu(open){
  toggle?.classList.toggle("active",open);
  toggle?.setAttribute("aria-expanded",String(open));
  menu?.classList.toggle("open",open);
  menu?.setAttribute("aria-hidden",String(!open));
  document.body.classList.toggle("menu-open",open);
}
toggle?.addEventListener("click",()=>setMenu(!toggle.classList.contains("active")));
$$(".mobile-menu a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
$$(".current-grid .server-card").forEach(card=>card.setAttribute("draggable","false"));

// Discord presence
const discordId="1019613116209823874";
const avatar=$("#discord-avatar");
const statusDot=$("#discord-status-dot");
const statusText=$("#discord-status-text");
const discordName=$("#discord-name");
const statusLabels={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"};

async function updateDiscordPresence(){
  if(document.hidden)return;
  try{
    const res=await fetch("https://api.lanyard.rest/v1/users/"+discordId,{cache:"no-store"});
    if(!res.ok)throw new Error("presence");
    const payload=await res.json();
    if(!payload?.success||!payload?.data)throw new Error("presence");
    const d=payload.data;
    const user=d.discord_user||{};
    if(discordName)discordName.textContent="@caesrov";
    if(avatar&&user.avatar){
      const ext=user.avatar.startsWith("a_")?"gif":"webp";
      avatar.src="https://cdn.discordapp.com/avatars/"+discordId+"/"+user.avatar+"."+ext+"?size=128";
    }
    const state=d.discord_status||"offline";
    if(statusText)statusText.textContent=statusLabels[state]||"Offline";
    if(statusDot)statusDot.className=state;
  }catch{
    if(statusText)statusText.textContent="Status unavailable";
    if(statusDot)statusDot.className="offline";
  }
}
updateDiscordPresence();
setInterval(updateDiscordPresence,30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateDiscordPresence()});

// Form success
if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast show";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  setTimeout(()=>note.remove(),4200);
}
