// ==================================================
// pushNotification.js
// OneSignalプッシュ通知設定
// ==================================================

const ONESIGNAL_APP_ID = "bbe5b00b-e289-48f3-8524-4fdf3bb725c2";

const PUSH_ENABLED_STORAGE_KEY = "secondzDailyRoutinePushEnabled";
const PUSH_TIME_STORAGE_KEY = "secondzDailyRoutinePushTime";

window.OneSignalDeferred = window.OneSignalDeferred || [];

let oneSignalInitPromise = null;
let isPushNotificationSettingsInitialized = false;

// ==================================================
// OneSignal初期化
// ==================================================

function getOneSignalInstance(OneSignal) {
  if (!oneSignalInitPromise) {
    oneSignalInitPromise = OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "secondzDailyRoutine/push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: {
        scope: "/secondzDailyRoutine/push/onesignal/",
      },
      welcomeNotification: {
        disable: true,
      },
      notifyButton: {
        enable: false,
      },
    });
  }

  return oneSignalInitPromise.then(() => OneSignal);
}

function runWithOneSignal(callback) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve, reject) => {
    OneSignalDeferred.push(async function (OneSignal) {
      try {
        const initializedOneSignal = await getOneSignalInstance(OneSignal);
        const result = await callback(initializedOneSignal);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// ページ表示時に初期化だけ先に走らせる
runWithOneSignal(async () => {}).catch((error) => {
  console.warn("OneSignal初期化に失敗しました。", error);
});

// ==================================================
// PWA判定
// ==================================================

function isPushAvailablePwaMode() {
  if (typeof isStandaloneMode === "function") {
    return isStandaloneMode();
  }

  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

// ==================================================
// UI状態
// ==================================================

function getSavedPushSetting() {
  const enabled = localStorage.getItem(PUSH_ENABLED_STORAGE_KEY) === "true";
  const savedPushTime = localStorage.getItem(PUSH_TIME_STORAGE_KEY);

  if (!enabled) {
    return "off";
  }

  if (savedPushTime === "08" || savedPushTime === "18") {
    return savedPushTime;
  }

  return "off";
}

function getSelectedPushSetting() {
  return document.querySelector('input[name="pushSetting"]:checked')?.value || "";
}

function setPushRadioValue(value) {
  const radio = document.querySelector(`input[name="pushSetting"][value="${value}"]`);

  if (radio) {
    radio.checked = true;
  }
}

function setPushStatusText(text) {
  const statusElement = document.getElementById("pushStatusText");

  if (statusElement) {
    statusElement.textContent = text;
  }
}

function setPushSaveButtonLoading(isLoading) {
  const saveButton = document.getElementById("pushSaveButton");

  if (!saveButton) {
    return;
  }

  saveButton.disabled = isLoading;
  saveButton.textContent = isLoading ? "保存中..." : "設定を保存";
}

function getPushStatusLabel(pushSetting) {
  if (pushSetting === "08") {
    return "現在：8時に通知";
  }

  if (pushSetting === "18") {
    return "現在：18時に通知";
  }

  return "現在：通知OFF";
}

async function refreshPushNotificationUi() {
  const savedSetting = getSavedPushSetting();

  setPushRadioValue(savedSetting);
  setPushStatusText(getPushStatusLabel(savedSetting));

  if (!isPushAvailablePwaMode()) {
    setPushStatusText("現在：PWAから設定できます");
    return;
  }

  if (!("Notification" in window)) {
    setPushRadioValue("off");
    setPushStatusText("現在：この端末は通知に対応していません");
    return;
  }

  if (Notification.permission === "denied") {
    setPushRadioValue("off");
    setPushStatusText("現在：通知がブロックされています");
    return;
  }

  try {
    await runWithOneSignal(async function (OneSignal) {
      const optedIn = getOneSignalOptedIn(OneSignal);

      if (optedIn === false) {
        setPushRadioValue("off");
        setPushStatusText("現在：通知OFF");
        return;
      }

      const latestSavedSetting = getSavedPushSetting();
      setPushRadioValue(latestSavedSetting);
      setPushStatusText(getPushStatusLabel(latestSavedSetting));
    });
  } catch (error) {
    console.warn("通知状態の確認に失敗しました。", error);
  }
}

function getOneSignalOptedIn(OneSignal) {
  const pushSubscription = OneSignal?.User?.PushSubscription;

  if (!pushSubscription) {
    return null;
  }

  if (typeof pushSubscription.optedIn === "boolean") {
    return pushSubscription.optedIn;
  }

  if (typeof pushSubscription.optedIn === "function") {
    return pushSubscription.optedIn();
  }

  return null;
}

// ==================================================
// 通知設定保存
// ==================================================

async function savePushSetting() {
  const selectedSetting = getSelectedPushSetting();

  if (!selectedSetting) {
    alert("通知設定を選んでください。");
    return;
  }

  if (selectedSetting === "off") {
    await stopDailyPush();
    return;
  }

  await setDailyPushTime(selectedSetting);
}

async function setDailyPushTime(pushTime) {
  if (!isPushAvailablePwaMode()) {
    alert("通知はホーム画面に追加したアプリから設定できます。");
    await refreshPushNotificationUi();
    return;
  }

  setPushSaveButtonLoading(true);

  try {
    await runWithOneSignal(async function (OneSignal) {
      if (!isOneSignalPushSupported(OneSignal)) {
        alert("この端末ではプッシュ通知に対応していません。");
        return;
      }

      if ("Notification" in window && Notification.permission === "denied") {
        alert("通知がブロックされています。端末やブラウザの通知設定を確認してください。");
        return;
      }

      if ("Notification" in window && Notification.permission !== "granted") {
        await OneSignal.Notifications.requestPermission();
      }

      if ("Notification" in window && Notification.permission !== "granted") {
        alert("通知が許可されませんでした。端末の通知設定を確認してください。");
        return;
      }

      if (OneSignal.User?.PushSubscription?.optIn) {
        await OneSignal.User.PushSubscription.optIn();
      }

      await OneSignal.User.addTags({
        push_enabled: "true",
        push_time: pushTime,
        push_app: "pwa",
      });

      localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, "true");
      localStorage.setItem(PUSH_TIME_STORAGE_KEY, pushTime);

      setPushRadioValue(pushTime);
      setPushStatusText(getPushStatusLabel(pushTime));

      alert(`${pushTime === "08" ? "8時" : "18時"}の通知を設定しました。`);
    });
  } catch (error) {
    console.error("通知設定に失敗しました。", error);
    alert("通知設定に失敗しました。時間をおいて再度お試しください。");
  } finally {
    setPushSaveButtonLoading(false);
    await refreshPushNotificationUi();
  }
}

// ==================================================
// 通知停止
// ==================================================

async function stopDailyPush() {
  setPushSaveButtonLoading(true);

  try {
    await runWithOneSignal(async function (OneSignal) {
      await OneSignal.User.addTags({
        push_enabled: "false",
        push_time: "off",
        push_app: "pwa",
      });

      if (OneSignal.User?.PushSubscription?.optOut) {
        await OneSignal.User.PushSubscription.optOut();
      }

      localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, "false");
      localStorage.removeItem(PUSH_TIME_STORAGE_KEY);

      setPushRadioValue("off");
      setPushStatusText("現在：通知OFF");

      alert("通知を停止しました。");
    });
  } catch (error) {
    console.error("通知停止に失敗しました。", error);
    alert("通知停止に失敗しました。時間をおいて再度お試しください。");
  } finally {
    setPushSaveButtonLoading(false);
    await refreshPushNotificationUi();
  }
}

function isOneSignalPushSupported(OneSignal) {
  const value = OneSignal?.Notifications?.isPushSupported;

  if (typeof value === "function") {
    return value.call(OneSignal.Notifications);
  }

  if (typeof value === "boolean") {
    return value;
  }

  return true;
}

// ==================================================
// イベント登録
// ==================================================

function initializePushNotificationSettings() {
  if (isPushNotificationSettingsInitialized) {
    return;
  }

  isPushNotificationSettingsInitialized = true;

  const saveButton = document.getElementById("pushSaveButton");

  setPushRadioValue(getSavedPushSetting());
  setPushStatusText(getPushStatusLabel(getSavedPushSetting()));

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      savePushSetting();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializePushNotificationSettings();
});
