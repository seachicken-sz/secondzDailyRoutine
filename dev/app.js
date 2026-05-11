// ==================================================
// 初期表示
// ==================================================
// 画面生成
document.addEventListener("DOMContentLoaded", init);
// アプリ遷移時に現在の状態を保存
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveFlowState();
  }
});
window.addEventListener("pagehide", () => {
  saveFlowState();
});
// ==================================================
// クリックイベント設定
// ==================================================
function addClickEvent(element, handler) {
  // HTML側に要素がない場合は何もしない
  if (!element) {
    return;
  }
  element.addEventListener("click", handler);
}
// ==================================================
// クリックイベント設定 - HOME、共通
// ==================================================
// 戻るボタン押下時
addClickEvent(backStepButtonElement, () => {
  goBackStep();
});
// 開始ボタン押下時
addClickEvent(startRoutineButtonElement, () => {
  sendStartLog().catch((error) => {
    console.error("startError", error);
  });
  showOnlyStep(spotifyStepElement);
});
// SNSシェアボタン
addClickEvent(homeTopShareButtonElement, shareAppFromHome);
addClickEvent(homeBottomShareButtonElement, shareAppFromHome);

// ==================================================
// クリックイベント設定 - モーダル
// ==================================================
// 画面下部の初回設定ボタン押下時
addClickEvent(openHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
});
// 初回設定モーダルの閉じるボタン押下時
addClickEvent(closeHowToButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.add("hidden");
  }
});
// ホーム画面カード内の初回設定ボタン押下時
addClickEvent(openHowToFromHomeCardButtonElement, () => {
  if (howToModalElement) {
    howToModalElement.classList.remove("hidden");
  }
});
// 初回設定モーダルの外側タップ時
// モーダル本文をタップした場合は閉じない
if (howToModalElement) {
  howToModalElement.addEventListener("click", (event) => {
    if (event.target === howToModalElement) {
      howToModalElement.classList.add("hidden");
    }
  });
}
// 使い方モーダルを開く共通処理
// ホーム画面下部ボタン・ステップ上部ボタンの両方から使う
const openUsageModal = () => {
  if (usageModalElement) {
    usageModalElement.classList.remove("hidden");
  }
};
// ホーム画面下部の使い方ボタン押下時
addClickEvent(openUsageButtonElement, openUsageModal);
// ステップ画面上部の使い方ボタン押下時
addClickEvent(stepUsageButtonElement, openUsageModal);
// 使い方モーダルの閉じるボタン押下時
addClickEvent(closeUsageButtonElement, () => {
  if (usageModalElement) {
    usageModalElement.classList.add("hidden");
  }
});
// 使い方モーダルの外側タップ時
// モーダル本文をタップした場合は閉じない
if (usageModalElement) {
  usageModalElement.addEventListener("click", (event) => {
    if (event.target === usageModalElement) {
      usageModalElement.classList.add("hidden");
    }
  });
}
// ==================================================
// クリックイベント設定 - Spotify
// ==================================================
// Spotifyで開くボタン押下時
addClickEvent(openSpotifyButtonElement, () => {
  // 曲が未選択の場合はエラー表示して処理を止める
  if (!state.selectedSong) {
    showError(spotifyErrorAreaElement, MESSAGES.errors.noSongSelected);
    return;
  }
  // 選択中の曲からSpotify用URLを作成
  const spotifyUrl = buildSpotifyUrl(state.selectedSong.url);
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
  sendSpotifyLog(state.selectedSong).catch((error) => {
  console.error("spotifyLog送信失敗", error);
});
  // Spotifyへ移動
  location.href = spotifyUrl;
});
// BGMなしボタン押下時
addClickEvent(skipSpotifyButtonElement, async () => {
  // Spotify曲は未選択扱いにする
  state.selectedSong = null;
  // 期間限定タスク選択へ進む
  await showOnceListSelectStep();
});
// Spotifyステップの次へボタン押下時
addClickEvent(spotifyNextButtonElement, async () => {
  // 期間限定タスク選択へ進む
  await showOnceListSelectStep();
});
// Spotifyの「その他」開閉ボタン押下時
addClickEvent(toggleOtherSongsButtonElement, () => {
  // その他曲リストの開閉状態を反転する
  state.isOtherSongsOpen = !state.isOtherSongsOpen;
  // 反転後の状態を画面に反映する
  updateOtherSongsAccordion();
});
// ==================================================
// クリックイベント設定 - 期間限定タスク
// ==================================================
// 期間限定タスク選択画面の次へボタン押下時
addClickEvent(startOnceTasksButtonElement, async () => {
  // チェックされている期間限定タスクを取得
  const selectedTasks = getCheckedOnceTasks();
  // 前回表示されていたエラーを消す
  hideError(onceListErrorAreaElement);
  // 選択された期間限定タスクがない場合は、USEN推しリクへ進む
  if (selectedTasks.length === 0) {
    state.selectedOnceTasks = [];
    state.currentOnceTaskIndex = 0;
    await showRequestSongStep();
    return;
  }
  // 選択された期間限定タスクを保存し、先頭から実行する
  state.selectedOnceTasks = selectedTasks;
  state.currentOnceTaskIndex = 0;
  // 期間限定タスク実行画面へ進む
  showOnceTaskRunStep();
});
// 期間限定タスクのページを開くボタン押下時
addClickEvent(openOnceTaskUrlButtonElement, () => {
  // 現在実行中の期間限定タスクを取得
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  // タスクまたはURLがない場合はエラー表示して処理を止める
  if (!task || !task.url) {
    showError(onceTaskRunErrorAreaElement, MESSAGES.errors.noUrl);
    return;
  }
  // ページを開いた後に進めるよう、次へボタンを表示
  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openOnceTaskUrlButtonElement, "gray");
  setButtonStyle(onceTaskNextButtonElement, "primary");
  // 期間限定タスクを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = OPENED_ACTIONS.onceTask;
  saveFlowState(state.openedAction, onceTaskRunStepElement);
  // 期間限定タスクのURLへ移動
  location.href = task.url;
});
// 期間限定タスク実行画面の次へボタン押下時
addClickEvent(onceTaskNextButtonElement, async () => {
  const currentTask = state.selectedOnceTasks[state.currentOnceTaskIndex];
  markOnceTaskDone(currentTask);
  // 次の期間限定タスクへ進める
  state.currentOnceTaskIndex += 1;
  // 選択した期間限定タスクがすべて終わったら、USEN推しリクへ進む
  if (state.currentOnceTaskIndex >= state.selectedOnceTasks.length) {
  sendOnceListLog(state.selectedOnceTasks).catch((error) => {
    console.error("onceListLog送信失敗", error);
  });
  await showRequestSongStep();
  return;
}
  // 次の期間限定タスクを画面に表示する
  renderCurrentOnceTask();
});
// ==================================================
// クリックイベント設定 - USEN推し活
// ==================================================
// USEN推しリクの「その他」開閉ボタン押下時
addClickEvent(toggleOtherRequestSongsButtonElement, () => {
  // その他リクエスト曲リストの開閉状態を反転する
  state.isOtherRequestSongsOpen = !state.isOtherRequestSongsOpen;
  // 反転後の状態を画面に反映する
  updateOtherRequestSongsAccordion();
});
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
  sendRequestSongLog(state.selectedRequestSong).catch((error) => {
  console.error("requestSongLog送信失敗", error);
});
  // USEN推しリクページへ移動
  location.href = requestUrl;
});
// USEN推しリクステップの次へボタン押下時
addClickEvent(requestSongNextButtonElement, async () => {
  // デイリータスクへ進む
  await showDailyTaskStep();
});
// ==================================================
// クリックイベント設定 - デイリータスク
// ==================================================
// デイリータスクのページを開くボタン押下時
addClickEvent(openDailyTaskUrlButtonElement, async () => {
  // 現在表示中のデイリータスクを取得
  const item = getCurrentDailyTaskItem();
  // 現在のデイリータスクからURLを取得
  const itemUrl = getDailyTaskItemUrl(item);
  // タスクまたはURLがない場合はエラー表示して処理を止める
  if (!item || !itemUrl) {
    showError(dailyTaskErrorAreaElement, MESSAGES.errors.noUrl);
    return;
  }
  // 入力補助が必要なタスクの場合は、ページを開く前にコピー文を作成してクリップボードへ入れる
  if (item["input-flag"] === true) {
    const copyText = buildDailyTaskCopyText(item);
    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText);
        hideError(dailyTaskErrorAreaElement);
      } catch (error) {
        console.error(error);
        showError(dailyTaskErrorAreaElement, MESSAGES.errors.dailyCopyFailed);
        return;
      }
    }
  }
  // 現在のデイリータスクを完了済みとして記録する
  recordCompletedDailyItem(item);
  // ページを開いた後に進めるよう、次へボタンを表示
  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.remove("hidden");
  }
  // 開くボタンは押下済み表示、次へボタンを主ボタン表示にする
  setButtonStyle(openDailyTaskUrlButtonElement, "gray");
  setButtonStyle(dailyTaskNextButtonElement, "primary");
  // デイリータスクを開いた状態として保存する
  // アプリに戻ってきた時に次へボタン表示などを復元するため
  state.openedAction = OPENED_ACTIONS.dailyTask;
  saveFlowState(state.openedAction, dailyTaskStepElement);
  // デイリータスクのURLへ移動
  location.href = itemUrl;
});
// デイリータスクの次へボタン押下時
addClickEvent(dailyTaskNextButtonElement, () => {
  // 現在表示中のデイリータスクを取得
  const item = getCurrentDailyTaskItem();
  // URLがないタスクは「ページを開く」操作がないため、次へ押下時に完了記録する
  if (item && !getDailyTaskItemUrl(item)) {
    recordCompletedDailyItem(item);
  }
  // 次のデイリータスクへ進める
  state.currentDailyTaskIndex += 1;
  // 現在のデイリータスクグループを取得
  const currentGroup = getCurrentDailyGroup();
  // グループがない、または現在のグループ内のタスクが終わった場合は、グループ終了画面へ進む
  if (!currentGroup || state.currentDailyTaskIndex >= getDailyGroupItems(currentGroup).length) {
    showDailyGroupEndStep();
    return;
  }
  // 次のデイリータスクを画面に表示する
  renderCurrentDailyTask();
});
// デイリーグループ終了画面の「頑張る！」ボタン押下時
addClickEvent(continueDailyGroupButtonElement, () => {
  // 次のデイリータスクグループへ進める
  state.currentDailyGroupIndex += 1;
  // 次のグループの先頭タスクから開始する
  state.currentDailyTaskIndex = 0;
  // すべてのデイリータスクグループが終わった場合は、SNS共有確認へ進む
  if (state.currentDailyGroupIndex >= state.dailyGroups.length) {
    showPostAskStep();
    return;
  }
  // 次のデイリータスクグループを表示する
  // false指定で、デイリータスク全体の再読み込み・初期化はしない
  showDailyTaskStep(false);
});
// デイリーグループ終了画面の「今日はここまで」ボタン押下時
addClickEvent(stopDailyGroupButtonElement, () => {
  // SNS共有確認へ進む
  showPostAskStep();
});
// ==================================================
// クリックイベント設定 - SNSシェア
// ==================================================

// SNS共有確認画面の「共有する！」ボタン押下時
addClickEvent(makePostButtonElement, () => {
  // 投稿文編集画面へ進む
  showPostEditStep();
});

// SNS共有確認画面の「やめとく」ボタン押下時
addClickEvent(skipPostButtonElement, () => {
  // YouTube確認画面へ進む
  showYoutubeAskStep();
});

// X版プレビュータブ押下時
addClickEvent(postPreviewXTabButtonElement, () => {
  setPostPreviewPlatform("x");
});

// Threads版プレビュータブ押下時
addClickEvent(postPreviewThreadsTabButtonElement, () => {
  setPostPreviewPlatform("threads");
});

// X版投稿文をコピーするボタン押下時
addClickEvent(copyXPostTextButtonElement, async () => {
  // X投稿では必ずX版の投稿文を使う
  const postText = buildPostText("x");

  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, MESSAGES.errors.noCopyPostText);
    return;
  }

  try {
    // X版投稿文をクリップボードへコピー
    await navigator.clipboard.writeText(postText);

    // コピー成功後、ボタン文言を一時的に変更する
    if (copyXPostTextButtonElement) {
      copyXPostTextButtonElement.textContent = "コピーしました";
    }

    // コピー成功時はエラー表示を消す
    hideError(postErrorAreaElement);
  } catch (error) {
    // コピーに失敗した場合は、手動コピーを促す
    console.error(error);
    showError(postErrorAreaElement, MESSAGES.errors.copyFailed);
  }
});

// Xに投稿ボタン押下時
addClickEvent(openXPostButtonElement, () => {
  // X投稿では必ずX版の投稿文を使う
  const postText = buildPostText("x");

  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, MESSAGES.errors.noPostText);
    return;
  }
  sendSnsShareLog("x").catch((error) => {
    console.error("snsShareLog送信失敗", error);
  });
  // X投稿画面用URLを作成して移動
  const url = X_POST_URL + encodeURIComponent(postText);
  location.href = url;
});

// Threadsを開くボタン押下時
addClickEvent(openThreadsButtonElement, async () => {
  // Threads投稿では必ずThreads版の投稿文を使う
  const postText = buildPostText("threads");

  // 投稿文が空の場合はエラー表示して処理を止める
  if (!postText) {
    showError(postErrorAreaElement, MESSAGES.errors.noPostText);
    return;
  }
  try {
    // Threadsは投稿文をURLに渡せないため、先にクリップボードへコピーする
    await navigator.clipboard.writeText(postText);

    // コピー成功時はエラー表示を消す
    hideError(postErrorAreaElement);
    sendSnsShareLog("threads").catch((error) => {
      console.error("snsShareLog送信失敗", error);
    });
    // Threadsへ移動
    location.href = THREADS_URL;
  } catch (error) {
    // コピーに失敗した場合は、手動コピーを促す
    console.error(error);
    showError(postErrorAreaElement, MESSAGES.errors.copyFailed);
  }
});

// 投稿文編集画面の次へボタン押下時
addClickEvent(postNextButtonElement, () => {
  // YouTube確認画面へ進む
  showYoutubeAskStep();
});
// ==================================================
// クリックイベント設定 - SNSシェア画像出力
// ==================================================
function getShareImageBlob() {
  return new Promise((resolve) => {
    if (!shareImageCanvasElement) {
      resolve(null);
      return;
    }

    shareImageCanvasElement.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}
let currentShareImageTheme = getCurrentThemeKeyForShareImage();

function getCurrentThemeKeyForShareImage() {
  const savedTheme = localStorage.getItem("selectedTheme");

  const themeMap = {
    red: "red",
    purple: "purple",
    green: "green",
    sky: "blue",
    blue: "blue",
    lime: "lime",
    pink: "pink",
    yellow: "yellow",
    white: "white",
    normal: "normal",
  };

  return themeMap[savedTheme] || "normal";
}

function getShareImageDateText() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

function getShareImageRequestText() {
  if (!state.selectedRequestSong) {
    return "";
  }

  const name = state.selectedRequestSong.name || "";

  return name ? `USEN：${name}` : "";
}

function getShareImageBgmText() {
  if (!state.selectedSong) {
    return "";
  }

  const name = state.selectedSong.name || "";

  return name ? `BGM：${name}` : "";
}

function getShareImageTaskName(item) {
  if (!item) {
    return "";
  }

  return (
    item["short-name"] ||
    item.shortName ||
    item.name ||
    ""
  );
}

function getShareImageTaskItems() {
  const items = [];

  state.selectedOnceTasks.forEach((task) => {
    const name = getShareImageTaskName(task);

    if (name) {
      items.push(name);
    }
  });

  state.completedDailyItems.forEach((item) => {
    const name = getShareImageTaskName(item);

    if (name) {
      items.push(name);
    }
  });

  return items;
}

function getCheckedPostItemsForShareImage() {
  const items = [];

  if (!Array.isArray(state.postItems)) {
    return items;
  }

  state.postItems.forEach((item) => {
    if (!item || item.checked !== true) {
      return;
    }

    // SNSシェアだけ画像には入れない
    if (item.id === "app-share") {
      return;
    }

    const name =
      item.imageText ||
      item["short-name"] ||
      item.shortName ||
      item.postText ||
      item.name ||
      "";

    if (name) {
      items.push(name);
    }
  });

  return items;
}

function renderShareImage(themeKey = currentShareImageTheme) {
  if (!shareImageCanvasElement) {
    return;
  }

  const items = getCheckedPostItemsForShareImage();

  if (items.length === 0 && !state.selectedRequestSong && !state.selectedSong) {
    showError(postErrorAreaElement, "画像にする内容がありません。");
    return;
  }

  currentShareImageTheme = themeKey;

  drawShareImage(shareImageCanvasElement, {
    themeKey: currentShareImageTheme,
    dateText: getShareImageDateText(),
    appName: "タムごとDaily",
    title: "タスク完了！",
    requestText: getShareImageRequestText(),
    bgmText: getShareImageBgmText(),
    items,
  });

  hideError(postErrorAreaElement);
}

addClickEvent(openShareImageModalButtonElement, () => {
  if (!shareImageModalElement) {
    return;
  }

  shareImageModalElement.classList.remove("hidden");
  renderShareImage();
});

addClickEvent(closeShareImageModalButtonElement, () => {
  if (!shareImageModalElement) {
    return;
  }

  shareImageModalElement.classList.add("hidden");
});

if (shareImageModalElement) {
  shareImageModalElement.addEventListener("click", (event) => {
    if (event.target === shareImageModalElement) {
      shareImageModalElement.classList.add("hidden");
    }
  });
}

shareImageThemeButtonElements.forEach((button) => {
  button.addEventListener("click", () => {
    const themeKey = button.dataset.shareImageTheme || getCurrentThemeKeyForShareImage();
    renderShareImage(themeKey);
  });
});

addClickEvent(downloadShareImageButtonElement, async () => {
  renderShareImage(currentShareImageTheme);

  const blob = await getShareImageBlob();

  if (!blob) {
    showError(postErrorAreaElement, "画像の作成に失敗しました。");
    return;
  }

  const file = new File([blob], "tamugoto-daily-share.png", {
    type: "image/png",
  });

  try {
    // PWA / スマホ向け：共有シートを優先
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "タムごとDaily",
        text: "今日の推し活ログ",
      });

      hideError(postErrorAreaElement);
      return;
    }

    // 共有シート非対応環境：通常ダウンロード
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tamugoto-daily-share.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    hideError(postErrorAreaElement);
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error(error);
    showError(postErrorAreaElement, "画像の保存に失敗しました。");
  }
});
// ==================================================
// クリックイベント設定 - YouTube再生
// ==================================================
// YouTube確認画面の「見る！」ボタン押下時
addClickEvent(watchYoutubeButtonElement, async () => {
  // YouTube選択画面へ進む
  await showYoutubeSelectStep();
});
// YouTube確認画面の「今日はここまで」ボタン押下時
addClickEvent(finishWithoutYoutubeButtonElement, () => {
  // 完了画面へ進む
  showPlaceholderNextStep(MESSAGES.finish);
});
// YouTube選択画面の「今日はここまで」ボタン押下時
addClickEvent(finishFromYoutubeButtonElement, () => {
  // 完了画面へ進む
  showPlaceholderNextStep(MESSAGES.finish);
});
// ==================================================
// クリックイベント設定 - 完了画面
// ==================================================
// 完了画面の「ホームに戻る」ボタン押下時
addClickEvent(backHomeButtonElement, () => {
  // 戻る履歴をリセットする
  state.stepHistory = [];
  // 送信済みflagリセット
  state.isSheetLogSentInCurrentFlow = false;
  // 保存済みの途中再開データを削除する
  clearFlowState();
  // 履歴を追加せずにホーム画面へ戻る
  showOnlyStep(homeStepElement, { recordHistory: false });
});
// ==================================================
// 関数
// ==================================================
// ホーム画面の初回設定カード表示を更新する関数
function updateHomeInstallGuideVisibility() {
  // 初回設定カードがHTMLに存在しない場合は何もしない
  if (!homeInstallGuideCardElement) {
    return;
  }
  // PWAとしてホーム画面から起動されているか判定する
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  // PWA起動済みの場合は初回設定カードを非表示にする
  homeInstallGuideCardElement.classList.toggle("hidden", isStandalone);
}
//初期表示関数
async function init() {
  try {
    updateHomeInstallGuideVisibility();

    const songs = await loadSpotifySongs();
    const recommendedSongs = songs.filter((song) => song.flag === true);
    const otherSongs = songs.filter((song) => song.flag !== true);

    renderSpotifySongList(recommendedSongsElement, recommendedSongs);
    renderSpotifySongList(otherSongsElement, otherSongs);

    if (recommendedSongs.length === 0 && recommendedSongsElement) {
      recommendedSongsElement.innerHTML = `<p>${MESSAGES.empty.recommendedSongs}</p>`;
    }

    if (otherSongs.length === 0 && otherSongsElement) {
      otherSongsElement.innerHTML = `<p>${MESSAGES.empty.otherSongs}</p>`;
    }

    updateOtherSongsAccordion();

    state.onceTasks = await loadOnceTasks();
    cleanupOnceTaskDoneMap(state.onceTasks);
    renderHomeOnceTaskList(state.onceTasks);

    const homeInfoList = await loadHomeInfoList();
    renderHomeInfoList(homeInfoList);

    if (typeof loadRequestRanking === "function") {
      await loadRequestRanking();
    }

    await restoreFlowStateOrHome();
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, MESSAGES.errors.initialLoadFailed);
    renderHomeOnceTaskList([]);
    renderHomeInfoList([]);
    state.currentStepElement = homeStepElement;
    updateStepTopActionBar();
  }
}
async function ensureDailyDataLoaded() {
  if (!state.requestTexts || Object.keys(state.requestTexts).length === 0) {
    state.requestTexts = await loadRequestTexts();
  }

  if (!Array.isArray(state.dailyGroups) || state.dailyGroups.length === 0) {
    state.dailyGroups = await loadDailyGroups();
  }
}

async function restoreFlowStateOrHome() {
  const flowState = loadFlowState();
  if (!flowState || !flowState.currentStepId) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  state.selectedSong = flowState.selectedSong || null;
  state.selectedOnceTasks = Array.isArray(flowState.selectedOnceTasks)
    ? flowState.selectedOnceTasks
    : [];
  state.currentOnceTaskIndex = Number(flowState.currentOnceTaskIndex) || 0;
  state.selectedRequestSong = flowState.selectedRequestSong || null;
  state.currentDailyGroupIndex = Number(flowState.currentDailyGroupIndex) || 0;
  state.currentDailyTaskIndex = Number(flowState.currentDailyTaskIndex) || 0;
  state.completedDailyItems = Array.isArray(flowState.completedDailyItems)
    ? flowState.completedDailyItems
    : [];
  state.openedAction = flowState.openedAction || "";

  if (flowState.currentStepId === "spotifyStep") {
    showOnlyStep(spotifyStepElement, { recordHistory: false });

    if (state.selectedSong) {
      selectSong(state.selectedSong);
    }

    if (state.openedAction === OPENED_ACTIONS.spotify) {
      spotifyNextButtonElement.classList.remove("hidden");
      setButtonStyle(openSpotifyButtonElement, "gray");
      setButtonStyle(spotifyNextButtonElement, "primary");
    }

    return;
  }

  if (flowState.currentStepId === "onceListSelectStep") {
    await showOnceListSelectStep();
    return;
  }

  if (flowState.currentStepId === "onceTaskRunStep") {
    showOnlyStep(onceTaskRunStepElement, { recordHistory: false });
    renderCurrentOnceTask();

    if (state.openedAction === OPENED_ACTIONS.onceTask) {
      onceTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openOnceTaskUrlButtonElement, "gray");
      setButtonStyle(onceTaskNextButtonElement, "primary");
    }

    return;
  }

  if (flowState.currentStepId === "requestSongStep") {
    const restoredRequestSong = state.selectedRequestSong;

    await showRequestSongStep();

    if (restoredRequestSong) {
      selectRequestSong(restoredRequestSong);
    }

    if (state.openedAction === OPENED_ACTIONS.requestSong) {
      requestSongNextButtonElement.classList.remove("hidden");
      setButtonStyle(openRequestSongButtonElement, "gray");
      setButtonStyle(requestSongNextButtonElement, "primary");
      setSongListVisibility(recommendedRequestSongsElement, false);
      setSongListVisibility(otherRequestSongsWrapperElement, false);
      setSongListVisibility(toggleOtherRequestSongsButtonElement, false);
    }

    return;
  }

  if (flowState.currentStepId === "dailyTaskStep") {
    await ensureDailyDataLoaded();

    showOnlyStep(dailyTaskStepElement, { recordHistory: false });
    renderCurrentDailyTask();

    if (state.openedAction === OPENED_ACTIONS.dailyTask) {
      dailyTaskNextButtonElement.classList.remove("hidden");
      setButtonStyle(openDailyTaskUrlButtonElement, "gray");
      setButtonStyle(dailyTaskNextButtonElement, "primary");
    }

    return;
  }

  const stepElement = document.getElementById(flowState.currentStepId);

  if (stepElement) {
    showOnlyStep(stepElement, { recordHistory: false });
    return;
  }

  clearFlowState();
  showOnlyStep(homeStepElement, { recordHistory: false });
}



function renderYoutubeCardRow(container, items, type) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `<p class="empty-text">${MESSAGES.empty.youtubeItems}</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "youtube-card";

    const thumbnailUrl = getYoutubeThumbnailUrl(item);

    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "youtube-thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = item.name;
      thumbnail.loading = "lazy";
      card.appendChild(thumbnail);
    } else {
      const textCard = document.createElement("div");
      textCard.className = "youtube-text-card";
      textCard.textContent = type === "playlist" ? "再生リスト" : "MV";
      card.appendChild(textCard);
    }

    const name = document.createElement("p");
    name.className = "youtube-card-name";
    name.textContent = item.name;
    card.appendChild(name);

card.addEventListener("click", () => {
  sendYoutubeLog({
    itemId: item.id || item.itemId || createYoutubeLogItemId(item),
    title: item.name || item.title || "",
    url: item.url || ""
  }).catch((error) => {
    console.error("youtubeLog送信失敗", error);
  });

  showPlaceholderNextStep(MESSAGES.finish);

  setTimeout(() => {
    location.href = item.url;
  }, 100);
});

    container.appendChild(card);
  });
}


function getCheckedOnceTasks() {
  if (!onceTaskListElement) {
    return [];
  }

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
  showOnlyStep(onceTaskRunStepElement);
  renderCurrentOnceTask();
}

function renderCurrentOnceTask() {
  const task = state.selectedOnceTasks[state.currentOnceTaskIndex];
  const currentNumber = state.currentOnceTaskIndex + 1;
  const totalNumber = state.selectedOnceTasks.length;

  hideError(onceTaskRunErrorAreaElement);

  if (!task) {
    showRequestSongStep();
    return;
  }

  if (onceTaskProgressElement) {
    onceTaskProgressElement.textContent = `${currentNumber} / ${totalNumber}`;
  }

  if (onceTaskNameElement) {
    onceTaskNameElement.textContent = task.name;
  }

  if (onceTaskMessageAreaElement) {
    onceTaskMessageAreaElement.textContent = buildOnceTaskMessage(task);
  }

  if (task.url) {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openOnceTaskUrlButtonElement) {
      openOnceTaskUrlButtonElement.classList.add("hidden");
    }
  }

  // 期間限定タスクは、ページを開かなくても次へ進めるようにする
  if (onceTaskNextButtonElement) {
    onceTaskNextButtonElement.classList.remove("hidden");
  }
  setButtonStyle(openOnceTaskUrlButtonElement, "primary");
  setButtonStyle(onceTaskNextButtonElement, "secondary");
}

function buildOnceTaskMessage(task) {
  const messages = [];

  if (task["move-flag"] === true) {
    if (task["alert-message"]) {
      messages.push(task["alert-message"]);
    }

    if (messages.length === 0) {
      messages.push("ページを開いてタスクを完了してください。");
    }

    return messages.join("\n\n");
  }

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

async function showRequestSongStep() {
  try {
    state.selectedRequestSong = null;
    
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
    if (state.requestSongs.length === 0) {
      state.requestSongs = await loadRequestSongs();
    }

    const recommendedRequestSongs = state.requestSongs.filter((song) => song.flag === true);
    const otherRequestSongs = state.requestSongs.filter((song) => song.flag !== true);

    renderRequestSongList(recommendedRequestSongsElement, recommendedRequestSongs);
    renderRequestSongList(otherRequestSongsElement, otherRequestSongs);

    if (recommendedRequestSongs.length === 0 && recommendedRequestSongsElement) {
      recommendedRequestSongsElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.recommendedSongs}</p>`;
    }

    if (otherRequestSongs.length === 0 && otherRequestSongsElement) {
      otherRequestSongsElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.otherSongs}</p>`;
    }

    updateOtherRequestSongsAccordion();

    showOnlyStep(requestSongStepElement);

    hideError(requestSongErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(onceTaskRunErrorAreaElement, "リクエスト曲リストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

async function showDailyTaskStep(shouldInitialize = true) {
  try {
    if (shouldInitialize) {
      state.requestTexts = await loadRequestTexts();
      state.dailyGroups = await loadDailyGroups();
      state.currentDailyGroupIndex = 0;
      state.currentDailyTaskIndex = 0;
      state.completedDailyItems = [];
    }

    if (state.dailyGroups.length === 0) {
      showPostAskStep();
      return;
    }

    showOnlyStep(dailyTaskStepElement);
    renderCurrentDailyTask();
  } catch (error) {
    console.error(error);
    showError(requestSongErrorAreaElement, "リクエストループの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function renderCurrentDailyTask() {
  const group = getCurrentDailyGroup();
  const item = getCurrentDailyTaskItem();

  hideError(dailyTaskErrorAreaElement);

  if (dailyTaskNextButtonElement) {
    dailyTaskNextButtonElement.classList.add("hidden");
  }

  if (!group || !item) {
    showPostAskStep();
    return;
  }

  const items = getDailyGroupItems(group);
  const itemName = getDailyTaskItemName(item);
  const itemUrl = getDailyTaskItemUrl(item);

  if (dailyTaskHeaderDescriptionElement) {
    dailyTaskHeaderDescriptionElement.textContent = buildDailyTaskHeaderDescription();
  }

  if (dailyTaskGroupNameElement) {
    dailyTaskGroupNameElement.textContent = group.listName;
  }

  if (dailyTaskProgressElement) {
    dailyTaskProgressElement.textContent = `${state.currentDailyTaskIndex + 1} / ${items.length}`;
  }

  if (dailyTaskNameElement) {
    dailyTaskNameElement.textContent = itemName;
  }

  if (dailyTaskCommentAreaElement) {
    dailyTaskCommentAreaElement.textContent = item.comment || "ページを開いてタスクを完了してください。";
  }

  if (itemUrl) {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.remove("hidden");
    }
  } else {
    if (openDailyTaskUrlButtonElement) {
      openDailyTaskUrlButtonElement.classList.add("hidden");
    }

    if (dailyTaskNextButtonElement) {
      dailyTaskNextButtonElement.classList.remove("hidden");
    }
  }
  setButtonStyle(openDailyTaskUrlButtonElement, "primary");
  setButtonStyle(dailyTaskNextButtonElement, "secondary");
}

function buildDailyTaskCopyText(item) {
  const requestType = item["request-type"];
  const template = state.requestTexts[requestType];

  if (!requestType || !template) {
    return "";
  }

  const musicName = getSelectedRequestSongName();

  return template.replaceAll("musicname", musicName);
}

function buildDailyTaskHeaderDescription() {
  const selectedRequestSongName = getSelectedRequestSongName();

  if (!selectedRequestSongName) {
    return "";
  }

  return `今日のリクエスト曲: ${selectedRequestSongName}\n`;
}

function showDailyGroupEndStep() {
  const group = getCurrentDailyGroup();

  if (!group) {
    showPostAskStep();
    return;
  }

  if (state.currentDailyGroupIndex >= state.dailyGroups.length - 1) {
    showPostAskStep();
    return;
  }

  if (endedGroupNameElement) {
    endedGroupNameElement.textContent = `「${group.listName}」はここまで！`;
  }

  showOnlyStep(dailyGroupEndStepElement);
}

function recordCompletedDailyItem(item) {
  if (!item) {
    return;
  }

  const name = getDailyTaskItemName(item);
  const url = getDailyTaskItemUrl(item);

  if (!name) {
    return;
  }

  const key = `${name}_${url}`;
  const exists = state.completedDailyItems.some((completedItem) => completedItem.key === key);

  if (exists) {
    return;
  }

state.completedDailyItems.push({
  key,
  itemId: item.id,
  name,
  shortName: item["short-name"] || item.shortName || "",
  url,
});
}

function showPostAskStep() {
  state.isFlowStateSaveDisabled = true;
  clearFlowState();
  
  sendSheetLogOnPostAskStep();
  showOnlyStep(postAskStepElement, { saveFlow: false });
}

function sendSheetLogOnPostAskStep() {
  if (state.isSheetLogSentInCurrentFlow) {
    return;
  }

  sendDailyTaskLog(state.completedDailyItems).catch((error) => {
    console.error("dailyTaskLog送信失敗", error);
  });

  state.isSheetLogSentInCurrentFlow = true;
}

function showPostEditStep() {
  state.postItems = buildPostItems();
  renderPostItemList(state.postItems);
  setPostPreviewPlatform("x");
  showOnlyStep(postEditStepElement);
}
async function showYoutubeAskStep() {
  showOnlyStep(youtubeAskStepElement);
}

async function showYoutubeSelectStep() {
  try {
    if (state.youtubePlaylists.length === 0) {
      state.youtubePlaylists = await loadYoutubePlaylists();
    }

    if (state.youtubeMvs.length === 0) {
      state.youtubeMvs = await loadYoutubeMvs();
    }

    renderYoutubeCardRow(youtubePlaylistRowElement, state.youtubePlaylists, "playlist");
    renderYoutubeCardRow(youtubeMvRowElement, state.youtubeMvs, "mv");

    showOnlyStep(youtubeSelectStepElement);
    hideError(youtubeErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(youtubeErrorAreaElement, "YouTubeリストの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}

function getCurrentDailyGroup() {
  return state.dailyGroups[state.currentDailyGroupIndex];
}

function getCurrentDailyTaskItem() {
  const group = getCurrentDailyGroup();

  if (!group) {
    return null;
  }

  return getDailyGroupItems(group)[state.currentDailyTaskIndex];
}

function getDailyGroupItems(group) {
  if (!group || !Array.isArray(group.items)) {
    return [];
  }

  return group.items;
}

function getDailyTaskItemName(item) {
  if (!item) {
    return "名称未設定";
  }

  return item.name || item.title || item.listName || "名称未設定";
}

function getDailyTaskItemUrl(item) {
  if (!item) {
    return "";
  }

  return item.url || "";
}

function showPlaceholderNextStep(message) {
  if (placeholderMessageElement) {
    placeholderMessageElement.textContent = message;
  }

  showOnlyStep(placeholderNextStepElement);
}

function showOnlyStep(activeStepElement, options = {}) {
  if (!activeStepElement) {
    console.error("表示対象の画面が見つかりません。");
    return;
  }

  const shouldRecordHistory = options.recordHistory !== false;

  if (
    shouldRecordHistory &&
    state.currentStepElement &&
    state.currentStepElement !== activeStepElement
  ) {
    state.stepHistory.push(state.currentStepElement);
  }

  const steps = [
    homeStepElement,
    spotifyStepElement,
    onceListSelectStepElement,
    onceTaskRunStepElement,
    requestSongStepElement,
    dailyTaskStepElement,
    dailyGroupEndStepElement,
    postAskStepElement,
    postEditStepElement,
    youtubeAskStepElement,
    youtubeSelectStepElement,
    placeholderNextStepElement,
  ].filter(Boolean);

  steps.forEach((stepElement) => {
    stepElement.classList.toggle("hidden", stepElement !== activeStepElement);
  });

  state.currentStepElement = activeStepElement;
  updateStepTopActionBar();

  if (options.saveFlow !== false) {
    saveFlowState();
  }
}
function goBackStep() {
  if (state.currentStepElement === dailyTaskStepElement) {
    goBackDailyTask();
    return;
  }

  if (state.currentStepElement === dailyGroupEndStepElement) {
    goBackFromDailyGroupEnd();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackDailyTask() {
  if (state.currentDailyTaskIndex > 0) {
    state.currentDailyTaskIndex -= 1;
    renderCurrentDailyTask();
    return;
  }

  if (state.currentDailyGroupIndex > 0) {
    state.currentDailyGroupIndex -= 1;

    const previousGroup = getCurrentDailyGroup();
    const previousGroupItems = getDailyGroupItems(previousGroup);

    state.currentDailyTaskIndex = Math.max(previousGroupItems.length - 1, 0);
    renderCurrentDailyTask();
    return;
  }

  const previousStepElement = state.stepHistory.pop();

  if (!previousStepElement) {
    showOnlyStep(requestSongStepElement, { recordHistory: false });
    return;
  }

  showOnlyStep(previousStepElement, { recordHistory: false });
}

function goBackFromDailyGroupEnd() {
  const currentGroup = getCurrentDailyGroup();
  const currentGroupItems = getDailyGroupItems(currentGroup);

  state.currentDailyTaskIndex = Math.max(currentGroupItems.length - 1, 0);
  showOnlyStep(dailyTaskStepElement, { recordHistory: false });
  renderCurrentDailyTask();
}

function updateStepTopActionBar() {
  if (!stepTopActionBarElement) {
    return;
  }

  const shouldShowTopActionBar =
    state.currentStepElement &&
    state.currentStepElement !== homeStepElement;

  stepTopActionBarElement.classList.toggle("hidden", !shouldShowTopActionBar);
}

async function shareAppFromHome() {
  const shareData = {
    title: "タムごとDaily",
    text: "推し活便利ツール「タムごとDaily」",
    url: "https://seachicken-sz.github.io/secondzDailyRoutine/app/",
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    alert("共有が使えない環境のため、URLをコピーしました。");
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error(error);
    alert("共有に失敗しました。");
  }
}
