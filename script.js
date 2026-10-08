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
  const stages=[
    [0,"INITIALIZING"],
    [28,"LOADING ASSETS"],
    [58,"BUILDING INTERFACE"],
    [82,"FINALIZING"]
  ];
  const timer=setInterval(()=>{
    p=Math.min(100,p+Math.max(2,Math.round((100-p)*.11)));
    introCount.textContent=p+"%";
    introBar.style.width=p+"%";
    let label=stages[0][1];
    for(const [n,t] of stages) if(p>=n) label=t;
    introStatus.textContent=label;
    if(p>=100){
      clearInterval(timer);
      introStatus.textContent="READY";
      setTimeout(finishIntro,180);
    }
  },38);
  addEventListener("load",()=>{if(p<84)p=84},{once:true});
  setTimeout(()=>{p=100},1250);
}

let lenis=null;
if(!reduced && window.Lenis){
  lenis=new Lenis({
    duration:.88,
    wheelMultiplier:.9,
    touchMultiplier:1,
    smoothWheel:true
  });
  const raf=time=>{
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
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
    const current=Math.round(target*eased);
    if(el.textContent!==current+suffix) el.textContent=current+suffix;
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
  progress.style.width=(max>0?scrollY/max*100:0)+"%";
  scrollTick=false;
}
addEventListener("scroll",()=>{
  if(!scrollTick){
    scrollTick=true;
    requestAnimationFrame(updateScroll);
  }
},{passive:true});
updateScroll();

const slider=$("#card-slider");
const sliderBar=$("#slider-progress-bar");
const prev=$(".slider-prev");
const next=$(".slider-next");

function updateSlider(){
  if(!slider||!sliderBar)return;
  const max=slider.scrollWidth-slider.clientWidth;
  const ratio=max>0?slider.scrollLeft/max:0;
  const visible=Math.min(1,slider.clientWidth/slider.scrollWidth);
  sliderBar.style.width=(visible*100+ratio*(100-visible*100))+"%";
}

function cardStep(){
  const card=$(".server-card",slider);
  return card?card.getBoundingClientRect().width+14:420;
}
prev?.addEventListener("click",()=>slider.scrollBy({left:-cardStep(),behavior:"smooth"}));
next?.addEventListener("click",()=>slider.scrollBy({left:cardStep(),behavior:"smooth"}));
slider?.addEventListener("scroll",()=>requestAnimationFrame(updateSlider),{passive:true});
addEventListener("resize",updateSlider,{passive:true});
updateSlider();

if(slider){
  let down=false,startX=0,startScroll=0,moved=false;
  slider.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"){
      down=true;moved=false;startX=e.clientX;startScroll=slider.scrollLeft;
      slider.classList.add("dragging");
      slider.setPointerCapture(e.pointerId);
    }
  });
  slider.addEventListener("pointermove",e=>{
    if(!down)return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>4)moved=true;
    slider.scrollLeft=startScroll-dx;
  });
  const endDrag=()=>{
    down=false;
    slider.classList.remove("dragging");
  };
  slider.addEventListener("pointerup",endDrag);
  slider.addEventListener("pointercancel",endDrag);
  slider.addEventListener("click",e=>{
    if(moved){e.preventDefault();e.stopPropagation();moved=false}
  },true);
}

const toggle=$(".menu-toggle");
const mobileMenu=$("#mobile-menu");
function setMenu(open){
  toggle?.classList.toggle("active",open);
  toggle?.setAttribute("aria-expanded",String(open));
  mobileMenu?.classList.toggle("open",open);
  mobileMenu?.setAttribute("aria-hidden",String(!open));
  document.body.classList.toggle("menu-open",open);
  if(lenis) open?lenis.stop():lenis.start();
}
toggle?.addEventListener("click",()=>setMenu(!toggle.classList.contains("active")));
$$(".mobile-menu a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("resize",()=>{if(innerWidth>900)setMenu(false)},{passive:true});

if(!reduced && matchMedia("(pointer:fine)").matches){
  addEventListener("pointermove",e=>{
    document.body.style.setProperty("--pointer-x",e.clientX+"px");
    document.body.style.setProperty("--pointer-y",e.clientY+"px");
  },{passive:true});

  const heroCard=$(".big-project");
  heroCard?.addEventListener("pointermove",e=>{
    const r=heroCard.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    heroCard.style.transform=`perspective(900px) rotateX(${-y*2.4}deg) rotateY(${x*3}deg) translateY(-3px)`;
  });
  heroCard?.addEventListener("pointerleave",()=>heroCard.style.transform="");
}

if(new URLSearchParams(location.search).get("sent")==="1"){
  const note=document.createElement("div");
  note.className="sent-toast";
  note.textContent="Request sent successfully.";
  document.body.appendChild(note);
  requestAnimationFrame(()=>note.classList.add("show"));
  setTimeout(()=>note.classList.remove("show"),4200);
  setTimeout(()=>note.remove(),4800);
}
