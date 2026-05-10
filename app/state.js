const state = {
  selectedSong: null,
  isOtherSongsOpen: false,

  onceTasks: [],
  selectedOnceTasks: [],
  currentOnceTaskIndex: 0,

  requestSongs: [],
  selectedRequestSong: null,
  isOtherRequestSongsOpen: false,

  requestTexts: {},
  dailyGroups: [],
  currentDailyGroupIndex: 0,
  currentDailyTaskIndex: 0,
  completedDailyItems: [],

  postItems: [],

  youtubePlaylists: [],
  youtubeMvs: [],

  stepHistory: [],
  currentStepElement: null,

  isSheetLogSentInCurrentFlow: false,
  isFlowStateSaveDisabled: false,
  openedAction: "",
};
