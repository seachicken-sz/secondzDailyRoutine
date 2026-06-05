// ==================================================
// 投稿文生成・投稿項目
// SNS共有用の投稿項目リスト、投稿文、プレビュー表示を管理する
// ==================================================

// 現在プレビュー中の投稿先
// "x" または "threads"
let currentPostPreviewPlatform = "x";

// ==================================================
// 投稿項目作成
// ==================================================
// SNS投稿文に入れる候補項目を作成する
// ここで作った items を、投稿文編集画面のチェックリストに表示する
function buildPostItems() {
  const items = [];

  // このツール自体のシェア項目
  // デフォルトでチェックONにしておく
  items.push({
    id: "app-share",
    name: "このツールをSNSにシェア",
    postText: "",
    url: getAppShareUrl(),
    checked: true,
  });

  // USEN推しリク項目
  // 選択したリクエスト曲のURLを付ける
  items.push({
    id: "usen-request",
    name: "USEN推しリク",
    postText: "USEN推しリク",
    url: getSelectedRequestSongUrl(),
    checked: false,
  });

  // 選択済みの期間限定タスクを投稿項目に追加する
  state.selectedOnceTasks.forEach((task, index) => {
    if (!task || !task.name) {
      return;
    }

    items.push({
      id: `once-${index}`,
    
      // チェック項目には正式名称を表示する
      name: task.name,
    
      // 投稿本文・画像では短い名称を優先する
      postText: task["short-name"] || task.shortName || task.name,
      imageText: task["short-name"] || task.shortName || task.name,
    
      url: task.url || "",
      checked: false,
    });
  });

  // 完了済みのデイリータスクを投稿項目に追加する
  state.completedDailyItems.forEach((item, index) => {
    if (!item || !item.name) {
      return;
    }

    items.push({
      id: `daily-${index}`,
    
      // チェック項目には正式名称を表示する
      name: item.name,
    
      // 投稿本文・画像では短い名称を優先する
      postText: item["short-name"] || item.shortName || item.name,
      imageText: item["short-name"] || item.shortName || item.name,
    
      url: item.url || "",
      checked: false,
    });
  });

  // Spotify BGM項目
  // 曲を選んでいない場合はtimeleszのアーティストページを使う
  items.push({
    id: "spotify-bgm",
    name: getPostSpotifyName(),
    url: getPostSpotifyUrl(),
    checked: false,
  });

  return items;
}

// ==================================================
// 投稿項目リスト描画
// ==================================================
// X用・Threads用の両方のチェックリストを描画する
function renderPostItemList(items) {
  renderPostItemListByContainer(postItemXListElement, items);
  renderPostItemListByContainer(postItemThreadsListElement, items);
}

// 指定されたコンテナに投稿項目チェックリストを描画する
function renderPostItemListByContainer(container, items) {
  if (!container) {
    return;
  }

  // 既存表示をクリア
  container.innerHTML = "";

  // 投稿項目がない場合の空表示
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
    return;
  }

  // 投稿項目をチェックボックスとして描画する
  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;

    // state.postItems の何番目かを保持する
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = item.name;

    // チェック状態が変わったら state.postItems を更新し、投稿文も再生成する
    checkbox.addEventListener("change", () => {
      const targetIndex = Number(checkbox.dataset.index);
      const targetItem = state.postItems[targetIndex];

      if (!targetItem) {
        return;
      }

      // チェック状態をstateへ反映
      targetItem.checked = checkbox.checked;

      // X/Threads両方のチェックリストを再描画して表示を揃える
      renderPostItemList(state.postItems);

      // 投稿文プレビュー・文字数・リンク数を更新
      updateGeneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    container.appendChild(label);
  });
}

// ==================================================
// 投稿文プレビュー更新
// ==================================================
// X版・Threads版の投稿文を生成し、画面に反映する
function updateGeneratedPostText() {
  // X用投稿文
  const xPostText = buildPostText("x");

  // Threads用投稿文
  const threadsPostText = buildPostText("threads");

  // Xプレビューへ反映
  if (generatedXPostTextElement) {
    generatedXPostTextElement.textContent = xPostText;
  }

  // Threadsプレビューへ反映
  if (generatedThreadsPostTextElement) {
    generatedThreadsPostTextElement.textContent = threadsPostText;
  }

  // XはURLを23文字としてカウントする
  const xTextLength = countXPostTextLength(xPostText);

  // Threadsはリンク数制限の目安を見る
  const threadsLinkCount = countLinks(threadsPostText);

  // X文字数表示
  if (xPostTextCountElement) {
    xPostTextCountElement.textContent = `X文字数: ${xTextLength} / 280`;

    // 280文字を超えたら警告表示
    xPostTextCountElement.classList.toggle("warning-text", xTextLength > 280);
  }

  // Threadsリンク数表示
  if (threadsPostLinkCountElement) {
    threadsPostLinkCountElement.textContent = `Threadsリンク数: ${threadsLinkCount} / 5`;

    // 5リンクを超えたら警告表示
    threadsPostLinkCountElement.classList.toggle("warning-text", threadsLinkCount > 5);
  }

  // コピー済み表示をリセットする
  if (copyXPostTextButtonElement) {
    copyXPostTextButtonElement.textContent = "コピーする";
  }
}

// 現在アクティブなプレビューの投稿文を返す
function getGeneratedPostText() {
  return getActivePostText();
}

// 現在選択中のタブに応じて、X版またはThreads版の投稿文を返す
function getActivePostText() {
  if (currentPostPreviewPlatform === "threads") {
    return generatedThreadsPostTextElement
      ? generatedThreadsPostTextElement.textContent || ""
      : "";
  }

  return generatedXPostTextElement
    ? generatedXPostTextElement.textContent || ""
    : "";
}

// ==================================================
// 投稿文プレビュータブ切り替え
// ==================================================
// X / Threads のどちらのプレビューを表示するか切り替える
function setPostPreviewPlatform(platform) {
  // 想定外の値が来た場合はXに寄せる
  currentPostPreviewPlatform = platform === "threads" ? "threads" : "x";

  // Xタブのactive切り替え
  if (postPreviewXTabButtonElement) {
    postPreviewXTabButtonElement.classList.toggle(
      "active",
      currentPostPreviewPlatform === "x"
    );
  }

  // Threadsタブのactive切り替え
  if (postPreviewThreadsTabButtonElement) {
    postPreviewThreadsTabButtonElement.classList.toggle(
      "active",
      currentPostPreviewPlatform === "threads"
    );
  }

  // Xパネルの表示切り替え
  if (postPreviewXPanelElement) {
    postPreviewXPanelElement.classList.toggle(
      "hidden",
      currentPostPreviewPlatform !== "x"
    );
  }

  // Threadsパネルの表示切り替え
  if (postPreviewThreadsPanelElement) {
    postPreviewThreadsPanelElement.classList.toggle(
      "hidden",
      currentPostPreviewPlatform !== "threads"
    );
  }

  // タブ切り替え後に投稿文・文字数・リンク数を更新
  updateGeneratedPostText();
}

// ==================================================
// X文字数カウント
// ==================================================
// XではURLを一律23文字として扱うため、URL部分とそれ以外を分けて数える
function countXPostTextLength(text) {
  if (!text) {
    return 0;
  }

  // URLを抽出する
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];

  // URL部分を除いた本文
  const textWithoutUrls = text.replace(urlPattern, "");

  // URL以外の加重文字数 + URL数 × 23
  return countXWeightedTextLength(textWithoutUrls) + urls.length * 23;
}

// X向けの加重文字数カウント
// 半角は1、全角などは2として数える
function countXWeightedTextLength(text) {
  let count = 0;

  Array.from(text).forEach((char) => {
    count += isHalfWidthChar(char) ? 1 : 2;
  });

  return count;
}

// 半角文字かどうかを判定する
function isHalfWidthChar(char) {
  return /^[\u0020-\u007e\u00a1-\u00ff]$/.test(char);
}

// ==================================================
// 投稿文生成
// ==================================================
// platform に応じて X用 / Threads用 の投稿文を生成する
function buildPostText(platform = "x") {
  // 固定の冒頭文
  const lines = buildFixedPostLines();

  // Threadsではアプリシェアを末尾に回すため、一時的にここへ退避する
  const bottomShareLines = [];

  // チェック済み項目を投稿文へ追加する
  state.postItems.forEach((item) => {
    if (!item.checked) {
      return;
    }

    // postText があれば優先し、なければ name を使う
    const postText = item.postText ?? item.name;

    // Threadsでは「このツールをSNSにシェア」を末尾へ回す
    if (platform === "threads" && item.id === "app-share") {
      if (postText) {
        bottomShareLines.push(postText);
      }

      // Threads用URL（?share=th_YYYYMMDD）を付与
      if (item.url) {
        bottomShareLines.push(
          getAppShareUrlByPlatform(platform)
        );
      }

      return;
    }

    // Spotify BGM とアプリシェアはチェックマークなし
    if (
      item.id === "spotify-bgm" ||
      item.id === "app-share"
    ) {
      if (postText) {
        lines.push(postText);
      }
    } else {
      // 通常タスクはチェックマーク付きで投稿する
      lines.push(`✅${postText}`);
    }

    // URLがある項目は次の行にURLを追加する
    if (item.url) {
      // アプリシェアURLだけは
      // X/Threads別の識別子付きURLにする
      if (item.id === "app-share") {
        lines.push(
          getAppShareUrlByPlatform(platform)
        );
      } else {
        lines.push(item.url);
      }
    }
  });

  // 固定の案内文
  lines.push("");
  lines.push("クリックですぐ使えるよ▼");

  // Threadsの場合だけ、アプリシェア導線を末尾へ追加する
  if (
    platform === "threads" &&
    bottomShareLines.length > 0
  ) {
    lines.push(...bottomShareLines);
  }

  // 改行区切りの投稿文として返す
  return lines.join("\n");
}

// ==================================================
// 投稿文固定行
// ==================================================
// 投稿文の冒頭に必ず入れる固定文を作る
function buildFixedPostLines() {
  const selectedRadioRequestSongName = getSelectedRadioRequestSongName();

  return [
    `${formatMonthDay(new Date())}「タムごとDaily」タスク完了👍`,
    `${selectedRadioRequestSongName}をリクエストしたよ😊`,
  ];
}

// ==================================================
// 選択中リクエスト曲情報
// ==================================================

// 選択中のUSEN推しリク曲名を返す
function getSelectedRequestSongName() {
  if (!state.selectedRequestSong) {
    return "";
  }

  return state.selectedRequestSong.name || "";
}

// 選択中のUSEN推しリク曲URLを返す
function getSelectedRequestSongUrl() {
  if (!state.selectedRequestSong || !state.selectedRequestSong.url) {
    return "";
  }

  return buildRequestSongUrl(state.selectedRequestSong.url);
}

// ==================================================
// Spotify投稿情報
// ==================================================

function getPostSpotifyName() {
  // BGM未選択時はアーティストページへの導線にする
  if (!state.selectedSong || !state.selectedSong.url) {
    return "🎧timelesz - Spotify";
  }

  // BGM選択時は曲名を投稿本文に出す
  const songName = state.selectedSong.name || "";

  return songName ? `🎧Spotifyで${songName}` : "🎧Spotify";
}

// 投稿項目に使うSpotify URLを返す
function getPostSpotifyUrl() {
  // BGM未選択時はtimeleszのアーティストページ
  if (!state.selectedSong || !state.selectedSong.url) {
    return TIMELESZ_SPOTIFY_ARTIST_URL;
  }

  // BGM選択時は選択曲のSpotify URL
  return buildSpotifyUrl(state.selectedSong.url);
}

/**
 * SNS共有用URLに付ける識別子を作成する
 *
 * 例:
 * X       → x_20260529
 * Threads → th_20260529
 *
 * @param {"x" | "threads"} platform 投稿先
 * @returns {string}
 */
function getShareParamByPlatform(platform = "x") {
  // Threadsは短縮して th、それ以外はX扱いで x にする
  const prefix = platform === "threads" ? "th" : "x";

  // URL識別子の日付に使う現在日付を取得
  const now = new Date();

  // YYYYMMDD形式に整形
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `${prefix}_${yyyy}${mm}${dd}`;
}

/**
 * 投稿先ごとのSNS共有用URLを作成する
 *
 * getAppShareUrl() の基本URLに、
 * ?share=x_YYYYMMDD または
 * ?share=th_YYYYMMDD を付与する。
 *
 * 相対URLでも絶対URLでも動くよう、
 * window.location.origin を基準URLにする。
 *
 * @param {"x" | "threads"} platform 投稿先
 * @returns {string}
 */
function getAppShareUrlByPlatform(platform = "x") {
  // 相対URLでも落ちないように安全にURL化
  const url = new URL(
    getAppShareUrl(),
    window.location.origin
  );

  // 投稿先ごとの識別子をshareパラメータとして付与
  url.searchParams.set(
    "share",
    getShareParamByPlatform(platform)
  );

  return url.toString();
}
