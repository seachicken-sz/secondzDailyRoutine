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
// デイリータスク画面イベント登録
bindDailyTaskEvents();
// SNS共有画面イベント登録
bindPostEvents();
// SNS共有画像イベント登録
bindShareImageEvents();

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



function getYoutubeFallbackLabel(type) {
  if (type === "playlist") {
    return "再生リスト";
  }

  if (type === "other") {
    return "その他";
  }

  return "MV";
}
