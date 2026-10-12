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

// Discord presence — live via Lanyard
const discordId="1019613116209823874";
const avatar=$("#discord-avatar");
const statusDot=$("#discord-status-dot");
const statusText=$("#discord-status-text");
const discordName=$("#discord-name");
const statusLabels={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"};

function setDiscordState(state){
  const safe=statusLabels[state]?state:"offline";
  if(statusText) statusText.textContent=statusLabels[safe];
  if(statusDot){
    statusDot.className="";
    statusDot.classList.add(safe);
  }
}

function setDiscordAvatar(user){
  if(!avatar)return;
  if(user?.avatar){
    const ext=user.avatar.startsWith("a_")?"gif":"webp";
    avatar.src="https://cdn.discordapp.com/avatars/"+discordId+"/"+user.avatar+"."+ext+"?size=256";
  }else if(user?.discriminator && user.discriminator!=="0"){
    const index=Number(user.discriminator)%5;
    avatar.src="https://cdn.discordapp.com/embed/avatars/"+index+".png";
  }
}

async function updateDiscordPresence(){
  if(document.hidden)return;
  try{
    const res=await fetch("https://api.lanyard.rest/v1/users/"+discordId+"?t="+Date.now(),{
      cache:"no-store",
      headers:{accept:"application/json"}
    });
    if(!res.ok)throw new Error("presence");
    const payload=await res.json();
    if(!payload?.success||!payload?.data)throw new Error("presence");
    const d=payload.data;
    const user=d.discord_user||{};
    if(discordName) discordName.textContent="@caesrov";
    setDiscordAvatar(user);
    setDiscordState(d.discord_status||"offline");
  }catch{
    if(discordName) discordName.textContent="@caesrov";
    if(statusText) statusText.textContent="Status unavailable";
    if(statusDot){
      statusDot.className="";
      statusDot.classList.add("offline");
    }
  }
}

updateDiscordPresence();
setInterval(updateDiscordPresence,15000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateDiscordPresence()});

// Form success
if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast show";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  setTimeout(()=>note.remove(),4200);
}


// Active communities: keep the page compact until requested.
const viewAllCommunities=$("#communities-view-all");
const compactCommunities=$(".compact-current");
viewAllCommunities?.addEventListener("click",()=>{
  const expanded=compactCommunities?.classList.toggle("is-expanded");
  viewAllCommunities.setAttribute("aria-expanded",String(Boolean(expanded)));
  viewAllCommunities.innerHTML=expanded?'Show less <span>↑</span>':'View all communities <span>↓</span>';
});
