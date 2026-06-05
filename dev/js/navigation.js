// ==================================================
// navigation.js
// 画面遷移・戻る操作・上部ナビゲーション表示を管理するファイル
// ==================================================

// ==================================================
// 完了画面表示
// ==================================================
// 完了画面に表示するメッセージをセットして、完了画面だけを表示する
function showPlaceholderNextStep(message) {
  // 完了画面のメッセージ表示エリアが存在する場合だけ文言を反映
  if (placeholderMessageElement) {
    placeholderMessageElement.textContent = message;
  }

  // 完了画面へ遷移
  showOnlyStep(placeholderNextStepElement);
}

// ==================================================
// 画面表示切り替え
// ==================================================
// 指定されたステップ画面だけを表示し、それ以外のステップ画面を非表示にする
function showOnlyStep(activeStepElement, options = {}) {
  // 表示対象の画面要素がない場合は処理しない
  if (!activeStepElement) {
    console.error("表示対象の画面が見つかりません。");
    return;
  }

  // recordHistory: false が指定されていない限り、戻る履歴に現在画面を積む
  const shouldRecordHistory = options.recordHistory !== false;

  // 現在画面があり、かつ次に表示する画面と違う場合だけ履歴に追加
  if (
    shouldRecordHistory &&
    state.currentStepElement &&
    state.currentStepElement !== activeStepElement
  ) {
    state.stepHistory.push(state.currentStepElement);
  }

  // このアプリで切り替え対象になるステップ画面一覧
  // HTML側に存在しない要素が混ざっていても落ちないように filter(Boolean) する
  const steps = [
    homeStepElement,
    spotifyStepElement,
    onceListSelectStepElement,
    onceTaskRunStepElement,
    requestSongStepElement,
    radioRequestSongOverrideStepElement,
    dailyTaskStepElement,
    dailyGroupEndStepElement,
    postAskStepElement,
    postEditStepElement,
    youtubeAskStepElement,
    youtubeSelectStepElement,
    placeholderNextStepElement,
  ].filter(Boolean);

  // activeStepElement だけ表示し、それ以外は hidden を付ける
  steps.forEach((stepElement) => {
    stepElement.classList.toggle("hidden", stepElement !== activeStepElement);
  });

  // 現在表示中の画面を state に保存
  state.currentStepElement = activeStepElement;

  // ホーム以外では上部の「戻る」「使い方」バーを表示する
  updateStepTopActionBar();

  // saveFlow: false が指定されていない限り、途中再開用に現在状態を保存
  if (options.saveFlow !== false) {
    saveFlowState();
  }
}

// ==================================================
// 戻るボタン制御
// ==================================================
// 上部の「戻る」ボタン押下時に、現在画面に応じて前の画面へ戻す
function goBackStep() {
  // デイリータスク画面は、単純な画面履歴ではなく
  // タスク番号・グループ番号を戻す必要があるため専用処理に回す
  if (state.currentStepElement === dailyTaskStepElement) {
    goBackDailyTask();
    return;
  }

  // デイリーグループ終了画面から戻る場合も、
  // 直前のデイリータスク末尾に戻す必要があるため専用処理に回す
  if (state.currentStepElement === dailyGroupEndStepElement) {
    goBackFromDailyGroupEnd();
    return;
  }

  // 通常画面は履歴スタックから直前の画面を取り出す
  const previousStepElement = state.stepHistory.pop();

  // 履歴がない場合はホームへ戻す
  if (!previousStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  // 履歴に残っていた画面へ戻る
  // 戻る操作自体をさらに履歴へ積まないよう recordHistory: false
  showOnlyStep(previousStepElement, { recordHistory: false });
}

// ==================================================
// デイリータスク画面からの戻る制御
// ==================================================
// デイリータスク中の戻る操作は、画面ではなく「タスク位置」を戻す
function goBackDailyTask() {
  // 同じグループ内で2件目以降のタスクを表示している場合は、1つ前のタスクに戻る
  if (state.currentDailyTaskIndex > 0) {
    state.currentDailyTaskIndex -= 1;
    renderCurrentDailyTask();
    return;
  }

  // グループ先頭にいるが、前のグループがある場合は、
  // 前グループの最後のタスクに戻る
  if (state.currentDailyGroupIndex > 0) {
    state.currentDailyGroupIndex -= 1;

    const previousGroup = getCurrentDailyGroup();
    const previousGroupItems = getDailyGroupItems(previousGroup);

    state.currentDailyTaskIndex = Math.max(previousGroupItems.length - 1, 0);
    renderCurrentDailyTask();
    return;
  }

  // デイリータスク全体の先頭にいる場合は、通常の画面履歴へ戻す
  const previousStepElement = state.stepHistory.pop();

  // 履歴がない場合は、直前想定のUSEN推しリク画面へ戻す
  if (!previousStepElement) {
    showOnlyStep(requestSongStepElement, { recordHistory: false });
    return;
  }

  // 履歴に残っていた画面へ戻る
  showOnlyStep(previousStepElement, { recordHistory: false });
}

// ==================================================
// デイリーグループ終了画面からの戻る制御
// ==================================================
// 「もうちょっと頑張る？」画面から、終わったグループの最後のタスクへ戻す
function goBackFromDailyGroupEnd() {
  // 現在のグループを取得
  const currentGroup = getCurrentDailyGroup();

  // 現在のグループ内のタスク一覧を取得
  const currentGroupItems = getDailyGroupItems(currentGroup);

  // グループ内の最後のタスク番号に戻す
  state.currentDailyTaskIndex = Math.max(currentGroupItems.length - 1, 0);

  // デイリータスク画面を表示する
  showOnlyStep(dailyTaskStepElement, { recordHistory: false });

  // 戻したタスク内容を画面に再描画する
  renderCurrentDailyTask();
}

// ==================================================
// 上部アクションバー表示制御
// ==================================================
// ホーム以外の画面では、上部の「戻る」「使い方」バーを表示する
function updateStepTopActionBar() {
  // 上部アクションバー要素がHTMLにない場合は何もしない
  if (!stepTopActionBarElement) {
    return;
  }

  // 現在画面があり、かつホーム画面ではない場合だけ表示
  const shouldShowTopActionBar =
    state.currentStepElement &&
    state.currentStepElement !== homeStepElement;

  // 表示条件を満たさない場合は hidden を付ける
  stepTopActionBarElement.classList.toggle("hidden", !shouldShowTopActionBar);
}
