// ==================================================
// init.js
// アプリ起動時の初期表示・初期データ読み込み・途中再開処理を管理するファイル
// ==================================================

// ==================================================
// ホーム画面：初回設定カード表示制御
// ==================================================
// PWAとしてホーム画面から起動済みの場合、
// ホーム画面の「まずはホーム画面に追加」カードを非表示にする
function updateHomeInstallGuideVisibility() {
  // 初回設定カードがHTMLに存在しない場合は何もしない
  if (!homeInstallGuideCardElement) {
    return;
  }

  // PWAとしてホーム画面から起動されているか判定する
  // iOS Safariは navigator.standalone を使うため、両方チェックする
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  // PWA起動済みの場合は初回設定カードを非表示にする
  // ブラウザ起動の場合は表示する
  homeInstallGuideCardElement.classList.toggle("hidden", isStandalone);
}

// ==================================================
// 初期表示
// ==================================================
// DOMContentLoaded時に呼ばれるメイン初期化処理
// JSON読み込み、ホーム表示、Spotify一覧表示、途中再開までまとめて行う
async function init() {
  try {
    // ホーム画面のPWA案内カード表示を更新
    updateHomeInstallGuideVisibility();
    sendAccessLog();
    // 初回設定モーダル/案内まわりの初期化
    // setting.js 側で定義されている想定
    initializeSetupGuide();
    // Spotify曲一覧JSONを読み込む
    const songs = await loadSpotifySongs();
    // flag === true の曲をおすすめ欄へ、それ以外を「その他」欄へ分ける
    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);
    // Spotifyおすすめ曲リストを描画
    renderSpotifySongList(recommendedSongsElement, recommendedSongs);
    // Spotifyその他曲リストを描画
    renderSpotifySongList(otherSongsElement, otherSongs);
    // おすすめ曲が0件の場合の空表示
    if (recommendedSongs.length === 0 && recommendedSongsElement) {
      recommendedSongsElement.innerHTML = `<p>${MESSAGES.empty.recommendedSongs}</p>`;
    }
    // その他曲が0件の場合の空表示
    if (otherSongs.length === 0 && otherSongsElement) {
      otherSongsElement.innerHTML = `<p>${MESSAGES.empty.otherSongs}</p>`;
    }
    // Spotify「その他」アコーディオンの開閉状態を画面に反映
    updateOtherSongsAccordion();
    // 期間限定タスクJSONを読み込んで state に保持
    state.onceTasks = await loadOnceTasks();
    // ホームのおかわりDaily表示に使うため、デイリータスク系も初期読み込みする
    try {
      state.requestTexts = await loadRequestTexts();
      state.dailyGroups = await loadDailyGroups();
    } catch (dailyLoadError) {
      console.error("ホーム用デイリータスク読み込み失敗", dailyLoadError);
      state.requestTexts = {};
      state.dailyGroups = [];
    }
    // 一人一回系タスクなど、保存済み完了データのうち不要なものを整理
    cleanupOnceTaskDoneMap(state.onceTasks);
    // ホーム画面のお知らせ/Information一覧を読み込み
    const homeInfoList = await loadHomeInfoList();
    // ホーム画面のお知らせ/Information一覧を描画
    renderHomeInfoList(homeInfoList);   
    // ホームのおかわりDailyを描画
    renderHomeDailyExtraList(state.dailyGroups);
    // ホームの期間限定タスクを描画
    renderHomeOnceMoreList(state.onceTasks);
    // ホーム目次を描画
    updateHomeIndex();
    // ホーム目次を描画
    updateHomeIndex();
    // USENランキング表示処理が存在する場合だけ実行
    // musicTop.js 側などで loadRequestRanking が定義されている想定
    if (typeof loadRequestRanking === "function") {
      await loadRequestRanking();
    }
    // 保存済みの途中再開データがあれば復元
    // なければホーム画面を表示
    await restoreFlowStateOrHome();
    } catch (error) {
      // 初期化中に何か失敗した場合は、最低限ホームが壊れないようにする
      console.error(error);
      // Spotify画面のエラー表示エリアに初期読み込み失敗を表示
      showError(spotifyErrorAreaElement, MESSAGES.errors.initialLoadFailed);
      // ホームのお知らせは空配列で描画して落ちないようにする
      renderHomeInfoList([]);
      // おかわりDailyは非表示にする
      if (typeof renderHomeDailyExtraList === "function") {
        renderHomeDailyExtraList([]);
      }
      // 期間限定も非表示にする
      if (typeof renderHomeOnceMoreList === "function") {
        renderHomeOnceMoreList([]);
      }
      // ホーム目次も最低限描画
      if (typeof updateHomeIndex === "function") {
        updateHomeIndex();
      }
      // 現在画面をホーム扱いにする
      state.currentStepElement = homeStepElement;
      // 上部ナビゲーションバーの表示状態を更新
      updateStepTopActionBar();
    }
}

// ==================================================
// デイリータスク関連データの遅延読み込み
// ==================================================
// 途中再開などでデイリータスク画面へ直接戻る場合、
// requestTexts / dailyGroups が未読み込みの可能性があるため、必要な時だけ読み込む
async function ensureDailyDataLoaded() {
  // リクエスト文テンプレートが未読み込みなら読み込む
  if (!state.requestTexts || Object.keys(state.requestTexts).length === 0) {
    state.requestTexts = await loadRequestTexts();
  }

  // デイリータスクグループが未読み込みなら読み込む
  if (!Array.isArray(state.dailyGroups) || state.dailyGroups.length === 0) {
    state.dailyGroups = await loadDailyGroups();
  }
}

// ==================================================
// 途中再開処理
// ==================================================
// localStorage等に保存されたフロー状態を読み込み、
// 最後に表示していたステップへ復元する
async function restoreFlowStateOrHome() {
  // 保存済みの途中再開データを取得
  const flowState = loadFlowState();

  // 保存データがない、または現在ステップIDがない場合はホーム画面を表示
  if (!flowState || !flowState.currentStepId) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  // ==================================================
  // state復元
  // ==================================================
  // Spotifyで選択していた曲
  state.selectedSong = flowState.selectedSong || null;

  // 選択済みの期間限定タスク
  state.selectedOnceTasks = Array.isArray(flowState.selectedOnceTasks)
    ? flowState.selectedOnceTasks
    : [];

  // 期間限定タスクの現在位置
  state.currentOnceTaskIndex = Number(flowState.currentOnceTaskIndex) || 0;

  // USEN推しリクで選択していた曲
  state.selectedRequestSong = flowState.selectedRequestSong || null;

  // デイリータスクの現在グループ位置
  state.currentDailyGroupIndex = Number(flowState.currentDailyGroupIndex) || 0;

  // デイリータスクの現在タスク位置
  state.currentDailyTaskIndex = Number(flowState.currentDailyTaskIndex) || 0;

  // 完了済みデイリータスク一覧
  state.completedDailyItems = Array.isArray(flowState.completedDailyItems)
    ? flowState.completedDailyItems
    : [];

  // 外部ページを開いた状態かどうか
  // 例: Spotifyを開いた後、戻ってきた時に「次へ」ボタンを出すため
  state.openedAction = flowState.openedAction || "";

  // ==================================================
  // Spotify画面の復元
  // ==================================================
  if (flowState.currentStepId === "spotifyStep") {
    // Spotify画面を表示
    showOnlyStep(spotifyStepElement, { recordHistory: false });

    // 選択済み曲があれば、選択状態を画面に反映
    if (state.selectedSong) {
      selectSong(state.selectedSong);
    }

    // Spotifyを開いた後の状態なら、次へボタンを表示してボタン色も復元
    if (state.openedAction === OPENED_ACTIONS.spotify) {
      spotifyNextButtonElement.classList.remove("hidden");
      setButtonStyle(openSpotifyButtonElement, "gray");
      setButtonStyle(spotifyNextButtonElement, "primary");
    }

    return;
  }

  // ==================================================
  // 期間限定タスク選択画面の復元
  // ==================================================
  if (flowState.currentStepId === "onceListSelectStep") {
    // 期間限定タスク選択画面を再表示
    await showOnceListSelectStep();
    return;
  }

  // ==================================================
  // 期間限定タスク実行画面の復元
  // ==================================================
  if (flowState.currentStepId === "onceTaskRunStep") {
    // 期間限定タスク実行画面を表示
    showOnlyStep(onceTaskRunStepElement, { recordHistory: false });

    // 現在位置の期間限定タスクを再描画
    renderCurrentOnceTask();

    // 外部ページを開いた後の状態なら、次へボタンを表示してボタン色も復元
    if (state.openedAction === OPENED_ACTIONS.onceTask) {
      onceTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openOnceTaskUrlButtonElement, "gray");
      setButtonStyle(onceTaskNextButtonElement, "primary");
    }

    return;
  }

  // ==================================================
  // USEN推しリク画面の復元
  // ==================================================
  if (flowState.currentStepId === "requestSongStep") {
    // showRequestSongStep() 内で state.selectedRequestSong が上書き/描画される可能性に備えて退避
    const restoredRequestSong = state.selectedRequestSong;

    // USEN推しリク画面を読み込み・表示
    await showRequestSongStep();

    // 選択済みリクエスト曲があれば、選択状態を画面に反映
    if (restoredRequestSong) {
      selectRequestSong(restoredRequestSong);
    }

    // USEN推しリクページを開いた後の状態なら、次へボタンを表示してボタン色も復元
    if (state.openedAction === OPENED_ACTIONS.requestSong) {
      requestSongNextButtonElement.classList.remove("hidden");
      setButtonStyle(openRequestSongButtonElement, "gray");
      setButtonStyle(requestSongNextButtonElement, "primary");

      // 外部ページを開いた後は曲リストを隠して、戻ってきた時の画面を簡略化
      setSongListVisibility(recommendedRequestSongsElement, false);
      setSongListVisibility(otherRequestSongsWrapperElement, false);
      setSongListVisibility(toggleOtherRequestSongsButtonElement, false);
    }

    return;
  }

  // ==================================================
  // デイリータスク画面の復元
  // ==================================================
  if (flowState.currentStepId === "dailyTaskStep") {
    // 途中再開時はデイリータスク関連データが未読み込みの可能性があるため保証する
    await ensureDailyDataLoaded();

    // デイリータスク画面を表示
    showOnlyStep(dailyTaskStepElement, { recordHistory: false });

    // 現在位置のデイリータスクを再描画
    renderCurrentDailyTask();

    // デイリータスクの外部ページを開いた後の状態なら、次へボタンを表示してボタン色も復元
    if (state.openedAction === OPENED_ACTIONS.dailyTask) {
      dailyTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openDailyTaskUrlButtonElement, "gray");
      setButtonStyle(dailyTaskNextButtonElement, "primary");
    }

    return;
  }

  // ==================================================
  // その他の画面の復元
  // ==================================================
  // 上記で個別復元していない画面は、currentStepId と一致するDOMを探す
  const stepElement = document.getElementById(flowState.currentStepId);

  // 対象ステップがHTMLに存在すれば、その画面を表示
  if (stepElement) {
    showOnlyStep(stepElement, { recordHistory: false });
    return;
  }

  // 保存されていた currentStepId が現在のHTMLに存在しない場合は、
  // 古い保存データの可能性があるため破棄してホームへ戻す
  clearFlowState();
  showOnlyStep(homeStepElement, { recordHistory: false });
}
