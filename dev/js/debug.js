// ==================================================
// debug.js
// storage/cache/service worker削除検証用
// ==================================================

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

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("debugStorageClearButton")
    ?.addEventListener("click", clearDebugStorageAndReload);
});
