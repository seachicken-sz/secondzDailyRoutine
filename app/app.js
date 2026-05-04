const SPOTIFY_TRACK_BASE_URL = "https://open.spotify.com/track/";

const state = {
  selectedSong: null,
};

const recommendedSongsElement = document.getElementById("recommendedSongs");
const otherSongsElement = document.getElementById("otherSongs");
const selectedAreaElement = document.getElementById("selectedArea");
const selectedSongNameElement = document.getElementById("selectedSongName");
const openSpotifyButtonElement = document.getElementById("openSpotifyButton");
const errorAreaElement = document.getElementById("errorArea");

document.addEventListener("DOMContentLoaded", init);

openSpotifyButtonElement.addEventListener("click", () => {
  if (!state.selectedSong) {
    showError("曲が選択されていません。");
    return;
  }

  const spotifyUrl = buildSpotifyUrl(state.selectedSong.url);
  window.open(spotifyUrl, "_blank", "noopener");
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
  } catch (error) {
    console.error(error);
    showError("Spotify曲リストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
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

  updateSelectedButtonStyle(song);
  hideError();
}

function updateSelectedButtonStyle(selectedSong) {
  const buttons = document.querySelectorAll(".song-button");

  buttons.forEach((button) => {
    button.classList.toggle("selected", button.textContent === selectedSong.name);
  });
}

function buildSpotifyUrl(trackIdOrUrl) {
  if (trackIdOrUrl.startsWith("http://") || trackIdOrUrl.startsWith("https://")) {
    return trackIdOrUrl;
  }

  return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);
}

function showError(message) {
  errorAreaElement.textContent = message;
  errorAreaElement.classList.remove("hidden");
}

function hideError() {
  errorAreaElement.textContent = "";
  errorAreaElement.classList.add("hidden");
}
