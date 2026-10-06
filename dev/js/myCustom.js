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
  if (!tasks.length) return continueAfterMyCustom(continuation);
  state.myCustomFlow = { tasks, index: 0, continuation, opened: false };
  renderMyCustomTask();
  showOnlyStep(myCustomStepElement);
}

function renderMyCustomTask() {
  const flow = state.myCustomFlow;
  const task = flow?.tasks?.[flow.index];
  if (!task) return;
  document.getElementById("myCustomTaskProgress").textContent =
    (flow.index + 1) + " / " + flow.tasks.length;
  document.getElementById("myCustomTaskName").textContent = task.name;
  document.getElementById("myCustomTaskComment").textContent =
    normalizeDisplayNewlines(task.comment || "");
  setButtonStyle(document.getElementById("openMyCustomTaskButton"), flow.opened ? "gray" : "primary");
  setButtonStyle(document.getElementById("myCustomNextButton"), flow.opened ? "primary" : "secondary");
  document.getElementById("myCustomNextButton").textContent = flow.opened ? "次へ" : "スキップ";
}

async function continueAfterMyCustom(continuation) {
  if (continuation === "afterUsen") return showRadioRequestSongOverrideStep();
  if (continuation === "afterDaily") return showPostAskStep();
  if (continuation === "spotify" || continuation === "onceTask") {
    return advanceRoutineFrom(continuation, true);
  }
}

function bindMyCustomEvents() {
  addClickEvent(document.getElementById("openMyCustomTaskButton"), () => {
    const flow = state.myCustomFlow;
    const task = flow?.tasks?.[flow.index];
    if (!task) return;
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
