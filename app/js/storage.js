function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
}

// デイリータスク用の日付キー
// 18:00〜翌17:59 を同じ日として扱う
function getDailyTaskDayKey(date = new Date()) {
  const targetDate = new Date(date);

  if (targetDate.getHours() < DAILY_TASK_DAY_SWITCH_HOUR) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  return formatDateKey(targetDate);
}

function loadDailyTaskDoneMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.dailyTaskDoneMap);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error("dailyTaskDoneMap読込失敗", error);
    return {};
  }
}

function saveDailyTaskDoneMap(doneMap) {
  localStorage.setItem(STORAGE_KEYS.dailyTaskDoneMap, JSON.stringify(doneMap));
}

function getDailyTaskStorageKey(item) {
  if (!item) {
    return "";
  }

  if (item.id) {
    return String(item.id);
  }

  const name =
    typeof getDailyTaskItemName === "function"
      ? getDailyTaskItemName(item)
      : item.name || item.title || item.listName || "";

  const url =
    typeof getDailyTaskItemUrl === "function"
      ? getDailyTaskItemUrl(item)
      : item.url || "";

  return `${name}_${url}`;
}

function isDailyTaskDone(item) {
  const taskKey = getDailyTaskStorageKey(item);

  if (!taskKey) {
    return false;
  }

  const dayKey = getDailyTaskDayKey();
  const doneMap = loadDailyTaskDoneMap();

  return Boolean(doneMap?.[dayKey]?.[taskKey]);
}

function markDailyTaskDone(item, source = "") {
  const taskKey = getDailyTaskStorageKey(item);

  if (!taskKey) {
    return;
  }

  const dayKey = getDailyTaskDayKey();
  const doneMap = loadDailyTaskDoneMap();

  if (!doneMap[dayKey]) {
    doneMap[dayKey] = {};
  }

  doneMap[dayKey][taskKey] = {
    doneAt: new Date().toISOString(),
    source,
  };

  saveDailyTaskDoneMap(doneMap);
}

// 古いdaily完了データを軽く掃除する
// 7日分保持
function cleanupDailyTaskDoneMap(keepDays = 7) {
  const doneMap = loadDailyTaskDoneMap();
  const todayKey = getDailyTaskDayKey();
  const keepKeys = new Set();

  for (let i = 0; i < keepDays; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // getDailyTaskDayKey() に渡す時点の日付が朝だとズレるので、
    // 18時以降の時刻に固定してキーを作る
    date.setHours(DAILY_TASK_DAY_SWITCH_HOUR, 0, 0, 0);

    keepKeys.add(getDailyTaskDayKey(date));
  }

  let hasChanged = false;

  Object.keys(doneMap).forEach((key) => {
    if (!keepKeys.has(key) && key !== todayKey) {
      delete doneMap[key];
      hasChanged = true;
    }
  });

  if (hasChanged) {
    saveDailyTaskDoneMap(doneMap);
  }
}

function isDailyGroupDone(group) {
  const items =
    typeof getDailyGroupItems === "function"
      ? getDailyGroupItems(group)
      : group?.items || [];

  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  return items.every((item) => isDailyTaskDone(item));
}

function isAnyDailyGroupDoneToday(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return false;
  }

  return groups.some((group) => isDailyGroupDone(group));
}

function saveFlowState(openedAction = state.openedAction || "", stepElement = state.currentStepElement) {
  if (state.isFlowStateSaveDisabled) {
    return;
  }  
  if (!stepElement || stepElement === homeStepElement) {
    return;
  }

  const flowState = {
    dateKey: getTodayKey(),
    currentStepId: stepElement.id,
    selectedSong: state.selectedSong,
    selectedOnceTasks: state.selectedOnceTasks,
    currentOnceTaskIndex: state.currentOnceTaskIndex,
    selectedRequestSong: state.selectedRequestSong,
    selectedRadioRequestSong: state.selectedRadioRequestSong,
    currentDailyGroupIndex: state.currentDailyGroupIndex,
    currentDailyTaskIndex: state.currentDailyTaskIndex,
    completedDailyItems: state.completedDailyItems,
    openedAction
  };

  localStorage.setItem(STORAGE_KEYS.flowState, JSON.stringify(flowState));
}

function loadFlowState() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.flowState) ||
      localStorage.getItem("tamugotoDailyFlowState");

    if (!raw) {
      return null;
    }

    const flowState = JSON.parse(raw);

    if (!flowState || flowState.dateKey !== getTodayKey()) {
      clearFlowState();
      return null;
    }

    return flowState;
  } catch (error) {
    console.error(error);
    clearFlowState();
    return null;
  }
}

function clearFlowState() {
  localStorage.removeItem(STORAGE_KEYS.flowState);
  localStorage.removeItem("tamugotoDailyFlowState");
  state.openedAction = "";
}

function loadOnceTaskDoneMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.onceTaskDoneMap);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error("onceTaskDoneMap読込失敗", error);
    return {};
  }
}

function saveOnceTaskDoneMap(doneMap) {
  localStorage.setItem(STORAGE_KEYS.onceTaskDoneMap, JSON.stringify(doneMap));
}

function getTaskRepeatType(task) {
  return task?.repeatType || "daily";
}

function isOnceTask(task) {
  return getTaskRepeatType(task) === "once";
}

function getTaskStorageId(task) {
  return task?.id || "";
}

function getOnceTaskExpiresAt(task) {
  const toDate = parseDateTime(task?.to);

  if (!toDate) {
    return null;
  }

  return toDate.toISOString();
}

function isOnceTaskDone(task) {
  if (!isOnceTask(task)) {
    return false;
  }

  const taskId = getTaskStorageId(task);

  if (!taskId) {
    return false;
  }

  const doneMap = loadOnceTaskDoneMap();

  return Boolean(doneMap[taskId]);
}

function markOnceTaskDone(task) {
  if (!isOnceTask(task)) {
    return;
  }

  const taskId = getTaskStorageId(task);

  if (!taskId) {
    console.warn("repeatType: once のタスクに id がありません", task);
    return;
  }

  const doneMap = loadOnceTaskDoneMap();

  doneMap[taskId] = {
    doneAt: new Date().toISOString(),
    expiresAt: getOnceTaskExpiresAt(task),
  };

  saveOnceTaskDoneMap(doneMap);
}

function cleanupOnceTaskDoneMap(tasks) {
    if (!Array.isArray(tasks)) {
    return;
  }
  const doneMap = loadOnceTaskDoneMap();
  const validTaskIds = new Set(
    tasks
      .map((task) => getTaskStorageId(task))
      .filter(Boolean)
  );

  const now = Date.now();
  let hasChanged = false;

  Object.keys(doneMap).forEach((taskId) => {
    const record = doneMap[taskId];

    const isMissingFromJson = !validTaskIds.has(taskId);
    const expiresAtTime = record?.expiresAt
      ? new Date(record.expiresAt).getTime()
      : null;
    const isExpired =
      typeof expiresAtTime === "number" &&
      !Number.isNaN(expiresAtTime) &&
      expiresAtTime < now;

    if (isMissingFromJson || isExpired) {
      delete doneMap[taskId];
      hasChanged = true;
    }
  });

  if (hasChanged) {
    saveOnceTaskDoneMap(doneMap);
  }
}
