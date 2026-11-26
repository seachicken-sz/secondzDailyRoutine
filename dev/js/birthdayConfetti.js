// Birthday confetti (dev preview). No image assets or changes to home UI.
(function () {
  "use strict";
  const palette = ["#4d9b50", "#75b96a", "#a8d595", "#d4ebc5", "#e5c675", "#fff0c6", "#ffffff"];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let layer = null;
  let rainTimer = null;
  let cleanupTimer = null;
  let burstPlayed = false;
  let modalShown = false;
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
    if (!modal || !isNormalHome() || suppressed || modalShown) return;
    if (document.querySelector(".modal-overlay:not(.hidden):not(#birthdayModal)")) return;
    modalShown = true;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("birthdayModal")?.classList.add("hidden");
  }

  function stop() {
    clearInterval(rainTimer);
    clearTimeout(cleanupTimer);
    rainTimer = cleanupTimer = null;
    layer?.remove();
    layer = null;
  }

  function canPlay() {
    // dev: always enabled for preview. Date restriction can be applied at release.
    return !suppressed && !motion.matches && isNormalHome();
  }

  function particle(burst, index, count, slow = false) {
    if (!layer) return;
    const w = layer.clientWidth;
    const h = layer.clientHeight;
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
    const peakY = h * (-.15 + random() * .43);
    const midX = burst ? startX + spread * 1.1 : startX - 18;
    const endX = burst ? startX + spread * 1.15 : startX + 25;
    const duration = burst ? 2.6 + random() * 2.3 : (slow ? 5 : 3) + random() * 3;
    const delay = burst ? random() * .16 : slow ? random() * .25 : .85 + random() * 4;
    const vars = {
      "--size": (5 + random() * 9) + "px", "--color": color,
      "--start-x": startX + "px", "--start-y": (h + 15) + "px",
      "--peak-x": peakX + "px", "--peak-y": peakY + "px",
      "--mid-x": midX + "px", "--mid-y": (peakY + (h - peakY) * .5) + "px",
      "--end-x": endX + "px", "--end-y": (h + 30) + "px",
      "--duration": duration + "s", "--delay": delay + "s"
    };
    Object.entries(vars).forEach(([key, value]) => el.style.setProperty(key, value));
    el.addEventListener("animationend", () => el.remove(), { once: true });
    layer.appendChild(el);
  }

  function sync() {
    syncModal();
    if (!canPlay()) { stop(); return; }
    if (layer) return;
    layer = document.createElement("div");
    layer.id = "birthdayConfettiLayer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    const burst = !burstPlayed;
    if (burst) {
      burstPlayed = true;
      for (let i = 0; i < 100; i++) particle(true, i, 100);
      for (let i = 0; i < 60; i++) particle(false, i, 60);
    }
    function startRain() {
      if (!canPlay() || !layer) return;
      particle(false, 0, 1, true);
      rainTimer = setInterval(() => {
        if (!canPlay()) { stop(); return; }
        particle(false, 0, 1, true);
      }, 650);
    }
    if (burst) cleanupTimer = setTimeout(startRain, 10000);
    else startRain();
  }

  function initConfetti() {
    const modal = document.getElementById("birthdayModal");
    const dismiss = document.getElementById("birthdayDismissCheckbox");
    if (dismiss) dismiss.checked = suppressed;
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
