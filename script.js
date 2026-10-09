const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];

const year=$("#year");
if(year) year.textContent=new Date().getFullYear();

const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

// Lightweight scroll-in motion. Elements remain visible if JS fails.
if(!reduced && "IntersectionObserver" in window){
  const seen=new WeakSet();
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting && !seen.has(entry.target)){
        seen.add(entry.target);
        entry.target.animate(
          [
            {opacity:.35,transform:"translateY(18px)"},
            {opacity:1,transform:"translateY(0)"}
          ],
          {duration:620,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}
        );
        io.unobserve(entry.target);
      }
    });
  },{threshold:.08,rootMargin:"0px 0px -5% 0px"});
  $$(".reveal").forEach(el=>io.observe(el));

  $$(".hero-reveal,.discord-presence,.big-project").forEach((el,index)=>{
    el.animate(
      [
        {opacity:.25,transform:"translateY(20px)"},
        {opacity:1,transform:"translateY(0)"}
      ],
      {duration:700,delay:80+index*70,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}
    );
  });
}

// Counters
function animateCounter(el){
  if(el.dataset.done)return;
  el.dataset.done="1";
  const target=Number(el.dataset.count||0);
  const suffix=el.dataset.suffix||"";
  if(reduced){el.textContent=target+suffix;return}
  const start=performance.now();
  const duration=1000;
  const frame=now=>{
    const t=Math.min(1,(now-start)/duration);
    const e=1-Math.pow(1-t,3);
    el.textContent=Math.round(target*e)+suffix;
    if(t<1)requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
if("IntersectionObserver" in window){
  const cio=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        animateCounter(entry.target);
        cio.unobserve(entry.target);
      }
    });
  },{threshold:.4});
  $$("[data-count]").forEach(el=>cio.observe(el));
}else{
  $$("[data-count]").forEach(animateCounter);
}

// Scroll progress
const progress=$("#scroll-progress-bar");
let ticking=false;
function paintProgress(){
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress) progress.style.width=(max>0?scrollY/max*100:0)+"%";
  ticking=false;
}
addEventListener("scroll",()=>{
  if(!ticking){ticking=true;requestAnimationFrame(paintProgress)}
},{passive:true});
paintProgress();

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
const labels={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"};

async function updatePresence(){
  if(document.hidden)return;
  try{
    const res=await fetch("https://api.lanyard.rest/v1/users/"+discordId,{cache:"no-store"});
    if(!res.ok)throw new Error();
    const payload=await res.json();
    if(!payload?.success || !payload?.data)throw new Error();
    const d=payload.data;
    const u=d.discord_user||{};
    if(discordName)discordName.textContent="@caesrov";
    if(avatar && u.avatar){
      const ext=u.avatar.startsWith("a_")?"gif":"webp";
      avatar.src="https://cdn.discordapp.com/avatars/"+discordId+"/"+u.avatar+"."+ext+"?size=128";
    }
    const state=d.discord_status||"offline";
    if(statusText)statusText.textContent=labels[state]||"Offline";
    if(statusDot)statusDot.className=state;
  }catch{
    if(discordName)discordName.textContent="@caesrov";
    if(statusText)statusText.textContent="Status unavailable";
    if(statusDot)statusDot.className="offline";
  }
}
updatePresence();
setInterval(updatePresence,30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)updatePresence()});

// Form success
if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast show";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  setTimeout(()=>note.remove(),4200);
}
