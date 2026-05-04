const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";

const state = {
  selectedSong: null,
  isOtherSongsOpen: false,
  onceTasks: [],
  selectedOnceTasks: [],
  currentOnceTaskIndex: 0,
};

const spotifyStepElement = document.getElementById("spotifyStep");
const onceListSelectStepElement = document.getElementById("onceListSelectStep");
const onceTaskRunStepElement = document.getElementById("onceTaskRunStep");

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

startOnceTasksButtonElement.addEventListener("click", () => {
  const selectedTasks = getCheckedOnceTasks();

  if (selectedTasks.length === 0) {
    showError(onceListErrorAreaElement, "実行するタスクを1つ以上選んでください。");
    return;
  }

  state.selectedOnceTasks = selectedTasks;
  state.currentOnceTaskIndex = 0;

  hideError(onceListErrorAreaElement);
  showOnceTaskRunStep();
});

openOnceTaskUrlButtonElement.addEventListener("click", () => {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];

  if (!task || !task.url) {
    showError(onceTaskRunErrorAreaElement, "URLが設定されていません。");
    return;
  }

  window.location.href = task.url;

  onceTaskNextButtonElement.classList.remove("hidden");
});

onceTaskNextButtonElement.addEventListener("click", () => {
  state.currentOnceTaskIndex += 1;

  if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
    showPlaceholderNextStep();
    return;
  }

  renderCurrentOnceTask();
});

async function init() {
  try {
    const songs = await loadSpotifySongs();

    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);

    renderSongList(recommendedSongsElement, recommendedSongs);
    renderSongList(otherSongsElement, otherSongs);

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

function renderSongList(container, songs) {
  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectSong(song);
    });

    container.appendChild(button);
  });
}

function selectSong(song) {
  state.selectedSong = song;

  selectedSongNameElement.textContent = song.name;
  selectedAreaElement.classList.remove("hidden");

  spotifyNextButtonElement.classList.add("hidden");

  updateSelectedButtonStyle(song);
  hideError(spotifyErrorAreaElement);
}

function updateSelectedButtonStyle(selectedSong) {
  const buttons = document.querySelectorAll(".song-button");

  buttons.forEach((button) => {
    button.classList.toggle("selected", button.textContent === selectedSong.name);
  });
}

function updateOtherSongsAccordion() {
  otherSongsWrapperElement.classList.toggle("hidden", !state.isOtherSongsOpen);
  toggleOtherSongsIconElement.textContent = state.isOtherSongsOpen ? "－" : "＋";
}

async function showOnceListSelectStep() {
  try {
    if (state.onceTasks.length === 0) {
      state.onceTasks = await loadOnceTasks();
    }

    renderOnceTaskCheckList(state.onceTasks);

    spotifyStepElement.classList.add("hidden");
    onceTaskRunStepElement.classList.add("hidden");
    onceListSelectStepElement.classList.remove("hidden");

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
  onceListSelectStepElement.classList.add("hidden");
  spotifyStepElement.classList.add("hidden");
  onceTaskRunStepElement.classList.remove("hidden");

  renderCurrentOnceTask();
}

function renderCurrentOnceTask() {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  const currentNumber = state.currentOnceTaskIndex + 1;
  const totalNumber = state.selectedOnceTasks.length;

  hideError(onceTaskRunErrorAreaElement);
  onceTaskNextButtonElement.classList.add("hidden");

  if (!task) {
    showPlaceholderNextStep();
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

function showPlaceholderNextStep() {
  onceTaskProgressElement.textContent = "";
  onceTaskNameElement.textContent = "期間限定タスクはここまでです";
  onceTaskMessageAreaElement.textContent = "次はリクエスト曲選択に進みます。";
  openOnceTaskUrlButtonElement.classList.add("hidden");
  onceTaskNextButtonElement.classList.add("hidden");
}

function buildSpotifyUrl(trackIdOrUrl) {
  if (trackIdOrUrl.startsWith("http://") || trackIdOrUrl.startsWith("https://")) {
    return trackIdOrUrl;
  }

  return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);
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
