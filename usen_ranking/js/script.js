"use strict";

const MANIFEST_URL = "./data/manifest.json";
const ALL_SONGS_VALUE = "__all__";
const CHART_COLORS = ["#02b9a5", "#8b5cf6", "#ef4444", "#0ea5e9", "#eab308", "#ec4899", "#65a30d", "#f97316"];

const state = {
  manifest: null,
  files: [],
  currentFile: null,
  currentData: null,
  selectedSongKey: ALL_SONGS_VALUE,
  chart: null,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadManifest();
});

function cacheElements() {
  [
    "latestUpdatedAt",
    "refreshButton",
    "loadingPanel",
    "loadingMessage",
    "errorPanel",
    "errorMessage",
    "emptyPanel",
    "appContent",
    "periodSelect",
    "songSelect",
    "periodDescription",
    "latestRankLabel",
    "latestRankValue",
    "latestRankSub",
    "bestRankValue",
    "songCountValue",
    "snapshotCountValue",
    "chartTitle",
    "chartEmptyMessage",
    "chartScroll",
    "chartSurface",
    "rankingChart",
    "songTableBody",
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => {
    loadManifest({ preserveSelection: true });
  });

  elements.periodSelect.addEventListener("change", () => {
    const file = state.files.find((item) => getFileKey(item) === elements.periodSelect.value);
    if (file) {
      loadPeriod(file);
    }
  });

  elements.songSelect.addEventListener("change", () => {
    state.selectedSongKey = elements.songSelect.value;
    renderCurrentData();
  });
}

async function loadManifest(options = {}) {
  const previousFileKey = options.preserveSelection && state.currentFile
    ? getFileKey(state.currentFile)
    : "";

  setLoading(true, "manifest.jsonを確認しています。");
  hideError();
  elements.refreshButton.disabled = true;

  try {
    const manifest = await fetchJson(MANIFEST_URL);
    const files = Array.isArray(manifest.files) ? [...manifest.files] : [];

    files.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    state.manifest = manifest;
    state.files = files;
    elements.latestUpdatedAt.textContent = formatDisplayDateTime(
      manifest.updatedAt || manifest.generatedAt || ""
    );

    if (files.length === 0) {
      showEmptyState();
      return;
    }

    populatePeriodSelect(files);

    const selectedFile = files.find((item) => getFileKey(item) === previousFileKey) || files[0];
    elements.periodSelect.value = getFileKey(selectedFile);
    await loadPeriod(selectedFile);
  } catch (error) {
    showError(error);
  } finally {
    elements.refreshButton.disabled = false;
  }
}

async function loadPeriod(file) {
  setLoading(true, `${formatPeriodLabel(file.date)}のデータを読み込んでいます。`);
  hideError();

  try {
    const data = await fetchJson(resolveDataPath(file.path));
    state.currentFile = file;
    state.currentData = normalizeRankingData(data);
    populateSongSelect(state.currentData.songs);
    renderCurrentData();
    showApp();
  } catch (error) {
    showError(error);
  }
}

function normalizeRankingData(data) {
  const songs = Array.isArray(data.songs)
    ? data.songs.map(normalizeSong).filter((song) => song.songTitle || song.songId)
    : [];

  const snapshotSet = new Set(
    Array.isArray(data.snapshots) ? data.snapshots.filter(Boolean).map(String) : []
  );

  songs.forEach((song) => {
    song.points.forEach((point) => snapshotSet.add(point.capturedAt));
  });

  const snapshots = [...snapshotSet].sort(compareDateValues);

  return {
    ...data,
    period: data.period || {},
    snapshots,
    snapshotCount: Number(data.snapshotCount || snapshots.length || 0),
    songs,
  };
}

function normalizeSong(song) {
  const points = Array.isArray(song.points)
    ? song.points
        .map((point) => ({
          capturedAt: String(point.capturedAt || ""),
          rank: toFiniteNumber(point.rank),
        }))
        .filter((point) => point.capturedAt && point.rank !== null)
        .sort((a, b) => compareDateValues(a.capturedAt, b.capturedAt))
    : [];

  const ranks = points.map((point) => point.rank);

  return {
    ...song,
    songId: String(song.songId || ""),
    songTitle: String(song.songTitle || ""),
    points,
    currentRank: toFiniteNumber(song.currentRank),
    lastSeenRank: toFiniteNumber(song.lastSeenRank),
    bestRank: toFiniteNumber(song.bestRank) ?? (ranks.length ? Math.min(...ranks) : null),
    worstRank: toFiniteNumber(song.worstRank) ?? (ranks.length ? Math.max(...ranks) : null),
  };
}

function populatePeriodSelect(files) {
  elements.periodSelect.replaceChildren();

  files.forEach((file) => {
    const option = document.createElement("option");
    option.value = getFileKey(file);
    option.textContent = formatPeriodLabel(file.date);
    elements.periodSelect.append(option);
  });
}

function populateSongSelect(songs) {
  const previousValue = state.selectedSongKey;
  elements.songSelect.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = ALL_SONGS_VALUE;
  allOption.textContent = "全曲を比較";
  elements.songSelect.append(allOption);

  songs.forEach((song) => {
    const option = document.createElement("option");
    option.value = getSongKey(song);
    option.textContent = song.songTitle || song.songId;
    elements.songSelect.append(option);
  });

  const canRestore = [...elements.songSelect.options]
    .some((option) => option.value === previousValue);

  state.selectedSongKey = canRestore ? previousValue : ALL_SONGS_VALUE;
  elements.songSelect.value = state.selectedSongKey;
}

function renderCurrentData() {
  const data = state.currentData;
  if (!data) {
    return;
  }

  const selectedSongs = getSelectedSongs(data.songs);
  renderPeriodDescription(data);
  renderSummary(data, selectedSongs);
  renderChart(data, selectedSongs);
  renderSongTable(selectedSongs);
}

function renderPeriodDescription(data) {
  const startAt = data.period.startAt || "";
  const endAt = data.period.endAt || "";
  const latest = data.latestCapturedAt || "";

  const parts = [];
  if (startAt || endAt) {
    parts.push(`${formatDisplayDateTime(startAt)} 〜 ${formatDisplayDateTime(endAt)}`);
  }
  if (latest) {
    parts.push(`最終取得 ${formatDisplayDateTime(latest)}`);
  }

  elements.periodDescription.textContent = parts.join(" / ");
}

function renderSummary(data, selectedSongs) {
  const isSingle = selectedSongs.length === 1;
  const currentRanks = selectedSongs
    .map((song) => song.currentRank)
    .filter((rank) => rank !== null);
  const bestRanks = selectedSongs
    .map((song) => song.bestRank)
    .filter((rank) => rank !== null);

  elements.latestRankLabel.textContent = isSingle ? "最新順位" : "最新時点トップ";
  elements.latestRankValue.textContent = currentRanks.length
    ? `${Math.min(...currentRanks)}位`
    : "圏外";
  elements.latestRankSub.textContent = isSingle
    ? (selectedSongs[0].songTitle || "選択中の曲")
    : `${currentRanks.length}/${selectedSongs.length}曲がランクイン`;
  elements.bestRankValue.textContent = bestRanks.length
    ? `${Math.min(...bestRanks)}位`
    : "--";
  elements.songCountValue.textContent = String(data.songs.length);
  elements.snapshotCountValue.textContent = String(data.snapshotCount || data.snapshots.length);
}

function renderChart(data, songs) {
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const snapshots = data.snapshots;
  const hasPoints = songs.some((song) => song.points.length > 0);

  elements.chartTitle.textContent = songs.length === 1
    ? `${songs[0].songTitle || songs[0].songId} 順位推移`
    : "全曲 順位推移";

  if (!window.Chart) {
    elements.chartEmptyMessage.hidden = false;
    elements.chartEmptyMessage.textContent = "グラフライブラリを読み込めませんでした。";
    elements.chartScroll.hidden = true;
    return;
  }

  if (!hasPoints || snapshots.length === 0) {
    elements.chartEmptyMessage.hidden = false;
    elements.chartEmptyMessage.textContent = "表示できる順位データがありません。";
    elements.chartScroll.hidden = true;
    return;
  }

  elements.chartEmptyMessage.hidden = true;
  elements.chartScroll.hidden = false;
  elements.chartSurface.style.width = `${Math.max(760, snapshots.length * 34)}px`;

  const snapshotIndexMap = new Map(snapshots.map((value, index) => [value, index]));
  const allRanks = songs.flatMap((song) => song.points.map((point) => point.rank));
  const maxRank = Math.max(20, Math.ceil(Math.max(...allRanks) / 10) * 10);

  const datasets = songs.map((song, index) => {
    const values = Array(snapshots.length).fill(null);
    song.points.forEach((point) => {
      const snapshotIndex = snapshotIndexMap.get(point.capturedAt);
      if (snapshotIndex !== undefined) {
        values[snapshotIndex] = point.rank;
      }
    });

    const color = CHART_COLORS[index % CHART_COLORS.length];

    return {
      label: song.songTitle || song.songId,
      data: values,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2.5,
      pointRadius: 2.5,
      pointHoverRadius: 5,
      tension: 0.15,
      spanGaps: false,
    };
  });

  state.chart = new Chart(elements.rankingChart, {
    type: "line",
    data: {
      labels: snapshots,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          align: "start",
          labels: {
            usePointStyle: true,
            boxWidth: 9,
            boxHeight: 9,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            title(items) {
              return items.length ? formatDisplayDateTime(items[0].label) : "";
            },
            label(context) {
              return `${context.dataset.label}: ${context.parsed.y}位`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(120, 140, 140, 0.12)",
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 12,
            maxRotation: 0,
            callback(value) {
              const label = this.getLabelForValue(value);
              return formatAxisDateTime(label);
            },
          },
        },
        y: {
          reverse: true,
          min: 1,
          max: maxRank,
          grid: {
            color: "rgba(120, 140, 140, 0.16)",
          },
          ticks: {
            stepSize: 10,
            callback(value) {
              return `${value}位`;
            },
          },
          title: {
            display: true,
            text: "順位",
          },
        },
      },
    },
  });
}

function renderSongTable(songs) {
  elements.songTableBody.replaceChildren();

  if (songs.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "表示できる曲がありません。";
    row.append(cell);
    elements.songTableBody.append(row);
    return;
  }

  songs.forEach((song) => {
    const row = document.createElement("tr");
    row.append(
      createCell(song.songTitle || song.songId, "song-name"),
      createRankCell(song.currentRank),
      createRankCell(song.bestRank),
      createRankCell(song.worstRank),
      createCell(formatDisplayDateTime(song.firstSeenAt || "")),
      createCell(formatDisplayDateTime(song.lastSeenAt || ""))
    );
    elements.songTableBody.append(row);
  });
}

function createCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text || "--";
  if (className) {
    cell.className = className;
  }
  return cell;
}

function createRankCell(rank) {
  const cell = document.createElement("td");
  if (rank === null || rank === undefined) {
    cell.textContent = "圏外";
    cell.className = "out-rank";
  } else {
    cell.textContent = `${rank}位`;
    cell.className = "rank-value";
  }
  return cell;
}

function getSelectedSongs(songs) {
  if (state.selectedSongKey === ALL_SONGS_VALUE) {
    return songs;
  }

  return songs.filter((song) => getSongKey(song) === state.selectedSongKey);
}

function getSongKey(song) {
  return song.songId ? `id:${song.songId}` : `title:${song.songTitle}`;
}

function getFileKey(file) {
  return String(file.date || file.path || "");
}

function resolveDataPath(path) {
  const value = String(path || "").trim();
  if (!value) {
    throw new Error("manifest.jsonに週次JSONのpathがありません。");
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  let normalized = value.replace(/^\.\//, "").replace(/^\//, "");
  normalized = normalized.replace(/^usen_ranking\//, "");

  if (normalized.startsWith("data/")) {
    return `./${normalized}`;
  }

  return `./data/${normalized}`;
}

async function fetchJson(url) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}t=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
}

function showApp() {
  elements.loadingPanel.hidden = true;
  elements.errorPanel.hidden = true;
  elements.emptyPanel.hidden = true;
  elements.appContent.hidden = false;
}

function showEmptyState() {
  elements.loadingPanel.hidden = true;
  elements.errorPanel.hidden = true;
  elements.appContent.hidden = true;
  elements.emptyPanel.hidden = false;
}

function showError(error) {
  console.error(error);
  elements.loadingPanel.hidden = true;
  elements.emptyPanel.hidden = true;
  elements.appContent.hidden = true;
  elements.errorPanel.hidden = false;
  elements.errorMessage.textContent = error instanceof Error ? error.message : String(error);
}

function hideError() {
  elements.errorPanel.hidden = true;
  elements.errorMessage.textContent = "";
}

function setLoading(isLoading, message) {
  elements.loadingPanel.hidden = !isLoading;
  elements.loadingMessage.textContent = message || "読み込んでいます。";
  if (isLoading) {
    elements.emptyPanel.hidden = true;
    elements.appContent.hidden = true;
  }
}

function formatPeriodLabel(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) {
    return text || "期間不明";
  }
  return `${match[1]}/${match[2]}/${match[3]} 18:00開始`;
}

function formatDisplayDateTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

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

function formatAxisDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function compareDateValues(a, b) {
  return new Date(a).getTime() - new Date(b).getTime();
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
