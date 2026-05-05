const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";
const USEN_REQUEST_BASE_URL = "https://usen.oshireq.com/song/";
const X_POST_URL = "https://twitter.com/intent/tweet?text=";
const THREADS_URL = "https://www.threads.net/";
const YOUTUBE_THUMBNAIL_BASE_URL = "https://img.youtube.com/vi/";
const TIMELESZ_SPOTIFY_ARTIST_URL = "https://open.spotify.com/intl-ja/artist/1ZFfhzyXjPvbzSYPlCIwo3";

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
};

const homeStepElement = document.getElementById("homeStep");
const homeOnceTaskListElement = document.getElementById("homeOnceTaskList");
const homeInfoListElement = document.getElementById("homeInfoList");
const startRoutineButtonElement = document.getElementById("startRoutineButton");

const openHowToButtonElement = document.getElementById("openHowToButton");
const howToModalElement = document.getElementById("howToModal");
const closeHowToButtonElement = document.getElementById("closeHowToButton");

const openUsageButtonElement = document.getElementById("openUsageButton");
const usageModalElement = document.getElementById("usageModal");
const closeUsageButtonElement = document.getElementById("closeUsageButton");

const stepTopActionBarElement = document.getElementById("stepTopActionBar");
const backStepButtonElement = document.getElementById("backStepButton");
const stepUsageButtonElement = document.getElementById("stepUsageButton");

const spotifyStepElement = document.getElementById("spotifyStep");
const onceListSelectStepElement = document.getElementById("onceListSelectStep");
const onceTaskRunStepElement = document.getElementById("onceTaskRunStep");
const requestSongStepElement = document.getElementById("requestSongStep");
const dailyTaskStepElement = document.getElementById("dailyTaskStep");
const dailyGroupEndStepElement = document.getElementById("dailyGroupEndStep");
const postAskStepElement = document.getElementById("postAskStep");
const postEditStepElement = document.getElementById("postEditStep");
const youtubeAskStepElement = document.getElementById("youtubeAskStep");
const youtubeSelectStepElement = document.getElementById("youtubeSelectStep");
const placeholderNextStepElement = document.getElementById("placeholderNextStep");

const recommendedSongsElement = document.getElementById("recommendedSongs");
const otherSongsElement = document.getElementById("otherSongs");
const selectedAreaElement = document.getElementById("selectedArea");
const selectedSongNameElement = document.getElementById("selectedSongName");
const openSpotifyButtonElement = document.getElementById("openSpotifyButton");
const spotifyNextButtonElement = document.getElementById("spotifyNextButton");
const skipSpotifyButtonElement = document.getElementById("skipSpotifyButton");
const spotifyErrorAreaElement = document.getElementById("spotifyErrorArea");
const toggleOtherSongsButtonElement = document.getElementById("toggleOtherSongsButton");
const toggleOtherSongsIconElement = document.getElementById("toggleOtherSongsIcon");
const otherSongsWrapperElement = document.getElementById("otherSongsWrapper");

const onceTaskListElement = document.getElementById("onceTaskList");
const onceListErrorAreaElement = document.getElementById("onceListErrorArea");
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
const openDailyTaskUrlButtonElement = document.getElementById("openDailyTaskUrlButton");
const dailyTaskNextButtonElement = document.getElementById("dailyTaskNextButton");
const dailyTaskErrorAreaElement = document.getElementById("dailyTaskErrorArea");

const endedGroupNameElement = document.getElementById("endedGroupName");
const continueDailyGroupButtonElement = document.getElementById("continueDailyGroupButton");
const stopDailyGroupButtonElement = document.getElementById("stopDailyGroupButton");

const makePostButtonElement = document.getElementById("makePostButton");
const skipPostButtonElement = document.getElementById("skipPostButton");
const postErrorAreaElement = document.getElementById("postErrorArea");
const postItemListElement = document.getElementById("postItemList");
const postTextCountElement = document.getElementById("postTextCount");
const postLinkCountElement = document.getElementById("postLinkCount");
const generatedPostTextElement = document.getElementById("generatedPostText");
const copyPostTextButtonElement = document.getElementById("copyPostTextButton");
const openXPostButtonElement = document.getElementById("openXPostButton");
const openThreadsButtonElement = document.getElementById("openThreadsButton");
const postNextButtonElement = document.getElementById("postNextButton");

const watchYoutubeButtonElement = document.getElementById("watchYoutubeButton");
const finishWithoutYoutubeButtonElement = document.getElementById("finishWithoutYoutubeButton");
const youtubeErrorAreaElement = document.getElementById("youtubeErrorArea");
const youtubePlaylistRowElement = document.getElementById("youtubePlaylistRow");
const youtubeMvRowElement = document.getElementById("youtubeMvRow");
const finishFromYoutubeButtonElement = document.getElementById("finishFromYoutubeButton");

const placeholderMessageElement = document.getElementById("placeholderMessage");
const backHomeButtonElement = document.getElementById("backHomeButton");

document.addEventListener("DOMContentLoaded", init);

function addClickEvent(element, handler) {
  if (!element) {
    return;
  }

  element.addEventListener("click", handler);
}

addClickEvent(backStepButtonElement, () => {
  goBackStep();
});

addClickEvent(startRoutineButtonElement, () => {
  showOnlyStep(spotifyStepElement);
});

addClickEvent(openHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
});

addClickEvent(closeHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.add("hidden");
  }
});

if (howToModalElement) {
  howToModalElement.addEventListener("click", (event) => {
    if (event.target === howToModalElement) {
      howToModalElement.classList.add("hidden");
    }
  });
}

const openUsageModal = () => {
  if (usageModalElement) {
    usageModalElement.classList.remove("hidden");
  }
};

addClickEvent(openUsageButtonElement, openUsageModal);
addClickEvent(stepUsageButtonElement, openUsageModal);

addClickEvent(closeUsageButtonElement, () => {
  if (usageModalElement) {
    usageModalElement.classList.add("hidden");
  }
});

if (usageModalElement) {
  usageModalElement.addEventListener("click", (event) => {
    if (event.target === usageModalElement) {
      usageModalElement.classList.add("hidden");
    }
  });
}

addClickEvent(openSpotifyButtonElement, () => {
  if (!state.selectedSong) {
    showError(spotifyErrorAreaElement, "曲が選択されていません。");
    return;
  }

  const spotifyUrl = buildSpotifyUrl(state.selectedSong.url);

  if (spotifyNextButtonElement) {
    spotifyNextButtonElement.classList.remove("hidden");
  }

  location.href = spotifyUrl;
});

addClickEvent(skipSpotifyButtonElement, async () => {
  state.selectedSong = null;
  await showOnceListSelectStep();
});

addClickEvent(spotifyNextButtonElement, async () => {
  await showOnceListSelectStep();
});

addClickEvent(toggleOtherSongsButtonElement, () => {
  state.isOtherSongsOpen = !state.isOtherSongsOpen;
  updateOtherSongsAccordion();
});

addClickEvent(startOnceTasksButtonElement, async () => {
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

addClickEvent(openOnceTaskUrlButtonElement, () => {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];

  if (!task || !task.url) {
    showError(onceTaskRunErrorAreaElement, "URLが設定されていません。");
    return;
  }

  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }

  location.href = task.url;
});

addClickEvent(onceTaskNextButtonElement, async () => {
  state.currentOnceTaskIndex += 1;

  if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
    await showRequestSongStep();
    return;
  }

  renderCurrentOnceTask();
});

addClickEvent(toggleOtherRequestSongsButtonElement, () => {
  state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;
  updateOtherRequestSongsAccordion();
});

addClickEvent(openRequestSongButtonElement, () => {
  if (!state.selectedRequestSong) {
    showError(requestSongErrorAreaElement, "リクエスト曲が選択されていません。");
    return;
  }

  const requestUrl = buildRequestSongUrl(state.selectedRequestSong.url);

  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.classList.remove("hidden");
  }

  location.href = requestUrl;
});

addClickEvent(requestSongNextButtonElement, async () => {
  await showDailyTaskStep();
});

addClickEvent(openDailyTaskUrlButtonElement, async () => {
  const item = getCurrentDailyTaskItem();
  const itemUrl = getDailyTaskItemUrl(item);

  if (!item || !itemUrl) {
    showError(dailyTaskErrorAreaElement, "URLが設定されていません。");
    return;
  }

  if (item["input-flag"] === true) {
    const copyText = buildDailyTaskCopyText(item);

    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText);
        hideError(dailyTaskErrorAreaElement);
      } catch (error) {
        console.error(error);
        showError(dailyTaskErrorAreaElement, "コピーに失敗しました。もう一度ページを開くボタンを押してください。");
        return;
      }
    }
  }

  recordCompletedDailyItem(item);

  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.remove("hidden");
  }

  location.href = itemUrl;
});

addClickEvent(dailyTaskNextButtonElement, () => {
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

addClickEvent(continueDailyGroupButtonElement, () => {
  state.currentDailyGroupIndex += 1;
  state.currentDailyTaskIndex = 0;

  if (state.currentDailyGroupIndex >= state.dailyGroups.length) {
    showPostAskStep();
    return;
  }

  showDailyTaskStep(false);
});

addClickEvent(stopDailyGroupButtonElement, () => {
  showPostAskStep();
});

addClickEvent(makePostButtonElement, () => {
  showPostEditStep();
});

addClickEvent(skipPostButtonElement, () => {
  showYoutubeAskStep();
});

addClickEvent(copyPostTextButtonElement, async () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "コピーする投稿文がありません。");
    return;
  }

  try {
    await navigator.clipboard.writeText(postText);

    if (copyPostTextButtonElement) {
      copyPostTextButtonElement.textContent = "コピーしました";
    }

    hideError(postErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
});

addClickEvent(openXPostButtonElement, () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }

  const url = X_POST_URL + encodeURIComponent(postText);
  location.href = url;
});

addClickEvent(openThreadsButtonElement, async () => {
  const postText = getGeneratedPostText();

  if (!postText) {
    showError(postErrorAreaElement, "投稿文がありません。");
    return;
  }

  try {
    await navigator.clipboard.writeText(postText);
    hideError(postErrorAreaElement);
    location.href = THREADS_URL;
  } catch (error) {
    console.error(error);
    showError(postErrorAreaElement, "コピーに失敗しました。投稿文を長押しでコピーしてください。");
  }
});

addClickEvent(postNextButtonElement, () => {
  showYoutubeAskStep();
});

addClickEvent(watchYoutubeButtonElement, async () => {
  await showYoutubeSelectStep();
});

addClickEvent(finishWithoutYoutubeButtonElement, () => {
  showPlaceholderNextStep("お疲れ様さまでした☺️Big Love💚");
});

addClickEvent(finishFromYoutubeButtonElement, () => {
  showPlaceholderNextStep("お疲れ様さまでした☺️Big Love💚");
});

addClickEvent(backHomeButtonElement, () => {
  state.stepHistory = [];
  showOnlyStep(homeStepElement, { recordHistory: false });
});

async function init() {
  try {
    const songs = await loadSpotifySongs();

    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);

    renderSpotifySongList(recommendedSongsElement, recommendedSongs);
    renderSpotifySongList(otherSongsElement, otherSongs);

    if (recommendedSongs.length === 0 && recommendedSongsElement) {
      recommendedSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherSongs.length === 0 && otherSongsElement) {
      otherSongsElement.innerHTML = '<p class="empty-text">その他の曲はありません。</p>';
    }

    updateOtherSongsAccordion();

    state.onceTasks = await loadOnceTasks();
    renderHomeOnceTaskList(state.onceTasks);

    const homeInfoList = await loadHomeInfoList();
    renderHomeInfoList(homeInfoList);

    state.currentStepElement = homeStepElement;
    updateStepTopActionBar();
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "初期データの読み込みに失敗しました。JSONの形式や配置を確認してください。");
    renderHomeOnceTaskList([]);
    renderHomeInfoList([]);

    state.currentStepElement = homeStepElement;
    updateStepTopActionBar();
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

async function loadHomeInfoList() {
  const response = await fetch("../data/homeInfoListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("homeInfoListJson.json の取得に失敗しました。");
  }

  const informationList = await response.json();

  if (!Array.isArray(informationList)) {
    throw new Error("homeInfoListJson.json が配列形式ではありません。");
  }

  return informationList.filter((item) => {
    return item && item.name && isWithinPeriod(item.from, item.to);
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

async function loadYoutubePlaylists() {
  const response = await fetch("../data/youtubePlayListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("youtubePlayListJson.json の取得に失敗しました。");
  }

  const playlists = await response.json();

  if (!Array.isArray(playlists)) {
    throw new Error("youtubePlayListJson.json が配列形式ではありません。");
  }

  return playlists.filter((item) => item && item.name && item.url);
}

async function loadYoutubeMvs() {
  const response = await fetch("../data/youtubeMVListJson.json?ts=" + Date.now());

  if (!response.ok) {
    throw new Error("youtubeMVListJson.json の取得に失敗しました。");
  }

  const mvs = await response.json();

  if (!Array.isArray(mvs)) {
    throw new Error("youtubeMVListJson.json が配列形式ではありません。");
  }

  return mvs.filter((item) => item && item.name && item.url);
}

function renderHomeOnceTaskList(tasks) {
  if (!homeOnceTaskListElement) {
    return;
  }

  homeOnceTaskListElement.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    homeOnceTaskListElement.innerHTML = '<p class="empty-text">現在、期限内のリクエストはありません。</p>';
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "home-list-item";
    item.textContent = `～${formatTaskLimitDate(task.to)} ${task.name}`;
    homeOnceTaskListElement.appendChild(item);
  });
}

function renderHomeInfoList(items) {
  if (!homeInfoListElement) {
    return;
  }

  homeInfoListElement.innerHTML = "";

  if (!items || items.length === 0) {
    homeInfoListElement.innerHTML = '<p class="empty-text">現在、お知らせはありません。</p>';
    return;
  }

  items.forEach((item) => {
    const dateLabel = formatHomeInfoDateLabel(item);
    const text = dateLabel ? `${dateLabel} ${item.name}` : item.name;
    const hasUrl = item.url && String(item.url).trim() !== "";

    if (hasUrl) {
      const link = document.createElement("a");
      link.className = "home-list-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = text;
      homeInfoListElement.appendChild(link);
      return;
    }

    const div = document.createElement("div");
    div.className = "home-list-item";
    div.textContent = text;
    homeInfoListElement.appendChild(div);
  });
}

function renderSpotifySongList(container, songs) {
  if (!container) {
    return;
  }

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
  if (!container) {
    return;
  }

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

function renderYoutubeCardRow(container, items, type) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-text">表示できる項目がありません。</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "youtube-card";

    const thumbnailUrl = getYoutubeThumbnailUrl(item);

    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "youtube-thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = item.name;
      thumbnail.loading = "lazy";
      card.appendChild(thumbnail);
    } else {
      const textCard = document.createElement("div");
      textCard.className = "youtube-text-card";
      textCard.textContent = type === "playlist" ? "再生リスト" : "MV";
      card.appendChild(textCard);
    }

    const name = document.createElement("p");
    name.className = "youtube-card-name";
    name.textContent = item.name;
    card.appendChild(name);

  card.addEventListener("click", () => {
    showPlaceholderNextStep("お疲れ様さまでした☺️Big Love");
  
    setTimeout(() => {
      location.href = item.url;
    }, 100);
  });

    container.appendChild(card);
  });
}

function selectSong(song) {
  state.selectedSong = song;

  if (selectedSongNameElement) {
    selectedSongNameElement.textContent = song.name;
  }

  if (selectedAreaElement) {
    selectedAreaElement.classList.remove("hidden");
  }

  if (spotifyNextButtonElement) {
    spotifyNextButtonElement.classList.add("hidden");
  }

  updateSelectedButtonStyle(".spotify-song-button", song);
  hideError(spotifyErrorAreaElement);
}

function selectRequestSong(song) {
  state.selectedRequestSong = song;

  if (selectedRequestSongNameElement) {
    selectedRequestSongNameElement.textContent = song.name;
  }

  if (selectedRequestSongAreaElement) {
    selectedRequestSongAreaElement.classList.remove("hidden");
  }

  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.classList.add("hidden");
  }

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
  if (otherSongsWrapperElement) {
    otherSongsWrapperElement.classList.toggle("hidden", !state.isOtherSongsOpen);
  }

  if (toggleOtherSongsIconElement) {
    toggleOtherSongsIconElement.textContent = state.isOtherSongsOpen ? "－" : "＋";
  }
}

function updateOtherRequestSongsAccordion() {
  if (otherRequestSongsWrapperElement) {
    otherRequestSongsWrapperElement.classList.toggle("hidden", !state.isOtherRequestSongsOpen);
  }

  if (toggleOtherRequestSongsIconElement) {
    toggleOtherRequestSongsIconElement.textContent = state.isOtherRequestSongsOpen ? "－" : "＋";
  }
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
  if (!onceTaskListElement) {
    return;
  }

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
    name.textContent = task.name;

    checkbox.addEventListener("change", () => {
      name.textContent = task.name;
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    onceTaskListElement.appendChild(label);
  });
}

function getCheckedOnceTasks() {
  if (!onceTaskListElement) {
    return [];
  }

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

  if (!task) {
    showRequestSongStep();
    return;
  }

  if (onceTaskProgressElement) {
    onceTaskProgressElement.textContent = `${currentNumber} / ${totalNumber}`;
  }

  if (onceTaskNameElement) {
    onceTaskNameElement.textContent = task.name;
  }

  if (onceTaskMessageAreaElement) {
    onceTaskMessageAreaElement.textContent = buildOnceTaskMessage(task);
  }

  if (task.url) {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.add("hidden");
    }
  }

  // 期間限定タスクは、ページを開かなくても次へ進めるようにする
  if (onceTaskNextButtonElement) {
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

    if (recommendedRequestSongs.length === 0 && recommendedRequestSongsElement) {
      recommendedRequestSongsElement.innerHTML = '<p class="empty-text">おすすめ曲はありません。</p>';
    }

    if (otherRequestSongs.length === 0 && otherRequestSongsElement) {
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

  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.add("hidden");
  }

  if (!group || !item) {
    showPostAskStep();
    return;
  }

  const items = getDailyGroupItems(group);
  const itemName = getDailyTaskItemName(item);
  const itemUrl = getDailyTaskItemUrl(item);

  if (dailyTaskHeaderDescriptionElement) {
    dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  }

  if (dailyTaskGroupNameElement) {
    dailyTaskGroupNameElement.textContent = group.listName;
  }

  if (dailyTaskProgressElement) {
    dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  }

  if (dailyTaskNameElement) {
    dailyTaskNameElement.textContent = itemName;
  }

  if (dailyTaskCommentAreaElement) {
    dailyTaskCommentAreaElement.textContent = item.comment || "ページを開いてタスクを完了してください。";
  }

  if (itemUrl) {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.add("hidden");
    }

    if (dailyTaskNextButtonElement) {
      dailyTaskNextButtonElement.classList.remove("hidden");
    }
  }
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
    return "";
  }

  return `今日のリクエスト曲: ${selectedRequestSongName}\n`;
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

  if (endedGroupNameElement) {
    endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  }

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
      checked: false,
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
      checked: false,
    });
  });

  items.push({
    id: "spotify-bgm",
    name: getPostSpotifyName(),
    url: getPostSpotifyUrl(),
    checked: false,
  });

  items.push({
    id: "app-share",
    name: "このツールをSNSにシェア",
    postText: "🔧タムごとDaily",
    url: getAppShareUrl(),
    checked: false,
  });

  return items;
}

function renderPostItemList(items) {
  if (!postItemListElement) {
    return;
  }

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
    name.textContent = item.name;

    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      name.textContent = item.name;
      updateGeneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    postItemListElement.appendChild(label);
  });
}

function updateGeneratedPostText() {
  const postText = buildPostText();

  if (generatedPostTextElement) {
    generatedPostTextElement.textContent = postText;
  }

  const textLength = postText.length;
  const linkCount = countLinks(postText);

  if (postTextCountElement) {
    postTextCountElement.textContent = `X文字数目安: ${textLength} / 280`;
    postTextCountElement.classList.toggle("warning-text", textLength > 280);
  }

  if (postLinkCountElement) {
    postLinkCountElement.textContent = `Threadsリンク数: ${linkCount} / 5`;
    postLinkCountElement.classList.toggle("warning-text", linkCount > 5);
  }

  if (copyPostTextButtonElement) {
    copyPostTextButtonElement.textContent = "コピーする";
  }
}

function getGeneratedPostText() {
  return generatedPostTextElement ? generatedPostTextElement.textContent || "" : "";
}

function buildPostText() {
  const lines = buildFixedPostLines();

  state.postItems.forEach((item) => {
    if (!item.checked) {
      return;
    }

    const postText = item.postText || item.name;

    if (item.id === "spotify-bgm" || item.id === "app-share") {
      lines.push(postText);
    } else {
      lines.push(`✅${postText}`);
    }

    if (item.url) {
      lines.push(item.url);
    }
  });

  return lines.join("\n");
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

async function showYoutubeAskStep() {
  showOnlyStep(youtubeAskStepElement);
}

async function showYoutubeSelectStep() {
  try {
    if (state.youtubePlaylists.length === 0) {
      state.youtubePlaylists = await loadYoutubePlaylists();
    }

    if (state.youtubeMvs.length === 0) {
      state.youtubeMvs = await loadYoutubeMvs();
    }

    renderYoutubeCardRow(youtubePlaylistRowElement, state.youtubePlaylists, "playlist");
    renderYoutubeCardRow(youtubeMvRowElement, state.youtubeMvs, "mv");

    showOnlyStep(youtubeSelectStepElement);
    hideError(youtubeErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(youtubeErrorAreaElement, "YouTubeリストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function getYoutubeThumbnailUrl(item) {
  if (!item) {
    return "";
  }

  if (item.thumbnail) {
    return item.thumbnail;
  }

  const startMovieVideoId = extractYoutubeVideoId(item.startmovie);
  if (startMovieVideoId) {
    return `${YOUTUBE_THUMBNAIL_BASE_URL}${startMovieVideoId}/hqdefault.jpg`;
  }

  const videoId = extractYoutubeVideoId(item.url);
  if (!videoId) {
    return "";
  }

  return `${YOUTUBE_THUMBNAIL_BASE_URL}${videoId}/hqdefault.jpg`;
}

function extractYoutubeVideoId(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const parsedUrl = new URL(text);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0];
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return "";
  } catch {
    return "";
  }
}

function getAppShareUrl() {
  return `${location.origin}${location.pathname}`;
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

function getPostSpotifyName() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return "🎧timelesz - Spotify";
  }

  return "🎧本日のBGM";
}

function getPostSpotifyUrl() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return TIMELESZ_SPOTIFY_ARTIST_URL;
  }

  return buildSpotifyUrl(state.selectedSong.url);
}

function showPlaceholderNextStep(message) {
  if (placeholderMessageElement) {
    placeholderMessageElement.textContent = message;
  }

  showOnlyStep(placeholderNextStepElement);
}

function showOnlyStep(activeStepElement, options = {}) {
  if (!activeStepElement) {
    console.error("表示対象の画面が見つかりません。");
    return;
  }

  const shouldRecordHistory = options.recordHistory !== false;

  if (
    shouldRecordHistory &&
    state.currentStepElement &&
    state.currentStepElement !== activeStepElement
  ) {
    state.stepHistory.push(state.currentStepElement);
  }

  const steps = [
    homeStepElement,
    spotifyStepElement,
    onceListSelectStepElement,
    onceTaskRunStepElement,
    requestSongStepElement,
    dailyTaskStepElement,
    dailyGroupEndStepElement,
    postAskStepElement,
    postEditStepElement,
    youtubeAskStepElement,
    youtubeSelectStepElement,
    placeholderNextStepElement,
  ].filter(Boolean);

  steps.forEach((stepElement) => {
    stepElement.classList.toggle("hidden", stepElement !== activeStepElement);
  });

  state.currentStepElement = activeStepElement;
  updateStepTopActionBar();
}

function goBackStep() {
  if (state.currentStepElement === dailyTaskStepElement) {
    goBackDailyTask();
    return;
  }

  if (state.currentStepElement === dailyGroupEndStepElement) {
    goBackFromDailyGroupEnd();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackDailyTask() {
  if (state.currentDailyTaskIndex > 0) {
    state.currentDailyTaskIndex -= 1;
    renderCurrentDailyTask();
    return;
  }

  if (state.currentDailyGroupIndex > 0) {
    state.currentDailyGroupIndex -= 1;

    const previousGroup = getCurrentDailyGroup();
    const previousGroupItems = getDailyGroupItems(previousGroup);

    state.currentDailyTaskIndex = Math.max(previousGroupItems.length - 1, 0);
    renderCurrentDailyTask();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(requestSongStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackFromDailyGroupEnd() {
  const currentGroup = getCurrentDailyGroup();
  const currentGroupItems = getDailyGroupItems(currentGroup);

  state.currentDailyTaskIndex = Math.max(currentGroupItems.length - 1, 0);
  showOnlyStep(dailyTaskStepElement, { recordHistory: false });
  renderCurrentDailyTask();
}

function updateStepTopActionBar() {
  if (!stepTopActionBarElement) {
    return;
  }

  const shouldShowTopActionBar =
    state.currentStepElement &&
    state.currentStepElement !== homeStepElement;

  stepTopActionBarElement.classList.toggle("hidden", !shouldShowTopActionBar);
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

function formatTaskLimitDate(value) {
  const date = parseDateTime(value);

  if (!date) {
    return "期限未設定";
  }

  return formatMonthDay(date);
}

function formatTaskLimitRange(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (!fromDate || !toDate) {
    return "期間未設定";
  }

  return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
}

function formatHomeInfoDateLabel(item) {
  if (!item) {
    return "";
  }

  const releaseDate = parseDateTime(item.release);

  if (releaseDate) {
    return formatMonthDay(releaseDate);
  }

  return formatHomeInfoPeriodLabel(item.from, item.to);
}

function formatHomeInfoPeriodLabel(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && toDate) {
    return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
  }

  if (fromDate) {
    return `${formatMonthDay(fromDate)}〜`;
  }

  if (toDate) {
    return `〜${formatMonthDay(toDate)}`;
  }

  return "";
}

function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}
