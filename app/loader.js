//JSON読み込み
async function loadJsonFile(path, label) {
  const response = await fetch(`${path}?ts=${Date.now()}`);

  if (!response.ok) {
    throw new Error(`${label} の取得に失敗しました。`);
  }

  return response.json();
}

//Spotify
async function loadSpotifySongs() {
  const songs = await loadJsonFile("../data/spotifySongJson.json", "spotifySongJson.json");

  if (!Array.isArray(songs)) {
    throw new Error("spotifySongJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => song && song.name && song.url);
}
//リクエスト曲読み込み
async function loadRequestSongs() {
  const songs = await loadJsonFile("../data/requestSongJson.json", "requestSongJson.json");

  if (!Array.isArray(songs)) {
    throw new Error("requestSongJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => song && song.name && song.url);
}
//リクエスト文章読み込み
async function loadRequestTexts() {
  const requestTexts = await loadJsonFile("../data/requestTextJson.json", "requestTextJson.json");

  if (!requestTexts || Array.isArray(requestTexts) || typeof requestTexts !== "object") {
    throw new Error("requestTextJson.json がオブジェクト形式ではありません。");
  }

  return requestTexts;
}
//デイリータスク読み込み
async function loadDailyGroups() {
  const groups = await loadJsonFile("../data/listJson.json", "listJson.json");

  if (!Array.isArray(groups)) {
    throw new Error("listJson.json が配列形式ではありません。");
  }

  return groups.filter((group) => {
    return group && group.listName && Array.isArray(group.items) && group.items.length > 0;
  });
}
//YouTubeプレリ読み込み
async function loadYoutubePlaylists() {
  const playlists = await loadJsonFile("../data/youtubePlayListJson.json", "youtubePlayListJson.json");

  if (!Array.isArray(playlists)) {
    throw new Error("youtubePlayListJson.json が配列形式ではありません。");
  }

  return playlists.filter((item) => item && item.name && item.url);
}
//YouTubeMV読み込み
async function loadYoutubeMvs() {
  const mvs = await loadJsonFile("../data/youtubeMVListJson.json", "youtubeMVListJson.json");

  if (!Array.isArray(mvs)) {
    throw new Error("youtubeMVListJson.json が配列形式ではありません。");
  }

  return mvs.filter((item) => item && item.name && item.url);
}