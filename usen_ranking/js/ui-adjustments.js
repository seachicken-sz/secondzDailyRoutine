"use strict";

const basePopulateSongsForUi = populateSongs;
populateSongs = function populateSongsByLatestRankIn() {
  const songs = new Map();

  for (const data of state.cache.values()) {
    for (const song of data.songs) {
      const key = songKey(song);
      const lastPointAt = song.points.length
        ? song.points[song.points.length - 1].capturedAt
        : "";
      const lastSeenAt = song.lastSeenAt || lastPointAt || "";
      const previous = songs.get(key);

      if (!previous || compareRankInDate(lastSeenAt, previous.lastSeenAt) > 0) {
        songs.set(key, {
          title: song.songTitle || song.songId,
          lastSeenAt,
        });
      }
    }
  }

  el.historySongSelect.replaceChildren();

  [...songs.entries()]
    .sort((a, b) => {
      const dateCompare = compareRankInDate(b[1].lastSeenAt, a[1].lastSeenAt);
      if (dateCompare !== 0) return dateCompare;
      return a[1].title.localeCompare(b[1].title, "ja");
    })
    .forEach(([key, song]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = song.title;
      el.historySongSelect.append(option);
    });

  state.historySongKey = state.historySongKey && songs.has(state.historySongKey)
    ? state.historySongKey
    : (el.historySongSelect.options[0]?.value || "");

  el.historySongSelect.value = state.historySongKey;
};

function compareRankInDate(a, b) {
  const aTime = Date.parse(a || "") || 0;
  const bTime = Date.parse(b || "") || 0;
  return aTime - bTime;
}

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

exportChartImage = async function exportChartImageAsLarge({ chart, title, fileName }) {
  if (!chart || !chart.canvas) return;

  const sourceCanvas = chart.canvas;
  const surface = sourceCanvas.parentElement;
  const wasLarge = surface?.classList.contains("is-large") || false;
  const previousWidth = surface?.style.width || "";
  const previousMinWidth = surface?.style.minWidth || "";
  const previousHeight = surface?.style.height || "";

  if (surface) {
    surface.classList.add("is-large");
    surface.style.width = "920px";
    surface.style.minWidth = "920px";
    surface.style.height = "360px";
  }

  chart.resize(920, 360);
  await waitForChartFrame();

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

  if (surface) {
    if (!wasLarge) surface.classList.remove("is-large");
    surface.style.width = previousWidth;
    surface.style.minWidth = previousMinWidth;
    surface.style.height = previousHeight;
  }

  requestAnimationFrame(() => chart.resize());
};

function waitForChartFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function updateLargeChartButton(button, large) {
  const icon = button.querySelector("i");
  const label = large ? "通常表示" : "大きく表示";

  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);

  if (icon) {
    icon.className = large
      ? "bi bi-arrows-angle-contract"
      : "bi bi-arrows-angle-expand";
  }
}

function setupLargeChartButton(buttonId, surfaceId, chartName) {
  const button = document.getElementById(buttonId);
  const surface = document.getElementById(surfaceId);
  if (!button || !surface) return;

  updateLargeChartButton(button, false);

  button.addEventListener("click", () => {
    const large = surface.classList.toggle("is-large");
    updateLargeChartButton(button, large);

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
