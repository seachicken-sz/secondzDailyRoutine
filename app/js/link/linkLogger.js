// ==================================================
// linkLogger.js
// リンク集専用ログ
// ==================================================

const LINK_LOG_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwnJOEFXIcHqTxKhLREmf1bCZ0JNQHJcEdUd-Dzk4e6lnmU0QV0rVx6MjlOH2_jSU4R/exec";

const LINK_LOG_TOKEN = "test-token";

const LINK_LOG_APP_NAME = "secondzDailyRoutineLink";
const LINK_LOG_CLIENT_ID_KEY = "secondzDailyRoutineLinkClientId";

function getLinkLogClientId() {
  let clientId = localStorage.getItem(LINK_LOG_CLIENT_ID_KEY);

  if (!clientId) {
    clientId =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `link_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(LINK_LOG_CLIENT_ID_KEY, clientId);
  }

  return clientId;
}

function getLinkLogPlatform() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = /Android/.test(ua);

  const isStandalone = Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true
  );

  if (isIOS) {
    return isStandalone ? "ios/pwa" : "ios/browser";
  }

  if (isAndroid) {
    return isStandalone ? "android/pwa" : "android/browser";
  }

  if (/Win/.test(platform)) {
    return isStandalone ? "windows/pwa" : "windows/browser";
  }

  if (/Mac/.test(platform)) {
    return isStandalone ? "mac/pwa" : "mac/browser";
  }

  return isStandalone ? "unknown/pwa" : "unknown/browser";
}

function getLinkLogBrowserType() {
  const ua = navigator.userAgent || "";
  const lowerUa = ua.toLowerCase();
  const referrer = document.referrer || "";
  const lowerReferrer = referrer.toLowerCase();

  if (
    lowerUa.includes("twitter") ||
    lowerUa.includes("twitterios") ||
    lowerUa.includes("twitterandroid") ||
    lowerReferrer.includes("t.co")
  ) {
    return "x_in_app";
  }

  if (
    lowerUa.includes("threads") ||
    lowerUa.includes("barcelona") ||
    lowerReferrer.includes("l.threads.com")
  ) {
    return "threads_in_app";
  }

  if (lowerUa.includes("line")) {
    return "line_in_app";
  }

  if (lowerUa.includes("instagram")) {
    return "instagram_in_app";
  }

  if (lowerUa.includes("crios")) {
    return "chrome_ios";
  }

  if (lowerUa.includes("edg")) {
    return "edge";
  }

  if (lowerUa.includes("chrome")) {
    return "chrome";
  }

  if (lowerUa.includes("safari")) {
    return "safari";
  }

  return "other_browser";
}

function sendLinkLog(type, data = {}) {
  const payload = {
    token: LINK_LOG_TOKEN,
    app: LINK_LOG_APP_NAME,
    type,
    clientId: getLinkLogClientId(),
    platform: getLinkLogPlatform(),
    browserType: getLinkLogBrowserType(),
    path: location.pathname,
    query: location.search,
    referrer: document.referrer || "",
    userAgent: navigator.userAgent || "",
    sentAt: new Date().toISOString(),
    ...data,
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], {
        type: "text/plain;charset=utf-8",
      });

      return navigator.sendBeacon(LINK_LOG_WEB_APP_URL, blob);
    }

    fetch(LINK_LOG_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body,
    });

    return true;
  } catch (error) {
    console.error("リンク集ログ送信失敗", error);
    return false;
  }
}

function sendLinkPageAccessLog() {
  const accessKey = `linkAccessLogSent:${location.pathname}${location.search}`;

  if (sessionStorage.getItem(accessKey)) {
    return;
  }

  sessionStorage.setItem(accessKey, "1");

  sendLinkLog("access", {
    page: "link",
  });
}

function sendLinkClickLog({
  category,
  itemId = "",
  title = "",
  url = "",
  members = "",
}) {
  sendLinkLog("click", {
    category,
    itemId,
    title,
    url,
    members,
  });
}