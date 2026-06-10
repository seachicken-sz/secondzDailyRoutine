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

let currentShareImageCharacter = null;
let shareImageRenderToken = 0;

// ==================================================
// シェア画像の呼び出し元・外部項目
// ==================================================
let currentShareImageSource = "normal";
let currentShareImageExternalItems = null;
let currentShareImageTitleText = "タスク完了！";

// ==================================================
// シェア画像モーダルを開く
// 呼び出し元：通常SNS共有 / おかわりdaily
// ==================================================
function openShareImageModal(options = {}) {
  if (!shareImageModalElement) {
    return;
  }

  currentShareImageSource = options.source || "normal";
  currentShareImageExternalItems = Array.isArray(options.items) ? options.items : null;
  currentShareImageTitleText = options.titleText || "タスク完了！";

  shareImageModalElement.classList.remove("hidden");
  syncShareImageStyleSelect();
  restoreShareImageUserName();
  renderShareImage(currentShareImageTheme);
}

// ==================================================
// SNS共有画像イベント登録
// ==================================================
function bindShareImageEvents() {
  addClickEvent(openShareImageModalButtonElement, () => {
    openShareImageModal({
      source: "normal",
      items: null,
      titleText: "タスク完了！",
    });
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
      regenerateShareImageCharacter(currentShareImageTheme);
      renderShareImage(currentShareImageTheme);
    });
  });

  if (typeof shareImageStyleSelectElement !== "undefined" && shareImageStyleSelectElement) {
    shareImageStyleSelectElement.addEventListener("change", async () => {
      currentShareImageStyle = shareImageStyleSelectElement.value || "yumekawaGradient";
      await waitShareImageStyleFontsLoaded(currentShareImageStyle);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await renderShareImage(currentShareImageTheme);
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
// キャラ画像があるテーマキー一覧を取得
// ==================================================
function getShareImageCharacterThemeKeys() {
  return Object.keys(SHARE_IMAGE_THEMES).filter((themeKey) => themeKey !== "normal").filter((themeKey) => {
    const theme = SHARE_IMAGE_THEMES[themeKey];
    return theme && Array.isArray(theme.characterImagePaths) && theme.characterImagePaths.length > 0;
  });
}

// ==================================================
// 配列からランダム取得
// ==================================================
function getRandomArrayItem(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

// ==================================================
// シェア画像キャラを抽選
// ==================================================
function generateShareImageCharacter(themeKey) {
  let characterThemeKey = themeKey;
  if (themeKey === "normal") characterThemeKey = getRandomArrayItem(getShareImageCharacterThemeKeys());

  const characterTheme = SHARE_IMAGE_THEMES[characterThemeKey];
  if (!characterTheme || !Array.isArray(characterTheme.characterImagePaths)) {
    currentShareImageCharacter = null;
    return null;
  }

  const imagePath = getRandomArrayItem(characterTheme.characterImagePaths);
  currentShareImageCharacter = { themeKey: characterThemeKey, imagePath };
  return currentShareImageCharacter;
}

// ==================================================
// 現在のシェア画像キャラを取得
// ==================================================
function getCurrentShareImageCharacter(themeKey) {
  if (!currentShareImageCharacter) return generateShareImageCharacter(themeKey);
  return currentShareImageCharacter;
}

// ==================================================
// シェア画像キャラを再抽選
// ==================================================
function regenerateShareImageCharacter(themeKey) {
  currentShareImageCharacter = null;
  return generateShareImageCharacter(themeKey);
}

// ==================================================
// シェア画像用画像読み込み
// ==================================================
function loadShareImageAsset(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
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
// 優先順位：localStorage.selectedTheme → documentElement の data-theme → normal
// ==================================================
function getCurrentThemeKeyForShareImage() {
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

  const savedTheme = localStorage.getItem("selectedTheme");

  if (themeMap[savedTheme]) {
    return themeMap[savedTheme];
  }

  const currentTheme = document.documentElement.dataset.theme || "normal";

  if (themeMap[currentTheme]) {
    return themeMap[currentTheme];
  }

  return "normal";
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
// 外部から渡されたシェア画像用項目を文字列配列に変換
// おかわりdailyでは完了済みだけを home.js 側で渡す想定
// ==================================================
function getExternalItemsForShareImage() {
  const items = [];

  if (!Array.isArray(currentShareImageExternalItems)) {
    return items;
  }

  currentShareImageExternalItems.forEach((item) => {
    if (!item) {
      return;
    }

    if (typeof item === "string") {
      if (item.trim()) {
        items.push(item.trim());
      }
      return;
    }

    const name =
      item.imageText ||
      item["short-name"] ||
      item.shortName ||
      item.label ||
      item.title ||
      item.name ||
      item.postText ||
      "";

    if (name) {
      items.push(name);
    }
  });

  return items;
}

// ==================================================
// シェア画像用項目を取得
// 通常SNS共有：チェック済み投稿項目
// おかわりdaily：外部から渡された完了済み項目
// ==================================================
function getShareImageItemsForCurrentSource() {
  if (Array.isArray(currentShareImageExternalItems)) {
    return getExternalItemsForShareImage();
  }

  return getCheckedPostItemsForShareImage();
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
// シェア画像スタイル読み込み待ち
// ==================================================
function waitShareImageStylesLoaded() {
  return new Promise((resolve) => {
    if (window.shareImageStylesLoaded) {
      resolve();
      return;
    }

    window.addEventListener("shareImageStylesLoaded", () => {
      resolve();
    }, { once: true });
  });
}

// ==================================================
// シェア画像フォント読み込み待ち
// ==================================================
async function waitShareImageFontsLoaded() {
  if (!document.fonts) {
    return;
  }

  await Promise.all([
    document.fonts.load('400 32px "Zen Maru Gothic"'),
    document.fonts.load('500 32px "Zen Maru Gothic"'),
    document.fonts.load('700 32px "Zen Maru Gothic"'),
    document.fonts.load('400 32px "Yomogi"'),
    document.fonts.load('400 42px "Hachi Maru Pop"'),
    document.fonts.load('400 42px "Darumadrop One"'),
    document.fonts.load('400 32px "Klee One"'),
    document.fonts.load('500 30px "Caveat"'),
    document.fonts.ready
  ]);
}

async function waitShareImageStyleFontsLoaded(styleKey) {
  if (!document.fonts) return;

  const fontLoads = [
    document.fonts.load('400 32px "Zen Maru Gothic"'),
    document.fonts.load('500 32px "Zen Maru Gothic"'),
    document.fonts.load('700 32px "Zen Maru Gothic"')
  ];

  if (styleKey === "yumekawaGradient") {
    fontLoads.push(document.fonts.load('400 62px "Hachi Maru Pop"'));
    fontLoads.push(document.fonts.load('400 62px "Yomogi"'));
  }

  if (styleKey === "paperWood") {
    fontLoads.push(document.fonts.load('400 34px "Yomogi"'));
  }

  if (styleKey === "characterPhotoList") {
    fontLoads.push(document.fonts.load('400 62px "Darumadrop One"'));
    fontLoads.push(document.fonts.load('700 31px "Zen Maru Gothic"'));
    fontLoads.push(document.fonts.load('500 30px "Caveat"'));
    fontLoads.push(document.fonts.load('600 30px "Caveat"'));
  }

  if (styleKey === "characterSimpleCard") {
    fontLoads.push(document.fonts.load('400 64px "Darumadrop One"'));
    fontLoads.push(document.fonts.load('700 34px "Zen Maru Gothic"'));
  }

  await Promise.all(fontLoads);
  await document.fonts.ready;
}

// ==================================================
// シェア画像描画
// ==================================================
async function renderShareImage(themeKey = currentShareImageTheme) {
  const renderToken = ++shareImageRenderToken;
  if (!shareImageCanvasElement) {
    return;
  }

  await waitShareImageStylesLoaded();
  await waitShareImageFontsLoaded();

  if (renderToken !== shareImageRenderToken) return;

  const items = getShareImageItemsForCurrentSource();
  const tasks = buildShareImageCanvasTasks(items);

  if (tasks.length === 0) {
    showError(postErrorAreaElement, "画像にする内容がありません。");
    return;
  }

  currentShareImageTheme = themeKey;

  if (typeof shareImageStyleSelectElement !== "undefined" && shareImageStyleSelectElement) {
    currentShareImageStyle = shareImageStyleSelectElement.value || currentShareImageStyle;
  }

  await waitShareImageStyleFontsLoaded(currentShareImageStyle);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (renderToken !== shareImageRenderToken) return;

  const ctx = shareImageCanvasElement.getContext("2d");
  const renderer =
    SHARE_IMAGE_RENDERERS[currentShareImageStyle] ||
    SHARE_IMAGE_RENDERERS.yumekawaGradient ||
    SHARE_IMAGE_RENDERERS.simple;

  const theme =
    SHARE_IMAGE_THEMES[currentShareImageTheme] ||
    SHARE_IMAGE_THEMES.normal;

  const character = getCurrentShareImageCharacter(currentShareImageTheme);
  const characterImage = await loadShareImageAsset(character?.imagePath || "");

  await renderer({
    canvas: shareImageCanvasElement,
    ctx,
    theme,
    themeKey: currentShareImageTheme,
    dateText: getShareImageDateText(),
    titleText: currentShareImageTitleText,
    tasks,
    userName: getShareImageUserName(),
    characterImage,
    characterThemeKey: character?.themeKey || currentShareImageTheme
  });

  hideError(postErrorAreaElement);
}

// ==================================================
// 外部ファイルからシェア画像モーダルを開けるようにする
// home.js のおかわりdailyなどから使用
// ==================================================
window.openShareImageModal = openShareImageModal;
