// ==============================
// TVerランキングレポート 表示用データ
// ==============================

// 現在表示中の番組レポートデータ
let reportData = null;

// JSON全体のデータ
// 複数番組対応の場合は reports を持つ
let reportBundle = null;

// Chart.jsで生成したグラフインスタンスを保持する配列
// 番組切り替え時にdestroyするために使う
let rankingCharts = [];

// グラフ横軸ラベル
// 1〜48時間目を表示する
const labels = Array.from({ length: 48 }, (_, i) => i + 1);

// ランキング種別ごとのテーマ設定
// 1つ目：青系、2つ目：ピンク系
const rankingThemes = [
  {
    color: "#0877df",
    labelClass: "blue",
    bgClass: "blue-bg"
  },
  {
    color: "#ec2386",
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

  // 画像共有ボタンのクリックイベントを設定
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
  document.title = `${data.programTitle} ${data.broadcastDate}｜TVer 48時間ランキング推移レポート`;

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

  // 各エリアを描画
  renderRankCards(data.rankings);
  renderCharts(data.rankings);
  renderNearbyRankingTables(data.rankings);
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
 * episodeId からTVerエピソードURLを生成する
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
 * 番組名をTVerで見よう！
 * https://tver.jp/episodes/epxxxxxxx
 */
function buildImageShareText() {
  if (!reportData) {
    return "";
  }

  const programTitle = reportData.programTitle || "";
  const episodeUrl = buildTverEpisodeUrl(reportData.episodeId || reportData.episodeUrl || "");

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
 * currentPoints の中から最高順位を取得する
 * 順位は数字が小さいほど良い
 */
function getBestRankInfoInPeriod(ranking) {
  if (!ranking || !Array.isArray(ranking.currentPoints)) {
    return {
      rank: ranking && ranking.currentRank !== undefined ? ranking.currentRank : null,
      hour: ranking && ranking.elapsedHour !== undefined ? ranking.elapsedHour : null
    };
  }

  const validPoints = ranking.currentPoints
    .map((point) => ({
      hour: Number(point.hour),
      rank: Number(point.rank)
    }))
    .filter((point) =>
      Number.isFinite(point.hour) &&
      Number.isFinite(point.rank)
    );

  if (validPoints.length === 0) {
    return {
      rank: ranking.currentRank !== undefined ? ranking.currentRank : null,
      hour: ranking.elapsedHour !== undefined ? ranking.elapsedHour : null
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
 * 最高順位カードを描画する
 */
function renderRankCards(rankings) {
  const container = document.getElementById("rankCards");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = rankings.map((ranking, index) => {
    const theme = getRankingThemeByIndex(index);
    const bestRankInfo = getBestRankInfoInPeriod(ranking);

    return `
      <div class="card">
        <div class="label ${theme.labelClass}">${escapeHtml(ranking.label || "")}ランキング</div>
        <div class="rank-main" style="color:${theme.color};">
          ${formatRank(bestRankInfo.rank)}<span>位</span>
        </div>
        <div class="sub-rank ${theme.bgClass}">
          ${formatRank(bestRankInfo.hour)}時間目
        </div>
      </div>
    `;
  }).join("");
}


// ==============================
// グラフ描画
// ==============================

/**
 * ランキンググラフエリアを描画する
 */
function renderCharts(rankings) {
  const container = document.getElementById("charts");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  // canvas要素を生成
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

    const currentData = convertPointsTo48HourData(ranking.currentPoints);
    const previousData = convertPointsTo48HourData(ranking.previousPoints);

    const chart = createRankingChart(
      canvasId,
      currentData,
      previousData,
      theme.color
    );

    rankingCharts.push(chart);
  });
}

/**
 * ranking points を48時間分の配列に変換する
 *
 * Chart.js用：
 * [
 *   1時間目の順位,
 *   2時間目の順位,
 *   ...
 * ]
 *
 * データがない時間は null
 */
function convertPointsTo48HourData(points) {
  const data = Array(48).fill(null);

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

    if (hour < 0 || hour >= 48) {
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
 * Chart.jsでランキング推移グラフを作成する
 */
function createRankingChart(canvasId, currentData, previousData, color) {
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
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      resizeDelay: 100,
      scales: {
        y: {
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
            callback: function(value) {
              return value;
            }
          }
        },
        x: {
          border: {
            display: false
          },
          grid: {
            display: false,
            drawTicks: false
          },
          ticks: {
            maxTicksLimit: 8,
            padding: 6
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
// すぐ上ランキング描画
// ==============================

/**
 * すぐ上ランキングテーブルを描画する
 */
function renderNearbyRankingTables(rankings) {
  const container = document.getElementById("nearbyRankingTables");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

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
 * - 画像ファイル + テキストを共有
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

    // 共有時のテキスト用
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
