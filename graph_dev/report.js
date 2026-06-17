// ==============================
// TVerランキングレポート 表示用データ
// ==============================

// 現在表示中の番組レポートデータ
// 画像保存・共有時のファイル名や共有テキスト生成にも使う
let reportData = null;

// JSON全体のデータ
// 複数番組対応の場合は reports を持つ
let reportBundle = null;

// Chart.jsで生成したグラフインスタンスを保持する配列
// 番組切り替え時に古いグラフをdestroyするために使う
let rankingCharts = [];

// JSON再取得時にURLへ付与するキャッシュ回避用パラメータ
let reportJsonCacheBust = "";


// ==============================
// ランキング表示テーマ
// ==============================

// ランキング種別ごとのテーマ設定
// 1つ目：青系、2つ目：ピンク系
const rankingThemes = [
  {
    color: "#0877df",
    previousColor: "#b8c9d9",
    labelClass: "blue",
    bgClass: "blue-bg"
  },
  {
    color: "#ec2386",
    previousColor: "#d9bcc9",
    labelClass: "pink",
    bgClass: "pink-bg"
  }
];

// テーマが取れなかった場合のデフォルト
const defaultRankingTheme = rankingThemes[0];


// ==============================
// 汎用関数
// ==============================

/**
 * ランキング表示用テーマをindexから取得する
 * 想定外のindexの場合はデフォルトテーマを返す
 */
function getRankingThemeByIndex(index) {
  return rankingThemes[index] || defaultRankingTheme;
}

/**
 * 順位表示用フォーマット
 * null / undefined / 空文字の場合は "-" を表示する
 */
function formatRank(rank) {
  return rank === null || rank === undefined || rank === ""
    ? "-"
    : rank;
}

/**
 * 表示用の数値を3桁区切りにする
 *
 * 例：
 * 1672 → 1,672
 * 12000 → 12,000
 * "1.1万" のような表示文字列はそのまま返す
 */
function formatDisplayNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const text = String(value).trim();

  // 「1.1万」「75.4万」など、数字以外を含む表示文字列はそのまま返す
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return text;
  }

  const number = Number(text);

  if (!Number.isFinite(number)) {
    return text;
  }

  return number.toLocaleString("ja-JP");
}

/**
 * HTMLに埋め込む文字列をエスケープする
 * innerHTMLで文字列を入れる箇所の安全対策
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 有効な数値に変換する
 */
function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/**
 * 指定points内で、hourが最大の数値pointを取得する
 */
function getLatestNumericPoint(points, valueKey) {
  if (!Array.isArray(points)) {
    return null;
  }

  return points.reduce((latestPoint, point) => {
    const hour = getFiniteNumber(point.hour);
    const value = getFiniteNumber(point[valueKey]);

    if (hour === null || value === null) {
      return latestPoint;
    }

    if (!latestPoint || hour > latestPoint.hour) {
      return {
        hour,
        value
      };
    }

    return latestPoint;
  }, null);
}

/**
 * 指定hourの数値pointを取得する
 */
function getNumericPointByHour(points, valueKey, targetHour) {
  if (!Array.isArray(points)) {
    return null;
  }

  const foundPoint = points.find((point) => {
    return getFiniteNumber(point.hour) === targetHour;
  });

  if (!foundPoint) {
    return null;
  }

  const value = getFiniteNumber(foundPoint[valueKey]);

  if (value === null) {
    return null;
  }

  return {
    hour: targetHour,
    value
  };
}

/**
 * 最新hourと1時間前の差分を取得する
 */
function getLatestDiffFromPreviousHour(points, valueKey) {
  const latestPoint = getLatestNumericPoint(points, valueKey);

  if (!latestPoint) {
    return null;
  }

  const previousPoint = getNumericPointByHour(
    points,
    valueKey,
    latestPoint.hour - 1
  );

  if (!previousPoint) {
    return null;
  }

  return latestPoint.value - previousPoint.value;
}

/**
 * ランキングが1時間前より上がっている場合だけUP文言を返す
 * 順位は数字が小さいほど良いので、前回 - 最新 がプラスなら上昇
 */
function getRankUpText(ranking) {
  if (!ranking || !Array.isArray(ranking.currentPoints)) {
    return "";
  }

  const latestPoint = getLatestNumericPoint(ranking.currentPoints, "rank");

  if (!latestPoint) {
    return "";
  }

  const previousPoint = getNumericPointByHour(
    ranking.currentPoints,
    "rank",
    latestPoint.hour - 1
  );

  if (!previousPoint) {
    return "";
  }

  const rankUp = previousPoint.value - latestPoint.value;

  if (rankUp <= 0) {
    return "";
  }

  return `↑${rankUp}位UP!`;
}

/**
 * 正の差分だけ + 表示にする
 */
function getPositiveDiffText(diff) {
  if (diff === null || diff === undefined || diff <= 0) {
    return "";
  }

  return `＋${formatDisplayNumber(diff)}`;
}


// ==============================
// 48時間 / 7日間 判定
// ==============================

/**
 * 48時間 / 7日間の切り替え判定
 *
 * latest/currentPoints だけを見る。
 * previousPoints に48時間以降のデータがあっても、それだけでは7日間扱いにしない。
 */
function getReportChartHours(rankings) {
  if (!Array.isArray(rankings)) {
    return 48;
  }

  const hasCurrentOver48HourPoint = rankings.some((ranking) => {
    const points = Array.isArray(ranking.currentPoints)
      ? ranking.currentPoints
      : [];

    return points.some((point) => {
      const hour = Number(point.hour);

      return Number.isFinite(hour) && hour >= 48;
    });
  });

  return hasCurrentOver48HourPoint ? 168 : 48;
}

/**
 * 指定期間内の最高順位を取得する
 * 順位は数字が小さいほど良い
 */
function getBestRankInfoInPeriod(points, chartHours) {
  if (!Array.isArray(points)) {
    return {
      rank: null,
      hour: null
    };
  }

  const validPoints = points
    .map((point) => ({
      hour: Number(point.hour),
      rank: Number(point.rank)
    }))
    .filter((point) =>
      Number.isInteger(point.hour) &&
      point.hour >= 0 &&
      point.hour < chartHours &&
      Number.isFinite(point.rank)
    );

  if (validPoints.length === 0) {
    return {
      rank: null,
      hour: null
    };
  }

  return validPoints.reduce((bestPoint, currentPoint) => {
    if (currentPoint.rank < bestPoint.rank) {
      return currentPoint;
    }

    return bestPoint;
  });
}

/**
 * ランキングに入っていた時間数を取得する
 * currentPoints / previousPoints の存在するhour数を維持時間として数える
 */
function getRankInDurationHours(points, chartHours) {
  const data = convertPointsToHourData(points, chartHours);

  return data.filter((rank) => rank !== null).length;
}

/**
 * 1つのランキング種別に最新話ランキングデータがあるか判定する
 *
 * currentPoints に点がある場合だけ「データあり」。
 * previousPoints だけに点がある場合は、前回比較用データは存在しても
 * 最新話ランキングなしとして表示対象にしない。
 */
function hasRankingData(ranking) {
  if (!ranking) {
    return false;
  }

  const currentPoints = Array.isArray(ranking.currentPoints)
    ? ranking.currentPoints
    : [];

  return currentPoints.length > 0;
}

/**
 * rankings 全体に1件でも最新話ランキングデータがあるか判定する
 *
 * false の場合だけ、
 * rankCards / ランキング推移 / すぐ上ランキングをまとめて非表示にする。
 */
function hasAnyRankingData(rankings) {
  return Array.isArray(rankings) && rankings.some(hasRankingData);
}

/**
 * 現時点でランキング圏内か判定する
 *
 * currentRank が数値なら、最新取得時点でランクイン中とみなす。
 * currentPoints が過去にあっても、currentRank が null なら現時点では圏外扱い。
 */
function isCurrentlyRanked(ranking) {
  if (!ranking) {
    return false;
  }

  const currentRank = Number(ranking.currentRank);

  return Number.isFinite(currentRank);
}


// ==============================
// 初期化処理
// ==============================

/**
 * 初期表示を行う
 *
 * 通常読み込み：
 * - ../graph/tverRankingReport.json を取得
 *
 * 更新ボタン押下時：
 * - loadReportData(true) で cacheBust を付けて再取得
 */
async function initializeReport() {
  try {
    await loadReportData(false);
  } catch (error) {
    console.error(error);
    alert("レポートデータの読み込みに失敗しました。");
  }

  // 画像保存・共有ボタンのクリックイベントを設定
  setupSaveImageButton();

  // JSON再読み込みボタンのクリックイベントを設定
  setupReloadDataButton();
}

/**
 * レポートJSONを読み込み、画面に反映する
 *
 * forceReload=true の場合：
 * - URLに時刻パラメータを付与
 * - fetchのcache指定を no-store にする
 */
async function loadReportData(forceReload = false) {
  if (forceReload) {
    reportJsonCacheBust = String(Date.now());
  }

  const jsonUrl = reportJsonCacheBust
    ? `../graph/tverRankingReport.json?cacheBust=${encodeURIComponent(reportJsonCacheBust)}`
    : "../graph/tverRankingReport.json";

  const response = await fetch(jsonUrl, {
    cache: forceReload ? "no-store" : "default"
  });

  if (!response.ok) {
    throw new Error(`JSONの読み込みに失敗しました: ${response.status}`);
  }

  const data = await response.json();

  // 単一番組JSON / 複数番組JSONの差を吸収する
  reportBundle = normalizeReportBundle(data);

  // URLパラメータ id があればその番組を初期表示
  const selectedProgramId = getInitialProgramId(reportBundle.reports);

  // 番組選択プルダウンを生成
  setupProgramSelect(reportBundle.reports, selectedProgramId);

  // 選択中の番組レポートを描画
  renderSelectedReport(selectedProgramId);
}

/**
 * JSON形式を統一する
 *
 * 複数番組形式：
 * {
 *   updatedAt: "...",
 *   reports: {
 *     srxxxx: {...}
 *   }
 * }
 *
 * 単一番組形式：
 * {
 *   programTitle: "...",
 *   rankings: [...]
 * }
 */
function normalizeReportBundle(data) {
  if (data && data.reports && typeof data.reports === "object") {
    return data;
  }

  return {
    updatedAt: data && data.updatedAt ? data.updatedAt : "",
    reports: {
      sample: data
    }
  };
}

/**
 * 初期表示する番組IDを決める
 * 優先順位：
 * 1. URLパラメータ ?id=xxx
 * 2. reportsの先頭
 */
function getInitialProgramId(reports) {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");

  if (requestedId && reports[requestedId]) {
    return requestedId;
  }

  return Object.keys(reports)[0] || "";
}

/**
 * 番組選択プルダウンをセットアップする
 */
function setupProgramSelect(reports, selectedProgramId) {
  const select = document.getElementById("programSelect");

  if (!select) {
    return;
  }

  const entries = Object.entries(reports);

  select.innerHTML = entries.map(([programId, report]) => {
    const selected = programId === selectedProgramId ? "selected" : "";

    return `
      <option value="${escapeHtml(programId)}" ${selected}>
        ${escapeHtml(report.programTitle || programId)}
      </option>
    `;
  }).join("");

  // 再読み込み時にchangeイベントが二重登録されないよう、古いイベントを置き換える
  select.onchange = () => {
    const nextProgramId = select.value;
    updateUrlProgramId(nextProgramId);
    renderSelectedReport(nextProgramId);
  };
}

/**
 * 指定された番組IDのレポートを表示する
 */
function renderSelectedReport(programId) {
  if (!reportBundle || !reportBundle.reports) {
    return;
  }

  const data = reportBundle.reports[programId];

  if (!data) {
    return;
  }

  // 画像共有時にも使うため、現在表示中データとして保持
  reportData = data;

  renderReport(data);
}

/**
 * URLのidパラメータを現在選択中の番組IDに更新する
 * ページリロードはしない
 */
function updateUrlProgramId(programId) {
  const url = new URL(window.location.href);
  url.searchParams.set("id", programId);
  history.replaceState(null, "", url.toString());
}


// ==============================
// レポート描画処理
// ==============================

/**
 * レポート全体を描画する
 */
function renderReport(data) {
  const chartHours = getReportChartHours(data.rankings);
  const isLongReport = chartHours > 48;
  const reportLabel = isLongReport
    ? "TVer 7日間ランキング推移レポート"
    : "TVer 48時間ランキング推移レポート";
  const chartTitle = "ランキング推移";

  document.title = `${data.programTitle || ""} ${data.broadcastDate || ""}｜${reportLabel}`;

  const report = document.getElementById("reportCaptureArea");
  const reportTopBar = document.getElementById("reportTopBar");
  const chartSectionTitle = document.getElementById("chartSectionTitle");

  // 7日間表示かどうかでCSSを切り替える
  if (report) {
    report.classList.toggle("is-long-report", isLongReport);
  }

  // 上部バーの文言を48時間 / 7日間で切り替える
  if (reportTopBar) {
    reportTopBar.textContent = reportLabel;
  }

  // グラフセクション見出し
  if (chartSectionTitle) {
    chartSectionTitle.textContent = chartTitle;
  }

  document.getElementById("programTitle").textContent = data.programTitle || "";

  document.getElementById("programMeta").innerHTML = `
    ${data.broadcastDate || ""} 放送　${data.subtitle || ""}<br>
    （ <i class="ph ph-clock"></i> ${data.updatedAt || ""} 更新 ）
  `;

  document.getElementById("likeCount").textContent = formatDisplayNumber(data.likes);
  document.getElementById("favoriteCount").textContent = formatDisplayNumber(data.favorites);

  // TVer最新話リンクを描画
  renderNewEpisodeLink(data);

  // 番組切り替え時に古いグラフを破棄
  destroyRankingCharts();

  const hasAnyRankings = hasAnyRankingData(data.rankings);

  // 全ランキング種別にデータがない場合だけ、ランキング関連エリアを非表示にする
  toggleRankingSections(hasAnyRankings);

  if (hasAnyRankings) {
    // 1種でもランキングデータがある場合は、全ランキング種別をそのまま描画する
    // 片方だけデータなしの場合、ない方は -位 / 空グラフ / 空テーブルとして残る
    renderRankCards(data.rankings, chartHours);
    renderCharts(data.rankings, chartHours);
    renderBottomSection(data.rankings, chartHours);
  } else {
    // 全部ない場合は、古い描画内容が残らないように中身も消す
    clearRankingSections();
  }

  // footerより上に、いいね数推移グラフを追加
  // ランキングが全部なくても、likePoints があれば表示する
  renderLikeTimelineSection(data.likePoints, chartHours);

  // 2枚目プレビューを描画する
  renderCurrentRankingPreview(data);
}

/**
 * ランキング関連セクションの表示/非表示を切り替える
 *
 * 全ランキング種別にデータがない場合だけ非表示。
 * 片方のランキング種別だけデータがない場合は非表示にしない。
 */
function toggleRankingSections(shouldShow) {
  const rankCards = document.getElementById("rankCards");

  // HTML側に id="rankingChartSection" がある場合はそれを優先する。
  // なければ、既存HTML向けに #charts の直近の .chart-section を探す。
  const charts = document.getElementById("charts");
  const chartSection = document.getElementById("rankingChartSection") ||
    (charts ? charts.closest(".chart-section") : null);

  // HTML側に id="rankingTableSection" がある場合はそれを優先する。
  // なければ、既存HTML向けに #nearbyRankingTables の直近の .table-section を探す。
  const nearbyRankingTables = document.getElementById("nearbyRankingTables");
  const tableSection = document.getElementById("rankingTableSection") ||
    (nearbyRankingTables ? nearbyRankingTables.closest(".table-section") : null);

  if (rankCards) {
    rankCards.style.display = shouldShow ? "" : "none";
  }

  if (chartSection) {
    chartSection.style.display = shouldShow ? "" : "none";
  }

  if (tableSection) {
    tableSection.style.display = shouldShow ? "" : "none";
  }
}

/**
 * ランキング関連の中身を空にする
 *
 * 非表示にするだけでも見た目は消えるが、
 * 番組切り替え時に古いHTMLが残らないよう中身も消す。
 */
function clearRankingSections() {
  const rankCards = document.getElementById("rankCards");
  const charts = document.getElementById("charts");
  const nearbyRankingTables = document.getElementById("nearbyRankingTables");

  if (rankCards) {
    rankCards.innerHTML = "";
  }

  if (charts) {
    charts.innerHTML = "";
  }

  if (nearbyRankingTables) {
    nearbyRankingTables.innerHTML = "";
  }
}

/**
 * 最新話を見るリンクを描画する
 */
function renderNewEpisodeLink(data) {
  const linkArea = document.getElementById("newEpisodeLink");

  if (!linkArea) {
    return;
  }

  const episodeId = data.episodeId || "";

  if (!episodeId) {
    linkArea.innerHTML = "";
    return;
  }

  const episodeUrl = buildTverEpisodeUrl(episodeId);
  const linkText = `${data.programTitle || ""} ${data.subtitle || ""}`.trim();

  linkArea.innerHTML = `
    <a href="${escapeHtml(episodeUrl)}" target="_blank" rel="noopener noreferrer">
      ${escapeHtml(linkText || "最新話を見る")}
    </a>
  `;
}

/**
 * episodeId / episodeUrl からTVerエピソードURLを生成する
 *
 * 対応形式：
 * - epxxxx
 * - episodes/epxxxx
 * - https://tver.jp/episodes/epxxxx
 */
function buildTverEpisodeUrl(episodeId) {
  const value = String(episodeId || "").trim();

  if (!value) {
    return "";
  }

  // すでにURLならそのまま使う
  if (/^https?:\/\//.test(value)) {
    return value;
  }

  // episodes/ から始まる場合
  if (value.startsWith("episodes/")) {
    return `https://tver.jp/${encodeURI(value)}`;
  }

  // episodeIdのみの場合
  return `https://tver.jp/episodes/${encodeURIComponent(value)}`;
}


// ==============================
// 画像共有テキスト生成
// ==============================

/**
 * 画像共有ボタン押下時に使う共有テキストを生成する
 *
 * 出力例：
 * タイムレスマン
 * バラエティ12位
 * いいね数：12,345
 * TVerで見よう！
 * https://tver.jp/episodes/epxxxx
 */
function buildImageShareText() {
  if (!reportData) {
    return "";
  }

  const programTitle = reportData.programTitle || "";
  const episodeUrl = buildTverEpisodeUrl(reportData.episodeUrl || reportData.episodeId || "");
  const rankingLines = buildCurrentRankingShareLines();
  const likeLine = buildLikeShareLine();

  const lines = [];

  if (programTitle) {
    lines.push(programTitle);
  }

  if (rankingLines.length > 0) {
    lines.push(...rankingLines);
  }

  if (likeLine) {
    lines.push(likeLine);
  }

  lines.push("TVerで見よう！");

  if (episodeUrl) {
    lines.push(episodeUrl);
  }

  return lines.join("\n");
}

function buildCurrentRankingShareLines() {
  if (!reportData || !Array.isArray(reportData.rankings)) {
    return [];
  }

  const activeRankings = reportData.rankings
    .filter((ranking) => {
      const currentRank = getFiniteNumber(ranking && ranking.currentRank);

      return currentRank !== null && currentRank > 0 && currentRank <= 50;
    })
    .map((ranking) => {
      const label = ranking.label || ranking.type || "ランキング";
      return `${label}${ranking.currentRank}位`;
    });

  if (activeRankings.length === 0) {
    return [];
  }

  return activeRankings.map((text, index) => {
    return index === activeRankings.length - 1
      ? `${text}！`
      : text;
  });
}

function buildLikeShareLine() {
  if (!reportData) {
    return "";
  }

  const likes = reportData.likes;

  if (likes === null || likes === undefined || likes === "") {
    return "";
  }

  return `いいね数：${formatDisplayNumber(likes)}`;
}

/**
 * Web Share APIに渡すタイトルを生成する
 */
function buildImageShareTitle() {
  if (!reportData || !reportData.programTitle) {
    return "TVerで見よう！";
  }

  return `${reportData.programTitle}をTVerで見よう！`;
}


// ==============================
// 最高順位カード描画
// ==============================

/**
 * 最高順位カードを描画する
 */
function renderRankCards(rankings, chartHours = 48) {
  const container = document.getElementById("rankCards");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  const isLongReport = chartHours > 48;

  container.innerHTML = rankings.map((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const currentBest = getBestRankInfoInPeriod(ranking.currentPoints, chartHours);

    // 7日間表示では、最高順位カードに前回最高順位も表示する
    if (isLongReport) {
      const previousBest = getBestRankInfoInPeriod(ranking.previousPoints, chartHours);

      return `
        <div class="card">
          <div class="label ${theme.labelClass}">${escapeHtml(ranking.label || "")}ランキング</div>
          <div class="rank-main" style="color:${theme.color};">
            ${formatRank(currentBest.rank)}<span>位</span>
          </div>
          <div class="sub-rank ${theme.bgClass}">
            前回　${formatRank(previousBest.rank)}位
          </div>
        </div>
      `;
    }

    // 48時間表示では、最高順位の時間を表示する
    return `
      <div class="card">
        <div class="label ${theme.labelClass}">${escapeHtml(ranking.label || "")}ランキング</div>
        <div class="rank-main" style="color:${theme.color};">
          ${formatRank(currentBest.rank)}<span>位</span>
        </div>
        <div class="sub-rank ${theme.bgClass}">
          到達：${formatRank(currentBest.hour)}時間目
        </div>
      </div>
    `;
  }).join("");
}


// ==============================
// ランキンググラフ描画
// ==============================

/**
 * ランキンググラフエリアを描画する
 */
function renderCharts(rankings, chartHours = 48) {
  const container = document.getElementById("charts");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  // 7日間表示では、ランキング種別を1つのグラフに統合する
  if (chartHours > 48) {
    container.innerHTML = `
      <div class="chart-box chart-box-wide">
        <div class="chart-title combined-chart-title">ランキング推移</div>
        <div class="chart-canvas-wrap-wide">
          <canvas id="rankingChart_combined"></canvas>
        </div>
      </div>
    `;

    const chart = createCombinedRankingChart(
      "rankingChart_combined",
      rankings,
      chartHours
    );

    rankingCharts.push(chart);
    return;
  }

  // 48時間表示では、ランキング種別ごとにグラフを分ける
  container.innerHTML = rankings.map((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const canvasId = `rankingChart_${index}`;

    return `
      <div class="chart-box">
        <div class="chart-title ${theme.labelClass}">${escapeHtml(ranking.label || "")}</div>
        <div class="chart-canvas-wrap">
          <canvas id="${canvasId}"></canvas>
        </div>
      </div>
    `;
  }).join("");

  // Chart.jsでグラフを生成
  rankings.forEach((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const canvasId = `rankingChart_${index}`;
    const currentData = convertPointsToHourData(ranking.currentPoints, chartHours);
    const previousData = convertPointsToHourData(ranking.previousPoints, chartHours);

    const chart = createRankingChart(
      canvasId,
      currentData,
      previousData,
      theme.color,
      chartHours
    );

    rankingCharts.push(chart);
  });
}

/**
 * すぐ上ランキング / 維持時間エリアを描画する
 *
 * 48時間表示：
 * - 現時点でランキング圏内のものだけ、すぐ上ランキングを表示する
 * - すぐ上ランキング対象が1件もない場合は、エリアごと非表示にする
 *
 * 7日間表示：
 * - すぐ上ランキングではなく、ランクイン維持時間を表示する
 */
function renderBottomSection(rankings, chartHours = 48) {
  const container = document.getElementById("nearbyRankingTables");

  if (!container) {
    return;
  }

  const tableSection = document.getElementById("rankingTableSection") ||
    container.closest(".table-section");

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";

    if (tableSection) {
      tableSection.style.display = "none";
    }

    return;
  }

  // 7日間表示では、すぐ上ランキングではなく維持時間を表示する
  if (chartHours > 48) {
    if (tableSection) {
      tableSection.style.display = "";
    }

    container.className = "duration-cards";

    container.innerHTML = rankings.map((ranking, index) => {
      const theme = getRankingThemeByIndex(index);
      const currentDuration = getRankInDurationHours(ranking.currentPoints, chartHours);
      const previousDuration = getRankInDurationHours(ranking.previousPoints, chartHours);

      return `
        <div class="duration-card">
          <div class="duration-title ${theme.labelClass}">
            ${escapeHtml(ranking.label || "")}維持時間
          </div>
          <div class="duration-main">
            ${currentDuration}時間
          </div>
          <div class="duration-sub">
            前回　${previousDuration}時間
          </div>
        </div>
      `;
    }).join("");

    return;
  }

  // 48時間表示では、現時点でランキング圏内かつ nearbyRanking があるものだけ表示する
  const currentRankedEntries = rankings
    .map((ranking, index) => ({
      ranking,
      index
    }))
    .filter(({ ranking }) => {
      return isCurrentlyRanked(ranking) &&
        Array.isArray(ranking.nearbyRanking) &&
        ranking.nearbyRanking.length > 0;
    });

  container.className = "tables";

  // すぐ上ランキングが1件もない場合は、白背景エリアごと非表示
  if (currentRankedEntries.length === 0) {
    container.innerHTML = "";

    if (tableSection) {
      tableSection.style.display = "none";
    }

    return;
  }

  // すぐ上ランキングがある場合だけ、エリアを表示
  if (tableSection) {
    tableSection.style.display = "";
  }

  container.innerHTML = currentRankedEntries.map(({ ranking, index }) => {
    const theme = getRankingThemeByIndex(index);

    return `
      <div>
        <div class="table-title ${theme.labelClass}">${escapeHtml(ranking.label || "")}すぐ上ランキング</div>
        <div>
          ${createNearbyRankingHtml(ranking.nearbyRanking)}
        </div>
      </div>
    `;
  }).join("");
}

/**
 * すぐ上ランキングのHTMLを生成する
 */
function createNearbyRankingHtml(rankingList) {
  if (!Array.isArray(rankingList)) {
    return "";
  }

  return rankingList.map(item => `
    <div class="row">
      <span>${formatRank(item.rank)}</span>
      <span>${escapeHtml(item.title || "")}</span>
    </div>
  `).join("");
}

/**
 * ranking points を指定時間分の配列に変換する
 *
 * Chart.js用：
 * [
 *   0時間目の順位,
 *   1時間目の順位,
 *   ...
 * ]
 *
 * データがない時間は null
 */
function convertPointsToHourData(points, chartHours) {
  const data = Array(chartHours).fill(null);

  if (!Array.isArray(points)) {
    return data;
  }

  points.forEach((point) => {
    const hour = Number(point.hour);
    const rank = point.rank === null || point.rank === undefined
      ? null
      : Number(point.rank);

    if (!Number.isInteger(hour)) {
      return;
    }

    if (hour < 0 || hour >= chartHours) {
      return;
    }

    data[hour] = Number.isFinite(rank) ? rank : null;
  });

  return data;
}

/**
 * 既存のChart.jsインスタンスを破棄する
 * 番組切り替え時に古いグラフが残るのを防ぐ
 */
function destroyRankingCharts() {
  rankingCharts.forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  rankingCharts = [];
}

/**
 * Chart.jsで48時間用ランキング推移グラフを作成する
 */
function createRankingChart(canvasId, currentData, previousData, color, chartHours) {
  const chartLabels = Array.from({ length: chartHours }, (_, i) => i + 1);

  const datasets = [
    {
      label: "最新回",
      data: currentData,
      borderColor: color,
      backgroundColor: color,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 2,
      borderWidth: 1.5,
      spanGaps: false
    }
  ];

  // 前回データがある場合のみ追加
  if (Array.isArray(previousData) && previousData.some(value => value !== null)) {
    datasets.push({
      label: "前回",
      data: previousData,
      borderColor: "#aab3bd",
      backgroundColor: "#aab3bd",
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 2,
      borderWidth: 1.5,
      spanGaps: false
    });
  }

  return new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels: chartLabels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      resizeDelay: 100,
      scales: {
        y: {
          title: {
            display: false
          },
          reverse: true,
          min: 1,
          max: 50,
          border: {
            display: false
          },
          grid: {
            display: true,
            color: "#e5edf5",
            drawTicks: false
          },
          ticks: {
            stepSize: 10,
            padding: 8,
            font: {
              size: 10
            },
            callback: function(value) {
              return `${value}位`;
            }
          }
        },
        x: {
          title: {
            display: true,
            text: "経過時間",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              top: 6
            }
          },
          border: {
            display: false
          },
          grid: {
            display: false,
            drawTicks: false
          },
          ticks: {
            maxTicksLimit: 8,
            padding: 6,
            font: {
              size: 10
            },
            callback: function(value, index) {
              const hour = index + 1;

              return `${hour}h`;
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

/**
 * Chart.jsで7日間用の統合ランキング推移グラフを作成する
 *
 * 前回線を先に追加し、最新回線を後から追加することで、
 * 最新回線を見やすくする
 */
function createCombinedRankingChart(canvasId, rankings, chartHours) {
  const chartLabels = Array.from({ length: chartHours }, (_, i) => i + 1);
  const datasets = [];

  // 前回データを先に追加
  rankings.forEach((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const previousData = convertPointsToHourData(ranking.previousPoints, chartHours);

    if (previousData.some(value => value !== null)) {
      datasets.push({
        label: `${ranking.label || `ランキング${index + 1}`} 前回`,
        data: previousData,
        borderColor: theme.previousColor,
        backgroundColor: theme.previousColor,
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.2,
        spanGaps: false,
        order: 2
      });
    }
  });

  // 最新回データを後から追加
  rankings.forEach((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const currentData = convertPointsToHourData(ranking.currentPoints, chartHours);

    if (currentData.some(value => value !== null)) {
      datasets.push({
        label: `${ranking.label || `ランキング${index + 1}`} 最新回`,
        data: currentData,
        borderColor: theme.color,
        backgroundColor: theme.color,
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 2,
        spanGaps: false,
        order: 1
      });
    }
  });

  return new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels: chartLabels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.15,
      resizeDelay: 100,
      scales: {
        y: {
          title: {
            display: false
          },
          reverse: true,
          min: 1,
          max: 50,
          border: {
            display: false
          },
          grid: {
            display: true,
            color: "#e5edf5",
            drawTicks: false
          },
          ticks: {
            stepSize: 10,
            padding: 8,
            font: {
              size: 10
            },
            callback: function(value) {
              return `${value}`;
            }
          }
        },
        x: {
          title: {
            display: true,
            text: "経過日数",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              top: 6
            }
          },
          border: {
            display: false
          },
          grid: {
            display: true,
            color: function(context) {
              const hour = context.index + 1;

              return hour % 24 === 0 ? "#e5edf5" : "transparent";
            },
            drawTicks: false
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 6,
            font: {
              size: 10
            },
            callback: function(value, index) {
              const hour = index + 1;

              return hour % 24 === 0 ? `${hour / 24}日目` : "";
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            padding: 12,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}


// ==============================
// いいね数推移グラフ描画
// ==============================

/**
 * いいね数推移セクション
 *
 * reportCaptureArea内のfooterより上に差し込む。
 * chart-sectionクラスを使い、他のグラフエリアと同じ白背景にする。
 */
function renderLikeTimelineSection(likePoints, chartHours = 48) {
  let container = document.getElementById("likeTimelineSection");

  if (!container) {
    const report = document.getElementById("reportCaptureArea");

    if (!report) {
      return;
    }

    container = document.createElement("section");
    container.id = "likeTimelineSection";
    container.className = "chart-section like-timeline-section";

    // footerより上に挿入する
    const footer = report.querySelector("footer, .footer, #footer, .report-footer");

    if (footer) {
      report.insertBefore(container, footer);
    } else {
      report.appendChild(container);
    }
  }

  // いいね時系列がない場合は、空グラフを出さずに非表示
  if (!Array.isArray(likePoints) || likePoints.length === 0) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }

  container.style.display = "";

  container.innerHTML = `
    <div class="section-title">いいね数推移</div>

    <div class="chart-box like-chart-box">
      <div class="like-chart-canvas-wrap">
        <canvas id="likeTimelineChart"></canvas>
      </div>
    </div>
  `;

  const likeData = convertLikePointsToHourData(likePoints, chartHours);

  const chart = createLikeTimelineChart(
    "likeTimelineChart",
    likeData,
    chartHours
  );

  rankingCharts.push(chart);
}

/**
 * likePoints をChart.js用の配列に変換する
 *
 * JSON形式：
 * [
 *   { hour: 0, likes: 1200 },
 *   { hour: 1, likes: 1300 }
 * ]
 */
function convertLikePointsToHourData(points, chartHours) {
  const data = Array(chartHours).fill(null);

  if (!Array.isArray(points)) {
    return data;
  }

  points.forEach((point) => {
    const hour = Number(point.hour);
    const likes = point.likes === null || point.likes === undefined
      ? null
      : Number(point.likes);

    if (!Number.isInteger(hour)) {
      return;
    }

    if (hour < 0 || hour >= chartHours) {
      return;
    }

    data[hour] = Number.isFinite(likes) ? likes : null;
  });

  return data;
}

/**
 * Chart.jsでいいね数推移グラフを作成する
 *
 * maintainAspectRatio:false にして、
 * CSSの .like-chart-canvas-wrap の高さを優先する。
 */
function createLikeTimelineChart(canvasId, likeData, chartHours) {
  const chartLabels = Array.from({ length: chartHours }, (_, i) => i + 1);

  return new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "",
          data: likeData,
          borderColor: "#36bfd0",
          backgroundColor: "#36bfd0",
          tension: 0.32,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      layout: {
        padding: {
          top: 6,
          right: 8,
          bottom: 0,
          left: 0
        }
      },
      scales: {
        y: {
          title: {
            display: false
          },
          beginAtZero: false,
          border: {
            display: false
          },
          grid: {
            display: true,
            color: "#e5edf5",
            drawTicks: false
          },
          ticks: {
            maxTicksLimit: 5,
            padding: 8,
            font: {
              size: 10
            },
            callback: function(value) {
              return formatDisplayNumber(value);
            }
          }
        },
        x: {
          title: {
            display: true,
            text: chartHours > 48 ? "経過日数" : "経過時間",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              top: 6
            }
          },
          border: {
            display: false
          },
          grid: {
            display: false,
            drawTicks: false
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 3,
            font: {
              size: 10
            },
            callback: function(value, index) {
              const hour = index + 1;

              if (chartHours > 48) {
                return hour % 24 === 0 ? `${hour / 24}日` : "";
              }

              if (hour === 1 || hour % 12 === 0 || hour === chartHours) {
                return `${hour}h`;
              }

              return "";
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}


// ==============================
// 2枚目 現在ランキングプレビュー描画
// ==============================

/**
 * 2枚目画像に表示する項目を作る
 *
 * 表示対象：
 * - currentRankが1〜50位のランキングだけ
 * - likesが存在する場合だけ
 * - favoritesが存在する場合だけ
 *
 * 差分：
 * - ランキングは1時間前より上がっている場合だけ ↑n位UP!
 * - いいね数は1時間前より増えている場合だけ ＋n
 * - お気に入り数は favoritePoints が存在し、1時間前より増えている場合だけ ＋n
 */
function buildCurrentRankingSummaryItems(data) {
  const items = [];

  if (Array.isArray(data.rankings)) {
    data.rankings.forEach((ranking) => {
      if (!ranking) {
        return;
      }

      const currentRank = getFiniteNumber(ranking.currentRank);

      // currentRank がない / 0以下 / 50位より下は2枚目には出さない
      if (currentRank === null || currentRank <= 0 || currentRank > 50) {
        return;
      }

      const label = ranking.label || ranking.type || "ランキング";
      const diffText = getRankUpText(ranking);

      items.push({
        kind: "ranking",
        label,
        value: `${formatDisplayNumber(currentRank)}位`,
        diffText
      });
    });
  }

  if (data.likes !== null && data.likes !== undefined && data.likes !== "") {
    const likeDiff = getLatestDiffFromPreviousHour(data.likePoints, "likes");

    items.push({
      kind: "metric",
      label: "いいね数",
      value: formatDisplayNumber(data.likes),
      diffText: getPositiveDiffText(likeDiff)
    });
  }

  if (data.favorites !== null && data.favorites !== undefined && data.favorites !== "") {
    const favoriteDiff = getLatestDiffFromPreviousHour(data.favoritePoints, "favorites");

    items.push({
      kind: "metric",
      label: "お気に入り数",
      value: formatDisplayNumber(data.favorites),
      diffText: getPositiveDiffText(favoriteDiff)
    });
  }

  return items;
}

/**
 * 2枚目画像用DOMを生成する
 */
function createCurrentRankingSummaryElement(data) {
  const items = buildCurrentRankingSummaryItems(data);

  const rankingItems = items.filter((item) => {
    return item.kind === "ranking";
  });

  const metricItems = items.filter((item) => {
    return item.kind === "metric";
  });

  const element = document.createElement("div");
  element.className = "current-ranking-capture-area";

  const programMetaLines = [
    `${data.broadcastDate || ""} 放送　${data.subtitle || ""}`.trim(),
    data.updatedAt ? `（ ${data.updatedAt} 更新 ）` : ""
  ].filter(Boolean);

  element.innerHTML = `
    <div class="top-bar">
      TVer現在のランキング
    </div>

    <div class="current-ranking-body">
      <div class="current-ranking-program-box">
        <h1 class="current-ranking-program-title">
          ${escapeHtml(data.programTitle || "")}
        </h1>

        <div class="current-ranking-program-meta">
          ${programMetaLines.map((line) => escapeHtml(line)).join("<br>")}
        </div>
      </div>

      ${rankingItems.length > 0 ? `
        <div class="current-ranking-section-title">
          ランキング
        </div>

        <div class="current-ranking-cards">
          ${rankingItems.map((item, index) => {
            const theme = getRankingThemeByIndex(index);
            const rankText = String(item.value || "").replace("位", "");

            return `
              <div class="card">
                <div class="label ${theme.labelClass}">
                  ${escapeHtml(item.label)}
                </div>

                <div class="rank-main" style="color:${theme.color};">
                  ${escapeHtml(rankText)}<span>位</span>
                </div>

                <div class="sub-rank ${theme.bgClass}">
                  ${item.diffText ? escapeHtml(item.diffText) : "現在ランクイン中"}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : ""}

      ${metricItems.length > 0 ? `
        <div class="current-ranking-section-title">
          反応数
        </div>
      
        <div class="current-ranking-metrics">
          ${metricItems.map((item) => `
            <div class="current-ranking-metric-card">
              <div class="current-ranking-metric-label">
                ${escapeHtml(item.label)}
              </div>
      
              <div class="current-ranking-metric-value-wrap">
                <div class="current-ranking-metric-value">
                  ${escapeHtml(item.value)}
                </div>
      
                ${item.diffText ? `
                  <div class="current-ranking-metric-diff">
                    ${escapeHtml(item.diffText)}
                  </div>
                ` : `
                  <div class="current-ranking-metric-sub">
                    現在
                  </div>
                `}
              </div>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div class="current-ranking-footer">
        データ出典：TVer　※1時間ごと更新
      </div>
    </div>
  `;

  return element;
}

/**
 * 2枚目プレビューを画面に描画する
 */
function renderCurrentRankingPreview(data) {
  const preview = document.getElementById("currentRankingPreview");
  const previewSection = document.getElementById("currentRankingPreviewSection");

  if (!preview) {
    return;
  }

  if (!data) {
    preview.innerHTML = "";

    if (previewSection) {
      previewSection.style.display = "none";
    }

    return;
  }

  const element = createCurrentRankingSummaryElement(data);

  preview.innerHTML = "";
  preview.appendChild(element);

  if (previewSection) {
    previewSection.style.display = "";
  }
}


// ==============================
// JSON再読み込み処理
// ==============================

/**
 * JSON再読み込みボタンのイベントを設定する
 *
 * HTML側に以下のボタンがある前提：
 * <button id="reloadDataButton" class="reload-data-button" type="button"><i class="bi bi-arrow-clockwise"></i></button>
 */
function setupReloadDataButton() {
  const button = document.getElementById("reloadDataButton");

  if (!button) {
    return;
  }

  button.addEventListener("click", async () => {
    button.classList.add("is-loading");
    button.innerHTML = '<i class="bi bi-arrow-repeat"></i>'; // 更新中

    try {
      await loadReportData(true);
      button.innerHTML = '<i class="bi bi-check-lg"></i>'; // 更新済み
    } catch (error) {
      console.error(error);
      button.innerHTML = '<i class="bi bi-x-lg"></i>'; // 失敗
      alert("データの更新に失敗しました。時間を置いて再試行してください。");
    } finally {
      setTimeout(() => {
        button.classList.remove("is-loading");
        button.innerHTML = '<i class="bi bi-arrow-clockwise"></i>'; // 元の更新に戻す
      }, 1200);
    }
  });
}


// ==============================
// 画像保存・共有処理
// ==============================

/**
 * 画像共有ボタンのイベントを設定する
 */
function setupSaveImageButton() {
  const button = document.getElementById("saveImageButton");

  if (!button) {
    return;
  }

  button.addEventListener("click", saveReportImage);
}

/**
 * canvasをpng blobへ変換する
 */
function canvasToPngBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

/**
 * 指定要素をPNG Blobに変換する
 */
async function captureElementToPngBlob(target, options = {}) {
  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    width: 760,
    windowWidth: 760,
    ...options
  });

  return canvasToPngBlob(canvas);
}

/**
 * 一時DOMを画面外でPNG Blobに変換する
 * プレビューHTMLがない場合の保険用
 */
async function captureTemporaryElementToPngBlob(element) {
  const wrapper = document.createElement("div");

  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "760px";
  wrapper.style.zIndex = "-1";
  wrapper.appendChild(element);

  document.body.appendChild(wrapper);

  try {
    return await captureElementToPngBlob(element);
  } finally {
    wrapper.remove();
  }
}

/**
 * Blobをファイルとしてダウンロードする
 */
function downloadBlobAsFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * レポート部分を画像化して共有する
 *
 * 共有対応端末：
 * - 1枚目：既存レポート画像
 * - 2枚目：現在ランキング画像
 *
 * 共有非対応端末：
 * - PNGとして2枚ダウンロード
 */
async function saveReportImage() {
  const target = document.getElementById("reportCaptureArea");

  if (!target || !reportData) {
    return;
  }

  const safeBaseFileName = `${reportData.programTitle}_${reportData.broadcastDate}_ranking-report`
    .replace(/[\\/:*?"<>|]/g, "-");

  const mainBlob = await captureElementToPngBlob(target, {
    onclone: (clonedDocument) => {
      const clonedTarget = clonedDocument.getElementById("reportCaptureArea");

      if (clonedTarget) {
        clonedTarget.classList.add("is-capturing");
      }
    }
  });

  if (!mainBlob) {
    return;
  }

  let summaryTarget = document.querySelector("#currentRankingPreview .current-ranking-capture-area");
  let summaryBlob = null;

  if (!summaryTarget) {
    renderCurrentRankingPreview(reportData);
    summaryTarget = document.querySelector("#currentRankingPreview .current-ranking-capture-area");
  }

  if (summaryTarget) {
    summaryBlob = await captureElementToPngBlob(summaryTarget);
  } else {
    const summaryElement = createCurrentRankingSummaryElement(reportData);
    summaryBlob = await captureTemporaryElementToPngBlob(summaryElement);
  }

  if (!summaryBlob) {
    return;
  }

  const mainFile = new File([mainBlob], `${safeBaseFileName}.png`, {
    type: "image/png"
  });

  const summaryFile = new File([summaryBlob], `${safeBaseFileName}_current-ranking.png`, {
    type: "image/png"
  });

  const files = [
    mainFile,
    summaryFile
  ];

  const shareTitle = buildImageShareTitle();
  const shareText = buildImageShareText();

  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({
        files,
        title: shareTitle,
        text: shareText
      });
      return;
    } catch (error) {
      console.log("共有がキャンセルされました", error);
      return;
    }
  }

  downloadBlobAsFile(mainBlob, `${safeBaseFileName}.png`);
  downloadBlobAsFile(summaryBlob, `${safeBaseFileName}_current-ranking.png`);
}


// ==============================
// 実行開始
// ==============================

initializeReport();
