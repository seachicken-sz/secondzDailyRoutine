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
// ロゴ画像
const homeLogoImageElement = document.getElementById("homeLogoImage");
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
//ホームのSNSシェアボタン
const homeTopShareButtonElement = document.getElementById("homeTopShareButton");
const homeBottomShareButtonElement = document.getElementById("homeBottomShareButton");

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
// リスナー表示
const spotifyListenerInfoElement = document.getElementById("spotifyListenerInfo");
const spotifyListenerCountElement = document.getElementById("spotifyListenerCount");
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

// X版投稿文プレビュータブ
const postPreviewXTabButtonElement = document.getElementById("postPreviewXTabButton");
// Threads版投稿文プレビュータブ
const postPreviewThreadsTabButtonElement = document.getElementById("postPreviewThreadsTabButton");

// X版投稿文パネル
const postPreviewXPanelElement = document.getElementById("postPreviewXPanel");
// Threads版投稿文パネル
const postPreviewThreadsPanelElement = document.getElementById("postPreviewThreadsPanel");

// X版チェックリスト
const postItemXListElement = document.getElementById("postItemXList");
// Threads版チェックリスト
const postItemThreadsListElement = document.getElementById("postItemThreadsList");

// X版文字数表示
const xPostTextCountElement = document.getElementById("xPostTextCount");
// Threads版リンク数表示
const threadsPostLinkCountElement = document.getElementById("threadsPostLinkCount");

// X版投稿文表示エリア
const generatedXPostTextElement = document.getElementById("generatedXPostText");
// Threads版投稿文表示エリア
const generatedThreadsPostTextElement = document.getElementById("generatedThreadsPostText");

// X版投稿文をコピーするボタン
const copyXPostTextButtonElement = document.getElementById("copyXPostTextButton");
// X投稿画面を開くボタン
const openXPostButtonElement = document.getElementById("openXPostButton");
// Threadsを開くボタン
const openThreadsButtonElement = document.getElementById("openThreadsButton");
// 投稿ステップ完了後の次へボタン
const postNextButtonElement = document.getElementById("postNextButton");
//画像生成
const openShareImageModalButtonElement = document.getElementById("openShareImageModalButton");
const shareImageModalElement = document.getElementById("shareImageModal");
const closeShareImageModalButtonElement = document.getElementById("closeShareImageModalButton");
const shareImageCanvasElement = document.getElementById("shareImageCanvas");
const shareImageThemeButtonElements = document.querySelectorAll("[data-share-image-theme]");
const downloadShareImageButtonElement = document.getElementById("downloadShareImageButton");

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
