const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxLrmSkPX5rnY74g4CTJ0MU2IYdmswLHGmQTSeF21iQBw02BF66QuVSb0b0YF7piCcQ/exec";
const SHEET_TOKEN = "test-token";
const SHEET_APP_NAME = "secondzDailyRoutine";
const SHEET_CLIENT_ID_KEY = "secondzDailyRoutineClientId";

const SHEET_TASK_TYPES = [
  "onceList",
  "list",
  "spotify",
  "requestSong",
  "start",
  "snsShare",
  "youtube",
  "access"
];

/**
 * 端末・OS・PWA起動状態をざっくり判定する
 *
 * @returns {string}
 */
function getSheetPlatform() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = /Android/.test(ua);

  const isStandalone = isSheetStandaloneMode();

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
 * PWA起動状態かどうかを判定する
 *
 * @returns {boolean}
 */
function isSheetStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  );
}

/**
 * 同じ端末・同じブラウザっぽい利用環境を識別するIDを取得する
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
 * ログ用IDを簡易生成する
 *
 * @param {string} prefix
 * @param {string} value
 * @returns {string}
 */
function createLogItemId(prefix, value) {
  const normalizedValue = String(value || "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  return `${prefix}_${normalizedValue}`;
}

/**
 * 1件分のスプレッドシート送信用itemを作成する
 *
 * @param {Object} item 元データ
 * @param {Object} [options] 上書き用
 * @param {string} [options.itemId] itemId
 * @param {string} [options.title] title
 * @param {string} [options.url] url
 * @returns {{itemId: string, title: string, url: string} | null}
 */
function createSheetItem(item, options = {}) {
  const itemId = options.itemId || item.itemId || item.id || "";
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
 * 遷移直前のログが多いため、sendBeaconを優先する。
 *
 * @param {Object} groups taskTypeごとの送信item配列
 * @returns {Promise<boolean>}
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

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], {
        type: "text/plain;charset=utf-8"
      });

      return navigator.sendBeacon(SHEET_WEB_APP_URL, blob);
    }

    await fetch(SHEET_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body
    });

    return true;
  } catch (error) {
    console.error("sheetLog送信失敗", error);
    return false;
  }
}

/**
 * shareパラメータを解析する
 *
 * 想定:
 * ?share=x_20260528
 * ?share=th_20260528
 *
 * @returns {{shareParam: string, shareSource: string, shareDate: string}}
 */
function getShareIdentifier() {
  const params = new URLSearchParams(window.location.search);
  const shareParam = params.get("share") || "";

  const match = shareParam.match(/^(x|th)_(\d{8})$/);

  if (!match) {
    return {
      shareParam,
      shareSource: "",
      shareDate: ""
    };
  }

  return {
    shareParam,
    shareSource: match[1] === "x" ? "x" : "threads",
    shareDate: match[2]
  };
}

/**
 * ブラウザ種別を判定する
 *
 * @returns {string}
 */
function getAccessBrowserType() {
  const ua = navigator.userAgent || "";
  const lowerUa = ua.toLowerCase();

  if (
    lowerUa.includes("twitter") ||
    lowerUa.includes("twitterios") ||
    lowerUa.includes("twitterandroid")
  ) {
    return "x_in_app";
  }

  if (
    lowerUa.includes("threads") ||
    lowerUa.includes("barcelona")
  ) {
    return "threads_in_app";
  }

  if (lowerUa.includes("line")) {
    return "line_in_app";
  }

  if (lowerUa.includes("instagram")) {
    return "instagram_in_app";
  }

  if (lowerUa.includes("fbav") || lowerUa.includes("fban")) {
    return "facebook_in_app";
  }

  if (lowerUa.includes("crios")) {
    return "chrome_ios";
  }

  if (lowerUa.includes("fxios") || lowerUa.includes("firefox")) {
    return "firefox";
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

/**
 * アクセス時の情報を取得する
 *
 * @returns {Object}
 */
function getAccessLogInfo() {
  const shareIdentifier = getShareIdentifier();

  return {
    browserType: getAccessBrowserType(),
    shareParam: shareIdentifier.shareParam,
    shareSource: shareIdentifier.shareSource,
    shareDate: shareIdentifier.shareDate,
    path: location.pathname,
    query: location.search,
    referrer: document.referrer || "",
    userAgent: navigator.userAgent || ""
  };
}

/**
 * ブラウザアクセスログを送信する
 *
 * PWA起動時は対象外。
 *
 * @returns {Promise<boolean>}
 */
async function sendAccessLog() {
  if (isSheetStandaloneMode()) {
    return false;
  }

  const accessKey = `accessLogSent:${location.pathname}${location.search}`;

  if (sessionStorage.getItem(accessKey)) {
    return false;
  }

  sessionStorage.setItem(accessKey, "1");

  const info = getAccessLogInfo();

  const item = createSheetItem({}, {
    itemId: `access_${info.browserType}`,
    title: info.browserType,
    url: location.href
  });

  return sendSheetLog({
    access: [{
      ...item,
      browserType: info.browserType,
      shareParam: info.shareParam,
      shareSource: info.shareSource,
      shareDate: info.shareDate,
      path: info.path,
      query: info.query,
      referrer: info.referrer,
      userAgent: info.userAgent
    }]
  });
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
 * Spotify遷移ログを送信する
 *
 * @param {Object} song
 * @returns {Promise<boolean>}
 */
async function sendSpotifyLog(song) {
  if (!song || !song.url) {
    return false;
  }

  const item = createSheetItem(song, {
    itemId: song.id || createLogItemId("sp", song.url),
    title: song.name || "",
    url: buildSpotifyUrl(song.url)
  });

  return sendSheetLog({
    spotify: [item]
  });
}

/**
 * 期間限定タスク終了ログを送信する
 *
 * @param {Array<Object>} tasks
 * @returns {Promise<boolean>}
 */
async function sendOnceListLog(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return false;
  }

  const items = tasks.map((task) => {
    const itemId = task.id || task.itemId || createLogItemId("once", `${task.name}_${task.url}`);

    return createSheetItem(task, {
      itemId,
      title: task.name || task.title || "",
      url: task.url || ""
    });
  });

  return sendSheetLog({
    onceList: items
  });
}

/**
 * リクエスト曲ログを送信する
 *
 * @param {Object} song
 * @returns {Promise<boolean>}
 */
async function sendRequestSongLog(song) {
  if (!song || !song.url) {
    return false;
  }

  const item = createSheetItem(song, {
    itemId: song.id || createLogItemId("rq", song.url),
    title: song.name || "",
    url: buildRequestSongUrl(song.url)
  });

  return sendSheetLog({
    requestSong: [item]
  });
}

/**
 * デイリータスクログを送信する
 *
 * @param {Array<Object>} completedItems
 * @returns {Promise<boolean>}
 */
async function sendDailyTaskLog(completedItems) {
  if (!Array.isArray(completedItems) || completedItems.length === 0) {
    return false;
  }

  const items = completedItems.map((item) => {
    const itemId =
      item.itemId ||
      item.id ||
      item.key ||
      createLogItemId("daily", `${item.name}_${item.url}`);

    return createSheetItem(item, {
      itemId,
      title: item.name || item.title || "",
      url: item.url || ""
    });
  });

  return sendSheetLog({
    list: items
  });
}

/**
 * SNSシェアボタン押下ログを送信する
 *
 * @param {"x" | "threads"} platform
 * @returns {Promise<boolean>}
 */
async function sendSnsShareLog(platform) {
  const normalizedPlatform = platform === "threads" ? "threads" : "x";

  const item = createSheetItem({}, {
    itemId: `sns_${normalizedPlatform}`,
    title: normalizedPlatform === "threads" ? "Threadsシェア" : "Xシェア",
    url: ""
  });

  return sendSheetLog({
    snsShare: [item]
  });
}

/**
 * YouTube移動ログを送信する
 *
 * @param {Object} item 移動先データ
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

  return createLogItemId("yt", url);
}
