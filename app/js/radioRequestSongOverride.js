// ==================================================
// radioRequestSongOverride.js
// ラジオリクエスト用の曲だけを、USEN選択曲とは別に切り替える
// ==================================================

// ==================================================
// イベント登録
// ==================================================
function bindRadioRequestSongOverrideEvents() {
  addClickEvent(keepCurrentRadioRequestSongButtonElement, async () => {
    useCurrentRequestSongForRadio();
    await showDailyTaskStep();
  });
}

// ==================================================
// ラジオリクエスト曲切替画面表示
// ==================================================
async function showRadioRequestSongOverrideStep() {
  try {
    // まだラジオ用の曲が決まっていない場合だけ、USEN選択曲を初期値にする
    if (!state.selectedRadioRequestSong) {
      useCurrentRequestSongForRadio();
    }

    const overrideSongs = await getActiveRadioRequestSongOverrides();

    if (overrideSongs.length === 0) {
      await showDailyTaskStep();
      return;
    }

    if (currentRadioRequestSongNameElement) {
      currentRadioRequestSongNameElement.textContent =
        getSelectedRequestSongName() || "未選択";
    }

    renderRadioRequestSongOverrideButtons(overrideSongs);

    showOnlyStep(radioRequestSongOverrideStepElement);
    hideError(radioRequestSongOverrideErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(
      requestSongErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:radioRequestSongOverride"
    );
  }
}

// ==================================================
// 有効な切替候補取得
// ==================================================
async function getActiveRadioRequestSongOverrides() {
  if (
    !Array.isArray(state.radioRequestSongOverrides) ||
    state.radioRequestSongOverrides.length === 0
  ) {
    state.radioRequestSongOverrides = await loadRadioRequestSongOverrides();
  }

  return state.radioRequestSongOverrides;
}

// ==================================================
// 切替ボタン描画
// ==================================================
function renderRadioRequestSongOverrideButtons(songs) {
  if (!radioRequestSongOverrideButtonListElement) {
    return;
  }

  radioRequestSongOverrideButtonListElement.innerHTML = "";

  songs.forEach((song) => {
    const songName = String(song.songName || "").trim();

    if (!songName) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button";
    button.textContent = `「${songName}」に切り替える`;

    button.addEventListener("click", async () => {
      state.selectedRadioRequestSong = {
        name: songName,
        source: "override",
      };

      await showDailyTaskStep();
    });

    radioRequestSongOverrideButtonListElement.appendChild(button);
  });
}

// ==================================================
// 現在のUSEN選択曲をラジオ用にも使う
// ==================================================
function useCurrentRequestSongForRadio() {
  if (!state.selectedRequestSong) {
    state.selectedRadioRequestSong = null;
    return;
  }

  state.selectedRadioRequestSong = {
    name: state.selectedRequestSong.name || "",
    source: "usen",
  };
}

// ==================================================
// ラジオリクエストで実際に使う曲名
// ==================================================
function getSelectedRadioRequestSongName() {
  if (state.selectedRadioRequestSong && state.selectedRadioRequestSong.name) {
    return state.selectedRadioRequestSong.name;
  }

  return getSelectedRequestSongName();
}
