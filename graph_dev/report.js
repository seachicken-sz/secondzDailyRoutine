let reportData = null;
let reportBundle = null;
let rankingCharts = [];

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

const defaultRankingTheme = rankingThemes[0];

function getRankingThemeByIndex(index) {
  return rankingThemes[index] || defaultRankingTheme;
}

function formatRank(rank) {
  return rank === null || rank === undefined || rank === ""
    ? "-"
    : rank;
}

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

function getRankInDurationHours(points, chartHours) {
  const data = convertPointsToHourData(points, chartHours);

  return data.filter((rank) => rank !== null).length;
}

async function initializeReport() {
  const response = await fetch("./tverRankingReport.json");
  const data = await response.json();

  reportBundle = normalizeReportBundle(data);

  const selectedProgramId = getInitialProgramId(reportBundle.reports);

  setupProgramSelect(reportBundle.reports, selectedProgramId);
  renderSelectedReport(selectedProgramId);
  setupSaveImageButton();
}

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

function getInitialProgramId(reports) {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");

  if (requestedId && reports[requestedId]) {
    return requestedId;
  }

  return Object.keys(reports)[0] || "";
}

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

  select.addEventListener("change", () => {
    const nextProgramId = select.value;
    updateUrlProgramId(nextProgramId);
    renderSelectedReport(nextProgramId);
  });
}

function renderSelectedReport(programId) {
  if (!reportBundle || !reportBundle.reports) {
    return;
  }

  const data = reportBundle.reports[programId];

  if (!data) {
    return;
  }

  reportData = data;
  renderReport(data);
}

function updateUrlProgramId(programId) {
  const url = new URL(window.location.href);
  url.searchParams.set("id", programId);
  history.replaceState(null, "", url.toString());
}

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

  if (report) {
    report.classList.toggle("is-long-report", isLongReport);
  }

  if (reportTopBar) {
    reportTopBar.textContent = reportLabel;
  }

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

  renderNewEpisodeLink(data);

  destroyRankingCharts();

  renderRankCards(data.rankings, chartHours);
  renderCharts(data.rankings, chartHours);
  renderBottomSection(data.rankings, chartHours);
}

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

function buildTverEpisodeUrl(episodeId) {
  const value = String(episodeId || "").trim();

  if (!value) {
    return "";
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  if (value.startsWith("episodes/")) {
    return `https://tver.jp/${encodeURI(value)}`;
  }

  return `https://tver.jp/episodes/${encodeURIComponent(value)}`;
}

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

function renderCharts(rankings, chartHours = 48) {
  const container = document.getElementById("charts");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

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

function renderBottomSection(rankings, chartHours = 48) {
  const container = document.getElementById("nearbyRankingTables");

  if (!container) {
    return;
  }

  if (!Array.isArray(rankings)) {
    container.innerHTML = "";
    return;
  }

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

function destroyRankingCharts() {
  rankingCharts.forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  rankingCharts = [];
}

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

function createCombinedRankingChart(canvasId, rankings, chartHours) {
  const chartLabels = Array.from({ length: chartHours }, (_, i) => i + 1);
  const datasets = [];

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
    backgroundColor: null,
    width: 760,
    windowWidth: 760,
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

initializeReport();
