// Birthday confetti (dev preview). No image assets or changes to home UI.
(function () {
  "use strict";
  const palette = ["#4d9b50", "#75b96a", "#a8d595", "#d4ebc5", "#e5c675", "#fff0c6", "#ffffff", "#efd28b", "#fffaf0"];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let layer = null;
  let cleanupTimer = null;
  let burstPlayed = false;
  let modalShown = false;
  let modalReady = false;
  let tapTimer = null;
  let stopCanvas = null;
  let suppressed = false;
  const storageKey = "tamugotoBirthday20261127Dismissed";
  try { suppressed = localStorage.getItem(storageKey) === "1"; } catch (error) { /* session fallback */ }

  function setSuppressed(value) {
    suppressed = value;
    try {
      if (value) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch (error) { /* session fallback */ }
    sync();
  }

  function isNormalHome() {
    const home = document.getElementById("homeStep");
    const normal = document.getElementById("normalHomeContent");
    return !document.hidden && !document.documentElement.classList.contains("refresh-loading") &&
      !!home && !!normal && !home.classList.contains("hidden") && !normal.classList.contains("hidden");
  }

  function syncModal() {
    const modal = document.getElementById("birthdayModal");
    if (!modal || !isNormalHome() || suppressed || modalShown || (!motion.matches && !modalReady)) return;
    if (document.querySelector(".modal-overlay:not(.hidden):not(#birthdayModal)")) return;
    modalShown = true;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("birthdayModal")?.classList.add("hidden");
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
    return !suppressed && !motion.matches && isNormalHome();
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
    // Incoming particles share the same spawn logic on launch and recycling.
    function incoming() {
      const route = Math.random();
      const left = Math.random() < .5;
      const direction = left ? 1 : -1;
      if (route < .4) return { x: rand(0, w), y: rand(-85, -15), vx: rand(-24, 24), vy: h * rand(.12, .22) };
      if (route < .7) return { x: left ? rand(0, w * .25) : rand(w * .75, w), y: rand(-85, -15), vx: direction * w * rand(.16, .35), vy: h * rand(.12, .22) };
      return { x: left ? -35 : w + 35, y: rand(0, h * .78), vx: direction * w * rand(.25, .55), vy: h * rand(.04, .13) };
    }
    const particles = Array.from({ length: 278 }, (_, i) => {
      const ribbon = i >= 260;
      const burst = i < 160 || ribbon;
      const left = i % 2 === 0;
      const n = Math.random();
      const shape = n < .45 ? "paper" : n < .75 ? "heart" : n < .88 ? "star" : "spark";
      const color = palette[Math.floor(Math.random() * palette.length)];
      const gravity = burst ? rand(380, 520) * h / 700 : rand(12, 30);
      const trajectory = ribbon ? (i - 260) / 18 : i / 160;
      const launchHeight = h * (trajectory < .5 ? rand(.72, 1.22) : trajectory < .85 ? rand(.30, .65) : rand(.08, .24));
      return {
        ...(burst ? {
          x: left ? rand(0, w * .055) : rand(w * .945, w),
          y: h + rand(6, 24),
          vx: (left ? 1 : -1) * w * (trajectory < .5 ? rand(.16, .65) : rand(.45, 1.05)),
          vy: -Math.sqrt(2 * gravity * launchHeight)
        } : incoming()),
        gravity, drag: burst ? rand(.65, 1.05) : rand(.2, .55),
        terminal: h * (ribbon ? rand(.12, .19) : rand(.12, .30)),
        delay: burst ? rand(.28, .6) : rand(.9, 5.2),
        size: rand(8, 23), angle: rand(0, Math.PI * 2),
        ribbon, color, ribbonLength: rand(30, 65), ribbonWidth: rand(2, 4), left,
        spin: ribbon ? rand(-1.6, 1.6) : rand(-5.5, 5.5), flip: rand(0, Math.PI * 2),
        flipSpeed: rand(2, 6) * (Math.random() < .5 ? -1 : 1),
        phase: rand(0, Math.PI * 2), flutter: rand(12, 36), frequency: rand(1.8, 4.4),
        orbit: ribbon ? i % 3 === 0 : i % 10 < 3,
        orbitJoin: rand(2, 4), orbitAngle: rand(0, Math.PI * 2),
        orbitX: w * rand(.23, .48), orbitY: h * rand(.18, .43),
        orbitSpeed: rand(Math.PI * 2 / 10, Math.PI * 2 / 5) * (Math.random() < .5 ? -1 : 1),
        sprite: sprites[shape + color], active: true
      };
    });
    const lightColors = ["#ffffff", "#fff0c6", "#d4ebc5"];
    const lights = Array.from({ length: 40 }, (_, i) => ({
      x: ((i % 5) + rand(.1, .9)) * w / 5,
      y: (Math.floor(i / 5) + rand(.1, .9)) * h / 8,
      size: rand(3, 16), period: rand(.8, 2.5), appear: rand(.8, 1.3),
      phase: rand(0, Math.PI * 2),
      sprite: sprites["spark" + lightColors[i % lightColors.length]]
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
        ctx.globalAlpha = (.12 + .78 * glow) * Math.min(1, (t - light.appear) / .45);
        ctx.drawImage(light.sprite, light.x - size / 2, light.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      for (const p of particles) {
        if (t < p.delay) continue;
        const dt = Math.min(.05, Math.max(0, t - Math.max(previous, p.delay)));
        const orbiting = p.orbit && t >= p.orbitJoin;
        if (orbiting) {
          p.orbitAngle += p.orbitSpeed * dt;
          const spread = 1 + .08 * Math.sin(t * .7 + p.phase);
          const x = w / 2 + Math.cos(p.orbitAngle) * p.orbitX * spread;
          const y = h / 2 + Math.sin(p.orbitAngle) * p.orbitY;
          const blend = 1 - Math.exp(-1.8 * dt);
          p.x += (x - p.x) * blend;
          p.y += (y - p.y) * blend;
        } else {
          p.vx *= Math.exp(-p.drag * dt);
          p.vy = Math.min(p.terminal, p.vy + p.gravity * dt);
          p.x += (p.vx + Math.sin(t * p.frequency + p.phase) * p.flutter) * dt;
          p.y += p.vy * dt;
        }
        p.angle += p.spin * dt;
        p.flip += p.flipSpeed * dt;
        if (!orbiting && ((p.y > h + (p.ribbon ? 100 : 50) && p.vy > 0) || p.x < -100 || p.x > w + 100)) {
          Object.assign(p, incoming());
          p.gravity = rand(12, 30);
          p.drag = rand(.2, .55);
          p.delay = t + rand(.15, 1.2);
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

  function sync() {
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
    // One launch per intro; recycled particles continue until dismissal.
    if (burstPlayed) return;
    layer = document.createElement("div");
    layer.classList.toggle("birthday-modal-front", modalFront);
    layer.id = "birthdayConfettiLayer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "Happy Birthday!!");
    document.body.appendChild(layer);
    burstPlayed = true;
    stopCanvas = startConfettiCanvas(layer);
    const message = document.createElement("div");
    message.setAttribute("role", "button");
    message.setAttribute("aria-disabled", "true");
    message.tabIndex = -1;
    let messageReady = false;
    message.className = "birthday-intro-message";
    [["birthday-intro-title", "Happy Birthday!!"], ["birthday-intro-name", "So Matsushima"], ["birthday-intro-date", "2026.11.27"]].forEach(([className, value]) => {
      const line = document.createElement("span");
      line.className = className;
      line.textContent = value;
      message.appendChild(line);
    });
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
    }, 2400);

  }

  function initConfetti() {
    const modal = document.getElementById("birthdayModal");
    const dismiss = document.getElementById("birthdayDismissCheckbox");
    if (dismiss) dismiss.checked = suppressed;
    const resetPostFields = () => {
      const field = document.getElementById("birthdayPostText");
      if (field) field.value = "";
      modal?.querySelectorAll('input[name="birthdayTag"]').forEach(el => { el.checked = false; });
    };
    resetPostFields();
    dismiss?.addEventListener("change", () => setSuppressed(dismiss.checked));
    document.getElementById("birthdayModalCloseButton")?.addEventListener("click", closeModal);
    document.getElementById("birthdayModalCloseOnlyButton")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.getElementById("birthdayPostButton")?.addEventListener("click", () => {
      const message = document.getElementById("birthdayPostText").value.trim();
      const tags = Array.from(modal.querySelectorAll('input[name="birthdayTag"]:checked'), el => "#" + el.value);
      const postText = [message, tags.join(" ")].filter(Boolean).join("\n\n");
      if (!postText) { document.getElementById("birthdayPostText").focus(); return; }
      closeModal();
      location.href = X_POST_URL + encodeURIComponent(postText);
    });
    document.getElementById("birthdayResetButton")?.addEventListener("click", () => {
      closeModal();
      stop();
      burstPlayed = false;
      modalShown = false;
      modalReady = false;
      resetPostFields();
      if (dismiss) dismiss.checked = false;
      setSuppressed(false);
    });
    const observer = new MutationObserver(sync);
    [document.documentElement, document.getElementById("homeStep"), document.getElementById("normalHomeContent")]
      .filter(Boolean).forEach(el => observer.observe(el, { attributes: true, attributeFilter: ["class"] }));
    document.querySelectorAll(".modal-overlay").forEach(el => observer.observe(el, { attributes: true, attributeFilter: ["class"] }));
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("pagehide", stop);
    if (motion.addEventListener) motion.addEventListener("change", sync);
    else if (motion.addListener) motion.addListener(sync);
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initConfetti, { once: true });
  else initConfetti();
})();
