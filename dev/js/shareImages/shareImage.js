// ==================================================
// shareImage.js
// SNS共有画像モーダル・画像生成・画像保存/共有を管理するファイル
// ==================================================

// ==================================================
// シェア画像の現在テーマ
// ==================================================
let currentShareImageTheme = getCurrentThemeKeyForShareImage();

// ==================================================
// シェア画像の現在スタイル
// ==================================================
let currentShareImageStyle = "yumekawaGradient";

// ==================================================
// SNS共有画像イベント登録
// ==================================================
function bindShareImageEvents() {
  addClickEvent(openShareImageModalButtonElement, () => {
    if (!shareImageModalElement) {
      return;
    }

    shareImageModalElement.classList.remove("hidden");
    syncShareImageStyleSelect();
    restoreShareImageUserName();
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

      currentShareImageTheme = themeKey;
      renderShareImage(currentShareImageTheme);
    });
  });

  if (typeof shareImageStyleSelectElement !== "undefined" && shareImageStyleSelectElement) {
    shareImageStyleSelectElement.addEventListener("change", () => {
      currentShareImageStyle = shareImageStyleSelectElement.value || "yumekawaGradient";
      renderShareImage(currentShareImageTheme);
    });
  }
  if (typeof shareImageUserNameInputElement !== "undefined" && shareImageUserNameInputElement) {
    shareImageUserNameInputElement.addEventListener("input", () => {
      saveShareImageUserName();
      renderShareImage(currentShareImageTheme);
    });
  }
  addClickEvent(downloadShareImageButtonElement, async () => {
    await renderShareImage(currentShareImageTheme);

    const blob = await getShareImageBlob();

    if (!blob) {
      showError(postErrorAreaElement, "画像の作成に失敗しました。");
      return;
    }

    const file = new File([blob], "tamugoto-daily-share.png", {
      type: "image/png",
    });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "タムごとDaily",
          text: `タムごとDaily 本日のタスク完了👍
${location.origin}${location.pathname}`,
        });

        hideError(postErrorAreaElement);
        return;
      }

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
}

// ==================================================
// スタイルセレクトを現在値に同期
// ==================================================
function syncShareImageStyleSelect() {
  if (typeof shareImageStyleSelectElement === "undefined" || !shareImageStyleSelectElement) {
    return;
  }

  if (shareImageStyleSelectElement.value) {
    currentShareImageStyle = shareImageStyleSelectElement.value;
    return;
  }

  shareImageStyleSelectElement.value = currentShareImageStyle;
}
// ==================================================
// 表示名を復元
// ==================================================
function restoreShareImageUserName() {
  if (typeof shareImageUserNameInputElement === "undefined" || !shareImageUserNameInputElement) {
    return;
  }

  const savedName = localStorage.getItem("shareImageUserName") || "";
  shareImageUserNameInputElement.value = savedName;
}

// ==================================================
// 表示名を保存
// ==================================================
function saveShareImageUserName() {
  if (typeof shareImageUserNameInputElement === "undefined" || !shareImageUserNameInputElement) {
    return;
  }

  localStorage.setItem("shareImageUserName", shareImageUserNameInputElement.value.trim());
}

// ==================================================
// シェア画像用表示名取得
// ==================================================
function getShareImageUserName() {
  if (typeof shareImageUserNameInputElement === "undefined" || !shareImageUserNameInputElement) {
    return localStorage.getItem("shareImageUserName") || "";
  }

  return shareImageUserNameInputElement.value.trim();
}
// ==================================================
// canvasから画像Blobを取得
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

// ==================================================
// 現在のアプリテーマからシェア画像テーマを取得
// ==================================================
function getCurrentThemeKeyForShareImage() {
  const savedTheme = localStorage.getItem("selectedTheme");
  const themeMap = {
    red: "red",
    purple: "purple",
    green: "green",
    sky: "sky",
    lime: "lime",
    pink: "pink",
    yellow: "yellow",
    white: "white",
    normal: "normal",
  };

  return themeMap[savedTheme] || "normal";
}

// ==================================================
// シェア画像の日付テキスト作成
// ==================================================
function getShareImageDateText() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd}`;
}

// ==================================================
// シェア画像用：USEN推しリク曲名
// ==================================================
function getShareImageRequestText() {
  if (!state.selectedRequestSong) {
    return "";
  }

  const name = state.selectedRequestSong.name || "";

  return name ? `USEN：${name}` : "";
}

// ==================================================
// シェア画像用：BGM曲名
// ==================================================
function getShareImageBgmText() {
  if (!state.selectedSong || !state.selectedSong.url) {
    return "";
  }

  const name = state.selectedSong.name || "";

  return name ? `BGM：${name}` : "";
}

// ==================================================
// シェア画像用タスク名取得
// ==================================================
function getShareImageTaskName(item) {
  if (!item) {
    return "";
  }

  return item["short-name"] || item.shortName || item.name || "";
}

// ==================================================
// シェア画像用タスク一覧取得
// ==================================================
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

// ==================================================
// チェック済み投稿項目からシェア画像用項目を取得
// ==================================================
function getCheckedPostItemsForShareImage() {
  const items = [];

  if (!Array.isArray(state.postItems)) {
    return items;
  }

  state.postItems.forEach((item) => {
    if (!item || item.checked !== true) {
      return;
    }

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

// ==================================================
// シェア画像用タスク配列作成
// ==================================================
function buildShareImageCanvasTasks(items) {
  const tasks = [];
  const requestText = getShareImageRequestText();
  const bgmText = getShareImageBgmText();

  if (requestText) {
    tasks.push(requestText);
  }

  items.forEach((item) => {
    if (item) {
      tasks.push(item);
    }
  });

  if (bgmText) {
    tasks.push(bgmText);
  }

  return tasks;
}

// ==================================================
// シェア画像描画
// ==================================================
async function renderShareImage(themeKey = currentShareImageTheme) {
  if (!shareImageCanvasElement) {
    return;
  }

  await document.fonts.ready;

  const items = getCheckedPostItemsForShareImage();
  const tasks = buildShareImageCanvasTasks(items);

  if (tasks.length === 0) {
    showError(postErrorAreaElement, "画像にする内容がありません。");
    return;
  }

  currentShareImageTheme = themeKey;

  if (typeof shareImageStyleSelectElement !== "undefined" && shareImageStyleSelectElement) {
    currentShareImageStyle = shareImageStyleSelectElement.value || currentShareImageStyle;
  }

  const ctx = shareImageCanvasElement.getContext("2d");
  const renderer =
    SHARE_IMAGE_RENDERERS[currentShareImageStyle] ||
    SHARE_IMAGE_RENDERERS.yumekawaGradient ||
    SHARE_IMAGE_RENDERERS.simple;

  const theme =
    SHARE_IMAGE_THEMES[currentShareImageTheme] ||
    SHARE_IMAGE_THEMES.normal;

  renderer({
    canvas: shareImageCanvasElement,
    ctx,
    theme,
    themeKey: currentShareImageTheme,
    dateText: getShareImageDateText(),
    titleText: "タスク完了！",
    tasks,
    userName: getShareImageUserName()
  });

  hideError(postErrorAreaElement);
}
