// ==================================================
// onceTask.js
// 期間限定タスクの選択・実行・次タスク遷移を管理するファイル
// ==================================================

// ==================================================
// 期間限定タスクイベント登録
// ==================================================
// app.js から呼び出して、期間限定タスク画面で使うクリックイベントをまとめて登録する
function bindOnceTaskEvents() {
  // ==================================================
  // 期間限定タスク選択画面：「次へ」ボタン
  // ==================================================

  // 期間限定タスク選択画面の次へボタン押下時
  addClickEvent(startOnceTasksButtonElement, async () => {
    // チェックされている期間限定タスクを取得
    const selectedTasks = getCheckedOnceTasks();

    // 前回表示されていたエラーを消す
    hideError(onceListErrorAreaElement);

    // 選択された期間限定タスクがない場合は、期間限定タスク実行画面をスキップしてUSEN推しリクへ進む
    if (selectedTasks.length === 0) {
      state.selectedOnceTasks = [];
      state.currentOnceTaskIndex = 0;
      await showRequestSongStep();
      return;
    }

    // 選択された期間限定タスクを state に保存
    state.selectedOnceTasks = selectedTasks;

    // 先頭の期間限定タスクから開始する
    state.currentOnceTaskIndex = 0;

    // 期間限定タスク実行画面へ進む
    showOnceTaskRunStep();
  });

  // ==================================================
  // 期間限定タスク実行画面：「ページを開く」ボタン
  // ==================================================

  // 期間限定タスクのページを開くボタン押下時
  addClickEvent(openOnceTaskUrlButtonElement, () => {
    // 現在実行中の期間限定タスクを取得
    const task = state.selectedOnceTasks[state.currentOnceTaskIndex];

    // タスクまたはURLがない場合はエラー表示して処理を止める
    if (!task || !task.url) {
      showError(onceTaskRunErrorAreaElement, MESSAGES.errors.noUrl);
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
    state.openedAction = OPENED_ACTIONS.onceTask;
    saveFlowState(state.openedAction, onceTaskRunStepElement);

    // 期間限定タスクのURLへ移動
    location.href = task.url;
  });

  // ==================================================
  // 期間限定タスク実行画面：「次へ」ボタン
  // ==================================================

  // 期間限定タスク実行画面の次へボタン押下時
  addClickEvent(onceTaskNextButtonElement, async () => {
    // 現在表示中の期間限定タスクを取得
    const currentTask = state.selectedOnceTasks[state.currentOnceTaskIndex];

    // 一人一回限定など、完了済み管理が必要なタスクを完了扱いにする
    markOnceTaskDone(currentTask);

    // 次の期間限定タスクへ進める
    state.currentOnceTaskIndex += 1;

    // 選択した期間限定タスクがすべて終わった場合
    if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
      // 期間限定タスク完了ログを送信する
      // ログ送信に失敗してもユーザー操作は止めない
      sendOnceListLog(state.selectedOnceTasks).catch((error) => {
        console.error("onceListLog送信失敗", error);
      });

      // USEN推しリクへ進む
      await showRequestSongStep();
      return;
    }

    // 次の期間限定タスクを画面に表示する
    renderCurrentOnceTask();
  });
}

// ==================================================
// チェック済み期間限定タスク取得
// ==================================================
// 期間限定タスク選択画面でチェックされているタスクだけを配列で返す
function getCheckedOnceTasks() {
  // 期間限定タスク一覧のDOMがない場合は空配列を返す
  if (!onceTaskListElement) {
    return [];
  }

  // 一覧内のチェックボックスをすべて取得
  const checkboxes = onceTaskListElement.querySelectorAll('input[type="checkbox"]');

  // チェックされているタスクを入れる配列
  const selectedTasks = [];

  // チェックボックスを1件ずつ確認する
  checkboxes.forEach((checkbox) => {
    // チェックされていないものは対象外
    if (!checkbox.checked) {
      return;
    }

    // checkbox.dataset.index には state.onceTasks の配列indexが入っている想定
    const task = state.onceTasks[Number(checkbox.dataset.index)];

    // 対応するタスクが存在する場合だけ選択済みに入れる
    if (task) {
      selectedTasks.push(task);
    }
  });

  // 選択済みタスク一覧を返す
  return selectedTasks;
}

// ==================================================
// 期間限定タスク実行画面表示
// ==================================================
// 期間限定タスク実行画面へ切り替え、現在位置のタスクを描画する
function showOnceTaskRunStep() {
  // 期間限定タスク実行画面を表示
  showOnlyStep(onceTaskRunStepElement);

  // 現在の期間限定タスクを描画
  renderCurrentOnceTask();
}

// ==================================================
// 現在の期間限定タスク描画
// ==================================================
// state.selectedOnceTasks と state.currentOnceTaskIndex をもとに、
// 実行画面へタスク名・進捗・注意文・ボタン状態を反映する
function renderCurrentOnceTask() {
  // 現在表示対象の期間限定タスクを取得
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];

  // 表示中タスクの番号
  const currentNumber = state.currentOnceTaskIndex + 1;

  // 選択された期間限定タスクの総数
  const totalNumber = state.selectedOnceTasks.length;

  // 前回表示されていたエラーを消す
  hideError(onceTaskRunErrorAreaElement);

  // 対象タスクがない場合は、期間限定タスクが終わったものとしてUSEN推しリクへ進む
  if (!task) {
    showRequestSongStep();
    return;
  }

  // 進捗表示を更新
  if (onceTaskProgressElement) {
    onceTaskProgressElement.textContent = `${currentNumber} / ${totalNumber}`;
  }

  // タスク名を表示
  if (onceTaskNameElement) {
    onceTaskNameElement.textContent = task.name;
  }

  // 注意文・補足文を表示
  if (onceTaskMessageAreaElement) {
    onceTaskMessageAreaElement.textContent =
  normalizeDisplayNewlines(buildOnceTaskMessage(task));
  }

  // URLがあるタスクの場合は「ページを開く」ボタンを表示
  if (task.url) {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    // URLがないタスクの場合は「ページを開く」ボタンを非表示
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.add("hidden");
    }
  }

  // 期間限定タスクは、ページを開かなくても次へ進めるようにする
  // URLなしタスクや、すでに別端末で完了済みのタスクを飛ばせるようにするため
  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }

  // ボタン表示を初期状態に戻す
  setButtonStyle(openOnceTaskUrlButtonElement, "primary");
  setButtonStyle(onceTaskNextButtonElement, "secondary");
}

// ==================================================
// 期間限定タスク注意文作成
// ==================================================
// onceListJson の alert-message / notice-message / move-flag をもとに、
// 実行画面に表示する説明文を作る
function buildOnceTaskMessage(task) {
  // 表示する文言を配列で組み立てる
  const messages = [];

  // move-flag === true の場合
  // アプリ遷移などを想定したタスクとして扱う
  if (task["move-flag"] === true) {
    // alert-message があれば優先して表示
    if (task["alert-message"]) {
      messages.push(task["alert-message"]);
    }

    // 表示文が何もない場合はデフォルト文言を入れる
    if (messages.length === 0) {
      messages.push("ページを開いてタスクを完了してください。");
    }

    // 空行区切りで返す
    return messages.join("\n\n");
  }

  // alert-message があれば追加
  if (task["alert-message"]) {
    messages.push(task["alert-message"]);
  }

  // notice-message があれば追加
  if (task["notice-message"]) {
    messages.push(task["notice-message"]);
  }

  // 表示文が何もない場合はデフォルト文言を入れる
  if (messages.length === 0) {
    messages.push("ページを開いてタスクを完了してください。");
  }

  // 複数文言がある場合は空行区切りで返す
  return messages.join("\n\n");
}
