// ==================================================
// 初回設定ガイド
// ==================================================

const setupGuideState = {
  openPlace: "",
  deviceType: "",
};

const SETUP_GUIDE_IMAGES = {
  x: {
    title: "Xからブラウザで開く方法",
    src: "./img/setup/setup-x-browser.png",
    alt: "XからSafariまたはChromeで開く手順",
  },
  threads: {
    title: "Threadsからブラウザで開く方法",
    src: "./img/setup/setup-threads-browser.png",
    alt: "ThreadsからSafariまたはChromeで開く手順",
  },
  ios: {
    title: "iPhoneでホーム画面に追加する方法",
    src: "./img/setup/setup-ios-safari.png",
    alt: "iPhoneのSafariでホーム画面に追加する手順",
  },
  android: {
    title: "Androidでホーム画面に追加する方法",
    src: "./img/setup/setup-android-chrome.png",
    alt: "AndroidのChromeでホーム画面に追加する手順",
  },
  checkLaunch: {
    title: "最後にここを確認",
    src: "./img/setup/setup-check-launch.png",
    alt: "ホーム画面のアイコンから起動できているか確認する画像",
  },
};

function initializeSetupGuide() {
  const openPlaceButtons = document.querySelectorAll("[data-open-place]");
  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");

  openPlaceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.openPlace = button.dataset.openPlace;
      setupGuideState.deviceType = "";

      setActiveSetupButton(openPlaceButtons, button);
      resetSetupButtons(deviceTypeButtons);

      if (setupGuideState.openPlace === "browser") {
        showSetupDeviceQuestion();
        clearSetupGuide();
        return;
      }

      hideSetupDeviceQuestion();
      renderSetupGuide();
    });
  });

  deviceTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setupGuideState.deviceType = button.dataset.deviceType;

      setActiveSetupButton(deviceTypeButtons, button);
      renderSetupGuide();
    });
  });
}

function renderSetupGuide() {
  const area = document.getElementById("setupGuideArea");

  if (!area) {
    return;
  }

  const guide = getSetupGuideImage();

  if (!guide) {
    clearSetupGuide();
    return;
  }

  const shouldShowCheckImage =
    setupGuideState.openPlace === "browser" &&
    (setupGuideState.deviceType === "ios" || setupGuideState.deviceType === "android");

  area.innerHTML = `
    <div class="setup-guide-card">
      <h3>${guide.title}</h3>

      <img
        class="setup-guide-image"
        src="${guide.src}"
        alt="${guide.alt}"
        loading="lazy"
      >

      ${shouldShowCheckImage ? buildSetupCheckLaunchHtml() : buildSetupGuideNoteHtml()}
    </div>
  `;

  area.classList.remove("hidden");
}

function getSetupGuideImage() {
  if (setupGuideState.openPlace === "x") {
    return SETUP_GUIDE_IMAGES.x;
  }

  if (setupGuideState.openPlace === "threads") {
    return SETUP_GUIDE_IMAGES.threads;
  }

  if (setupGuideState.openPlace === "browser" && setupGuideState.deviceType === "ios") {
    return SETUP_GUIDE_IMAGES.ios;
  }

  if (setupGuideState.openPlace === "browser" && setupGuideState.deviceType === "android") {
    return SETUP_GUIDE_IMAGES.android;
  }

  return null;
}

function buildSetupGuideNoteHtml() {
  if (setupGuideState.openPlace === "x" || setupGuideState.openPlace === "threads") {
    return `
      <p class="setup-guide-note">
        ブラウザで開けたら、もう一度この案内を開いて
        「Safari / Chromeなどブラウザアプリで開いている」を選んでね。
      </p>
    `;
  }

  return "";
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
        ホーム画面に追加できたら、次からは必ずホーム画面のアイコンから開いてね。
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

function clearSetupGuide() {
  const area = document.getElementById("setupGuideArea");

  if (!area) {
    return;
  }

  area.innerHTML = "";
  area.classList.add("hidden");
}
