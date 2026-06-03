// ==================================================
// home.js
// ホーム画面のイベント・ホームからの共有処理を管理するファイル
// ==================================================

// ==================================================
// ホーム画面イベント登録
// ==================================================
// app.js から呼び出して、ホーム画面で使うクリックイベントをまとめて登録する
function bindHomeEvents() {
  // ==================================================
  // 開始ボタン
  // ==================================================

  // ホーム画面の「開始する」ボタン押下時
  addClickEvent(startRoutineButtonElement, () => {
    // アプリ開始ログを送信する
    // ログ送信に失敗してもユーザー操作は止めない
    sendStartLog().catch((error) => {
      console.error("startError", error);
    });

    // Spotify画面へ進む
    showOnlyStep(spotifyStepElement);
  });

  // ==================================================
  // ホーム画面のSNS共有ボタン
  // ==================================================

  // ホーム上部の共有ボタン押下時
  addClickEvent(homeTopShareButtonElement, shareAppFromHome);

  // ホーム下部の「このツールを共有」ボタン押下時
  addClickEvent(homeBottomShareButtonElement, shareAppFromHome);

  // ==================================================
  // ホーム目次
  // ==================================================
  bindHomeIndexEvents();

  // ==================================================
  // ホーム限定：上に戻るボタン
  // ==================================================
  bindHomeBackToTopButton();
}

// ==================================================
// ホーム画面からアプリを共有
// ==================================================
// Web Share API が使える環境では共有シートを開く
// 使えない環境ではクリップボードへURLをコピーする
async function shareAppFromHome() {
  // 共有する内容
  const shareData = {
    title: "タムごとDaily",
    text: "3分でラジリク全部終わらせちゃおう！",
    url: "https://seachicken-sz.github.io/secondzDailyRoutine/app/",
  };

  try {
    // Web Share API が使える場合
    // iPhone/Android/PWAなどでは共有シートが開く
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    // Web Share API が使えない場合
    // 共有文 + URL をクリップボードへコピーする
    await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);

    // コピーできたことをユーザーに伝える
    alert("共有が使えない環境のため、URLをコピーしました。");
  } catch (error) {
    // ユーザーが共有シートを閉じた場合はエラー扱いにしない
    if (error.name === "AbortError") {
      return;
    }

    // それ以外の共有失敗・コピー失敗はログに出して通知する
    console.error(error);
    alert("共有に失敗しました。");
  }
}

// ==================================================
// ホーム目次
// ==================================================

// ホーム目次を現在存在するホーム内セクションから作る
function updateHomeIndex() {
  if (!homeIndexListElement) {
    return;
  }

  const indexItems = [];

  // おかわりDaily
  // 後で該当sectionを追加したら自動で目次に出る
  if (document.getElementById("homeDailyExtraCard")) {
    indexItems.push({
      label: "おかわりDaily",
      targetId: "homeDailyExtraCard",
    });
  }

  // 期間限定
  // 後で該当sectionを追加したら自動で目次に出る
  if (document.getElementById("homeOnceMoreCard")) {
    indexItems.push({
      label: "期間限定",
      targetId: "homeOnceMoreCard",
    });
  }

  // 最近のタムごと
  if (document.getElementById("homeInfoCard")) {
    indexItems.push({
      label: "最近のタムごと",
      targetId: "homeInfoCard",
    });
  }

  homeIndexListElement.innerHTML = "";

  if (indexItems.length === 0) {
    homeIndexListElement.innerHTML = `<p class="empty-text">表示できる項目はありません。</p>`;
    return;
  }

  indexItems.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-index-button";
    button.textContent = item.label;
    button.dataset.homeIndexTarget = item.targetId;

    homeIndexListElement.appendChild(button);
  });
}

// ホーム目次クリックイベント
function bindHomeIndexEvents() {
  if (!homeIndexListElement) {
    return;
  }

  homeIndexListElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-index-target]");

    if (!button) {
      return;
    }

    scrollHomeToElement(button.dataset.homeIndexTarget);
  });
}

// ホーム画面内で指定要素までスクロール
function scrollHomeToElement(targetId) {
  const target = document.getElementById(targetId);

  if (!homeStepElement || !target) {
    return;
  }

  const homeRect = homeStepElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const currentScrollTop = homeStepElement.scrollTop;
  const targetScrollTop = currentScrollTop + targetRect.top - homeRect.top - 12;

  homeStepElement.scrollTo({
    top: targetScrollTop,
    behavior: "smooth",
  });
}

// ==================================================
// ホーム限定：上に戻るボタン
// ==================================================

function bindHomeBackToTopButton() {
  if (!homeStepElement || !homeBackToTopButtonElement) {
    return;
  }

  homeStepElement.addEventListener("scroll", () => {
    const shouldShow =
      !homeStepElement.classList.contains("hidden") &&
      homeStepElement.scrollTop > 260;

    homeBackToTopButtonElement.classList.toggle("hidden", !shouldShow);
  });

  homeBackToTopButtonElement.addEventListener("click", () => {
    homeStepElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}
