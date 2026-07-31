"use strict";

function formatPeriodStartLabel(value) {
  return `${formatDateKey(value)}～`;
}

populatePeriods = function populatePeriodsWithCompactLabels() {
  el.periodSelect.replaceChildren();

  state.files.forEach((file) => {
    const option = document.createElement("option");
    option.value = fileKey(file);
    option.textContent = formatPeriodStartLabel(file.date);
    el.periodSelect.append(option);
  });
};

function renderSeriesControlsV2(container, items, onChange) {
  container.replaceChildren();

  const header = document.createElement("div");
  header.className = "series-control-header";

  const allLabel = document.createElement("label");
  allLabel.className = "series-all";

  const allInput = document.createElement("input");
  allInput.type = "checkbox";
  allInput.checked = true;

  const allText = document.createElement("span");
  allText.textContent = "すべて表示";
  allLabel.append(allInput, allText);
  header.append(allLabel);

  const list = document.createElement("div");
  list.className = "series-list";

  items.forEach((item) => {
    const label = document.createElement("label");
    label.className = "series-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.value = item.id;

    const dot = document.createElement("span");
    dot.className = "series-dot";
    dot.style.background = item.color;

    const text = document.createElement("span");
    text.textContent = item.label;

    input.addEventListener("change", () => {
      syncAllCheckbox(allInput, list);
      onChange();
    });

    label.append(input, dot, text);
    list.append(label);
  });

  allInput.addEventListener("change", () => {
    list.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = allInput.checked;
    });
    allInput.indeterminate = false;
    onChange();
  });

  const toggleButton = document.createElement("button");
  toggleButton.className = "series-toggle series-toggle-bottom is-hidden";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", "系列をすべて表示");
  toggleButton.setAttribute("title", "系列をすべて表示");
  toggleButton.innerHTML = '<i class="bi bi-chevron-down" aria-hidden="true"></i>';

  toggleButton.addEventListener("click", () => {
    const expanded = container.classList.toggle("is-expanded");
    const label = expanded ? "系列を折り畳む" : "系列をすべて表示";
    toggleButton.setAttribute("aria-label", label);
    toggleButton.setAttribute("title", label);
    toggleButton.innerHTML = expanded
      ? '<i class="bi bi-chevron-up" aria-hidden="true"></i>'
      : '<i class="bi bi-chevron-down" aria-hidden="true"></i>';
  });

  container.append(header, list, toggleButton);

  requestAnimationFrame(() => {
    const styles = getComputedStyle(list);
    const columns = styles.gridTemplateColumns.split(" ").filter(Boolean).length;
    const rowCount = columns > 0 ? Math.ceil(items.length / columns) : items.length;
    const collapsible = rowCount >= 2 && items.length > columns;

    container.classList.toggle("is-collapsible", collapsible);
    container.classList.remove("is-expanded");
    toggleButton.classList.toggle("is-hidden", !collapsible);
  });
}

renderSeriesControls = renderSeriesControlsV2;

renderPeriodTable = function renderCompactPeriodTable() {
  el.periodTableBody.replaceChildren();

  state.currentData.songs.forEach((song) => {
    const row = document.createElement("tr");
    if (Number.isFinite(song.currentRank) && song.currentRank >= 1 && song.currentRank <= 20) {
      row.classList.add("is-top20");
    }

    const nameCell = document.createElement("td");
    nameCell.className = "song-name";

    if (song.url) {
      const link = document.createElement("a");
      link.href = song.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = song.songTitle || song.songId;
      nameCell.append(link);
    } else {
      nameCell.textContent = song.songTitle || song.songId;
    }

    const values = [song.currentRank, song.bestRank, song.worstRank];
    row.append(nameCell);

    values.forEach((rank) => {
      const cell = document.createElement("td");
      cell.className = "rank-value";
      cell.textContent = rankText(rank);
      row.append(cell);
    });

    el.periodTableBody.append(row);
  });
};

const baseRenderHistoryForLayoutV2 = renderHistory;
renderHistory = function renderHistoryWithCompactSeriesLabels() {
  baseRenderHistoryForLayoutV2();

  const weeks = state.historyWeeks || [];
  if (!weeks.length) return;

  const items = weeks.map((week) => ({
    id: fileKey(week.file),
    label: formatPeriodStartLabel(week.file.date),
    color: getHistorySeriesColor(week, weeks, new Set(weeks.map((item) => fileKey(item.file)))),
  }));

  renderSeriesControls(el.historySeriesControls, items, () => renderHistoryChart(weeks));
  renderHistoryChart(weeks);
};

function applyViewTabClasses() {
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.classList.add("post-preview-tab");
    button.classList.toggle("active", button.classList.contains("is-active"));
  });
  document.querySelector(".view-tabs")?.classList.add("post-preview-tabs");
}

const baseSwitchViewForLayoutV2 = switchView;
switchView = function switchViewWithShareTabs(view) {
  baseSwitchViewForLayoutV2(view);
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
};

function getChartShareText(chart, fallbackTitle) {
  if (chart === state.periodChart && state.currentData?.period) {
    const start = formatDateOnly(state.currentData.period.startAt);
    const end = formatDateOnly(state.currentData.period.endAt);
    return `USEN推し活リクエスト ${start}～${end} ランキング推移`;
  }

  if (chart === state.historyChart && state.historySongKey) {
    return `USEN推し活リクエスト ${getSongTitleByKey(state.historySongKey)} ランキング推移`;
  }

  return String(fallbackTitle || "USEN推し活リクエスト ランキング推移");
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = String(dataUrl).split(",");
  const mimeType = header.match(/^data:([^;]+)/)?.[1] || "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function downloadChartImage(dataUrl, fileName) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.append(link);
  link.click();
  link.remove();
}

exportChartImage = function shareChartImage({ chart, title, fileName }) {
  const sourceCanvas = chart?.canvas;
  if (!sourceCanvas) return;

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) return;

  const shareText = getChartShareText(chart, title);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#222222";
  context.font = '700 34px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(shareText, IMAGE_WIDTH / 2, 50, IMAGE_WIDTH - 80);

  const visibleDatasets = chart.data.datasets.filter((dataset, index) => chart.isDatasetVisible(index));
  drawImageLegend(context, visibleDatasets, 56, 88, IMAGE_WIDTH - 112);

  const chartTop = visibleDatasets.length > 4 ? 170 : 138;
  const chartHeight = IMAGE_HEIGHT - chartTop - 44;
  context.drawImage(sourceCanvas, 40, chartTop, IMAGE_WIDTH - 80, chartHeight);

  const dataUrl = canvas.toDataURL("image/png");
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

function applyShareButtonLabels() {
  ["periodImageButton", "historyImageButton"].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.setAttribute("aria-label", "画像を共有");
    button.setAttribute("title", "画像を共有");
  });
}

document.addEventListener("DOMContentLoaded", applyViewTabClasses);
document.addEventListener("DOMContentLoaded", applyShareButtonLabels);
