// ==================================================
// Utils: URL生成
// ==================================================
function buildSpotifyUrl(trackIdOrUrl) {
  if (trackIdOrUrl.startsWith("http://") || trackIdOrUrl.startsWith("https://")) {
    return trackIdOrUrl;
  }

  return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);
}

function buildRequestSongUrl(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return USEN_REQUEST_BASE_URL + encodeURIComponent(url);
}

function getAppShareUrl() {
  return `${location.origin}${location.pathname}`;
}

function countLinks(text) {
  const links = text.match(/https?:\/\/\S+/g);
  return links ? links.length : 0;
}

// ==================================================
// Utils: 日付・期間判定
// ==================================================
function parseDateTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  if (/^\d{12}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));
    const hour = Number(text.slice(8, 10));
    const minute = Number(text.slice(10, 12));

    return new Date(year, month, day, hour, minute);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isWithinPeriod(fromValue, toValue) {
  const now = new Date();
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && now < fromDate) {
    return false;
  }

  if (toDate && now > toDate) {
    return false;
  }

  return true;
}

function formatMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

function formatTaskLimitDate(value) {
  const date = parseDateTime(value);

  if (!date) {
    return "期限未設定";
  }

  return formatMonthDay(date);
}

function formatTaskLimitRange(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (!fromDate || !toDate) {
    return "期間未設定";
  }

  return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
}

function formatHomeInfoDateLabel(item) {
  if (!item) {
    return "";
  }

  const releaseDate = parseDateTime(item.release);

  if (releaseDate) {
    return formatMonthDay(releaseDate);
  }

  return formatHomeInfoPeriodLabel(item.from, item.to);
}

function formatHomeInfoPeriodLabel(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  if (fromDate && toDate) {
    return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
  }

  if (fromDate) {
    return `${formatMonthDay(fromDate)}〜`;
  }

  if (toDate) {
    return `〜${formatMonthDay(toDate)}`;
  }

  return "";
}

// ==================================================
// Utils: YouTube
// ==================================================
function extractYoutubeVideoId(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const parsedUrl = new URL(text);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0];
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return "";
  } catch {
    return "";
  }
}

function getYoutubeThumbnailUrl(item) {
  if (!item) {
    return "";
  }

  if (item.thumbnail) {
    return item.thumbnail;
  }

  const startMovieVideoId = extractYoutubeVideoId(item.startmovie);
  if (startMovieVideoId) {
    return `${YOUTUBE_THUMBNAIL_BASE_URL}${startMovieVideoId}/hqdefault.jpg`;
  }

  const videoId = extractYoutubeVideoId(item.url);
  if (!videoId) {
    return "";
  }

  return `${YOUTUBE_THUMBNAIL_BASE_URL}${videoId}/hqdefault.jpg`;
}

function createYoutubeLogItemId(item) {
  if (!item) {
    return "yt_unknown";
  }

  const videoId = extractYoutubeVideoId(item.url) || extractYoutubeVideoId(item.startmovie);

  if (videoId) {
    return `yt_${videoId}`;
  }

  if (item.url) {
    return `yt_${String(item.url).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
  }

  return "yt_unknown";
}

// ==================================================
// Utils: UI補助
// ==================================================
function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}

function setSongListVisibility(containerElement, shouldShow) {
  if (!containerElement) {
    return;
  }

  containerElement.classList.toggle("hidden", !shouldShow);
}

function setButtonStyle(buttonElement, styleType) {
  if (!buttonElement) {
    return;
  }

  buttonElement.classList.remove("primary-button");
  buttonElement.classList.remove("secondary-button");
  buttonElement.classList.remove("gray-button");

  if (styleType === "primary") {
    buttonElement.classList.add("primary-button");
    return;
  }

  if (styleType === "gray") {
    buttonElement.classList.add("gray-button");
    return;
  }

  buttonElement.classList.add("secondary-button");
}
