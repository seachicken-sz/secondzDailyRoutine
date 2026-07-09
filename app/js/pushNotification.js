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
    promptOptions: {
      slidedown: {
        prompts: [
          {
            type: "push",
            autoPrompt: false,
          },
        ],
      },
    },
  });
});
