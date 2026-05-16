let reportData = null;
let rankingCharts = [];

const labels = Array.from({ length: 48 }, (_, i) => i + 1);

const rankingThemeMap = {
  variety: {
    color: "#0877df",
    labelClass: "blue",
    bgClass: "blue-bg"
  },
  overall: {
    color: "#ec2386",
    labelClass: "pink",
    bgClass: "pink-bg"
  }
};

const defaultRankingTheme = {
  color: "#0877df",
  labelClass: "blue",
  bgClass: "blue-bg"
};

async function initializeReport() {
  const response = await fetch("./tverRankingReport.json");
  const data = await response.json();

  reportData = data;
  renderReport(data);
  setupSaveImageButton();
}

function renderReport(data) {
  document.title = `${data.programTitle} ${data.broadcastDate}｜TVer 48時間ランキング推移レポート`;

  document.getElementById("programTitle").textContent = data.programTitle;
  document.getElementById("programMeta").innerHTML = `
    ${data.broadcastDate}　放送　（ <i class="ph ph-clock"></i> ${data.updatedAt}　更新 ）<br>
    ${data.subtitle}
  `;

  document.getElementById("likeCount").textContent = data.likes;
  document.getElementById("favoriteCount").textContent = data.favorites;

  destroyRankingCharts();

  renderRankCards(data.rankings);
  renderCharts(data.rankings);
  renderNearbyRankingTables(data.rankings);
}

function renderRankCards(rankings) {
  const container = document.getElementById("rankCards");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = rankings.map((ranking) => {
    const theme = getRankingTheme(ranking.type);

    return `
      <div class="card">
        <div class="label ${theme.labelClass}">${ranking.label}ランキング</div>
        <div class="rank-main" style="color:${theme.color};">
          ${ranking.currentRank}<span>位</span>
        </div>
        <div class="sub-rank ${theme.bgClass}">
          ${ranking.elapsedHour}時間目　${ranking.elapsedRank}　位
        </div>
      </div>
    `;
  }).join("");
}

function renderCharts(rankings) {
  const container = document.getElementById("charts");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = rankings.map((ranking, index) => {
    const theme = getRankingTheme(ranking.type);
    const canvasId = `rankingChart_${ranking.type || index}`;

    return `
      <div class="chart-box">
        <div class="chart-title ${theme.labelClass}">${ranking.label}</div>
        <div class="chart-canvas-wrap">
          <canvas id="${canvasId}"></canvas>
        </div>
      </div>
    `;
  }).join("");

  rankings.forEach((ranking, index) => {
    const theme = getRankingTheme(ranking.type);
    const canvasId = `rankingChart_${ranking.type || index}`;
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

function renderNearbyRankingTables(rankings) {
  const container = document.getElementById("nearbyRankingTables");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = rankings.map((ranking) => {
    const theme = getRankingTheme(ranking.type);

    return `
      <div>
        <div class="table-title ${theme.labelClass}">${ranking.label}すぐ上ランキング</div>
        <div>
          ${createNearbyRankingHtml(ranking.nearbyRanking)}
        </div>
      </div>
    `;
  }).join("");
}

function createNearbyRankingHtml(rankingList) {
  if (!Array.isArray(rankingList)) {
    return "";
  }

  return rankingList.map(item => `
    <div class="row">
      <span>${item.rank}</span>
      <span>${item.title}</span>
    </div>
  `).join("");
}

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

function getRankingTheme(type) {
  return rankingThemeMap[type] || defaultRankingTheme;
}

function destroyRankingCharts() {
  rankingCharts.forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  rankingCharts = [];
}

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

function setupSaveImageButton() {
  const button = document.getElementById("saveImageButton");

  if (!button) {
    return;
  }

  button.addEventListener("click", saveReportImage);
}

async function saveReportImage() {
  const target = document.getElementById("reportCaptureArea");

  if (!target || !reportData) {
    return;
  }

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
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

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "ランキング推移レポート",
          text: "ランキング推移レポート画像です"
        });
        return;
      } catch (error) {
        console.log("共有がキャンセルされました", error);
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

initializeReport();
