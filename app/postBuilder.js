// ==================================================
// 投稿文生成・投稿項目
// ==================================================

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
  if (!postItemListElement) {
    return;
  }

  postItemListElement.innerHTML = "";

  if (items.length === 0) {
    postItemListElement.innerHTML = '<p class="empty-text">追加できる項目はありません。</p>';
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
      item.checked = checkbox.checked;
      name.textContent = item.name;
      eneratedPostText();
    });

    label.appendChild(checkbox);
    label.appendChild(name);
    postItemListElement.appendChild(label);
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

  const activePostText = getActivePostText();
  const textLength = activePostText.length;
  const linkCount = countLinks(activePostText);

  if (postTextCountElement) {
    postTextCountElement.textContent = "";
    postTextCountElement.classList.toggle("warning-text", textLength > 280);
  }

  if (postLinkCountElement) {
    postLinkCountElement.textContent = `Threadsリンク数: ${linkCount} / 5`;
    postLinkCountElement.classList.toggle("warning-text", linkCount > 5);
  }

  if (copyXPostTextButtonElement) {
    copyXPostTextButtonElement.textContent = "コピーする";
  }
}

function getGeneratedPostText() {
  return getActivePostText();
}

let currentPostPreviewPlatform = "x";

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
