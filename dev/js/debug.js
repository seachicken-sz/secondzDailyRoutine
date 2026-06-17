// ==================================================
// debug.js
// SNSアプリ内ブラウザ検証用
// ==================================================

function isDebugSnsInAppBrowser() {
  if (typeof getAccessBrowserType !== "function") {
    return false;
  }

  return [
    "x_in_app",
    "threads_in_app",
    "line_in_app",
    "instagram_in_app",
    "facebook_in_app",
  ].includes(getAccessBrowserType());
}

function createDebugStorageClearButton() {
  if (!isDebugSnsInAppBrowser()) {
    return;
  }

  if (document.getElementById("debugStorageClearButton")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "debugStorageClearButton";
  button.type = "button";
  button.textContent = "debug: storage削除";
  button.style.position = "fixed";
  button.style.right = "12px";
  button.style.bottom = "12px";
  button.style.zIndex = "9999";
  button.style.padding = "10px 12px";
  button.style.borderRadius = "999px";
  button.style.border = "none";
  button.style.background = "#333";
  button.style.color = "#fff";
  button.style.fontSize = "12px";

  button.addEventListener("click", clearDebugStorageAndReload);

  document.body.appendChild(button);
}

async function clearDebugStorageAndReload() {
  try {
    localStorage.clear();
    sessionStorage.clear();

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    alert("debug: storage/cache/swを削除しました。再読み込みします。");
    location.reload();
  } catch (error) {
    console.error("debug clear failed", error);
    alert("debug: 削除に失敗しました。consoleを確認してください。");
  }
}

document.addEventListener("DOMContentLoaded", createDebugStorageClearButton);
