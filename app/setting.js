// ==================================================
// 初回設定ガイド
// ==================================================

let isSetupGuideInitialized = false;

const setupGuideState = {
  openPlace: "",
  deviceType: "",
};

const SETUP_GUIDE_IMAGE_BASE_PATH = "../img/setting/";

const SETUP_GUIDE_IMAGES = {
  x: {
    title: "Xからブラウザで開く方法",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-x-browser.png`,
    alt: "XからSafariまたはChromeで開く手順",
  },
  threads: {
    title: "Threadsからブラウザで開く方法",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-threads-browser.png`,
    alt: "ThreadsからSafariまたはChromeで開く手順",
  },
  ios: {
    title: "iPhoneでホーム画面に追加する方法",
    src: `${SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-safari.png`,
    alt: "iPhoneのSafariでホーム画面に追加する手順",
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

  const openPlaceButtons = document.querySelectorAll("[data-open-place]");
  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");

  openPlaceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.openPlace = button.dataset.openPlace;
      setupGuideState.deviceType = "";

      setActiveSetupButton(openPlaceButtons, button);
      resetSetupButtons(deviceTypeButtons);

      renderOpenPlaceGuide();
      clearDeviceGuide();
      showSetupDeviceQuestion();
    });
  });

  deviceTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.deviceType = button.dataset.deviceType;

      setActiveSetupButton(deviceTypeButtons, button);
      renderDeviceGuide();
    });
  });
}

function renderOpenPlaceGuide() {
  const area = document.getElementById("setupOpenPlaceGuideArea");

  if (!area) {
    return;
  }

  const guide = getOpenPlaceGuideImage();

  if (!guide) {
    area.innerHTML = "";
    area.classList.add("hidden");
    return;
  }

  area.innerHTML = `
    <div class="setup-guide-card">
      ${buildSetupGuideImageHtml(guide)}

      <p class="setup-guide-note">
        ↓↓次のステップに進んでください！
      </p>
    </div>
  `;

  area.classList.remove("hidden");
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

  area.innerHTML = `
    <div class="setup-guide-card">
      ${buildSetupGuideImageHtml(guide)}
      ${buildSetupCheckLaunchHtml()}
    </div>
  `;

  area.classList.remove("hidden");
}

function getOpenPlaceGuideImage() {
  if (setupGuideState.openPlace === "x") {
    return SETUP_GUIDE_IMAGES.x;
  }

  if (setupGuideState.openPlace === "threads") {
    return SETUP_GUIDE_IMAGES.threads;
  }

  return null;
}

function getDeviceGuideImage() {
  if (setupGuideState.deviceType === "ios") {
    return SETUP_GUIDE_IMAGES.ios;
  }

  if (setupGuideState.deviceType === "android") {
    return SETUP_GUIDE_IMAGES.android;
  }

  return null;
}

function buildSetupGuideImageHtml(guide) {
  return `
    <div class="setup-guide-image-block">
      <h3>${guide.title}</h3>

      <img
        class="setup-guide-image"
        src="${guide.src}"
        alt="${guide.alt}"
        loading="lazy"
      >
    </div>
  `;
}

function buildSetupCheckLaunchHtml() {
  const checkGuide = SETUP_GUIDE_IMAGES.checkLaunch;

  return `
    <div class="setup-check-block">
      <h3>${checkGuide.title}</h3>

      <img
        class="setup-guide-image"
        src="${checkGuide.src}"
        alt="${checkGuide.alt}"
        loading="lazy"
      >

      <p class="setup-guide-note">
        ホーム画面に追加されたアイコンをタップして起動してください！
      </p>
    </div>
  `;
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

function showSetupDeviceQuestion() {
  const area = document.getElementById("setupDeviceQuestion");

  if (area) {
    area.classList.remove("hidden");
  }
}

function hideSetupDeviceQuestion() {
  const area = document.getElementById("setupDeviceQuestion");

  if (area) {
    area.classList.add("hidden");
  }
}

function clearOpenPlaceGuide() {
  const area = document.getElementById("setupOpenPlaceGuideArea");

  if (!area) {
    return;
  }

  area.innerHTML = "";
  area.classList.add("hidden");
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
  const openPlaceButtons = document.querySelectorAll("[data-open-place]");
  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");

  setupGuideState.openPlace = "";
  setupGuideState.deviceType = "";

  resetSetupButtons(openPlaceButtons);
  resetSetupButtons(deviceTypeButtons);
  hideSetupDeviceQuestion();
  clearOpenPlaceGuide();
  clearDeviceGuide();
}
