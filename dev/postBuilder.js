// ==================================================
// 投稿文生成・投稿項目
// ==================================================

let currentPostPreviewPlatform = "x";

function buildPostItems() {
  const items = [];

  items.push({
    id: "app-share",
    name: "このツールをSNSにシェア",
    postText: "",
    url: getAppShareUrl(),
    checked: true,
  });

  items.push({
    id: "usen-request",
    name: "USEN推しリク",
    postText: "USEN推しリク",
    url: getSelectedRequestSongUrl(),
    checked: false,
  });

  state.selectedOnceTasks.forEach((task, index) => {
    if (!task || !task.name) {
      return;
    }

    items.push({
      id: `once-${index}`,
      name: task.name,
      imageText: task["short-name"] || task.shortName || task.name,
      url: task.url || "",
      checked: false,
    });
  });

  state.completedDailyItems.forEach((item, index) => {
    if (!item || !item.name) {
      return;
    }

    items.push({
      id: `daily-${index}`,
      name: item.name,
      imageText: item["short-name"] || item.shortName || item.name,
      url: item.url || "",
      checked: false,
    });
  });

  items.push({
    id: "spotify-bgm",
    name: getPostSpotifyName(),
    url: getPostSpotifyUrl(),
    checked: false,
  });

  return items;
}

function renderPostItemList(items) {
  renderPostItemListByContainer(postItemXListElement, items);
  renderPostItemListByContainer(postItemThreadsListElement, items);
}

function renderPostItemListByContainer(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
    return;
  }

  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.dataset.index = String(index);

    const name = document.createElement("span");
    name.className = "check-item-name";
    name.textContent = item.name;

    checkbox.addEventListener("change", () => {
      const targetIndex = Number(checkbox.dataset.index);
      const targetItem = state.postItems[targetIndex];

      if (!targetItem) {
        return;
      }

      targetItem.checked = checkbox.checked;

      renderPostItemList(state.postItems);
      updateGeneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    container.appendChild(label);
  });
}

function updateGeneratedPostText() {
  const xPostText = buildPostText("x");
  const threadsPostText = buildPostText("threads");

  if (generatedXPostTextElement) {
    generatedXPostTextElement.textContent = xPostText;
  }

  if (generatedThreadsPostTextElement) {
    generatedThreadsPostTextElement.textContent = threadsPostText;
  }

  const xTextLength = countXPostTextLength(xPostText);
  const threadsLinkCount = countLinks(threadsPostText);

  if (xPostTextCountElement) {
    xPostTextCountElement.textContent = `X文字数: ${xTextLength} / 280`;
    xPostTextCountElement.classList.toggle("warning-text", xTextLength > 280);
  }

  if (threadsPostLinkCountElement) {
    threadsPostLinkCountElement.textContent = `Threadsリンク数: ${threadsLinkCount} / 5`;
    threadsPostLinkCountElement.classList.toggle("warning-text", threadsLinkCount > 5);
  }

  if (copyXPostTextButtonElement) {
    copyXPostTextButtonElement.textContent = "コピーする";
  }
}

function getGeneratedPostText() {
  return getActivePostText();
}

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

function setPostPreviewPlatform(platform) {
  currentPostPreviewPlatform = platform === "threads" ? "threads" : "x";

  if (postPreviewXTabButtonElement) {
    postPreviewXTabButtonElement.classList.toggle(
      "active",
      currentPostPreviewPlatform === "x"
    );
  }

  if (postPreviewThreadsTabButtonElement) {
    postPreviewThreadsTabButtonElement.classList.toggle(
      "active",
      currentPostPreviewPlatform === "threads"
    );
  }

  if (postPreviewXPanelElement) {
    postPreviewXPanelElement.classList.toggle(
      "hidden",
      currentPostPreviewPlatform !== "x"
    );
  }

  if (postPreviewThreadsPanelElement) {
    postPreviewThreadsPanelElement.classList.toggle(
      "hidden",
      currentPostPreviewPlatform !== "threads"
    );
  }

  updateGeneratedPostText();
}

function countXPostTextLength(text) {
  if (!text) {
    return 0;
  }

  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];
  const textWithoutUrls = text.replace(urlPattern, "");

  return countXWeightedTextLength(textWithoutUrls) + urls.length * 23;
}

function countXWeightedTextLength(text) {
  let count = 0;

  Array.from(text).forEach((char) => {
    count += isHalfWidthChar(char) ? 1 : 2;
  });

  return count;
}

function isHalfWidthChar(char) {
  return /^[\u0020-\u007e\u00a1-\u00ff]$/.test(char);
}

function buildPostText(platform = "x") {
  const lines = buildFixedPostLines();
  const bottomShareLines = [];

  state.postItems.forEach((item) => {
    if (!item.checked) {
      return;
    }

    const postText = item.postText ?? item.name;

    if (platform === "threads" && item.id === "app-share") {
      if (postText) {
        bottomShareLines.push(postText);
      }

      if (item.url) {
        bottomShareLines.push(item.url);
      }

      return;
    }

    if (item.id === "spotify-bgm" || item.id === "app-share") {
      if (postText) {
        lines.push(postText);
      }
    } else {
      lines.push(`✅${postText}`);
    }

    if (item.url) {
      lines.push(item.url);
    }
  });

  lines.push("");
  lines.push("クリックですぐ使えるよ▼");

  if (platform === "threads" && bottomShareLines.length > 0) {
    lines.push(...bottomShareLines);
  }

  return lines.join("\n");
}

function buildFixedPostLines() {
  const selectedRequestSongName = getSelectedRequestSongName();

  return [
    `${formatMonthDay(new Date())}「タムごとDaily」タスク完了👍`,
    `${selectedRequestSongName}をリクエストしたよ😊`,
  ];
}

function getSelectedRequestSongName() {
  if (!state.selectedRequestSong) {
    return "";
  }

  return state.selectedRequestSong.name || "";
}

function getSelectedRequestSongUrl() {
  if (!state.selectedRequestSong || !state.selectedRequestSong.url) {
    return "";
  }

  return buildRequestSongUrl(state.selectedRequestSong.url);
}

function getPostSpotifyName() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return "🎧timelesz - Spotify";
  }

  return "🎧本日のBGM";
}

function getPostSpotifyUrl() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return TIMELESZ_SPOTIFY_ARTIST_URL;
  }

  return buildSpotifyUrl(state.selectedSong.url);
}
