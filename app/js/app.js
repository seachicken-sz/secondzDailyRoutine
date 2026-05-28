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



