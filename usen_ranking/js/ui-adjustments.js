"use strict";

const baseRenderPeriodForUi = renderPeriod;
renderPeriod = function renderPeriodWithCurrentRankOnly() {
  baseRenderPeriodForUi();

  const data = state.currentData;
  if (!data) return;

  const start = formatDateTime(data.period.startAt);
  const end = formatDateTime(data.period.endAt);
  const latest = formatDateTime(data.latestCapturedAt);
  el.periodDescription.replaceChildren();
  el.periodDescription.append(document.createTextNode(`${start} 〜 ${end}`));
  el.periodDescription.append(document.createElement("br"));
  el.periodDescription.append(document.createTextNode(`最終取得 ${latest}`));
  el.periodTopRankSub.textContent = `最終取得 ${latest}`;
};

const baseRenderHistoryForUi = renderHistory;
renderHistory = function renderHistoryWithLatestCapturedAt() {
  baseRenderHistoryForUi();

  const activeWeek = state.historyWeeks && state.historyWeeks[0];
  if (!activeWeek) return;

  const latest = formatDateTime(activeWeek.data.latestCapturedAt || activeWeek.song.lastSeenAt);
  el.historyLatestRankSub.textContent = `最終取得 ${latest}`;
};

const baseExportChartImageForUi = exportChartImage;
exportChartImage = function exportChartImageWithCorrectAspect({ chart, title, fileName }) {
  if (!chart || !chart.canvas) return;

  const sourceCanvas = chart.canvas;
  const visibleDatasets = chart.data.datasets.filter((dataset, index) => chart.isDatasetVisible(index));
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#222222";
  context.font = '700 34px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title, IMAGE_WIDTH / 2, 50, IMAGE_WIDTH - 80);

  drawImageLegend(context, visibleDatasets, 56, 88, IMAGE_WIDTH - 112);

  const chartTop = visibleDatasets.length > 4 ? 176 : 142;
  const areaX = 42;
  const areaY = chartTop;
  const areaWidth = IMAGE_WIDTH - 84;
  const areaHeight = IMAGE_HEIGHT - chartTop - 42;
  const sourceRatio = sourceCanvas.width / sourceCanvas.height;
  const areaRatio = areaWidth / areaHeight;

  let drawWidth = areaWidth;
  let drawHeight = areaHeight;
  let drawX = areaX;
  let drawY = areaY;

  if (sourceRatio > areaRatio) {
    drawHeight = areaWidth / sourceRatio;
    drawY += (areaHeight - drawHeight) / 2;
  } else {
    drawWidth = areaHeight * sourceRatio;
    drawX += (areaWidth - drawWidth) / 2;
  }

  context.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);

  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

function setupLargeChartButton(buttonId, surfaceId, chartName) {
  const button = document.getElementById(buttonId);
  const surface = document.getElementById(surfaceId);
  if (!button || !surface) return;

  button.addEventListener("click", () => {
    const large = surface.classList.toggle("is-large");
    button.textContent = large ? "通常表示" : "大きく表示";

    const chart = state[chartName];
    if (chart) {
      requestAnimationFrame(() => chart.resize());
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLargeChartButton("periodLargeButton", "periodChartSurface", "periodChart");
  setupLargeChartButton("historyLargeButton", "historyChartSurface", "historyChart");
});
