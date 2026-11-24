const RADIO_REQUEST_TEXT_STORAGE_KEY = "tamugoto-radio-request-text-settings";
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

function getOriginalRadioRequestText(item) {
  if (!isCustomizableRadioRequest(item)) return "";
  const settings = readRadioRequestTextSettings();
  const entry = Object.hasOwn(settings, item.id) ? settings[item.id] : null;
  return entry?.mode === "original" && typeof entry.text === "string" ? entry.text.trim() : "";
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
  const modes = form.querySelectorAll('[name="requestTextMode"]');
  const originalSettings = document.getElementById("requestTextOriginalSettings");
  const editor = document.getElementById("requestTextEditor");
  const previewLabel = document.getElementById("requestTextPreviewLabel");
  const preview = document.getElementById("requestTextPreview");
  const copyButton = document.getElementById("requestTextCopyPreview");
  const saveCloseButton = form.querySelector("[data-setting-save-close]");
  const exampleButton = document.getElementById("requestTextUseExample");
  let items = new Map();
  let editorSelection = null;

  function getStandardExample() {
    const template = state.requestTexts[items.get(program.value)?.["request-type"]];
    return (Array.isArray(template) ? template[0] : template) || "";
  }

  function getMode() {
    return modes[1].checked ? "original" : "standard";
  }

  function getEditorText() {
    return editor.innerText.replaceAll(RADIO_REQUEST_SONG_TOKEN, "musicname").trim();
  }

  function renderPreview(text) {
    const original = getMode() === "original";
    const songName = getSelectedRadioRequestSongName();
    originalSettings.classList.toggle("hidden", !original);
    previewLabel.textContent = original && text ? "プレビュー" : "標準の例文";
    if (!songName) previewLabel.textContent += "（サンプル曲名）";
    preview.textContent = formatRadioRequestText(
      (original && text) || getStandardExample(), songName || RADIO_REQUEST_SAMPLE_SONG
    );
    copyButton.disabled = !preview.textContent;
  }

  function setOptionMode(option, entry) {
    const modeLabel = entry?.mode === "original" && entry.text ? "オリジナル" : "標準";
    option.textContent = `${items.get(option.value).name}（${modeLabel}）`;
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
    const saved = readRadioRequestTextSettings();
    const entry = Object.hasOwn(saved, program.value) ? saved[program.value] : null;
    modes[entry?.mode === "original" ? 1 : 0].checked = true;
    const text = typeof entry?.text === "string" ? entry.text : "";
    setEditorText(text);
    exampleButton.disabled = !getStandardExample();
    saveCloseButton.disabled = false;
    status.textContent = "";
    renderPreview(text);
  }

  function saveTextSettings() {
    const item = items.get(program.value);
    if (!item) return;
    const mode = getMode();
    const text = getEditorText();
    renderPreview(text);

    const previous = getOriginalRadioRequestText(item);
    const saved = { ...readRadioRequestTextSettings(), [item.id]: { mode, text } };
    try {
      localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      status.textContent = "文章を保存できませんでした。入力欄の文章をコピーして控えてください。";
      saveCloseButton.disabled = true;
      return;
    }

    saveCloseButton.disabled = false;
    setOptionMode(program.selectedOptions[0], { mode, text });
    status.textContent = mode === "original" && !text ? "文章が空の間は標準文を使います。" : "";

    // 実行中のタスクを設定から編集しても、表示とコピー内容が一致するようにする。
    if (previous !== (mode === "original" ? text : "")) {
      const current = getCurrentDailyTaskItem();
      if (current?.id === item.id && isCustomizableRadioRequest(current)) {
        current._preparedCopyText = buildDailyTaskCopyText(current);
        updateDailyTaskCopyPreview(current);
      }
    }
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
    saveTextSettings();
  }

  function removeSongToken(token) {
    const range = document.createRange();
    range.setStartBefore(token);
    range.collapse(true);
    token.remove();
    editor.focus();
    moveCaret(range);
    saveTextSettings();
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
    if (!event.isComposing) saveTextSettings();
  });
  editor.addEventListener("compositionend", saveTextSettings);
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain");
    if (text) insertInEditor(document.createTextNode(text));
  });
  editor.addEventListener("drop", (event) => event.preventDefault());

  program.addEventListener("change", showProgram);
  modes.forEach((mode) => mode.addEventListener("change", saveTextSettings));
  document.getElementById("requestTextInsertSong").addEventListener("click", () => {
    insertInEditor(createSongToken());
  });
  exampleButton.addEventListener("click", () => {
    if (getEditorText() && !window.confirm("入力中の文章を標準の例文で上書きしますか？")) return;
    setEditorText(getStandardExample());
    saveTextSettings();
  });
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      status.textContent = "プレビューをコピーしました。";
    } catch {
      status.textContent = "コピーできませんでした。プレビューの文章を選択してコピーしてください。";
    }
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
        .filter(isCustomizableRadioRequest).map((item) => [item.id, item]));
      if (!items.size) {
        status.textContent = "設定できる番組がありません。";
        return;
      }

      const saved = readRadioRequestTextSettings();
      program.replaceChildren(...Array.from(items.keys(), (id) => {
        const option = new Option("", id);
        setOptionMode(option, Object.hasOwn(saved, id) ? saved[id] : null);
        return option;
      }));
      if (items.has(previousProgram)) program.value = previousProgram;
      form.classList.remove("hidden");
      showProgram();
    }
  };
}
