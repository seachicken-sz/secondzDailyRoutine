// ==================================================
// requestSong.js
// USEN推しリク／デイリー用リクエスト曲選択を管理する
// ==================================================

function bindRequestSongEvents() {
  addClickEvent(
    toggleOtherRequestSongsButtonElement,
    () => {
      state.isOtherRequestSongsOpen =
        !state.isOtherRequestSongsOpen;

      updateOtherRequestSongsAccordion();
    }
  );

  addClickEvent(
    openRequestSongButtonElement,
    () => {
      // デイリー用曲選択モードでは
      // USENページを開かない
      if (isDailyRequestSongMode()) {
        return;
      }

      if (!state.selectedRequestSong) {
        showError(
          requestSongErrorAreaElement,
          MESSAGES.errors.noRequestSongSelected
        );

        return;
      }

      const requestUrl = buildRequestSongUrl(
        state.selectedRequestSong.url
      );

      requestSongNextButtonElement?.classList.remove(
        "hidden"
      );

      setButtonStyle(
        openRequestSongButtonElement,
        "gray"
      );

      setButtonStyle(
        requestSongNextButtonElement,
        "primary"
      );

      setSongListVisibility(
        recommendedRequestSongsElement,
        false
      );

      setSongListVisibility(
        otherRequestSongsWrapperElement,
        false
      );

      setSongListVisibility(
        toggleOtherRequestSongsButtonElement,
        false
      );

      state.openedAction =
        OPENED_ACTIONS.requestSong;

      saveFlowState(
        state.openedAction,
        requestSongStepElement
      );

      markHomeUsenTaskDoneFromRoutine();

      sendRequestSongLog(
        state.selectedRequestSong
      ).catch((error) => {
        console.error(
          "requestSongLog送信失敗",
          error
        );
      });

      openExternalTaskUrl(requestUrl);
    }
  );

  addClickEvent(
    requestSongNextButtonElement,
    async () => {
      // USENなし・デイリーありの場合
      if (isDailyRequestSongMode()) {
        if (
          !state.selectedRadioRequestSong?.name
        ) {
          showError(
            requestSongErrorAreaElement,
            MESSAGES.errors.noRequestSongSelected
          );

          return;
        }

        // 新曲切り替え画面は通らず
        // 直接デイリーへ進む
        await advanceRoutineFrom("dailySong");
        return;
      }

      // 通常USENの場合は、
      // 必要に応じて新曲切り替えへ進む
      await showRadioRequestSongOverrideStep();
    }
  );
}

async function showRequestSongStep() {
  try {
    state.selectedRequestSong = null;
    state.selectedRadioRequestSong = null;

    selectedRequestSongAreaElement?.classList.add(
      "hidden"
    );

    requestSongNextButtonElement?.classList.add(
      "hidden"
    );

    setButtonStyle(
      openRequestSongButtonElement,
      "primary"
    );

    setButtonStyle(
      requestSongNextButtonElement,
      "secondary"
    );

    setSongListVisibility(
      recommendedRequestSongsElement,
      true
    );

    setSongListVisibility(
      toggleOtherRequestSongsButtonElement,
      true
    );

    updateOtherRequestSongsAccordion();

    if (
      !Array.isArray(state.requestSongs) ||
      state.requestSongs.length === 0
    ) {
      state.requestSongs =
        await loadRequestSongs();
    }

    // 通常USEN：
    // URLがある曲だけ表示
    //
    // デイリー用：
    // URLなしを含む全曲を表示
    const availableSongs =
      isDailyRequestSongMode()
        ? state.requestSongs
        : state.requestSongs.filter((song) => {
            return (
              String(song.url || "").trim() !== ""
            );
          });

    const recommendedRequestSongs =
      availableSongs.filter((song) => {
        return song.flag === true;
      });

    const otherRequestSongs =
      availableSongs.filter((song) => {
        return song.flag !== true;
      });

    renderRequestSongList(
      recommendedRequestSongsElement,
      recommendedRequestSongs
    );

    renderRequestSongList(
      otherRequestSongsElement,
      otherRequestSongs
    );

    if (
      recommendedRequestSongs.length === 0 &&
      recommendedRequestSongsElement
    ) {
      recommendedRequestSongsElement.innerHTML =
        `<p class="empty-text">${MESSAGES.empty.recommendedSongs}</p>`;
    }

    if (
      otherRequestSongs.length === 0 &&
      otherRequestSongsElement
    ) {
      otherRequestSongsElement.innerHTML =
        `<p class="empty-text">${MESSAGES.empty.otherSongs}</p>`;
    }

    updateOtherRequestSongsAccordion();
    applyRequestSongStepMode();

    showOnlyStep(requestSongStepElement);

    hideError(requestSongErrorAreaElement);
  } catch (error) {
    console.error(error);

    showError(
      onceTaskRunErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:requestSong"
    );
  }
}
