// ==================================================
// youtube.js
// YouTube確認画面・YouTube選択画面・YouTubeモーダルを管理するファイル
// ==================================================

// ==================================================
// YouTube画面イベント登録
// ==================================================
// app.js から呼び出して、YouTube確認画面・選択画面のクリックイベントをまとめて登録する
function bindYoutubeEvents() {
  // ==================================================
  // YouTube確認画面：「見る！」ボタン
  // ==================================================

  // YouTube確認画面の「見る！」ボタン押下時
  addClickEvent(watchYoutubeButtonElement, async () => {
    // YouTube選択画面へ進む
    await showYoutubeSelectStep();
  });

  // ==================================================
  // YouTube確認画面：「今日はここまで」ボタン
  // ==================================================

  // YouTube確認画面の「今日はここまで」ボタン押下時
  addClickEvent(finishWithoutYoutubeButtonElement, () => {
    // 完了画面へ進む
    showPlaceholderNextStep(MESSAGES.finish);
  });

  // ==================================================
  // YouTube選択画面：「今日はここまで」ボタン
  // ==================================================

  // YouTube選択画面の「今日はここまで」ボタン押下時
  addClickEvent(finishFromYoutubeButtonElement, () => {
    // 完了画面へ進む
    showPlaceholderNextStep(MESSAGES.finish);
  });
}

// ==================================================
// YouTubeカード行描画
// ==================================================
// 指定されたコンテナに、YouTube項目のカード一覧を描画する
// playlist / mv / other の各行で共通利用する
function renderYoutubeCardRow(container, items, type, options = {}) {
  // 表示先コンテナがない場合は何もしない
  if (!container) {
    return;
  }

  // 既存の表示をクリア
  container.innerHTML = "";

  // 表示対象が0件の場合は空表示を出す
  if (items.length === 0) {
    container.innerHTML = `<p class="empty-text">${MESSAGES.empty.youtubeItems}</p>`;
    return;
  }

  // YouTube項目を1件ずつカード化する
  items.forEach((item) => {
    // カード全体をbuttonとして作成
    const card = document.createElement("button");
    card.type = "button";
    card.className = "youtube-card";

    // サムネイルURLを取得
    const thumbnailUrl = getYoutubeThumbnailUrl(item);

    // サムネイルが取得できる場合
    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "youtube-thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = item.name;
      thumbnail.loading = "lazy";
      card.appendChild(thumbnail);
    } else {
      // サムネイルがない場合は種別ラベルのテキストカードにする
      const textCard = document.createElement("div");
      textCard.className = "youtube-text-card";
      textCard.textContent = getYoutubeFallbackLabel(type);
      card.appendChild(textCard);
    }

    // カード下部に表示する名前
    const name = document.createElement("p");
    name.className = "youtube-card-name";
    name.textContent = item.name;
    card.appendChild(name);

    // カードクリック時：ログ送信 → 必要なら完了画面表示 → YouTubeへ遷移
    card.addEventListener("click", () => {
      // YouTubeクリックログを送信する
      // ログ送信に失敗しても遷移は止めない
      sendYoutubeLog({
        itemId: item.id || item.itemId || createYoutubeLogItemId(item),
        title: item.name || item.title || "",
        url: item.url || "",
      }).catch((error) => {
        console.error("youtubeLog送信失敗", error);
      });

      // モーダル内カードから開いた場合は、指定されたモーダルを閉じる
      if (options.closeModalElement) {
        options.closeModalElement.classList.add("hidden");
      }

      // 通常フローでは、YouTubeを開く前に完了画面へ進める
      // モーダル内カードでは finishAfterClick: false を指定して完了画面にしない
      if (options.finishAfterClick !== false) {
        showPlaceholderNextStep(MESSAGES.finish);
      }

      // 完了画面描画やログ処理を阻害しないよう、少し遅らせて外部遷移する
      setTimeout(() => {
        location.href = item.url;
      }, 100);
    });

    // コンテナにカードを追加
    container.appendChild(card);
  });
}

// ==================================================
// YouTube確認画面表示
// ==================================================
// SNS共有後、またはSNS共有スキップ後に呼ばれる
async function showYoutubeAskStep() {
  // YouTubeを見るか確認する画面を表示
  showOnlyStep(youtubeAskStepElement);
}

// ==================================================
// YouTubeデータ読み込み
// ==================================================
// YouTubeプレイリスト / MV / その他のJSONを、未読み込みの場合だけ読み込む
async function ensureYoutubeDataLoaded() {
  // プレイリスト一覧が未読み込みなら読み込む
  if (!Array.isArray(state.youtubePlaylists) || state.youtubePlaylists.length === 0) {
    state.youtubePlaylists = await loadYoutubePlaylists();
  }

  // MV一覧が未読み込みなら読み込む
  if (!Array.isArray(state.youtubeMvs) || state.youtubeMvs.length === 0) {
    state.youtubeMvs = await loadYoutubeMvs();
  }

  // その他YouTube項目が未読み込みなら読み込む
  if (!Array.isArray(state.youtubeOthers) || state.youtubeOthers.length === 0) {
    state.youtubeOthers = await loadYoutubeOthers();
  }
}

// ==================================================
// YouTubeモーダル表示
// ==================================================
// ホームや使い方など、通常フロー外からYouTube一覧を開くための共通処理
async function openYoutubeModal() {
  // モーダル要素がない場合は何もしない
  if (!youtubeModalElement) {
    return;
  }

  // YouTubeモーダルを表示
  youtubeModalElement.classList.remove("hidden");

  // モーダル内のYouTubeカードを描画
  await renderYoutubeModalContent();
}

// HTML側の onclick などから呼べるように window に公開する
window.openYoutubeModal = openYoutubeModal;

// ==================================================
// YouTubeモーダル内容描画
// ==================================================
// モーダル内にプレイリスト / MV / その他のカード行を描画する
async function renderYoutubeModalContent() {
  try {
    // YouTube関連データを読み込む
    await ensureYoutubeDataLoaded();

    // モーダル内カード用オプション
    // モーダルから開く場合は、クリック後に完了画面へ進まない
    const modalOptions = {
      finishAfterClick: false,
      closeModalElement: youtubeModalElement,
    };

    // モーダル内：プレイリスト行を描画
    renderYoutubeCardRow(
      youtubeModalPlaylistRowElement,
      state.youtubePlaylists,
      "playlist",
      modalOptions
    );

    // モーダル内：MV行を描画
    renderYoutubeCardRow(
      youtubeModalMvRowElement,
      state.youtubeMvs,
      "mv",
      modalOptions
    );

    // モーダル内：その他行を描画
    renderYoutubeCardRow(
      youtubeModalOtherRowElement,
      state.youtubeOthers,
      "other",
      modalOptions
    );

    // 読み込み成功時はエラー表示を消す
    hideError(youtubeModalErrorAreaElement);
  } catch (error) {
    // YouTubeリスト読み込みに失敗した場合
    console.error(error);
    showError(
      youtubeModalErrorAreaElement,
      "YouTubeリストの読み込みに失敗しました。"
    );
  }
}

// ==================================================
// YouTube選択画面表示
// ==================================================
// 通常のタスク完了フロー内で、YouTubeを選ぶ画面を表示する
async function showYoutubeSelectStep() {
  try {
    // YouTube関連データを読み込む
    await ensureYoutubeDataLoaded();

    // 選択画面：プレイリスト行を描画
    renderYoutubeCardRow(
      youtubePlaylistRowElement,
      state.youtubePlaylists,
      "playlist"
    );

    // 選択画面：MV行を描画
    renderYoutubeCardRow(
      youtubeMvRowElement,
      state.youtubeMvs,
      "mv"
    );

    // 選択画面：その他行を描画
    renderYoutubeCardRow(
      youtubeOtherRowElement,
      state.youtubeOthers,
      "other"
    );

    // YouTube選択画面を表示
    showOnlyStep(youtubeSelectStepElement);

    // 読み込み成功時はエラー表示を消す
    hideError(youtubeErrorAreaElement);
  } catch (error) {
    // YouTubeリスト読み込みに失敗した場合
    console.error(error);
    showError(
      youtubeErrorAreaElement,
      "※エラーが発生しました。アプリを立ち上げ直してください。ERROR:youtube"
    );
  }
}

// ==================================================
// YouTube種別フォールバック表示名
// ==================================================
// サムネイルがない場合に表示する種別名を返す
function getYoutubeFallbackLabel(type) {
  // プレイリスト
  if (type === "playlist") {
    return "再生リスト";
  }

  // その他
  if (type === "other") {
    return "その他";
  }

  // デフォルトはMV
  return "MV";
}
