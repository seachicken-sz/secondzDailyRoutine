const state = {
  routineMode: ROUTINE_MODES.normal,　// 通常モード／セレクトモード
  requestSongMode: REQUEST_SONG_MODES.usen,  // USEN用／デイリー用の曲選択画面
  selectModeDailyTaskIds: [], // セレクトモード開始時に選ばれたデイリータスクID

  selectedSong: null,
  isOtherSongsOpen: false,

  onceTasks: [],
  selectedOnceTasks: [],
  currentOnceTaskIndex: 0,

  requestSongs: [],
  selectedRequestSong: null,
  homeSelectedRequestSong: null,
  isOtherRequestSongsOpen: false,

  radioRequestSongOverrides: [],
  selectedRadioRequestSong: null,

  requestTexts: {},
  dailyGroups: [],
  currentDailyGroupIndex: 0,
  currentDailyTaskIndex: 0,
  completedDailyItems: [],

  postItems: [],

  youtubePlaylists: [],
  youtubeMvs: [],
  youtubeOthers: [],

  stepHistory: [],
  currentStepElement: null,

  isSheetLogSentInCurrentFlow: false,
  isFlowStateSaveDisabled: false,
  openedAction: "",
};
