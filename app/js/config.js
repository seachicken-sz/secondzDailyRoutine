// ==================================================
// 定数 - 外部URL
// ==================================================
const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";
const USEN_REQUEST_BASE_URL = "https://usen.oshireq.com/song/";
const X_POST_URL = "https://twitter.com/intent/tweet?text=";
const THREADS_URL = "https://www.threads.net/";
const YOUTUBE_THUMBNAIL_BASE_URL = "https://img.youtube.com/vi/";
const TIMELESZ_SPOTIFY_ARTIST_URL =
  "https://open.spotify.com/intl-ja/artist/1ZFfhzyXjPvbzSYPlCIwo3";

// ==================================================
// 定数 - JSONパス
// ==================================================
const DATA_PATHS = {
  spotifySongs: "../data/spotifySongJson.json",
  onceTasks: "../data/onceListJson.json",
  homeInfoList: "../data/homeInfoListJson.json",
  requestSongs: "../data/requestSongJson.json",
  requestTexts: "../data/requestTextJson.json",
  dailyGroups: "../data/listJson.json",
  youtubePlaylists: "../data/youtubePlayListJson.json",
  youtubeMvs: "../data/youtubeMVListJson.json",
  youtubeOthers: "../data/youtubeOtherListJson.json",
  memberWorks: "../data/memberWorksJson.json",
};

// ==================================================
// 定数 - ローカルストレージ
// ==================================================
const STORAGE_KEYS = {
  flowState: "secondzDailyRoutineFlowState",
  onceTaskDoneMap: "secondzDailyRoutineOnceTaskDoneMap",
};

// ==================================================
// 定数 - 画面ID
// ==================================================
const STEP_IDS = {
  home: "homeStep",
  spotify: "spotifyStep",
  onceListSelect: "onceListSelectStep",
  onceTaskRun: "onceTaskRunStep",
  requestSong: "requestSongStep",
  dailyTask: "dailyTaskStep",
  dailyGroupEnd: "dailyGroupEndStep",
  postAsk: "postAskStep",
  postEdit: "postEditStep",
  youtubeAsk: "youtubeAskStep",
  youtubeSelect: "youtubeSelectStep",
  placeholderNext: "placeholderNextStep",
};

// ==================================================
// 定数 - 開いたアクション状態
// ==================================================
const OPENED_ACTIONS = {
  spotify: "spotifyOpened",
  onceTask: "onceTaskOpened",
  requestSong: "requestSongOpened",
  dailyTask: "dailyTaskOpened",
};

// ==================================================
// 定数 - 表示文言
// ==================================================
const MESSAGES = {
  finish: "お疲れ様さまでした☺️Big Love💚",

  errors: {
    noSongSelected: "曲が選択されていません。",
    noRequestSongSelected: "リクエスト曲が選択されていません。",
    noUrl: "URLが設定されていません。",
    noPostText: "投稿文がありません。",
    noCopyPostText: "コピーする投稿文がありません。",
    copyFailed: "コピーに失敗しました。投稿文を長押しでコピーしてください。",
    dailyCopyFailed:
      "コピーに失敗しました。もう一度ページを開くボタンを押してください。",
    initialLoadFailed: "初期データの読み込みに失敗しました。ERROR:JSON",
  },

  empty: {
    recommendedSongs: "おすすめ曲はありません。",
    otherSongs: "その他の曲はありません。",
    onceTasks: "現在、期限内のリクエストはありません。",
    homeInfo: "現在、お知らせはありません。",
    youtubeItems: "表示できる項目がありません。",
  },
};
