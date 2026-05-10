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
