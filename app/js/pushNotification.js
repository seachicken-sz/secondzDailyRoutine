// ==================================================
// pushNotification.js
// OneSignalプッシュ通知設定
// ==================================================

const ONESIGNAL_APP_ID = "bbe5b00b-e289-48f3-8524-4fdf3bb725c2";

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

  OneSignalDeferred.push(async function (OneSignal) {
    const initializedOneSignal = await getOneSignalInstance(OneSignal);
    await callback(initializedOneSignal);
  });
}

// ページ表示時に初期化だけ先に走らせる
runWithOneSignal(async () => {});

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
// 通知時刻設定
// ==================================================

async function setDailyPushTime(pushTime) {
  if (!isPushAvailablePwaMode()) {
    alert("通知はホーム画面に追加したアプリから設定できます。");
    return;
  }

  await runWithOneSignal(async function (OneSignal) {
    if (!OneSignal.Notifications.isPushSupported()) {
      alert("この端末ではプッシュ通知に対応していません。");
      return;
    }

    if (!OneSignal.Notifications.permission) {
      await OneSignal.Notifications.requestPermission();
    }

    if (!OneSignal.Notifications.permission) {
      alert("通知が許可されませんでした。端末の通知設定を確認してください。");
      return;
    }

    await OneSignal.User.PushSubscription.optIn();

    OneSignal.User.addTags({
      push_enabled: "true",
      push_time: pushTime,
      push_app: "pwa",
    });

    localStorage.setItem("secondzDailyRoutinePushTime", pushTime);

    alert(`${pushTime === "08" ? "8時" : "18時"}の通知を設定しました。`);
  });
}

// ==================================================
// 通知停止
// ==================================================

async function stopDailyPush() {
  await runWithOneSignal(async function (OneSignal) {
    OneSignal.User.addTags({
      push_enabled: "false",
    });

    await OneSignal.User.PushSubscription.optOut();

    localStorage.removeItem("secondzDailyRoutinePushTime");

    alert("通知を停止しました。");
  });
}

// ==================================================
// UI復元
// ==================================================

function restorePushTimeSelection() {
  const savedPushTime = localStorage.getItem("secondzDailyRoutinePushTime");

  if (!savedPushTime) {
    return;
  }

  const radio = document.querySelector(`input[name="pushTime"][value="${savedPushTime}"]`);

  if (radio) {
    radio.checked = true;
  }
}

// ==================================================
// イベント登録
// ==================================================

function initializePushNotificationSettings() {
  if (isPushNotificationSettingsInitialized) {
    return;
  }

  isPushNotificationSettingsInitialized = true;

  const subscribeButton = document.getElementById("pushSubscribeButton");
  const stopButton = document.getElementById("pushStopButton");

  restorePushTimeSelection();

  if (subscribeButton) {
    subscribeButton.addEventListener("click", () => {
      const selectedPushTime = document.querySelector('input[name="pushTime"]:checked')?.value;

      if (!selectedPushTime) {
        alert("通知時刻を選んでください。");
        return;
      }

      setDailyPushTime(selectedPushTime);
    });
  }

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      stopDailyPush();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializePushNotificationSettings();
});
