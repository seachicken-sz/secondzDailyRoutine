let reportData = null;
let varietyChart = null;
let overallChart = null;

const labels = Array.from({ length: 48 }, (_, i) => i + 1);

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

  document.getElementById("varietyCurrentRank").innerHTML =
    `${data.variety.currentRank}<span>位</span>`;
  document.getElementById("varietyElapsedRank").textContent =
    `${data.variety.elapsedHour}時間目　${data.variety.elapsedRank}　位`;

  document.getElementById("overallCurrentRank").innerHTML =
    `${data.overall.currentRank}<span>位</span>`;
  document.getElementById("overallElapsedRank").textContent =
    `${data.overall.elapsedHour}時間目　${data.overall.elapsedRank}　位`;

  document.getElementById("likeCount").textContent = data.likes;
  document.getElementById("favoriteCount").textContent = data.favorites;

  renderNearbyRanking("varietyNearbyRanking", data.variety.nearbyRanking);
  renderNearbyRanking("overallNearbyRanking", data.overall.nearbyRanking);

  if (varietyChart) {
    varietyChart.destroy();
  }

  if (overallChart) {
    overallChart.destroy();
  }

  varietyChart = createRankingChart(
    "varietyChart",
    data.variety.currentData,
    data.variety.previousData,
    "#0877df"
  );

  overallChart = createRankingChart(
    "overallChart",
    data.overall.currentData,
    data.overall.previousData,
    "#ec2386"
  );
}

function renderNearbyRanking(elementId, rankingList) {
  document.getElementById(elementId).innerHTML = rankingList.map(item => `
    <div class="row">
      <span>${item.rank}</span>
      <span>${item.title}</span>
    </div>
  `).join("");
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

  if (Array.isArray(previousData) && previousData.length > 0) {
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

  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

initializeReport();
