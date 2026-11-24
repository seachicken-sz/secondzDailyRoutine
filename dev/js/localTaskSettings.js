// ローカルタスク：都道府県設定と専用固定リクエスト文
const LOCAL_GROUP_STORAGE_KEY = "tamugotoDailyLocalGroups";
const LOCAL_REQUEST_TEXT_KEY_PREFIX = "local:";

function readEnabledLocalGroupCodes() {
  try {
    const codes = JSON.parse(localStorage.getItem(LOCAL_GROUP_STORAGE_KEY) || "[]");
    return Array.isArray(codes) ? [...new Set(codes.map(String))] : [];
  } catch {
    return [];
  }
}

function getEnabledLocalDailyGroups(codes = readEnabledLocalGroupCodes()) {
  const selected = new Set(codes.map(String));
  return state.localDailyGroups.filter(group => selected.has(String(group.prefectureCode)));
}

function composeDailyGroups(codes = readEnabledLocalGroupCodes()) {
  // ホームと文章設定の一覧にはローカルを含める。通常の実行対象は別途絞り込む。
  return [...state.baseDailyGroups, ...getEnabledLocalDailyGroups(codes)];
}

function isEnabledLocalItem(item) {
  return getEnabledLocalDailyGroups().some(group => group.items.some(task => task.id === item?.id));
}

function getRoutineLocalTasks() {
  const codes = Array.isArray(state.routineLocalGroupCodes)
    ? state.routineLocalGroupCodes : readEnabledLocalGroupCodes();
  return getEnabledLocalDailyGroups(codes).flatMap(group => group.items
    .filter(item => item?.name && /^(https?:\/\/|mailto:)/i.test(String(item.url || "")))
    .filter(item => !state.remainingRoutineMode || !isDailyTaskDone(item))
    .map(item => ({ ...item, _localTask: true, _localGroupName: group.listName })));
}

function isLocalRequestText(item) {
  return state.requestTexts?.[item?.["request-type"]]?.localFlag === true;
}

function getLocalRequestTextKey(type) {
  return LOCAL_REQUEST_TEXT_KEY_PREFIX + type;
}

function getLocalRequestTextDefault(type) {
  const value = state.requestTexts?.[type];
  return value?.localFlag === true && typeof value.text === "string" ? value.text : "";
}

function getLocalRequestText(type) {
  const saved = getRadioRequestTextSetting(getLocalRequestTextKey(type));
  return typeof saved?.text === "string" ? saved.text : getLocalRequestTextDefault(type);
}

function getEnabledLocalItemsForType(type) {
  return getEnabledLocalDailyGroups().flatMap(group => group.items)
    .filter(item => item["request-type"] === type);
}

function getLocalRequestTextLabel(type) {
  const items = getEnabledLocalItemsForType(type);
  return items.length > 1
    ? "ローカル：" + items.map(item => item["short-name"] || item.name).join("・") + "（共通）"
    : "ローカル：" + (items[0]?.name || type);
}

function saveLocalRequestText(type, text) {
  const key = getLocalRequestTextKey(type);
  const saved = readRadioRequestTextSettings();
  const previous = getLocalRequestText(type);
  localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify({
    ...saved, [key]: { mode: "fixed", text }
  }));
  if (previous === text) return;
  const current = getCurrentDailyTaskItem();
  if (getRadioRequestTextSettingKey(current) === key) {
    current._preparedCopyText = buildDailyTaskCopyText(current);
    updateDailyTaskCopyPreview(current);
  }
  refreshHomeDailyTaskCopyTexts(key);
  if (state.currentStepElement === myCustomStepElement &&
      getRadioRequestTextSettingKey(state.myCustomFlow?.tasks?.[state.myCustomFlow.index]) === key) {
    renderMyCustomTask();
  }
}

// 同じ request-type の文章は両設定画面で同じ保存データを参照する。
function createLocalRequestTextEditor(type, items, status) {
  const panel = document.createElement("div");
  panel.className = "local-request-editor";
  panel.dataset.localRequestType = type;
  const title = document.createElement("strong");
  title.textContent = items.length > 1 ? "共通リクエスト文章" : "リクエスト文章";
  const editor = document.createElement("textarea");
  editor.className = "local-request-textarea";
  editor.rows = 4;
  editor.setAttribute("aria-label", items.map(item => item.name).join("・") + "のリクエスト文章");
  const initial = () => getLocalRequestTextDefault(type);
  const display = text => formatRadioRequestText(text, RADIO_REQUEST_SONG_TOKEN);
  editor.value = display(getLocalRequestText(type));
  const insert = document.createElement("button");
  insert.type = "button";
  insert.className = "local-request-edit-action";
  insert.textContent = "曲名を挿入";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "local-request-edit-action";
  reset.textContent = "初期文章に戻す";
  const note = document.createElement("small");
  note.className = "select-mode-auto-save-note";
  note.textContent = "変更内容は自動で保存されます。";
  const actions = document.createElement("div");
  actions.className = "local-request-edit-actions";
  actions.append(insert, reset);
  function persist() {
    const value = editor.value.replaceAll(RADIO_REQUEST_SONG_TOKEN, "musicname");
    try {
      saveLocalRequestText(type, value);
      document.querySelectorAll(".local-request-editor").forEach(other => {
        if (other === panel || other.dataset.localRequestType !== type) return;
        other.querySelector("textarea").value = editor.value;
      });
      note.textContent = "変更内容は自動で保存されます。";
      if (status) status.textContent = "";
    } catch (error) {
      note.textContent = "保存できませんでした。もう一度お試しください。";
      if (status) status.textContent = note.textContent;
    }
  }
  editor.addEventListener("input", event => { if (!event.isComposing) persist(); });
  editor.addEventListener("compositionend", persist);
  insert.addEventListener("click", () => {
    editor.setRangeText(RADIO_REQUEST_SONG_TOKEN, editor.selectionStart, editor.selectionEnd, "end");
    editor.focus();
    persist();
  });
  reset.addEventListener("click", () => {
    editor.value = display(initial());
    persist();
  });
  panel.append(title);
  if (items.length > 1) {
    const description = document.createElement("small");
    description.textContent = items.map(item => item["short-name"] || item.name).join("・") + "で使用する文章です。";
    panel.append(description);
  }
  panel.append(editor, actions, note);
  return panel;
}

function renderLocalGroupDetails(group, container) {
  container.replaceChildren();
  const byType = new Map();
  group.items.forEach(item => {
    const task = document.createElement("div");
    task.className = "local-task-detail";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const comment = document.createElement("p");
    comment.textContent = normalizeDisplayNewlines(item.comment || "");
    task.append(name, comment);
    container.append(task);
    if (!isLocalRequestText(item)) return;
    const type = item["request-type"];
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push(item);
  });
  byType.forEach((items, type) => container.append(createLocalRequestTextEditor(type, items)));
}

async function openLocalTaskSettings() {
  const list = document.getElementById("localTaskSettingList");
  const status = document.getElementById("localTaskSettingStatus");
  status.textContent = "読み込み中…";
  list.replaceChildren();
  try {
    await ensureDailyDataLoaded();
    if (!state.localDailyGroupsLoaded) {
      await loadLocalDailyGroups();
      state.dailyGroups = composeDailyGroups();
      renderHomeDailyExtraList(state.dailyGroups);
      refreshSelectModeSettingsUi();
    }
    if (!state.localDailyGroupsLoaded) throw new Error("localListJson.json");
  } catch {
    status.textContent = "ローカルタスクを読み込めませんでした。設定を開き直してください。";
    return;
  }
  const selected = new Set(readEnabledLocalGroupCodes());
  function updateStatus() {
    const groups = getEnabledLocalDailyGroups();
    status.textContent = groups.length + "都道府県・" +
      groups.reduce((sum, group) => sum + group.items.length, 0) + "タスクを有効化（自動保存）";
  }
  state.localDailyGroups.forEach(group => {
    const code = String(group.prefectureCode);
    const wrapper = document.createElement("div");
    wrapper.className = "local-task-group";
    const label = document.createElement("label");
    label.className = "select-mode-check-card";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selected.has(code);
    const name = document.createElement("span");
    name.className = "select-mode-check-main";
    const title = document.createElement("strong");
    title.textContent = group.listName;
    name.append(title);
    const count = document.createElement("small");
    count.textContent = group.items.length + "件";
    const details = document.createElement("div");
    details.className = "local-task-details";
    details.classList.toggle("hidden", !input.checked);
    label.append(input, name, count);
    wrapper.append(label, details);
    list.append(wrapper);
    if (input.checked) renderLocalGroupDetails(group, details);
    input.addEventListener("change", () => {
      if (input.checked) selected.add(code);
      else selected.delete(code);
      try {
        localStorage.setItem(LOCAL_GROUP_STORAGE_KEY, JSON.stringify([...selected]));
      } catch {
        input.checked = !input.checked;
        if (input.checked) selected.add(code);
        else selected.delete(code);
        status.textContent = "保存できませんでした。もう一度お試しください。";
        return;
      }
      details.classList.toggle("hidden", !input.checked);
      if (input.checked) renderLocalGroupDetails(group, details);
      else details.replaceChildren();
      state.dailyGroups = composeDailyGroups();
      renderHomeDailyExtraList(state.dailyGroups);
      refreshSelectModeSettingsUi();
      refreshSettingModalIndexStatus();
      updateStatus();
    });
  });
  if (state.localDailyGroups.length) updateStatus();
  else status.textContent = "現在設定できるローカルタスクはありません。";
}
