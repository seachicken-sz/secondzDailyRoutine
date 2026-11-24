const RADIO_REQUEST_TEXT_STORAGE_KEY = "tamugoto-radio-request-text-settings";
const GENERIC_RADIO_REQUEST_TEXT_KEY = "text";
const RADIO_REQUEST_SONG_TOKEN = "［曲名］";
const RADIO_REQUEST_SAMPLE_SONG = "消えない花火";
let requestTextSettingsUi;

function isCustomizableRadioRequest(item) {
  const type = item?.["request-type"];
  return item?.["input-flag"] === true && Boolean(item.id) && typeof type === "string" &&
    (type === "text" || (type.startsWith("text-") && !type.startsWith("text-tv-")));
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

function getRadioRequestTextExamples(value) {
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

function getRequestTextCandidates(entry, presets) {
  const fixedText = getFixedRequestText(entry);
  if (isFixedRequestTextMode(entry) && fixedText) return [fixedText];

  const selected = getSelectedRequestTextPresets(entry, presets);
  if (fixedText && entry?.includeFixed !== false && !selected.includes(fixedText)) {
    return [...selected, fixedText];
  }
  return selected;
}

function selectDailyRequestTextTemplate(item, historyPrefix = "") {
  const settingKey = getRadioRequestTextSettingKey(item);
  const requestType = item?.["request-type"];
  const templates = state.requestTexts[requestType];
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
  const modes = form.querySelectorAll("[data-request-text-mode]");
  const example = document.getElementById("requestTextExample");
  const randomSettings = document.getElementById("requestTextRandomSettings");
  const candidateList = document.getElementById("requestTextCandidateList");
  const candidateNote = document.getElementById("requestTextCandidateNote");
  const selectAllButton = document.getElementById("requestTextSelectAll");
  const clearAllButton = document.getElementById("requestTextClearAll");
  const fixedSettings = document.getElementById("requestTextFixedSettings");
  const editor = document.getElementById("requestTextEditor");
  const previewLabel = document.getElementById("requestTextPreviewLabel");
  const preview = document.getElementById("requestTextPreview");
  const saveCloseButton = form.querySelector("[data-setting-save-close]");
  const exampleButton = document.getElementById("requestTextUseExample");
  let items = new Map();
  let editorSelection = null;
  let mode = "random";
  let fixedText = "";
  let presets = [];
  let selectedPresets = new Set();
  let includeFixed = true;

  function createCandidateRow(text, isFixed) {
    const label = document.createElement("label");
    label.className = "check-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = text;
    checkbox.checked = isFixed ? includeFixed : selectedPresets.has(text);
    if (isFixed) checkbox.dataset.fixed = "";
    const description = document.createElement("span");
    const textLabel = formatRadioRequestText(text, RADIO_REQUEST_SONG_TOKEN);
    description.textContent = isFixed ? `固定のリクエスト文\n${textLabel}` : textLabel;
    label.append(checkbox, description);
    return label;
  }

  function renderCandidateList() {
    const rows = presets.map((text) => createCandidateRow(text, false));
    if (fixedText) rows.unshift(createCandidateRow(fixedText, true));
    candidateList.replaceChildren(...rows);
    candidateList.scrollTop = 0;
  }

  function renderPanel() {
    const fixed = mode === "fixed";
    modes.forEach((button) => {
      const selected = button.dataset.requestTextMode === mode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    fixedSettings.classList.toggle("hidden", !fixed);
    randomSettings.classList.toggle("hidden", fixed);
    exampleButton.disabled = example.disabled;

    const total = presets.length + Number(Boolean(fixedText));
    const checked = selectedPresets.size + Number(Boolean(fixedText) && includeFixed);
    selectAllButton.disabled = checked === total;
    clearAllButton.disabled = checked === 0;
    if (checked) {
      const candidates = getRequestTextCandidates({ selectedPresets: [...selectedPresets], text: fixedText, includeFixed }, presets);
      candidateNote.textContent = `選んだ ${candidates.length} 件から抽選します。`;
    } else {
      candidateNote.textContent = "抽選候補がありません。リクエスト文はコピーされません。";
    }

    const songName = getSelectedRadioRequestSongName();
    previewLabel.textContent = fixedText ? "プレビュー" : "プリセット例文";
    if (!songName) previewLabel.textContent += "（サンプル曲名）";
    preview.textContent = formatRadioRequestText(fixedText || example.value, songName || RADIO_REQUEST_SAMPLE_SONG);
  }

  function setOptionMode(option, entry) {
    const modeLabel = isFixedRequestTextMode(entry) ? "固定" : "ランダム";
    const name = option.value === GENERIC_RADIO_REQUEST_TEXT_KEY
      ? "汎用メッセージ"
      : items.get(option.value).name;
    option.textContent = `${name}（${modeLabel}）`;
  }

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

  function showProgram() {
    const entry = getRadioRequestTextSetting(program.value);
    mode = isFixedRequestTextMode(entry) ? "fixed" : "random";
    fixedText = getFixedRequestText(entry);
    const requestType = items.get(program.value)?.["request-type"];
    presets = getRadioRequestTextExamples(state.requestTexts[requestType]);
    selectedPresets = new Set(getSelectedRequestTextPresets(entry, presets));
    includeFixed = entry?.includeFixed !== false;
    setEditorText(fixedText);
    example.replaceChildren(...presets.map((text) => new Option(formatRadioRequestText(text, RADIO_REQUEST_SONG_TOKEN), text)));
    example.disabled = presets.length === 0;
    renderCandidateList();
    renderPanel();
    saveCloseButton.disabled = false;
    status.textContent = mode === "fixed" && !fixedText ? "固定文が空の間はランダムで選びます。" : "";
  }

  function saveTextSettings() {
    const key = program.value;
    if (!items.has(key)) return;
    renderPanel();

    const saved = readRadioRequestTextSettings();
    const previous = getRadioRequestTextSetting(key, saved);
    const entry = {
      mode,
      text: fixedText,
      selectedPresets: selectedPresets.size === presets.length ? null : [...selectedPresets],
      includeFixed
    };
    try {
      localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify({ ...saved, [key]: entry }));
    } catch {
      status.textContent = "設定を保存できませんでした。";
      saveCloseButton.disabled = true;
      return;
    }

    saveCloseButton.disabled = false;
    setOptionMode(program.selectedOptions[0], entry);
    status.textContent = mode === "fixed" && !fixedText ? "固定文が空の間はランダムで選びます。" : "";

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
    fixedText = editor.innerText.replaceAll(RADIO_REQUEST_SONG_TOKEN, "musicname").trim();
    saveTextSettings();
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
    saveEditorText();
  }

  function removeSongToken(token) {
    const range = document.createRange();
    range.setStartBefore(token);
    range.collapse(true);
    token.remove();
    editor.focus();
    moveCaret(range);
    saveEditorText();
  }

  document.addEventListener("selectionchange", () => {
    const range = getSelectionInEditor();
    if (range) editorSelection = range.cloneRange();
  });

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
    if (!event.isComposing) saveEditorText();
  });
  editor.addEventListener("compositionend", saveEditorText);
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain");
    if (text) insertInEditor(document.createTextNode(text));
  });
  editor.addEventListener("drop", (event) => event.preventDefault());

  program.addEventListener("change", showProgram);
  modes.forEach((button) => button.addEventListener("click", () => {
    if (mode === button.dataset.requestTextMode) return;
    mode = button.dataset.requestTextMode;
    if (mode === "random") renderCandidateList();
    saveTextSettings();
  }));
  example.addEventListener("change", renderPanel);
  candidateList.addEventListener("change", (event) => {
    const checkbox = event.target;
    if ("fixed" in checkbox.dataset) includeFixed = checkbox.checked;
    else if (checkbox.checked) selectedPresets.add(checkbox.value);
    else selectedPresets.delete(checkbox.value);
    saveTextSettings();
  });

  function setAllCandidates(checked) {
    selectedPresets = new Set(checked ? presets : []);
    includeFixed = checked;
    candidateList.querySelectorAll("input").forEach((checkbox) => {
      checkbox.checked = checked;
    });
    saveTextSettings();
  }

  selectAllButton.addEventListener("click", () => setAllCandidates(true));
  clearAllButton.addEventListener("click", () => setAllCandidates(false));
  document.getElementById("requestTextInsertSong").addEventListener("click", () => {
    insertInEditor(createSongToken());
  });
  exampleButton.addEventListener("click", () => {
    if (!example.value) return;
    if (fixedText && !window.confirm("固定のリクエスト文を選んだ例文で上書きしますか？")) return;
    fixedText = example.value;
    setEditorText(fixedText);
    saveTextSettings();
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
        .filter(isCustomizableRadioRequest).map((item) => [getRadioRequestTextSettingKey(item), item]));
      if (!items.size) {
        status.textContent = "設定できる番組がありません。";
        return;
      }

      const saved = readRadioRequestTextSettings();
      program.replaceChildren(...Array.from(items.keys(), (id) => {
        const option = new Option("", id);
        setOptionMode(option, getRadioRequestTextSetting(id, saved));
        return option;
      }));
      if (items.has(previousProgram)) program.value = previousProgram;
      form.classList.remove("hidden");
      showProgram();
    }
  };
}
