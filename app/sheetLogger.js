// app/sheetLogger.js

// Google Apps Script のウェブアプリURL
// 例: https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkz6B1RBaxJJldU3ny1wIQzDv1D3DSLfepfYIAKATn1X03hkE9bE2l9Mozt-q9c1Yd/exec";

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
  "requestSong"
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

  if (isIOS) {
    return "ios";
  }

  if (/Android/.test(ua)) {
    return "android";
  }

  if (/Win/.test(platform)) {
    return "windows";
  }

  if (/Mac/.test(platform)) {
    return "mac";
  }

  return "unknown";
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
