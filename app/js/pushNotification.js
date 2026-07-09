const ONESIGNAL_APP_ID = "bbe5b00b-e289-48f3-8524-4fdf3bb725c2";

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
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
});

function isPwaMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

async function setDailyPushTime(pushTime) {
  if (!isPwaMode()) {
    alert("通知はホーム画面に追加したアプリから設定できます。");
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function (OneSignal) {
    if (!OneSignal.Notifications.isPushSupported()) {
      alert("この端末ではプッシュ通知に対応していません。");
      return;
    }

    await OneSignal.User.PushSubscription.optIn();

    if (!OneSignal.Notifications.permission) {
      alert("通知が許可されませんでした。端末の通知設定を確認してください。");
      return;
    }

    await OneSignal.User.addTags({
      push_enabled: "true",
      push_time: pushTime,
      push_app: "pwa",
    });

    localStorage.setItem("secondzDailyRoutinePushTime", pushTime);

    alert(`${pushTime === "08" ? "8時" : "18時"}の通知を設定しました。`);
  });
}

async function stopDailyPush() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.User.addTags({
      push_enabled: "false",
    });

    await OneSignal.User.PushSubscription.optOut();

    localStorage.removeItem("secondzDailyRoutinePushTime");

    alert("通知を停止しました。");
  });
}

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

function initializePushNotificationSettings() {
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
