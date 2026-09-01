// ==================================================
// requestSong.js
// USEN推しリクステップの表示・曲選択後の遷移・次画面への進行を管理するファイル
// ==================================================

// ==================================================
// USEN推しリクイベント登録
// ==================================================
// app.js から呼び出して、USEN推しリク画面で使うクリックイベントをまとめて登録する
function bindRequestSongEvents() {
  // 「その他」アコーディオン
  addClickEvent(toggleOtherRequestSongsButtonElement, () => {
    state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;
    updateOtherRequestSongsAccordion();
  });

  // USEN推しリクのページを開く
  addClickEvent(openRequestSongButtonElement, () => {
    // デイリー用の曲選択では外部ページを開かない
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

    const requestUrl = buildRequestSongUrl(state.selectedRequestSong.url);

    if (requestSongNextButtonElement) {
      requestSongNextButtonElement.classList.remove("hidden");
    }

    setButtonStyle(openRequestSongButtonElement, "gray");
    setButtonStyle(requestSongNextButtonElement, "primary");
    setSongListVisibility(recommendedRequestSongsElement, false);
    setSongListVisibility(otherRequestSongsWrapperElement, false);
    setSongListVisibility(toggleOtherRequestSongsButtonElement, false);

    state.openedAction = OPENED_ACTIONS.requestSong;
    saveFlowState(state.openedAction, requestSongStepElement);
    markHomeUsenTaskDoneFromRoutine();

    sendRequestSongLog(state.selectedRequestSong).catch((error) => {
      console.error("requestSongLog送信失敗", error);
    });

    openExternalTaskUrl(requestUrl);
  });

  // 曲選択後の次へ
  addClickEvent(requestSongNextButtonElement, async () => {
    if (isDailyRequestSongMode()) {
      if (!state.selectedRadioRequestSong?.name) {
        showError(
          requestSongErrorAreaElement,
          MESSAGES.errors.noRequestSongSelected
        );
        return;
      }

      // デイリー用の曲選択では新曲切り替え画面を通らない
      await advanceRoutineFrom("dailySong");
      return;
    }

    // 通常のUSENでは必要に応じて新曲切り替え画面へ進む
    await showRadioRequestSongOverrideStep();
  });
}

// ==================================================
// USEN推しリク画面表示
// ==================================================
// 期間限定タスク終了後、または期間限定タスク未選択時に呼ばれる
// リクエスト曲一覧を読み込み、USEN推しリク画面を表示する
async function showRequestSongStep() {
  try {
    state.selectedRequestSong = null;
    state.selectedRadioRequestSong = null;

    if (selectedRequestSongAreaElement) {
      selectedRequestSongAreaElement.classList.add("hidden");
    }

    if (requestSongNextButtonElement) {
      requestSongNextButtonElement.classList.add("hidden");
    }

    setButtonStyle(openRequestSongButtonElement, "primary");
    setButtonStyle(requestSongNextButtonElement, "secondary");
    setSongListVisibility(recommendedRequestSongsElement, true);
    setSongListVisibility(toggleOtherRequestSongsButtonElement, true);
    updateOtherRequestSongsAccordion();

    if (!Array.isArray(state.requestSongs) || state.requestSongs.length === 0) {
      state.requestSongs = await loadRequestSongs();
    }

    // 通常USENではURLがある曲だけ、デイリー用では全曲を表示する
    const availableSongs = isDailyRequestSongMode()
      ? state.requestSongs
      : state.requestSongs.filter((song) => {
          return String(song.url || "").trim() !== "";
        });

    const recommendedRequestSongs = availableSongs.filter((song) => {
      return song.flag === true;
    });

    const otherRequestSongs = availableSongs.filter((song) => {
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

    if (otherRequestSongs.length === 0 && otherRequestSongsElement) {
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
