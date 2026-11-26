const RADIO_REQUEST_TEXT_STORAGE_KEY = "tamugoto-radio-request-text-settings";
const GENERIC_RADIO_REQUEST_TEXT_KEY = "text";
const RADIO_REQUEST_SONG_TOKEN = "［曲名］";
let requestTextSettingsUi;

function isCustomizableRadioRequest(item) {
  const type = item?.["request-type"];
  return item?.["input-flag"] === true && Boolean(item.id) && typeof type === "string" &&
    (type === "text" || type.startsWith("text-"));
}

function readRadioRequestTextSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(RADIO_REQUEST_TEXT_STORAGE_KEY));
    return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  } catch {
    return {};
  }
}

function getRadioRequestTextSettingKey(item) {
  if (!isCustomizableRadioRequest(item)) return "";
  if (isLocalRequestText(item)) return getLocalRequestTextKey(item["request-type"]);
  return item["request-type"] === "text" ? GENERIC_RADIO_REQUEST_TEXT_KEY : item.id;
}

function getRadioRequestTextSetting(key, settings = readRadioRequestTextSettings()) {
  if (Object.hasOwn(settings, key)) return settings[key];
  if (key !== GENERIC_RADIO_REQUEST_TEXT_KEY) return null;

  // 番組別で保存していた汎用文があれば、使用中の文を優先して引き継ぐ。
  const previous = state.dailyGroups.flatMap((group) => group.items)
    .filter((item) => getRadioRequestTextSettingKey(item) === key)
    .map((item) => Object.hasOwn(settings, item.id) ? settings[item.id] : null);
  return previous.find((entry) => isFixedRequestTextMode(entry) && getFixedRequestText(entry)) ||
    previous.find((entry) => typeof entry?.text === "string" && entry.text.trim()) || null;
}

function isFixedRequestTextMode(entry) {
  return entry?.mode === "fixed" || entry?.mode === "original";
}

function getFixedRequestText(entry) {
  return typeof entry?.text === "string" ? entry.text.trim() : "";
}

function getRequestTextValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value.text : value;
}

function getRequestTextProgramName(type) {
  const name = state.requestTexts?.[type]?.programName;
  return typeof name === "string" ? name.trim() : "";
}

function getRadioRequestTextExamples(value) {
  value = getRequestTextValue(value);
  const templates = Array.isArray(value) ? value : [value];
  return [...new Set(templates.filter((text) => typeof text === "string")
    .map((text) => text.trim()).filter(Boolean))];
}

function getSelectedRequestTextPresets(entry, presets) {
  if (Array.isArray(entry?.selectedPresets)) {
    return presets.filter((text) => entry.selectedPresets.includes(text));
  }
  if (Array.isArray(entry?.favorites) && !Object.hasOwn(entry, "selectedPresets")) {
    const previous = presets.filter((text) => entry.favorites.includes(text));
    if (previous.length) return previous;
  }
  return presets;
}

function includesOriginalRequestText(entry) {
  return entry?.includeOriginal ?? Boolean(entry?.includeFixed === true && getFixedRequestText(entry));
}

function getAppliedFixedRequestText(entry, presets) {
  if (entry?.useOriginal !== true && presets.includes(entry?.fixedPreset)) return entry.fixedPreset;
  return getFixedRequestText(entry);
}

function migrateFixedRequestTextEntry(entry, presets) {
  if (!isFixedRequestTextMode(entry)) return entry;
  const fixed = (entry?.useOriginal !== true && typeof entry?.fixedPreset === "string" && entry.fixedPreset.trim()) || getFixedRequestText(entry);
  if (!fixed) return { ...entry, mode: "random" };
  return { mode: "random", text: fixed, selectedPresets: [], includeOriginal: true };
}

function getRequestTextCandidates(entry, presets) {
  entry = migrateFixedRequestTextEntry(entry, presets);
  const selected = getSelectedRequestTextPresets(entry, presets);
  const original = getFixedRequestText(entry);
  if (original && includesOriginalRequestText(entry) && !selected.includes(original)) {
    return [...selected, original];
  }
  return selected;
}

function selectDailyRequestTextTemplate(item, historyPrefix = "") {
  const settingKey = getRadioRequestTextSettingKey(item);
  const requestType = item?.["request-type"];
  const templates = getRequestTextValue(state.requestTexts[requestType]);
  if (isLocalRequestText(item)) return getLocalRequestText(requestType);
  if (!settingKey) return pickRequestTextTemplate(templates, `${historyPrefix}${requestType}`);

  const setting = getRadioRequestTextSetting(settingKey);
  const candidates = getRequestTextCandidates(setting, getRadioRequestTextExamples(templates));
  return pickRequestTextTemplate(candidates, `${historyPrefix}request_${settingKey}`);
}

function formatRadioRequestText(template, songName) {
  return template.replaceAll(/musicname|［曲名］/g, () => songName);
}

async function openRequestTextSettings() {
  requestTextSettingsUi ??= bindRequestTextSettings();
  await requestTextSettingsUi.open();
}

function bindRequestTextSettings() {
  const form = document.getElementById("requestTextSettingForm");
  const status = document.getElementById("requestTextSettingStatus");
  const program = document.getElementById("requestTextProgram");
  const randomSettings = document.getElementById("requestTextRandomSettings");
  const localSettings = document.getElementById("requestTextLocalSettings");
  const candidateList = document.getElementById("requestTextCandidateList");
  const presetChoices = document.getElementById("requestTextPresetChoices");
  const includeOriginalCheckbox = document.getElementById("requestTextIncludeOriginal");
  const editorPanel = document.getElementById("requestTextOriginalEditorPanel");
  const candidateNote = document.getElementById("requestTextCandidateNote");
  const selectAllButton = document.getElementById("requestTextSelectAll");
  const clearAllButton = document.getElementById("requestTextClearAll");
  const editor = document.getElementById("requestTextEditor");
  const saveCloseButton = form.querySelector("[data-setting-save-close]");
  let items = new Map();
  const tokenEditor = bindRadioRequestTokenEditor(editor, saveEditorText);
  let fixedText = "";
  let presets = [];
  let selectedPresets = new Set();

  function createCandidateRow(text) {
    const label = document.createElement("label");
    label.className = "request-text-choice";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = text;
    checkbox.checked = selectedPresets.has(text);
    const description = document.createElement("span");
    description.textContent = formatRadioRequestText(text, RADIO_REQUEST_SONG_TOKEN);
    label.append(checkbox, description);
    return label;
  }

  function getCurrentEntry() {
    return {
      mode: "random",
      text: fixedText,
      selectedPresets: selectedPresets.size === presets.length ? null : [...selectedPresets],
      includeOriginal: includeOriginalCheckbox.checked
    };
  }

  function renderPanel() {
    editorPanel.classList.toggle("hidden", !includeOriginalCheckbox.checked);

    const total = presets.length + 1;
    const checked = selectedPresets.size + Number(includeOriginalCheckbox.checked);
    selectAllButton.disabled = checked === total;
    clearAllButton.disabled = checked === 0;

    candidateNote.textContent = checked ? `選んだ ${checked} 件` :
      "抽選候補がありません。リクエスト文はコピーされません。";
    if (includeOriginalCheckbox.checked && !fixedText) {
      candidateNote.textContent += "（オリジナル文章は入力後に抽選対象になります）";
    }

  }

  function setOptionLabel(option) {
    if (isLocalRequestText(items.get(option.value))) {
      option.textContent = getLocalRequestTextLabel(items.get(option.value)["request-type"]);
      return;
    }
    const item = items.get(option.value);
    const name = getRequestTextProgramName(item["request-type"]) || (option.value === GENERIC_RADIO_REQUEST_TEXT_KEY
      ? "汎用メッセージ"
      : item.name);
    option.textContent = name;
  }

  function showProgram() {
    const item = items.get(program.value);
    const local = isLocalRequestText(item);
    randomSettings.classList.toggle("hidden", local);
    localSettings.classList.toggle("hidden", !local);
    form.classList.toggle("is-local-request-text", local);
    if (local) {
      localSettings.replaceChildren(createLocalRequestTextEditor(item["request-type"], getEnabledLocalItemsForType(item["request-type"]), status));
      saveCloseButton.disabled = false;
      status.textContent = "";
      return;
    }
    localSettings.replaceChildren();
    const requestType = item?.["request-type"];
    presets = getRadioRequestTextExamples(state.requestTexts[requestType]);
    const entry = migrateFixedRequestTextEntry(getRadioRequestTextSetting(program.value), presets);
    fixedText = getFixedRequestText(entry);
    selectedPresets = new Set(getSelectedRequestTextPresets(entry, presets));
    includeOriginalCheckbox.checked = includesOriginalRequestText(entry);
    tokenEditor.setText(fixedText);
    presetChoices.replaceChildren(...presets.map(createCandidateRow));
    candidateList.scrollTop = 0;
    renderPanel();
    saveCloseButton.disabled = false;
    status.textContent = "";
  }

  function saveTextSettings() {
    const key = program.value;
    if (!items.has(key)) return;
    renderPanel();

    const saved = readRadioRequestTextSettings();
    const previous = getRadioRequestTextSetting(key, saved);
    const entry = getCurrentEntry();
    try {
      localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify({ ...saved, [key]: entry }));
    } catch {
      status.textContent = "設定を保存できませんでした。";
      saveCloseButton.disabled = true;
      return;
    }

    saveCloseButton.disabled = false;
    status.textContent = "";

    // 実行中のタスクを設定から編集しても、表示とコピー内容が一致するようにする。
    const previousCandidates = getRequestTextCandidates(previous, presets);
    const candidates = getRequestTextCandidates(entry, presets);
    if (previousCandidates.length !== candidates.length ||
        previousCandidates.some((text, index) => text !== candidates[index])) {
      const current = getCurrentDailyTaskItem();
      if (getRadioRequestTextSettingKey(current) === key) {
        current._preparedCopyText = buildDailyTaskCopyText(current);
        updateDailyTaskCopyPreview(current);
      }
      refreshHomeDailyTaskCopyTexts(key);
    }
  }

  function saveEditorText() {
    fixedText = tokenEditor.getText();
    saveTextSettings();
  }

  program.addEventListener("change", showProgram);
  includeOriginalCheckbox.addEventListener("change", saveTextSettings);
  presetChoices.addEventListener("change", (event) => {
    const checkbox = event.target;
    if (checkbox.checked) selectedPresets.add(checkbox.value);
    else selectedPresets.delete(checkbox.value);
    saveTextSettings();
  });

  function setAllCandidates(checked) {
    selectedPresets = new Set(checked ? presets : []);
    includeOriginalCheckbox.checked = checked;
    presetChoices.querySelectorAll("input").forEach((checkbox) => {
      checkbox.checked = checked;
    });
    saveTextSettings();
  }

  selectAllButton.addEventListener("click", () => setAllCandidates(true));
  clearAllButton.addEventListener("click", () => setAllCandidates(false));
  document.getElementById("requestTextInsertSong").addEventListener("click", () => {
    tokenEditor.insertSong();
  });
  return {
    async open() {
      const previousProgram = program.value;
      form.classList.add("hidden");
      status.textContent = "読み込み中…";
      try {
        await ensureDailyDataLoaded();
      } catch {
        status.textContent = "番組を読み込めませんでした。設定を開き直してください。";
        return;
      }
      items = new Map(state.dailyGroups.flatMap((group) => group.items)
        .filter(item => isCustomizableRadioRequest(item) && (!isLocalRequestText(item) || isEnabledLocalItem(item)))
        .map((item) => [getRadioRequestTextSettingKey(item), item]));
      if (!items.size) {
        status.textContent = "設定できる番組がありません。";
        return;
      }

      program.replaceChildren(...Array.from(items.keys(), (id) => {
        const option = new Option("", id);
        setOptionLabel(option);
        return option;
      }));
      if (items.has(previousProgram)) program.value = previousProgram;
      form.classList.remove("hidden");
      showProgram();
    }
  };
}

// 曲名トークン付きエディター（設定画面とデイリー実行画面で共通）
function bindRadioRequestTokenEditor(editor, onChange) {
  const selectionController = new AbortController();
  let editorSelection = null;
  function createSongToken() {
    const token = document.createElement("span");
    token.className = "request-text-song-token";
    token.contentEditable = "false";
    token.textContent = RADIO_REQUEST_SONG_TOKEN;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", "曲名を削除");
    token.append(remove);
    return token;
  }

  function setEditorText(template) {
    const parts = template.split(/musicname|［曲名］/);
    editor.replaceChildren();
    parts.forEach((part, index) => {
      if (index) editor.append(createSongToken());
      editor.append(part);
    });
    editorSelection = null;
  }

  function getSelectionInEditor() {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    return range && editor.contains(range.commonAncestorContainer) ? range : null;
  }

  function moveCaret(range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editorSelection = range.cloneRange();
  }

  function insertInEditor(node) {
    const range = getSelectionInEditor()?.cloneRange() || editorSelection || document.createRange();
    if (!editor.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    editor.focus();
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    moveCaret(range);
    onChange();
  }

  function removeSongToken(token) {
    const range = document.createRange();
    range.setStartBefore(token);
    range.collapse(true);
    token.remove();
    editor.focus();
    moveCaret(range);
    onChange();
  }

  document.addEventListener("selectionchange", () => {
    const range = getSelectionInEditor();
    if (range) editorSelection = range.cloneRange();
  }, { signal: selectionController.signal });

  editor.addEventListener("beforeinput", (event) => {
    const backward = event.inputType === "deleteContentBackward";
    if ((!backward && event.inputType !== "deleteContentForward") || event.isComposing) return;
    const caret = getSelectionInEditor();
    if (!caret?.collapsed) return;
    for (const token of editor.querySelectorAll(".request-text-song-token")) {
      const gap = document.createRange();
      gap.selectNode(token);
      const side = gap.comparePoint(caret.startContainer, caret.startOffset);
      if (backward ? side < 0 : side > 0) continue;
      if (side !== 0) {
        gap.collapse(backward ? false : true);
        if (backward) gap.setEnd(caret.startContainer, caret.startOffset);
        else gap.setStart(caret.startContainer, caret.startOffset);
        const between = gap.cloneContents();
        if (between.textContent || between.querySelector("br, div, p")) continue;
      }
      event.preventDefault();
      removeSongToken(token);
      break;
    }
  });

  editor.addEventListener("click", (event) => {
    const button = event.target.closest(".request-text-song-token button");
    if (button) removeSongToken(button.parentElement);
  });
  editor.addEventListener("input", (event) => {
    if (!event.isComposing) onChange();
  });
  editor.addEventListener("compositionend", onChange);
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain");
    if (text) insertInEditor(document.createTextNode(text));
  });
  editor.addEventListener("drop", (event) => event.preventDefault());

  return { dispose: () => selectionController.abort(), setText: setEditorText, getText: () => editor.innerText.replaceAll(RADIO_REQUEST_SONG_TOKEN, "musicname").trim(), insertSong: () => insertInEditor(createSongToken()) };
}

// 実行画面から保存する場合は、この文章のみを次回以降の候補にする。
function saveEditedRadioRequestText(item, template) {
  const key = getRadioRequestTextSettingKey(item);
  const saved = readRadioRequestTextSettings();
  const entry = isLocalRequestText(item) ? { mode: "fixed", text: template } : {
    mode: "random", text: template, selectedPresets: [], includeOriginal: true
  };
  localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify({ ...saved, [key]: entry }));
  return key;
}
