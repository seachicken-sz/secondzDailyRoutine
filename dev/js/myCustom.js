// マイカスタム：会員設定と、指定位置に挿入する追加タスク
const myCustomStepElement = document.getElementById("myCustomStep");
const MY_CUSTOM_STORAGE_KEY = "tamugotoDailyMyCustom:" + location.pathname;
const MY_CUSTOM_POSITIONS = ["afterSpotify", "afterLimited", "afterUsen", "afterDaily"];
let myCustomOptions = [];
const PHOTO_COLLECTION_DONE_KEY = "tamugotoDailyPhotoCollectionDone:dev";

function getPhotoCollectionDayKey(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isPhotoCollectionTask(task) {
  return /^https:\/\/fumakikuchi\.com\/feature\/morephotocollection(?:[?#]|$)/i.test(String(task?.url || ""));
}

function isMyCustomDailyTaskDone(task) {
  if (task?._localTask === true) return isDailyTaskDone(task);
  if (isPhotoCollectionTask(task)) return localStorage.getItem(PHOTO_COLLECTION_DONE_KEY) === getPhotoCollectionDayKey();
  return false;
}

// 開いた直後の画面は「次へ」を押せるよう保持し、それ以外の完了済みタスクを除外する。
function skipCompletedMyCustomTasks(flow) {
  if (!flow || !Array.isArray(flow.tasks)) return false;
  while (flow.index < flow.tasks.length && !flow.opened && isMyCustomDailyTaskDone(flow.tasks[flow.index])) {
    flow.index += 1;
  }
  return flow.index < flow.tasks.length;
}

function loadMyCustomIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(MY_CUSTOM_STORAGE_KEY) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch (error) {
    return [];
  }
}

async function initializeMyCustom() {
  const list = document.getElementById("myCustomSettingList");
  const status = document.getElementById("myCustomSettingStatus");
  try {
    const data = await loadJsonFile("../data/myCustomJson.json", "myCustomJson.json");
    if (!Array.isArray(data)) throw new Error("マイカスタムのデータ形式が不正です。");
    const seen = new Set();
    myCustomOptions = data.filter((item) => {
      if (!item || typeof item.id !== "string" || !item.id || !item.name ||
          seen.has(item.id) || !MY_CUSTOM_POSITIONS.includes(item.insertPosition) ||
          !Array.isArray(item.tasks)) return false;
      seen.add(item.id);
      return true;
    });
    const selected = new Set(loadMyCustomIds());
    list.replaceChildren();
    myCustomOptions.forEach((item) => {
      const label = document.createElement("label");
      label.className = "select-mode-check-card";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = selected.has(item.id);
      const text = document.createElement("span");
      text.className = "select-mode-check-main";
      const title = document.createElement("strong");
      title.textContent = item.name;
      const description = document.createElement("small");
      description.textContent = item.description || "";
      text.append(title, description);
      label.append(input, text);
      list.append(label);
      input.addEventListener("change", () => {
        if (input.checked) selected.add(item.id);
        else selected.delete(item.id);
        try {
          localStorage.setItem(MY_CUSTOM_STORAGE_KEY, JSON.stringify([...selected]));
          status.textContent = "変更内容は自動で保存されます。";
        } catch (error) {
          input.checked = !input.checked;
          if (input.checked) selected.add(item.id);
          else selected.delete(item.id);
          status.textContent = "保存できませんでした。もう一度お試しください。";
        }
      });
    });
    status.textContent = myCustomOptions.length
      ? "変更内容は自動で保存されます。"
      : "現在設定できる項目はありません。";
  } catch (error) {
    console.error(error);
    status.textContent = "マイカスタムを読み込めませんでした。再読み込みしてください。";
  }
}

function getMyCustomTasks(position) {
  const selected = new Set(loadMyCustomIds());
  return myCustomOptions.filter((item) =>
    selected.has(item.id) && item.insertPosition === position
  ).flatMap((item) => item.tasks.filter((task) =>
    task && task.name && /^https?:\/\//i.test(String(task.url || ""))
  ));
}

async function runMyCustomTasks(position, continuation) {
  const tasks = getMyCustomTasks(position);
  if (position === "afterDaily") tasks.push(...getRoutineLocalTasks());
  const pendingTasks = tasks.filter(task => !isMyCustomDailyTaskDone(task));
  if (!pendingTasks.length) return continueAfterMyCustom(continuation);
  state.myCustomFlow = { tasks: pendingTasks, index: 0, continuation, opened: false };
  renderMyCustomTask();
  showOnlyStep(myCustomStepElement);
}

function renderMyCustomTask() {
  const flow = state.myCustomFlow;
  const task = flow?.tasks?.[flow.index];
  if (!task) return;
  closeMyCustomLocalEditor();
  const local = task._localTask === true;
  document.getElementById("myCustomStepTitle").textContent = local ? "ローカルタスク" : "マイカスタム";
  const groupName = document.getElementById("myCustomLocalGroupName");
  groupName.textContent = local ? task._localGroupName || "" : "";
  groupName.classList.toggle("hidden", !local);
  const progressTasks = flow.tasks.filter(item => Boolean(item._localTask) === local);
  const progressIndex = flow.tasks.slice(0, flow.index + 1).filter(item => Boolean(item._localTask) === local).length;
  document.getElementById("myCustomTaskProgress").textContent =
    progressIndex + " / " + progressTasks.length;
  renderMyCustomLocalCopyPreview(task);
  hideError(document.getElementById("myCustomLocalError"));
  document.getElementById("myCustomTaskName").textContent = task.name;
  document.getElementById("myCustomTaskComment").textContent =
    normalizeDisplayNewlines(task.comment || "");
  setButtonStyle(document.getElementById("openMyCustomTaskButton"), flow.opened ? "gray" : "primary");
  setButtonStyle(document.getElementById("myCustomNextButton"), flow.opened ? "primary" : "secondary");
  document.getElementById("myCustomNextButton").textContent = flow.opened ? "次へ" : "スキップ";
}

function getMyCustomLocalCopyText(task) {
  if (!task?._localTask || task["input-flag"] !== true) return "";
  const template = typeof task._editedLocalCopyTemplate === "string"
    ? task._editedLocalCopyTemplate : selectDailyRequestTextTemplate(task);
  task._preparedLocalCopyTemplate = template;
  // USEN・デイリー用の曲選択を省略した場合は、おかわりDailyの選択曲を使用する。
  const songName = getSelectedRadioRequestSongName() || getHomeSelectedRequestSongName();
  if (!songName && /musicname|［曲名］/.test(template)) return "";
  return normalizeDisplayNewlines(formatRadioRequestText(template, songName));
}

function renderMyCustomLocalCopyPreview(task) {
  const text = getMyCustomLocalCopyText(task);
  const preview = document.getElementById("myCustomLocalCopyPreview");
  task._preparedLocalCopyText = text;
  document.getElementById("myCustomLocalCopyText").textContent = text;
  const editable = task._localTask === true && canEditDailyRequest(task);
  document.getElementById("myCustomLocalEdit").classList.toggle("hidden", !editable);
  preview.classList.toggle("hidden", !text && !editable);
}

async function continueAfterMyCustom(continuation) {
  if (continuation === "afterUsen") {
    if (state.remainingRoutineMode && !hasExecutionDailyTasks()) return finishRoutineAfterDaily();
    return showRadioRequestSongOverrideStep();
  }
  if (continuation === "afterDaily") return showPostAskStep();
  if (continuation === "spotify" || continuation === "onceTask") {
    return advanceRoutineFrom(continuation, true);
  }
}

let myCustomLocalEditingTask = null;

function closeMyCustomLocalEditor() {
  if (!myCustomLocalEditingTask) return;
  myCustomLocalEditingTask = null;
  document.getElementById("myCustomLocalEditPanel").classList.add("hidden");
  document.getElementById("myCustomLocalCopyText").classList.remove("hidden");
  document.getElementById("myCustomLocalEdit").classList.remove("hidden");
  document.getElementById("myCustomLocalCopyNote").textContent = "「ページを開く」を押すと以下がコピーされます。";
  document.getElementById("openMyCustomTaskButton").classList.remove("hidden");
  document.getElementById("myCustomNextButton").classList.remove("hidden");
}

function bindMyCustomLocalEditor() {
  const editor = document.getElementById("myCustomLocalEditor");
  const ui = bindRadioRequestTokenEditor(editor, () => {});
  const save = document.getElementById("myCustomLocalSave");
  const status = document.getElementById("myCustomLocalEditStatus");
  const edit = document.getElementById("myCustomLocalEdit");
  addClickEvent(edit, () => {
    const flow = state.myCustomFlow;
    const task = flow?.tasks?.[flow.index];
    if (task?._localTask !== true || !canEditDailyRequest(task)) return;
    myCustomLocalEditingTask = task;
    ui.setText(task._preparedLocalCopyTemplate || "");
    save.checked = false;
    status.textContent = "";
    document.getElementById("myCustomLocalCopyNote").textContent = "コピーされる文章を編集できます。";
    document.getElementById("myCustomLocalCopyText").classList.add("hidden");
    edit.classList.add("hidden");
    document.getElementById("myCustomLocalEditPanel").classList.remove("hidden");
    document.getElementById("openMyCustomTaskButton").classList.add("hidden");
    document.getElementById("myCustomNextButton").classList.add("hidden");
  });
  addClickEvent(document.getElementById("myCustomLocalInsertSong"), () => ui.insertSong());
  addClickEvent(document.getElementById("myCustomLocalCancel"), closeMyCustomLocalEditor);
  addClickEvent(document.getElementById("myCustomLocalApply"), () => {
    const flow = state.myCustomFlow;
    const task = myCustomLocalEditingTask;
    if (!task || task !== flow?.tasks?.[flow.index]) return;
    const template = ui.getText();
    if (!template) { status.textContent = "文章を入力してください。"; return; }
    const songName = getSelectedRadioRequestSongName() || getHomeSelectedRequestSongName();
    if (!songName && /musicname|［曲名］/.test(template)) { status.textContent = "リクエスト曲を選択してください。"; return; }
    let key = "";
    if (save.checked) {
      try { key = saveEditedRadioRequestText(task, template); }
      catch { status.textContent = "設定を保存できませんでした。"; return; }
    }
    task._editedLocalCopyTemplate = template;
    task._preparedLocalCopyTemplate = template;
    task._preparedLocalCopyText = normalizeDisplayNewlines(formatRadioRequestText(template, songName));
    document.getElementById("myCustomLocalCopyText").textContent = task._preparedLocalCopyText;
    closeMyCustomLocalEditor();
    if (key) {
      const current = getCurrentDailyTaskItem();
      if (current && getRadioRequestTextSettingKey(current) === key) {
        current._preparedCopyText = buildDailyTaskCopyText(current);
        updateDailyTaskCopyPreview(current);
      }
      refreshHomeDailyTaskCopyTexts(key);
    }
  });
}

function bindMyCustomEvents() {
  bindMyCustomLocalEditor();
  addClickEvent(document.getElementById("openMyCustomTaskButton"), async () => {
    const flow = state.myCustomFlow;
    const task = flow?.tasks?.[flow.index];
    if (!task) return;
    if (!flow.opened && isMyCustomDailyTaskDone(task)) {
      if (skipCompletedMyCustomTasks(flow)) {
        renderMyCustomTask();
        saveFlowState();
      } else {
        await continueAfterMyCustom(flow.continuation);
      }
      return;
    }
    if (task._localTask) {
      const copyText = task._preparedLocalCopyText ?? getMyCustomLocalCopyText(task);
      if (copyText) {
        try {
          await navigator.clipboard.writeText(copyText);
        } catch (error) {
          console.error(error);
          showError(document.getElementById("myCustomLocalError"), MESSAGES.errors.dailyCopyFailed);
          return;
        }
      }
      if (state.myCustomFlow !== flow || flow.tasks[flow.index] !== task) return;
      recordCompletedDailyItem(task);
    }
    if (isPhotoCollectionTask(task)) {
      localStorage.setItem(PHOTO_COLLECTION_DONE_KEY, getPhotoCollectionDayKey());
    }
    flow.opened = true;
    renderMyCustomTask();
    saveFlowState();
    openExternalTaskUrl(task.url);
  });
  addClickEvent(document.getElementById("myCustomNextButton"), async () => {
    const flow = state.myCustomFlow;
    if (!flow) return;
    flow.index += 1;
    flow.opened = false;
    if (skipCompletedMyCustomTasks(flow)) {
      renderMyCustomTask();
      saveFlowState();
      return;
    }
    await continueAfterMyCustom(flow.continuation);
  });
}

bindMyCustomEvents();
