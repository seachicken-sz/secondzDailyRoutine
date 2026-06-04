function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
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
