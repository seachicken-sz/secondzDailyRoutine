function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
}

function saveFlowState(openedAction = state.openedAction || "", stepElement = state.currentStepElement) {
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

  localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flowState));
}

function loadFlowState() {
  try {
    const raw = localStorage.getItem(FLOW_STORAGE_KEY);

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
  localStorage.removeItem(FLOW_STORAGE_KEY);
  state.openedAction = "";
}