// ==================================================
// modal.js
// 初回設定・使い方・YouTubeモーダルの開閉イベントを管理するファイル
// ==================================================

// ==================================================
// モーダルイベント登録
// ==================================================
// app.js から呼び出して、モーダル関連のクリックイベントをまとめて登録する
function bindModalEvents() {

  // ==================================================
// 初回訪問モーダル
// ==================================================
addClickEvent(closeFirstVisitModalButtonElement, closeFirstVisitModal);
addClickEvent(firstVisitCloseOnlyButtonElement, closeFirstVisitModal);

addClickEvent(firstVisitOpenSetupButtonElement, () => {
  closeFirstVisitModal();
  openFirstSetupModal();
});

addClickEvent(firstVisitOpenUsageButtonElement, () => {
  closeFirstVisitModal();
  openUsageModal();
});

if (firstVisitModalElement) {
  firstVisitModalElement.addEventListener("click", (event) => {
    if (event.target === firstVisitModalElement) {
      closeFirstVisitModal();
    }
  });
}

  // ==================================================
// PWA初回訪問モーダル
// ==================================================
addClickEvent(closePwaFirstVisitModalButtonElement, closePwaFirstVisitModal);
addClickEvent(pwaFirstVisitCloseOnlyButtonElement, closePwaFirstVisitModal);

addClickEvent(pwaFirstVisitOpenUsageButtonElement, () => {
  closePwaFirstVisitModal();
  openUsageModal();
});

if (pwaFirstVisitModalElement) {
  pwaFirstVisitModalElement.addEventListener("click", (event) => {
    if (event.target === pwaFirstVisitModalElement) {
      closePwaFirstVisitModal();
    }
  });
}
  
  // ==================================================
  // 初回設定モーダル
  // ==================================================

  // ホーム画面下部の「初回設定」ボタン押下時
  // 初回設定モーダルを表示する
  addClickEvent(openHowToButtonElement, () => {
    if (howToModalElement) {
      howToModalElement.classList.remove("hidden");
    }
  });

  // 初回設定モーダルの閉じるボタン押下時
  // 初回設定モーダルを非表示にする
  addClickEvent(closeHowToButtonElement, () => {
    if (howToModalElement) {
      howToModalElement.classList.add("hidden");
    }
  });

  // ホーム画面の導入案内カード内にある「詳しくはこちら」ボタン押下時
  // 初回設定モーダルを表示する
  addClickEvent(openHowToFromHomeCardButtonElement, () => {
    if (howToModalElement) {
      howToModalElement.classList.remove("hidden");
    }
  });

  // 初回設定モーダルの外側タップ時
  // オーバーレイ部分をタップした場合だけ閉じる
  // モーダル本文をタップした場合は event.target が howToModalElement ではないため閉じない
  if (howToModalElement) {
    howToModalElement.addEventListener("click", (event) => {
      if (event.target === howToModalElement) {
        howToModalElement.classList.add("hidden");
      }
    });
  }

  // ==================================================
  // Stationhead案内モーダル
  // ==================================================

  // ホーム・Spotifyステップなどの各ボタンからモーダルを開く
  openStationheadModalButtonElements.forEach((button) => {
    addClickEvent(button, openStationheadModal);
  });

  // 閉じるボタン
  addClickEvent(closeStationheadModalButtonElement, closeStationheadModal);

  // モーダル外側タップで閉じる
  if (stationheadModalElement) {
    stationheadModalElement.addEventListener("click", (event) => {
      if (event.target === stationheadModalElement) {
        closeStationheadModal();
      }
    });
  }
  
  // ==================================================
  // 使い方モーダル
  // ==================================================

  // ホーム画面下部の「使い方」ボタン押下時
  // 使い方モーダルを表示する
  addClickEvent(openUsageButtonElement, openUsageModal);

  // ステップ画面上部の「使い方」ボタン押下時
  // ホーム以外の画面からも同じ使い方モーダルを表示する
  addClickEvent(stepUsageButtonElement, openUsageModal);

  // 使い方モーダルの閉じるボタン押下時
  // 使い方モーダルを非表示にする
  addClickEvent(closeUsageButtonElement, () => {
    if (usageModalElement) {
      usageModalElement.classList.add("hidden");
    }
  });

  // 使い方モーダルの外側タップ時
  // オーバーレイ部分をタップした場合だけ閉じる
  // モーダル本文をタップした場合は閉じない
  if (usageModalElement) {
    usageModalElement.addEventListener("click", (event) => {
      if (event.target === usageModalElement) {
        usageModalElement.classList.add("hidden");
      }
    });
  }

  // ==================================================
  // YouTubeモーダル
  // ==================================================

  // YouTubeモーダルの閉じるボタン押下時
  // YouTubeモーダルを非表示にする
  addClickEvent(closeYoutubeModalButtonElement, () => {
    if (!youtubeModalElement) {
      return;
    }

    youtubeModalElement.classList.add("hidden");
  });

  // YouTubeモーダルの外側タップ時
  // オーバーレイ部分をタップした場合だけ閉じる
  // モーダル本文やカード部分をタップした場合は閉じない
  if (youtubeModalElement) {
    youtubeModalElement.addEventListener("click", (event) => {
      if (event.target === youtubeModalElement) {
        youtubeModalElement.classList.add("hidden");
      }
    });
  }

  // ==================================================
  // 設定モーダル
  // ==================================================
  addClickEvent(settingButtonElement, openSettingModal);
  
  addClickEvent(homeMenuSettingButtonElement, () => {
    closeHomeMenu();
    openSettingModal();
  });
  
  addClickEvent(closeSettingModalButtonElement, closeSettingModal);
  bindRoutineMusicSettingsEvents();
  addClickEvent(document.getElementById("settingModalBackButton"), () => showSettingModalPage("index"));
  document.getElementById("settingModalIndex")?.addEventListener("click", event => {
    const button = event.target.closest("[data-setting-open]");
    if (button && !button.disabled) showSettingModalPage(button.dataset.settingOpen);
  });
  
  addClickEvent(settingOpenFirstSetupButtonElement, () => {
    closeSettingModal();
    openFirstSetupModal();
  });
  
  if (settingModalElement) {
    settingModalElement.addEventListener("click", (event) => {
      if (event.target === settingModalElement) {
        closeSettingModal();
      }
    });
  }
}
// ==================================================
// Stationhead案内モーダル表示
// ==================================================

function openStationheadModal() {
  if (!stationheadModalElement) {
    return;
  }

  stationheadModalElement.classList.remove("hidden");
}

function closeStationheadModal() {
  if (!stationheadModalElement) {
    return;
  }

  stationheadModalElement.classList.add("hidden");
}

// ==================================================
// 使い方モーダル表示
// ==================================================
// ホーム画面下部ボタン・ステップ画面上部ボタンの両方から使う共通処理
function openUsageModal() {
  // 使い方モーダルがHTMLに存在する場合だけ表示する
  if (usageModalElement) {
    usageModalElement.classList.remove("hidden");
  }
}


function showSettingModalPage(page) {
  const pages = {
    push: { title: "プッシュ通知", section: "pushSettingSection" },
    custom: { title: "マイカスタム", section: "myCustomSettingSection" },
    select: { title: "セレクトモード", section: "selectModeSettingSection" },
    usen: { title: "USEN推し活設定", section: "usenRoutineSettingSection" },
    bgm: { title: "今日のSpotify再生設定", section: "bgmRoutineSettingSection" }
  };
  const isPwa = typeof isStandaloneMode === "function" && isStandaloneMode();
  if (page === "usen" || page === "bgm") refreshRoutineMusicSettingsUi();
  const target = page === "push" && !isPwa ? "index" :
    Object.prototype.hasOwnProperty.call(pages, page) ? page : "index";
  const index = target === "index";
  document.getElementById("settingModalIndex")?.classList.toggle("hidden", !index);
  Object.entries(pages).forEach(([name, config]) => {
    document.getElementById(config.section)?.classList.toggle("hidden", name !== target);
  });
  const guide = document.getElementById("settingPwaGuide");
  if (guide) guide.classList.toggle("hidden", target !== "push" || isPwa);
  document.getElementById("settingModalBackButton")?.classList.toggle("hidden", index);
  const title = document.getElementById("settingModalTitle");
  if (title) title.textContent = index ? "設定" : pages[target].title;
  const body = document.querySelector("#settingModal .setting-modal-body");
  if (body) body.scrollTop = 0;
}

function openSettingModal() {
  if (!settingModalElement) {
    return;
  }

  updateSettingModalState();
  refreshRoutineMusicSettingsUi();
  showSettingModalPage("index");

  if (typeof refreshPushNotificationUi === "function") {
    refreshPushNotificationUi();
  }

  if (typeof refreshSelectModeSettingsUi === "function") {
    refreshSelectModeSettingsUi();
  }

  settingModalElement.classList.remove("hidden");
}

function closeSettingModal() {
  if (!settingModalElement) {
    return;
  }

  settingModalElement.classList.add("hidden");
  showSettingModalPage("index");
}

function updateSettingModalState() {
  const isPwa = typeof isStandaloneMode === "function" && isStandaloneMode();

  settingPwaGuideElement?.classList.toggle("hidden", isPwa);
  pushSettingSectionElement?.classList.toggle("is-disabled", !isPwa);
  const pushIndexButton = document.querySelector('#settingModalIndex [data-setting-open="push"]');
  if (pushIndexButton) {
    pushIndexButton.disabled = !isPwa;
    pushIndexButton.setAttribute("aria-disabled", String(!isPwa));
    pushIndexButton.title = isPwa ? "" : "プッシュ通知はホーム画面に追加したアプリから設定できます";
  }

  if (pushSettingFieldsetElement) {
    pushSettingFieldsetElement.disabled = !isPwa;
  }
}
