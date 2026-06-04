// ==================================================
// requestSong.js
// USEN推しリクステップの表示・曲選択後の遷移・次画面への進行を管理するファイル
// ==================================================

// ==================================================
// USEN推しリクイベント登録
// ==================================================
// app.js から呼び出して、USEN推しリク画面で使うクリックイベントをまとめて登録する
function bindRequestSongEvents() {
  // ==================================================
  // 「その他」アコーディオン
  // ==================================================

  // USEN推しリクの「その他」開閉ボタン押下時
  addClickEvent(toggleOtherRequestSongsButtonElement, () => {
    // その他リクエスト曲リストの開閉状態を反転する
    state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;

    // 反転後の状態を画面に反映する
    updateOtherRequestSongsAccordion();
  });

  // ==================================================
  // 「USEN推しリクで開く」ボタン
  // ==================================================

  // USEN推しリクのページを開くボタン押下時
  addClickEvent(openRequestSongButtonElement, () => {
    // リクエスト曲が未選択の場合はエラー表示して処理を止める
    if (!state.selectedRequestSong) {
      showError(requestSongErrorAreaElement, MESSAGES.errors.noRequestSongSelected);
      return;
    }

    // 選択中の曲からUSEN推しリク用URLを作成
    const requestUrl = buildRequestSongUrl(state.selectedRequestSong.url);

    // ページを開いた後に進めるよう、次へボタンを表示
    if (requestSongNextButtonElement) {
      requestSongNextButtonElement.classList.remove("hidden");
    }

    // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
    setButtonStyle(openRequestSongButtonElement, "gray");
    setButtonStyle(requestSongNextButtonElement, "primary");

    // USEN推しリク遷移後は曲リストを非表示にして、戻ってきた時の画面を簡略化する
    setSongListVisibility(recommendedRequestSongsElement, false);
    setSongListVisibility(otherRequestSongsWrapperElement, false);
    setSongListVisibility(toggleOtherRequestSongsButtonElement, false);

    // USEN推しリクを開いた状態として保存する
    // アプリに戻ってきた時に次へボタン表示などを復元するため
    state.openedAction = OPENED_ACTIONS.requestSong;
    saveFlowState(state.openedAction, requestSongStepElement);

    // USEN推しリクのログを送信する
    // ログ送信に失敗してもユーザー操作は止めない
    sendRequestSongLog(state.selectedRequestSong).catch((error) => {
      console.error("requestSongLog送信失敗", error);
    });

    // USEN推しリクページへ移動
    location.href = requestUrl;
  });

  // ==================================================
  // 「次へ」ボタン
  // ==================================================

  // USEN推しリクステップの次へボタン押下時
  addClickEvent(requestSongNextButtonElement, async () => {
    // デイリータスクへ進む
    await showDailyTaskStep();
  });
}

// ==================================================
// USEN推しリク画面表示
// ==================================================
// 期間限定タスク終了後、または期間限定タスク未選択時に呼ばれる
// リクエスト曲一覧を読み込み、USEN推しリク画面を表示する
async function showRequestSongStep() {
  try {
    // 前回選択していたリクエスト曲をリセットする
    state.selectedRequestSong = null;

    // 選択済み曲の表示エリアを非表示に戻す
    if (selectedRequestSongAreaElement) {
      selectedRequestSongAreaElement.classList.add("hidden");
    }

    // 次へボタンを一旦非表示に戻す
    if (requestSongNextButtonElement) {
      requestSongNextButtonElement.classList.add("hidden");
    }

    // ボタン表示を初期状態に戻す
    setButtonStyle(openRequestSongButtonElement, "primary");
    setButtonStyle(requestSongNextButtonElement, "secondary");

    // おすすめ曲リストを表示する
    setSongListVisibility(recommendedRequestSongsElement, true);

    // 「その他」開閉ボタンを表示する
    setSongListVisibility(toggleOtherRequestSongsButtonElement, true);

    // その他リクエスト曲リストの開閉状態を画面に反映する
    updateOtherRequestSongsAccordion();

    // リクエスト曲一覧が未読み込みの場合だけJSONを読み込む
    if (state.requestSongs.length === 0) {
      state.requestSongs = await loadRequestSongs();
    }

    // URLがない新曲は、dailyコピペ用には使うがUSENボタンには出さない
    const requestableSongs = state.requestSongs.filter((song) => {
      return String(song.url || "").trim() !== "";
    });
    
    // flag === true の曲をおすすめ欄へ、それ以外を「その他」欄へ分ける
    const recommendedRequestSongs = requestableSongs.filter((song) => song.flag === true);
    const otherRequestSongs = requestableSongs.filter((song) => song.flag !== true);

    // おすすめリクエスト曲リストを描画
    renderRequestSongList(recommendedRequestSongsElement, recommendedRequestSongs);

    // その他リクエスト曲リストを描画
    renderRequestSongList(otherRequestSongsElement, otherRequestSongs);

    // おすすめ曲が0件の場合の空表示
    if (recommendedRequestSongs.length === 0 && recommendedRequestSongsElement) {
      recommendedRequestSongsElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.recommendedSongs}</p>`;
    }

    // その他曲が0件の場合の空表示
    if (otherRequestSongs.length === 0 && otherRequestSongsElement) {
      otherRequestSongsElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.otherSongs}</p>`;
    }

    // リスト描画後に、その他リクエスト曲リストの開閉状態を再反映する
    updateOtherRequestSongsAccordion();

    // USEN推しリク画面を表示する
    showOnlyStep(requestSongStepElement);

    // 前回表示されていたエラーを消す
    hideError(requestSongErrorAreaElement);
  } catch (error) {
    // リクエスト曲一覧の読み込みや描画に失敗した場合
    console.error(error);

    // 期間限定タスク側のエリアにエラー表示する
    // この関数は期間限定タスク終了直後に呼ばれることが多いため、既存挙動に合わせる
    showError(
      onceTaskRunErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:requestSong"
    );
  }
}
