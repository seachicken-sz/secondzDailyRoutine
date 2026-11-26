// ==================================================
// dailyTask.js
// デイリータスクの表示・実行・グループ遷移・完了記録を管理するファイル
// ==================================================

// ==================================================
// デイリータスクイベント登録
// ==================================================
// app.js から呼び出して、デイリータスク画面で使うクリックイベントをまとめて登録する
function bindDailyTaskEvents() {
  bindDailyRequestEditor();
  // ==================================================
  // デイリータスク画面：「ページを開く」ボタン
  // ==================================================

  // デイリータスクのページを開くボタン押下時
  addClickEvent(openDailyTaskUrlButtonElement, async () => {
    // 現在表示中のデイリータスクを取得
    const item = getCurrentDailyTaskItem();

    // 現在のデイリータスクからURLを取得
    const itemUrl = getDailyTaskItemUrl(item);

    // タスクまたはURLがない場合はエラー表示して処理を止める
    if (!item || !itemUrl) {
      showError(dailyTaskErrorAreaElement, MESSAGES.errors.noUrl);
      return;
    }

    // 入力補助が必要なタスクの場合はコピー文をクリップボードへ入れる
    if (item["input-flag"] === true) {
      const copyText = item._preparedCopyText || "";

      // コピー文が作れた場合だけクリップボードへコピーする
      if (copyText) {
        try {
          await navigator.clipboard.writeText(copyText);
          hideError(dailyTaskErrorAreaElement);
        } catch (error) {
          // クリップボードコピーに失敗した場合は、外部ページへ遷移せずエラー表示
          console.error(error);
          showError(dailyTaskErrorAreaElement, MESSAGES.errors.dailyCopyFailed);
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
    state.openedAction = OPENED_ACTIONS.dailyTask;
    saveFlowState(state.openedAction, dailyTaskStepElement);

    // デイリータスクのURLへ移動
    openExternalTaskUrl(itemUrl);
  });

  // ==================================================
  // デイリータスク画面：「次へ」ボタン
  // ==================================================

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
    if (
      !currentGroup ||
      state.currentDailyTaskIndex >= getDailyGroupItems(currentGroup).length
    ) {
      showDailyGroupEndStep();
      return;
    }

    // 次のデイリータスクを画面に表示する
    renderCurrentDailyTask();
  });

  // ==================================================
  // デイリーグループ終了画面：「頑張る！」ボタン
  // ==================================================
  addClickEvent(continueDailyGroupButtonElement, () => {
    const remaining = getRemainingDailyGroupEntries();
    if (!remaining.length) {
      finishRoutineAfterDaily();
      return;
    }
    const selectedIndex = Number(document.getElementById("nextDailyGroupSelect")?.value);
    const next = remaining.find((entry) => entry.index === selectedIndex) || remaining[0];
    state.dailyGroupHistory.push(state.currentDailyGroupIndex);
    state.currentDailyGroupIndex = next.index;
    state.currentDailyTaskIndex = 0;
    state.openedAction = "";
    showDailyTaskStep(false);
  });

  // ==================================================
  // デイリーグループ終了画面：「今日はここまで」ボタン
  // ==================================================
  addClickEvent(stopDailyGroupButtonElement, () => {
    // SNS共有確認へ進む
    finishRoutineAfterDaily();
  });
}
// ==================================================
// デイリータスク画面表示
// ==================================================
// USEN推しリク完了後、または次グループへ進む時に呼ばれる
// shouldInitialize=true の場合はJSON読み込みと状態初期化を行う
async function showDailyTaskStep(shouldInitialize = true) {
  try {
    // 初回表示時だけ、リクエスト文テンプレートとデイリータスクリストを読み込む
    if (shouldInitialize) {
      state.requestTexts = await loadRequestTexts();
      state.dailyGroups = await loadDailyGroups();
      state.currentDailyGroupIndex = 0;
      state.completedDailyGroupIndexes = [];
      state.dailyGroupHistory = [];
      state.currentDailyTaskIndex = 0;
      state.completedDailyItems = [];
    }

    const executionGroups = getExecutionDailyGroups();

    // 実行対象のデイリータスクがない場合は、SNS共有確認へ進む
    if (executionGroups.length === 0) {
      finishRoutineAfterDaily();
      return;
    }

    // デイリータスク画面を表示
    showOnlyStep(dailyTaskStepElement);

    // 現在位置のデイリータスクを描画
    renderCurrentDailyTask();
  } catch (error) {
    console.error(error);
    showError(
      requestSongErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:list"
    );
  }
}

// ==================================================
// 現在のデイリータスク描画
// ==================================================
// state.dailyGroups / currentDailyGroupIndex / currentDailyTaskIndex をもとに、
// 現在のグループ名・タスク名・進捗・コメント・ボタン状態を反映する
function renderCurrentDailyTask() {
  closeDailyRequestEditor();
  // 現在のグループを取得
  const group = getCurrentDailyGroup();

  // 現在のタスクを取得
  const item = getCurrentDailyTaskItem();

  // 現在のタスクに合わせて、やり方モーダルの画像を切り替える
  setDailyTaskStepHelpKey(item);

  // 前回表示されていたエラーを消す
  hideError(dailyTaskErrorAreaElement);

  // 次へボタンはいったん非表示に戻す
  // URLありタスクでは「ページを開く」後に表示される
  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.add("hidden");
  }

  // グループまたはタスクが存在しない場合は、デイリー終了扱いでSNS共有確認へ進む
  if (!group || !item) {
    finishRoutineAfterDaily();
    return;
  }

  // 現在グループ内のタスク一覧
  const items = getDailyGroupItems(group);

  // 表示用タスク名
  const itemName = getDailyTaskItemName(item);

  // タスクURL
  const itemUrl = getDailyTaskItemUrl(item);

  // ヘッダー説明文を更新
  // 例: 今日のリクエスト曲: xxx
  if (dailyTaskHeaderDescriptionElement) {
    dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  }

  // グループ名を表示
  if (dailyTaskGroupNameElement) {
    dailyTaskGroupNameElement.textContent = group.listName;
  }

  // グループ内の進捗を表示
  if (dailyTaskProgressElement) {
    dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  }

  // タスク名を表示
  if (dailyTaskNameElement) {
    dailyTaskNameElement.textContent = itemName;
  }

  // タスクコメントを表示
  if (dailyTaskCommentAreaElement) {
    dailyTaskCommentAreaElement.textContent =
      normalizeDisplayNewlines(
        item.comment || "ページを開いてタスクを完了してください。"
      );
  }

  // 入力補助が必要なタスクは、表示時点でコピー文を確定する
  if (item["input-flag"] === true) {
    item._preparedCopyText = buildDailyTaskCopyText(item);
  } else {
    item._preparedCopyText = "";
  }

  updateDailyTaskCopyPreview(item);

  // URLがあるタスクの場合は「ページを開く」ボタンを表示
  if (itemUrl) {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    // URLがないタスクの場合は「ページを開く」ボタンを非表示
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.add("hidden");
    }

    // URLがないタスクは外部ページを開かないため、そのまま次へ進める
    if (dailyTaskNextButtonElement) {
      dailyTaskNextButtonElement.classList.remove("hidden");
    }
  }

  // ボタン表示を初期状態に戻す
  setButtonStyle(openDailyTaskUrlButtonElement, "primary");
  setButtonStyle(dailyTaskNextButtonElement, "secondary");
}

// ==================================================
// デイリータスク用やり方ボタン設定
// ==================================================
// input-flag があるタスクは入力補助あり版、それ以外は通常版の解説画像を表示する
function setDailyTaskStepHelpKey(item) {
  const dailyTaskHelpButtonElement = document.getElementById("dailyTaskHelpButton");

  if (!dailyTaskHelpButtonElement) {
    return;
  }

  dailyTaskHelpButtonElement.dataset.stepHelpKey =
    item && item["input-flag"] === true
      ? "dailyTask_02"
      : "dailyTask_01";
}

// ==================================================
// デイリータスク用コピー文作成
// ==================================================
function buildDailyTaskCopyText(item) {
  const template = selectDailyRequestTextTemplate(item);
  item._preparedCopyTemplate = template;
  return formatRadioRequestText(template, getSelectedRadioRequestSongName());
}

// ==================================================
// デイリータスクヘッダー説明文作成
// ==================================================
// デイリータスク画面上部に表示する「今日のリクエスト曲」を作成する
function buildDailyTaskHeaderDescription() {
  const selectedRadioRequestSongName = getSelectedRadioRequestSongName();

  if (!selectedRadioRequestSongName) {
    return "";
  }

  return `今日のラジオリクエスト曲: ${selectedRadioRequestSongName}\n`;
}

// ==================================================
// デイリーグループ終了画面表示
// ==================================================
// 現在グループのタスクが終わった時に、次のグループへ進むか中断するかを選ばせる
function getRemainingDailyGroupEntries() {
  return getExecutionDailyGroups().map((group, index) => ({
    group, index, count: getDailyGroupItems(group).length,
  })).filter((entry) => entry.count > 0 && !state.completedDailyGroupIndexes.includes(entry.index));
}

function showDailyGroupEndStep() {
  // 現在のグループを取得
  const group = getCurrentDailyGroup();

  // グループが存在しない場合は、デイリー終了扱いでSNS共有確認へ進む
  if (!group) {
    finishRoutineAfterDaily();
    return;
  }

  if (!state.completedDailyGroupIndexes.includes(state.currentDailyGroupIndex)) {
    state.completedDailyGroupIndexes.push(state.currentDailyGroupIndex);
  }
  const remaining = getRemainingDailyGroupEntries();

  // 未完了グループがなくなったらSNS共有確認へ進む
  if (!remaining.length) {
    finishRoutineAfterDaily();
    return;
  }

  // 終了したグループ名を表示
  if (endedGroupNameElement) {
    endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  }

  const select = document.getElementById("nextDailyGroupSelect");
  const single = document.getElementById("nextDailyGroupSingle");
  const total = document.getElementById("remainingDailyTaskCount");
  if (select && single && total) {
    select.replaceChildren();
    remaining.forEach(({ index, group, count }) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${group.listName}（${count}件）`;
      select.appendChild(option);
    });
    select.value = String(remaining[0].index);
    select.classList.toggle("hidden", remaining.length === 1);
    single.classList.toggle("hidden", remaining.length !== 1);
    single.textContent = select.options[0].textContent;
    total.textContent = `残りのデイリータスク：${remaining.reduce((sum, entry) => sum + entry.count, 0)}件`;
  }

  state.openedAction = "";
  // デイリーグループ終了画面を表示
  showOnlyStep(dailyGroupEndStepElement);
}
  
// ==================================================
// 完了済みデイリータスク記録
// ==================================================
// SNS共有文やログ送信用に、完了したデイリータスクを重複なしで記録する
function recordCompletedDailyItem(item) {
  // タスクがない場合は何もしない
  if (!item) {
    return;
  }

  // 表示用タスク名を取得
  const name = getDailyTaskItemName(item);

  // タスクURLを取得
  const url = getDailyTaskItemUrl(item);

  // 名前がない場合は記録しない
  if (!name) {
    return;
  }

  // 名前 + URL を重複判定キーにする
  const key = `${name}_${url}`;

  // すでに同じタスクが完了済みなら追加しない
  const exists = state.completedDailyItems.some((completedItem) => completedItem.key === key);

  if (exists) {
    return;
  }

  // 完了済みタスク情報を作成
  const completedItem = {
    key,
    itemId: item.id,
    name,
    shortName: item["short-name"] || item.shortName || "",
    url,
  };
  
  // SNS共有文などで使うため、stateにも保持する
  state.completedDailyItems.push(completedItem);
  
  // ホーム画面の「本日実行済み」判定にも使うため、18時切替の完了データに保存する
  if (typeof markDailyTaskDone === "function") {
    markDailyTaskDone(item, "mainFlow");
  }
  
  // デイリータスクログを1件ずつ即時送信する
  // ログ送信に失敗してもユーザー操作は止めない
  sendDailyTaskLog([completedItem]).catch((error) => {
    console.error("dailyTaskLog送信失敗", error);
  });
}

// ==================================================
// 現在のデイリーグループ取得
// ==================================================
// currentDailyGroupIndex をもとに、現在表示対象のグループを返す
function getCurrentDailyGroup() {
  const executionGroups = getExecutionDailyGroups();
  return executionGroups[state.currentDailyGroupIndex] || null;
}

// ==================================================
// 現在のデイリータスク取得
// ==================================================
// 現在グループと currentDailyTaskIndex をもとに、現在表示対象のタスクを返す
function getCurrentDailyTaskItem() {
  // 現在のグループを取得
  const group = getCurrentDailyGroup();

  // グループがない場合は null
  if (!group) {
    return null;
  }

  // 現在グループ内のタスク一覧から、現在位置のタスクを返す
  return getDailyGroupItems(group)[state.currentDailyTaskIndex];
}

// ==================================================
// デイリーグループ内タスク一覧取得
// ==================================================
// group.items が配列ならそのまま返し、不正な場合は空配列を返す
function getDailyGroupItems(group) {
  // グループがない、または items が配列でない場合は空配列
  if (!group || !Array.isArray(group.items)) {
    return [];
  }

  // グループ内タスク一覧を返す
  return group.items;
}

// ==================================================
// デイリータスク名取得
// ==================================================
// name / title / listName の順で表示名を決める
function getDailyTaskItemName(item) {
  // タスクがない場合はフォールバック文言
  if (!item) {
    return "名称未設定";
  }

  // 優先順: name → title → listName → 名称未設定
  return item.name || item.title || item.listName || "名称未設定";
}

// ==================================================
// デイリータスクURL取得
// ==================================================
// URLがないタスクもあるため、なければ空文字を返す
function getDailyTaskItemUrl(item) {
  // タスクがない場合は空文字
  if (!item) {
    return "";
  }

  // URLがあれば返し、なければ空文字
  return item.url || "";
}

function updateDailyTaskCopyPreview(item) {
  const previewArea = document.getElementById("dailyTaskCopyPreviewArea");
  const previewText = document.getElementById("dailyTaskCopyPreviewText");

  if (!previewArea || !previewText) {
    return;
  }

  const copyText = item?._preparedCopyText || "";
  document.getElementById("dailyRequestEdit")?.classList.toggle("hidden", !canEditDailyRequest(item));

  if (item?.["input-flag"] !== true || (!copyText && !canEditDailyRequest(item))) {
    previewArea.classList.add("hidden");
    previewText.textContent = "";
    return;
  }

  previewText.textContent = copyText;

  previewArea.classList.remove("hidden");
}

 // デイリー実行画面の文章編集
let dailyRequestEditorItem = null;
let dailyRequestEditorUi = null;

function canEditDailyRequest(item) {
  return isCustomizableRadioRequest(item) && item["request-type"].startsWith("text-");
}

function closeDailyRequestEditor() {
  if (!dailyRequestEditorItem) return;
  dailyRequestEditorItem = null;
  document.getElementById("dailyRequestEditPanel").classList.add("hidden");
  document.getElementById("dailyTaskCopyPreviewNote").textContent = "「ページを開く」を押すと以下がコピーされます。";
  document.getElementById("dailyTaskCopyPreviewText").classList.remove("hidden");
  document.getElementById("dailyRequestEdit").classList.remove("hidden");
  openDailyTaskUrlButtonElement.classList.toggle("hidden", !getDailyTaskItemUrl(getCurrentDailyTaskItem()));
  dailyTaskNextButtonElement.classList.toggle("hidden", Boolean(getDailyTaskItemUrl(getCurrentDailyTaskItem())) && state.openedAction !== OPENED_ACTIONS.dailyTask);
}

function bindDailyRequestEditor() {
  const editor = document.getElementById("dailyRequestEditor");
  const save = document.getElementById("dailyRequestSave");
  const status = document.getElementById("dailyRequestEditStatus");
  const edit = document.getElementById("dailyRequestEdit");
  dailyRequestEditorUi = bindRadioRequestTokenEditor(editor, () => {});
  addClickEvent(edit, () => {
    const item = getCurrentDailyTaskItem();
    if (!canEditDailyRequest(item)) return;
    dailyRequestEditorItem = item;
    dailyRequestEditorUi.setText(item._preparedCopyTemplate || "");
    save.checked = false;
    document.getElementById("dailyTaskCopyPreviewNote").textContent = "コピーされる文章を編集できます。";
    status.textContent = "";
    edit.classList.add("hidden");
    document.getElementById("dailyTaskCopyPreviewText").classList.add("hidden");
    document.getElementById("dailyRequestEditPanel").classList.remove("hidden");
    openDailyTaskUrlButtonElement.classList.add("hidden");
    dailyTaskNextButtonElement.classList.add("hidden");
  });
  addClickEvent(document.getElementById("dailyRequestInsertSong"), () => dailyRequestEditorUi.insertSong());
  addClickEvent(document.getElementById("dailyRequestCancel"), closeDailyRequestEditor);
  addClickEvent(document.getElementById("dailyRequestApply"), () => {
    const item = dailyRequestEditorItem;
    if (!item || item !== getCurrentDailyTaskItem()) return;
    const template = dailyRequestEditorUi.getText();
    if (!template) {
      status.textContent = "文章を入力してください。";
      return;
    }
    if (save.checked) {
      try {
        const key = saveEditedRadioRequestText(item, template);
        refreshHomeDailyTaskCopyTexts(key);
      } catch (error) {
        status.textContent = "設定を保存できませんでした。";
        return;
      }
    }
    item._preparedCopyTemplate = template;
    item._preparedCopyText = formatRadioRequestText(template, getSelectedRadioRequestSongName());
    closeDailyRequestEditor();
    updateDailyTaskCopyPreview(item);
  });
}
