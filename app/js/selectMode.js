// ==================================================
// selectMode.js
// セレクトモードの設定・保存・実行フローを管理する
// ==================================================

let selectModeSettingsCache = null;

// ==================================================
// 設定データ
// ==================================================

function createDefaultSelectModeSettings() {
  return {
    version: 1,
    enabled: false,
    features: {
      spotify: false,
      onceTask: false,
      usen: false,
    },
    dailyTaskIds: [],
  };
}

function normalizeSelectModeSettings(value) {
  const defaults = createDefaultSelectModeSettings();

  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};

  const sourceFeatures =
    source.features && typeof source.features === "object"
      ? source.features
      : {};

  return {
    version: 1,
    enabled: source.enabled === true,
    features: {
      spotify: sourceFeatures.spotify === true,
      onceTask: sourceFeatures.onceTask === true,
      usen: sourceFeatures.usen === true,
    },
    dailyTaskIds: Array.isArray(source.dailyTaskIds)
      ? [...new Set(source.dailyTaskIds.map(String).filter(Boolean))]
      : defaults.dailyTaskIds,
  };
}

function loadSelectModeSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.selectModeSettings);

    selectModeSettingsCache = normalizeSelectModeSettings(
      raw ? JSON.parse(raw) : null
    );
  } catch (error) {
    console.error("セレクトモード設定の読込に失敗しました", error);
    selectModeSettingsCache = createDefaultSelectModeSettings();
  }

  return selectModeSettingsCache;
}

function getSelectModeSettings() {
  return selectModeSettingsCache || loadSelectModeSettings();
}

function saveSelectModeSettings(settings) {
  selectModeSettingsCache = normalizeSelectModeSettings(settings);

  try {
    localStorage.setItem(
      STORAGE_KEYS.selectModeSettings,
      JSON.stringify(selectModeSettingsCache)
    );
  } catch (error) {
    console.error("セレクトモード設定の保存に失敗しました", error);
  }

  return selectModeSettingsCache;
}

// ==================================================
// 有効なデイリータスクID
// ==================================================

function getSelectableDailyTaskIds() {
  if (!Array.isArray(state.dailyGroups)) {
    return [];
  }

  return state.dailyGroups.flatMap((group) => {
    const items = Array.isArray(group?.items) ? group.items : [];

    return items
      .map((item) => String(item?.id || "").trim())
      .filter(Boolean);
  });
}

function getValidSelectedDailyTaskIds(
  settings = getSelectModeSettings()
) {
  const validIdSet = new Set(getSelectableDailyTaskIds());

  return settings.dailyTaskIds.filter((taskId) => {
    return validIdSet.has(taskId);
  });
}

function cleanupMissingSelectModeDailyTaskIds() {
  const validIds = getSelectableDailyTaskIds();

  // JSON読込失敗時に保存内容を消さないよう、
  // デイリータスクを正常に取得できた場合だけ整理する
  if (validIds.length === 0) {
    return;
  }

  const validIdSet = new Set(validIds);
  const settings = getSelectModeSettings();

  const cleanedIds = settings.dailyTaskIds.filter((taskId) => {
    return validIdSet.has(taskId);
  });

  if (cleanedIds.length === settings.dailyTaskIds.length) {
    return;
  }

  settings.dailyTaskIds = cleanedIds;
  saveSelectModeSettings(settings);
}

function hasRunnableSelectModeSelection(
  settings = getSelectModeSettings()
) {
  return (
    Object.values(settings.features).some(Boolean) ||
    getValidSelectedDailyTaskIds(settings).length > 0
  );
}

// ==================================================
// 設定画面イベント
// ==================================================

function bindSelectModeEvents() {
  selectModeToggleElement?.addEventListener("change", () => {
    const settings = getSelectModeSettings();

    if (
      selectModeToggleElement.checked &&
      !hasRunnableSelectModeSelection(settings)
    ) {
      selectModeToggleElement.checked = false;
      settings.enabled = false;

      saveSelectModeSettings(settings);

      refreshSelectModeSettingsUi({
        statusMessage: "実行する内容を1つ以上選んでください。",
      });

      return;
    }

    // ON／OFFだけ切り替え、選択内容は削除しない
    settings.enabled = selectModeToggleElement.checked;

    saveSelectModeSettings(settings);
    refreshSelectModeSettingsUi();
  });

  const featureCheckboxes = [
    [selectModeSpotifyCheckboxElement, "spotify"],
    [selectModeOnceTaskCheckboxElement, "onceTask"],
    [selectModeUsenCheckboxElement, "usen"],
  ];

  featureCheckboxes.forEach(([checkbox, featureName]) => {
    checkbox?.addEventListener("change", () => {
      const settings = getSelectModeSettings();

      settings.features[featureName] = checkbox.checked;

      saveSelectModeSettingsAfterSelectionChange(settings);
    });
  });

  selectModeDailyTaskListElement?.addEventListener(
    "change",
    (event) => {
      const checkbox = event.target.closest(
        "input[data-select-mode-daily-id]"
      );

      if (!checkbox) {
        return;
      }

      const taskId = String(
        checkbox.dataset.selectModeDailyId || ""
      ).trim();

      if (!taskId) {
        return;
      }

      const settings = getSelectModeSettings();
      const selectedIdSet = new Set(settings.dailyTaskIds);

      if (checkbox.checked) {
        selectedIdSet.add(taskId);
      } else {
        selectedIdSet.delete(taskId);
      }

      settings.dailyTaskIds = [...selectedIdSet];

      saveSelectModeSettingsAfterSelectionChange(settings);
    }
  );
}

function saveSelectModeSettingsAfterSelectionChange(settings) {
  let statusMessage = "";

  if (
    settings.enabled &&
    !hasRunnableSelectModeSelection(settings)
  ) {
    // 最後の選択を外した場合はモードだけOFFにする
    // 選択情報自体は通常どおり保存する
    settings.enabled = false;

    statusMessage =
      "実行する内容がなくなったため、セレクトモードをOFFにしました。";
  }

  saveSelectModeSettings(settings);

  refreshSelectModeSettingsUi({
    statusMessage,
  });
}

// ==================================================
// 設定画面初期化・描画
// ==================================================

function initializeSelectMode() {
  loadSelectModeSettings();
  cleanupMissingSelectModeDailyTaskIds();

  const settings = getSelectModeSettings();
  let statusMessage = "";

  if (
    settings.enabled &&
    !hasRunnableSelectModeSelection(settings)
  ) {
    settings.enabled = false;
    saveSelectModeSettings(settings);

    statusMessage =
      "実行できる内容がないため、セレクトモードをOFFにしました。";
  }

  refreshSelectModeSettingsUi({
    statusMessage,
  });
}

function refreshSelectModeSettingsUi(options = {}) {
  const settings = getSelectModeSettings();

  if (selectModeToggleElement) {
    selectModeToggleElement.checked = settings.enabled;
  }

  if (selectModeSpotifyCheckboxElement) {
    selectModeSpotifyCheckboxElement.checked =
      settings.features.spotify;
  }

  if (selectModeOnceTaskCheckboxElement) {
    selectModeOnceTaskCheckboxElement.checked =
      settings.features.onceTask;
  }

  if (selectModeUsenCheckboxElement) {
    selectModeUsenCheckboxElement.checked =
      settings.features.usen;
  }

  renderSelectModeDailyTaskList();
  updateSelectModeSelectionSummary();
  updateStartRoutineButtonLabel();

  if (selectModeStatusTextElement) {
    selectModeStatusTextElement.textContent =
      options.statusMessage ||
      `現在：${settings.enabled ? "ON" : "OFF"}`;
  }
}

function renderSelectModeDailyTaskList() {
  if (!selectModeDailyTaskListElement) {
    return;
  }

  selectModeDailyTaskListElement.innerHTML = "";

  const groups = Array.isArray(state.dailyGroups)
    ? state.dailyGroups
    : [];

  const settings = getSelectModeSettings();
  const selectedIdSet = new Set(settings.dailyTaskIds);

  let renderedTaskCount = 0;

  groups.forEach((group) => {
    const items = Array.isArray(group?.items)
      ? group.items.filter((item) => {
          return String(item?.id || "").trim() !== "";
        })
      : [];

    if (items.length === 0) {
      return;
    }

    renderedTaskCount += items.length;

    const selectedCount = items.filter((item) => {
      return selectedIdSet.has(String(item.id));
    }).length;

    const details = document.createElement("details");
    details.className = "select-mode-daily-group";
    details.open = selectedCount > 0;

    const summary = document.createElement("summary");
    summary.className = "select-mode-daily-group-summary";

    const groupName = document.createElement("span");
    groupName.textContent =
      group.listName || "デイリータスク";

    const count = document.createElement("span");
    count.className = "select-mode-daily-group-count";
    count.textContent = `${selectedCount} / ${items.length}`;

    summary.appendChild(groupName);
    summary.appendChild(count);

    const itemList = document.createElement("div");
    itemList.className = "select-mode-daily-item-list";

    items.forEach((item) => {
      const taskId = String(item.id);

      const label = document.createElement("label");
      label.className = "select-mode-daily-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedIdSet.has(taskId);
      checkbox.dataset.selectModeDailyId = taskId;

      const text = document.createElement("span");

      text.textContent =
        typeof getDailyTaskItemName === "function"
          ? getDailyTaskItemName(item)
          : item.name || item.title || "名称未設定";

      label.appendChild(checkbox);
      label.appendChild(text);

      itemList.appendChild(label);
    });

    details.appendChild(summary);
    details.appendChild(itemList);

    selectModeDailyTaskListElement.appendChild(details);
  });

  selectModeDailyTaskEmptyTextElement?.classList.toggle(
    "hidden",
    renderedTaskCount > 0
  );
}

function updateSelectModeSelectionSummary() {
  if (!selectModeSelectionSummaryElement) {
    return;
  }

  const settings = getSelectModeSettings();

  const featureCount = Object.values(
    settings.features
  ).filter(Boolean).length;

  const dailyCount =
    getValidSelectedDailyTaskIds(settings).length;

  selectModeSelectionSummaryElement.textContent =
    `機能 ${featureCount}件・デイリー ${dailyCount}件を選択中`;
}

function updateStartRoutineButtonLabel() {
  if (!startRoutineButtonElement) {
    return;
  }

  startRoutineButtonElement.textContent =
    getSelectModeSettings().enabled
      ? "選んだタスクで始める"
      : "開始する";
}

// ==================================================
// 開始時の状態初期化
// ==================================================

function resetRoutineProgressState() {
  // 前回SNS共有画面へ到達した際に無効化された
  // 途中再開保存を、今回の開始時に再有効化する
  state.isFlowStateSaveDisabled = false;
  
  state.selectedSong = null;

  state.selectedOnceTasks = [];
  state.currentOnceTaskIndex = 0;

  state.selectedRequestSong = null;
  state.selectedRadioRequestSong = null;

  state.currentDailyGroupIndex = 0;
  state.currentDailyTaskIndex = 0;
  state.completedDailyItems = [];

  state.stepHistory = [];
  state.openedAction = "";

  state.isSheetLogSentInCurrentFlow = false;

  clearFlowState();
}

async function startRoutineByCurrentMode() {
  const settings = getSelectModeSettings();

  resetRoutineProgressState();

  if (!settings.enabled) {
    state.routineMode = ROUTINE_MODES.normal;
    state.requestSongMode = REQUEST_SONG_MODES.usen;
    state.selectModeDailyTaskIds = [];

    showOnlyStep(spotifyStepElement);
    return;
  }

  const validDailyTaskIds =
    getValidSelectedDailyTaskIds(settings);

  if (
    !Object.values(settings.features).some(Boolean) &&
    validDailyTaskIds.length === 0
  ) {
    settings.enabled = false;

    saveSelectModeSettings(settings);

    refreshSelectModeSettingsUi({
      statusMessage:
        "実行できる内容がないため、セレクトモードをOFFにしました。",
    });

    return;
  }

  state.routineMode = ROUTINE_MODES.select;
  state.requestSongMode = REQUEST_SONG_MODES.usen;

  // 開始時点の選択内容を今回の実行対象として保持
  state.selectModeDailyTaskIds = validDailyTaskIds;

  await showFirstSelectModeStep();
}

function isSelectRoutine() {
  return state.routineMode === ROUTINE_MODES.select;
}

function isSelectModeFeatureSelected(featureName) {
  if (!isSelectRoutine()) {
    return false;
  }

  return (
    getSelectModeSettings().features[featureName] === true
  );
}

// ==================================================
// 今回実行するデイリータスク
// ==================================================
function getExecutionDailyGroups() {
  const groups = Array.isArray(state.dailyGroups)
    ? state.dailyGroups
    : [];

  // 通常モードは、従来どおり元のグループ構成を使う
  if (!isSelectRoutine()) {
    return groups;
  }

  const selectedIdSet = new Set(
    Array.isArray(state.selectModeDailyTaskIds)
      ? state.selectModeDailyTaskIds.map(String)
      : []
  );

  // 元のJSONに並んでいる順番を維持したまま、
  // 選択されたタスクだけを1つの配列にまとめる
  const selectedItems = groups.flatMap((group) => {
    const items = Array.isArray(group?.items)
      ? group.items
      : [];

    return items.filter((item) => {
      const taskId = String(item?.id || "");

      return selectedIdSet.has(taskId);
    });
  });

  if (selectedItems.length === 0) {
    return [];
  }

  // セレクトモードでは、元のグループに関係なく
  // 選んだデイリータスク全体を1グループとして扱う
  return [
    {
      listName: "マイセレクト",
      lastFlag: true,
      items: selectedItems,
    },
  ];
}

function getExecutionDailyItems() {
  return getExecutionDailyGroups().flatMap((group) => {
    return group.items || [];
  });
}

function hasExecutionDailyTasks() {
  return getExecutionDailyItems().length > 0;
}

// 選択したデイリータスクで、任意の曲名選択が必要か判定
// 固定文面の新曲用テンプレートなどは musicname を含まないため対象外
function doesExecutionDailyNeedRequestSong() {
  return getExecutionDailyItems().some((item) => {
    const requestType = item?.["request-type"];

    if (!requestType) {
      return false;
    }

    const template = state.requestTexts?.[requestType];

    if (Array.isArray(template)) {
      return template.some((text) => {
        return String(text || "").includes("musicname");
      });
    }

    return String(template || "").includes("musicname");
  });
}

// ==================================================
// セレクトモードの画面遷移
// ==================================================

async function showFirstSelectModeStep() {
  if (isSelectModeFeatureSelected("spotify")) {
    showOnlyStep(spotifyStepElement);
    return;
  }

  if (isSelectModeFeatureSelected("onceTask")) {
    await showOnceTaskSelectStepOrSkip();
    return;
  }

  if (isSelectModeFeatureSelected("usen")) {
    state.requestSongMode = REQUEST_SONG_MODES.usen;

    await showRequestSongStep();
    return;
  }

  await showSelectModeDailyPartWithoutUsen();
}

async function advanceRoutineFrom(completedStep) {
  // 通常モード
  if (!isSelectRoutine()) {
    if (completedStep === "spotify") {
      await showOnceTaskSelectStepOrSkip();
      return;
    }

    if (completedStep === "onceTask") {
      state.requestSongMode = REQUEST_SONG_MODES.usen;

      await showRequestSongStep();
      return;
    }

    if (
      completedStep === "radioOverride" ||
      completedStep === "dailySong"
    ) {
      await showDailyTaskStep();
      return;
    }

    if (completedStep === "daily") {
      showPostAskStep();
    }

    return;
  }

  // セレクトモード：Spotify終了後
  if (completedStep === "spotify") {
    if (isSelectModeFeatureSelected("onceTask")) {
      await showOnceTaskSelectStepOrSkip();
      return;
    }

    if (isSelectModeFeatureSelected("usen")) {
      state.requestSongMode =
        REQUEST_SONG_MODES.usen;

      await showRequestSongStep();
      return;
    }

    await showSelectModeDailyPartWithoutUsen();
    return;
  }

  // セレクトモード：期間限定タスク終了後
  if (completedStep === "onceTask") {
    if (isSelectModeFeatureSelected("usen")) {
      state.requestSongMode =
        REQUEST_SONG_MODES.usen;

      await showRequestSongStep();
      return;
    }

    await showSelectModeDailyPartWithoutUsen();
    return;
  }

  // 新曲切替またはデイリー用曲選択後
  if (
    completedStep === "radioOverride" ||
    completedStep === "dailySong"
  ) {
    if (hasExecutionDailyTasks()) {
      await showDailyTaskStep();
    } else {
      finishSelectModeRoutine();
    }

    return;
  }

  if (completedStep === "daily") {
    finishSelectModeRoutine();
  }
}

// USENを実行せずデイリーへ進む
async function showSelectModeDailyPartWithoutUsen() {
  if (!hasExecutionDailyTasks()) {
    finishSelectModeRoutine();
    return;
  }

  if (doesExecutionDailyNeedRequestSong()) {
    state.requestSongMode =
      REQUEST_SONG_MODES.daily;

    await showRequestSongStep();
    return;
  }

  // 固定文面タスクなど、任意の曲選択が不要な場合
  state.selectedRequestSong = null;
  state.selectedRadioRequestSong = null;

  await showDailyTaskStep();
}

// ==================================================
// 新曲切り替え画面の表示条件
// ==================================================

function shouldShowRadioRequestSongOverride() {
  // 通常モードは従来どおり
  if (!isSelectRoutine()) {
    return true;
  }

  return (
    isSelectModeFeatureSelected("usen") &&
    hasExecutionDailyTasks() &&
    doesExecutionDailyNeedRequestSong()
  );
}

// ==================================================
// デイリー終了後
// ==================================================

function finishRoutineAfterDaily() {
  if (isSelectRoutine()) {
    finishSelectModeRoutine();
    return;
  }

  showPostAskStep();
}

function finishSelectModeRoutine() {
  // セレクトモードでも、
  // 最後にSNS共有とYouTubeを必ず実行対象に含める
  showPostAskStep();
}

// ==================================================
// リクエスト曲画面の表示モード
// ==================================================

function isDailyRequestSongMode() {
  return (
    state.requestSongMode ===
    REQUEST_SONG_MODES.daily
  );
}

function applyRequestSongStepMode() {
  const dailyMode = isDailyRequestSongMode();

  if (requestSongStepTitleElement) {
    requestSongStepTitleElement.textContent =
      dailyMode
        ? "デイリータスクで使う曲を選ぶ📻"
        : "USEN推し活リクエスト📻";
  }

  if (requestSongStepDescriptionElement) {
    requestSongStepDescriptionElement.innerHTML =
      dailyMode
        ? "ラジオリクエストで使う曲を選んでください。<br>USENにまだない曲も選べます。"
        : "曲を選んで<strong>「ページを開く」</strong>をタップ！<br>「USEN推し活リクエスト」でリクエストしよ！";
  }

  requestSongHelpButtonElement?.classList.toggle(
    "hidden",
    dailyMode
  );

  if (usenRankingInfoElement) {
    if (dailyMode) {
      usenRankingInfoElement.classList.add("hidden");
    } else if (
      usenRankingInfoElement.textContent.trim()
    ) {
      usenRankingInfoElement.classList.remove(
        "hidden"
      );
    }
  }

  if (selectedRequestSongLabelElement) {
    selectedRequestSongLabelElement.textContent =
      dailyMode
        ? "ラジオリクエスト曲"
        : "選択中";
  }

  openRequestSongButtonElement?.classList.toggle(
    "hidden",
    dailyMode
  );

  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.textContent =
      dailyMode
        ? "選んで次へ"
        : "次へ";
  }
}

// ==================================================
// 途中再開後のデイリー先頭から戻る場合
// ==================================================

async function showFallbackPreviousStepForDaily() {
  if (!isSelectRoutine()) {
    state.requestSongMode =
      REQUEST_SONG_MODES.usen;

    await showRequestSongStep();
    return;
  }

  if (
    state.requestSongMode ===
    REQUEST_SONG_MODES.daily
  ) {
    await showRequestSongStep();
    return;
  }

  if (isSelectModeFeatureSelected("usen")) {
    state.requestSongMode =
      REQUEST_SONG_MODES.usen;

    await showRequestSongStep();
    return;
  }

  if (isSelectModeFeatureSelected("onceTask")) {
    await showOnceListSelectStep();
    return;
  }

  if (isSelectModeFeatureSelected("spotify")) {
    showOnlyStep(spotifyStepElement, {
      recordHistory: false,
    });

    return;
  }

  clearFlowState();

  showOnlyStep(homeStepElement, {
    recordHistory: false,
  });
}
