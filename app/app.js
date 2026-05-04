const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";
const USEN_REQUEST_BASE_URL = "https://usen.oshireq.com/song/";
const X_POST_URL = "https://twitter.com/intent/tweet?text=";
const THREADS_URL = "https://www.threads.net/";

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
};

const spotifyStepElement = document.getElementById("spotifyStep");
const onceListSelectStepElement = document.getElementById("onceListSelectStep");
const onceTaskRunStepElement = document.getElementById("onceTaskRunStep");
const requestSongStepElement = document.getElementById("requestSongStep");
const dailyTaskStepElement = document.getElementById("dailyTaskStep");
const dailyGroupEndStepElement = document.getElementById("dailyGroupEndStep");
const postAskStepElement = document.getElementById("postAskStep");
const postEditStepElement = document.getElementById("postEditStep");
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

const makePostButtonElement = document.getElementById("makePostButton");
const skipPostButtonElement = document.getElementById("skipPostButton");
const postErrorAreaElement = document.getElementById("postErrorArea");
const fixedPostTextPreviewElement = document.getElementById("fixedPostTextPreview");
const checkAllPostItemsButtonElement = document.getElementById("checkAllPostItemsButton");
const clearAllPostItemsButtonElement = document.getElementById("clearAllPostItemsButton");
const postItemListElement = document.getElementById("postItemList");
const postTextCountElement = document.getElementById("postTextCount");
const postLinkCountElement = document.getElementById("postLinkCount");
const generatedPostTextElement = document.getElementById("generatedPostText");
const copyPostTextButtonElement = document.getElementById("copyPostTextButton");
const openXPostButtonElement = document.getElementById("openXPostButton");
const openThreadsButtonElement = document.getElementById("openThreadsButton");

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
  const itemUrl = getDailyTaskItemUrl(item);

  if (!item || !itemUrl) {
    showError(dailyTaskErrorAreaElement, "URLが設定されていません。");
    return;
  }

  recordCompletedDailyItem(item);

  dailyTaskNextButtonElement.classList.remove("hidden");

  window.location.href = itemUrl;
});

dailyTaskNextButtonElement.addEventListener("click", () => {
  const item = getCurrentDailyTaskItem();

  if (item && !getDailyTaskItemUrl(item)) {
    recordCompletedDailyItem(item);
  }

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
    showPostAskStep();
    return;
  }

  showDailyTaskStep(false);
});

stopDailyGroupButtonElement.addEventListener("click", () => {
  showPostAskStep();
});

makePostButtonElement.addEventListener("click", () => {
  showPostEditStep();
});

skipPostButtonElement.addEventListener("click", () => {
  showPlaceholderNextStep("今日はここまで。お疲れさまでした⌛");
});

checkAllPostItemsButtonElement.addEventListener("click", () => {
  setAllPostItemChecks(true);
  updateGeneratedPostText();
});

clearAllPostItemsButtonElement.addEventListener("click", () => {
  setAllPostItemChecks(false);
  updateGeneratedPostText();
});

copyPostTextButtonElement.addEventListener("click", async () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "コピーする投稿文がありません。");
    return;
  }

  try {
    await navigator.clipboard.writeText(postText);
    copyPostTextButtonElement.textContent = "コピーしました";
    hideError(postErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
});

openXPostButtonElement.addEventListener("click", () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }

  const url = X_POST_URL + encodeURIComponent(postText);
  window.open(url, "_blank", "noopener");
});

openThreadsButtonElement.addEventListener("click", async () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }

  try {
    await navigator.clipboard.writeText(postText);
    window.open(THREADS_URL, "_blank", "noopener");
    hideError(postErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
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
      state.completedDailyItems = [];
    }

    if (state.dailyGroups.length === 0) {
      showPostAskStep();
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
    showPostAskStep();
    return;
  }

  const items = getDailyGroupItems(group);
  const itemName = getDailyTaskItemName(item);
  const itemUrl = getDailyTaskItemUrl(item);

  dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  dailyTaskGroupNameElement.textContent = group.listName;
  dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  dailyTaskNameElement.textContent = itemName;

  dailyTaskCommentAreaElement.textContent = item.comment || "ページを開いてタスクを完了してください。";

  renderDailyTaskCopyArea(item);

  if (itemUrl) {
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

  const musicName = getSelectedRequestSongName();

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
    showPostAskStep();
    return;
  }

  if (state.currentDailyGroupIndex >= state.dailyGroups.length - 1) {
    showPostAskStep();
    return;
  }

  endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  showOnlyStep(dailyGroupEndStepElement);
}

function recordCompletedDailyItem(item) {
  if (!item) {
    return;
  }

  const name = getDailyTaskItemName(item);
  const url = getDailyTaskItemUrl(item);

  if (!name) {
    return;
  }

  const key = `${name}_${url}`;
  const exists = state.completedDailyItems.some((completedItem) => completedItem.key === key);

  if (exists) {
    return;
  }

  state.completedDailyItems.push({
    key,
    name,
    url,
  });
}

function showPostAskStep() {
  showOnlyStep(postAskStepElement);
}

function showPostEditStep() {
  state.postItems = buildPostItems();

  fixedPostTextPreviewElement.textContent = buildFixedPostText();
  renderPostItemList(state.postItems);
  updateGeneratedPostText();

  showOnlyStep(postEditStepElement);
  hideError(postErrorAreaElement);
}

function buildPostItems() {
  const items = [];

  state.selectedOnceTasks.forEach((task, index) => {
    if (!task || !task.name) {
      return;
    }

    items.push({
      id: `once-${index}`,
      name: task.name,
      url: task.url || "",
      checked: true,
    });
  });

  state.completedDailyItems.forEach((item, index) => {
    if (!item || !item.name) {
      return;
    }

    items.push({
      id: `daily-${index}`,
      name: item.name,
      url: item.url || "",
      checked: true,
    });
  });

  return items;
}

function renderPostItemList(items) {
  postItemListElement.innerHTML = "";

  if (items.length === 0) {
    postItemListElement.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
    return;
  }

  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = item.checked ? "✅ " + item.name : item.name;

    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      name.textContent = checkbox.checked ? "✅ " + item.name : item.name;
      updateGeneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    postItemListElement.appendChild(label);
  });
}

function setAllPostItemChecks(checked) {
  state.postItems.forEach((item) => {
    item.checked = checked;
  });

  renderPostItemList(state.postItems);
}

function updateGeneratedPostText() {
  const postText = buildPostText();

  generatedPostTextElement.textContent = postText;

  const textLength = postText.length;
  const linkCount = countLinks(postText);

  postTextCountElement.textContent = `X文字数目安: ${textLength} / 280`;
  postLinkCountElement.textContent = `Threadsリンク数: ${linkCount} / 5`;

  postTextCountElement.classList.toggle("warning-text", textLength > 280);
  postLinkCountElement.classList.toggle("warning-text", linkCount > 5);

  copyPostTextButtonElement.textContent = "コピーする";
}

function getGeneratedPostText() {
  return generatedPostTextElement.textContent || "";
}

function buildPostText() {
  const lines = buildFixedPostLines();

  state.postItems.forEach((item) => {
    if (!item.checked) {
      return;
    }

    lines.push(`✅${item.name}`);

    if (item.url) {
      lines.push(item.url);
    }
  });

  return lines.join("\n");
}

function buildFixedPostText() {
  return buildFixedPostLines().join("\n");
}

function buildFixedPostLines() {
  const selectedRequestSongName = getSelectedRequestSongName();
  const selectedRequestSongUrl = getSelectedRequestSongUrl();

  return [
    `${formatMonthDay(new Date())}のタスク完了👍`,
    `${selectedRequestSongName}をリクエストしたよ😊`,
    "✅USEN推しリク",
    selectedRequestSongUrl,
  ];
}

function countLinks(text) {
  const links = text.match(/https?:\/\/\S+/g);
  return links ? links.length : 0;
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

function getDailyTaskItemName(item) {
  if (!item) {
    return "名称未設定";
  }

  return item.name || item.title || item.listName || "名称未設定";
}

function getDailyTaskItemUrl(item) {
  if (!item) {
    return "";
  }

  return item.url || "";
}

function getSelectedRequestSongName() {
  if (!state.selectedRequestSong) {
    return "";
  }

  return state.selectedRequestSong.name || "";
}

function getSelectedRequestSongUrl() {
  if (!state.selectedRequestSong || !state.selectedRequestSong.url) {
    return "";
  }

  return buildRequestSongUrl(state.selectedRequestSong.url);
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
    postAskStepElement,
    postEditStepElement,
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

function formatMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}
