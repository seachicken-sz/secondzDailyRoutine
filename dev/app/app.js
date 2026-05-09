const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";
const USEN_REQUEST_BASE_URL = "https://usen.oshireq.com/song/";
const X_POST_URL = "https://twitter.com/intent/tweet?text=";
const THREADS_URL = "https://www.threads.net/";
const YOUTUBE_THUMBNAIL_BASE_URL = "https://img.youtube.com/vi/";
const TIMELESZ_SPOTIFY_ARTIST_URL = "https://open.spotify.com/intl-ja/artist/1ZFfhzyXjPvbzSYPlCIwo3";

// ==================================================
// DOM: 共通ナビゲーション
// ==================================================
// 画面上部の戻る・使い方エリア
const stepTopActionBarElement = document.getElementById("stepTopActionBar");
// 戻るボタン
const backStepButtonElement = document.getElementById("backStepButton");
// ステップ画面用の使い方ボタン
const stepUsageButtonElement = document.getElementById("stepUsageButton");

// ==================================================
// DOM: ホーム画面
// ==================================================

// ホーム画面全体
const homeStepElement = document.getElementById("homeStep");
// 開始ボタン
const startRoutineButtonElement = document.getElementById("startRoutineButton");
// ホーム画面の導入案内カード（ブラウザ限定）
const homeInstallGuideCardElement = document.getElementById("homeInstallGuideCard");
// 導入案内カード内の「詳しくはこちら」ボタン（ブラウザ限定）
const openHowToFromHomeCardButtonElement = document.getElementById("openHowToFromHomeCardButton");
// 期間限定タスク表示エリア
const homeOnceTaskListElement = document.getElementById("homeOnceTaskList");
// お知らせ表示エリア
const homeInfoListElement = document.getElementById("homeInfoList");
// ホーム下部の「初回設定」ボタン
const openHowToButtonElement = document.getElementById("openHowToButton");
// ホーム下部の「使い方」ボタン
const openUsageButtonElement = document.getElementById("openUsageButton");

// ==================================================
// DOM: 初回設定モーダル
// ==================================================
// 初回設定モーダル全体
const howToModalElement = document.getElementById("howToModal");
// 初回設定モーダルの閉じるボタン
const closeHowToButtonElement = document.getElementById("closeHowToButton");

// ==================================================
// DOM: 使い方モーダル
// ==================================================

// 使い方モーダル全体
const usageModalElement = document.getElementById("usageModal");
// 使い方モーダルの閉じるボタン
const closeUsageButtonElement = document.getElementById("closeUsageButton");

// ==================================================
// DOM: STEP 1 Spotify
// ==================================================

// Spotifyステップ画面全体
const spotifyStepElement = document.getElementById("spotifyStep");
// 選択中の曲表示エリア
const selectedAreaElement = document.getElementById("selectedArea");
// 選択中の曲名
const selectedSongNameElement = document.getElementById("selectedSongName");
// Spotifyを開くボタン
const openSpotifyButtonElement = document.getElementById("openSpotifyButton");
// Spotify完了後の次へボタン
const spotifyNextButtonElement = document.getElementById("spotifyNextButton");
// Spotifyエラー表示エリア
const spotifyErrorAreaElement = document.getElementById("spotifyErrorArea");
// おすすめ曲リスト
const recommendedSongsElement = document.getElementById("recommendedSongs");
// その他曲の開閉ボタン
const toggleOtherSongsButtonElement = document.getElementById("toggleOtherSongsButton");
// その他曲の開閉アイコン
const toggleOtherSongsIconElement = document.getElementById("toggleOtherSongsIcon");
// その他曲の開閉ラッパー
const otherSongsWrapperElement = document.getElementById("otherSongsWrapper");
// その他曲リスト
const otherSongsElement = document.getElementById("otherSongs");
// BGMなしボタン
const skipSpotifyButtonElement = document.getElementById("skipSpotifyButton");

// ==================================================
// DOM: STEP 2 期間限定タスク選択
// ==================================================
// 期間限定タスク選択画面全体
const onceListSelectStepElement = document.getElementById("onceListSelectStep");
// 期間限定タスク選択画面のエラー表示エリア
const onceListErrorAreaElement = document.getElementById("onceListErrorArea");
// 期間限定タスクのチェックリスト
const onceTaskListElement = document.getElementById("onceTaskList");
// 選択した期間限定タスクを開始するボタン
const startOnceTasksButtonElement = document.getElementById("startOnceTasksButton");

// ==================================================
// DOM: STEP 2 期間限定タスク実行
// ==================================================
// 期間限定タスク実行画面全体
const onceTaskRunStepElement = document.getElementById("onceTaskRunStep");
// 現在の期間限定タスク進捗
const onceTaskProgressElement = document.getElementById("onceTaskProgress");
// 現在の期間限定タスク名
const onceTaskNameElement = document.getElementById("onceTaskName");
// 現在の期間限定タスク説明・注意文
const onceTaskMessageAreaElement = document.getElementById("onceTaskMessageArea");
// 期間限定タスクのページを開くボタン
const openOnceTaskUrlButtonElement = document.getElementById("openOnceTaskUrlButton");
// 期間限定タスク完了後の次へボタン
const onceTaskNextButtonElement = document.getElementById("onceTaskNextButton");
// 期間限定タスク実行画面のエラー表示エリア
const onceTaskRunErrorAreaElement = document.getElementById("onceTaskRunErrorArea");

// ==================================================
// DOM: STEP 3 USEN推しリク
// ==================================================
// USEN推しリク曲選択画面全体
const requestSongStepElement = document.getElementById("requestSongStep");
// 選択中のリクエスト曲表示エリア
const selectedRequestSongAreaElement = document.getElementById("selectedRequestSongArea");
// 選択中のリクエスト曲名
const selectedRequestSongNameElement = document.getElementById("selectedRequestSongName");
// USEN推しリクページを開くボタン
const openRequestSongButtonElement = document.getElementById("openRequestSongButton");
// USEN推しリク完了後の次へボタン
const requestSongNextButtonElement = document.getElementById("requestSongNextButton");
// USEN推しリクのエラー表示エリア
const requestSongErrorAreaElement = document.getElementById("requestSongErrorArea");
// おすすめリクエスト曲リスト
const recommendedRequestSongsElement = document.getElementById("recommendedRequestSongs");
// その他リクエスト曲の開閉ボタン
const toggleOtherRequestSongsButtonElement = document.getElementById("toggleOtherRequestSongsButton");
// その他リクエスト曲の開閉アイコン
const toggleOtherRequestSongsIconElement = document.getElementById("toggleOtherRequestSongsIcon");
// その他リクエスト曲の開閉ラッパー
const otherRequestSongsWrapperElement = document.getElementById("otherRequestSongsWrapper");
// その他リクエスト曲リスト
const otherRequestSongsElement = document.getElementById("otherRequestSongs");

// ==================================================
// DOM: STEP 4 デイリータスク
// ==================================================
// デイリータスク画面全体
const dailyTaskStepElement = document.getElementById("dailyTaskStep");
// デイリータスク画面上部の説明
const dailyTaskHeaderDescriptionElement = document.getElementById("dailyTaskHeaderDescription");
// 現在のデイリータスクグループ名
const dailyTaskGroupNameElement = document.getElementById("dailyTaskGroupName");
// 現在のデイリータスク進捗
const dailyTaskProgressElement = document.getElementById("dailyTaskProgress");
// 現在のデイリータスク名
const dailyTaskNameElement = document.getElementById("dailyTaskName");
// 現在のデイリータスク説明・注意文
const dailyTaskCommentAreaElement = document.getElementById("dailyTaskCommentArea");
// デイリータスクのページを開くボタン
const openDailyTaskUrlButtonElement = document.getElementById("openDailyTaskUrlButton");
// デイリータスク完了後の次へボタン
const dailyTaskNextButtonElement = document.getElementById("dailyTaskNextButton");
// デイリータスクのエラー表示エリア
const dailyTaskErrorAreaElement = document.getElementById("dailyTaskErrorArea");

// ==================================================
// DOM: STEP 4 デイリーグループ終了
// ==================================================
// デイリーグループ終了画面全体
const dailyGroupEndStepElement = document.getElementById("dailyGroupEndStep");
// 終了したデイリーグループ名
const endedGroupNameElement = document.getElementById("endedGroupName");
// 次のデイリーグループへ進むボタン
const continueDailyGroupButtonElement = document.getElementById("continueDailyGroupButton");
// デイリータスクを終了するボタン
const stopDailyGroupButtonElement = document.getElementById("stopDailyGroupButton");

// ==================================================
// DOM: STEP 5 SNS共有確認
// ==================================================
// SNS共有確認画面全体
const postAskStepElement = document.getElementById("postAskStep");
// 投稿文作成へ進むボタン
const makePostButtonElement = document.getElementById("makePostButton");
// SNS共有をスキップするボタン
const skipPostButtonElement = document.getElementById("skipPostButton");

// ==================================================
// DOM: STEP 5 投稿文編集
// ==================================================

// 投稿文編集画面全体
const postEditStepElement = document.getElementById("postEditStep");
// 投稿文編集画面のエラー表示エリア
const postErrorAreaElement = document.getElementById("postErrorArea");
// 投稿に含める項目のチェックリスト
const postItemListElement = document.getElementById("postItemList");
// 投稿文字数表示
const postTextCountElement = document.getElementById("postTextCount");
// 投稿リンク数表示
const postLinkCountElement = document.getElementById("postLinkCount");
// 生成された投稿文表示エリア
const generatedPostTextElement = document.getElementById("generatedPostText");
// 投稿文をコピーするボタン
const copyPostTextButtonElement = document.getElementById("copyPostTextButton");
// X投稿画面を開くボタン
const openXPostButtonElement = document.getElementById("openXPostButton");
// Threadsを開くボタン
const openThreadsButtonElement = document.getElementById("openThreadsButton");
// 投稿ステップ完了後の次へボタン
const postNextButtonElement = document.getElementById("postNextButton");

// ==================================================
// DOM: STEP 6 YouTube確認
// ==================================================
// YouTubeを見るか確認する画面全体
const youtubeAskStepElement = document.getElementById("youtubeAskStep");
// YouTube選択画面へ進むボタン
const watchYoutubeButtonElement = document.getElementById("watchYoutubeButton");
// YouTubeを見ずに終了するボタン
const finishWithoutYoutubeButtonElement = document.getElementById("finishWithoutYoutubeButton");

// ==================================================
// DOM: STEP 6 YouTube選択
// ==================================================
// YouTube選択画面全体
const youtubeSelectStepElement = document.getElementById("youtubeSelectStep");
// YouTube選択画面のエラー表示エリア
const youtubeErrorAreaElement = document.getElementById("youtubeErrorArea");
// YouTube再生リスト表示行
const youtubePlaylistRowElement = document.getElementById("youtubePlaylistRow");
// YouTube MV表示行
const youtubeMvRowElement = document.getElementById("youtubeMvRow");
// YouTube選択画面から終了するボタン
const finishFromYoutubeButtonElement = document.getElementById("finishFromYoutubeButton");

// ==================================================
// DOM: 完了画面
// ==================================================
// 完了画面全体
const placeholderNextStepElement = document.getElementById("placeholderNextStep");
// 完了メッセージ
const placeholderMessageElement = document.getElementById("placeholderMessage");
// ホームに戻るボタン
const backHomeButtonElement = document.getElementById("backHomeButton");

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
function addClickEvent(element, handler) {
  // HTML側に要素がない場合は何もしない
  if (!element) {
    return;
  }
  element.addEventListener("click", handler);
}
// ==================================================
// クリックイベント設定 - HOME、共通
// ==================================================
// 戻るボタン押下時
addClickEvent(backStepButtonElement, () => {
  goBackStep();
});
// 開始ボタン押下時
addClickEvent(startRoutineButtonElement, () => {
  sendStartLog().catch((error) => {
    console.error("startError", error);
  });
  showOnlyStep(spotifyStepElement);
});
// ==================================================
// クリックイベント設定 - モーダル
// ==================================================
// 画面下部の初回設定ボタン押下時
addClickEvent(openHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
});
// 初回設定モーダルの閉じるボタン押下時
addClickEvent(closeHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.add("hidden");
  }
});
// ホーム画面カード内の初回設定ボタン押下時
addClickEvent(openHowToFromHomeCardButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
});
// 初回設定モーダルの外側タップ時
// モーダル本文をタップした場合は閉じない
if (howToModalElement) {
  howToModalElement.addEventListener("click", (event) => {
    if (event.target === howToModalElement) {
      howToModalElement.classList.add("hidden");
    }
  });
}
// 使い方モーダルを開く共通処理
// ホーム画面下部ボタン・ステップ上部ボタンの両方から使う
const openUsageModal = () => {
  if (usageModalElement) {
    usageModalElement.classList.remove("hidden");
  }
};
// ホーム画面下部の使い方ボタン押下時
addClickEvent(openUsageButtonElement, openUsageModal);
// ステップ画面上部の使い方ボタン押下時
addClickEvent(stepUsageButtonElement, openUsageModal);
// 使い方モーダルの閉じるボタン押下時
addClickEvent(closeUsageButtonElement, () => {
  if (usageModalElement) {
    usageModalElement.classList.add("hidden");
  }
});
// 使い方モーダルの外側タップ時
// モーダル本文をタップした場合は閉じない
if (usageModalElement) {
  usageModalElement.addEventListener("click", (event) => {
    if (event.target === usageModalElement) {
      usageModalElement.classList.add("hidden");
    }
  });
}
// ==================================================
// クリックイベント設定 - Spotify
// ==================================================
// Spotifyで開くボタン押下時
addClickEvent(openSpotifyButtonElement, () => {
  // 曲が未選択の場合はエラー表示して処理を止める
  if (!state.selectedSong) {
    showError(spotifyErrorAreaElement, "曲が選択されていません。");
    return;
  }
  // 選択中の曲からSpotify用URLを作成
  const spotifyUrl = buildSpotifyUrl(state.selectedSong.url);
  // Spotifyを開いた後に進めるよう、次へボタンを表示
  if (spotifyNextButtonElement) {
    spotifyNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openSpotifyButtonElement, "gray");
  setButtonStyle(spotifyNextButtonElement, "primary");
  // Spotify遷移後は曲リストを非表示にして、戻ってきた時の画面を簡略化する
  setSongListVisibility(recommendedSongsElement, false);
  setSongListVisibility(otherSongsWrapperElement, false);
  setSongListVisibility(toggleOtherSongsButtonElement, false);
  // Spotifyを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = "spotifyOpened";
  saveFlowState(state.openedAction, spotifyStepElement);
  // Spotifyへ移動
  location.href = spotifyUrl;
});
// BGMなしボタン押下時
addClickEvent(skipSpotifyButtonElement, async () => {
  // Spotify曲は未選択扱いにする
  state.selectedSong = null;
  // 期間限定タスク選択へ進む
  await showOnceListSelectStep();
});
// Spotifyステップの次へボタン押下時
addClickEvent(spotifyNextButtonElement, async () => {
  // 期間限定タスク選択へ進む
  await showOnceListSelectStep();
});
// Spotifyの「その他」開閉ボタン押下時
addClickEvent(toggleOtherSongsButtonElement, () => {
  // その他曲リストの開閉状態を反転する
  state.isOtherSongsOpen = !state.isOtherSongsOpen;
  // 反転後の状態を画面に反映する
  updateOtherSongsAccordion();
});
// ==================================================
// クリックイベント設定 - 期間限定タスク
// ==================================================
// 期間限定タスク選択画面の次へボタン押下時
addClickEvent(startOnceTasksButtonElement, async () => {
  // チェックされている期間限定タスクを取得
  const selectedTasks = getCheckedOnceTasks();
  // 前回表示されていたエラーを消す
  hideError(onceListErrorAreaElement);
  // 選択された期間限定タスクがない場合は、USEN推しリクへ進む
  if (selectedTasks.length === 0) {
    state.selectedOnceTasks = [];
    state.currentOnceTaskIndex = 0;
    await showRequestSongStep();
    return;
  }
  // 選択された期間限定タスクを保存し、先頭から実行する
  state.selectedOnceTasks = selectedTasks;
  state.currentOnceTaskIndex = 0;
  // 期間限定タスク実行画面へ進む
  showOnceTaskRunStep();
});
// 期間限定タスクのページを開くボタン押下時
addClickEvent(openOnceTaskUrlButtonElement, () => {
  // 現在実行中の期間限定タスクを取得
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  // タスクまたはURLがない場合はエラー表示して処理を止める
  if (!task || !task.url) {
    showError(onceTaskRunErrorAreaElement, "URLが設定されていません。");
    return;
  }
  // ページを開いた後に進めるよう、次へボタンを表示
  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openOnceTaskUrlButtonElement, "gray");
  setButtonStyle(onceTaskNextButtonElement, "primary");
  // 期間限定タスクを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = "onceTaskOpened";
  saveFlowState(state.openedAction, onceTaskRunStepElement);
  // 期間限定タスクのURLへ移動
  location.href = task.url;
});
// 期間限定タスク実行画面の次へボタン押下時
addClickEvent(onceTaskNextButtonElement, async () => {
  // 次の期間限定タスクへ進める
  state.currentOnceTaskIndex += 1;
  // 選択した期間限定タスクがすべて終わったら、USEN推しリクへ進む
  if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
    await showRequestSongStep();
    return;
  }
  // 次の期間限定タスクを画面に表示する
  renderCurrentOnceTask();
});
// ==================================================
// クリックイベント設定 - USEN推し活
// ==================================================
// USEN推しリクの「その他」開閉ボタン押下時
addClickEvent(toggleOtherRequestSongsButtonElement, () => {
  // その他リクエスト曲リストの開閉状態を反転する
  state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;
  // 反転後の状態を画面に反映する
  updateOtherRequestSongsAccordion();
});
// USEN推しリクのページを開くボタン押下時
addClickEvent(openRequestSongButtonElement, () => {
  // リクエスト曲が未選択の場合はエラー表示して処理を止める
  if (!state.selectedRequestSong) {
    showError(requestSongErrorAreaElement, "リクエスト曲が選択されていません。");
    return;
  }
  // 選択中の曲からUSEN推しリク用URLを作成
  const requestUrl = buildRequestSongUrl(state.selectedRequestSong.url);
  // ページを開いた後に進めるよう、次へボタンを表示
  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openRequestSongButtonElement, "gray");
  setButtonStyle(requestSongNextButtonElement, "primary");
  // USEN推しリク遷移後は曲リストを非表示にして、戻ってきた時の画面を簡略化する
  setSongListVisibility(recommendedRequestSongsElement, false);
  setSongListVisibility(otherRequestSongsWrapperElement, false);
  setSongListVisibility(toggleOtherRequestSongsButtonElement, false);
  // USEN推しリクを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = "requestSongOpened";
  saveFlowState(state.openedAction, requestSongStepElement);
  // USEN推しリクページへ移動
  location.href = requestUrl;
});
// USEN推しリクステップの次へボタン押下時
addClickEvent(requestSongNextButtonElement, async () => {
  // デイリータスクへ進む
  await showDailyTaskStep();
});
// ==================================================
// クリックイベント設定 - デイリータスク
// ==================================================
// デイリータスクのページを開くボタン押下時
addClickEvent(openDailyTaskUrlButtonElement, async () => {
  // 現在表示中のデイリータスクを取得
  const item = getCurrentDailyTaskItem();
  // 現在のデイリータスクからURLを取得
  const itemUrl = getDailyTaskItemUrl(item);
  // タスクまたはURLがない場合はエラー表示して処理を止める
  if (!item || !itemUrl) {
    showError(dailyTaskErrorAreaElement, "URLが設定されていません。");
    return;
  }
  // 入力補助が必要なタスクの場合は、ページを開く前にコピー文を作成してクリップボードへ入れる
  if (item["input-flag"] === true) {
    const copyText = buildDailyTaskCopyText(item);
    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText);
        hideError(dailyTaskErrorAreaElement);
      } catch (error) {
        console.error(error);
        showError(dailyTaskErrorAreaElement, "コピーに失敗しました。もう一度ページを開くボタンを押してください。");
        return;
      }
    }
  }
  // 現在のデイリータスクを完了済みとして記録する
  recordCompletedDailyItem(item);
  // ページを開いた後に進めるよう、次へボタンを表示
  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openDailyTaskUrlButtonElement, "gray");
  setButtonStyle(dailyTaskNextButtonElement, "primary");
  // デイリータスクを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = "dailyTaskOpened";
  saveFlowState(state.openedAction, dailyTaskStepElement);
  // デイリータスクのURLへ移動
  location.href = itemUrl;
});
// デイリータスクの次へボタン押下時
addClickEvent(dailyTaskNextButtonElement, () => {
  // 現在表示中のデイリータスクを取得
  const item = getCurrentDailyTaskItem();
  // URLがないタスクは「ページを開く」操作がないため、次へ押下時に完了記録する
  if (item && !getDailyTaskItemUrl(item)) {
    recordCompletedDailyItem(item);
  }
  // 次のデイリータスクへ進める
  state.currentDailyTaskIndex += 1;
  // 現在のデイリータスクグループを取得
  const currentGroup = getCurrentDailyGroup();
  // グループがない、または現在のグループ内のタスクが終わった場合は、グループ終了画面へ進む
  if (!currentGroup || state.currentDailyTaskIndex >= getDailyGroupItems(currentGroup).length) {
    showDailyGroupEndStep();
    return;
  }
  // 次のデイリータスクを画面に表示する
  renderCurrentDailyTask();
});
// デイリーグループ終了画面の「頑張る！」ボタン押下時
addClickEvent(continueDailyGroupButtonElement, () => {
  // 次のデイリータスクグループへ進める
  state.currentDailyGroupIndex += 1;
  // 次のグループの先頭タスクから開始する
  state.currentDailyTaskIndex = 0;
  // すべてのデイリータスクグループが終わった場合は、SNS共有確認へ進む
  if (state.currentDailyGroupIndex >= state.dailyGroups.length) {
    showPostAskStep();
    return;
  }
  // 次のデイリータスクグループを表示する
  // false指定で、デイリータスク全体の再読み込み・初期化はしない
  showDailyTaskStep(false);
});
// デイリーグループ終了画面の「今日はここまで」ボタン押下時
addClickEvent(stopDailyGroupButtonElement, () => {
  // SNS共有確認へ進む
  showPostAskStep();
});
// ==================================================
// クリックイベント設定 - SNSシェア
// ==================================================
// SNS共有確認画面の「共有する！」ボタン押下時
addClickEvent(makePostButtonElement, () => {
  // 投稿文編集画面へ進む
  showPostEditStep();
});
// SNS共有確認画面の「やめとく」ボタン押下時
addClickEvent(skipPostButtonElement, () => {
  // YouTube確認画面へ進む
  showYoutubeAskStep();
});
// 投稿文をコピーするボタン押下時
addClickEvent(copyPostTextButtonElement, async () => {
  // 現在表示されている投稿文を取得
  const postText = getGeneratedPostText();
  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, "コピーする投稿文がありません。");
    return;
  }
  try {
    // 投稿文をクリップボードへコピー
    await navigator.clipboard.writeText(postText);
    // コピー成功後、ボタン文言を一時的に変更する
    if (copyPostTextButtonElement) {
      copyPostTextButtonElement.textContent = "コピーしました";
    }
    // コピー成功時はエラー表示を消す
    hideError(postErrorAreaElement);
  } catch (error) {
    // コピーに失敗した場合は、手動コピーを促す
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
});
// Xに投稿ボタン押下時
addClickEvent(openXPostButtonElement, () => {
  // 現在表示されている投稿文を取得
  const postText = getGeneratedPostText();
  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }
  // X投稿画面用URLを作成して移動
  const url = X_POST_URL + encodeURIComponent(postText);
  location.href = url;
});
// Threadsを開くボタン押下時
addClickEvent(openThreadsButtonElement, async () => {
  // 現在表示されている投稿文を取得
  const postText = getGeneratedPostText();
  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }
  try {
    // Threadsは投稿文をURLに渡せないため、先にクリップボードへコピーする
    await navigator.clipboard.writeText(postText);
    // コピー成功時はエラー表示を消す
    hideError(postErrorAreaElement);
    // Threadsへ移動
    location.href = THREADS_URL;
  } catch (error) {
    // コピーに失敗した場合は、手動コピーを促す
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
});
// 投稿文編集画面の次へボタン押下時
addClickEvent(postNextButtonElement, () => {
  // YouTube確認画面へ進む
  showYoutubeAskStep();
});
// ==================================================
// クリックイベント設定 - YouTube再生
// ==================================================
// YouTube確認画面の「見る！」ボタン押下時
addClickEvent(watchYoutubeButtonElement, async () => {
  // YouTube選択画面へ進む
  await showYoutubeSelectStep();
});
// YouTube確認画面の「今日はここまで」ボタン押下時
addClickEvent(finishWithoutYoutubeButtonElement, () => {
  // 完了画面へ進む
  showPlaceholderNextStep("お疲れ様さまでした☺️Big Love💚");
});
// YouTube選択画面の「今日はここまで」ボタン押下時
addClickEvent(finishFromYoutubeButtonElement, () => {
  // 完了画面へ進む
  showPlaceholderNextStep("お疲れ様さまでした☺️Big Love💚");
});
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
// 関数
// ==================================================
// ホーム画面の初回設定カード表示を更新する関数
function updateHomeInstallGuideVisibility() {
  // 初回設定カードがHTMLに存在しない場合は何もしない
  if (!homeInstallGuideCardElement) {
    return;
  }
  // PWAとしてホーム画面から起動されているか判定する
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  // PWA起動済みの場合は初回設定カードを非表示にする
  homeInstallGuideCardElement.classList.toggle("hidden", isStandalone);
}
//初期表示関数
async function init() {
  try {
    updateHomeInstallGuideVisibility();
    const songs = await loadSpotifySongs();
    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);

    renderSpotifySongList(recommendedSongsElement, recommendedSongs);
    renderSpotifySongList(otherSongsElement, otherSongs);

    if (recommendedSongs.length === 0 && recommendedSongsElement) {
      recommendedSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherSongs.length === 0 && otherSongsElement) {
      otherSongsElement.innerHTML = '<p class="empty-text">その他の曲はありません。</p>';
    }

    updateOtherSongsAccordion();
    state.onceTasks = await loadOnceTasks();
    renderHomeOnceTaskList(state.onceTasks);
    const homeInfoList = await loadHomeInfoList();
    renderHomeInfoList(homeInfoList);
    await restoreFlowStateOrHome();
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "初期データの読み込みに失敗しました。ERROR:JSON");
    renderHomeOnceTaskList([]);
    renderHomeInfoList([]);
    state.currentStepElement = homeStepElement;
    updateStepTopActionBar();
  }
}

async function restoreFlowStateOrHome() {
  const flowState = loadFlowState();
  if (!flowState || !flowState.currentStepId) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  state.selectedSong = flowState.selectedSong || null;
  state.selectedOnceTasks = Array.isArray(flowState.selectedOnceTasks)
    ? flowState.selectedOnceTasks
    : [];
  state.currentOnceTaskIndex = Number(flowState.currentOnceTaskIndex) || 0;
  state.selectedRequestSong = flowState.selectedRequestSong || null;
  state.currentDailyGroupIndex = Number(flowState.currentDailyGroupIndex) || 0;
  state.currentDailyTaskIndex = Number(flowState.currentDailyTaskIndex) || 0;
  state.completedDailyItems = Array.isArray(flowState.completedDailyItems)
    ? flowState.completedDailyItems
    : [];
  state.openedAction = flowState.openedAction || "";

  if (flowState.currentStepId === "spotifyStep") {
    showOnlyStep(spotifyStepElement, { recordHistory: false });

    if (state.selectedSong) {
      selectSong(state.selectedSong);
    }

    if (state.openedAction === "spotifyOpened") {
      spotifyNextButtonElement.classList.remove("hidden");
      setButtonStyle(openSpotifyButtonElement, "gray");
      setButtonStyle(spotifyNextButtonElement, "primary");
    }

    return;
  }

  if (flowState.currentStepId === "onceListSelectStep") {
    await showOnceListSelectStep();
    return;
  }

  if (flowState.currentStepId === "onceTaskRunStep") {
    showOnlyStep(onceTaskRunStepElement, { recordHistory: false });
    renderCurrentOnceTask();

    if (state.openedAction === "onceTaskOpened") {
      onceTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openOnceTaskUrlButtonElement, "gray");
      setButtonStyle(onceTaskNextButtonElement, "primary");
    }

    return;
  }

  if (flowState.currentStepId === "requestSongStep") {
    await showRequestSongStep();

    if (state.selectedRequestSong) {
      selectRequestSong(state.selectedRequestSong);
    }

    if (state.openedAction === "requestSongOpened") {
      requestSongNextButtonElement.classList.remove("hidden");
      setButtonStyle(openRequestSongButtonElement, "gray");
      setButtonStyle(requestSongNextButtonElement, "primary");
    }

    return;
  }

  if (flowState.currentStepId === "dailyTaskStep") {
    await showDailyTaskStep();

    if (state.openedAction === "dailyTaskOpened") {
      dailyTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openDailyTaskUrlButtonElement, "gray");
      setButtonStyle(dailyTaskNextButtonElement, "primary");
    }

    return;
  }

  const stepElement = document.getElementById(flowState.currentStepId);

  if (stepElement) {
    showOnlyStep(stepElement, { recordHistory: false });
    return;
  }

  clearFlowState();
  showOnlyStep(homeStepElement, { recordHistory: false });
}


//期間限定タスク読み込み
async function loadOnceTasks() {
  const response = await fetch("../data/onceListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("onceListJson.json の取得に失敗しました。");
  }

  const tasks = await response.json();

  if (!Array.isArray(tasks)) {
    throw new Error("onceListJson.json が配列形式ではありません。");
  }

  return tasks.filter((task) => {
    return task && task.name && isWithinPeriod(task.from, task.to);
  });
}
//情報読み込み
async function loadHomeInfoList() {
  const response = await fetch("../data/homeInfoListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("homeInfoListJson.json の取得に失敗しました。");
  }

  const informationList = await response.json();

  if (!Array.isArray(informationList)) {
    throw new Error("homeInfoListJson.json が配列形式ではありません。");
  }

  return informationList.filter((item) => {
    return item && item.name && isWithinPeriod(item.from, item.to);
  });
}

function renderHomeOnceTaskList(tasks) {
  if (!homeOnceTaskListElement) {
    return;
  }

  homeOnceTaskListElement.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    homeOnceTaskListElement.innerHTML = '<p class="empty-text">現在、期限内のリクエストはありません。</p>';
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "home-list-item";
    item.textContent = `～${formatTaskLimitDate(task.to)} ${task.name}`;
    homeOnceTaskListElement.appendChild(item);
  });
}

function renderHomeInfoList(items) {
  if (!homeInfoListElement) {
    return;
  }

  homeInfoListElement.innerHTML = "";

  if (!items || items.length === 0) {
    homeInfoListElement.innerHTML = '<p class="empty-text">現在、お知らせはありません。</p>';
    return;
  }

  items.forEach((item) => {
    const dateLabel = formatHomeInfoDateLabel(item);
    const text = dateLabel ? `${dateLabel} ${item.name}` : item.name;
    const hasUrl = item.url && String(item.url).trim() !== "";

    if (hasUrl) {
      const link = document.createElement("a");
      link.className = "home-list-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = text;
      homeInfoListElement.appendChild(link);
      return;
    }

    const div = document.createElement("div");
    div.className = "home-list-item";
    div.textContent = text;
    homeInfoListElement.appendChild(div);
  });
}

function renderSpotifySongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button spotify-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectSong(song);
    });

    container.appendChild(button);
  });
}

function renderRequestSongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button request-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectRequestSong(song);
    });

    container.appendChild(button);
  });
}

function renderYoutubeCardRow(container, items, type) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-text">表示できる項目がありません。</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "youtube-card";

    const thumbnailUrl = getYoutubeThumbnailUrl(item);

    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "youtube-thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = item.name;
      thumbnail.loading = "lazy";
      card.appendChild(thumbnail);
    } else {
      const textCard = document.createElement("div");
      textCard.className = "youtube-text-card";
      textCard.textContent = type === "playlist" ? "再生リスト" : "MV";
      card.appendChild(textCard);
    }

    const name = document.createElement("p");
    name.className = "youtube-card-name";
    name.textContent = item.name;
    card.appendChild(name);

card.addEventListener("click", () => {
  sendYoutubeLog({
    itemId: item.id || item.itemId || createYoutubeLogItemId(item),
    title: item.name || item.title || "",
    url: item.url || ""
  }).catch((error) => {
    console.error("youtubeLog送信失敗", error);
  });

  showPlaceholderNextStep("お疲れ様さまでした☺️Big Love");

  setTimeout(() => {
    location.href = item.url;
  }, 100);
});

    container.appendChild(card);
  });
}

function selectSong(song) {
  state.selectedSong = song;

  if (selectedSongNameElement) {
    selectedSongNameElement.textContent = song.name;
  }

  if (selectedAreaElement) {
    selectedAreaElement.classList.remove("hidden");
  }

  if (spotifyNextButtonElement) {
    spotifyNextButtonElement.classList.add("hidden");
  }
  setButtonStyle(openSpotifyButtonElement, "primary");
  setButtonStyle(spotifyNextButtonElement, "secondary");
  
  setSongListVisibility(recommendedSongsElement, true);
  setSongListVisibility(toggleOtherSongsButtonElement, true);
  updateOtherSongsAccordion();

  updateSelectedButtonStyle(".spotify-song-button", song);
  hideError(spotifyErrorAreaElement);
}

function selectRequestSong(song) {
  state.selectedRequestSong = song;

  if (selectedRequestSongNameElement) {
    selectedRequestSongNameElement.textContent = song.name;
  }

  if (selectedRequestSongAreaElement) {
    selectedRequestSongAreaElement.classList.remove("hidden");
  }

  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.classList.add("hidden");
  }
  setButtonStyle(openRequestSongButtonElement, "primary");
  setButtonStyle(requestSongNextButtonElement, "secondary");
  
  setSongListVisibility(recommendedRequestSongsElement, true);
  setSongListVisibility(toggleOtherRequestSongsButtonElement, true);
  updateOtherRequestSongsAccordion();  

  updateSelectedButtonStyle(".request-song-button", song);
  hideError(requestSongErrorAreaElement);
}

function updateSelectedButtonStyle(selector, selectedSong) {
  const buttons = document.querySelectorAll(selector);

  buttons.forEach((button) => {
    button.classList.toggle("selected", button.textContent === selectedSong.name);
  });
}

function updateOtherSongsAccordion() {
  if (otherSongsWrapperElement) {
    otherSongsWrapperElement.classList.toggle("hidden", !state.isOtherSongsOpen);
  }

  if (toggleOtherSongsIconElement) {
    toggleOtherSongsIconElement.textContent = state.isOtherSongsOpen ? "－" : "＋";
  }
}

function updateOtherRequestSongsAccordion() {
  if (otherRequestSongsWrapperElement) {
    otherRequestSongsWrapperElement.classList.toggle("hidden", !state.isOtherRequestSongsOpen);
  }

  if (toggleOtherRequestSongsIconElement) {
    toggleOtherRequestSongsIconElement.textContent = state.isOtherRequestSongsOpen ? "－" : "＋";
  }
}

async function showOnceListSelectStep() {
  try {
    if (state.onceTasks.length === 0) {
      state.onceTasks = await loadOnceTasks();
    }

    renderOnceTaskCheckList(state.onceTasks);

    showOnlyStep(onceListSelectStepElement);

    hideError(onceListErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "期間限定タスクの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function renderOnceTaskCheckList(tasks) {
  if (!onceTaskListElement) {
    return;
  }

  onceTaskListElement.innerHTML = "";

  if (tasks.length === 0) {
    onceTaskListElement.innerHTML = '<p class="empty-text">現在、期限内の期間限定タスクはありません。</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = task.name;

    checkbox.addEventListener("change", () => {
      name.textContent = task.name;
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    onceTaskListElement.appendChild(label);
  });
}

function getCheckedOnceTasks() {
  if (!onceTaskListElement) {
    return [];
  }

  const checkboxes = onceTaskListElement.querySelectorAll('input[type="checkbox"]');
  const selectedTasks = [];

  checkboxes.forEach((checkbox) => {
    if (!checkbox.checked) {
      return;
    }

    const task = state.onceTasks[Number(checkbox.dataset.index)];

    if (task) {
      selectedTasks.push(task);
    }
  });

  return selectedTasks;
}

function showOnceTaskRunStep() {
  showOnlyStep(onceTaskRunStepElement);
  renderCurrentOnceTask();
}

function renderCurrentOnceTask() {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  const currentNumber = state.currentOnceTaskIndex + 1;
  const totalNumber = state.selectedOnceTasks.length;

  hideError(onceTaskRunErrorAreaElement);

  if (!task) {
    showRequestSongStep();
    return;
  }

  if (onceTaskProgressElement) {
    onceTaskProgressElement.textContent = `${currentNumber} / ${totalNumber}`;
  }

  if (onceTaskNameElement) {
    onceTaskNameElement.textContent = task.name;
  }

  if (onceTaskMessageAreaElement) {
    onceTaskMessageAreaElement.textContent = buildOnceTaskMessage(task);
  }

  if (task.url) {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.add("hidden");
    }
  }

  // 期間限定タスクは、ページを開かなくても次へ進めるようにする
  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }
  setButtonStyle(openOnceTaskUrlButtonElement, "primary");
  setButtonStyle(onceTaskNextButtonElement, "secondary");
}

function buildOnceTaskMessage(task) {
  const messages = [];

  if (task["move-flag"] === true) {
    if (task["alert-message"]) {
      messages.push(task["alert-message"]);
    }

    if (messages.length === 0) {
      messages.push("ページを開いてタスクを完了してください。");
    }

    return messages.join("\n\n");
  }

  if (task["alert-message"]) {
    messages.push(task["alert-message"]);
  }

  if (task["notice-message"]) {
    messages.push(task["notice-message"]);
  }

  if (messages.length === 0) {
    messages.push("ページを開いてタスクを完了してください。");
  }

  return messages.join("\n\n");
}

async function showRequestSongStep() {
  try {
    state.selectedRequestSong = null;
    
    if (selectedRequestSongAreaElement) {
      selectedRequestSongAreaElement.classList.add("hidden");
    }
    
    if (requestSongNextButtonElement) {
      requestSongNextButtonElement.classList.add("hidden");
    }
    
    setButtonStyle(openRequestSongButtonElement, "primary");
    setButtonStyle(requestSongNextButtonElement, "secondary");
    
    setSongListVisibility(recommendedRequestSongsElement, true);
    setSongListVisibility(toggleOtherRequestSongsButtonElement, true);
    
    updateOtherRequestSongsAccordion();
    if (state.requestSongs.length === 0) {
      state.requestSongs = await loadRequestSongs();
    }

    const recommendedRequestSongs = state.requestSongs.filter((song) => song.flag === true);
    const otherRequestSongs = state.requestSongs.filter((song) => song.flag !== true);

    renderRequestSongList(recommendedRequestSongsElement, recommendedRequestSongs);
    renderRequestSongList(otherRequestSongsElement, otherRequestSongs);

    if (recommendedRequestSongs.length === 0 && recommendedRequestSongsElement) {
      recommendedRequestSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherRequestSongs.length === 0 && otherRequestSongsElement) {
      otherRequestSongsElement.innerHTML = '<p class="empty-text">その他の曲はありません。</p>';
    }

    updateOtherRequestSongsAccordion();

    showOnlyStep(requestSongStepElement);

    hideError(requestSongErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(onceTaskRunErrorAreaElement, "リクエスト曲リストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

async function showDailyTaskStep(shouldInitialize = true) {
  try {
    if (shouldInitialize) {
      state.requestTexts = await loadRequestTexts();
      state.dailyGroups = await loadDailyGroups();
      state.currentDailyGroupIndex = 0;
      state.currentDailyTaskIndex = 0;
      state.completedDailyItems = [];
    }

    if (state.dailyGroups.length === 0) {
      showPostAskStep();
      return;
    }

    showOnlyStep(dailyTaskStepElement);
    renderCurrentDailyTask();
  } catch (error) {
    console.error(error);
    showError(requestSongErrorAreaElement, "リクエストループの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function renderCurrentDailyTask() {
  const group = getCurrentDailyGroup();
  const item = getCurrentDailyTaskItem();

  hideError(dailyTaskErrorAreaElement);

  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.add("hidden");
  }

  if (!group || !item) {
    showPostAskStep();
    return;
  }

  const items = getDailyGroupItems(group);
  const itemName = getDailyTaskItemName(item);
  const itemUrl = getDailyTaskItemUrl(item);

  if (dailyTaskHeaderDescriptionElement) {
    dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  }

  if (dailyTaskGroupNameElement) {
    dailyTaskGroupNameElement.textContent = group.listName;
  }

  if (dailyTaskProgressElement) {
    dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  }

  if (dailyTaskNameElement) {
    dailyTaskNameElement.textContent = itemName;
  }

  if (dailyTaskCommentAreaElement) {
    dailyTaskCommentAreaElement.textContent = item.comment || "ページを開いてタスクを完了してください。";
  }

  if (itemUrl) {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.add("hidden");
    }

    if (dailyTaskNextButtonElement) {
      dailyTaskNextButtonElement.classList.remove("hidden");
    }
  }
  setButtonStyle(openDailyTaskUrlButtonElement, "primary");
  setButtonStyle(dailyTaskNextButtonElement, "secondary");
}

function buildDailyTaskCopyText(item) {
  const requestType = item["request-type"];
  const template = state.requestTexts[requestType];

  if (!requestType || !template) {
    return "";
  }

  const musicName = getSelectedRequestSongName();

  return template.replaceAll("musicname", musicName);
}

function buildDailyTaskHeaderDescription() {
  const selectedRequestSongName = getSelectedRequestSongName();

  if (!selectedRequestSongName) {
    return "";
  }

  return `今日のリクエスト曲: ${selectedRequestSongName}\n`;
}

function showDailyGroupEndStep() {
  const group = getCurrentDailyGroup();

  if (!group) {
    showPostAskStep();
    return;
  }

  if (state.currentDailyGroupIndex >= state.dailyGroups.length - 1) {
    showPostAskStep();
    return;
  }

  if (endedGroupNameElement) {
    endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  }

  showOnlyStep(dailyGroupEndStepElement);
}

function recordCompletedDailyItem(item) {
  if (!item) {
    return;
  }

  const name = getDailyTaskItemName(item);
  const url = getDailyTaskItemUrl(item);

  if (!name) {
    return;
  }

  const key = `${name}_${url}`;
  const exists = state.completedDailyItems.some((completedItem) => completedItem.key === key);

  if (exists) {
    return;
  }

  state.completedDailyItems.push({
    key,
    itemId: item.id,
    name,
    url,
  });
}

function showPostAskStep() {
  sendSheetLogOnPostAskStep();

  clearFlowState();

  showOnlyStep(postAskStepElement);
}

function sendSheetLogOnPostAskStep() {
  if (state.isSheetLogSentInCurrentFlow) {
    return;
  }

  const onceListItems = state.selectedOnceTasks.map((task) => {
    return createSheetItem(task, {
      itemId: task.id,
      title: task.name,
      url: task.url || "",
    });
  });

  const listItems = state.completedDailyItems.map((item) => {
    return createSheetItem(item, {
      itemId: item.itemId,
      title: item.name,
      url: item.url || "",
    });
  });

  const spotifyItems = state.selectedSong
    ? [
        createSheetItem(state.selectedSong, {
          itemId: `sp_${state.selectedSong.url}`,
          title: state.selectedSong.name,
          url: buildSpotifyUrl(state.selectedSong.url),
        }),
      ]
    : [];

  const requestSongItems = state.selectedRequestSong
    ? [
        createSheetItem(state.selectedRequestSong, {
          itemId: state.selectedRequestSong.id || `rq_${state.selectedRequestSong.url}`,
          title: state.selectedRequestSong.name,
          url: buildRequestSongUrl(state.selectedRequestSong.url),
        }),
      ]
    : [];

  sendSheetLog({
    onceList: onceListItems,
    list: listItems,
    spotify: spotifyItems,
    requestSong: requestSongItems,
  });

  state.isSheetLogSentInCurrentFlow = true;
}

function showPostEditStep() {
  state.postItems = buildPostItems();

  renderPostItemList(state.postItems);
  updateGeneratedPostText();

  showOnlyStep(postEditStepElement);
  hideError(postErrorAreaElement);
}

function buildPostItems() {
  const items = [];

  items.push({
    id: "app-share",
    name: "このツールをSNSにシェア",
    postText: "",
    url: getAppShareUrl(),
    checked: true,
  });

  items.push({
  id: "usen-request",
  name: "USEN推しリク",
  postText: "USEN推しリク",
  url: getSelectedRequestSongUrl(),
  checked: false,
});

  state.selectedOnceTasks.forEach((task, index) => {
    if (!task || !task.name) {
      return;
    }

    items.push({
      id: `once-${index}`,
      name: task.name,
      url: task.url || "",
      checked: false,
    });
  });

  state.completedDailyItems.forEach((item, index) => {
    if (!item || !item.name) {
      return;
    }

    items.push({
      id: `daily-${index}`,
      name: item.name,
      url: item.url || "",
      checked: false,
    });
  });

  items.push({
    id: "spotify-bgm",
    name: getPostSpotifyName(),
    url: getPostSpotifyUrl(),
    checked: false,
  });

  return items;
}

function renderPostItemList(items) {
  if (!postItemListElement) {
    return;
  }

  postItemListElement.innerHTML = "";

  if (items.length === 0) {
    postItemListElement.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
    return;
  }

  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = item.name;

    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      name.textContent = item.name;
      updateGeneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    postItemListElement.appendChild(label);
  });
}

function updateGeneratedPostText() {
  const postText = buildPostText();

  if (generatedPostTextElement) {
    generatedPostTextElement.textContent = postText;
  }

  const textLength = postText.length;
  const linkCount = countLinks(postText);

  if (postTextCountElement) {
    postTextCountElement.textContent = ``;
    postTextCountElement.classList.toggle("warning-text", textLength > 280);
  }

  if (postLinkCountElement) {
    postLinkCountElement.textContent = `Threadsリンク数: ${linkCount} / 5`;
    postLinkCountElement.classList.toggle("warning-text", linkCount > 5);
  }

  if (copyPostTextButtonElement) {
    copyPostTextButtonElement.textContent = "コピーする";
  }
}

function getGeneratedPostText() {
  return generatedPostTextElement ? generatedPostTextElement.textContent || "" : "";
}

function buildPostText() {
  const lines = buildFixedPostLines();

  state.postItems.forEach((item) => {
    if (!item.checked) return;

    const postText = item.postText ?? item.name;

    if (item.id === "spotify-bgm" || item.id === "app-share") {
      if (postText) {
        lines.push(postText);
      }
    } else {
      lines.push(`✅${postText}`);
    }

    if (item.url) {
      lines.push(item.url);
    }
  });

  lines.push("");
  lines.push("クリックですぐ使えるよ▼");

  return lines.join("\n");
}

function buildFixedPostLines() {
  const selectedRequestSongName = getSelectedRequestSongName();
  const selectedRequestSongUrl = getSelectedRequestSongUrl();

  return [
    `${formatMonthDay(new Date())}「タムごとDaily」タスク完了👍`,
    `${selectedRequestSongName}をリクエストしたよ😊`
  ];
}

async function showYoutubeAskStep() {
  showOnlyStep(youtubeAskStepElement);
}

async function showYoutubeSelectStep() {
  try {
    if (state.youtubePlaylists.length === 0) {
      state.youtubePlaylists = await loadYoutubePlaylists();
    }

    if (state.youtubeMvs.length === 0) {
      state.youtubeMvs = await loadYoutubeMvs();
    }

    renderYoutubeCardRow(youtubePlaylistRowElement, state.youtubePlaylists, "playlist");
    renderYoutubeCardRow(youtubeMvRowElement, state.youtubeMvs, "mv");

    showOnlyStep(youtubeSelectStepElement);
    hideError(youtubeErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(youtubeErrorAreaElement, "YouTubeリストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function getYoutubeThumbnailUrl(item) {
  if (!item) {
    return "";
  }

  if (item.thumbnail) {
    return item.thumbnail;
  }

  const startMovieVideoId = extractYoutubeVideoId(item.startmovie);
  if (startMovieVideoId) {
    return `${YOUTUBE_THUMBNAIL_BASE_URL}${startMovieVideoId}/hqdefault.jpg`;
  }

  const videoId = extractYoutubeVideoId(item.url);
  if (!videoId) {
    return "";
  }

  return `${YOUTUBE_THUMBNAIL_BASE_URL}${videoId}/hqdefault.jpg`;
}

function extractYoutubeVideoId(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const parsedUrl = new URL(text);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0];
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return "";
  } catch {
    return "";
  }
}

function createYoutubeLogItemId(item) {
  if (!item) {
    return "yt_unknown";
  }

  const videoId = extractYoutubeVideoId(item.url) || extractYoutubeVideoId(item.startmovie);

  if (videoId) {
    return `yt_${videoId}`;
  }

  if (item.url) {
    return `yt_${String(item.url).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
  }

  return "yt_unknown";
}

function getAppShareUrl() {
  return `${location.origin}${location.pathname}`;
}

function countLinks(text) {
  const links = text.match(/https?:\/\/\S+/g);
  return links ? links.length : 0;
}

function getCurrentDailyGroup() {
  return state.dailyGroups[state.currentDailyGroupIndex];
}

function getCurrentDailyTaskItem() {
  const group = getCurrentDailyGroup();

  if (!group) {
    return null;
  }

  return getDailyGroupItems(group)[state.currentDailyTaskIndex];
}

function getDailyGroupItems(group) {
  if (!group || !Array.isArray(group.items)) {
    return [];
  }

  return group.items;
}

function getDailyTaskItemName(item) {
  if (!item) {
    return "名称未設定";
  }

  return item.name || item.title || item.listName || "名称未設定";
}

function getDailyTaskItemUrl(item) {
  if (!item) {
    return "";
  }

  return item.url || "";
}

function getSelectedRequestSongName() {
  if (!state.selectedRequestSong) {
    return "";
  }

  return state.selectedRequestSong.name || "";
}

function getSelectedRequestSongUrl() {
  if (!state.selectedRequestSong || !state.selectedRequestSong.url) {
    return "";
  }

  return buildRequestSongUrl(state.selectedRequestSong.url);
}

function getPostSpotifyName() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return "🎧timelesz - Spotify";
  }

  return "🎧本日のBGM";
}

function getPostSpotifyUrl() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return TIMELESZ_SPOTIFY_ARTIST_URL;
  }

  return buildSpotifyUrl(state.selectedSong.url);
}

function showPlaceholderNextStep(message) {
  if (placeholderMessageElement) {
    placeholderMessageElement.textContent = message;
  }

  showOnlyStep(placeholderNextStepElement);
}

function showOnlyStep(activeStepElement, options = {}) {
  if (!activeStepElement) {
    console.error("表示対象の画面が見つかりません。");
    return;
  }

  const shouldRecordHistory = options.recordHistory !== false;

  if (
    shouldRecordHistory &&
    state.currentStepElement &&
    state.currentStepElement !== activeStepElement
  ) {
    state.stepHistory.push(state.currentStepElement);
  }

  const steps = [
    homeStepElement,
    spotifyStepElement,
    onceListSelectStepElement,
    onceTaskRunStepElement,
    requestSongStepElement,
    dailyTaskStepElement,
    dailyGroupEndStepElement,
    postAskStepElement,
    postEditStepElement,
    youtubeAskStepElement,
    youtubeSelectStepElement,
    placeholderNextStepElement,
  ].filter(Boolean);

  steps.forEach((stepElement) => {
    stepElement.classList.toggle("hidden", stepElement !== activeStepElement);
  });

  state.currentStepElement = activeStepElement;
  updateStepTopActionBar();
  
  saveFlowState();
}

function goBackStep() {
  if (state.currentStepElement === dailyTaskStepElement) {
    goBackDailyTask();
    return;
  }

  if (state.currentStepElement === dailyGroupEndStepElement) {
    goBackFromDailyGroupEnd();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackDailyTask() {
  if (state.currentDailyTaskIndex > 0) {
    state.currentDailyTaskIndex -= 1;
    renderCurrentDailyTask();
    return;
  }

  if (state.currentDailyGroupIndex > 0) {
    state.currentDailyGroupIndex -= 1;

    const previousGroup = getCurrentDailyGroup();
    const previousGroupItems = getDailyGroupItems(previousGroup);

    state.currentDailyTaskIndex = Math.max(previousGroupItems.length - 1, 0);
    renderCurrentDailyTask();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(requestSongStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackFromDailyGroupEnd() {
  const currentGroup = getCurrentDailyGroup();
  const currentGroupItems = getDailyGroupItems(currentGroup);

  state.currentDailyTaskIndex = Math.max(currentGroupItems.length - 1, 0);
  showOnlyStep(dailyTaskStepElement, { recordHistory: false });
  renderCurrentDailyTask();
}

function updateStepTopActionBar() {
  if (!stepTopActionBarElement) {
    return;
  }

  const shouldShowTopActionBar =
    state.currentStepElement &&
    state.currentStepElement !== homeStepElement;

  stepTopActionBarElement.classList.toggle("hidden", !shouldShowTopActionBar);
}

function buildSpotifyUrl(trackIdOrUrl) {
  if (trackIdOrUrl.startsWith("http://") || trackIdOrUrl.startsWith("https://")) {
    return trackIdOrUrl;
  }

  return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);
}

function buildRequestSongUrl(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return USEN_REQUEST_BASE_URL + encodeURIComponent(url);
}

function isWithinPeriod(fromValue, toValue) {
  const now = new Date();
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && now < fromDate) {
    return false;
  }

  if (toDate && now > toDate) {
    return false;
  }

  return true;
}

function parseDateTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  if (/^\d{12}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));
    const hour = Number(text.slice(8, 10));
    const minute = Number(text.slice(10, 12));

    return new Date(year, month, day, hour, minute);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

function formatTaskLimitDate(value) {
  const date = parseDateTime(value);

  if (!date) {
    return "期限未設定";
  }

  return formatMonthDay(date);
}

function formatTaskLimitRange(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (!fromDate || !toDate) {
    return "期間未設定";
  }

  return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
}

function formatHomeInfoDateLabel(item) {
  if (!item) {
    return "";
  }

  const releaseDate = parseDateTime(item.release);

  if (releaseDate) {
    return formatMonthDay(releaseDate);
  }

  return formatHomeInfoPeriodLabel(item.from, item.to);
}

function formatHomeInfoPeriodLabel(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && toDate) {
    return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
  }

  if (fromDate) {
    return `${formatMonthDay(fromDate)}〜`;
  }

  if (toDate) {
    return `〜${formatMonthDay(toDate)}`;
  }

  return "";
}

function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function setSongListVisibility(containerElement, shouldShow) {
  if (!containerElement) {
    return;
  }

  containerElement.classList.toggle("hidden", !shouldShow);
}

function setButtonStyle(buttonElement, styleType) {
  if (!buttonElement) {
    return;
  }

  buttonElement.classList.remove("primary-button");
  buttonElement.classList.remove("secondary-button");
  buttonElement.classList.remove("gray-button");

  if (styleType === "primary") {
    buttonElement.classList.add("primary-button");
    return;
  }

  if (styleType === "gray") {
    buttonElement.classList.add("gray-button");
    return;
  }

  buttonElement.classList.add("secondary-button");
}

function hideError(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}
