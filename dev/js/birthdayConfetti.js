// Birthday confetti (dev preview). No image assets or changes to home UI.
(function () {
  "use strict";
  const palette = ["#4d9b50", "#75b96a", "#a8d595", "#d4ebc5", "#e5c675", "#fff0c6", "#ffffff"];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let layer = null;
  let cleanupTimer = null;
  let burstPlayed = false;
  let modalShown = false;
  let modalReady = false;
  let tapTimer = null;
  const animationDuration = 3000;
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

  function particle(fragment, w, h, burst, index, count) {
    const random = Math.random;
    const n = random();
    const shape = n < .45 ? "paper" : n < .75 ? "heart" : n < .88 ? "star" : "spark";
    const el = document.createElement("span");
    el.className = "birthday-particle birthday-" + shape + " birthday-" + (burst ? "burst" : "fall");
    const color = palette[Math.floor(random() * palette.length)];
    const left = index < count / 2;
    const startX = burst ? (left ? random() * w * .08 : w * (.92 + random() * .08)) : random() * w;
    const spread = (left ? 1 : -1) * w * (.12 + random() * .55);
    const peakX = burst ? startX + spread : startX + 18;
    const peakY = h * (.02 + random() * .31);
    const midX = burst ? startX + spread * 1.1 : startX - 18;
    const endX = burst ? startX + spread * 1.15 : startX + 25;
    const delay = burst ? .28 + random() * .12 : .5 + random() * 2.1;
    const duration = burst ? 2.25 + random() * .2 : 3.1 + random() * .7;
    const drift = (random() - .5) * 100;
    const vars = {
      "--size": (7 + random() * 9) + "px", "--color": color,
      "--start-x": startX + "px", "--start-y": (burst ? h + 15 : -30 - random() * 110) + "px",
      "--rain-x1": (startX + drift * .45) + "px", "--rain-x2": (startX - drift * .25) + "px", "--rain-x3": (startX + drift) + "px",
      "--peak-x": peakX + "px", "--peak-y": peakY + "px",
      "--mid-x": midX + "px", "--mid-y": (peakY + (h - peakY) * .5) + "px",
      "--end-x": endX + "px", "--end-y": (h + 30) + "px",
      "--duration": duration + "s", "--delay": delay + "s"
    };
    Object.entries(vars).forEach(([key, value]) => el.style.setProperty(key, value));
    el.addEventListener("animationend", () => el.remove(), { once: true });
    fragment.appendChild(el);
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
    // One burst per page load or explicit dev reset. No continuous rain.
    if (burstPlayed) return;
    layer = document.createElement("div");
    layer.classList.toggle("birthday-modal-front", modalFront);
    layer.id = "birthdayConfettiLayer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "Happy Birthday!!");
    document.body.appendChild(layer);
    burstPlayed = true;
    const w = layer.clientWidth;
    const h = layer.clientHeight;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) particle(fragment, w, h, true, i, 60);
    for (let i = 0; i < 60; i++) particle(fragment, w, h, false, i, 60);
    layer.appendChild(fragment);
    const message = document.createElement("button");
    message.type = "button";
    message.disabled = true;
    message.className = "birthday-intro-message";
    message.textContent = "Happy Birthday!!";
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
      if (message.disabled || !layer || modalReady) return;
      modalReady = true;
      layer.classList.add("birthday-intro-leaving");
      message.disabled = true;
      clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        stop();
        sync();
      }, 220);
    };
    layer.addEventListener("click", advance);
    message.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); advance(); }
    });
    tapTimer = setTimeout(() => {
      tapTimer = null;
      if (!layer || !canPlay()) return;
      message.disabled = false;
      layer.classList.add("birthday-intro-ready");
      message.focus({ preventScroll: true });
    }, 1400);
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      if (!layer) return;
      layer.querySelectorAll(".birthday-particle").forEach(el => el.remove());
    }, animationDuration);

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
