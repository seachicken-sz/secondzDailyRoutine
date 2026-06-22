// ==================================================
// quick.js
// タムごとDailyお試しモード
// ==================================================

const QUICK_DATA_PATHS = {
  spotifySongs: "../../data/spotifySongJson.json",
  quickTasks: "../../data/quickTaskJson.json",
  requestTexts: "../../data/requestTextJson.json",
  requestSongs: "../../data/requestSongJson.json",
  radioRequestSongOverrides: "../../data/radioRequestSongOverrideJson.json",
};

const QUICK_STORAGE_KEYS = {
  tutorialEnabled: "secondzDailyRoutineQuickTutorialEnabled",
  session: "secondzDailyRoutineQuickSessionState",
  dailyTaskDoneMap: "secondzDailyRoutineDailyTaskDoneMap",
};

const QUICK_STEP_IDS = {
  start: "quickStartStep",
  spotify: "quickSpotifyStep",
  daily: "quickDailyStep",
  share: "quickShareStep",
  postEdit: "quickPostEditStep",
  complete: "quickCompleteStep",
};

const QUICK_STATE_DEFAULT = {
  screen: "start",
  started: false,
  selectedSongId: "",
  spotifyChoice: "",
  dailyTaskIndex: 0,
  completedDailyTaskIds: [],
  completedDailyTaskNames: [],
  postShared: false,
  postSkipped: false,
  preparedCopyTextMap: {},
  postItems: [],
  currentPostPlatform: "x",
  sessionId: "",
  completeLogged: false,
};

const quickState = {
  ...QUICK_STATE_DEFAULT,
  spotifySongs: [],
  quickDailyTasks: [],
  requestTexts: {},
  selectedRadioRequestSongName: "",
  tutorial: {
    enabled: true,
    messages: [],
    index: 0,
    isTyping: false,
    timerId: null,
    targetSelector: "",
  },
};

const quickElements = {
  tutorialToggle: document.getElementById("quickTutorialToggle"),
  startButton: document.getElementById("quickStartButton"),
  snsInAppGuide: document.getElementById("quickSnsInAppGuide"),
  startIntroCard: document.getElementById("quickStartIntroCard"),

  spotifySelectedArea: document.getElementById("quickSpotifySelectedArea"),
  spotifySelectedSongName: document.getElementById("quickSpotifySelectedSongName"),
  recommendedSongs: document.getElementById("quickRecommendedSongs"),
  otherSongs: document.getElementById("quickOtherSongs"),
  otherSongsWrapper: document.getElementById("quickOtherSongsWrapper"),
  toggleOtherSongsButton: document.getElementById("quickToggleOtherSongsButton"),
  toggleOtherSongsIcon: document.getElementById("quickToggleOtherSongsIcon"),
  openSpotifyButton: document.getElementById("quickOpenSpotifyButton"),
  skipSpotifyButton: document.getElementById("quickSkipSpotifyButton"),
  spotifyNextButton: document.getElementById("quickSpotifyNextButton"),
  spotifyErrorArea: document.getElementById("quickSpotifyErrorArea"),

  dailyHeaderDescription: document.getElementById("quickDailyHeaderDescription"),
  dailyActionDescription: document.getElementById("quickDailyActionDescription"),
  dailyTaskProgress: document.getElementById("quickDailyTaskProgress"),
  dailyTaskName: document.getElementById("quickDailyTaskName"),
  dailyTaskCommentArea: document.getElementById("quickDailyTaskCommentArea"),
  dailyTaskCopyPreviewArea: document.getElementById("quickDailyTaskCopyPreviewArea"),
  dailyTaskCopyPreviewText: document.getElementById("quickDailyTaskCopyPreviewText"),
  dailyTaskCopyPreviewPasteTarget: document.getElementById("quickDailyTaskCopyPreviewPasteTarget"),
  openDailyTaskUrlButton: document.getElementById("quickOpenDailyTaskUrlButton"),
  dailyTaskNextButton: document.getElementById("quickDailyTaskNextButton"),
  dailyTaskErrorArea: document.getElementById("quickDailyTaskErrorArea"),

  makePostButton: document.getElementById("quickMakePostButton"),
  skipPostButton: document.getElementById("quickSkipPostButton"),
  postPreviewXTabButton: document.getElementById("quickPostPreviewXTabButton"),
  postPreviewThreadsTabButton: document.getElementById("quickPostPreviewThreadsTabButton"),
  postPreviewXPanel: document.getElementById("quickPostPreviewXPanel"),
  postPreviewThreadsPanel: document.getElementById("quickPostPreviewThreadsPanel"),
  postItemXList: document.getElementById("quickPostItemXList"),
  postItemThreadsList: document.getElementById("quickPostItemThreadsList"),
  generatedXPostText: document.getElementById("quickGeneratedXPostText"),
  generatedThreadsPostText: document.getElementById("quickGeneratedThreadsPostText"),
  xPostTextCount: document.getElementById("quickXPostTextCount"),
  threadsPostLinkCount: document.getElementById("quickThreadsPostLinkCount"),
  openXPostButton: document.getElementById("quickOpenXPostButton"),
  copyXPostTextButton: document.getElementById("quickCopyXPostTextButton"),
  openThreadsButton: document.getElementById("quickOpenThreadsButton"),
  postNextButton: document.getElementById("quickPostNextButton"),
  postErrorArea: document.getElementById("quickPostErrorArea"),

  installGuideCard: document.getElementById("quickInstallGuideCard"),
  openSetupButton: document.getElementById("quickOpenSetupButton"),
  backHomeButton: document.getElementById("quickBackHomeButton"),

  tutorialOverlay: document.getElementById("quickTutorialOverlay"),
  tutorialSpotlight: document.getElementById("quickTutorialSpotlight"),
  tutorialText: document.getElementById("quickTutorialText"),
  tutorialHint: document.getElementById("quickTutorialHint"),

  setupModal: document.getElementById("quickSetupModal"),
  closeSetupButton: document.getElementById("quickCloseSetupButton"),
  setupModalBody: document.getElementById("quickSetupModalBody"),
};

document.addEventListener("DOMContentLoaded", initQuickApp);

async function initQuickApp() {
  restoreQuickSession();

  if (quickState.screen === "complete") {
    clearQuickSession();
  }

  restoreTutorialSetting();
  bindQuickEvents();

  try {
    await loadQuickData();
    renderQuickApp();
  } catch (error) {
    console.error("quick 初期化失敗", error);
    showQuickFatalError();
  }
}

function bindQuickEvents() {
  quickElements.startButton?.addEventListener("click", startQuickFlow);

  quickElements.toggleOtherSongsButton?.addEventListener("click", () => {
    const isHidden = quickElements.otherSongsWrapper?.classList.toggle("hidden");

    if (quickElements.toggleOtherSongsIcon) {
      quickElements.toggleOtherSongsIcon.textContent = isHidden ? "＋" : "－";
    }
  });

  quickElements.openSpotifyButton?.addEventListener("click", openSelectedSpotify);

  quickElements.skipSpotifyButton?.addEventListener("click", () => {
    quickState.spotifyChoice = "noBgm";
    showQuickScreen("daily");
  });

  quickElements.spotifyNextButton?.addEventListener("click", () => {
    showQuickScreen("daily");
  });

  quickElements.openDailyTaskUrlButton?.addEventListener("click", async () => {
    await openCurrentQuickDailyTask();
  });

  quickElements.dailyTaskNextButton?.addEventListener("click", moveToNextQuickDailyTask);

  quickElements.makePostButton?.addEventListener("click", () => {
    showQuickScreen("postEdit");
  });

  quickElements.skipPostButton?.addEventListener("click", () => {
    quickState.postSkipped = true;
    finishQuickFlow();
  });

  quickElements.postPreviewXTabButton?.addEventListener("click", () => {
    setQuickPostPreviewPlatform("x");
  });

  quickElements.postPreviewThreadsTabButton?.addEventListener("click", () => {
    setQuickPostPreviewPlatform("threads");
  });

  quickElements.copyXPostTextButton?.addEventListener("click", copyQuickXPostText);
  quickElements.openXPostButton?.addEventListener("click", openQuickXPost);
  quickElements.openThreadsButton?.addEventListener("click", openQuickThreadsPost);

  quickElements.postNextButton?.addEventListener("click", finishQuickFlow);

  quickElements.openSetupButton?.addEventListener("click", openQuickSetupModal);
  quickElements.closeSetupButton?.addEventListener("click", closeQuickSetupModal);

  quickElements.setupModal?.addEventListener("click", (event) => {
    if (event.target === quickElements.setupModal) {
      closeQuickSetupModal();
    }
  });

  quickElements.backHomeButton?.addEventListener("click", clearQuickSession);

  quickElements.tutorialToggle?.addEventListener("change", () => {
    setQuickTutorialEnabled(quickElements.tutorialToggle.checked);

    if (quickElements.tutorialToggle.checked) {
      startTutorialForCurrentScreen();
    }
  });

  document.addEventListener("click", handleQuickTutorialDocumentTap, true);
  window.addEventListener("resize", updateTutorialSpotlight);
  window.addEventListener("scroll", updateTutorialSpotlight, { passive: true });
}

function startQuickFlow() {
  quickState.started = true;
  quickState.sessionId = createQuickSessionId();
  quickState.completeLogged = false;
  quickState.selectedSongId = "";
  quickState.spotifyChoice = "";
  quickState.dailyTaskIndex = 0;
  quickState.completedDailyTaskIds = [];
  quickState.completedDailyTaskNames = [];
  quickState.postShared = false;
  quickState.postSkipped = false;
  quickState.preparedCopyTextMap = {};
  quickState.postItems = [];
  quickState.currentPostPlatform = "x";

  saveQuickSession();

  sendQuickEvent("start", {
    itemId: "quick_start",
    title: "開始する",
  });

  showQuickScreen("spotify");
}

function createQuickSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return [
    "quick",
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

function sendQuickEvent(eventType, data = {}) {
  if (typeof sendQuickLog !== "function" || !quickState.sessionId) {
    return Promise.resolve(false);
  }

  return sendQuickLog(eventType, {
    sessionId: quickState.sessionId,
    tutorialEnabled: quickState.tutorial.enabled,
    ...data,
  });
}

function finishQuickFlow() {
  if (!quickState.completeLogged) {
    quickState.completeLogged = true;
    saveQuickSession();

    sendQuickEvent("complete", {
      itemId: "quick_complete",
      title: "完了",
    });
  }

  showQuickScreen("complete");
}

async function loadQuickData() {
  const [
    spotifySongs,
    quickTaskConfig,
    requestTexts,
    requestSongs,
    radioOverrides,
  ] = await Promise.all([
    fetchQuickJson(QUICK_DATA_PATHS.spotifySongs),
    fetchQuickJson(QUICK_DATA_PATHS.quickTasks),
    fetchQuickJson(QUICK_DATA_PATHS.requestTexts),
    fetchQuickJson(QUICK_DATA_PATHS.requestSongs),
    fetchQuickJson(QUICK_DATA_PATHS.radioRequestSongOverrides).catch(() => null),
  ]);

  quickState.spotifySongs = Array.isArray(spotifySongs) ? spotifySongs : [];
  quickState.quickDailyTasks = getQuickTaskItems(quickTaskConfig);
  quickState.requestTexts = requestTexts || {};
  quickState.selectedRadioRequestSongName = getQuickRadioRequestSongName(
    requestSongs,
    radioOverrides
  );

  if (quickTaskConfig?.active !== false && quickState.quickDailyTasks.length === 0) {
    throw new Error("quickTaskJson.json に有効なタスクがありません。");
  }
}

async function fetchQuickJson(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`JSON取得失敗: ${path}`);
  }

  return response.json();
}

function getQuickTaskItems(config) {
  if (!config || config.active === false || !Array.isArray(config.items)) {
    return [];
  }

  return config.items.filter((item) => item?.id && item?.name);
}

function getQuickRadioRequestSongName(requestSongs, radioOverrides) {
  const now = new Date();

  const activeOverride = Array.isArray(radioOverrides)
    ? radioOverrides.find((item) => isActiveRadioOverride(item, now))
    : isActiveRadioOverride(radioOverrides, now)
      ? radioOverrides
      : null;

  if (activeOverride?.songName) {
    return activeOverride.songName;
  }

  const songs = Array.isArray(requestSongs) ? requestSongs : [];

  return songs.find((song) => song.id === "rq_newSong")?.name ||
    songs.find((song) => song.flag === true)?.name ||
    "";
}

function isActiveRadioOverride(override, now) {
  if (!override || override.active !== true) {
    return false;
  }

  const from = parseCompactDateTime(override.from);
  const to = parseCompactDateTime(override.to);

  return (!from || now >= from) && (!to || now <= to);
}

function parseCompactDateTime(value) {
  const text = String(value || "");

  if (!/^\d{12}$/.test(text)) {
    return null;
  }

  return new Date(
    Number(text.slice(0, 4)),
    Number(text.slice(4, 6)) - 1,
    Number(text.slice(6, 8)),
    Number(text.slice(8, 10)),
    Number(text.slice(10, 12))
  );
}

function renderQuickApp() {
  const screenName = QUICK_STEP_IDS[quickState.screen]
    ? quickState.screen
    : "start";

  updateQuickSnsInAppGuide(screenName);

  showQuickScreen(screenName, { shouldStartTutorial: false });
}

const QUICK_SNS_IN_APP_GUIDES = {
  x_in_app: {
    title: "<strong>Xから開いてる場合</strong>",
    text: `
      画面の下の方にこんなの見えてませんか？<br>
      <img src="../../img/setting/setting_ios_x.jpeg" alt="Xアプリ内ブラウザの開き直し方法">
      もし見えていたら、
      <ol>
        <li>画面の下にある<strong>「github.io」</strong>をタップ<br>（画像の赤枠のところ）</li>
        <li><strong>ブラウザで開く</strong>をタップ</li>
      </ol>
    `,
  },
  threads_in_app: {
    title: "<strong>Threadsから開いている場合</strong>",
    text: `
      画面の上の方にこんなの見えてませんか？<br>
      <img src="../../img/setting/setting_ios_threads.jpeg" alt="Threadsアプリ内ブラウザの開き直し方法">
      もし見えていたら、
      <ol>
        <li>画面の右上にある<strong>「<i class="bi bi-three-dots"></i>」</strong>をタップ<br>（画像の赤枠のところ）</li>
        <li><strong>外部ブラウザで開く</strong>をタップ</li>
      </ol>
    `,
  },
  instagram_in_app: {
    title: "<strong>Instagramから開いている場合</strong>",
    text: `
      画面の上の方にこんなの見えてませんか？<br>
      <img src="../../img/setting/setting_ios_threads.jpeg" alt="Instagramアプリ内ブラウザの開き直し方法">
      もし見えていたら、
      <ol>
        <li>画面の右上にある<strong>「<i class="bi bi-three-dots"></i>」</strong>をタップ<br>（画像の赤枠のところ）</li>
        <li><strong>外部ブラウザで開く</strong>をタップ</li>
      </ol>
    `,
  },
  line_in_app: {
    title: "<strong>LINEから開いている場合</strong>",
    text: `
      画面の下の方にこんなの見えてませんか？<br>
      <img src="../../img/setting/setting_ios_line.jpeg" alt="LINEアプリ内ブラウザの開き直し方法">
      もし見えていたら、
      <ol>
        <li>画面の右下にある<strong>「<i class="bi bi-three-dots-vertical"></i>」</strong>をタップ<br>（画像の赤枠のところ）</li>
        <li><strong>ブラウザで開く</strong>をタップ</li>
      </ol>
    `,
  },
};

function getQuickAccessBrowserType() {
  if (typeof getCurrentOrRememberedAccessBrowserType === "function") {
    return getCurrentOrRememberedAccessBrowserType();
  }

  if (typeof getAccessBrowserType === "function") {
    return getAccessBrowserType();
  }

  return "other_browser";
}

function updateQuickSnsInAppGuide(screenName) {
  const browserType = getQuickAccessBrowserType();
  const guide = QUICK_SNS_IN_APP_GUIDES[browserType];
  const shouldShowGuide = screenName === "start" && Boolean(guide);

  quickElements.startButton?.classList.toggle("hidden", shouldShowGuide);
  quickElements.startIntroCard?.classList.toggle("hidden", shouldShowGuide);

  if (!quickElements.snsInAppGuide) {
    return;
  }

  quickElements.snsInAppGuide.classList.toggle("hidden", !shouldShowGuide);

  if (!shouldShowGuide) {
    quickElements.snsInAppGuide.innerHTML = "";
    return;
  }

  quickElements.snsInAppGuide.innerHTML = `
  <h2>最初にこれだけ！</h2>
    <p class="quick-sns-in-app-guide-text">
      このままだとちょっと使いにくいので<br>
      Safari または Chrome で開くのがおすすめです。<br>
      やり方は超簡単！
    </p>
    <h3>${guide.title}</h3>
  <div class="quick-sns-in-app-guide-body">${guide.text}</div>
`;
}


function showQuickScreen(screenName, options = {}) {
  const shouldStartTutorial = options.shouldStartTutorial !== false;

  Object.entries(QUICK_STEP_IDS).forEach(([name, id]) => {
    document.getElementById(id)?.classList.toggle("hidden", name !== screenName);
  });

  document.body.classList.toggle("is-quick-start", screenName === "start");

  quickState.screen = screenName;
  saveQuickSession();

  if (screenName === "spotify") {
    renderQuickSpotify();
  }

  if (screenName === "daily") {
    renderQuickDailyTask();
  }

  if (screenName === "postEdit") {
    renderQuickPostEditor();
  }

  if (screenName === "complete") {
    renderQuickComplete();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (shouldStartTutorial) {
    window.setTimeout(startTutorialForCurrentScreen, 350);
  }
}

// ==================================================
// Spotify
// ==================================================

function renderQuickSpotify() {
  const selectedSong = getSelectedQuickSong();
  const recommendedSongs = quickState.spotifySongs.filter((song) => song.flag === true);
  const otherSongs = quickState.spotifySongs.filter((song) => song.flag !== true);

  renderQuickSongList(quickElements.recommendedSongs, recommendedSongs);
  renderQuickSongList(quickElements.otherSongs, otherSongs);

  quickElements.spotifySelectedArea?.classList.toggle("hidden", !selectedSong);

  if (quickElements.spotifySelectedSongName) {
    quickElements.spotifySelectedSongName.textContent = selectedSong?.name || "";
  }

  quickElements.spotifyNextButton?.classList.toggle(
    "hidden",
    quickState.spotifyChoice !== "spotify"
  );

  hideQuickError(quickElements.spotifyErrorArea);
}

function renderQuickSongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!songs.length) {
    container.textContent = "曲を表示できませんでした。";
    return;
  }

  songs.forEach((song) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "song-button";
    button.textContent = song.name;
    button.classList.toggle("active", song.id === quickState.selectedSongId);

    button.addEventListener("click", () => {
      quickState.selectedSongId = song.id;
      quickState.spotifyChoice = "";
      saveQuickSession();
      renderQuickSpotify();

      startQuickTutorial(
        ["この曲でOK？","「Spotifyで開く」をタップすると、Spotifyが開いて曲が流れるよ。","曲の再生が始まったら「アプリ切り替え」で戻ってきてね。"],
        "#quickSpotifySelectedArea"
      );
    });

    container.appendChild(button);
  });
}

function getSelectedQuickSong() {
  return quickState.spotifySongs.find((song) => {
    return song.id === quickState.selectedSongId;
  }) || null;
}

function openSelectedSpotify() {
  const selectedSong = getSelectedQuickSong();

  if (!selectedSong?.url) {
    showQuickError(quickElements.spotifyErrorArea, "再生する曲を選んでください。");
    return;
  }

  const spotifyUrl = buildQuickSpotifyUrl(selectedSong);

  quickState.spotifyChoice = "spotify";
  saveQuickSession();

  sendQuickEvent("spotifyOpen", {
    itemId: selectedSong.id || "spotify_unknown",
    title: selectedSong.name || "Spotify再生",
    url: spotifyUrl,
  });

  renderQuickSpotify();
  openQuickExternalUrl(spotifyUrl);
}

function buildQuickSpotifyUrl(song) {
  const trackIdOrUrl = song?.url || "";

  if (trackIdOrUrl.startsWith("https://") || trackIdOrUrl.startsWith("http://")) {
    return song.shareId
      ? `${trackIdOrUrl.split("?")[0]}?si=${encodeURIComponent(song.shareId)}`
      : trackIdOrUrl;
  }

  const baseUrl = `https://open.spotify.com/track/${encodeURIComponent(trackIdOrUrl)}`;

  return song.shareId
    ? `${baseUrl}?si=${encodeURIComponent(song.shareId)}`
    : baseUrl;
}

// ==================================================
// quickDaily
// ==================================================

function renderQuickDailyTask() {
  const item = getCurrentQuickDailyTask();
  const taskCount = quickState.quickDailyTasks.length;

  hideQuickError(quickElements.dailyTaskErrorArea);

  if (!item) {
    showQuickScreen("share");
    return;
  }

  const preparedCopyText = prepareQuickDailyCopyText(item);
  const requiresCopy = item["input-flag"] === true && Boolean(preparedCopyText);
  const isOpened = quickState.completedDailyTaskIds.includes(item.id);

  if (quickElements.dailyHeaderDescription) {
    quickElements.dailyHeaderDescription.textContent = quickState.selectedRadioRequestSongName
      ? `今日のラジオリクエスト曲: ${quickState.selectedRadioRequestSongName}`
      : "";
  }

  if (quickElements.dailyActionDescription) {
    quickElements.dailyActionDescription.textContent = requiresCopy
      ? ""
      : "";
  }

  if (quickElements.dailyTaskProgress) {
    quickElements.dailyTaskProgress.textContent = `${quickState.dailyTaskIndex + 1} / ${taskCount}`;
  }

  if (quickElements.dailyTaskName) {
    quickElements.dailyTaskName.textContent = item["short-name"] || item.name || "";
  }

  if (quickElements.dailyTaskCommentArea) {
    const comment = item.comment || "";

    quickElements.dailyTaskCommentArea.textContent = comment;
    quickElements.dailyTaskCommentArea.classList.toggle("hidden", !comment);
  }

  quickElements.dailyTaskCopyPreviewArea?.classList.toggle("hidden", !requiresCopy);

  if (quickElements.dailyTaskCopyPreviewText) {
    quickElements.dailyTaskCopyPreviewText.textContent = preparedCopyText;
  }

  if (quickElements.dailyTaskCopyPreviewPasteTarget) {
    quickElements.dailyTaskCopyPreviewPasteTarget.textContent = item["request-input"]
      ? `貼り付け先: ${item["request-input"]}`
      : "";
  }

  quickElements.openDailyTaskUrlButton?.classList.toggle("hidden", !item.url);
  quickElements.dailyTaskNextButton?.classList.toggle("hidden", !isOpened && Boolean(item.url));

  if (quickElements.dailyTaskNextButton) {
    quickElements.dailyTaskNextButton.textContent = "次へ";
  }
}

function getCurrentQuickDailyTask() {
  return quickState.quickDailyTasks[quickState.dailyTaskIndex] || null;
}

async function openCurrentQuickDailyTask() {
  const item = getCurrentQuickDailyTask();

  if (!item?.url) {
    showQuickError(quickElements.dailyTaskErrorArea, "タスクのURLが設定されていません。");
    return;
  }

  if (item["input-flag"] === true) {
    const copyText = prepareQuickDailyCopyText(item);

    if (copyText && !await copyQuickText(copyText)) {
      showQuickError(
        quickElements.dailyTaskErrorArea,
        "コピーに失敗しました。もう一度「ページを開く」を押してください。"
      );
      return;
    }
  }

  markQuickDailyTaskDone(item);

  sendQuickEvent("taskOpen", {
    itemId: item.id,
    title: item["short-name"] || item.name || "",
    url: item.url,
  });

  renderQuickDailyTask();
  openQuickExternalUrl(item.url);
}

function moveToNextQuickDailyTask() {
  const item = getCurrentQuickDailyTask();

  if (item && !quickState.completedDailyTaskIds.includes(item.id)) {
    markQuickDailyTaskDone(item);
  }

  if (quickState.dailyTaskIndex >= quickState.quickDailyTasks.length - 1) {
    showQuickScreen("share");
    return;
  }

  quickState.dailyTaskIndex += 1;
  saveQuickSession();
  renderQuickDailyTask();
  startTutorialForCurrentScreen();
}

function markQuickDailyTaskDone(item) {
  if (!item?.id) {
    return;
  }

  if (!quickState.completedDailyTaskIds.includes(item.id)) {
    quickState.completedDailyTaskIds.push(item.id);
  }

  const itemName = item["short-name"] || item.name || "";

  if (itemName && !quickState.completedDailyTaskNames.includes(itemName)) {
    quickState.completedDailyTaskNames.push(itemName);
  }

  saveQuickDailyTaskDoneMap(item);
  saveQuickSession();
}

function prepareQuickDailyCopyText(item) {
  if (!item?.id || item["input-flag"] !== true) {
    return "";
  }

  if (quickState.preparedCopyTextMap[item.id]) {
    return quickState.preparedCopyTextMap[item.id];
  }

  const templateValue = quickState.requestTexts[item["request-type"]];

  if (!templateValue) {
    return "";
  }

  const template = Array.isArray(templateValue)
    ? templateValue[Math.floor(Math.random() * templateValue.length)]
    : templateValue;

  const copyText = String(template).replaceAll(
    "musicname",
    quickState.selectedRadioRequestSongName
  );

  quickState.preparedCopyTextMap[item.id] = copyText;

  return copyText;
}

function saveQuickDailyTaskDoneMap(item) {
  const dateKey = getQuickDailyDateKey();
  const rawMap = localStorage.getItem(QUICK_STORAGE_KEYS.dailyTaskDoneMap);

  let doneMap = {};

  try {
    doneMap = rawMap ? JSON.parse(rawMap) : {};
  } catch (error) {
    console.warn("dailyTaskDoneMap読み込み失敗", error);
  }

  doneMap[dateKey] = doneMap[dateKey] || {};
  doneMap[dateKey][item.id] = {
    doneAt: new Date().toISOString(),
    source: "quickMode",
  };

  localStorage.setItem(QUICK_STORAGE_KEYS.dailyTaskDoneMap, JSON.stringify(doneMap));
}

function getQuickDailyDateKey() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const date = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour)
  ));

  if (Number(values.hour) < 18) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

// ==================================================
// SNS共有
// ==================================================

function renderQuickPostEditor() {
  quickState.postItems = buildQuickPostItems();
  setQuickPostPreviewPlatform("x");
  hideQuickError(quickElements.postErrorArea);
}

function buildQuickPostItems() {
  const items = [];

  items.push({
    id: "app-share",
    name: "このツールをSNSにシェア",
    postText: "",
    url: getQuickAppShareUrl(),
    checked: true,
  });

  quickState.completedDailyTaskIds.forEach((taskId) => {
    const task = quickState.quickDailyTasks.find((item) => item.id === taskId);

    if (!task?.name) {
      return;
    }

    items.push({
      id: `daily-${task.id}`,
      name: task.name,
      postText: task["short-name"] || task.name,
      url: task.url || "",
      checked: false,
    });
  });

  const selectedSong = getSelectedQuickSong();

  items.push({
    id: "spotify-bgm",
    name: getQuickPostSpotifyName(selectedSong),
    postText: getQuickPostSpotifyName(selectedSong),
    url: getQuickPostSpotifyUrl(selectedSong),
    checked: false,
  });

  return items;
}

function getQuickPostSpotifyName(selectedSong) {
  if (quickState.spotifyChoice === "noBgm" || !selectedSong?.name) {
    return "🎧timelesz - Spotify";
  }

  return `🎧Spotifyで${selectedSong.name}`;
}

function getQuickPostSpotifyUrl(selectedSong) {
  if (quickState.spotifyChoice === "noBgm" || !selectedSong?.url) {
    return "https://open.spotify.com/intl-ja/artist/1ZFfhzyXjPvbzSYPlCIwo3";
  }

  return buildQuickSpotifyUrl(selectedSong);
}

function setQuickPostPreviewPlatform(platform) {
  quickState.currentPostPlatform = platform === "threads"
    ? "threads"
    : "x";

  quickElements.postPreviewXTabButton?.classList.toggle(
    "active",
    quickState.currentPostPlatform === "x"
  );

  quickElements.postPreviewThreadsTabButton?.classList.toggle(
    "active",
    quickState.currentPostPlatform === "threads"
  );

  quickElements.postPreviewXPanel?.classList.toggle(
    "hidden",
    quickState.currentPostPlatform !== "x"
  );

  quickElements.postPreviewThreadsPanel?.classList.toggle(
    "hidden",
    quickState.currentPostPlatform !== "threads"
  );

  renderQuickPostItemList(quickElements.postItemXList, quickState.postItems);
  renderQuickPostItemList(quickElements.postItemThreadsList, quickState.postItems);
  updateQuickGeneratedPostText();
}

function renderQuickPostItemList(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
    return;
  }

  items.forEach((item, index) => {
    const label = document.createElement("label");

    label.className = "check-item";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.dataset.index = String(index);

    checkbox.addEventListener("change", () => {
      const targetIndex = Number(checkbox.dataset.index);
      const targetItem = quickState.postItems[targetIndex];

      if (!targetItem) {
        return;
      }

      targetItem.checked = checkbox.checked;
      renderQuickPostItemList(quickElements.postItemXList, quickState.postItems);
      renderQuickPostItemList(quickElements.postItemThreadsList, quickState.postItems);
      updateQuickGeneratedPostText();
    });

    const name = document.createElement("span");

    name.className = "check-item-name";
    name.textContent = item.name;

    label.appendChild(checkbox);
    label.appendChild(name);
    container.appendChild(label);
  });
}

function updateQuickGeneratedPostText() {
  const xPostText = buildQuickPostText("x");
  const threadsPostText = buildQuickPostText("threads");

  if (quickElements.generatedXPostText) {
    quickElements.generatedXPostText.textContent = xPostText;
  }

  if (quickElements.generatedThreadsPostText) {
    quickElements.generatedThreadsPostText.textContent = threadsPostText;
  }

  if (quickElements.xPostTextCount) {
    const xLength = countQuickXPostTextLength(xPostText);

    quickElements.xPostTextCount.textContent = `X文字数: ${xLength} / 280`;
    quickElements.xPostTextCount.classList.toggle("warning-text", xLength > 280);
  }

  if (quickElements.threadsPostLinkCount) {
    const linkCount = countQuickLinks(threadsPostText);

    quickElements.threadsPostLinkCount.textContent = `Threadsリンク数: ${linkCount} / 5`;
    quickElements.threadsPostLinkCount.classList.toggle("warning-text", linkCount > 5);
  }

  if (quickElements.copyXPostTextButton) {
    quickElements.copyXPostTextButton.textContent = "コピーする";
  }
}

function buildQuickPostText(platform = "x") {
  const lines = [
    `${formatQuickMonthDay(new Date())}「タムごとDaily」タスク完了👍`,
    `${quickState.selectedRadioRequestSongName}をリクエストしたよ😊`,
  ];

  const bottomShareLines = [];

  quickState.postItems.forEach((item) => {
    if (!item.checked) {
      return;
    }

    const postText = item.postText ?? item.name;

    if (platform === "threads" && item.id === "app-share") {
      if (postText) {
        bottomShareLines.push(postText);
      }

      if (item.url) {
        bottomShareLines.push(getQuickAppShareUrlByPlatform(platform));
      }

      return;
    }

    if (item.id === "spotify-bgm" || item.id === "app-share") {
      if (postText) {
        lines.push(postText);
      }
    } else {
      lines.push(`✅${postText}`);
    }

    if (item.url) {
      lines.push(
        item.id === "app-share"
          ? getQuickAppShareUrlByPlatform(platform)
          : item.url
      );
    }
  });

  lines.push("");
  lines.push("クリックですぐ使えるよ▼");

  if (platform === "threads" && bottomShareLines.length > 0) {
    lines.push(...bottomShareLines);
  }

  return lines.join("\n");
}

async function copyQuickXPostText() {
  const postText = buildQuickPostText("x");

  if (!postText) {
    showQuickError(quickElements.postErrorArea, "コピーする投稿文がありません。");
    return;
  }

  const isCopied = await copyQuickText(postText);

  if (!isCopied) {
    showQuickError(
      quickElements.postErrorArea,
      "コピーに失敗しました。投稿文を長押しでコピーしてください。"
    );
    return;
  }

  hideQuickError(quickElements.postErrorArea);

  if (quickElements.copyXPostTextButton) {
    quickElements.copyXPostTextButton.textContent = "コピーしました";
  }
}

function openQuickXPost() {
  const postText = buildQuickPostText("x");

  if (!postText) {
    showQuickError(quickElements.postErrorArea, "投稿文がありません。");
    return;
  }

  quickState.postShared = true;
  saveQuickSession();
  hideQuickError(quickElements.postErrorArea);

  openQuickExternalUrl(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`
  );
}

async function openQuickThreadsPost() {
  const postText = buildQuickPostText("threads");

  if (!postText) {
    showQuickError(quickElements.postErrorArea, "投稿文がありません。");
    return;
  }

  const isCopied = await copyQuickText(postText);

  if (!isCopied) {
    showQuickError(
      quickElements.postErrorArea,
      "コピーに失敗しました。投稿文を長押しでコピーしてください。"
    );
    return;
  }

  quickState.postShared = true;
  saveQuickSession();
  hideQuickError(quickElements.postErrorArea);
  openQuickExternalUrl("https://www.threads.net/");
}

function formatQuickMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getQuickAppShareUrl() {
  return new URL("../", window.location.href).toString();
}

function getQuickShareParamByPlatform(platform = "x") {
  const prefix = platform === "threads" ? "th" : "x";
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `${prefix}_${yyyy}${mm}${dd}`;
}

function getQuickAppShareUrlByPlatform(platform = "x") {
  const url = new URL(getQuickAppShareUrl());

  url.searchParams.set("share", getQuickShareParamByPlatform(platform));

  return url.toString();
}

function countQuickXPostTextLength(text) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];
  const textWithoutUrls = text.replace(urlPattern, "");

  return countQuickXWeightedTextLength(textWithoutUrls) + (urls.length * 23);
}

function countQuickXWeightedTextLength(text) {
  let count = 0;

  Array.from(text).forEach((char) => {
    count += /^[\u0020-\u007e\u00a1-\u00ff]$/.test(char)
      ? 1
      : 2;
  });

  return count;
}

function countQuickLinks(text) {
  return (text.match(/https?:\/\/\S+/g) || []).length;
}

// ==================================================
// 完了・ホーム画面追加
// ==================================================

function renderQuickComplete() {
  quickElements.installGuideCard?.classList.remove("hidden");
}

let isQuickSetupGuideInitialized = false;

const quickSetupGuideState = {
  deviceType: "",
  iosDisplayType: "",
};

const QUICK_SETUP_GUIDE_IMAGE_BASE_PATH = "../../img/setting/";

const QUICK_SETUP_GUIDE_IMAGES = {
  iosSafariType01: {
    title: "タイプ①：コンパクトモードの場合",
    src: `${QUICK_SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-safari-type01.png`,
    alt: "Safariコンパクトモードの場合のホーム画面追加手順",
  },
  iosSafariType02: {
    title: "タイプ②：共有ボタンが画面にある場合",
    src: `${QUICK_SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-safari-type02.png`,
    alt: "Safariの共有ボタンが画面にある場合のホーム画面追加手順",
  },
  iosChrome: {
    title: "iPhone・iPadでChromeを使用している場合",
    src: `${QUICK_SETUP_GUIDE_IMAGE_BASE_PATH}setup-ios-chrome.png`,
    alt: "iPhoneまたはiPadのChromeでホーム画面に追加する手順",
  },
  android: {
    title: "Androidでホーム画面に追加する方法",
    src: `${QUICK_SETUP_GUIDE_IMAGE_BASE_PATH}setup-android-chrome.png`,
    alt: "AndroidのChromeでホーム画面に追加する手順",
  },
  checkLaunch: {
    title: "最後にここを確認",
    src: `${QUICK_SETUP_GUIDE_IMAGE_BASE_PATH}setup-check-launch.png`,
    alt: "ホーム画面のアイコンから起動できているか確認する画像",
  },
};

function openQuickSetupModal() {
  initializeQuickSetupGuide();
  quickElements.setupModal?.classList.remove("hidden");
  quickElements.setupModal?.setAttribute("aria-hidden", "false");
}

function closeQuickSetupModal() {
  quickElements.setupModal?.classList.add("hidden");
  quickElements.setupModal?.setAttribute("aria-hidden", "true");
}

function initializeQuickSetupGuide() {
  if (isQuickSetupGuideInitialized) {
    return;
  }

  isQuickSetupGuideInitialized = true;

  const deviceTypeButtons = document.querySelectorAll("[data-device-type]");
  const iosDisplayTypeButtons = document.querySelectorAll("[data-ios-display-type]");

  deviceTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      quickSetupGuideState.deviceType = button.dataset.deviceType;
      quickSetupGuideState.iosDisplayType = "";

      setActiveQuickSetupButton(deviceTypeButtons, button);
      resetQuickSetupButtons(iosDisplayTypeButtons);
      clearQuickDeviceGuide();

      if (quickSetupGuideState.deviceType === "ios") {
        showQuickIosDisplayQuestion();
        scrollQuickSetupGuideIntoView(document.getElementById("setupIosDisplayQuestion"));
        return;
      }

      hideQuickIosDisplayQuestion();
      renderQuickDeviceGuide();
      scrollQuickSetupGuideIntoView(document.getElementById("setupDeviceGuideArea"));
    });
  });

  iosDisplayTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      quickSetupGuideState.iosDisplayType = button.dataset.iosDisplayType;

      setActiveQuickSetupButton(iosDisplayTypeButtons, button);
      renderQuickDeviceGuide();
      scrollQuickSetupGuideIntoView(document.getElementById("setupDeviceGuideArea"));
    });
  });
}

function renderQuickDeviceGuide() {
  const area = document.getElementById("setupDeviceGuideArea");

  if (!area) {
    return;
  }

  const guide = getQuickDeviceGuideImage();

  if (!guide) {
    clearQuickDeviceGuide();
    return;
  }

  area.innerHTML = `
    <div class="setup-guide-card">
      ${buildQuickSetupGuideImageHtml(guide)}
      ${buildQuickSetupCheckLaunchHtml()}
    </div>
  `;

  area.classList.remove("hidden");
}

function getQuickDeviceGuideImage() {
  if (quickSetupGuideState.deviceType === "android") {
    return QUICK_SETUP_GUIDE_IMAGES.android;
  }

  if (quickSetupGuideState.deviceType !== "ios") {
    return null;
  }

  if (quickSetupGuideState.iosDisplayType === "safari-type01") {
    return QUICK_SETUP_GUIDE_IMAGES.iosSafariType01;
  }

  if (quickSetupGuideState.iosDisplayType === "safari-type02") {
    return QUICK_SETUP_GUIDE_IMAGES.iosSafariType02;
  }

  if (quickSetupGuideState.iosDisplayType === "chrome") {
    return QUICK_SETUP_GUIDE_IMAGES.iosChrome;
  }

  return null;
}

function buildQuickSetupGuideImageHtml(guide) {
  return `
    <div class="setup-guide-image-block">
      <h3>${guide.title}</h3>
      <img class="setup-guide-image" src="${guide.src}" alt="${guide.alt}" loading="lazy">
    </div>
  `;
}

function buildQuickSetupCheckLaunchHtml() {
  const checkGuide = QUICK_SETUP_GUIDE_IMAGES.checkLaunch;

  return `
    <div class="setup-check-block">
      <h3>${checkGuide.title}</h3>
      <img class="setup-guide-image" src="${checkGuide.src}" alt="${checkGuide.alt}" loading="lazy">
      <p class="setup-guide-note">ホーム画面に追加されたアイコンをタップして起動してください！</p>
    </div>
  `;
}

function setActiveQuickSetupButton(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
}

function resetQuickSetupButtons(buttons) {
  buttons.forEach((button) => {
    button.classList.remove("active");
  });
}

function showQuickIosDisplayQuestion() {
  document.getElementById("setupIosDisplayQuestion")?.classList.remove("hidden");
}

function hideQuickIosDisplayQuestion() {
  document.getElementById("setupIosDisplayQuestion")?.classList.add("hidden");
}

function clearQuickDeviceGuide() {
  const area = document.getElementById("setupDeviceGuideArea");

  if (!area) {
    return;
  }

  area.innerHTML = "";
  area.classList.add("hidden");
}

function scrollQuickSetupGuideIntoView(targetElement) {
  if (!targetElement) {
    return;
  }

  window.setTimeout(() => {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, 80);
}

// ==================================================
// チュートリアル
// ==================================================

function startTutorialForCurrentScreen() {
  if (!quickState.tutorial.enabled) {
    return;
  }

  const currentDailyTask = getCurrentQuickDailyTask();
  const dailyMessages = currentDailyTask?.["input-flag"] === true
    ? [
      "「ページを開く」を押すと、入力する内容がコピーされて、新しいタブでページが開くよ。",
      `ページが開いたら「${currentDailyTask["request-input"] || "入力欄"}」に貼り付けてね。`,
      "終わったら「タブ切り替え」で戻ってきてね。",
      "戻れたら「次へ」ボタンを押して次に進もう！",
    ]
    : [
      "このタスクのやり方はここに書いてあるよ！",
      "「ページを開く」を押すと、新しいタブでページが開くよ。",
      "終わったら「タブ切り替え」で戻ってきてね。",
      "戻れたら「次へ」ボタンを押して次に進もう！",
    ];

  const tutorialMap = {
    spotify: {
      target: "#quickRecommendedSongs",
      messages: [
        "下のリストから好きな曲を選んでみよう。",
        "聞きたい曲がないときは「その他」を押すと、表示される曲が増えるよ。",
        "Spotifyを入れていない人は下にスクロールして、「BGMなし」を押して次へ進めるよ。",
      ],
    },
    daily: {
      target: "#quickDailyTaskGuideArea",
      messages: dailyMessages,
    },
    share: {
      target: "#quickMakePostButton",
      messages: [
        "今日やったタスク、せっかくならSNSで共有しない？",
        "共有しない場合は「やめとく」を押してね。",
      ],
    },
    postEdit: {
      target: "#quickPostItemXList",
      messages: [
        "投稿先を選んで、シェアしたい項目にチェックを入れてください。",
        "投稿しない場合は「次へ」を押してね。",
      ],
    },
    complete: {
      target: "#quickInstallGuideCard",
      messages: [
        "お疲れ様さまでした☺️",
        "ホーム画面に追加すると、もっと便利に使えます！",
        "ぜひ試してみてね💚"
      ],
    },
  };

  const config = tutorialMap[quickState.screen];

  if (!config) {
    stopQuickTutorial();
    return;
  }

  startQuickTutorial(config.messages, config.target);
}

function startQuickTutorial(messages, targetSelector) {
  if (!quickState.tutorial.enabled || !messages?.length) {
    return;
  }

  quickState.tutorial.messages = messages;
  quickState.tutorial.index = 0;
  quickState.tutorial.targetSelector = targetSelector || "";

  quickElements.tutorialOverlay?.classList.remove("hidden", "is-message-hidden");
  quickElements.tutorialOverlay?.classList.add("is-active");
  quickElements.tutorialOverlay?.setAttribute("aria-hidden", "false");

  updateTutorialTarget(targetSelector);
  typeQuickTutorialMessage(messages[0]);
}

function stopQuickTutorial() {
  clearTimeout(quickState.tutorial.timerId);

  quickState.tutorial.messages = [];
  quickState.tutorial.index = 0;
  quickState.tutorial.isTyping = false;
  quickState.tutorial.targetSelector = "";

  document.querySelectorAll(".quick-tutorial-target").forEach((element) => {
    element.classList.remove("quick-tutorial-target");
  });

  quickElements.tutorialOverlay?.classList.add("hidden");
  quickElements.tutorialOverlay?.classList.remove("is-active", "is-message-hidden");
  quickElements.tutorialOverlay?.setAttribute("aria-hidden", "true");
}

function typeQuickTutorialMessage(message) {
  clearTimeout(quickState.tutorial.timerId);

  const safeMessage = String(message || "");
  let index = 0;

  quickState.tutorial.isTyping = true;

  if (quickElements.tutorialText) {
    quickElements.tutorialText.textContent = "";
  }

  if (quickElements.tutorialHint) {
    quickElements.tutorialHint.textContent = "タップで全文表示";
  }

  const renderNextCharacter = () => {
    if (!quickState.tutorial.isTyping) {
      return;
    }

    quickElements.tutorialText.textContent = safeMessage.slice(0, index);
    index += 1;

    if (index <= safeMessage.length) {
      quickState.tutorial.timerId = window.setTimeout(renderNextCharacter, 32);
      return;
    }

    completeQuickTutorialTyping(safeMessage);
  };

  renderNextCharacter();
}

function completeQuickTutorialTyping(message) {
  clearTimeout(quickState.tutorial.timerId);
  quickState.tutorial.isTyping = false;

  if (quickElements.tutorialText) {
    quickElements.tutorialText.textContent = message;
  }

  if (quickElements.tutorialHint) {
    const hasNextMessage = quickState.tutorial.index < quickState.tutorial.messages.length - 1;

    quickElements.tutorialHint.textContent = hasNextMessage
      ? "次へ"
      : "次へ";
  }
}

function handleQuickTutorialDocumentTap(event) {
  if (
    !quickState.tutorial.enabled ||
    quickElements.tutorialOverlay?.classList.contains("hidden") ||
    quickState.tutorial.messages.length === 0
  ) {
    return;
  }

  const interactiveTarget = event.target.closest("button, a, input, textarea, select, label");

  if (quickState.tutorial.isTyping) {
    event.preventDefault();
    event.stopImmediatePropagation();

    completeQuickTutorialTyping(
      quickState.tutorial.messages[quickState.tutorial.index] || ""
    );
    return;
  }

  if (interactiveTarget) {
    return;
  }

  const hasNextMessage = quickState.tutorial.index < quickState.tutorial.messages.length - 1;

  if (!hasNextMessage) {
    stopQuickTutorial();
    return;
  }

  quickState.tutorial.index += 1;

  typeQuickTutorialMessage(
    quickState.tutorial.messages[quickState.tutorial.index]
  );
}

function updateTutorialTarget(selector) {
  document.querySelectorAll(".quick-tutorial-target").forEach((element) => {
    element.classList.remove("quick-tutorial-target");
  });

  const target = document.querySelector(selector);

  if (!target) {
    return;
  }

  target.classList.add("quick-tutorial-target");

  window.setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(updateTutorialSpotlight, 350);
  }, 50);
}

function updateTutorialSpotlight() {
  const selector = quickState.tutorial.targetSelector;

  if (!selector || !quickElements.tutorialSpotlight) {
    return;
  }

  const target = document.querySelector(selector);

  if (!target || target.closest(".hidden")) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const padding = 8;

  quickElements.tutorialSpotlight.style.top = `${Math.max(8, rect.top - padding)}px`;
  quickElements.tutorialSpotlight.style.left = `${Math.max(8, rect.left - padding)}px`;
  quickElements.tutorialSpotlight.style.width = `${rect.width + (padding * 2)}px`;
  quickElements.tutorialSpotlight.style.height = `${rect.height + (padding * 2)}px`;
}

// ==================================================
// 保存・復帰
// ==================================================

function restoreQuickSession() {
  const rawSession = sessionStorage.getItem(QUICK_STORAGE_KEYS.session);

  if (!rawSession) {
    return;
  }

  try {
    Object.assign(
      quickState,
      QUICK_STATE_DEFAULT,
      JSON.parse(rawSession)
    );
  } catch (error) {
    console.warn("quickセッション復元失敗", error);
    sessionStorage.removeItem(QUICK_STORAGE_KEYS.session);
  }
}

function saveQuickSession() {
  const stateToSave = {
    screen: quickState.screen,
    started: quickState.started,
    sessionId: quickState.sessionId,
    completeLogged: quickState.completeLogged,
    selectedSongId: quickState.selectedSongId,
    spotifyChoice: quickState.spotifyChoice,
    dailyTaskIndex: quickState.dailyTaskIndex,
    completedDailyTaskIds: quickState.completedDailyTaskIds,
    completedDailyTaskNames: quickState.completedDailyTaskNames,
    postShared: quickState.postShared,
    postSkipped: quickState.postSkipped,
    preparedCopyTextMap: quickState.preparedCopyTextMap,
  };

  sessionStorage.setItem(
    QUICK_STORAGE_KEYS.session,
    JSON.stringify(stateToSave)
  );
}

function clearQuickSession() {
  sessionStorage.removeItem(QUICK_STORAGE_KEYS.session);
  Object.assign(quickState, QUICK_STATE_DEFAULT);
}

function restoreTutorialSetting() {
  quickState.tutorial.enabled = localStorage.getItem(
    QUICK_STORAGE_KEYS.tutorialEnabled
  ) !== "false";

  if (quickElements.tutorialToggle) {
    quickElements.tutorialToggle.checked = quickState.tutorial.enabled;
  }
}

function setQuickTutorialEnabled(enabled) {
  quickState.tutorial.enabled = enabled;

  localStorage.setItem(
    QUICK_STORAGE_KEYS.tutorialEnabled,
    enabled ? "true" : "false"
  );

  if (!enabled) {
    stopQuickTutorial();
  }
}

// ==================================================
// 共通
// ==================================================

async function copyQuickText(text) {
  if (!text) {
    return true;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    try {
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");

      textarea.remove();

      return copied;
    } catch (fallbackError) {
      console.error("コピー失敗", fallbackError);
      return false;
    }
  }
}

function openQuickExternalUrl(url) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function showQuickError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function hideQuickError(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}

function showQuickFatalError() {
  const startStep = document.getElementById(QUICK_STEP_IDS.start);

  if (!startStep) {
    return;
  }

  const message = document.createElement("p");

  message.className = "error-area";
  message.textContent = "データの読み込みに失敗しました。ページを再読み込みしてください。";

  startStep.appendChild(message);
}
