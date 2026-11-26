// Birthday confetti (dev preview). No image assets or changes to home UI.
window.startBirthdayCelebration = function (event) {
  "use strict";
  const theme = window.getBirthdayTheme(event.theme);
  const palette = theme.palette;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let layer = null;
  let cleanupTimer = null;
  let burstPlayed = false;
  let modalShown = false;
  let modalReady = false;
  let tapTimer = null;
  let stopCanvas = null;
  let suppressed = false;
  const eventId = event.id;
  let active = true;
  let birthdayModal = null;
  const listeners = new AbortController();
  const storageKey = `celebrationSeen_${eventId}`;
  let manualReplay = false;
  function isEventDay() { return active; }
  try { suppressed = !event.preview && localStorage.getItem(storageKey) === "1"; } catch (error) { /* session fallback */ }

  function markSeen() {
    suppressed = true;
    try { if (!event.preview) localStorage.setItem(storageKey, "1"); } catch (error) { /* session fallback */ }
  }

  function isNormalHome() {
    const home = document.getElementById("homeStep");
    const normal = document.getElementById("normalHomeContent");
    return !document.hidden && !document.documentElement.classList.contains("refresh-loading") &&
      !!home && !!normal && !home.classList.contains("hidden") && !normal.classList.contains("hidden");
  }

  function syncModal() {
    const modal = document.getElementById("birthdayModal");
    if (!modal || !isEventDay() || !isNormalHome() || (suppressed && !manualReplay) || modalShown || (!motion.matches && !modalReady)) return;
    if (document.querySelector(".modal-overlay:not(.hidden):not(#birthdayModal)")) return;
    modalShown = true;
    birthdayModal.show();
  }

  function closeModal() {
    const modal = document.getElementById("birthdayModal");
    if (!modal || modal.classList.contains("hidden")) return;
    markSeen();
    manualReplay = false;
    birthdayModal.hide();
    sync();
  }

  function stop() {
    if (stopCanvas) { stopCanvas(); stopCanvas = null; }
    clearTimeout(cleanupTimer);
    clearTimeout(tapTimer);
    cleanupTimer = tapTimer = null;
    if (layer && burstPlayed && !modalReady) burstPlayed = false;
    layer?.remove();
    layer = null;
  }

  function canPlay() {
    // dev: always enabled for preview. Date restriction can be applied at release.
    return isEventDay() && (!suppressed || manualReplay) && !motion.matches && isNormalHome();
  }

  // A single canvas, capped DPR and elapsed-time physics keep the animation
  // independent of the display refresh rate and avoid per-particle DOM layers.
  function startConfettiCanvas(parent) {
    const canvas = document.createElement("canvas");
    canvas.className = "birthday-confetti-canvas";
    canvas.setAttribute("aria-hidden", "true");
    parent.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return () => {}; }
    const rand = (min, max) => min + Math.random() * (max - min);
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shapes = ["paper", "heart", "star", "spark"];
    // Cache tiny sprites once, including the heart and star outlines.
    const sprites = {};
    shapes.forEach(shape => {
      palette.forEach(color => {
        const sprite = document.createElement("canvas");
        sprite.width = sprite.height = 40;
        const c = sprite.getContext("2d");
        c.translate(20, 20);
        c.fillStyle = color;
        if (shape === "paper") c.fillRect(-9, -14, 18, 28);
        else {
          c.beginPath();
          if (shape === "heart") {
            c.moveTo(0, 14);
            c.bezierCurveTo(-30, -5, -13, -24, 0, -9);
            c.bezierCurveTo(13, -24, 30, -5, 0, 14);
          } else {
            const count = shape === "star" ? 10 : 8;
            for (let j = 0; j < count; j++) {
              const angle = j * Math.PI * 2 / count - Math.PI / 2;
              const r = j % 2 ? (shape === "star" ? 7 : 4) : 17;
              const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
              if (j === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
          }
          c.closePath(); c.fill();
        }
        sprites[shape + color] = sprite;
      });
    });
    const particles = Array.from({ length: 132 }, (_, i) => {
      const ribbon = i >= 120;
      const left = i % 2 === 0;
      const n = Math.random();
      const shape = n < .45 ? "paper" : n < .75 ? "heart" : n < .88 ? "star" : "spark";
      const color = palette[Math.floor(Math.random() * palette.length)];
      const gravity = rand(380, 520) * h / 700;
      const trajectory = ribbon ? (i - 120) / 12 : i / 120;
      const launchHeight = h * (trajectory < .5 ? rand(.72, 1.22) : trajectory < .85 ? rand(.30, .65) : rand(.08, .24));
      return {
        ...{
          x: left ? rand(0, w * .055) : rand(w * .945, w),
          y: h + rand(6, 24),
          vx: (left ? 1 : -1) * w * (trajectory < .5 ? rand(.16, .65) : rand(.45, 1.05)),
          vy: -Math.sqrt(2 * gravity * launchHeight)
        },
        gravity, drag: rand(.65, 1.05),
        terminal: h * (ribbon ? rand(.12, .19) : rand(.12, .30)),
        delay: rand(1.08, 1.38),
        size: rand(8, 23), angle: rand(0, Math.PI * 2),
        ribbon, color, ribbonLength: rand(30, 65), ribbonWidth: rand(2, 4), left,
        spin: ribbon ? rand(-1.6, 1.6) : rand(-5.5, 5.5), flip: rand(0, Math.PI * 2),
        flipSpeed: rand(2, 6) * (Math.random() < .5 ? -1 : 1),
        phase: rand(0, Math.PI * 2), flutter: rand(12, 36), frequency: rand(1.8, 4.4),
        sprite: sprites[shape + color], active: true
      };
    });
    const lightColors = theme.lightColors;
    const dots = lightColors.map(color => {
      const a=document.createElement("canvas"); a.width=a.height=40;
      const g=a.getContext("2d"); g.fillStyle=color; g.beginPath(); g.arc(20,20,15,0,Math.PI*2); g.fill(); return a;
    });
    const glows = lightColors.map(color => {
      const a=document.createElement("canvas"); a.width=a.height=64;
      const g=a.getContext("2d"), gr=g.createRadialGradient(32,32,0,32,32,32);
      gr.addColorStop(0,color); gr.addColorStop(1,"transparent"); g.fillStyle=gr; g.fillRect(0,0,64,64); return a;
    });
    const lights = Array.from({length:190},(_,i)=>({
      x:(i%10+rand(.1,.9))*w/10, y:(Math.floor(i/10)+rand(.1,.9))*h/19,
      size:i<60?rand(6,16):i<160?rand(2,6):rand(14,42),
      period:rand(1.2,3.7), appear:rand(4.6,5.25), phase:rand(0,Math.PI*2),
      alpha:i<160?1:.3, sprite:i<60?sprites["spark"+lightColors[i%3]]:i<160?dots[i%3]:glows[i%3]
    }));
    let frame = 0, stopped = false;
    const start = performance.now();
    let last = start;
    function finish() {
      stopped = true;
      cancelAnimationFrame(frame);
      canvas.remove();
    }
    function draw(now) {
      if (stopped || !canvas.isConnected) { finish(); return; }
      const t = (now - start) / 1000;
      const previous = (last - start) / 1000;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const light of lights) {
        if (t < light.appear) continue;
        const glow = .5 + .5 * Math.sin(t * Math.PI * 2 / light.period + light.phase);
        const size = light.size * (.55 + .65 * glow);
        ctx.globalAlpha = light.alpha * (.08 + .92 * glow * glow) * Math.min(1, (t - light.appear) / .45);
        ctx.drawImage(light.sprite, light.x - size / 2, light.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      for (const p of particles) {
        if (!p.active || t < p.delay) continue;
        const dt = Math.min(.05, Math.max(0, t - Math.max(previous, p.delay)));
        p.vx *= Math.exp(-p.drag * dt);
        p.vy = Math.min(p.terminal, p.vy + p.gravity * dt);
        p.x += (p.vx + Math.sin(t * p.frequency + p.phase) * p.flutter) * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        p.flip += p.flipSpeed * dt;
        if ((p.y > h + (p.ribbon ? 100 : 50) && p.vy > 0) || p.x < -100 || p.x > w + 100) {
          p.active = false;
          continue;
        }
        if (p.ribbon) {
          // A flexible, tapered-looking streamer with alternating highlights.
          const length = p.ribbonLength, width = p.ribbonWidth;
          ctx.setTransform(dpr, 0, 0, dpr, dpr * p.x, dpr * p.y);
          ctx.rotate(p.angle * .55);
          ctx.lineCap = "round";
          const segments = 14;
          let px = Math.sin(p.phase + t * 4) * 7, py = -length / 2;
          for (let k = 1; k <= segments; k++) {
            const q = k / segments;
            const wave = q * Math.PI * 3.4 + p.phase + t * 4;
            const x = Math.sin(wave) * 8, y = (q - .5) * length;
            ctx.beginPath();
            ctx.moveTo(px, py); ctx.lineTo(x, y);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = width * (.35 + .65 * Math.abs(Math.cos(wave)));
            ctx.stroke();
            if (Math.cos(wave) > .35) {
              ctx.strokeStyle = "rgba(255,255,255,.35)";
              ctx.lineWidth *= .35;
              ctx.stroke();
            }
            px = x; py = y;
          }
          continue;
        }
        const flip = Math.cos(p.flip);
        const scale = p.size / 40;
        const cs = Math.cos(p.angle), sn = Math.sin(p.angle);
        ctx.setTransform(dpr * cs * scale * flip, dpr * sn * scale * flip,
          -dpr * sn * scale, dpr * cs * scale, dpr * p.x, dpr * p.y);
        ctx.drawImage(p.sprite, -20, -20);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return finish;
  }

  function addGarland(parent) {
    const ns="http://www.w3.org/2000/svg";
    const add=(tag,attrs,root)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));root.appendChild(e);return e;};
    const svg=add("svg",{viewBox:"0 0 360 155",class:"birthday-garland","aria-hidden":"true"},parent);
    add("path",{d:"M-5 0 Q90 65 180 6 Q270 65 365 0 M-5 0 Q180 40 365 0",fill:"none",stroke:"#c9b17a","stroke-width":".8"},svg);
    const colors=["#ff727b","#bd91ff","#63cf88","#82dfff","#c8ed78","#ff9bc9","#ffffff"];
    for(let i=0;i<19;i++){
      const x=6+i*19.3,y=8+20*Math.sin(Math.PI*(i%9)/9),end=y+20+i*37%65;
      const g=add("g",{},svg);g.style.transformOrigin=x+"px "+y+"px";g.style.animation="birthdayGarlandSway "+(3+i%4)+"s "+(-i*.2)+"s infinite ease-in-out";
      add("path",{d:"M"+x+" "+y+"V"+end,stroke:"#d6be83","stroke-width":".7"},g);
      const lamp=add("g",{opacity:0},g),delay=2.9+Math.min(i,18-i)*(1.15/9);
      lamp.style.animation="birthdayLightOn .35s "+delay+"s forwards";
      const core=add("g",{},lamp),color=colors[i%7];core.style.animation="birthdayLampGlow "+(2+i%4*.5)+"s "+(delay+.35)+"s infinite";
      [12,8,5].forEach((r,j)=>add("circle",{cx:x,cy:end,r,fill:color,opacity:[.09,.16,.22][j]},core));
      if(i%3===1) add("ellipse",{cx:x,cy:end,rx:3,ry:5,fill:color},core);
      else {const n=i%3===0?10:8;const pts=Array.from({length:n},(_,j)=>{const a=j*Math.PI*2/n-Math.PI/2,r=j%2?(n===10?3:1.5):7;return (x+Math.cos(a)*r)+","+(end+Math.sin(a)*r);});add("polygon",{points:pts.join(" "),fill:color},core);}
    }
  }

  function sync() {
    document.getElementById("birthdayResetButton")?.classList.toggle("hidden", !isEventDay());
    if (!canPlay()) { stop(); syncModal(); return; }
    if (document.querySelector(".modal-overlay:not(.hidden):not(#birthdayModal)") && !modalShown) {
      stop();
      return;
    }
    syncModal();
    const modalFront = !document.getElementById("birthdayModal")?.classList.contains("hidden");
    if (layer) {
      layer.classList.toggle("birthday-modal-front", modalFront);
      return;
    }
    // One launch per intro; particles retire when they leave the screen.
    if (burstPlayed) return;
    layer = document.createElement("div");
    layer.classList.toggle("birthday-modal-front", modalFront);
    layer.id = "birthdayConfettiLayer";
    window.applyBirthdayTheme(layer,theme);
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "Happy Birthday!!");
    document.body.appendChild(layer);
    burstPlayed = true;
    stopCanvas = startConfettiCanvas(layer);
    addGarland(layer);
    const message = document.createElement("div");
    message.setAttribute("role", "button");
    message.setAttribute("aria-disabled", "true");
    message.tabIndex = -1;
    let messageReady = false;
    message.className = "birthday-intro-message";
    const greeting = document.createElement("div");
    greeting.className = "birthday-intro-greeting";
    [["birthday-intro-title", "Happy Birthday!!"], ["birthday-intro-name", event.name], ["birthday-intro-date", event.dateText]].forEach(([className, value]) => {
      const line = document.createElement("span");
      line.className = className;
      line.textContent = value;
      greeting.appendChild(line);
    });
    message.appendChild(greeting);
    const sparkles = document.createElement("div");
    sparkles.className = "birthday-intro-sparkles";
    [[8,-20,15,0],[24,-38,10,.1],[46,-26,19,.25],[73,-39,12,.15],[92,-15,16,.3],[5,105,11,.25],[20,132,18,.15],[50,115,10,.35],[79,130,14,0],[94,95,19,.2]].forEach(([x,y,size,delay], i) => {
      const sparkle = document.createElement("span");
      sparkle.textContent = i % 3 === 0 ? "✧" : "✦";
      sparkle.style.cssText = "--sx:" + x + "%;--sy:" + y + "%;--ss:" + size + "px;--sd:" + delay + "s";
      sparkles.appendChild(sparkle);
    });
    sparkles.setAttribute("aria-hidden", "true");
    message.appendChild(sparkles);
    const tap = document.createElement("span");
    tap.className = "birthday-intro-tap";
    tap.textContent = "tap";
    message.appendChild(tap);
    layer.appendChild(message);
    const advance = () => {
      if (!messageReady || !layer || modalReady) return;
      modalReady = true;
      if (stopCanvas) { stopCanvas(); stopCanvas = null; }
      layer.classList.add("birthday-intro-leaving");
      messageReady = false;
      message.setAttribute("aria-disabled", "true");
      clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        stop();
        sync();
      }, 220);
    };
    layer.addEventListener("click", advance);
    message.addEventListener("keydown", event => {
      if (["Escape", "Enter", " "].includes(event.key)) { event.preventDefault(); advance(); }
    });
    tapTimer = setTimeout(() => {
      tapTimer = null;
      if (!layer || !canPlay()) return;
      messageReady = true;
      message.setAttribute("aria-disabled", "false");
      message.tabIndex = 0;
      layer.classList.add("birthday-intro-ready");
      message.focus({ preventScroll: true });
    }, 6500);

  }

  function initConfetti() {
    birthdayModal = window.createBirthdayModal(event, closeModal);
    const resetPostFields = birthdayModal.reset;
    document.getElementById("birthdayResetButton")?.addEventListener("click", () => {
      if (!isEventDay() || !isNormalHome()) return;
      closeModal();
      stop();
      manualReplay = true;
      burstPlayed = false;
      modalShown = false;
      modalReady = false;
      resetPostFields();
      sync();
    },{signal:listeners.signal});
    const observer = new MutationObserver(sync);
    [document.documentElement, document.getElementById("homeStep"), document.getElementById("normalHomeContent")]
      .filter(Boolean).forEach(el => observer.observe(el, { attributes: true, attributeFilter: ["class"] }));
    document.querySelectorAll(".modal-overlay").forEach(el => observer.observe(el, { attributes: true, attributeFilter: ["class"] }));
    document.addEventListener("visibilitychange", sync,{signal:listeners.signal});
    window.addEventListener("pageshow", sync,{signal:listeners.signal});
    window.addEventListener("pagehide", stop,{signal:listeners.signal});
    if (motion.addEventListener) motion.addEventListener("change", sync);
    else if (motion.addListener) motion.addListener(sync);
    sync();
    return () => {
      active=false;observer.disconnect();listeners.abort();
      if(motion.removeEventListener)motion.removeEventListener("change",sync);else if(motion.removeListener)motion.removeListener(sync);
      stop();birthdayModal.destroy();
      document.getElementById("birthdayResetButton")?.classList.add("hidden");
    };
  }
  return initConfetti();
};
