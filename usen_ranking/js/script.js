"use strict";

const MANIFEST_URL = "./data/manifest.json";
const COLORS = ["#02b9a5", "#8b5cf6", "#ef4444", "#0ea5e9", "#eab308", "#ec4899", "#65a30d", "#f97316"];
const DAY = 24 * 60 * 60 * 1000;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 760;

const state = {
  manifest: null,
  files: [],
  cache: new Map(),
  currentFile: null,
  currentData: null,
  periodChart: null,
  historyChart: null,
  currentView: "period",
  historySongKey: "",
  historyWeeks: [],
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadManifest();
});

function cacheElements() {
  [
    "latestUpdatedAt", "refreshButton", "loadingPanel", "loadingMessage",
    "errorPanel", "errorMessage", "emptyPanel", "appContent", "periodPanel",
    "songPanel", "periodSelect", "periodDescription", "periodTopRank",
    "periodTopRankSub", "periodBestRank", "periodSongCount", "periodSnapshotCount",
    "periodSeriesControls", "periodChartEmpty", "periodChartScroll", "periodChartSurface",
    "periodChart", "periodImageButton", "periodTableBody", "historySongSelect",
    "historyLoadStatus", "historyWeekCount", "historyBestRank", "historyLatestRank",
    "historyLatestRankSub", "historyFirstWeek", "historySeriesControls",
    "historyChartEmpty", "historyChartScroll", "historyChartSurface", "historyChart",
    "historyImageButton", "historyTableBody", "historyChartTitle",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
}

function bindEvents() {
  el.refreshButton.addEventListener("click", () => loadManifest(true));

  document.querySelectorAll(".view-tab").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  el.periodSelect.addEventListener("change", () => {
    const file = state.files.find((item) => fileKey(item) === el.periodSelect.value);
    if (file) loadPeriod(file);
  });

  el.historySongSelect.addEventListener("change", () => {
    state.historySongKey = el.historySongSelect.value;
    renderHistory();
  });

  el.periodImageButton.addEventListener("click", () => {
    if (!state.periodChart || !state.currentData) return;
    const start = formatDateOnly(state.currentData.period.startAt);
    const end = formatDateOnly(state.currentData.period.endAt);
    exportChartImage({
      chart: state.periodChart,
      title: `USEN推し活リクエストランキング  ${start}～${end}推移`,
      fileName: `usen-ranking-${compactDate(start)}-${compactDate(end)}.png`,
    });
  });

  el.historyImageButton.addEventListener("click", () => {
    if (!state.historyChart || !state.historySongKey) return;
    const selected = getSongTitleByKey(state.historySongKey);
    exportChartImage({
      chart: state.historyChart,
      title: `USEN推し活リクエストランキング  ${selected}推移`,
      fileName: `usen-ranking-${sanitizeFileName(selected)}.png`,
    });
  });
}

async function loadManifest(preserve = false) {
  showLoading("manifest.jsonを確認しています。");
  el.refreshButton.disabled = true;

  try {
    const manifest = await fetchJson(MANIFEST_URL);
    state.manifest = manifest;
    state.files = (Array.isArray(manifest.files) ? manifest.files : [])
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    el.latestUpdatedAt.textContent = formatDateTime(manifest.updatedAt || manifest.generatedAt || "");

    if (!state.files.length) {
      showEmpty();
      return;
    }

    populatePeriods();
    await preloadAll();

    const target = preserve && state.currentFile
      ? state.files.find((file) => fileKey(file) === fileKey(state.currentFile)) || state.files[0]
      : state.files[0];

    el.periodSelect.value = fileKey(target);
    await loadPeriod(target);
    populateSongs();
    showApp();

    if (state.currentView === "song") renderHistory();
  } catch (error) {
    showError(error);
  } finally {
    el.refreshButton.disabled = false;
  }
}

async function preloadAll() {
  for (const file of state.files) {
    const key = fileKey(file);
    if (state.cache.has(key)) continue;

    try {
      state.cache.set(key, normalize(await fetchJson(resolvePath(file.path))));
    } catch (error) {
      console.warn(`Failed to preload ${key}`, error);
    }
  }
}

async function loadPeriod(file) {
  showLoading(`${periodLabel(file.date)}を読み込んでいます。`);

  try {
    const key = fileKey(file);
    let data = state.cache.get(key);

    if (!data) {
      data = normalize(await fetchJson(resolvePath(file.path)));
      state.cache.set(key, data);
    }

    state.currentFile = file;
    state.currentData = data;
    renderPeriod();
    showApp();
  } catch (error) {
    showError(error);
  }
}

function normalize(data) {
  const songs = (Array.isArray(data.songs) ? data.songs : [])
    .map((song) => {
      const points = (Array.isArray(song.points) ? song.points : [])
        .map((point) => ({ capturedAt: String(point.capturedAt || ""), rank: toNumber(point.rank) }))
        .filter((point) => point.capturedAt && point.rank !== null)
        .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));

      const ranks = points.map((point) => point.rank);

      return {
        ...song,
        songId: String(song.songId || ""),
        songTitle: String(song.songTitle || ""),
        points,
        currentRank: toNumber(song.currentRank),
        bestRank: toNumber(song.bestRank) ?? (ranks.length ? Math.min(...ranks) : null),
        worstRank: toNumber(song.worstRank) ?? (ranks.length ? Math.max(...ranks) : null),
      };
    })
    .filter((song) => song.songId || song.songTitle);

  return {
    ...data,
    period: data.period || {},
    songs,
    snapshotCount: Number(data.snapshotCount || 0),
  };
}

function populatePeriods() {
  el.periodSelect.replaceChildren();

  state.files.forEach((file) => {
    const option = document.createElement("option");
    option.value = fileKey(file);
    option.textContent = periodLabel(file.date);
    el.periodSelect.append(option);
  });
}

function populateSongs() {
  const songs = new Map();

  for (const data of state.cache.values()) {
    for (const song of data.songs) {
      songs.set(songKey(song), song.songTitle || song.songId);
    }
  }

  el.historySongSelect.replaceChildren();

  [...songs.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ja"))
    .forEach(([key, title]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = title;
      el.historySongSelect.append(option);
    });

  state.historySongKey = state.historySongKey && songs.has(state.historySongKey)
    ? state.historySongKey
    : (el.historySongSelect.options[0]?.value || "");

  el.historySongSelect.value = state.historySongKey;
}

function renderPeriod() {
  const data = state.currentData;
  if (!data) return;

  el.periodDescription.textContent = `${formatDateTime(data.period.startAt)} 〜 ${formatDateTime(data.period.endAt)} / 最終取得 ${formatDateTime(data.latestCapturedAt)}`;

  const currentRanks = data.songs.map((song) => song.currentRank).filter((rank) => rank !== null);
  const bestRanks = data.songs.map((song) => song.bestRank).filter((rank) => rank !== null);

  el.periodTopRank.textContent = currentRanks.length ? `${Math.min(...currentRanks)}位` : "圏外";
  el.periodTopRankSub.textContent = `${currentRanks.length}/${data.songs.length}曲がランクイン`;
  el.periodBestRank.textContent = bestRanks.length ? `${Math.min(...bestRanks)}位` : "--";
  el.periodSongCount.textContent = String(data.songs.length);
  el.periodSnapshotCount.textContent = String(data.snapshotCount || 0);

  const items = data.songs.map((song, index) => ({
    id: songKey(song),
    label: song.songTitle || song.songId,
    color: COLORS[index % COLORS.length],
  }));

  renderSeriesControls(el.periodSeriesControls, items, renderPeriodChart);
  renderPeriodChart();
  renderPeriodTable();
}

function renderPeriodChart() {
  const data = state.currentData;
  if (!data) return;

  destroyChart("periodChart");

  const active = activeIds(el.periodSeriesControls);
  const songs = data.songs.filter((song) => active.has(songKey(song)));

  if (!songs.length) {
    toggleChart(el.periodChartEmpty, el.periodChartScroll, false);
    el.periodImageButton.disabled = true;
    return;
  }

  toggleChart(el.periodChartEmpty, el.periodChartScroll, true);
  el.periodImageButton.disabled = false;

  const start = Date.parse(data.period.startAt);
  const end = Date.parse(data.period.endAt);
  el.periodChartSurface.style.width = "100%";

  const datasets = songs.map((song) => {
    const originalIndex = data.songs.findIndex((item) => songKey(item) === songKey(song));
    const color = COLORS[Math.max(0, originalIndex) % COLORS.length];

    return {
      label: song.songTitle || song.songId,
      data: song.points
        .filter((point) => {
          const time = Date.parse(point.capturedAt);
          return time >= start && time < end;
        })
        .map((point) => ({ x: Date.parse(point.capturedAt), y: point.rank })),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      spanGaps: false,
      tension: .15,
    };
  });

  state.periodChart = new Chart(el.periodChart, {
    type: "line",
    data: { datasets },
    options: chartOptions(start, end, true),
  });
}

function renderPeriodTable() {
  el.periodTableBody.replaceChildren();

  state.currentData.songs.forEach((song) => {
    const row = document.createElement("tr");
    [
      song.songTitle || song.songId,
      rankText(song.currentRank),
      rankText(song.bestRank),
      rankText(song.worstRank),
      formatDateTime(song.firstSeenAt),
      formatDateTime(song.lastSeenAt),
    ].forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      cell.className = index === 0 ? "song-name" : (index > 0 && index < 4 ? "rank-value" : "");
      row.append(cell);
    });
    el.periodTableBody.append(row);
  });
}

function renderHistory() {
  const key = state.historySongKey;
  if (!key) return;

  const weeks = [];

  state.files.forEach((file) => {
    const data = state.cache.get(fileKey(file));
    if (!data) return;

    const song = data.songs.find((item) => songKey(item) === key);
    if (song) weeks.push({ file, data, song });
  });

  state.historyWeeks = weeks;

  if (!weeks.length) {
    toggleChart(el.historyChartEmpty, el.historyChartScroll, false);
    el.historyImageButton.disabled = true;
    return;
  }

  const latest = weeks[0];
  const oldest = weeks[weeks.length - 1];
  const allRanks = weeks.flatMap((week) => week.song.points.map((point) => point.rank));

  el.historyWeekCount.textContent = String(weeks.length);
  el.historyBestRank.textContent = allRanks.length ? `${Math.min(...allRanks)}位` : "--";
  el.historyLatestRank.textContent = rankText(latest.song.currentRank);
  el.historyLatestRankSub.textContent = periodLabel(latest.file.date);
  el.historyFirstWeek.textContent = formatDateKey(oldest.file.date);
  el.historyChartTitle.textContent = `${latest.song.songTitle || latest.song.songId} 全期間比較`;
  el.historyLoadStatus.textContent = `${weeks.length}週分を新しい週から順に重ねて表示しています。`;

  const items = weeks.map((week, index) => {
    const opacity = getWeekOpacity(index, weeks.length);
    return {
      id: fileKey(week.file),
      label: `${formatDateKey(week.file.date)}開始`,
      color: `rgba(2,185,165,${opacity})`,
    };
  });

  renderSeriesControls(el.historySeriesControls, items, () => renderHistoryChart(weeks));
  renderHistoryChart(weeks);
  renderHistoryTable(weeks);
}

function renderHistoryChart(weeks) {
  destroyChart("historyChart");

  const active = activeIds(el.historySeriesControls);
  const selected = weeks.filter((week) => active.has(fileKey(week.file)));

  if (!selected.length) {
    toggleChart(el.historyChartEmpty, el.historyChartScroll, false);
    el.historyImageButton.disabled = true;
    return;
  }

  toggleChart(el.historyChartEmpty, el.historyChartScroll, true);
  el.historyImageButton.disabled = false;
  el.historyChartSurface.style.width = "100%";

  const start = 0;
  const end = 7 * DAY;

  const datasets = selected.map((week) => {
    const base = Date.parse(week.data.period.startAt);
    const index = weeks.findIndex((item) => fileKey(item.file) === fileKey(week.file));
    const opacity = getWeekOpacity(index, weeks.length);
    const color = `rgba(2,185,165,${opacity})`;

    return {
      label: `${formatDateKey(week.file.date)}開始`,
      data: week.song.points
        .map((point) => ({ x: Date.parse(point.capturedAt) - base, y: point.rank }))
        .filter((point) => point.x >= 0 && point.x < end),
      borderColor: color,
      backgroundColor: color,
      borderWidth: index === 0 ? 3 : 2.2,
      pointRadius: 0,
      pointHoverRadius: 0,
      spanGaps: false,
      tension: .15,
    };
  });

  state.historyChart = new Chart(el.historyChart, {
    type: "line",
    data: { datasets },
    options: chartOptions(start, end, false),
  });
}

function renderHistoryTable(weeks) {
  el.historyTableBody.replaceChildren();

  weeks.forEach((week) => {
    const row = document.createElement("tr");
    [
      formatDateKey(week.file.date),
      rankText(week.song.currentRank),
      rankText(week.song.bestRank),
      rankText(week.song.worstRank),
      formatDateTime(week.song.firstSeenAt),
      formatDateTime(week.song.lastSeenAt),
    ].forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      cell.className = index > 0 && index < 4 ? "rank-value" : "";
      row.append(cell);
    });
    el.historyTableBody.append(row);
  });
}

function chartOptions(min, max, absolute) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(items) {
            if (!items.length) return "";
            return absolute ? formatDateTime(items[0].parsed.x) : formatRelative(items[0].parsed.x);
          },
          label(context) {
            return `${context.dataset.label}: ${context.parsed.y}位`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min,
        max,
        ticks: {
          stepSize: DAY,
          autoSkip: false,
          maxRotation: 0,
          callback(value) {
            return absolute ? formatAxis18(value) : formatRelativeAxis(value);
          },
          font: { size: 11 },
        },
        grid: { color: "rgba(0,0,0,.07)" },
      },
      y: {
        reverse: true,
        min: 1,
        max: 100,
        afterBuildTicks(axis) {
          axis.ticks = [1, 20, 30, 50, 100].map((value) => ({ value }));
        },
        ticks: {
          callback(value) { return `${value}位`; },
          font: { size: 11 },
        },
        grid: {
          color(context) {
            const value = context.tick?.value;
            if (value === 20) return "rgba(239,68,68,.48)";
            if (value === 30) return "rgba(234,179,8,.48)";
            return "rgba(0,0,0,.08)";
          },
          lineWidth(context) {
            return context.tick?.value === 20 || context.tick?.value === 30 ? 2 : 1;
          },
        },
      },
    },
  };
}

function renderSeriesControls(container, items, onChange) {
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

  const toggleButton = document.createElement("button");
  toggleButton.className = "series-toggle is-hidden";
  toggleButton.type = "button";
  toggleButton.textContent = "すべて見る";

  header.append(allLabel, toggleButton);

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

  toggleButton.addEventListener("click", () => {
    const expanded = container.classList.toggle("is-expanded");
    toggleButton.textContent = expanded ? "折り畳む" : "すべて見る";
  });

  container.append(header, list);

  requestAnimationFrame(() => {
    const styles = getComputedStyle(list);
    const columns = styles.gridTemplateColumns.split(" ").filter(Boolean).length;
    const rowCount = columns > 0 ? Math.ceil(items.length / columns) : items.length;
    const collapsible = rowCount >= 2 && items.length > columns;

    container.classList.toggle("is-collapsible", collapsible);
    container.classList.remove("is-expanded");
    toggleButton.classList.toggle("is-hidden", !collapsible);
    toggleButton.textContent = "すべて見る";
  });
}

function syncAllCheckbox(allInput, list) {
  const inputs = [...list.querySelectorAll('input[type="checkbox"]')];
  const checked = inputs.filter((input) => input.checked).length;
  allInput.checked = checked === inputs.length;
  allInput.indeterminate = checked > 0 && checked < inputs.length;
}

function activeIds(container) {
  return new Set(
    [...container.querySelectorAll('.series-list input[type="checkbox"]:checked')]
      .map((input) => input.value)
  );
}

function switchView(view) {
  state.currentView = view;

  document.querySelectorAll(".view-tab").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  el.periodPanel.classList.toggle("hidden", view !== "period");
  el.songPanel.classList.toggle("hidden", view !== "song");

  if (view === "song") renderHistory();
}

function exportChartImage({ chart, title, fileName }) {
  const sourceCanvas = chart.canvas;
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

  const visibleDatasets = chart.data.datasets.filter((dataset, index) => chart.isDatasetVisible(index));
  drawImageLegend(context, visibleDatasets, 56, 88, IMAGE_WIDTH - 112);

  const chartTop = visibleDatasets.length > 4 ? 170 : 138;
  const chartHeight = IMAGE_HEIGHT - chartTop - 44;
  context.drawImage(sourceCanvas, 40, chartTop, IMAGE_WIDTH - 80, chartHeight);

  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawImageLegend(context, datasets, startX, startY, maxWidth) {
  context.font = '600 21px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = "left";
  context.textBaseline = "middle";

  let x = startX;
  let y = startY;

  datasets.forEach((dataset) => {
    const label = String(dataset.label || "");
    const itemWidth = 34 + context.measureText(label).width + 28;

    if (x + itemWidth > startX + maxWidth) {
      x = startX;
      y += 34;
    }

    context.fillStyle = typeof dataset.borderColor === "string" ? dataset.borderColor : "#02b9a5";
    context.fillRect(x, y - 5, 24, 5);
    context.fillStyle = "#333333";
    context.fillText(label, x + 34, y);
    x += itemWidth;
  });
}

function toggleChart(empty, scroll, show) {
  empty.classList.toggle("hidden", show);
  scroll.classList.toggle("hidden", !show);
}

function destroyChart(name) {
  if (state[name]) {
    state[name].destroy();
    state[name] = null;
  }
}

function showLoading(message) {
  el.loadingPanel.classList.remove("hidden");
  el.loadingMessage.textContent = message;
  el.errorPanel.classList.add("hidden");
  el.emptyPanel.classList.add("hidden");
  el.appContent.classList.add("hidden");
}

function showApp() {
  el.loadingPanel.classList.add("hidden");
  el.errorPanel.classList.add("hidden");
  el.emptyPanel.classList.add("hidden");
  el.appContent.classList.remove("hidden");
}

function showEmpty() {
  el.loadingPanel.classList.add("hidden");
  el.errorPanel.classList.add("hidden");
  el.appContent.classList.add("hidden");
  el.emptyPanel.classList.remove("hidden");
}

function showError(error) {
  console.error(error);
  el.loadingPanel.classList.add("hidden");
  el.emptyPanel.classList.add("hidden");
  el.appContent.classList.add("hidden");
  el.errorPanel.classList.remove("hidden");
  el.errorMessage.textContent = error instanceof Error ? error.message : String(error);
}

async function fetchJson(url) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function resolvePath(path) {
  let value = String(path || "")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/^usen_ranking\//, "");

  if (/^https?:\/\//.test(value)) return value;
  return value.startsWith("data/") ? `./${value}` : `./data/${value}`;
}

function getSongTitleByKey(key) {
  for (const data of state.cache.values()) {
    const song = data.songs.find((item) => songKey(item) === key);
    if (song) return song.songTitle || song.songId;
  }
  return "曲名不明";
}

function getWeekOpacity(index, total) {
  if (total <= 1) return 1;
  return Math.max(.22, 1 - (index / (total - 1)) * .72);
}

function fileKey(file) { return String(file.date || file.path || ""); }
function songKey(song) { return song.songId ? `id:${song.songId}` : `title:${song.songTitle}`; }

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function rankText(value) {
  return value === null || value === undefined ? "圏外" : `${value}位`;
}

function periodLabel(value) {
  return `${formatDateKey(value)} 18:00開始`;
}

function formatDateKey(value) {
  const match = String(value || "").match(/^(\d{4})(\d{2})(\d{2})$/);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : String(value || "--");
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateOnly(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}/${map.month}/${map.day}`;
}

function formatAxis18(value) {
  const date = new Date(Number(value));
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatRelative(value) {
  const dayIndex = Math.round(Number(value) / DAY);
  const weekdays = ["水", "木", "金", "土", "日", "月", "火", "水"];
  return `${weekdays[dayIndex] || `${dayIndex}日目`} 18:00`;
}

function formatRelativeAxis(value) {
  const dayIndex = Math.round(Number(value) / DAY);
  const weekdays = ["水", "木", "金", "土", "日", "月", "火", "水"];
  return weekdays[dayIndex] || String(dayIndex);
}

function compactDate(value) {
  return String(value || "").replace(/\//g, "");
}

function sanitizeFileName(value) {
  return String(value || "song")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
