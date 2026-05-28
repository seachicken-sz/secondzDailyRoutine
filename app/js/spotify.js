// ==================================================
// spotify.js
// Spotifyステップのクリックイベントを管理するファイル
// ==================================================

// ==================================================
// Spotifyステップイベント登録
// ==================================================
// app.js から呼び出して、Spotify画面で使うクリックイベントをまとめて登録する
function bindSpotifyEvents() {
  // ==================================================
  // 「Spotifyで開く」ボタン
  // ==================================================

  // Spotifyで開くボタン押下時
  addClickEvent(openSpotifyButtonElement, () => {
    // 曲が未選択の場合はエラー表示して処理を止める
    if (!state.selectedSong) {
      showError(spotifyErrorAreaElement, MESSAGES.errors.noSongSelected);
      return;
    }

    // 選択中の曲からSpotify用URLを作成
    const spotifyUrl = buildSpotifyUrl(state.selectedSong);

    // Spotifyを開いた後に進めるよう、次へボタンを表示
    if (spotifyNextButtonElement) {
      spotifyNextButtonElement.classList.remove("hidden");
    }

    // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
    setButtonStyle(openSpotifyButtonElement, "gray");
    setButtonStyle(spotifyNextButtonElement, "primary");

    // Spotify遷移後は曲リストを非表示にして、戻ってきた時の画面を簡略化する
    setSongListVisibility(recommendedSongsElement, false);
    setSongListVisibility(otherSongsWrapperElement, false);
    setSongListVisibility(toggleOtherSongsButtonElement, false);

    // Spotifyを開いた状態として保存する
    // アプリに戻ってきた時に次へボタン表示などを復元するため
    state.openedAction = OPENED_ACTIONS.spotify;
    saveFlowState(state.openedAction, spotifyStepElement);

    // Spotify再生ログを送信する
    // ログ送信に失敗してもユーザー操作は止めない
    sendSpotifyLog(state.selectedSong).catch((error) => {
      console.error("spotifyLog送信失敗", error);
    });

    // Spotifyへ移動
    location.href = spotifyUrl;
  });

  // ==================================================
  // 「BGMなし」ボタン
  // ==================================================

  // BGMなしボタン押下時
  addClickEvent(skipSpotifyButtonElement, async () => {
    // Spotify曲は未選択扱いにする
    state.selectedSong = null;

    // 期間限定タスク選択へ進む
    await showOnceListSelectStep();
  });

  // ==================================================
  // 「次へ」ボタン
  // ==================================================

  // Spotifyステップの次へボタン押下時
  addClickEvent(spotifyNextButtonElement, async () => {
    // 期間限定タスク選択へ進む
    await showOnceListSelectStep();
  });

  // ==================================================
  // 「その他」アコーディオン
  // ==================================================

  // Spotifyの「その他」開閉ボタン押下時
  addClickEvent(toggleOtherSongsButtonElement, () => {
    // その他曲リストの開閉状態を反転する
    state.isOtherSongsOpen = !state.isOtherSongsOpen;

    // 反転後の状態を画面に反映する
    updateOtherSongsAccordion();
  });
}
