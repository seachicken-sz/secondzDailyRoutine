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
  const songs = await loadJsonFile(DATA_PATHS.spotifySongs, "spotifySongJson.json");

  if (!Array.isArray(songs)) {
    throw new Error("spotifySongJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => song && song.name && song.url);
}

//期間限定タスク読み込み
async function loadOnceTasks() {
  const tasks = await loadJsonFile(DATA_PATHS.onceTasks, "onceListJson.json");

  if (!Array.isArray(tasks)) {
    throw new Error("onceListJson.json が配列形式ではありません。");
  }

  return tasks.filter((task) => {
    return task && task.name && isWithinPeriod(task.from, task.to);
  });
}

//情報読み込み
async function loadHomeInfoList() {
  const informationList = await loadJsonFile(DATA_PATHS.homeInfoList, "homeInfoListJson.json");

  if (!Array.isArray(informationList)) {
    throw new Error("homeInfoListJson.json が配列形式ではありません。");
  }

  return informationList.filter((item) => {
    return item && item.name && isWithinPeriod(item.from, item.to);
  });
}

//リクエスト曲読み込み
async function loadRequestSongs() {
  const songs = await loadJsonFile(DATA_PATHS.requestSongs, "requestSongJson.json");

  if (!Array.isArray(songs)) {
    throw new Error("requestSongJson.json が配列形式ではありません。");
  }

  // 曲名があるものはすべて読み込む
  return songs.filter((song) => {
    return song && String(song.name || "").trim() !== "";
  });
}

// ラジオリクエスト曲切替候補読み込み
async function loadRadioRequestSongOverrides() {
  const songs = await loadJsonFile(
    DATA_PATHS.radioRequestSongOverrides,
    "radioRequestSongOverrideJson.json"
  );

  if (!Array.isArray(songs)) {
    throw new Error("radioRequestSongOverrideJson.json が配列形式ではありません。");
  }

  return songs.filter((song) => {
    return (
      song &&
      song.active === true &&
      String(song.songName || "").trim() !== "" &&
      isWithinPeriod(song.from, song.to)
    );
  });
}

// ホームのおかわりDailyとデイリー用の曲選択で同じ候補を使う。
async function loadDailyRequestSongOptions(requestSongs) {
  let overrides;

  try {
    overrides = await loadRadioRequestSongOverrides();
  } catch (error) {
    console.warn("ラジオリクエスト曲の読み込みに失敗しました。", error);
    return { overrideSongs: [], regularSongs: requestSongs };
  }

  const songName = (song) => String(song.name || "").trim();
  const overrideSongsByName = new Map();

  for (const override of overrides) {
    const name = String(override.songName).trim();
    // 同名の既存曲があれば、USENのURL付きデータを優先する。
    const matchingSongs = requestSongs.filter((song) => songName(song) === name);
    const existingSong = matchingSongs.find((song) => String(song.url || "").trim());
    overrideSongsByName.set(name, existingSong || matchingSongs[0] || { name });
  }

  return {
    overrideSongs: [...overrideSongsByName.values()],
    regularSongs: requestSongs.filter((song) => !overrideSongsByName.has(songName(song))),
  };
}

//リクエスト文章読み込み
async function loadRequestTexts() {
  const requestTexts = await loadJsonFile(DATA_PATHS.requestTexts, "requestTextJson.json");

  if (!requestTexts || Array.isArray(requestTexts) || typeof requestTexts !== "object") {
    throw new Error("requestTextJson.json がオブジェクト形式ではありません。");
  }

  return requestTexts;
}

//デイリータスク読み込み
async function loadDailyGroups() {
  const groups = await loadJsonFile(DATA_PATHS.dailyGroups, "listJson.json");

  if (!Array.isArray(groups)) {
    throw new Error("listJson.json が配列形式ではありません。");
  }

  state.baseDailyGroups = groups.filter((group) => {
    return group && group.listName && Array.isArray(group.items) && group.items.length > 0;
  });
  await loadLocalDailyGroups();
  return composeDailyGroups();
}

// ローカルタスクの取得失敗で通常のデイリータスクを止めない。
async function loadLocalDailyGroups() {
  try {
    const groups = await loadJsonFile(DATA_PATHS.localGroups, "localListJson.json");
    if (!Array.isArray(groups)) throw new Error("localListJson.json が配列形式ではありません。");
    state.localDailyGroups = groups.filter(group => group?.listName &&
      group.prefectureCode != null && Array.isArray(group.items) && group.items.length)
      .map(group => ({ ...group, localFlag: true }));
    state.localDailyGroupsLoaded = true;
  } catch (error) {
    state.localDailyGroupsLoaded = false;
    console.warn("ローカルタスクの読み込みに失敗しました。", error);
  }
}

//メンバーお仕事読み込み
async function loadMemberWorks() {
  const works = await loadJsonFile(
    DATA_PATHS.memberWorks,
    "memberWorksJson.json"
  );

  if (!Array.isArray(works)) {
    throw new Error(
      "memberWorksJson.json が配列形式ではありません。"
    );
  }

  return works.filter((item) => {
    return (
      item &&
      item.title &&
      Array.isArray(item.members) &&
      item.members.length > 0
    );
  });
}

//YouTubeプレリ読み込み
async function loadYoutubePlaylists() {
  const playlists = await loadJsonFile(DATA_PATHS.youtubePlaylists, "youtubePlayListJson.json");

  if (!Array.isArray(playlists)) {
    throw new Error("youtubePlayListJson.json が配列形式ではありません。");
  }

  return playlists.filter((item) => item && item.name && item.url);
}

//YouTubeMV読み込み
async function loadYoutubeMvs() {
  const mvs = await loadJsonFile(DATA_PATHS.youtubeMvs, "youtubeMVListJson.json");

  if (!Array.isArray(mvs)) {
    throw new Error("youtubeMVListJson.json が配列形式ではありません。");
  }

  return mvs.filter((item) => item && item.name && item.url);
}

// YouTubeその他動画読み込み
async function loadYoutubeOthers() {
  const others = await loadJsonFile(
    DATA_PATHS.youtubeOthers,
    "youtubeOtherListJson.json"
  );

  if (!Array.isArray(others)) {
    throw new Error("youtubeOtherListJson.json が配列形式ではありません。");
  }

  return others.filter((item) => item && item.name && item.url);
}
