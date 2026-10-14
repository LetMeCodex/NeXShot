/* NexShot site behaviour: GSAP + ScrollTrigger, Lenis, SplitType, Motion */
const {CONTACTS,COMPETITIONS,SCORES,NRAI}=window;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fmt=(iso,o={day:"numeric",month:"short",year:"numeric"})=>new Date(iso+"T00:00:00").toLocaleDateString("en-IN",o);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
const G=window.gsap, ST=window.ScrollTrigger, M=window.Motion, hasG=!!(G&&ST)&&!reduce;
if(hasG)G.registerPlugin(ST);
const spring=(el,props,o={})=>{if(M&&M.animate){try{return M.animate(el,props,{type:"spring",stiffness:o.k||420,damping:o.d||28,mass:o.m||1})}catch(e){}}Object.assign(el.style,{})};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2200)}

/* ===== Render data ===== */
(function(){
  // tickets
  $("#tickets").innerHTML=COMPETITIONS.map(c=>{let k=0;
    const rows=Array.from({length:c.relays},(_,r)=>`<div class="lane-row"><em>R${r+1}</em>${Array.from({length:c.lanes},()=>`<i style="--i:${k++}"></i>`).join("")}</div>`).join("");
    const done=c.status==="completed";
    return `<article class="ticket glass${c.feature?" feature":""}${done?" done-t":""}">
      <div class="t-top">${done?'<span class="chip done">Completed</span>':'<span class="chip open">Registrations open</span>'}<span class="t-disc">${c.disc}</span></div>
      <div class="t-body"><h3>${c.title}</h3><p>${c.blurb}</p></div>
      <div class="lanes"><small>${c.relays} relays × ${c.lanes} lanes</small>${rows}</div>
      <div class="t-foot"><div><small>Date</small><b>${fmt(c.date,{day:"2-digit",month:"short"})}</b></div><div><small>Venue</small><b>Sikandrabad</b></div><div><small>Entry</small><b>₹${c.fee}</b></div></div></article>`}).join("");
  // podium (2,1,3)
  const pod=[1,0,2].map(i=>{const p=SCORES[i];return `<div class="pod glass p${i+1}"><span class="medal">${i+1}</span><span class="sc" data-t="${p.total}">${p.total.toFixed(1)}</span><b>${p.name}</b><small>${p.club}</small></div>`});
  $("#podium").innerHTML=pod.join("");
  // board
  const lead=SCORES[0].total;
  $("#sbBody").innerHTML=SCORES.map((p,i)=>`<tr class="row r${i+1}" tabindex="0" aria-expanded="false">
    <td class="rk">${String(i+1).padStart(2,"0")}</td><td class="shooter"><b>${p.name}</b><small>${p.club}</small></td>
    <td><div class="series">${p.s.map((v,j)=>`<i style="height:${Math.max(8,(v-98)/8*100)}%" title="S${j+1}: ${v.toFixed(1)}"></i>`).join("")}</div></td>
    <td class="total">${p.total.toFixed(1)}</td><td class="gap">${i?"−"+(lead-p.total).toFixed(1):"Leader"}</td></tr>
    <tr class="detail" hidden><td colspan="5"><div class="det">${p.s.map((v,j)=>`<div><small>S${j+1}</small><b>${v.toFixed(1)}</b></div>`).join("")}</div></td></tr>`).join("");
  // calendar
  const start=new Date("2026-10-01T00:00:00"),end=new Date("2027-01-01T00:00:00"),pct=d=>Math.min(100,Math.max(0,(d-start)/(end-start)*100));
  const n=new Date(),today=new Date(n.getFullYear(),n.getMonth(),n.getDate()),tIn=today>=start&&today<end,tp=pct(today);
  let h=`<div class="cal-row axis"><div class="cal-info">Event</div><div class="cal-track">${[["Oct","2026-10-01"],["Nov","2026-11-01"],["Dec","2026-12-01"]].map(([m,d])=>`<span class="month" style="left:${pct(new Date(d+"T00:00:00"))}%">${m}</span>`).join("")}${tIn?`<span class="today-flag" style="left:${tp}%">Today</span>`:""}</div></div>`;
  h+=NRAI.map(e=>{const a=new Date(e.from+"T00:00:00"),b=new Date(e.to+"T23:59:59"),st=today>b?"done":today>=a?"live":"up";
    const chip=st==="live"?'<span class="chip live">Live now</span>':st==="done"?'<span class="chip done">Finished</span>':"";
    const cls=st==="live"?"live":e.level==="National"?"nat":st==="up"?"up":"";
    return `<div class="cal-row"><div class="cal-info"><b>${e.title}</b><small>${fmt(e.from,{day:"numeric",month:"short"})} – ${fmt(e.to,{day:"numeric",month:"short"})} · ${e.place}</small><div class="tags">${chip}<span class="tag">${e.level}</span><span class="tag">${e.disc}</span></div><a href="${e.url}" target="_blank" rel="noopener">Circular ↗</a></div>
      <div class="cal-track">${tIn?`<span class="today" style="left:${tp}%"></span>`:""}<span class="bar ${cls}" style="left:${pct(a)}%;width:${Math.max(1.4,pct(b)-pct(a))}%"></span></div></div>`}).join("");
  $("#cal").innerHTML=h;
  // contacts
  const ic={phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'};
  $("#contactGrid").innerHTML=CONTACTS.map(c=>{const v=c.phone||c.email;return `<div class="c-cell glass"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${ic[c.icon]}</svg></span><small>${c.role} · ${c.name}</small><b>${v}</b><div class="c-actions">${c.wa?`<a class="chipbtn" href="https://wa.me/${c.wa}" target="_blank" rel="noopener">WhatsApp</a>`:""}<button class="chipbtn copy" data-v="${v}" type="button">Copy</button></div></div>`}).join("");
  $("#fChips").innerHTML=CONTACTS.map(c=>c.phone?`<a class="f-chip" href="tel:${c.phone.replace(/\s/g,"")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic.phone}</svg>${c.name==="Tech line"?"Tech":c.name}: ${c.phone}</a>`:`<a class="f-chip" href="mailto:${c.email}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic.mail}</svg>${c.email}</a>`).join("");
  $("#yr").textContent=new Date().getFullYear();
  document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".copy");if(!b)return;const v=b.dataset.v;
    const sel=()=>{const r=document.createRange();r.selectNodeContents(b.closest(".c-cell").querySelector("b"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Selected. Press Ctrl+C to copy")};
    try{navigator.clipboard.writeText(v).then(()=>toast("Copied "+v),sel)}catch(_){sel()}});
})();

/* ===== Splash ===== */
(function(){const sp=$("#splash"),n=$("#spNum");if(!sp)return;
  if(reduce){sp.remove();return}
  const o={v:0};
  if(hasG){G.to(o,{v:10.9,duration:1.5,ease:"power3.inOut",onUpdate:()=>n.innerHTML=o.v.toFixed(1).replace(".",'<em>.</em>'),
    onComplete:()=>G.to(sp,{yPercent:-100,duration:.9,ease:"expo.inOut",delay:.2,onComplete:()=>{sp.remove();window.dispatchEvent(new Event("nx:ready"))}})})}
  else{n.textContent="10.9";setTimeout(()=>{sp.remove();window.dispatchEvent(new Event("nx:ready"))},3600)}
})();

/* ===== Lenis smooth scroll ===== */
let lenis=null;
if(window.Lenis&&!reduce){
  lenis=new Lenis({lerp:.09,smoothWheel:true});
  if(hasG){lenis.on("scroll",ST.update);G.ticker.add(t=>lenis.raf(t*1000));G.ticker.lagSmoothing(0)}
  else{(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now())}
}
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute("href");const el=id==="#top"?document.body:$(id);if(!el)return;
  e.preventDefault();$("#navLinks").classList.remove("open");$("#burger").setAttribute("aria-expanded","false");
  if(lenis)lenis.scrollTo(el,{offset:-90,duration:1.4});else el.scrollIntoView({behavior:"smooth"})});

/* ===== Cursor, glass specular, magnets, button springs ===== */
(function(){
  const ret=$("#reticle");
  const qx=hasG&&fine?G.quickTo(ret,"x",{duration:.35,ease:"power3"}):null,qy=hasG&&fine?G.quickTo(ret,"y",{duration:.35,ease:"power3"}):null;
  addEventListener("pointermove",e=>{
    const t=e.target;if(!t.closest)return;
    const g=t.closest(".glass");if(g){const r=g.getBoundingClientRect();g.style.setProperty("--mx",e.clientX-r.left+"px");g.style.setProperty("--my",e.clientY-r.top+"px")}
    if(qx){qx(e.clientX);qy(e.clientY);ret.classList.toggle("hot",!!t.closest("a,button,label,select,input,tr.row,.ticket"));ret.classList.toggle("off",!!t.closest("#scope"))}
  },{passive:true});
  document.addEventListener("pointerleave",()=>ret.classList.add("off"));
  if(fine&&!reduce)$$(".mag").forEach(b=>{
    b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();spring(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35},{k:300,d:18})});
    b.addEventListener("pointerleave",()=>spring(b,{x:0,y:0},{k:200,d:12}))});
  $$(".btn,.chipbtn,.f-cta").forEach(b=>{
    b.addEventListener("pointerdown",()=>spring(b,{scale:.93},{k:700,d:22}));
    ["pointerup","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>spring(b,{scale:1},{k:500,d:14})))});
})();

/* ===== Nav: Motion spring blob + burger ===== */
(function(){
  const links=$("#navLinks"),blob=$("#blob"),burger=$("#burger");let active=null;
  burger.addEventListener("click",()=>{const o=links.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
  const go=a=>{if(!a){spring(blob,{opacity:0});return}const lr=links.getBoundingClientRect(),r=a.getBoundingClientRect();
    spring(blob,{x:r.left-lr.left,width:r.width,opacity:1},{k:380,d:30})};
  links.querySelectorAll("a").forEach(a=>a.addEventListener("pointerenter",()=>go(a)));
  links.addEventListener("pointerleave",()=>go(active));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){active=null;links.querySelectorAll("a").forEach(a=>{const on=a.getAttribute("href")==="#"+e.target.id;a.classList.toggle("active",on);if(on)active=a});go(active)}}),{rootMargin:"-45% 0px -50% 0px"});
  $$("section[id]").forEach(s=>io.observe(s));
})();

/* ===== GSAP choreography ===== */
function heroIntro(){
  if(!hasG||!window.SplitType)return;
  const st=new SplitType("#heroTitle .ln",{types:"chars",tagName:"span"});
  $$("#heroTitle .ln").forEach(l=>l.style.overflow="hidden");
  G.timeline({defaults:{ease:"expo.out"}})
   .from(st.chars,{yPercent:115,rotate:6,duration:1.3,stagger:.028})
   .from(".hero-top .label",{y:14,opacity:0,stagger:.08,duration:.8},"<.2")
   .from("#range",{scale:.86,rotate:-12,opacity:0,duration:1.6,ease:"elastic.out(1,.75)"},"<")
   .from(".hero-foot>*",{y:30,opacity:0,stagger:.1,duration:1},"<.3")
   .from(".fact",{y:30,opacity:0,stagger:.08,duration:1},"<.1")
   .add(()=>$$(".fact b").forEach(b=>{const o={v:0},to=+b.dataset.to,d=+b.dataset.d;G.to(o,{v:to,duration:1.6,ease:"power3.out",onUpdate:()=>b.textContent=o.v.toFixed(d)})}),"<");
}
if(document.getElementById("splash")&&!reduce)addEventListener("nx:ready",heroIntro,{once:true});else heroIntro();

if(hasG){
  // section headings: word rise
  if(window.SplitType)$$("h2.split").forEach(h=>{const s=new SplitType(h,{types:"words",tagName:"span"});
    s.words.forEach(w=>{const m=document.createElement("span");m.className="split-mask";w.parentNode.insertBefore(m,w);m.appendChild(w)});
    G.from(s.words,{yPercent:110,duration:1.1,ease:"expo.out",stagger:.06,scrollTrigger:{trigger:h,start:"top 88%",once:true}})});
  // generic rise batches
  ST.batch(".ticket,.c-cell,.cal-row,.fac li,.pod,.board,.addr,.vform,.vres,.bf,.pass",{start:"top 92%",once:true,
    onEnter:b=>G.from(b,{y:50,opacity:0,duration:1,ease:"expo.out",stagger:.07,clearProps:"transform,opacity"})});
  // velocity marquee
  (function(){const tr=$("#band");let x=0,dir=1;const half=()=>tr.scrollWidth/2;const sk=G.quickTo(tr,"skewX",{duration:.4,ease:"power3"});
    G.ticker.add(()=>{const v=lenis?lenis.velocity:0;if(v<-.5)dir=-1;else if(v>.5)dir=1;x-=(1.2+Math.min(Math.abs(v)*.6,24))*dir;const h=half();if(x<=-h)x+=h;if(x>0)x-=h;G.set(tr,{x});sk(-v*.35)})})();
  // pinned horizontal match day
  G.matchMedia().add("(min-width:901px)",()=>{const tr=$("#flowTrack");const dist=()=>tr.scrollWidth-innerWidth;
    const tw=G.to(tr,{x:()=>-dist(),ease:"none",scrollTrigger:{trigger:"#flowPin",pin:true,scrub:1,end:()=>"+="+dist(),invalidateOnRefresh:true}});
    G.to("#flowProg",{scaleX:1,ease:"none",scrollTrigger:{trigger:"#flowPin",scrub:true,start:"top top",end:()=>"+="+dist()}});
    $$(".step").forEach(s=>G.from(s.querySelector(".n"),{yPercent:60,opacity:0,ease:"none",scrollTrigger:{trigger:s,containerAnimation:tw,start:"left 95%",end:"left 55%",scrub:true}}));
    return()=>{}});
  // scoreboard
  ST.create({trigger:"#scores",start:"top 70%",once:true,onEnter:()=>{
    $$(".pod .sc").forEach(el=>{const o={v:560},to=+el.dataset.t;G.to(o,{v:to,duration:2,ease:"expo.out",onUpdate:()=>el.textContent=o.v.toFixed(1)})});
    G.from("#sbBody tr.row",{x:-40,opacity:0,stagger:.08,duration:.9,ease:"expo.out",delay:.3});
    G.from("#sbBody .series i",{scaleY:0,stagger:.015,duration:.8,ease:"back.out(2)",delay:.5})}});
  // calendar bars grow with scroll
  G.from("#cal .bar",{scaleX:0,stagger:.1,ease:"none",scrollTrigger:{trigger:"#cal",start:"top 80%",end:"center 50%",scrub:1}});
  // corridor camera
  G.fromTo("#floor",{rotateX:80},{rotateX:64,ease:"none",scrollTrigger:{trigger:"#corrFrame",start:"top bottom",end:"bottom top",scrub:true}});
  G.fromTo("#boards",{scale:.8},{scale:1.25,ease:"none",scrollTrigger:{trigger:"#corrFrame",start:"top bottom",end:"bottom top",scrub:true}});
  // founder quote reading reveal
  if(window.SplitType){const q=new SplitType("#quote",{types:"words",tagName:"span"});
    G.fromTo(q.words,{opacity:.14},{opacity:1,stagger:.05,ease:"none",scrollTrigger:{trigger:"#quote",start:"top 80%",end:"bottom 45%",scrub:true}})}
  // footer giant chars
  if(window.SplitType){const f=new SplitType("#fGiant",{types:"chars",tagName:"span"});f.chars.forEach(c=>c.classList.add("ch"));
    G.from(f.chars,{yPercent:100,rotate:8,stagger:.03,ease:"none",scrollTrigger:{trigger:".f-body",start:"top 85%",end:"bottom bottom",scrub:1}})}
  // ambient drift
  $$(".ambient i").forEach((b,i)=>G.to(b,{x:()=>(i%2?-1:1)*innerWidth*.12,y:()=>innerHeight*.15*(i%3?1:-1),scale:1.15,duration:14+i*4,ease:"sine.inOut",yoyo:true,repeat:-1}));
  G.to(".ambient",{yPercent:-12,ease:"none",scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
  addEventListener("load",()=>ST.refresh());
}

/* ===== Motion springs: tilt cards + certificate ===== */
(function(){if(!fine||reduce)return;
  $$(".ticket,.step").forEach(el=>{
    el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      spring(el,{rotateY:px*10,rotateX:-py*10,transformPerspective:900},{k:260,d:20})});
    el.addEventListener("pointerleave",()=>spring(el,{rotateY:0,rotateX:0},{k:160,d:14}))});
  const c=$("#cert");
  c.parentElement.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    spring(c,{rotateY:(x-.5)*16,rotateX:(.5-y)*12,transformPerspective:1200},{k:200,d:18});c.style.setProperty("--gx",x*100+"%");c.style.setProperty("--gy",y*100+"%")});
  c.parentElement.addEventListener("pointerleave",()=>spring(c,{rotateY:0,rotateX:0},{k:120,d:12}));
})();

/* ===== Scoreboard rows ===== */
(function(){const wrap=$("#sbWrap"),glow=$("#rowGlow");
  const place=tr=>{const w=wrap.getBoundingClientRect(),r=tr.getBoundingClientRect();spring(glow,{y:r.top-w.top,height:r.height,opacity:1},{k:420,d:32})};
  $$("#sbBody tr.row").forEach(tr=>{const t=()=>{const d=tr.nextElementSibling;d.hidden=!d.hidden;tr.setAttribute("aria-expanded",!d.hidden);
      if(!d.hidden&&M)M.animate(d.querySelectorAll(".det div"),{opacity:[0,1],y:[12,0]},{delay:M.stagger(.04),duration:.4});place(tr)};
    tr.addEventListener("click",t);tr.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();t()}});
    tr.addEventListener("pointerenter",()=>place(tr));tr.addEventListener("focus",()=>place(tr))});
  wrap.addEventListener("pointerleave",()=>spring(glow,{opacity:0}));
})();

/* ===== Verify ===== */
(function(){const medals=["Gold","Silver","Bronze","Merit","Merit"],out=$("#vres");
  $("#vform").addEventListener("submit",e=>{e.preventDefault();const id=$("#vid").value.trim().toUpperCase();
    if(!id){out.className="vres glass no";out.textContent="Enter the ID printed at the top right of the certificate.";return}
    if(hasG)G.fromTo("#scan",{top:-100},{top:"110%",duration:1,ease:"power2.inOut"});
    out.className="vres glass";out.textContent="Checking…";
    setTimeout(()=>{const m=id.match(/^NXS-OPN26-00([1-5])$/);
      if(m){const p=SCORES[m[1]-1];out.className="vres glass ok";out.innerHTML=`<span class="tick">✓</span><span>Verified · ${p.name} · ${p.total.toFixed(1)} · ${medals[m[1]-1]}</span>`;spring(out.querySelector(".tick"),{scale:[0,1.3,1]},{k:500,d:12})}
      else{out.className="vres glass no";out.textContent=`No certificate found for ${id}. Check the ID and try again.`;if(hasG)G.fromTo(out,{x:-8},{x:0,duration:.6,ease:"elastic.out(1,.3)"})}},900)});
})();

/* ===== Booking ===== */
(function(){
  const seg=$("#seg"),th=$("#segThumb");
  const mv=(instant)=>{const l=seg.querySelector("input:checked+label");if(!l)return;const p={x:l.offsetLeft,y:l.offsetTop,width:l.offsetWidth,height:l.offsetHeight};
    if(!M){Object.assign(th.style,{transform:`translate(${p.x}px,${p.y}px)`,width:p.width+"px",height:p.height+"px"})}else if(instant){M.animate(th,p,{duration:0})}else spring(th,p,{k:420,d:26})};
  seg.addEventListener("change",()=>mv(false));new ResizeObserver(()=>mv(true)).observe(seg);mv(true);
  const d=$("#bDate"),iso=x=>new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10),t=new Date();t.setDate(t.getDate()+1);
  d.min=iso(new Date());d.value=iso(t);$("#pDate").textContent=fmt(d.value);
  $("#bform").addEventListener("submit",e=>{e.preventDefault();const name=$("#bName").value.trim(),ph=$("#bPhone").value.replace(/\D/g,""),err=$("#bErr");
    if(name.length<2){err.textContent="Enter the shooter's name.";$("#bName").focus();return}
    if(ph.length!==10){err.textContent="Enter a 10-digit mobile number.";$("#bPhone").focus();return}
    if(!d.value){err.textContent="Pick a date.";d.focus();return}
    err.textContent="";
    $("#pLane").textContent=String(1+Math.floor(Math.random()*10)).padStart(2,"0");$("#pRelay").textContent=1+Math.floor(Math.random()*3);
    $("#pName").textContent=name;$("#pDisc").textContent=$("#bDisc").value;$("#pDate").textContent=fmt(d.value);$("#pSlot").textContent=document.querySelector("input[name=slot]:checked").value;
    const s=$("#pStatus");s.textContent="Request";s.className="chip open";
    $("#pNote").textContent="Pass ready. The range desk confirms your lane by call or WhatsApp on "+$("#bPhone").value.trim()+".";
    if(hasG)G.fromTo("#pass",{clipPath:"inset(0 0 100% 0 round 28px)",y:-20},{clipPath:"inset(0 0 0% 0 round 28px)",y:0,duration:1.1,ease:"expo.out"});
    if(hasG)G.from("#pLane,#pRelay",{yPercent:100,opacity:0,stagger:.1,duration:.8,ease:"back.out(2)",delay:.3});
    toast("Range pass printed");if(innerWidth<900)$("#pass").scrollIntoView({behavior:"smooth",block:"center"})});
})();

/* ===== ISSF target ===== */
(function(){
  const scope=$("#scope"),bezel=$("#bezel"),cv=$("#tgt"),ctx=cv.getContext("2d");
  const VIEW=24,ringR=n=>.25+(10-n)*2.5,PEL=2.25;
  let W=0,S=1,dpr=1,cx=0,cy=0,mouse=null,speed=0,still=0,amp=12,t0=performance.now(),vis=true,shots=[],rip=[],aimP={x:0,y:0};
  const size=()=>{const r=scope.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;cv.width=W*dpr;cv.height=W*dpr;cx=cy=W/2;S=(W/2)/VIEW};
  new ResizeObserver(size).observe(scope);size();new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(scope);
  function target(){ctx.fillStyle="#F7F6F2";ctx.beginPath();ctx.arc(cx,cy,VIEW*S,0,7);ctx.fill();
    ctx.fillStyle="#101415";ctx.beginPath();ctx.arc(cx,cy,ringR(4)*S,0,7);ctx.fill();ctx.lineWidth=Math.max(1,S*.12);
    for(let n=1;n<=9;n++){ctx.strokeStyle=n>=4?"#F7F6F2":"#101415";ctx.beginPath();ctx.arc(cx,cy,ringR(n)*S,0,7);ctx.stroke()}
    ctx.fillStyle="#F7F6F2";ctx.beginPath();ctx.arc(cx,cy,Math.max(1.5,ringR(10)*S),0,7);ctx.fill();
    ctx.font=`500 ${Math.max(9,S*1.45)}px "Geist Mono",monospace`;ctx.textAlign="center";ctx.textBaseline="middle";
    for(let n=1;n<=8;n++){const rr=(ringR(n)+ringR(n+1))/2*S;ctx.fillStyle=n>=4?"#F7F6F2":"#101415";[[0,-1],[0,1],[-1,0],[1,0]].forEach(([a,b])=>ctx.fillText(n,cx+a*rr,cy+b*rr))}
    ctx.strokeStyle="rgba(16,20,21,.3)";ctx.lineWidth=1;for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r1=VIEW*S-2,r2=r1-(i%6?4:9);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke()}}
  function holes(){shots.forEach((s,i)=>{const x=cx+s.x*S,y=cy+s.y*S,r=PEL*S,l=i===shots.length-1;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=l?"#E85D3F":"rgba(31,92,99,.9)";ctx.fill();
    ctx.lineWidth=1.5;ctx.strokeStyle="#F7F6F2";ctx.stroke();ctx.fillStyle="#fff";ctx.font=`600 ${Math.max(9,r*.85)}px "Geist Mono",monospace`;ctx.fillText(i+1,x,y+.5)})}
  function ripples(now){rip=rip.filter(r=>now-r.t<700);rip.forEach(r=>{const k=(now-r.t)/700;ctx.beginPath();ctx.arc(cx+r.x*S,cy+r.y*S,PEL*S+k*60,0,7);ctx.strokeStyle=`rgba(232,93,63,${1-k})`;ctx.lineWidth=2;ctx.stroke()})}
  function aim(now){const t=(now-t0)/1000,b=mouse||{x:cx+Math.cos(t*.35)*W*.12,y:cy+Math.sin(t*.5)*W*.1},tg=mouse?(still>.6?2.5:9+Math.min(speed*.06,22)):10;amp+=(tg-amp)*.06;
    const pulse=Math.max(0,Math.sin(t*7.4))**12*amp*.25;return{x:b.x+amp*(Math.sin(t*1.7)*.6+Math.sin(t*.63+2)*.4),y:b.y+amp*(Math.cos(t*1.3)*.6+Math.sin(t*.91)*.4)-pulse}}
  function cross(p){const R=Math.max(22,W*.06);ctx.save();ctx.strokeStyle="#E85D3F";ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,R,0,7);ctx.stroke();ctx.beginPath();
    ctx.moveTo(p.x-R*1.6,p.y);ctx.lineTo(p.x-R*.35,p.y);ctx.moveTo(p.x+R*.35,p.y);ctx.lineTo(p.x+R*1.6,p.y);ctx.moveTo(p.x,p.y-R*1.6);ctx.lineTo(p.x,p.y-R*.35);ctx.moveTo(p.x,p.y+R*.35);ctx.lineTo(p.x,p.y+R*1.6);ctx.stroke();
    ctx.fillStyle="#E85D3F";ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,7);ctx.fill();ctx.restore()}
  const stab=$("#stab");
  (function frame(now){if(vis&&W){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,W);target();holes();ripples(now);aimP=aim(now);cross(aimP);still+=1/60;speed*=.9;
    stab.style.transform=`scaleX(${Math.max(.05,Math.min(1,1-(amp-2.5)/28))})`}requestAnimationFrame(frame)})(performance.now());
  scope.addEventListener("pointermove",e=>{const r=scope.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};if(mouse){const d=Math.hypot(p.x-mouse.x,p.y-mouse.y);speed=speed*.7+d*3;if(d>.8)still=0}mouse=p});
  scope.addEventListener("pointerleave",()=>mouse=null);
  scope.addEventListener("pointerdown",e=>{const r=scope.getBoundingClientRect();if(e.pointerType!=="mouse"){mouse={x:e.clientX-r.left,y:e.clientY-r.top};aimP=aim(performance.now())}fire(aimP)});
  scope.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();fire(aimP)}});
  const score=d=>{const s=10.9-Math.floor(d/.25)/10;return s<1?0:Math.round(s*10)/10};
  function fire(p){if(shots.length>=10)reset();const x=(p.x-cx)/S,y=(p.y-cy)/S,sc=score(Math.hypot(x,y));shots.push({x,y,sc});rip.push({x,y,t:performance.now()});
    if(hasG)G.fromTo(bezel,{rotate:-1.2,y:-6},{rotate:0,y:0,duration:.8,ease:"elastic.out(1,.35)"});
    const tot=shots.reduce((a,s)=>a+s.sc,0);$("#hLast").textContent=sc?sc.toFixed(1):"MISS";$("#hShots").textContent=shots.length+"/10";$("#hTotal").textContent=tot.toFixed(1);
    spring($("#hLast"),{scale:[1.35,1]},{k:500,d:14});
    const s=document.createElement("span");s.textContent=sc?sc.toFixed(1):"0.0";if(sc>=10)s.className="hi";$("#strip").appendChild(s);spring(s,{scale:[0,1],opacity:[0,1]},{k:500,d:16});
    still=0;amp+=6;
    if(shots.length===10){$("#hint").textContent=tot>=100?`Series ${tot.toFixed(1)}. That is match form. Come shoot it on a real lane.`:tot>=90?`Series ${tot.toFixed(1)}. Solid. Coaching would add the missing points.`:`Series ${tot.toFixed(1)}. Breathe out, hold still, then squeeze.`;toast("Series complete: "+tot.toFixed(1))}}
  function reset(){shots=[];$("#strip").innerHTML="";$("#hLast").textContent="--.-";$("#hShots").textContent="0/10";$("#hTotal").textContent="0.0";$("#hint").textContent="New series. Steady the sway, then fire."}
  $("#reset").addEventListener("click",reset);
})();
