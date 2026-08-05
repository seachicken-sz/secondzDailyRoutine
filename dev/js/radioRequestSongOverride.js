// ==================================================
// radioRequestSongOverride.js
// ラジオリクエスト用の曲だけを、USEN選択曲とは別に切り替える
// ==================================================

function bindRadioRequestSongOverrideEvents() {
  addClickEvent(
    keepCurrentRadioRequestSongButtonElement,
    async () => {
      useCurrentRequestSongForRadio();

      await advanceRoutineFrom(
        "radioOverride"
      );
    }
  );
}

async function showRadioRequestSongOverrideStep() {
  try {
    if (!state.selectedRadioRequestSong) {
      useCurrentRequestSongForRadio();
    }

    // セレクトモードで、
    // ・この後デイリーを行わない
    // ・デイリーで任意の曲名を使わない
    // 場合は切り替え画面を出さない
    if (
      !shouldShowRadioRequestSongOverride()
    ) {
      await advanceRoutineFrom(
        "radioOverride"
      );

      return;
    }

    const overrideSongs =
      await getActiveRadioRequestSongOverrides();

    if (overrideSongs.length === 0) {
      await advanceRoutineFrom(
        "radioOverride"
      );

      return;
    }

    if (currentRadioRequestSongNameElement) {
      currentRadioRequestSongNameElement.textContent =
        getSelectedRequestSongName() ||
        "未選択";
    }

    renderRadioRequestSongOverrideButtons(
      overrideSongs
    );

    showOnlyStep(
      radioRequestSongOverrideStepElement
    );

    hideError(
      radioRequestSongOverrideErrorAreaElement
    );
  } catch (error) {
    console.error(error);

    showError(
      requestSongErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:radioRequestSongOverride"
    );
  }
}

async function getActiveRadioRequestSongOverrides() {
  if (
    !Array.isArray(
      state.radioRequestSongOverrides
    ) ||
    state.radioRequestSongOverrides.length === 0
  ) {
    state.radioRequestSongOverrides =
      await loadRadioRequestSongOverrides();
  }

  return state.radioRequestSongOverrides;
}

function renderRadioRequestSongOverrideButtons(
  songs
) {
  if (
    !radioRequestSongOverrideButtonListElement
  ) {
    return;
  }

  radioRequestSongOverrideButtonListElement.innerHTML =
    "";

  songs.forEach((song) => {
    const songName = String(
      song.songName || ""
    ).trim();

    if (!songName) {
      return;
    }

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "primary-button";
    button.textContent =
      `「${songName}」に切り替える`;

    button.addEventListener(
      "click",
      async () => {
        state.selectedRadioRequestSong = {
          name: songName,
          source: "override",
        };

        sendNewSongRequestLog(
          state.selectedRadioRequestSong
        ).catch((error) => {
          console.error(
            "newSong requestSongログ送信失敗",
            error
          );
        });

        await advanceRoutineFrom(
          "radioOverride"
        );
      }
    );

    radioRequestSongOverrideButtonListElement.appendChild(
      button
    );
  });
}

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

function getSelectedRadioRequestSongName() {
  if (
    state.selectedRadioRequestSong &&
    state.selectedRadioRequestSong.name
  ) {
    return state.selectedRadioRequestSong.name;
  }

  return getSelectedRequestSongName();
}
