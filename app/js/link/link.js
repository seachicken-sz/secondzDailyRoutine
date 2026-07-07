// ==================================================
// link.js
// タスクリンク集表示
// ==================================================

const DATA_PATHS = {
  limitedTask: "../data/onceListJson.json",
  dailyTask: "../data/listJson.json",
  memberWorks: "../data/memberWorksJson.json",
  youtubeList: "../data/youtubePlayListJson.json",
};

const MEMBER_HEARTS = {
  shori: {
    label: "勝利",
    color: "#ef5454",
  },
  fuma: {
    label: "風磨",
    color: "#8d6ad8",
  },
  so: {
    label: "聡",
    color: "#65af6b",
  },
  teranishi: {
    label: "寺西",
    color: "#67b9df",
  },
  hara: {
    label: "原",
    color: "#9acb4c",
  },
  hashimoto: {
    label: "橋本",
    color: "#f08bb5",
  },
  inomata: {
    label: "猪俣",
    color: "#e5bd3f",
  },
  shinozuka: {
    label: "篠塚",
    color: "#f4f4f4",
  },
};

const ALL_MEMBER_IDS = Object.keys(MEMBER_HEARTS);

document.addEventListener("DOMContentLoaded", () => {
  initializeLinkPage();
});

async function initializeLinkPage() {
  const [
    limitedTaskResult,
    dailyTaskResult,
    memberWorksResult,
    youtubeListResult,
  ] = await Promise.allSettled([
    fetchJson(DATA_PATHS.limitedTask),
    fetchJson(DATA_PATHS.dailyTask),
    fetchJson(DATA_PATHS.memberWorks),
    fetchJson(DATA_PATHS.youtubeList),
  ]);

  renderLimitedTaskResult(limitedTaskResult);
  renderDailyTaskResult(dailyTaskResult);
  renderTverResult(memberWorksResult);
  renderYoutubeResult(youtubeListResult);

  initializePageNavigation();
  sendLinkPageAccessLog();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`JSONの取得に失敗しました: ${response.status}`);
  }

  return response.json();
}

// ==================================================
// 期間限定タスク
// ==================================================

function renderLimitedTaskResult(result) {
  const container = document.getElementById("limitedTask");

  if (result.status !== "fulfilled") {
    renderError(container);
    return;
  }

  const activeTasks = result.value.filter(isWithinPeriod);

  if (activeTasks.length === 0) {
    renderEmpty(container, "現在表示できる期間限定タスクはありません");
    return;
  }

  activeTasks.forEach((task) => {
    container.appendChild(
      createTaskCard({
        title: task.name,
        description: task["notice-message"],
        url: task.url,
        buttonText: "タスクを開く",
        logCategory: "limited",
        itemId: task.id || "",
      })
    );
  });
}

// ==================================================
// デイリータスク
// ==================================================

function renderDailyTaskResult(result) {
  const container = document.getElementById("dailyTask");

  if (result.status !== "fulfilled") {
    renderError(container);
    return;
  }

  const tasks = result.value.flatMap((group) => {
    return Array.isArray(group.items) ? group.items : [];
  });

  if (tasks.length === 0) {
    renderEmpty(container, "表示できるデイリータスクはありません");
    return;
  }

  tasks.forEach((task) => {
    container.appendChild(
      createTaskCard({
        title: task.name,
        description: task.comment,
        url: task.url,
        buttonText: "タスクを開く",
        logCategory: "daily",
        itemId: task.id || "",
      })
    );
  });
}

// ==================================================
// TVer
// ==================================================

function renderTverResult(result) {
  const container = document.getElementById("tverList");

  if (result.status !== "fulfilled") {
    renderError(container);
    return;
  }

  const tverWorks = result.value.filter((work) => {
    return (
      work.workType === "tv" &&
      typeof work.platformUrl === "string" &&
      work.platformUrl.includes("tver.jp")
    );
  });

  if (tverWorks.length === 0) {
    renderEmpty(container, "現在TVerで表示できる番組はありません");
    return;
  }

  tverWorks.forEach((work) => {
    container.appendChild(
      createTverCard({
        title: work.title,
        members: work.members,
        url: work.platformUrl,
      })
    );
  });
}

// ==================================================
// YouTube再生リスト
// ==================================================

function renderYoutubeResult(result) {
  const container = document.getElementById("youtubeList");

  if (result.status !== "fulfilled") {
    renderError(container);
    return;
  }

  const playlists = result.value;

  if (!Array.isArray(playlists) || playlists.length === 0) {
    renderEmpty(container, "表示できるYouTube再生リストはありません");
    return;
  }

  playlists.forEach((playlist) => {
    container.appendChild(
      createYoutubeCard({
        title: playlist.name,
        url: playlist.url,
        itemId: playlist.id || "",
        thumbnailUrl: getYoutubeThumbnailUrl(playlist.startmovie),
      })
    );
  });
}

// ==================================================
// カード生成
// ==================================================

function createTaskCard({
  title,
  description,
  url,
  buttonText,
  logCategory,
  itemId,
}) {
  const card = document.createElement("article");
  card.className = "task-link-card";

  const titleElement = document.createElement("h3");
  titleElement.className = "task-link-card-title";
  titleElement.textContent = title;

  const descriptionElement = document.createElement("p");
  descriptionElement.className = "task-link-card-description";
  descriptionElement.textContent = description || "";

  const link = document.createElement("a");
  link.className = "task-link-card-button";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = buttonText;

  link.addEventListener("click", () => {
    sendLinkClickLog({
      category: logCategory,
      itemId,
      title,
      url,
    });
  });

  card.append(titleElement);

  if (description) {
    card.append(descriptionElement);
  }

  if (url) {
    card.append(link);
  }

  return card;
}

function createTverCard({ title, members, url }) {
  const card = document.createElement("article");
  card.className = "tver-link-card";

  const mainLink = document.createElement("a");
  mainLink.className = "tver-link-card-main";
  mainLink.href = url;
  mainLink.target = "_blank";
  mainLink.rel = "noopener noreferrer";

  const titleArea = document.createElement("div");
  titleArea.className = "tver-link-card-title-area";

  const titleElement = document.createElement("span");
  titleElement.className = "tver-link-card-title";
  titleElement.textContent = title;

  const heartsElement = createMemberHearts(members);

  titleArea.append(titleElement, heartsElement);
  mainLink.appendChild(titleArea);

  const buttonLink = document.createElement("a");
  buttonLink.className = "tver-link-card-button";
  buttonLink.href = url;
  buttonLink.target = "_blank";
  buttonLink.rel = "noopener noreferrer";
  buttonLink.setAttribute("aria-label", `${title}をTVerで開く`);
  buttonLink.textContent = "→";

  const logData = {
    category: "tver",
    itemId: createLinkLogItemId("tver", title),
    title,
    url,
    members: Array.isArray(members) ? members.join(",") : "",
  };

  mainLink.addEventListener("click", () => {
    sendLinkClickLog(logData);
  });

  buttonLink.addEventListener("click", () => {
    sendLinkClickLog(logData);
  });

  card.append(mainLink, buttonLink);

  return card;
}

function createYoutubeCard({ title, url, itemId, thumbnailUrl }) {
  const card = document.createElement("a");
  card.className = "youtube-link-card";
  card.href = url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const imageWrap = document.createElement("div");
  imageWrap.className = "youtube-link-card-image-wrap";

  const image = document.createElement("img");
  image.className = "youtube-link-card-image";
  image.src = thumbnailUrl;
  image.alt = `${title}のサムネイル`;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.src = "../img/logo.png";
    image.classList.add("is-fallback");
  });

  const titleElement = document.createElement("p");
  titleElement.className = "youtube-link-card-title";
  titleElement.textContent = title;

  card.addEventListener("click", () => {
    sendLinkClickLog({
      category: "youtube",
      itemId,
      title,
      url,
    });
  });

  imageWrap.appendChild(image);
  card.append(imageWrap, titleElement);

  return card;
}

// ==================================================
// メンバー♥
// ==================================================

function createMemberHearts(members) {
  const heartsElement = document.createElement("span");
  heartsElement.className = "member-hearts";
  heartsElement.setAttribute("aria-label", getMemberLabel(members));

  if (Array.isArray(members) && members.includes("all")) {
    const allLabel = document.createElement("span");
    allLabel.className = "member-all-label";
    allLabel.textContent = "ALL";

    heartsElement.appendChild(allLabel);

    return heartsElement;
  }

  const memberIds = normalizeMemberIds(members);

  memberIds.forEach((memberId) => {
    const member = MEMBER_HEARTS[memberId];

    if (!member) {
      return;
    }

    const heart = document.createElement("span");
    heart.className = "member-heart";
    heart.textContent = "♥";
    heart.style.color = member.color;
    heart.title = member.label;

    if (memberId === "shinozuka") {
      heart.classList.add("is-shinozuka");
    }

    heartsElement.appendChild(heart);
  });

  return heartsElement;
}

function normalizeMemberIds(members) {
  if (!Array.isArray(members)) {
    return [];
  }

  if (members.includes("all")) {
    return ALL_MEMBER_IDS;
  }

  return members.filter((memberId) => {
    return MEMBER_HEARTS[memberId];
  });
}

function getMemberLabel(members) {
  if (Array.isArray(members) && members.includes("all")) {
    return "ALL";
  }

  const memberIds = normalizeMemberIds(members);

  return memberIds
    .map((memberId) => MEMBER_HEARTS[memberId]?.label)
    .filter(Boolean)
    .join("・");
}

// ==================================================
// YouTubeサムネイル
// ==================================================

function getYoutubeThumbnailUrl(startmovie) {
  const videoId = getYoutubeVideoId(startmovie);

  if (!videoId) {
    return "../img/logo.png";
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function getYoutubeVideoId(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.replace("/", "");
    }

    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.searchParams.has("v")
    ) {
      return parsedUrl.searchParams.get("v");
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

      if (pathParts[0] === "shorts") {
        return pathParts[1] || "";
      }
    }
  } catch (error) {
    console.warn("YouTube URLの解析に失敗しました", error);
  }

  return "";
}

// ==================================================
// 共通表示
// ==================================================

function renderEmpty(container, message) {
  const element = document.createElement("p");
  element.className = "link-empty-message";
  element.textContent = message;

  container.replaceChildren(element);
}

function renderError(container) {
  const element = document.createElement("p");
  element.className = "link-error-message";
  element.textContent = "データを読み込めませんでした";

  container.replaceChildren(element);
}

function createLinkLogItemId(prefix, value) {
  const normalizedValue = String(value || "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  return `${prefix}_${normalizedValue}`;
}

// ==================================================
// 日付判定
// ==================================================

function isWithinPeriod(item) {
  const now = getJstDateTimeString();

  if (item.from && now < item.from) {
    return false;
  }

  if (item.to && now > item.to) {
    return false;
  }

  return true;
}

function getJstDateTimeString() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}`;
}

// ==================================================
// 目次・上に戻るボタン
// ==================================================

function initializePageNavigation() {
  const backToTopButton = document.getElementById("backToTopButton");

  if (!backToTopButton) {
    return;
  }

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  window.addEventListener(
    "scroll",
    () => {
      const shouldShowButton = window.scrollY > 500;

      backToTopButton.classList.toggle(
        "is-visible",
        shouldShowButton
      );
    },
    { passive: true }
  );
}