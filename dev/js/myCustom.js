// マイカスタム：会員設定と、指定位置に挿入する追加タスク
const myCustomStepElement = document.getElementById("myCustomStep");
const MY_CUSTOM_STORAGE_KEY = "tamugotoDailyMyCustom:" + location.pathname;
const MY_CUSTOM_POSITIONS = ["afterSpotify", "afterLimited", "afterUsen", "afterDaily"];
let myCustomOptions = [];

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
  if (!tasks.length) return continueAfterMyCustom(continuation);
  state.myCustomFlow = { tasks, index: 0, continuation, opened: false };
  renderMyCustomTask();
  showOnlyStep(myCustomStepElement);
}

function renderMyCustomTask() {
  const flow = state.myCustomFlow;
  const task = flow?.tasks?.[flow.index];
  if (!task) return;
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
  const template = selectDailyRequestTextTemplate(task);
  // USEN・デイリー用の曲選択を省略した場合は、おかわりDailyの選択曲を使用する。
  const songName = getSelectedRadioRequestSongName() || getHomeSelectedRequestSongName();
  if (!songName && /musicname|［曲名］/.test(template)) return "";
  return normalizeDisplayNewlines(formatRadioRequestText(template, songName));
}

function renderMyCustomLocalCopyPreview(task) {
  const text = getMyCustomLocalCopyText(task);
  const preview = document.getElementById("myCustomLocalCopyPreview");
  const target = task?.["request-input"];
  document.getElementById("myCustomLocalCopyText").textContent = text;
  document.getElementById("myCustomLocalCopyTarget").textContent =
    target ? "「" + target + "」にペーストしてください。" : "指定の入力欄にペーストしてください。";
  preview.classList.toggle("hidden", !text);
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

function bindMyCustomEvents() {
  addClickEvent(document.getElementById("openMyCustomTaskButton"), async () => {
    const flow = state.myCustomFlow;
    const task = flow?.tasks?.[flow.index];
    if (!task) return;
    if (task._localTask) {
      const copyText = getMyCustomLocalCopyText(task);
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
    flow.opened = true;
    renderMyCustomTask();
    saveFlowState();
    openExternalTaskUrl(task.url);
  });
  addClickEvent(document.getElementById("myCustomNextButton"), async () => {
    const flow = state.myCustomFlow;
    if (!flow) return;
    if (flow.index + 1 < flow.tasks.length) {
      flow.index += 1;
      flow.opened = false;
      renderMyCustomTask();
      saveFlowState();
      return;
    }
    await continueAfterMyCustom(flow.continuation);
  });
}

bindMyCustomEvents();
