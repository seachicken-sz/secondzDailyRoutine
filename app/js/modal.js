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


// モーダル内を下にスクロール
function scrollSetupGuideIntoView(targetElement) {
  if (!targetElement) return;

  window.setTimeout(() => {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, 80);
}
