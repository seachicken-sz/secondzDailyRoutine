// ==================================================
// 初回設定ガイド
// ==================================================

let isSetupGuideInitialized = false;

const setupGuideState = {
  deviceType: "",
  iosDisplayType: "",
};

const SETUP_GUIDE_IMAGE_BASE_PATH = "../img/setting/";

const SETUP_GUIDE_IMAGES = {
  iosSafariType01: {
    title: "タイプ①：コンパクトモードの場合",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-safari-type01.png`,
    alt: "Safariコンパクトモードの場合のホーム画面追加手順",
  },
  iosSafariType02: {
    title: "タイプ②：共有ボタンが画面にある場合",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-safari-type02.png`,
    alt: "Safariの共有ボタンが画面にある場合のホーム画面追加手順",
  },
  iosChrome: {
    title: "iPhone・iPadでChromeを使用している場合",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-chrome.png`,
    alt: "iPhoneまたはiPadのChromeでホーム画面に追加する手順",
  },
  android: {
    title: "Androidでホーム画面に追加する方法",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-android-chrome.png`,
    alt: "AndroidのChromeでホーム画面に追加する手順",
  },
  checkLaunch: {
    title: "最後にここを確認",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-check-launch.png`,
    alt: "ホーム画面のアイコンから起動できているか確認する画像",
  },
};

function initializeSetupGuide() {
  if (isSetupGuideInitialized) {
    return;
  }

  isSetupGuideInitialized = true;

  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");
  const iosDisplayTypeButtons = document.querySelectorAll("[data-ios-display-type]");

  deviceTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.deviceType = button.dataset.deviceType;
      setupGuideState.iosDisplayType = "";

      setActiveSetupButton(deviceTypeButtons, button);
      resetSetupButtons(iosDisplayTypeButtons);
      clearDeviceGuide();

      if (setupGuideState.deviceType === "ios") {
        showSetupIosDisplayQuestion();
        scrollSetupGuideIntoView(document.getElementById("setupIosDisplayQuestion"));
        return;
      }

      hideSetupIosDisplayQuestion();
      renderDeviceGuide();
      scrollSetupGuideIntoView(document.getElementById("setupDeviceGuideArea"));
    });
  });

  iosDisplayTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.iosDisplayType = button.dataset.iosDisplayType;

      setActiveSetupButton(iosDisplayTypeButtons, button);
      renderDeviceGuide();
      scrollSetupGuideIntoView(document.getElementById("setupDeviceGuideArea"));
    });
  });
}

function renderDeviceGuide() {
  const area = document.getElementById("setupDeviceGuideArea");

  if (!area) {
    return;
  }

  const guide = getDeviceGuideImage();

  if (!guide) {
    clearDeviceGuide();
    return;
  }

  area.innerHTML = `<div class="setup-guide-card">${buildSetupGuideImageHtml(guide)}${buildSetupCheckLaunchHtml()}</div>`;
  area.classList.remove("hidden");
}

function getDeviceGuideImage() {
  if (setupGuideState.deviceType === "android") {
    return SETUP_GUIDE_IMAGES.android;
  }

  if (setupGuideState.deviceType !== "ios") {
    return null;
  }

  if (setupGuideState.iosDisplayType === "safari-type01") {
    return SETUP_GUIDE_IMAGES.iosSafariType01;
  }

  if (setupGuideState.iosDisplayType === "safari-type02") {
    return SETUP_GUIDE_IMAGES.iosSafariType02;
  }

  if (setupGuideState.iosDisplayType === "chrome") {
    return SETUP_GUIDE_IMAGES.iosChrome;
  }

  return null;
}

function buildSetupGuideImageHtml(guide) {
  return `<div class="setup-guide-image-block"><h3>${guide.title}</h3><img class="setup-guide-image" src="${guide.src}" alt="${guide.alt}" loading="lazy"></div>`;
}

function buildSetupCheckLaunchHtml() {
  const checkGuide = SETUP_GUIDE_IMAGES.checkLaunch;

  return `<div class="setup-check-block"><h3>${checkGuide.title}</h3><img class="setup-guide-image" src="${checkGuide.src}" alt="${checkGuide.alt}" loading="lazy"><p class="setup-guide-note">ホーム画面に追加されたアイコンをタップして起動してください！</p></div>`;
}

function setActiveSetupButton(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
}

function resetSetupButtons(buttons) {
  buttons.forEach((button) => {
    button.classList.remove("active");
  });
}

function showSetupIosDisplayQuestion() {
  const area = document.getElementById("setupIosDisplayQuestion");

  if (area) {
    area.classList.remove("hidden");
  }
}

function hideSetupIosDisplayQuestion() {
  const area = document.getElementById("setupIosDisplayQuestion");

  if (area) {
    area.classList.add("hidden");
  }
}

function clearDeviceGuide() {
  const area = document.getElementById("setupDeviceGuideArea");

  if (!area) {
    return;
  }

  area.innerHTML = "";
  area.classList.add("hidden");
}

function resetSetupGuide() {
  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");
  const iosDisplayTypeButtons = document.querySelectorAll("[data-ios-display-type]");

  setupGuideState.deviceType = "";
  setupGuideState.iosDisplayType = "";

  resetSetupButtons(deviceTypeButtons);
  resetSetupButtons(iosDisplayTypeButtons);
  hideSetupIosDisplayQuestion();
  clearDeviceGuide();
}

function scrollSetupGuideIntoView(targetElement) {
  if (!targetElement) {
    return;
  }

  window.setTimeout(() => {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, 80);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function openFirstSetupModal() {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
}

function shouldAutoOpenFirstSetupModal() {
  const alreadyShown = localStorage.getItem(STORAGE_KEYS.browserFirstVisitModalShown) === "true";

  return !isStandaloneMode() && !alreadyShown;
}

function autoOpenFirstSetupModalIfNeeded() {
  if (!shouldAutoOpenFirstSetupModal()) {
    return;
  }

  openFirstVisitModal();
  localStorage.setItem(STORAGE_KEYS.browserFirstVisitModalShown, "true");
}

function openFirstVisitModal() {
  updateFirstVisitOpenSetupButtonVisibility();
  firstVisitModalElement?.classList.remove("hidden");
}

function updateFirstVisitOpenSetupButtonVisibility() {
  if (!firstVisitOpenSetupButtonElement) {
    return;
  }

  const browserType = typeof getAccessBrowserType === "function" ? getAccessBrowserType() : "other_browser";

  const isSnsInAppBrowser = [
    "x_in_app",
    "threads_in_app",
    "line_in_app",
    "instagram_in_app",
    "facebook_in_app",
  ].includes(browserType);

  firstVisitOpenSetupButtonElement.classList.toggle("hidden", isSnsInAppBrowser);
}

function closeFirstVisitModal() {
  firstVisitModalElement?.classList.add("hidden");
}

function getBrowserDisplayName(browserType) {
  const browserNameMap = {
    x_in_app: "Xのリンクタップで開いた",
    threads_in_app: "Threadsのリンクタップで開いた",
    line_in_app: "LINEのリンクタップで開いた",
    instagram_in_app: "Instagramのリンクタップで開いた",
    facebook_in_app: "Facebookのリンクタップで開いた",
    chrome_ios: "Chromeで開いている",
    chrome: "Chromeで開いている",
    safari: "Safariで開いている",
    edge: "Edgeで開いている",
    firefox: "Firefoxで開いている",
    other_browser: "その他のブラウザで開いている",
  };

  return browserNameMap[browserType] || "その他のブラウザ";
}

function openCurrentPageInAndroidChrome() {
  const urlWithoutScheme = location.href.replace(/^https?:\/\//, "");
  location.href = `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
}

function openPwaFirstVisitModal() {
  pwaFirstVisitModalElement?.classList.remove("hidden");
}

function closePwaFirstVisitModal() {
  pwaFirstVisitModalElement?.classList.add("hidden");
}

function hasExistingTaskHistory() {
  return hasValidStorageObject(STORAGE_KEYS.onceTaskDoneMap) || hasValidStorageObject(STORAGE_KEYS.dailyTaskDoneMap);
}

function hasValidStorageObject(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 0;
  } catch (error) {
    return false;
  }
}

function shouldAutoOpenPwaFirstVisitModal() {
  const alreadyShown = localStorage.getItem(STORAGE_KEYS.pwaFirstVisitModalShown) === "true";

  return isStandaloneMode() && !alreadyShown && !hasExistingTaskHistory();
}

function autoOpenPwaFirstVisitModalIfNeeded() {
  if (!shouldAutoOpenPwaFirstVisitModal()) {
    return;
  }

  openPwaFirstVisitModal();
  localStorage.setItem(STORAGE_KEYS.pwaFirstVisitModalShown, "true");
}
