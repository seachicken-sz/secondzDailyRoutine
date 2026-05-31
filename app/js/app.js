// ==================================================
// 初期表示
// ==================================================
// 画面生成
document.addEventListener("DOMContentLoaded", init);
// アプリ遷移時に現在の状態を保存
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveFlowState();
  }
});
window.addEventListener("pagehide", () => {
  saveFlowState();
});
// ==================================================
// クリックイベント設定 
// ==================================================
// 戻るボタン押下時
addClickEvent(backStepButtonElement, () => {
  goBackStep();
});
// モーダル系イベント登録
bindModalEvents();
// ホーム画面イベント登録
bindHomeEvents();
// Spotify画面イベント登録
bindSpotifyEvents();
// 期間限定タスク画面イベント登録
bindOnceTaskEvents();
// USEN推しリク画面イベント登録
bindRequestSongEvents();
// デイリータスク画面イベント登録
bindDailyTaskEvents();
// SNS共有画面イベント登録
bindPostEvents();
// SNS共有画像イベント登録
bindShareImageEvents();
// YouTube画面イベント登録
bindYoutubeEvents();

// ==================================================
// クリックイベント設定 - 完了画面
// ==================================================
// 完了画面の「ホームに戻る」ボタン押下時
addClickEvent(backHomeButtonElement, () => {
  // 戻る履歴をリセットする
  state.stepHistory = [];
  // 送信済みflagリセット
  state.isSheetLogSentInCurrentFlow = false;
  // 保存済みの途中再開データを削除する
  clearFlowState();
  // 履歴を追加せずにホーム画面へ戻る
  showOnlyStep(homeStepElement, { recordHistory: false });
});

// ==================================================
// 日次表示制御
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
  applyDateVisibleBlocks();
});

/**
 * data-fromdate / data-todate の範囲内だけブロックを表示する
 *
 * 対象例：
 * <div class="date-visible-block" data-fromdate="2026-06-01 00:00" data-todate="2026-06-30 23:59">
 */
function applyDateVisibleBlocks() {
  const now = new Date();

  document.querySelectorAll(".date-visible-block").forEach((block) => {
    const fromText = block.dataset.fromdate;
    const toText = block.dataset.todate;

    const fromDate = fromText ? parseDateText(fromText) : null;
    const toDate = toText ? parseDateText(toText) : null;

    // 日付形式が不正な場合は安全側で非表示
    if ((fromText && !fromDate) || (toText && !toDate)) {
      block.classList.remove("is-visible");
      return;
    }

    const isAfterFrom = !fromDate || now >= fromDate;
    const isBeforeTo = !toDate || now <= toDate;

    if (isAfterFrom && isBeforeTo) {
      block.classList.add("is-visible");
    } else {
      block.classList.remove("is-visible");
    }
  });
}

/**
 * "2026-06-01 00:00" / "2026/06/01 00:00" / "2026-06-01T00:00"
 * あたりを Date に変換する
 */
function parseDateText(text) {
  if (!text) return null;

  const normalized = text
    .trim()
    .replace(/\//g, "-")
    .replace(" ", "T");

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}


