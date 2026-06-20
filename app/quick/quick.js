// ==================================================
// quick.js
// 30秒だけ時間をください：Spotify + quickDaily + SNS共有
// ==================================================

const QUICK_DATA_PATHS = {
  spotifySongs: "../../data/spotifySongJson.json",
  dailyGroups: "../../data/listJson.json",
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
};

const quickState = {
  ...QUICK_STATE_DEFAULT,
  spotifySongs: [],
  quickDailyTasks: [],
  requestTexts: {},
  selectedRadioRequestSongName: "",
  preparedCopyTextMap: {},
  tutorial: {
    enabled: true,
    messages: [],
    index: 0,
    isTyping: false,
    timerId: null,
    targetSelector: "",
  },
};

// ==================================================
// DOM
// ==================================================

const quickElements = {
  tutorialToggle: document.getElementById("quickTutorialToggle"),

  startButton: document.getElementById("quickStartButton"),

  spotifySelectedArea: document.getElementById("quickSpotifySelectedArea"),
  spotifySelectedSongName: document.getElementById("quickSpotifySelectedSongName"),
  recommendedSongs: document.getElementById("quickRecommendedSongs"),
  otherSongs: document.getElementById("quickOtherSongs"),
  otherSongsWrapper: document.getElementById("quickOtherSongsWrapper"),
  toggleOtherSongsButton: document.getElementById("quickToggleOtherSongsButton"),
  toggleOtherSongsIcon: document.getElementById("quickToggleOtherSongsIcon"),
  openSpotifyButton: document.getElementById("quickOpenSpotifyButton"),
  skipSpotifyButton: document.getElementById("quickSkipSpotifyButton"),
  spotifyNextArea: document.getElementById("quickSpotifyNextArea"),
  spotifyNextButton: document.getElementById("quickSpotifyNextButton"),
  spotifyErrorArea: document.getElementById("quickSpotifyErrorArea"),

  dailyHeaderDescription: document.getElementById("quickDailyHeaderDescription"),
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
  postTextArea: document.getElementById("quickPostTextArea"),
  postTextCount: document.getElementById("quickPostTextCount"),
  postToXButton: document.getElementById("quickPostToXButton"),
  postToThreadsButton: document.getElementById("quickPostToThreadsButton"),
  postNextButton: document.getElementById("quickPostNextButton"),
  postErrorArea: document.getElementById("quickPostErrorArea"),

  installGuideCard: document.getElementById("quickInstallGuideCard"),
  pwaCompleteCard: document.getElementById("quickPwaCompleteCard"),
  openSetupButton: document.getElementById("quickOpenSetupButton"),
  skipSetupButton: document.getElementById("quickSkipSetupButton"),

  tutorialOverlay: document.getElementById("quickTutorialOverlay"),
  tutorialSpotlight: document.getElementById("quickTutorialSpotlight"),
  tutorialText: document.getElementById("quickTutorialText"),
  tutorialHint: document.getElementById("quickTutorialHint"),

  setupModal: document.getElementById("quickSetupModal"),
  closeSetupButton: document.getElementById("quickCloseSetupButton"),
  setupModalBody: document.getElementById("quickSetupModalBody"),
};

// ==================================================
// 初期化
// ==================================================

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
  quickElements.startButton?.addEventListener("click", () => {
    quickState.started = true;
    quickState.screen = "spotify";
    saveQuickSession();
    showQuickScreen("spotify");
  });

  quickElements.toggleOtherSongsButton?.addEventListener("click", () => {
    const isHidden = quickElements.otherSongsWrapper.classList.toggle("hidden");

    quickElements.toggleOtherSongsIcon.textContent = isHidden ? "＋" : "－";
  });

  quickElements.openSpotifyButton?.addEventListener("click", () => {
    openSelectedSpotify();
  });

  quickElements.skipSpotifyButton?.addEventListener("click", () => {
    quickState.spotifyChoice = "noBgm";
    saveQuickSession();
    showQuickScreen("daily");
  });

  quickElements.spotifyNextButton?.addEventListener("click", () => {
    showQuickScreen("daily");
  });

  quickElements.openDailyTaskUrlButton?.addEventListener("click", async () => {
    await openCurrentQuickDailyTask();
  });

  quickElements.dailyTaskNextButton?.addEventListener("click", () => {
    moveToNextQuickDailyTask();
  });

  quickElements.makePostButton?.addEventListener("click", () => {
    quickState.screen = "postEdit";
    saveQuickSession();
    showQuickScreen("postEdit");
  });

  quickElements.skipPostButton?.addEventListener("click", () => {
    quickState.postSkipped = true;
    quickState.screen = "complete";
    saveQuickSession();
    showQuickScreen("complete");
  });

  quickElements.postTextArea?.addEventListener("input", () => {
    updatePostTextCount();
  });

  quickElements.postToXButton?.addEventListener("click", () => {
    postQuickToX();
  });

  quickElements.postToThreadsButton?.addEventListener("click", async () => {
    await postQuickToThreads();
  });

  quickElements.postNextButton?.addEventListener("click", () => {
    quickState.screen = "complete";
    saveQuickSession();
    showQuickScreen("complete");
  });

  quickElements.openSetupButton?.addEventListener("click", () => {
    openQuickSetupModal();
  });

  quickElements.skipSetupButton?.addEventListener("click", () => {
    closeQuickSetupModal();
  });

  quickElements.closeSetupButton?.addEventListener("click", () => {
    closeQuickSetupModal();
  });

  quickElements.setupModal?.addEventListener("click", (event) => {
    if (event.target === quickElements.setupModal) {
      closeQuickSetupModal();
    }
  });

  quickElements.tutorialToggle?.addEventListener("change", () => {
    setQuickTutorialEnabled(quickElements.tutorialToggle.checked);

    if (quickElements.tutorialToggle.checked) {
      startTutorialForCurrentScreen();
      return;
    }

    stopQuickTutorial();
  });

  document.addEventListener(
    "click",
    (event) => {
      handleQuickTutorialDocumentTap(event);
    },
    true
  );

  window.addEventListener("resize", updateTutorialSpotlight);
  window.addEventListener("scroll", updateTutorialSpotlight, { passive: true });
}

// ==================================================
// データ読み込み
// ==================================================

async function loadQuickData() {
  const [
    spotifySongs,
    dailyGroups,
    quickTaskConfig,
    requestTexts,
    requestSongs,
    radioOverrides,
  ] = await Promise.all([
    fetchQuickJson(QUICK_DATA_PATHS.spotifySongs),
    fetchQuickJson(QUICK_DATA_PATHS.dailyGroups),
    fetchQuickJson(QUICK_DATA_PATHS.quickTasks),
    fetchQuickJson(QUICK_DATA_PATHS.requestTexts),
    fetchQuickJson(QUICK_DATA_PATHS.requestSongs),
    fetchQuickJson(QUICK_DATA_PATHS.radioRequestSongOverrides).catch(() => null),
  ]);

  quickState.spotifySongs = Array.isArray(spotifySongs) ? spotifySongs : [];
  quickState.requestTexts = requestTexts || {};
  quickState.selectedRadioRequestSongName = getQuickRadioRequestSongName(
    requestSongs,
    radioOverrides
  );

  const quickTaskIds = getQuickTaskIds(quickTaskConfig);
  const dailyItems = flattenDailyGroups(dailyGroups);

  quickState.quickDailyTasks = quickTaskIds
    .map((taskId) => dailyItems.find((item) => item.id === taskId))
    .filter(Boolean);

  if (quickTaskIds.length > 0 && quickState.quickDailyTasks.length === 0) {
    throw new Error("quickTaskJson.json の taskIds に一致するタスクがありません。");
  }
}

async function fetchQuickJson(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`JSON取得失敗: ${path}`);
  }

  return response.json();
}

function getQuickTaskIds(config) {
  if (Array.isArray(config)) {
    return config.filter(Boolean);
  }

  if (!config || config.active === false) {
    return [];
  }

  const candidates = [
    config.taskIds,
    config.dailyTaskIds,
    config.items,
  ];

  const taskIds = candidates.find((value) => Array.isArray(value)) || [];

  return taskIds
    .map((item) => (typeof item === "string" ? item : item?.id))
    .filter(Boolean);
}

function flattenDailyGroups(groups) {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap((group) => {
    const items = Array.isArray(group?.items) ? group.items : [];

    return items.map((item) => ({
      ...item,
      _groupName: group.listName || "",
    }));
  });
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

  return (
    songs.find((song) => song.id === "rq_newSong")?.name ||
    songs.find((song) => song.flag === true)?.name ||
    ""
  );
}

function isActiveRadioOverride(override, now) {
  if (!override || override.active !== true) {
    return false;
  }

  const from = parseCompactDateTime(override.from);
  const to = parseCompactDateTime(override.to);

  if (from && now < from) {
    return false;
  }

  if (to && now > to) {
    return false;
  }

  return true;
}

function parseCompactDateTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

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

// ==================================================
// 画面表示
// ==================================================

function renderQuickApp() {
  const screen = QUICK_STEP_IDS[quickState.screen]
    ? quickState.screen
    : "start";

  showQuickScreen(screen, {
    shouldStartTutorial: false,
  });
}

function showQuickScreen(screenName, options = {}) {
  const {
    shouldStartTutorial = true,
  } = options;

  Object.entries(QUICK_STEP_IDS).forEach(([name, elementId]) => {
    const element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    element.classList.toggle("hidden", name !== screenName);
  });

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

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (shouldStartTutorial) {
    window.setTimeout(() => {
      startTutorialForCurrentScreen();
    }, 350);
  }
}

// ==================================================
// Spotify
// ==================================================

function renderQuickSpotify() {
  const selectedSong = getSelectedQuickSong();
  const recommendedSongs = quickState.spotifySongs.filter((song) => song.flag === true);
  const otherSongs = quickState.spotifySongs.filter((song) => song.flag !== true);

  renderQuickSongList(
    quickElements.recommendedSongs,
    recommendedSongs
  );

  renderQuickSongList(
    quickElements.otherSongs,
    otherSongs
  );

  quickElements.spotifySelectedArea?.classList.toggle(
    "hidden",
    !selectedSong
  );

  if (quickElements.spotifySelectedSongName) {
    quickElements.spotifySelectedSongName.textContent = selectedSong?.name || "";
  }

  const spotifyOpened = quickState.spotifyChoice === "spotify";

  quickElements.spotifyNextArea?.classList.toggle(
    "hidden",
    !spotifyOpened
  );

  hideQuickError(quickElements.spotifyErrorArea);
}

function renderQuickSongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!Array.isArray(songs) || songs.length === 0) {
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
        ["この曲で再生するなら、\n「Spotifyを開く」をタップしてね。"],
        "#quickSpotifySelectedArea"
      );
    });

    container.appendChild(button);
  });
}

function getSelectedQuickSong() {
  return quickState.spotifySongs.find(
    (song) => song.id === quickState.selectedSongId
  ) || null;
}

function openSelectedSpotify() {
  const selectedSong = getSelectedQuickSong();

  if (!selectedSong?.url) {
    showQuickError(
      quickElements.spotifyErrorArea,
      "再生する曲を選んでください。"
    );
    return;
  }

  quickState.spotifyChoice = "spotify";
  saveQuickSession();
  renderQuickSpotify();

  openQuickExternalUrl(buildQuickSpotifyUrl(selectedSong));
}

function buildQuickSpotifyUrl(song) {
  const trackIdOrUrl = song?.url || "";

  if (
    trackIdOrUrl.startsWith("https://") ||
    trackIdOrUrl.startsWith("http://")
  ) {
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

  if (quickElements.dailyHeaderDescription) {
    quickElements.dailyHeaderDescription.textContent =
      quickState.selectedRadioRequestSongName
        ? `今日のラジオリクエスト曲: ${quickState.selectedRadioRequestSongName}`
        : "";
  }

  if (quickElements.dailyTaskProgress) {
    quickElements.dailyTaskProgress.textContent =
      `${quickState.dailyTaskIndex + 1} / ${taskCount}`;
  }

  if (quickElements.dailyTaskName) {
    quickElements.dailyTaskName.textContent =
      item["short-name"] || item.name || "";
  }

  if (quickElements.dailyTaskCommentArea) {
    const comment = item.comment || "ページを開いて応援してね。";

    quickElements.dailyTaskCommentArea.textContent = comment;
    quickElements.dailyTaskCommentArea.classList.toggle(
      "hidden",
      !comment
    );
  }

  const requiresCopy = item["input-flag"] === true && Boolean(preparedCopyText);

  quickElements.dailyTaskCopyPreviewArea?.classList.toggle(
    "hidden",
    !requiresCopy
  );

  if (quickElements.dailyTaskCopyPreviewText) {
    quickElements.dailyTaskCopyPreviewText.textContent = preparedCopyText;
  }

  if (quickElements.dailyTaskCopyPreviewPasteTarget) {
    quickElements.dailyTaskCopyPreviewPasteTarget.textContent =
      item["request-input"]
        ? `貼り付け先: ${item["request-input"]}`
        : "";
  }

  const isOpened = quickState.completedDailyTaskIds.includes(item.id);

  quickElements.openDailyTaskUrlButton?.classList.toggle(
    "hidden",
    !item.url
  );

  quickElements.dailyTaskNextButton?.classList.toggle(
    "hidden",
    !isOpened && Boolean(item.url)
  );

  if (quickElements.dailyTaskNextButton) {
    quickElements.dailyTaskNextButton.textContent =
      quickState.dailyTaskIndex >= taskCount - 1
        ? "SNSシェアへ"
        : "次へ";
  }
}

function getCurrentQuickDailyTask() {
  return quickState.quickDailyTasks[quickState.dailyTaskIndex] || null;
}

async function openCurrentQuickDailyTask() {
  const item = getCurrentQuickDailyTask();

  if (!item?.url) {
    showQuickError(
      quickElements.dailyTaskErrorArea,
      "タスクのURLが設定されていません。"
    );
    return;
  }

  if (item["input-flag"] === true) {
    const copyText = prepareQuickDailyCopyText(item);

    if (copyText) {
      const isCopied = await copyQuickText(copyText);

      if (!isCopied) {
        showQuickError(
          quickElements.dailyTaskErrorArea,
          "コピーに失敗しました。もう一度「ページを開く」を押してください。"
        );
        return;
      }
    }
  }

  markQuickDailyTaskDone(item);
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

  const requestType = item["request-type"];
  const templateValue = quickState.requestTexts[requestType];

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

  localStorage.setItem(
    QUICK_STORAGE_KEYS.dailyTaskDoneMap,
    JSON.stringify(doneMap)
  );
}

function getQuickDailyDateKey() {
  const now = new Date();
  const jstText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    jstText
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const date = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour)
    )
  );

  if (Number(values.hour) < 18) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

// ==================================================
// SNS共有
// ==================================================

function renderQuickPostEditor() {
  if (!quickElements.postTextArea) {
    return;
  }

  quickElements.postTextArea.value = buildQuickPostText();
  quickElements.postNextButton.textContent = "投稿せず進む";

  updatePostTextCount();
}

function buildQuickPostText() {
  const selectedSong = getSelectedQuickSong();
  const completedTasks = quickState.completedDailyTaskNames;

  const lines = [
    "タムごとDailyで今日の応援完了！",
  ];

  if (quickState.spotifyChoice === "spotify" && selectedSong?.name) {
    lines.push(`Spotify：${selectedSong.name}`);
  }

  if (quickState.spotifyChoice === "noBgm") {
    lines.push("Spotify：BGMなしで参加");
  }

  if (completedTasks.length > 0) {
    lines.push(`今日やったこと：${completedTasks.join("・")}`);
  }

  lines.push("");
  lines.push("#タムごとDaily");
  lines.push(`${location.origin}${location.pathname}`);

  return lines.join("\n");
}

function updatePostTextCount() {
  const text = quickElements.postTextArea?.value || "";
  const count = countQuickXLength(text);

  if (quickElements.postTextCount) {
    quickElements.postTextCount.textContent = `X文字数: ${count} / 280`;
    quickElements.postTextCount.classList.toggle("is-warning", count > 280);
  }
}

function countQuickXLength(text) {
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const textWithoutUrls = text.replace(/https?:\/\/[^\s]+/g, "");

  return Array.from(textWithoutUrls).length + (urls.length * 23);
}

function postQuickToX() {
  const postText = quickElements.postTextArea?.value.trim() || "";

  if (!postText) {
    showQuickError(quickElements.postErrorArea, "投稿文がありません。");
    return;
  }

  const postUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;

  quickState.postShared = true;
  saveQuickSession();

  quickElements.postNextButton.textContent = "投稿した！次へ";
  openQuickExternalUrl(postUrl);
}

async function postQuickToThreads() {
  const postText = quickElements.postTextArea?.value.trim() || "";

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

  quickElements.postNextButton.textContent = "投稿した！次へ";

  window.open("https://www.threads.net/", "_blank", "noopener,noreferrer");
}

// ==================================================
// 完了・ホーム画面追加
// ==================================================

function renderQuickComplete() {
  const isStandalone = isQuickStandaloneMode();

  quickElements.installGuideCard?.classList.toggle("hidden", isStandalone);
  quickElements.pwaCompleteCard?.classList.toggle("hidden", !isStandalone);
}

function openQuickSetupModal() {
  renderQuickSetupGuide();
  quickElements.setupModal?.classList.remove("hidden");
  quickElements.setupModal?.setAttribute("aria-hidden", "false");
}

function closeQuickSetupModal() {
  quickElements.setupModal?.classList.add("hidden");
  quickElements.setupModal?.setAttribute("aria-hidden", "true");
}

function renderQuickSetupGuide() {
  if (!quickElements.setupModalBody) {
    return;
  }

  const userAgent = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  let guideHtml = "";

  if (isIOS) {
    guideHtml = `
      <div class="quick-setup-guide">
        <p>
          Safariでこのページを開いて、画面下の
          <strong>共有ボタン</strong>から
          <strong>「ホーム画面に追加」</strong>を選んでね。
        </p>
        <p class="quick-setup-guide-note">
          X・Instagram・Threadsなどのアプリ内ブラウザでは追加できないことがあります。
          Safariで開き直してから進めてください。
        </p>
      </div>
    `;
  } else if (isAndroid) {
    guideHtml = `
      <div class="quick-setup-guide">
        <p>
          Chrome右上の<strong>︙</strong>から
          <strong>「ホーム画面に追加」</strong>または
          <strong>「アプリをインストール」</strong>を選んでね。
        </p>
      </div>
    `;
  } else {
    guideHtml = `
      <div class="quick-setup-guide">
        <p>
          ブラウザのメニューから
          <strong>「ホーム画面に追加」</strong>または
          <strong>「アプリをインストール」</strong>を探してみてね。
        </p>
      </div>
    `;
  }

  quickElements.setupModalBody.innerHTML = guideHtml;
}

// ==================================================
// チュートリアル
// ==================================================

function startTutorialForCurrentScreen() {
  if (!quickState.tutorial.enabled) {
    return;
  }

  const tutorialMap = {
    spotify: {
      target: "#quickRecommendedSongs",
      messages: [
        "まずは、聴きたい曲を\nひとつ選んでみよう。",
        "Spotifyを入れていない人は、\n下までスクロールして\n「BGMなしで進む」でも大丈夫。",
      ],
    },
    daily: {
      target: ".quick-daily-task-title-row",
      messages: [
        "次は、この応援をやってみよう。",
        "「ページを開く」を押すと、\n入力が必要なタスクは\n曲名もコピーされるよ。",
      ],
    },
    share: {
      target: "#quickMakePostButton",
      messages: [
        "ここまでできたら十分！",
        "よかったら、今日の応援を\nSNSでシェアしてみよう。",
      ],
    },
    postEdit: {
      target: "#quickPostTextArea",
      messages: [
        "文章はそのまま使っても、\n好きに直しても大丈夫。",
        "投稿しない場合も、\n下のボタンから進めるよ。",
      ],
    },
    complete: {
      target: "#quickInstallGuideCard",
      messages: [
        "お疲れさまでした！\n今日の応援、ちゃんとできたよ。",
        "ホーム画面に追加しておくと、\n次からもっとすぐ始められるよ。",
      ],
    },
  };

  const config = tutorialMap[quickState.screen];

  if (!config) {
    stopQuickTutorial();
    return;
  }

  if (
    quickState.screen === "complete" &&
    isQuickStandaloneMode()
  ) {
    startQuickTutorial(
      ["お疲れさまでした！\nまた気が向いたら、ホームからすぐ始められるよ。"],
      "#quickPwaCompleteCard"
    );
    return;
  }

  startQuickTutorial(config.messages, config.target);
}

function startQuickTutorial(messages, targetSelector) {
  if (!quickState.tutorial.enabled || !Array.isArray(messages) || messages.length === 0) {
    return;
  }

  quickState.tutorial.messages = messages;
  quickState.tutorial.index = 0;
  quickState.tutorial.targetSelector = targetSelector || "";

  quickElements.tutorialOverlay?.classList.remove(
    "hidden",
    "is-message-hidden"
  );

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

  document
    .querySelectorAll(".quick-tutorial-target")
    .forEach((element) => {
      element.classList.remove("quick-tutorial-target");
    });

  quickElements.tutorialOverlay?.classList.add("hidden");
  quickElements.tutorialOverlay?.classList.remove(
    "is-active",
    "is-message-hidden"
  );

  quickElements.tutorialOverlay?.setAttribute("aria-hidden", "true");
}

function typeQuickTutorialMessage(message) {
  clearTimeout(quickState.tutorial.timerId);

  const safeMessage = String(message || "");

  quickState.tutorial.isTyping = true;

  if (quickElements.tutorialText) {
    quickElements.tutorialText.textContent = "";
  }

  if (quickElements.tutorialHint) {
    quickElements.tutorialHint.textContent = "タップで全文表示";
  }

  let index = 0;

  const renderNextCharacter = () => {
    if (!quickState.tutorial.isTyping) {
      return;
    }

    if (quickElements.tutorialText) {
      quickElements.tutorialText.textContent = safeMessage.slice(0, index);
    }

    index += 1;

    if (index <= safeMessage.length) {
      quickState.tutorial.timerId = window.setTimeout(
        renderNextCharacter,
        32
      );
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
    const hasNextMessage =
      quickState.tutorial.index <
      quickState.tutorial.messages.length - 1;

    quickElements.tutorialHint.textContent = hasNextMessage
      ? "タップで次へ"
      : "案内はここまで";
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

  const interactiveTarget = event.target.closest(
    "button, a, input, textarea, select, label"
  );

  if (quickState.tutorial.isTyping) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const currentMessage =
      quickState.tutorial.messages[quickState.tutorial.index] || "";

    completeQuickTutorialTyping(currentMessage);
    return;
  }

  if (interactiveTarget) {
    return;
  }

  const hasNextMessage =
    quickState.tutorial.index <
    quickState.tutorial.messages.length - 1;

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
  document
    .querySelectorAll(".quick-tutorial-target")
    .forEach((element) => {
      element.classList.remove("quick-tutorial-target");
    });

  if (!selector) {
    return;
  }

  const target = document.querySelector(selector);

  if (!target) {
    return;
  }

  target.classList.add("quick-tutorial-target");

  window.setTimeout(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

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
    const savedState = JSON.parse(rawSession);

    Object.assign(
      quickState,
      QUICK_STATE_DEFAULT,
      savedState
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
    selectedSongId: quickState.selectedSongId,
    spotifyChoice: quickState.spotifyChoice,
    dailyTaskIndex: quickState.dailyTaskIndex,
    completedDailyTaskIds: quickState.completedDailyTaskIds,
    completedDailyTaskNames: quickState.completedDailyTaskNames,
    postShared: quickState.postShared,
    postSkipped: quickState.postSkipped,
  };

  sessionStorage.setItem(
    QUICK_STORAGE_KEYS.session,
    JSON.stringify(stateToSave)
  );
}

function restoreTutorialSetting() {
  const storedValue = localStorage.getItem(
    QUICK_STORAGE_KEYS.tutorialEnabled
  );

  quickState.tutorial.enabled = storedValue !== "false";

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
// 共通処理
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

  if (isQuickStandaloneMode()) {
    window.location.href = url;
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function isQuickStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
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
  message.textContent =
    "データの読み込みに失敗しました。ページを再読み込みしてください。";

  startStep.appendChild(message);
}
function clearQuickSession() {
  sessionStorage.removeItem(QUICK_STORAGE_KEYS.session);

  Object.assign(
    quickState,
    QUICK_STATE_DEFAULT
  );
}
