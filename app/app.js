const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";
const USEN_REQUEST_BASE_URL = "https://usen.oshireq.com/song/";

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
};

const spotifyStepElement = document.getElementById("spotifyStep");
const onceListSelectStepElement = document.getElementById("onceListSelectStep");
const onceTaskRunStepElement = document.getElementById("onceTaskRunStep");
const requestSongStepElement = document.getElementById("requestSongStep");
const dailyTaskStepElement = document.getElementById("dailyTaskStep");
const dailyGroupEndStepElement = document.getElementById("dailyGroupEndStep");
const placeholderNextStepElement = document.getElementById("placeholderNextStep");

const recommendedSongsElement = document.getElementById("recommendedSongs");
const otherSongsElement = document.getElementById("otherSongs");
const selectedAreaElement = document.getElementById("selectedArea");
const selectedSongNameElement = document.getElementById("selectedSongName");
const openSpotifyButtonElement = document.getElementById("openSpotifyButton");
const spotifyNextButtonElement = document.getElementById("spotifyNextButton");
const spotifyErrorAreaElement = document.getElementById("spotifyErrorArea");
const toggleOtherSongsButtonElement = document.getElementById("toggleOtherSongsButton");
const toggleOtherSongsIconElement = document.getElementById("toggleOtherSongsIcon");
const otherSongsWrapperElement = document.getElementById("otherSongsWrapper");

const onceTaskListElement = document.getElementById("onceTaskList");
const onceListErrorAreaElement = document.getElementById("onceListErrorArea");
const checkAllOnceTasksButtonElement = document.getElementById("checkAllOnceTasksButton");
const clearAllOnceTasksButtonElement = document.getElementById("clearAllOnceTasksButton");
const startOnceTasksButtonElement = document.getElementById("startOnceTasksButton");

const onceTaskProgressElement = document.getElementById("onceTaskProgress");
const onceTaskNameElement = document.getElementById("onceTaskName");
const onceTaskMessageAreaElement = document.getElementById("onceTaskMessageArea");
const openOnceTaskUrlButtonElement = document.getElementById("openOnceTaskUrlButton");
const onceTaskNextButtonElement = document.getElementById("onceTaskNextButton");
const onceTaskRunErrorAreaElement = document.getElementById("onceTaskRunErrorArea");

const selectedRequestSongAreaElement = document.getElementById("selectedRequestSongArea");
const selectedRequestSongNameElement = document.getElementById("selectedRequestSongName");
const openRequestSongButtonElement = document.getElementById("openRequestSongButton");
const requestSongNextButtonElement = document.getElementById("requestSongNextButton");
const requestSongErrorAreaElement = document.getElementById("requestSongErrorArea");
const recommendedRequestSongsElement = document.getElementById("recommendedRequestSongs");
const otherRequestSongsElement = document.getElementById("otherRequestSongs");
const toggleOtherRequestSongsButtonElement = document.getElementById("toggleOtherRequestSongsButton");
const toggleOtherRequestSongsIconElement = document.getElementById("toggleOtherRequestSongsIcon");
const otherRequestSongsWrapperElement = document.getElementById("otherRequestSongsWrapper");

const dailyTaskHeaderDescriptionElement = document.getElementById("dailyTaskHeaderDescription");
const dailyTaskGroupNameElement = document.getElementById("dailyTaskGroupName");
const dailyTaskProgressElement = document.getElementById("dailyTaskProgress");
const dailyTaskNameElement = document.getElementById("dailyTaskName");
const dailyTaskCommentAreaElement = document.getElementById("dailyTaskCommentArea");
const dailyTaskCopyAreaElement = document.getElementById("dailyTaskCopyArea");
const dailyTaskCopyTextElement = document.getElementById("dailyTaskCopyText");
const copyDailyTaskTextButtonElement = document.getElementById("copyDailyTaskTextButton");
const openDailyTaskUrlButtonElement = document.getElementById("openDailyTaskUrlButton");
const dailyTaskNextButtonElement = document.getElementById("dailyTaskNextButton");
const dailyTaskErrorAreaElement = document.getElementById("dailyTaskErrorArea");

const endedGroupNameElement = document.getElementById("endedGroupName");
const continueDailyGroupButtonElement = document.getElementById("continueDailyGroupButton");
const stopDailyGroupButtonElement = document.getElementById("stopDailyGroupButton");
const placeholderMessageElement = document.getElementById("placeholderMessage");

document.addEventListener("DOMContentLoaded", init);

openSpotifyButtonElement.addEventListener("click", () => {
  if (!state.selectedSong) {
    showError(spotifyErrorAreaElement, "曲が選択されていません。");
    return;
  }

  const spotifyUrl = buildSpotifyUrl(state.selectedSong.url);

  window.open(spotifyUrl, "_blank", "noopener");

  spotifyNextButtonElement.classList.remove("hidden");
});

spotifyNextButtonElement.addEventListener("click", async () => {
  await showOnceListSelectStep();
});

toggleOtherSongsButtonElement.addEventListener("click", () => {
  state.isOtherSongsOpen = !state.isOtherSongsOpen;
  updateOtherSongsAccordion();
});

checkAllOnceTasksButtonElement.addEventListener("click", () => {
  setAllOnceTaskChecks(true);
});

clearAllOnceTasksButtonElement.addEventListener("click", () => {
  setAllOnceTaskChecks(false);
});

startOnceTasksButtonElement.addEventListener("click", async () => {
  const selectedTasks = getCheckedOnceTasks();

  hideError(onceListErrorAreaElement);

  if (selectedTasks.length === 0) {
    state.selectedOnceTasks = [];
    state.currentOnceTaskIndex = 0;
    await showRequestSongStep();
    return;
  }

  state.selectedOnceTasks = selectedTasks;
  state.currentOnceTaskIndex = 0;

  showOnceTaskRunStep();
});

openOnceTaskUrlButtonElement.addEventListener("click", () => {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];

  if (!task || !task.url) {
    showError(onceTaskRunErrorAreaElement, "URLが設定されていません。");
    return;
  }

  if (task["move-flag"] === true) {
    window.open(task.url, "_blank", "noopener");
    onceTaskNextButtonElement.classList.remove("hidden");
    return;
  }

  window.location.href = task.url;
});

onceTaskNextButtonElement.addEventListener("click", async () => {
  state.currentOnceTaskIndex += 1;

  if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
    await showRequestSongStep();
    return;
  }

  renderCurrentOnceTask();
});

toggleOtherRequestSongsButtonElement.addEventListener("click", () => {
  state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;
  updateOtherRequestSongsAccordion();
});

openRequestSongButtonElement.addEventListener("click", () => {
  if (!state.selectedRequestSong) {
    showError(requestSongErrorAreaElement, "リクエスト曲が選択されていません。");
    return;
  }

  const requestUrl = buildRequestSongUrl(state.selectedRequestSong.url);

  requestSongNextButtonElement.classList.remove("hidden");

  window.location.href = requestUrl;
});

requestSongNextButtonElement.addEventListener("click", async () => {
  await showDailyTaskStep();
});

copyDailyTaskTextButtonElement.addEventListener("click", async () => {
  const text = dailyTaskCopyTextElement.textContent;

  if (!text) {
    showError(dailyTaskErrorAreaElement, "コピーする文言がありません。");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    hideError(dailyTaskErrorAreaElement);
    copyDailyTaskTextButtonElement.textContent = "コピーしました";
  } catch (error) {
    console.error(error);
    showError(dailyTaskErrorAreaElement, "コピーに失敗しました。長押しでコピーしてください。");
  }
});

openDailyTaskUrlButtonElement.addEventListener("click", () => {
  const item = getCurrentDailyTaskItem();

  if (!item || !item.url) {
    showError(dailyTaskErrorAreaElement, "URLが設定されていません。");
    return;
  }

  dailyTaskNextButtonElement.classList.remove("hidden");

  window.location.href = item.url;
});

dailyTaskNextButtonElement.addEventListener("click", () => {
  state.currentDailyTaskIndex += 1;

  const currentGroup = getCurrentDailyGroup();

  if (!currentGroup || state.currentDailyTaskIndex >= getDailyGroupItems(currentGroup).length) {
    showDailyGroupEndStep();
    return;
  }

  renderCurrentDailyTask();
});

continueDailyGroupButtonElement.addEventListener("click", () => {
  state.currentDailyGroupIndex += 1;
  state.currentDailyTaskIndex = 0;

  if (state.currentDailyGroupIndex >= state.dailyGroups.length) {
    showPlaceholderNextStep("デイリータスクはここまでです。次は投稿文生成に進みます。");
    return;
  }

  showDailyTaskStep(false);
});

stopDailyGroupButtonElement.addEventListener("click", () => {
  showPlaceholderNextStep("今日はここまで。次は投稿文生成に進みます。");
});

async function init() {
  try {
    const songs = await loadSpotifySongs();

    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);

    renderSpotifySongList(recommendedSongsElement, recommendedSongs);
    renderSpotifySongList(otherSongsElement, otherSongs);

    if (recommendedSongs.length === 0) {
      recommendedSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherSongs.length === 0) {
      otherSongsElement.innerHTML = '<p class="empty-text">その他の曲はありません。</p>';
    }

    updateOtherSongsAccordion();
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "Spotify曲リストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

async function loadSpotifySongs() {
  const response = await fetch("../data/spotifySongJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("spotifySongJson.json の取得に失敗しました。");
  }

  const songs = await response.json();

  if (!Array.isArray(songs)) {
    throw new Error("spotifySongJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => song && song.name && song.url);
}

async function loadOnceTasks() {
  const response = await fetch("../data/onceListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("onceListJson.json の取得に失敗しました。");
  }

  const tasks = await response.json();

  if (!Array.isArray(tasks)) {
    throw new Error("onceListJson.json が配列形式ではありません。");
  }

  return tasks.filter((task) => {
    return task && task.name && isWithinPeriod(task.from, task.to);
  });
}

async function loadRequestSongs() {
  const response = await fetch("../data/requestSongJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("requestSongJson.json の取得に失敗しました。");
  }

  const songs = await response.json();

  if (!Array.isArray(songs)) {
    throw new Error("requestSongJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => song && song.name && song.url);
}

async function loadRequestTexts() {
  const response = await fetch("../data/requestTextJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("requestTextJson.json の取得に失敗しました。");
  }

  const requestTexts = await response.json();

  if (!requestTexts || Array.isArray(requestTexts) || typeof requestTexts !== "object") {
    throw new Error("requestTextJson.json がオブジェクト形式ではありません。");
  }

  return requestTexts;
}

async function loadDailyGroups() {
  const response = await fetch("../data/listJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("listJson.json の取得に失敗しました。");
  }

  const groups = await response.json();

  if (!Array.isArray(groups)) {
    throw new Error("listJson.json が配列形式ではありません。");
  }

  return groups.filter((group) => {
    return group && group.listName && Array.isArray(group.items) && group.items.length > 0;
  });
}

function renderSpotifySongList(container, songs) {
  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button spotify-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectSong(song);
    });

    container.appendChild(button);
  });
}

function renderRequestSongList(container, songs) {
  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button request-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectRequestSong(song);
    });

    container.appendChild(button);
  });
}

function selectSong(song) {
  state.selectedSong = song;

  selectedSongNameElement.textContent = song.name;
  selectedAreaElement.classList.remove("hidden");

  spotifyNextButtonElement.classList.add("hidden");

  updateSelectedButtonStyle(".spotify-song-button", song);
  hideError(spotifyErrorAreaElement);
}

function selectRequestSong(song) {
  state.selectedRequestSong = song;

  selectedRequestSongNameElement.textContent = song.name;
  selectedRequestSongAreaElement.classList.remove("hidden");

  requestSongNextButtonElement.classList.add("hidden");

  updateSelectedButtonStyle(".request-song-button", song);
  hideError(requestSongErrorAreaElement);
}

function updateSelectedButtonStyle(selector, selectedSong) {
  const buttons = document.querySelectorAll(selector);

  buttons.forEach((button) => {
    button.classList.toggle("selected", button.textContent === selectedSong.name);
  });
}

function updateOtherSongsAccordion() {
  otherSongsWrapperElement.classList.toggle("hidden", !state.isOtherSongsOpen);
  toggleOtherSongsIconElement.textContent = state.isOtherSongsOpen ? "－" : "＋";
}

function updateOtherRequestSongsAccordion() {
  otherRequestSongsWrapperElement.classList.toggle("hidden", !state.isOtherRequestSongsOpen);
  toggleOtherRequestSongsIconElement.textContent = state.isOtherRequestSongsOpen ? "－" : "＋";
}

async function showOnceListSelectStep() {
  try {
    if (state.onceTasks.length === 0) {
      state.onceTasks = await loadOnceTasks();
    }

    renderOnceTaskCheckList(state.onceTasks);

    showOnlyStep(onceListSelectStepElement);

    hideError(onceListErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "期間限定タスクの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function renderOnceTaskCheckList(tasks) {
  onceTaskListElement.innerHTML = "";

  if (tasks.length === 0) {
    onceTaskListElement.innerHTML = '<p class="empty-text">現在、期限内の期間限定タスクはありません。</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = "✅ " + task.name;

    checkbox.addEventListener("change", () => {
      name.textContent = checkbox.checked ? "✅ " + task.name : task.name;
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    onceTaskListElement.appendChild(label);
  });
}

function setAllOnceTaskChecks(checked) {
  const checkboxes = onceTaskListElement.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked;

    const nameElement = checkbox.parentElement.querySelector(".check-item-name");
    const task = state.onceTasks[Number(checkbox.dataset.index)];

    if (nameElement && task) {
      nameElement.textContent = checked ? "✅ " + task.name : task.name;
    }
  });

  hideError(onceListErrorAreaElement);
}

function getCheckedOnceTasks() {
  const checkboxes = onceTaskListElement.querySelectorAll('input[type="checkbox"]');
  const selectedTasks = [];

  checkboxes.forEach((checkbox) => {
    if (!checkbox.checked) {
      return;
    }

    const task = state.onceTasks[Number(checkbox.dataset.index)];

    if (task) {
      selectedTasks.push(task);
    }
  });

  return selectedTasks;
}

function showOnceTaskRunStep() {
  showOnlyStep(onceTaskRunStepElement);
  renderCurrentOnceTask();
}

function renderCurrentOnceTask() {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  const currentNumber = state.currentOnceTaskIndex + 1;
  const totalNumber = state.selectedOnceTasks.length;

  hideError(onceTaskRunErrorAreaElement);
  onceTaskNextButtonElement.classList.add("hidden");

  if (!task) {
    showRequestSongStep();
    return;
  }

  onceTaskProgressElement.textContent = `${currentNumber} / ${totalNumber}`;
  onceTaskNameElement.textContent = task.name;

  onceTaskMessageAreaElement.textContent = buildOnceTaskMessage(task);

  if (task.url) {
    openOnceTaskUrlButtonElement.classList.remove("hidden");
  } else {
    openOnceTaskUrlButtonElement.classList.add("hidden");
    onceTaskNextButtonElement.classList.remove("hidden");
  }
}

function buildOnceTaskMessage(task) {
  const messages = [];

  if (task["move-flag"] === true) {
    if (task["alert-message"]) {
      messages.push(task["alert-message"]);
    }

    if (messages.length === 0) {
      messages.push("ページを開いてタスクを完了してください。");
    }

    return messages.join("\n\n");
  }

  if (task["alert-message"]) {
    messages.push(task["alert-message"]);
  }

  if (task["notice-message"]) {
    messages.push(task["notice-message"]);
  }

  if (messages.length === 0) {
    messages.push("ページを開いてタスクを完了してください。");
  }

  return messages.join("\n\n");
}

async function showRequestSongStep() {
  try {
    if (state.requestSongs.length === 0) {
      state.requestSongs = await loadRequestSongs();
    }

    const recommendedRequestSongs = state.requestSongs.filter((song) => song.flag === true);
    const otherRequestSongs = state.requestSongs.filter((song) => song.flag !== true);

    renderRequestSongList(recommendedRequestSongsElement, recommendedRequestSongs);
    renderRequestSongList(otherRequestSongsElement, otherRequestSongs);

    if (recommendedRequestSongs.length === 0) {
      recommendedRequestSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherRequestSongs.length === 0) {
      otherRequestSongsElement.innerHTML = '<p class="empty-text">その他の曲はありません。</p>';
    }

    updateOtherRequestSongsAccordion();

    showOnlyStep(requestSongStepElement);

    hideError(requestSongErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(onceTaskRunErrorAreaElement, "リクエスト曲リストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

async function showDailyTaskStep(shouldInitialize = true) {
  try {
    if (shouldInitialize) {
      state.requestTexts = await loadRequestTexts();
      state.dailyGroups = await loadDailyGroups();
      state.currentDailyGroupIndex = 0;
      state.currentDailyTaskIndex = 0;
    }

    if (state.dailyGroups.length === 0) {
      showPlaceholderNextStep("デイリータスクがありません。次は投稿文生成に進みます。");
      return;
    }

    showOnlyStep(dailyTaskStepElement);
    renderCurrentDailyTask();
  } catch (error) {
    console.error(error);
    showError(requestSongErrorAreaElement, "リクエストループの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function renderCurrentDailyTask() {
  const group = getCurrentDailyGroup();
  const item = getCurrentDailyTaskItem();

  hideError(dailyTaskErrorAreaElement);
  dailyTaskNextButtonElement.classList.add("hidden");
  copyDailyTaskTextButtonElement.textContent = "コピーする";

  if (!group || !item) {
    showPlaceholderNextStep("デイリータスクはここまでです。次は投稿文生成に進みます。");
    return;
  }

  const items = getDailyGroupItems(group);

  dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  dailyTaskGroupNameElement.textContent = group.listName;
  dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  dailyTaskNameElement.textContent = item.name || "名称未設定";

  dailyTaskCommentAreaElement.textContent = item.comment || "ページを開いてタスクを完了してください。";

  renderDailyTaskCopyArea(item);

  if (item.url) {
    openDailyTaskUrlButtonElement.classList.remove("hidden");
  } else {
    openDailyTaskUrlButtonElement.classList.add("hidden");
    dailyTaskNextButtonElement.classList.remove("hidden");
  }
}

function renderDailyTaskCopyArea(item) {
  if (item["input-flag"] !== true) {
    dailyTaskCopyAreaElement.classList.add("hidden");
    dailyTaskCopyTextElement.textContent = "";
    return;
  }

  const copyText = buildDailyTaskCopyText(item);

  dailyTaskCopyTextElement.textContent = copyText;
  dailyTaskCopyAreaElement.classList.remove("hidden");
}

function buildDailyTaskCopyText(item) {
  const requestType = item["request-type"];
  const template = state.requestTexts[requestType];

  if (!requestType || !template) {
    return "";
  }

  const musicName = item["request-input"] || getSelectedRequestSongName();

  return template.replaceAll("musicname", musicName);
}

function buildDailyTaskHeaderDescription() {
  const selectedRequestSongName = getSelectedRequestSongName();

  if (!selectedRequestSongName) {
    return "1つずつ開いて、できるところまで進めよう。";
  }

  return `今日のリクエスト曲: ${selectedRequestSongName}\n1つずつ開いて、できるところまで進めよう。`;
}

function showDailyGroupEndStep() {
  const group = getCurrentDailyGroup();

  if (!group) {
    showPlaceholderNextStep("デイリータスクはここまでです。次は投稿文生成に進みます。");
    return;
  }

  if (state.currentDailyGroupIndex >= state.dailyGroups.length - 1) {
    showPlaceholderNextStep("デイリータスクはここまでです。次は投稿文生成に進みます。");
    return;
  }

  endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  showOnlyStep(dailyGroupEndStepElement);
}

function getCurrentDailyGroup() {
  return state.dailyGroups[state.currentDailyGroupIndex];
}

function getCurrentDailyTaskItem() {
  const group = getCurrentDailyGroup();

  if (!group) {
    return null;
  }

  return getDailyGroupItems(group)[state.currentDailyTaskIndex];
}

function getDailyGroupItems(group) {
  if (!group || !Array.isArray(group.items)) {
    return [];
  }

  return group.items;
}

function getSelectedRequestSongName() {
  if (!state.selectedRequestSong) {
    return "";
  }

  return state.selectedRequestSong.name || "";
}

function showPlaceholderNextStep(message) {
  placeholderMessageElement.textContent = message;

  showOnlyStep(placeholderNextStepElement);
}

function showOnlyStep(activeStepElement) {
  const steps = [
    spotifyStepElement,
    onceListSelectStepElement,
    onceTaskRunStepElement,
    requestSongStepElement,
    dailyTaskStepElement,
    dailyGroupEndStepElement,
    placeholderNextStepElement,
  ];

  steps.forEach((stepElement) => {
    stepElement.classList.toggle("hidden", stepElement !== activeStepElement);
  });
}

function buildSpotifyUrl(trackIdOrUrl) {
  if (trackIdOrUrl.startsWith("http://") || trackIdOrUrl.startsWith("https://")) {
    return trackIdOrUrl;
  }

  return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);
}

function buildRequestSongUrl(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return USEN_REQUEST_BASE_URL + encodeURIComponent(url);
}

function isWithinPeriod(fromValue, toValue) {
  const now = new Date();
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && now < fromDate) {
    return false;
  }

  if (toDate && now > toDate) {
    return false;
  }

  return true;
}

function parseDateTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  if (/^\d{12}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));
    const hour = Number(text.slice(8, 10));
    const minute = Number(text.slice(10, 12));

    return new Date(year, month, day, hour, minute);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}
