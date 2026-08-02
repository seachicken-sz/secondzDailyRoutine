"use strict";

function clearChartTooltip(chart) {
  chart.setActiveElements([]);

  if (chart.tooltip) {
    if (typeof chart.tooltip.setActiveElements === "function") {
      chart.tooltip.setActiveElements([], { x: 0, y: 0 });
    }
    chart.tooltip.opacity = 0;
  }

  chart.update("none");
}

exportChartImage = function exportChartImageWithoutTooltipOrStretch({ chart, title, fileName }) {
  const sourceCanvas = chart?.canvas;
  if (!sourceCanvas) return;

  clearChartTooltip(chart);

  const surface = sourceCanvas.parentElement;
  const displayState = {
    wasLarge: surface?.classList.contains("is-large") || false,
    width: surface?.style.width || "",
    minWidth: surface?.style.minWidth || "",
    height: surface?.style.height || "",
  };

  if (surface) {
    surface.classList.add("is-large");
    surface.style.width = "920px";
    surface.style.minWidth = "920px";
    surface.style.height = "360px";
  }

  chart.resize(920, 360);
  clearChartTooltip(chart);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = IMAGE_WIDTH;
  outputCanvas.height = IMAGE_HEIGHT;

  const context = outputCanvas.getContext("2d");
  if (!context) {
    restoreChartDisplay(chart, surface, displayState);
    return;
  }

  const shareText = getChartShareText(chart, title);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  context.fillStyle = "#222222";
  context.font = '700 34px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(shareText, IMAGE_WIDTH / 2, 50, IMAGE_WIDTH - 80);

  const visibleDatasets = chart.data.datasets.filter((dataset, index) => chart.isDatasetVisible(index));
  drawImageLegend(context, visibleDatasets, 56, 88, IMAGE_WIDTH - 112);

  const chartTop = visibleDatasets.length > 4 ? 170 : 138;
  const areaX = 40;
  const areaY = chartTop;
  const areaWidth = IMAGE_WIDTH - 80;
  const areaHeight = IMAGE_HEIGHT - chartTop - 44;
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

  const dataUrl = outputCanvas.toDataURL("image/png");
  restoreChartDisplay(chart, surface, displayState);

  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName, { type: "image/png" });
  const button = chart === state.periodChart ? el.periodImageButton : el.historyImageButton;

  let canShareFile = false;
  try {
    canShareFile = typeof navigator.share === "function"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [file] });
  } catch (error) {
    console.warn("File sharing capability check failed.", error);
  }

  if (!canShareFile) {
    downloadChartImage(dataUrl, fileName);
    return;
  }

  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }

  navigator.share({
    title: shareText,
    text: shareText,
    files: [file],
  }).catch((error) => {
    if (error?.name !== "AbortError") {
      console.warn("Image sharing failed. Falling back to download.", error);
      downloadChartImage(dataUrl, fileName);
    }
  }).finally(() => {
    if (button) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });
};

function moveLatestRankBlock(panelId) {
  const panel = document.getElementById(panelId);
  const summary = panel?.querySelector(".summary-grid-current");
  const chartSection = panel?.querySelector(".chart-card-section");
  if (!panel || !summary || !chartSection) return;

  const dividerBeforeSummary = summary.previousElementSibling;
  panel.insertBefore(summary, chartSection);

  if (dividerBeforeSummary?.classList.contains("section-divider")) {
    panel.insertBefore(dividerBeforeSummary, chartSection);
  }

  summary.setAttribute("aria-label", "最新順位");
  const label = summary.querySelector(".current-rank-block > span");
  if (label) label.textContent = "最新順位";
}

document.addEventListener("DOMContentLoaded", () => {
  moveLatestRankBlock("periodPanel");
  moveLatestRankBlock("songPanel");
});
