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
// クリックイベント設定 - HOME、共通
// ==================================================
// 戻るボタン押下時
addClickEvent(backStepButtonElement, () => {
  goBackStep();
});

// モーダル系イベント登録
bindModalEvents();

// ホーム画面イベント登録
bindHomeEvents();

// Spotify画面イベント登録
bindSpotifyEvents();

// 期間限定タスク画面イベント登録
bindOnceTaskEvents();

// USEN推しリク画面イベント登録
bindRequestSongEvents();
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
  if (!state.selectedSong || !state.selectedSong.url) {
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

    // SNSシェア、USEN推しリク、BGMは画像のチェック項目には入れない
    if (
      item.id === "app-share" ||
      item.id === "usen-request" ||
      item.id === "spotify-bgm"
    ) {
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

function renderYoutubeCardRow(container, items, type, options = {}) {
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
      textCard.textContent = getYoutubeFallbackLabel(type);
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
        url: item.url || "",
      }).catch((error) => {
        console.error("youtubeLog送信失敗", error);
      });

      if (options.closeModalElement) {
        options.closeModalElement.classList.add("hidden");
      }

      if (options.finishAfterClick !== false) {
        showPlaceholderNextStep(MESSAGES.finish);
      }

      setTimeout(() => {
        location.href = item.url;
      }, 100);
    });

    container.appendChild(card);
  });
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
    showError(requestSongErrorAreaElement, "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:list");
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
// Youtube読み込み共通関数
async function ensureYoutubeDataLoaded() {
  if (!Array.isArray(state.youtubePlaylists) || state.youtubePlaylists.length === 0) {
    state.youtubePlaylists = await loadYoutubePlaylists();
  }

  if (!Array.isArray(state.youtubeMvs) || state.youtubeMvs.length === 0) {
    state.youtubeMvs = await loadYoutubeMvs();
  }

  if (!Array.isArray(state.youtubeOthers) || state.youtubeOthers.length === 0) {
    state.youtubeOthers = await loadYoutubeOthers();
  }
}
// YouTubeモーダルを開く共通処理
async function openYoutubeModal() {
  if (!youtubeModalElement) {
    return;
  }

  youtubeModalElement.classList.remove("hidden");
  await renderYoutubeModalContent();
}
window.openYoutubeModal = openYoutubeModal;
// Youtubeモーダル描画
async function renderYoutubeModalContent() {
  try {
    await ensureYoutubeDataLoaded();

    const modalOptions = {
      finishAfterClick: false,
      closeModalElement: youtubeModalElement,
    };

    renderYoutubeCardRow(
      youtubeModalPlaylistRowElement,
      state.youtubePlaylists,
      "playlist",
      modalOptions
    );

    renderYoutubeCardRow(
      youtubeModalMvRowElement,
      state.youtubeMvs,
      "mv",
      modalOptions
    );

    renderYoutubeCardRow(
      youtubeModalOtherRowElement,
      state.youtubeOthers,
      "other",
      modalOptions
    );

    hideError(youtubeModalErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(
      youtubeModalErrorAreaElement,
      "YouTubeリストの読み込みに失敗しました。"
    );
  }
}
// タスクの流れで開くYoutubeページ描画
async function showYoutubeSelectStep() {
  try {
    await ensureYoutubeDataLoaded();

    renderYoutubeCardRow(
      youtubePlaylistRowElement,
      state.youtubePlaylists,
      "playlist"
    );

    renderYoutubeCardRow(
      youtubeMvRowElement,
      state.youtubeMvs,
      "mv"
    );

    renderYoutubeCardRow(
      youtubeOtherRowElement,
      state.youtubeOthers,
      "other"
    );

    showOnlyStep(youtubeSelectStepElement);
    hideError(youtubeErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(
      youtubeErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:youtube"
    );
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

function getYoutubeFallbackLabel(type) {
  if (type === "playlist") {
    return "再生リスト";
  }

  if (type === "other") {
    return "その他";
  }

  return "MV";
}
