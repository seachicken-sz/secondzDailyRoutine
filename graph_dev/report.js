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
 * 1つのランキング種別にランキングデータがあるか判定する
 *
 * currentPoints または previousPoints のどちらかに点があれば「データあり」。
 * 片方だけ空の場合は、そのランキング種別自体は表示対象として残す。
 */
function hasRankingData(ranking) {
  if (!ranking) {
    return false;
  }

  const currentPoints = Array.isArray(ranking.currentPoints)
    ? ranking.currentPoints
    : [];

  const previousPoints = Array.isArray(ranking.previousPoints)
    ? ranking.previousPoints
    : [];

  return currentPoints.length > 0 || previousPoints.length > 0;
}

/**
 * rankings 全体に1件でもランキングデータがあるか判定する
 *
 * false の場合だけ、
 * rankCards / ランキング推移 / すぐ上ランキングをまとめて非表示にする。
 */
function hasAnyRankingData(rankings) {
  return Array.isArray(rankings) && rankings.some(hasRankingData);
}


// ==============================
// 初期化処理
// ==============================

/**
 * レポートJSONを読み込み、初期表示を行う
 */
async function initializeReport() {
  const response = await fetch("./tverRankingReport.json");
  const data = await response.json();

  // 単一番組JSON / 複数番組JSONの差を吸収する
  reportBundle = normalizeReportBundle(data);

  // URLパラメータ id があればその番組を初期表示
  const selectedProgramId = getInitialProgramId(reportBundle.reports);

  // 番組選択プルダウンを生成
  setupProgramSelect(reportBundle.reports, selectedProgramId);

  // 選択中の番組レポートを描画
  renderSelectedReport(selectedProgramId);

  // 画像保存・共有ボタンのクリックイベントを設定
  setupSaveImageButton();
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

  // プルダウン変更時にURLと表示内容を更新
  select.addEventListener("change", () => {
    const nextProgramId = select.value;
    updateUrlProgramId(nextProgramId);
    renderSelectedReport(nextProgramId);
  });
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
  const chartTitle = isLongReport
    ? "ランキング推移（7日間）"
    : "ランキング推移（48時間）";

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

  // グラフセクション見出しを48時間 / 7日間で切り替える
  if (chartSectionTitle) {
    chartSectionTitle.textContent = chartTitle;
  }

  document.getElementById("programTitle").textContent = data.programTitle || "";

  document.getElementById("programMeta").innerHTML = `
    ${data.broadcastDate || ""}　放送　（ <i class="ph ph-clock"></i> ${data.updatedAt || ""}　更新 ）<br>
    ${data.subtitle || ""}
  `;

  document.getElementById("likeCount").textContent = data.likes || "";
  document.getElementById("favoriteCount").textContent = data.favorites || "";

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
 * タイムレスマンをTVerで見よう！
 * https://tver.jp/episodes/epqhlsu653
 */
function buildImageShareText() {
  if (!reportData) {
    return "";
  }

  const programTitle = reportData.programTitle || "";
  const episodeUrl = buildTverEpisodeUrl(reportData.episodeUrl || reportData.episodeId || "");

  // URLが取れない場合でも番組名だけは共有できるようにする
  if (!episodeUrl) {
    return `${programTitle}をTVerで見よう！`;
  }

  return `${programTitle}をTVerで見よう！\n${episodeUrl}`;
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
          ${formatRank(currentBest.hour)}時間目
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
 * - すぐ上ランキング
 *
 * 7日間表示：
 * - ランクイン維持時間
 */
function renderBottomSection(rankings, chartHours = 48) {
  const container = document.getElementById("nearbyRankingTables");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  // 7日間表示では、すぐ上ランキングではなく維持時間を表示する
  if (chartHours > 48) {
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

  // 48時間表示では、すぐ上ランキングを表示する
  container.className = "tables";

  container.innerHTML = rankings.map((ranking, index) => {
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
      spanGaps: true
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
      spanGaps: true
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
            display: true,
            text: "順位",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              bottom: 6
            }
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
        spanGaps: true,
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
        spanGaps: true,
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
            display: true,
            text: "順位",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              bottom: 6
            }
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

              return hour % 24 === 0 ? `${hour}` : "";
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
          label: "いいね数",
          data: likeData,
          borderColor: "#ff9f1c",
          backgroundColor: "#ff9f1c",
          tension: 0.32,
          pointRadius: 2,
          pointHoverRadius: 3,
          borderWidth: 2,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,

      // CSS側の高さを使う。横伸び・縦潰れ対策。
      maintainAspectRatio: false,

      resizeDelay: 100,
      layout: {
        padding: {
          top: 6,
          right: 8,
          bottom: 0,
          left: 4
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "いいね数",
            font: {
              size: 11,
              weight: "600"
            },
            padding: {
              bottom: 6
            }
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
              return formatCompactNumber(value);
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
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 6,
            font: {
              size: 10
            },
            callback: function(value, index) {
              const hour = index + 1;

              if (chartHours > 48) {
                return hour % 24 === 0 ? `${hour}h` : "";
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

/**
 * 大きな数値をグラフ軸表示用に短くする
 *
 * 例：
 * 12000 → 1.2万
 * 9500 → 9500
 */
function formatCompactNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  if (number >= 10000) {
    const man = number / 10000;

    return `${Number.isInteger(man) ? man : man.toFixed(1)}万`;
  }

  return String(Math.round(number));
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
 * レポート部分を画像化して共有する
 *
 * 共有対応端末：
 * - 画像ファイル + 番組名 + TVer URL を共有
 *
 * 共有非対応端末：
 * - PNGとしてダウンロード
 */
async function saveReportImage() {
  const target = document.getElementById("reportCaptureArea");

  if (!target || !reportData) {
    return;
  }

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    width: 760,
    windowWidth: 760,

    // キャプチャ時だけ見た目調整用classを付与する
    onclone: (clonedDocument) => {
      const clonedTarget = clonedDocument.getElementById("reportCaptureArea");

      if (clonedTarget) {
        clonedTarget.classList.add("is-capturing");
      }
    }
  });

  const fileName = `${reportData.programTitle}_${reportData.broadcastDate}_ranking-report.png`
    .replace(/[\\/:*?"<>|]/g, "-");

  canvas.toBlob(async (blob) => {
    if (!blob) {
      return;
    }

    const file = new File([blob], fileName, {
      type: "image/png"
    });

    // 共有時のタイトル・本文
    const shareTitle = buildImageShareTitle();
    const shareText = buildImageShareText();

    // Web Share APIで画像共有できる場合
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText
        });
        return;
      } catch (error) {
        // ユーザーが共有をキャンセルした場合もここに来る
        console.log("共有がキャンセルされました", error);
        return;
      }
    }

    // 画像共有に対応していない環境では画像をダウンロードする
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.download = fileName;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }, "image/png");
}


// ==============================
// 実行開始
// ==============================

initializeReport();
