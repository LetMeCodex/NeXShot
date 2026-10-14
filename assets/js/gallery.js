/* NexShot gallery — "the darkroom"
   Libraries: GSAP Flip (view + filter morphs), Draggable + InertiaPlugin (throwable wall / reel),
   Observer (lightbox swipe + trackpad reel), ScrollTrigger (develop-in intro), SplitType (title),
   Motion (spring thumb + rail). Reuses $, $$, G, M, hasG, spring, reduce, fine, lenis from main.js. */
(function(){
  const DATA = window.GALLERY || [];
  const stage = $("#gStage"), canvas = $("#gCanvas");
  if (!DATA.length || !stage) return;

  const FLIP = window.Flip, DRAG = window.Draggable, INERTIA = window.InertiaPlugin, OBS = window.Observer;
  if (hasG) G.registerPlugin(...[FLIP, DRAG, INERTIA, OBS].filter(Boolean));
  const canFlip = hasG && !!FLIP;

  const CAT = {podium:"Podium", coaching:"Coaching", match:"Match day", range:"The range", press:"Press"};
  const map = $("#gMap"), mapView = $("#gMapView"), hint = $("#gHint"), loupe = $("#gLoupe");
  let view = "wall", drag = null, obs = null, moved = false;

  /* ---------- build the prints ---------- */
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  canvas.innerHTML = DATA.map((d, i) => {
    const ar = d.w / d.h, shape = ar < .62 ? "tall" : ar > 1.45 ? "wide" : "";
    const r = (rnd() * 10 - 5).toFixed(1);
    return `<button class="g-item ${shape}" type="button" data-i="${i}" data-cat="${d.cat}" data-r="${r}" style="--ar:${d.w}/${d.h};--r:${r}deg" aria-label="Open photo ${i + 1}: ${d.title}">
      <span class="g-card"><span class="g-pin"></span>
        <img src="${d.thumb}" alt="${d.title}. ${d.sub}" width="${d.w}" height="${d.h}" loading="lazy" decoding="async">
        <span class="g-meta"><b>${d.title}</b><span>${String(i + 1).padStart(2, "0")}</span></span>
      </span></button>`;
  }).join("");
  const items = [...canvas.children];
  const visible = () => items.filter(el => !el.classList.contains("is-out"));

  /* ---------- layouts ---------- */
  function layoutWall(){
    const vis = visible(), n = vis.length, sw = stage.clientWidth;
    const small = sw < 700;
    const rowH = small ? 250 : 330, cellW = small ? 210 : 300;
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * (small ? 1.2 : 1.9))));
    const rows = Math.ceil(n / cols);
    const cw = Math.max(sw * 1.25, cols * cellW + 160), ch = Math.max(stage.clientHeight * 1.2, rows * rowH + 200);
    const realCell = (cw - 160) / cols;
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
    vis.forEach((el, k) => {
      const d = DATA[el.dataset.i], ar = d.w / d.h, c = k % cols, r = Math.floor(k / cols);
      const h = (small ? 170 : 230) * (ar < .62 ? 1.15 : 1);
      const w = Math.min(realCell * .92, h * ar + 18);
      const jx = (rnd() - .5) * realCell * .22, jy = (rnd() - .5) * 70;
      const x = 80 + c * realCell + (realCell - w) / 2 + jx + (r % 2 ? realCell * .18 : 0);
      const y = 100 + r * ((ch - 200) / rows) + jy;
      el.style.setProperty("--x", Math.max(20, Math.min(cw - w - 20, x)) + "px");
      el.style.setProperty("--y", y + "px");
      el.style.setProperty("--w", w + "px");
    });
    drawMap();
  }
  function centerCanvas(){
    if (view === "grid") { G && G.set(canvas, {x: 0, y: 0, clearProps: "transform"}); return; }
    const sw = stage.clientWidth, sh = stage.clientHeight;
    if (view === "wall") G ? G.set(canvas, {x: -(canvas.offsetWidth - sw) / 2, y: -(canvas.offsetHeight - sh) / 2, skewX: 0})
                           : canvas.style.transform = `translate(${-(canvas.offsetWidth - sw) / 2}px,${-(canvas.offsetHeight - sh) / 2}px)`;
    else G ? G.set(canvas, {x: 0, y: 0, skewX: 0}) : canvas.style.transform = "none";
  }
  function clearWallSize(){ canvas.style.width = ""; canvas.style.height = ""; }

  /* ---------- minimap ---------- */
  let mapScale = 1;
  function drawMap(){
    map.querySelectorAll("b").forEach(b => b.remove());
    if (view !== "wall") return;
    const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    mapScale = Math.min(map.clientWidth / cw, map.clientHeight / ch);
    visible().forEach(el => {
      const b = document.createElement("b");
      b.style.cssText = `left:${parseFloat(el.style.getPropertyValue("--x")) * mapScale}px;top:${parseFloat(el.style.getPropertyValue("--y")) * mapScale}px;width:${parseFloat(el.style.getPropertyValue("--w")) * mapScale}px;height:${el.offsetHeight * mapScale || 14}px`;
      map.insertBefore(b, mapView);
    });
    updMap();
  }
  function updMap(){
    if (!G) return;
    const x = G.getProperty(canvas, "x") || 0, y = G.getProperty(canvas, "y") || 0;
    if (view === "wall") {
      Object.assign(mapView.style, {left: -x * mapScale + "px", top: -y * mapScale + "px", width: stage.clientWidth * mapScale + "px", height: stage.clientHeight * mapScale + "px"});
    } else if (view === "reel") {
      const W = canvas.scrollWidth, mw = map.clientWidth;
      Object.assign(mapView.style, {left: (-x / W) * mw + "px", width: Math.max(14, stage.clientWidth / W * mw) + "px", top: "0px"});
    }
  }

  /* ---------- drag / throw ---------- */
  const skewTo = hasG ? G.quickTo(canvas, "skewX", {duration: .5, ease: "power3"}) : null;
  function setDrag(){
    if (drag) { drag.kill(); drag = null; }
    if (obs) { obs.kill(); obs = null; }
    if (!DRAG || view === "grid" || reduce) return;
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const common = {
      inertia: !!INERTIA, edgeResistance: .8, dragClickables: true, zIndexBoost: false,
      onPress(){ moved = false; hideLoupe(); },
      onDragStart(){ moved = true; stage.classList.remove("is-hovering"); },
      onDrag: tick, onThrowUpdate: tick,
      onThrowComplete(){ skewTo && skewTo(0); }, onRelease(){ if (!INERTIA) skewTo && skewTo(0); }
    };
    if (view === "wall") {
      drag = DRAG.create(canvas, {...common, type: "x,y",
        bounds: {minX: Math.min(0, sw - canvas.offsetWidth), maxX: 0, minY: Math.min(0, sh - canvas.offsetHeight), maxY: 0}})[0];
    } else {
      drag = DRAG.create(canvas, {...common, type: "x", allowNativeTouchScrolling: true,
        bounds: {minX: Math.min(0, sw - canvas.scrollWidth), maxX: 0}})[0];
      // horizontal trackpad / shift+wheel moves the reel
      if (OBS) obs = OBS.create({target: stage, type: "wheel", onChangeX(self){
        const minX = Math.min(0, sw - canvas.scrollWidth);
        const nx = Math.max(minX, Math.min(0, G.getProperty(canvas, "x") - self.deltaX));
        G.to(canvas, {x: nx, duration: .6, ease: "power3", onUpdate: updMap}); skewTo(G.utils.clamp(-8, 8, -self.deltaX * .15));
        clearTimeout(obs._t); obs._t = setTimeout(() => skewTo(0), 160);
      }});
    }
  }
  function tick(){
    updMap();
    if (view === "reel" && INERTIA && skewTo) {
      let v = 0; try { v = INERTIA.getVelocity(canvas, "x"); } catch(e) {}
      skewTo(G.utils.clamp(-10, 10, -v / 180));
    }
  }

  /* ---------- view switching (GSAP Flip) ---------- */
  const views = $$(".g-view"), vThumb = $("#gViewThumb");
  function moveThumb(btn, instant){
    const p = {x: btn.offsetLeft, width: btn.offsetWidth};
    if (instant || !M) { vThumb.style.width = p.width + "px"; vThumb.style.transform = `translateX(${p.x}px)`; }
    else spring(vThumb, p, {k: 380, d: 26});
  }
  const HINTS = {wall: "Drag to pan the wall · click a print to open", reel: "Drag or swipe sideways · click a frame to open", grid: ""};
  function applyView(v){
    view = v;
    stage.classList.remove("view-wall", "view-reel", "view-grid");
    stage.classList.add("view-" + v);
    if (v === "wall") layoutWall(); else { clearWallSize(); drawMap(); }
    centerCanvas();
    hint.textContent = HINTS[v];
  }
  function setView(v, instant){
    if (v === view && !instant) return;
    views.forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
    moveThumb(views.find(b => b.dataset.view === v), instant);
    hideLoupe();
    if (instant || !canFlip) { applyView(v); setDrag(); updMap(); hasG && ScrollTrigger.refresh(); return; }
    if (drag) { drag.kill(); drag = null; }
    const state = FLIP.getState(items, {props: "opacity"});
    applyView(v);
    FLIP.from(state, {
      duration: 1.15, ease: "expo.inOut", absolute: true, scale: false,
      stagger: {amount: .3, from: "random"},
      onComplete(){ setDrag(); updMap(); ScrollTrigger.refresh(); }
    });
  }
  views.forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

  /* ---------- filters (Flip enter / leave) ---------- */
  const chips = $$(".g-chip");
  chips.forEach(ch => ch.addEventListener("click", () => {
    chips.forEach(c => c.classList.toggle("is-on", c === ch));
    const cat = ch.dataset.cat;
    const state = canFlip ? FLIP.getState(items) : null;
    items.forEach(el => el.classList.toggle("is-out", cat !== "all" && el.dataset.cat !== cat));
    $("#gCount").textContent = visible().length;
    if (view === "wall") layoutWall();
    centerCanvas();
    if (!canFlip) { setDrag(); return; }
    if (drag) { drag.kill(); drag = null; }
    FLIP.from(state, {
      duration: .95, ease: "expo.inOut", absolute: true, scale: false, stagger: .015,
      onEnter: els => G.fromTo(els, {opacity: 0, scale: .4, rotation: () => G.utils.random(-25, 25)}, {opacity: 1, scale: 1, rotation: 0, duration: .9, ease: "back.out(1.6)", clearProps: "transform"}),
      onLeave: els => G.to(els, {opacity: 0, scale: .4, duration: .5, ease: "power3.in"}),
      onComplete(){ setDrag(); updMap(); ScrollTrigger.refresh(); }
    });
  }));

  /* ---------- hover: develop the one, darken the rest + scope loupe ---------- */
  const lx = hasG ? G.quickTo(loupe, "x", {duration: .25, ease: "power3"}) : null;
  const ly = hasG ? G.quickTo(loupe, "y", {duration: .25, ease: "power3"}) : null;
  let hot = null;
  function hideLoupe(){ loupe.classList.remove("on"); }
  items.forEach(el => {
    const card = el.querySelector(".g-card"), img = el.querySelector("img"), d = DATA[el.dataset.i];
    el.addEventListener("pointerenter", e => {
      if (e.pointerType !== "mouse" || (drag && drag.isPressed)) return;
      hot = el; el.classList.add("is-hot"); stage.classList.add("is-hovering");
      if (hasG) G.to(card, {scale: view === "grid" ? 1.03 : 1.08, rotation: 0, duration: .7, ease: "elastic.out(1,.55)", overwrite: true});
      const pre = new Image(); pre.src = d.src;
      loupe.style.backgroundImage = `url("${d.src}")`;
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-hot"); if (hot === el) hot = null;
      stage.classList.remove("is-hovering"); hideLoupe();
      if (hasG) G.to(card, {scale: 1, rotation: parseFloat(el.dataset.r), duration: .8, ease: "elastic.out(1,.5)", overwrite: true, clearProps: "transform"});
    });
    el.addEventListener("pointermove", e => {
      if (!fine || reduce || e.pointerType !== "mouse" || (drag && drag.isDragging)) { hideLoupe(); return; }
      const r = img.getBoundingClientRect(); if (!r.width) return;
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      if (px < 0 || px > 1 || py < 0 || py > 1) { hideLoupe(); return; }
      const Z = 2.5, bw = r.width * Z, bh = r.height * Z;
      loupe.style.backgroundSize = `${bw}px ${bh}px`;
      loupe.style.backgroundPosition = `${-(px * bw - 95)}px ${-(py * bh - 95)}px`;
      loupe.classList.add("on"); lx(e.clientX); ly(e.clientY);
    });
    el.addEventListener("click", e => { if (moved) { e.preventDefault(); return; } open(+el.dataset.i, e); });
  });
  stage.addEventListener("pointermove", e => {
    const r = stage.getBoundingClientRect();
    stage.style.setProperty("--sx", e.clientX - r.left + "px"); stage.style.setProperty("--sy", e.clientY - r.top + "px");
  }, {passive: true});

  /* ---------- lightbox: iris open from the print you clicked ---------- */
  const lb = $("#gLb"), lbImg = $("#gLbImg"), frame = $("#gLbFrame"), cross = frame.querySelector(".g-lb-cross"), rail = $("#gLbRail");
  let list = [], cur = 0, lastItem = null, lbObs = null;
  rail.innerHTML = DATA.map((d, i) => `<button type="button" data-i="${i}" aria-label="Show photo ${i + 1}"><img src="${d.thumb}" alt="" loading="lazy"></button>`).join("");
  const railBtns = [...rail.children];
  railBtns.forEach(b => b.addEventListener("click", () => { const k = list.indexOf(+b.dataset.i); if (k > -1) go(k - cur); }));

  function fill(i){
    const d = DATA[i];
    lbImg.src = d.src; lbImg.alt = `${d.title}. ${d.sub}`;
    $("#gLbCat").textContent = CAT[d.cat] || "";
    $("#gLbTitle").textContent = d.title; $("#gLbSub").textContent = d.sub;
    $("#gLbT").textContent = String(list.length).padStart(2, "0");
    railBtns.forEach(b => { const on = +b.dataset.i === i; b.classList.toggle("on", on); b.hidden = !list.includes(+b.dataset.i);
      if (on) b.scrollIntoView({inline: "center", block: "nearest", behavior: "smooth"}); });
  }
  function rollCounter(n, dir){
    const roll = $(".g-roll"), old = roll.firstElementChild, nu = document.createElement("span");
    nu.textContent = String(n).padStart(2, "0");
    if (!hasG) { old.replaceWith(nu); nu.id = "gLbN"; return; }
    roll.appendChild(nu); old.removeAttribute("id"); nu.id = "gLbN";
    G.fromTo(nu, {yPercent: dir > 0 ? 0 : -200}, {yPercent: -100, duration: .6, ease: "expo.out"});
    G.to(old, {yPercent: dir > 0 ? -100 : 100, duration: .6, ease: "expo.out", onComplete: () => { old.remove(); G.set(nu, {yPercent: 0}); }});
  }
  function flashCross(){
    if (!hasG) return;
    G.fromTo(cross, {opacity: 1, scale: 2.2, rotation: -45}, {opacity: 0, scale: .8, rotation: 0, duration: .9, ease: "expo.out"});
  }
  function captionIn(){
    if (!hasG) return;
    G.fromTo(".g-lb-cap > *", {y: 18, opacity: 0}, {y: 0, opacity: 1, stagger: .06, duration: .7, ease: "expo.out"});
  }

  function open(i, e){
    list = visible().map(el => +el.dataset.i);
    cur = Math.max(0, list.indexOf(i)); lastItem = items[i];
    fill(i); $("#gLbN").textContent = String(cur + 1).padStart(2, "0");
    lb.hidden = false; hideLoupe();
    if (typeof lenis !== "undefined" && lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
    const ox = e && e.clientX ? e.clientX : innerWidth / 2, oy = e && e.clientY ? e.clientY : innerHeight / 2;
    if (hasG) {
      G.timeline()
        .fromTo(lb, {clipPath: `circle(0px at ${ox}px ${oy}px)`}, {clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${ox}px ${oy}px)`, duration: .9, ease: "expo.inOut"})
        .from(frame, {scale: .85, opacity: 0, duration: .9, ease: "expo.out"}, "-=.35")
        .add(flashCross, "<.1").add(captionIn, "<")
        .fromTo(railBtns.filter(b => !b.hidden), {y: 30}, {y: 0, stagger: .02, duration: .6, ease: "back.out(2)", clearProps: "transform"}, "<.1");
    }
    $("#gLbClose").focus({preventScroll: true});
    if (OBS && hasG) lbObs = OBS.create({target: frame, type: "touch,pointer", dragMinimum: 10, tolerance: 50,
      onLeft: () => go(1), onRight: () => go(-1)});
  }
  function go(step){
    if (!step || !list.length) return;
    cur = (cur + step + list.length) % list.length;
    const i = list[cur], dir = step > 0 ? 1 : -1;
    if (!hasG) { fill(i); rollCounter(cur + 1, dir); return; }
    G.timeline()
      .to(lbImg, {xPercent: -12 * dir, opacity: 0, filter: "blur(10px)", duration: .35, ease: "power3.in"})
      .add(() => { fill(i); rollCounter(cur + 1, dir); })
      .fromTo(lbImg, {xPercent: 12 * dir, opacity: 0, filter: "blur(10px)", clipPath: "circle(0% at 50% 50%)"},
                     {xPercent: 0, opacity: 1, filter: "blur(0px)", clipPath: "circle(75% at 50% 50%)", duration: .8, ease: "expo.out", clearProps: "clipPath,filter"})
      .add(flashCross, "<").add(captionIn, "<");
  }
  function close(){
    const finish = () => {
      lb.hidden = true; document.documentElement.style.overflow = "";
      if (typeof lenis !== "undefined" && lenis) lenis.start();
      if (lbObs) { lbObs.kill(); lbObs = null; }
      lastItem && lastItem.focus({preventScroll: true});
    };
    if (!hasG) return finish();
    const r = lastItem ? lastItem.getBoundingClientRect() : {left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0};
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    G.to(lb, {clipPath: `circle(0px at ${ox}px ${oy}px)`, duration: .7, ease: "expo.inOut", onComplete: finish});
    if (lastItem) G.fromTo(lastItem.querySelector(".g-card"), {scale: 1.15}, {scale: 1, duration: 1, delay: .5, ease: "elastic.out(1,.4)", clearProps: "transform"});
  }
  $("#gLbClose").addEventListener("click", close);
  $("#gLbBg").addEventListener("click", close);
  $("#gLbPrev").addEventListener("click", () => go(-1));
  $("#gLbNext").addEventListener("click", () => go(1));
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Tab") { // keep focus inside the viewer
      const f = [...lb.querySelectorAll("button:not([hidden])")]; const a = f.indexOf(document.activeElement);
      if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- scroll choreography: prints develop into place ---------- */
  function intro(){
    if (!hasG) return;
    if (window.SplitType) {
      const st = new SplitType("#gTitle .g-line", {types: "chars", tagName: "span"});
      $$("#gTitle .g-line").forEach(l => l.style.overflow = "hidden");
      G.from(st.chars, {yPercent: 120, rotateX: -70, transformOrigin: "50% 100%", stagger: .025, duration: 1.2, ease: "expo.out",
        scrollTrigger: {trigger: "#gTitle", start: "top 85%", once: true}});
    }
    G.from(".g-bar > *", {y: 30, opacity: 0, stagger: .1, duration: 1, ease: "expo.out", scrollTrigger: {trigger: ".g-bar", start: "top 90%", once: true}});
    G.fromTo(stage, {scale: .9, borderRadius: "80px"}, {scale: 1, borderRadius: "40px", ease: "none",
      scrollTrigger: {trigger: stage, start: "top bottom", end: "top 25%", scrub: true}});
    const cards = items.map(el => el.querySelector(".g-card"));
    ScrollTrigger.create({trigger: stage, start: "top 70%", once: true, onEnter(){
      G.from(cards, {y: () => G.utils.random(240, 520), x: () => G.utils.random(-160, 160), rotation: () => G.utils.random(-40, 40), scale: .5, opacity: 0,
        duration: 1.5, ease: "expo.out", stagger: {amount: .9, from: "random"}, clearProps: "transform,opacity"});
      // darkroom developer bath: prints fade up from overexposed sepia
      G.from(items.map(el => el.querySelector("img")), {filter: "brightness(2.8) contrast(.45) sepia(1) blur(6px)", duration: 2.4, ease: "power2.out",
        stagger: {amount: 1.2, from: "random"}, clearProps: "filter"});
      G.from(map, {opacity: 0, y: 20, duration: .8, delay: 1, ease: "expo.out"});
    }});
  }

  /* ---------- boot ---------- */
  const startView = (innerWidth < 700 || matchMedia("(pointer:coarse)").matches) ? "grid" : "wall";
  view = "";
  setView(startView, true);
  intro();
  let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => {
    if (view === "wall") layoutWall(); centerCanvas(); setDrag(); moveThumb(views.find(b => b.dataset.view === view), true); updMap();
  }, 200); });
  addEventListener("load", () => { if (view === "wall") { layoutWall(); centerCanvas(); setDrag(); } drawMap(); });
})();
