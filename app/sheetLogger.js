// app/sheetLogger.js

// Google Apps Script のウェブアプリURL
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbztgZylfO0v0zUYME1Gooiyvh3YI9zY5D_FX0_P5jpFBwn5lVWuWCYqq0Rak7Z62OwA/exec";

// Apps Script側と同じ値にする
const SHEET_TOKEN = "test-token";

// スプレッドシートに保存するアプリ名
const SHEET_APP_NAME = "secondzDailyRoutine";

// clientIdを保存するlocalStorageキー
const SHEET_CLIENT_ID_KEY = "secondzDailyRoutineClientId";

// Googleスプレッドシート送信対象のtaskType
const SHEET_TASK_TYPES = [
  "onceList",
  "list",
  "spotify",
  "requestSong",
  "start",
  "youtube"
];

/**
 * 端末・OSをざっくり判定する
 *
 * @returns {"ios" | "android" | "windows" | "mac" | "unknown"}
 */
function getSheetPlatform() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = /Android/.test(ua);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true;

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

/**
 * 同じ端末・同じブラウザっぽい利用環境を識別するIDを取得する
 *
 * localStorageに保存されていなければ新規作成する
 *
 * @returns {string}
 */
function getSheetClientId() {
  let clientId = localStorage.getItem(SHEET_CLIENT_ID_KEY);

  if (!clientId) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      clientId = window.crypto.randomUUID();
    } else {
      clientId = createFallbackClientId();
    }

    localStorage.setItem(SHEET_CLIENT_ID_KEY, clientId);
  }

  return clientId;
}

/**
 * crypto.randomUUID が使えない環境向けの代替ID生成
 *
 * @returns {string}
 */
function createFallbackClientId() {
  return [
    "cid",
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
    Math.random().toString(36).slice(2, 10)
  ].join("-");
}

/**
 * 1件分のスプレッドシート送信用itemを作成する
 *
 * onceList / list は item.itemId を使う想定
 * spotify は options.itemId に `sp_${trackId}` を渡す想定
 * requestSong は options.itemId に `rq_${trackId}` を渡す想定
 * start は itemId: "start" を使う想定
 * youtube は options.itemId に `yt_${id}` またはURL由来の値を渡す想定
 *
 * @param {Object} item 元データ
 * @param {Object} [options] 上書き用
 * @param {string} [options.itemId] itemId
 * @param {string} [options.title] title
 * @param {string} [options.url] url
 * @returns {{itemId: string, title: string, url: string} | null}
 */
function createSheetItem(item, options = {}) {
  const itemId = options.itemId || item.itemId || "";
  const title = options.title || item.name || item.title || "";
  const url = options.url ?? item.url ?? "";

  if (!itemId) {
    return null;
  }

  return {
    itemId,
    title,
    url
  };
}

/**
 * taskTypeごとのitemsをpayload形式に整形する
 *
 * @param {Object} groups
 * @param {Array<Object|null|undefined>} [groups.onceList]
 * @param {Array<Object|null|undefined>} [groups.list]
 * @param {Array<Object|null|undefined>} [groups.spotify]
 * @param {Array<Object|null|undefined>} [groups.requestSong]
 * @param {Array<Object|null|undefined>} [groups.start]
 * @param {Array<Object|null|undefined>} [groups.youtube]
 * @returns {Object}
 */
function createSheetPayload(groups) {
  const payload = {
    token: SHEET_TOKEN,
    app: SHEET_APP_NAME,
    platform: getSheetPlatform(),
    clientId: getSheetClientId()
  };

  SHEET_TASK_TYPES.forEach((taskType) => {
    const rawItems = Array.isArray(groups[taskType]) ? groups[taskType] : [];
    const items = rawItems.filter(Boolean);

    if (items.length > 0) {
      payload[taskType] = {
        items
      };
    }
  });

  return payload;
}

/**
 * payload内に送信対象itemが存在するか判定する
 *
 * @param {Object} payload
 * @returns {boolean}
 */
function hasSheetItems(payload) {
  return SHEET_TASK_TYPES.some((taskType) => {
    return Array.isArray(payload[taskType]?.items) &&
      payload[taskType].items.length > 0;
  });
}

/**
 * Googleスプレッドシートへログを送信する
 *
 * @param {Object} groups taskTypeごとの送信item配列
 * @returns {Promise<boolean>} 送信リクエストを投げた場合 true
 */
async function sendSheetLog(groups) {
  if (!SHEET_WEB_APP_URL || SHEET_WEB_APP_URL.includes("ここに")) {
    return false;
  }

  if (!SHEET_TOKEN || SHEET_TOKEN === "任意の合言葉") {
    return false;
  }

  const payload = createSheetPayload(groups || {});

  if (!hasSheetItems(payload)) {
    return false;
  }

  try {
    await fetch(SHEET_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 開始ログを送信する
 *
 * @returns {Promise<boolean>}
 */
async function sendStartLog() {
  const item = createSheetItem({}, {
    itemId: "start",
    title: "開始",
    url: ""
  });

  return sendSheetLog({
    start: [item]
  });
}

/**
 * YouTube移動ログを送信する
 *
 * @param {Object} item 移動先データ
 * @param {string} [item.itemId]
 * @param {string} [item.id]
 * @param {string} [item.name]
 * @param {string} [item.title]
 * @param {string} [item.url]
 * @returns {Promise<boolean>}
 */
async function sendYoutubeLog(item) {
  if (!item) {
    return false;
  }

  const url = item.url || "";
  const itemId =
    item.itemId ||
    item.id ||
    createYoutubeItemId(url);

  const sheetItem = createSheetItem(item, {
    itemId,
    title: item.name || item.title || "",
    url
  });

  if (!sheetItem) {
    return false;
  }

  return sendSheetLog({
    youtube: [sheetItem]
  });
}

/**
 * YouTubeログ用itemIdを作成する
 *
 * @param {string} url
 * @returns {string}
 */
function createYoutubeItemId(url) {
  if (!url) {
    return "yt_unknown";
  }

  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.searchParams.get("v");

    if (videoId) {
      return `yt_${videoId}`;
    }

    const pathname = parsedUrl.pathname.replace(/^\/+/, "");

    if (pathname) {
      return `yt_${pathname.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    }
  } catch (error) {
    // URLとして解釈できない場合は下の簡易IDに落とす
  }

  return `yt_${String(url).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
}
