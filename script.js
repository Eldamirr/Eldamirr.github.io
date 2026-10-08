const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];

document.getElementById("year").textContent=new Date().getFullYear();

const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro=$("#page-intro");
const introCount=$("#intro-count");
const introBar=$("#intro-bar");

function finishIntro(){
  document.body.classList.add("ready");
  if(intro) intro.classList.add("done");
}

if(reduced){
  finishIntro();
}else{
  let p=0;
  const timer=setInterval(()=>{
    p=Math.min(100,p+Math.max(3,Math.round((100-p)*.12)));
    if(introCount) introCount.textContent=p+"%";
    if(introBar) introBar.style.width=p+"%";
    if(p>=100){
      clearInterval(timer);
      setTimeout(finishIntro,180);
    }
  },42);
  window.addEventListener("load",()=>{
    if(p<82)p=82;
  },{once:true});
  setTimeout(()=>{p=100},1100);
}

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.11,rootMargin:"0px 0px -5% 0px"});

$$(".reveal").forEach(el=>revealObserver.observe(el));

function animateCounter(el){
  if(el.dataset.done)return;
  el.dataset.done="1";
  const target=Number(el.dataset.count||0);
  const suffix=el.dataset.suffix||"";
  if(reduced){el.textContent=target+suffix;return}
  const start=performance.now();
  const duration=1150;
  const step=now=>{
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    el.textContent=Math.round(target*eased)+suffix;
    if(t<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  const ratio=max>0?scrollY/max:0;
  if(progress)progress.style.width=(ratio*100)+"%";
  scrollTick=false;
}
addEventListener("scroll",()=>{
  if(!scrollTick){
    scrollTick=true;
    requestAnimationFrame(updateScroll);
  }
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

if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  requestAnimationFrame(()=>note.classList.add("show"));
  setTimeout(()=>note.classList.remove("show"),4200);
  setTimeout(()=>note.remove(),4800);
}
