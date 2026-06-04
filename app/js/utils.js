// ==================================================
// クリックイベント設定
// ==================================================
function addClickEvent(element, handler) {
  // HTML側に要素がない場合は何もしない
  if (!element) {
    return;
  }
  element.addEventListener("click", handler);
}

// ==================================================
// Utils: URL生成
// ==================================================

/**
 * Spotifyの楽曲URLを生成する関数。
 * 引数には「track ID」「Spotify URL文字列」「url/shareIdを持つ楽曲オブジェクト」のいずれかを受け取る。
 *
 * @param {string|Object} songOrTrackIdOrUrl - Spotifyのtrack ID、URL、または楽曲情報オブジェクト
 * @returns {string} SpotifyのURL。生成できない場合は空文字
 */
function buildSpotifyUrl(songOrTrackIdOrUrl) {
  // 値が未指定の場合はURLを作れないため空文字を返す
  if (!songOrTrackIdOrUrl) {
    return "";
  }

  // 文字列で渡された場合は「URL」または「track ID」として扱う
  if (typeof songOrTrackIdOrUrl === "string") {
    // すでにURL形式ならそのまま返す
    if (
      songOrTrackIdOrUrl.startsWith("http://") ||
      songOrTrackIdOrUrl.startsWith("https://")
    ) {
      return songOrTrackIdOrUrl;
    }

    // URLではない文字列はSpotifyのtrack IDとしてURLを組み立てる
    return SPOTIFY_TRACK_BASE_URL + encodeURIComponent(songOrTrackIdOrUrl);
  }

  // オブジェクトで渡された場合は、urlをtrack IDまたはURLとして扱う
  const trackIdOrUrl = songOrTrackIdOrUrl.url;

  // Spotify共有URLに付与する si パラメータ
  const shareId = songOrTrackIdOrUrl.shareId;

  // urlがなければURLを生成できない
  if (!trackIdOrUrl) {
    return "";
  }

  // urlがすでに完全なURLの場合
  if (
    trackIdOrUrl.startsWith("http://") ||
    trackIdOrUrl.startsWith("https://")
  ) {
    // shareIdがなければURLをそのまま返す
    if (!shareId) {
      return trackIdOrUrl;
    }

    // 既存のクエリを一度落として、siパラメータだけを付け直す
    const baseUrl = trackIdOrUrl.split("?")[0];
    return `${baseUrl}?si=${encodeURIComponent(shareId)}`;
  }

  // urlがtrack IDの場合はSpotifyのベースURLと結合する
  const baseUrl = SPOTIFY_TRACK_BASE_URL + encodeURIComponent(trackIdOrUrl);

  // shareIdがなければ通常のSpotify URLとして返す
  if (!shareId) {
    return baseUrl;
  }

  // shareIdがある場合は共有用のsiパラメータを付与する
  return `${baseUrl}?si=${encodeURIComponent(shareId)}`;
}

/**
 * USEN推しリク用のURLを生成する。
 * 完全なURLが渡された場合はそのまま返し、IDのみの場合はベースURLと結合する。
 *
 * @param {string} url - USENの完全URL、または楽曲ID/パス
 * @returns {string} USEN推しリクURL
 */
function buildRequestSongUrl(url) {
  // すでにURL形式ならそのまま使う
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // URLではない場合はUSEN推しリクのベースURLに結合する
  return USEN_REQUEST_BASE_URL + encodeURIComponent(url);
}

/**
 * 現在開いているアプリ画面のURLを取得する。
 * SNSシェアなどで、このツール自体のURLを入れたいときに使う。
 *
 * @returns {string} 現在のorigin + pathname
 */
function getAppShareUrl() {
  return `${location.origin}${location.pathname}`;
}

/**
 * テキスト内に含まれるURL数を数える。
 * X投稿文字数計算などで、URLを別扱いしたい場合に使う。
 *
 * @param {string} text - 判定対象のテキスト
 * @returns {number} 含まれるURLの数
 */
function countLinks(text) {
  const links = text.match(/https?:\/\/\S+/g);
  return links ? links.length : 0;
}

// ==================================================
// Utils: 日付・期間判定
// ==================================================

/**
 * 日付文字列をDateオブジェクトに変換する。
 * "YYYYMMDDhhmm" 形式、または Date が解釈できる文字列に対応する。
 *
 * @param {*} value - 日付として扱いたい値
 * @returns {Date|null} 変換できたDate。無効な場合はnull
 */
function parseDateTime(value) {
  // 未指定の場合は日付なしとして扱う
  if (!value) {
    return null;
  }

  const text = String(value);

  // スプレッドシート/JSONで使う YYYYMMDDhhmm 形式を個別にパースする
  if (/^\d{12}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));
    const hour = Number(text.slice(8, 10));
    const minute = Number(text.slice(10, 12));

    return new Date(year, month, day, hour, minute);
  }

  // それ以外はJavaScript標準のDateパースに任せる
  const date = new Date(text);

  // Dateとして解釈できない値はnullにする
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * 現在日時が指定期間内かどうかを判定する。
 * fromだけ、toだけ、両方指定のいずれにも対応する。
 *
 * @param {*} fromValue - 開始日時
 * @param {*} toValue - 終了日時
 * @returns {boolean} 現在日時が期間内ならtrue
 */
function isWithinPeriod(fromValue, toValue) {
  const now = new Date();
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  // 開始日時があり、現在が開始前なら表示対象外
  if (fromDate && now < fromDate) {
    return false;
  }

  // 終了日時があり、現在が終了後なら表示対象外
  if (toDate && now > toDate) {
    return false;
  }

  return true;
}

/**
 * Dateオブジェクトを MM/dd 形式に整形する。
 *
 * @param {Date} date - 整形対象の日付
 * @returns {string} MM/dd形式の文字列
 */
function formatMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

/**
 * タスク期限の日付表示を作る。
 * 日付が不正または未指定の場合は「期限未設定」を返す。
 *
 * @param {*} value - 期限日時
 * @returns {string} MM/dd形式、または期限未設定
 */
function formatTaskLimitDate(value) {
  const date = parseDateTime(value);

  // 日付に変換できない場合は期限未設定として表示する
  if (!date) {
    return "期限未設定";
  }

  return formatMonthDay(date);
}

/**
 * タスクの期間表示を作る。
 * from/toの両方が有効な場合のみ MM/dd〜MM/dd 形式で返す。
 *
 * @param {*} fromValue - 開始日時
 * @param {*} toValue - 終了日時
 * @returns {string} 期間表示、または期間未設定
 */
function formatTaskLimitRange(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  // この表示では開始・終了の両方がない場合は期間未設定にする
  if (!fromDate || !toDate) {
    return "期間未設定";
  }

  return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
}

/**
 * ホーム画面のお知らせ用の日付ラベルを作る。
 * releaseがある場合はreleaseを優先し、なければfrom/toの期間表示を使う。
 *
 * @param {Object} item - お知らせ情報
 * @returns {string} 日付ラベル
 */
function formatHomeInfoDateLabel(item) {
  // item自体がなければ表示なし
  if (!item) {
    return "";
  }

  const releaseDate = parseDateTime(item.release);

  // 公開日時がある場合は単日表示を優先する
  if (releaseDate) {
    return formatMonthDay(releaseDate);
  }

  // 公開日時がない場合は開始/終了期間からラベルを作る
  return formatHomeInfoPeriodLabel(item.from, item.to);
}

/**
 * ホーム画面のお知らせ用の期間ラベルを作る。
 * from/toの有無に応じて「MM/dd〜MM/dd」「MM/dd〜」「〜MM/dd」を返す。
 *
 * @param {*} fromValue - 開始日時
 * @param {*} toValue - 終了日時
 * @returns {string} 期間ラベル
 */
function formatHomeInfoPeriodLabel(fromValue, toValue) {
  const fromDate = parseDateTime(fromValue);
  const toDate = parseDateTime(toValue);

  // 開始・終了の両方がある場合
  if (fromDate && toDate) {
    return `${formatMonthDay(fromDate)}〜${formatMonthDay(toDate)}`;
  }

  // 開始だけある場合
  if (fromDate) {
    return `${formatMonthDay(fromDate)}〜`;
  }

  // 終了だけある場合
  if (toDate) {
    return `〜${formatMonthDay(toDate)}`;
  }

  return "";
}

// ==================================================
// Utils: YouTube
// ==================================================

/**
 * YouTubeのURLまたは動画IDから、11桁の動画IDを抽出する。
 * 通常URL、youtu.be、shorts、embed形式に対応する。
 *
 * @param {*} value - YouTube URLまたは動画ID
 * @returns {string} 抽出した動画ID。取得できない場合は空文字
 */
function extractYoutubeVideoId(value) {
  // 未指定の場合は抽出不可
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  // すでに11桁の動画IDだけが渡された場合
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const parsedUrl = new URL(text);

    // youtu.be/動画ID 形式
    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0];
    }

    // youtube.com/watch?v=動画ID 形式
    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    // youtube.com/shorts/動画ID 形式
    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    // youtube.com/embed/動画ID 形式
    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return "";
  } catch {
    // URLとして解釈できない文字列は動画IDなしとして扱う
    return "";
  }
}

/**
 * YouTube項目に表示するサムネイルURLを取得する。
 * thumbnail指定があれば優先し、なければstartmovie、最後にurlから生成する。
 *
 * @param {Object} item - YouTube項目
 * @returns {string} サムネイルURL。取得できない場合は空文字
 */
function getYoutubeThumbnailUrl(item) {
  // item自体がなければサムネイルなし
  if (!item) {
    return "";
  }

  // JSON側で明示指定されたサムネイルを最優先する
  if (item.thumbnail) {
    return item.thumbnail;
  }

  // プレイリスト等ではstartmovieをサムネイル生成元として使う
  const startMovieVideoId = extractYoutubeVideoId(item.startmovie);
  if (startMovieVideoId) {
    return `${YOUTUBE_THUMBNAIL_BASE_URL}${startMovieVideoId}/hqdefault.jpg`;
  }

  // 通常の動画URLから動画IDを取得する
  const videoId = extractYoutubeVideoId(item.url);
  if (!videoId) {
    return "";
  }

  return `${YOUTUBE_THUMBNAIL_BASE_URL}${videoId}/hqdefault.jpg`;
}

/**
 * YouTubeログ用のitemIdを生成する。
 * 動画IDが取れる場合は yt_動画ID、取れない場合はURLを安全な文字列に変換して使う。
 *
 * @param {Object} item - YouTube項目
 * @returns {string} ログ保存用のitemId
 */
function createYoutubeLogItemId(item) {
  // itemがない場合でもログ上で判別できるように固定値を返す
  if (!item) {
    return "yt_unknown";
  }

  // url優先、なければstartmovieから動画IDを取得する
  const videoId = extractYoutubeVideoId(item.url) || extractYoutubeVideoId(item.startmovie);

  if (videoId) {
    return `yt_${videoId}`;
  }

  // 動画IDが取れない場合はURLをログ用IDとして使える文字に変換する
  if (item.url) {
    return `yt_${String(item.url).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
  }

  return "yt_unknown";
}

// ==================================================
// Utils: UI補助
// ==================================================

/**
 * エラーメッセージを表示する。
 * 対象要素が存在しない場合は何もしない。
 *
 * @param {HTMLElement|null} element - エラー表示用の要素
 * @param {string} message - 表示するメッセージ
 */
function showError(element, message) {
  // 呼び出し元によっては要素が未取得の可能性があるため安全に抜ける
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

/**
 * エラーメッセージを非表示にする。
 * 対象要素が存在しない場合は何もしない。
 *
 * @param {HTMLElement|null} element - エラー表示用の要素
 */
function hideError(element) {
  // 呼び出し元によっては要素が未取得の可能性があるため安全に抜ける
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}

/**
 * 曲リストなどのコンテナ表示/非表示を切り替える。
 *
 * @param {HTMLElement|null} containerElement - 表示切り替え対象の要素
 * @param {boolean} shouldShow - 表示する場合true、非表示にする場合false
 */
function setSongListVisibility(containerElement, shouldShow) {
  // 対象要素がない場合は何もしない
  if (!containerElement) {
    return;
  }

  containerElement.classList.toggle("hidden", !shouldShow);
}

/**
 * ボタンの見た目を primary / gray / secondary に切り替える。
 * 未指定または想定外のstyleTypeの場合はsecondary扱いにする。
 *
 * @param {HTMLElement|null} buttonElement - 対象ボタン
 * @param {string} styleType - "primary"、"gray"、またはそれ以外
 */
function setButtonStyle(buttonElement, styleType) {
  // 対象ボタンがない場合は何もしない
  if (!buttonElement) {
    return;
  }

  // 既存のボタンスタイルを一度すべて外してから付け直す
  buttonElement.classList.remove("primary-button");
  buttonElement.classList.remove("secondary-button");
  buttonElement.classList.remove("gray-button");

  // メインアクション用のボタン表示
  if (styleType === "primary") {
    buttonElement.classList.add("primary-button");
    return;
  }

  // 操作済み・非強調などに使うグレー表示
  if (styleType === "gray") {
    buttonElement.classList.add("gray-button");
    return;
  }

  // デフォルトはサブアクション用のボタン表示
  buttonElement.classList.add("secondary-button");
}

// JSON内の改行表現を画面表示用の改行にそろえる
function normalizeDisplayNewlines(value) {
  return String(value || "").replaceAll("\\n", "\n");
}

// リクエストテキストランダム化
function pickRequestTextTemplate(value, requestType) {
  // 既存形式：文字列ならそのまま使う
  if (!Array.isArray(value)) {
    return String(value || "");
  }
  // 新形式：配列なら候補からランダム
  const candidates = value
    .map(text => String(text || "").trim())
    .filter(Boolean);
  if (candidates.length === 0) {
    return "";
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  // 連続で同じ文になりにくくする
  const storageKey = `lastRequestTextIndex_${requestType}`;
  const lastIndex = Number(localStorage.getItem(storageKey));
  let index = Math.floor(Math.random() * candidates.length);
  if (index === lastIndex) {
    index = (index + 1) % candidates.length;
  }
  localStorage.setItem(storageKey, String(index));
  return candidates[index];
}
