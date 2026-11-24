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
  return previous.find(getOriginalRadioRequestText) ||
    previous.find((entry) => typeof entry?.text === "string" && entry.text.trim()) || null;
}

function getOriginalRadioRequestText(entry) {
  return entry?.mode === "original" && typeof entry.text === "string" ? entry.text.trim() : "";
}

function getRadioRequestTextExamples(value) {
  const templates = Array.isArray(value) ? value : [value];
  return [...new Set(templates.filter((text) => typeof text === "string")
    .map((text) => text.trim()).filter(Boolean))];
}

function getAvailableRadioRequestTextFavorites(entry, value) {
  if (!Array.isArray(entry?.favorites) || !entry.favorites.length) return [];
  return getRadioRequestTextExamples(value).filter((text) => entry.favorites.includes(text));
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
  const favoriteSettings = document.getElementById("requestTextFavoriteSettings");
  const favoriteButton = document.getElementById("requestTextFavoriteExample");
  const favoriteNote = document.getElementById("requestTextFavoriteNote");
  const originalSettings = document.getElementById("requestTextOriginalSettings");
  const editor = document.getElementById("requestTextEditor");
  const previewLabel = document.getElementById("requestTextPreviewLabel");
  const preview = document.getElementById("requestTextPreview");
  const saveCloseButton = form.querySelector("[data-setting-save-close]");
  const exampleButton = document.getElementById("requestTextUseExample");
  let items = new Map();
  let editorSelection = null;
  let mode = "standard";
  let originalText = "";
  let favorites = new Set();

  function getTemplateValue() {
    return state.requestTexts[items.get(program.value)?.["request-type"]];
  }

  function renderExamples(selected = "") {
    const options = getRadioRequestTextExamples(getTemplateValue()).map((text) => {
      const label = formatRadioRequestText(text, RADIO_REQUEST_SONG_TOKEN);
      return new Option(favorites.has(text) ? `★ ${label}` : label, text);
    });
    example.replaceChildren(...options);
    example.disabled = options.length === 0;
    if (options.some((option) => option.value === selected)) example.value = selected;
  }

  function renderPanel() {
    const original = mode === "original";
    modes.forEach((button) => {
      const selected = button.dataset.requestTextMode === mode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    originalSettings.classList.toggle("hidden", !original);
    favoriteSettings.classList.toggle("hidden", original || example.disabled);
    exampleButton.disabled = example.disabled;

    const isFavorite = favorites.has(example.value);
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.textContent = isFavorite ? "★ お気に入り登録済み" : "☆ お気に入りに登録";
    favoriteNote.textContent = favorites.size
      ? `お気に入り ${favorites.size} 件から抽選します。`
      : "すべての例文から抽選します。";

    const songName = getSelectedRadioRequestSongName();
    previewLabel.textContent = original && originalText ? "プレビュー" : "標準の例文";
    if (!songName) previewLabel.textContent += "（サンプル曲名）";
    preview.textContent = formatRadioRequestText(
      (original && originalText) || example.value, songName || RADIO_REQUEST_SAMPLE_SONG
    );
  }

  function setOptionMode(option, entry) {
    const modeLabel = getOriginalRadioRequestText(entry) ? "オリジナル" : "標準";
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
    mode = entry?.mode === "original" ? "original" : "standard";
    originalText = typeof entry?.text === "string" ? entry.text : "";
    favorites = new Set(getAvailableRadioRequestTextFavorites(entry, getTemplateValue()));
    setEditorText(originalText);
    renderExamples();
    renderPanel();
    saveCloseButton.disabled = false;
    status.textContent = mode === "original" && !originalText ? "文章が空の間は標準文を使います。" : "";
  }

  function saveTextSettings() {
    const key = program.value;
    if (!items.has(key)) return;
    renderPanel();

    const saved = readRadioRequestTextSettings();
    const previous = getRadioRequestTextSetting(key, saved);
    const entry = { mode, text: originalText, favorites: [...favorites] };
    try {
      localStorage.setItem(RADIO_REQUEST_TEXT_STORAGE_KEY, JSON.stringify({ ...saved, [key]: entry }));
    } catch {
      status.textContent = "設定を保存できませんでした。";
      saveCloseButton.disabled = true;
      return;
    }

    saveCloseButton.disabled = false;
    setOptionMode(program.selectedOptions[0], entry);
    status.textContent = mode === "original" && !originalText ? "文章が空の間は標準文を使います。" : "";

    // 実行中のタスクを設定から編集しても、表示とコピー内容が一致するようにする。
    const activeOriginal = getOriginalRadioRequestText(entry);
    const previousFavorites = getAvailableRadioRequestTextFavorites(previous, getTemplateValue());
    const favoritesChanged = previousFavorites.length !== favorites.size ||
      previousFavorites.some((text) => !favorites.has(text));
    if (getOriginalRadioRequestText(previous) !== activeOriginal || (!activeOriginal && favoritesChanged)) {
      const current = getCurrentDailyTaskItem();
      if (getRadioRequestTextSettingKey(current) === key) {
        current._preparedCopyText = buildDailyTaskCopyText(current);
        updateDailyTaskCopyPreview(current);
      }
    }
  }

  function saveEditorText() {
    originalText = editor.innerText.replaceAll(RADIO_REQUEST_SONG_TOKEN, "musicname").trim();
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
    mode = button.dataset.requestTextMode;
    saveTextSettings();
  }));
  example.addEventListener("change", renderPanel);
  favoriteButton.addEventListener("click", () => {
    const selected = example.value;
    if (!selected) return;
    if (favorites.has(selected)) favorites.delete(selected);
    else favorites.add(selected);
    renderExamples(selected);
    saveTextSettings();
  });
  document.getElementById("requestTextInsertSong").addEventListener("click", () => {
    insertInEditor(createSongToken());
  });
  exampleButton.addEventListener("click", () => {
    if (!example.value) return;
    if (originalText && !window.confirm("入力中の文章を選んだ例文で上書きしますか？")) return;
    originalText = example.value;
    setEditorText(originalText);
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
