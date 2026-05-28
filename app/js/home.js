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
