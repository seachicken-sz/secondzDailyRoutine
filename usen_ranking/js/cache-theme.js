"use strict";

const USEN_DATA_CACHE_NAME = "usen-ranking-data-v1";
const USEN_DATA_CACHE_META_KEY = "usenRankingDataCacheMetaV1";
const USEN_CACHE_CONCURRENCY = 4;
const usenRuntimeVersions = new Map();
const usenFilePromises = new Map();
let usenPersistentCache = null;
let usenCacheMeta = readUsenCacheMeta();
let usenHistoryLoadPromise = Promise.resolve();
let usenHistoryReady = false;
let usenLoadGeneration = 0;

function getUsenThemeColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--color-brand").trim() || "#02b9a5";
}

function getUsenPeriodPalette(count) {
  const themeColor = getUsenThemeColor();
  const secondaryColors = ["#8b5cf6", "#ef4444", "#0ea5e9", "#eab308", "#ec4899", "#65a30d", "#f97316"]
    .filter((color) => color.toLowerCase() !== themeColor.toLowerCase());
  return Array.from({ length: count }, (_, index) => index === 0
    ? themeColor
    : secondaryColors[(index - 1) % secondaryColors.length]);
}

getHistorySeriesColor = function getThemeAwareHistorySeriesColor(week, weeks, activeIdsSet) {
  const activeWeeks = weeks.filter((item) => activeIdsSet.has(fileKey(item.file)));
  const activeIndex = activeWeeks.findIndex((item) => fileKey(item.file) === fileKey(week.file));

  if (activeIndex < 0) return "rgba(107,114,128,.18)";
  if (activeIndex === 0) return getUsenThemeColor();

  const olderCount = Math.max(1, activeWeeks.length - 1);
  const ratio = olderCount <= 1 ? 0 : (activeIndex - 1) / Math.max(1, olderCount - 1);
  const opacity = .78 - ratio * .5;
  return `rgba(107,114,128,${Math.max(.28, opacity).toFixed(2)})`;
};

renderPeriodChart = function renderThemeAwarePeriodChart() {
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
  const palette = getUsenPeriodPalette(data.songs.length);
  el.periodChartSurface.style.width = el.periodChartSurface.classList.contains("is-large") ? "920px" : "100%";

  const datasets = songs.map((song) => {
    const originalIndex = data.songs.findIndex((item) => songKey(item) === songKey(song));
    const color = palette[Math.max(0, originalIndex) % palette.length];

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
};

const usenBaseRenderPeriod = renderPeriod;
renderPeriod = function renderPeriodWithThemeColors() {
  usenBaseRenderPeriod();

  const data = state.currentData;
  if (!data) return;

  const palette = getUsenPeriodPalette(data.songs.length);
  el.periodSeriesControls.querySelectorAll('.series-list input[type="checkbox"]').forEach((input) => {
    const index = data.songs.findIndex((song) => songKey(song) === input.value);
    const dot = input.closest(".series-chip")?.querySelector(".series-dot");
    if (dot && index >= 0) dot.style.background = palette[index % palette.length];
  });
};

function readUsenCacheMeta() {
  try {
    const value = JSON.parse(localStorage.getItem(USEN_DATA_CACHE_META_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    console.warn("Failed to read USEN cache metadata.", error);
    return {};
  }
}

function saveUsenCacheMeta() {
  try {
    localStorage.setItem(USEN_DATA_CACHE_META_KEY, JSON.stringify(usenCacheMeta));
  } catch (error) {
    console.warn("Failed to save USEN cache metadata.", error);
  }
}

async function getUsenPersistentCache() {
  if (usenPersistentCache) return usenPersistentCache;
  if (!("caches" in window)) return null;

  try {
    usenPersistentCache = await caches.open(USEN_DATA_CACHE_NAME);
    return usenPersistentCache;
  } catch (error) {
    console.warn("Cache Storage is unavailable.", error);
    return null;
  }
}

function getUsenFileVersion(file) {
  return [
    String(file.path || ""),
    String(file.updatedAt || ""),
    String(file.rowCount ?? ""),
    String(file.snapshotCount ?? ""),
    String(file.songCount ?? ""),
  ].join("|");
}

function getUsenFileUrl(file) {
  return new URL(resolvePath(file.path), window.location.href).href;
}

async function loadUsenFile(file) {
  const key = fileKey(file);
  const version = getUsenFileVersion(file);
  const promiseKey = `${key}|${version}`;

  if (state.cache.has(key) && usenRuntimeVersions.get(key) === version) {
    return state.cache.get(key);
  }

  if (usenFilePromises.has(promiseKey)) return usenFilePromises.get(promiseKey);

  const promise = (async () => {
    const url = getUsenFileUrl(file);
    const cache = await getUsenPersistentCache();
    const cachedMeta = usenCacheMeta[key];

    if (cache && cachedMeta?.version === version && cachedMeta?.url === url) {
      try {
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          const data = normalize(await cachedResponse.json());
          state.cache.set(key, data);
          usenRuntimeVersions.set(key, version);
          return data;
        }
      } catch (error) {
        console.warn(`Failed to read cached USEN data: ${key}`, error);
        await cache.delete(url).catch(() => {});
      }
    }

    const rawData = await fetchJson(resolvePath(file.path));
    const data = normalize(rawData);
    state.cache.set(key, data);
    usenRuntimeVersions.set(key, version);

    if (cache) {
      try {
        await cache.put(url, new Response(JSON.stringify(rawData), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }));
        usenCacheMeta[key] = { version, url };
        saveUsenCacheMeta();
      } catch (error) {
        console.warn(`Failed to cache USEN data: ${key}`, error);
      }
    }

    return data;
  })().finally(() => {
    usenFilePromises.delete(promiseKey);
  });

  usenFilePromises.set(promiseKey, promise);
  return promise;
}

async function runUsenWithConcurrency(items, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(USEN_CACHE_CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function cleanUsenPersistentCache(files) {
  const validKeys = new Set(files.map((file) => fileKey(file)));
  const cache = await getUsenPersistentCache();

  for (const [key, meta] of Object.entries(usenCacheMeta)) {
    if (validKeys.has(key)) continue;
    if (cache && meta?.url) await cache.delete(meta.url).catch(() => {});
    delete usenCacheMeta[key];
    state.cache.delete(key);
    usenRuntimeVersions.delete(key);
  }

  saveUsenCacheMeta();
}

function showUsenHistoryPreparing() {
  el.historySongSelect.disabled = true;
  el.historySongSelect.replaceChildren();
  const option = document.createElement("option");
  option.textContent = "履歴を準備中…";
  option.value = "";
  el.historySongSelect.append(option);
}

async function hydrateUsenHistory(generation) {
  const files = state.files.slice();

  await runUsenWithConcurrency(files, async (file) => {
    try {
      await loadUsenFile(file);
    } catch (error) {
      console.warn(`Failed to load USEN history: ${fileKey(file)}`, error);
    }
  });

  if (generation !== usenLoadGeneration) return;

  await cleanUsenPersistentCache(files);
  populateSongs();
  el.historySongSelect.disabled = false;
  usenHistoryReady = true;

  if (state.currentView === "song") renderHistory();
}

loadPeriod = async function loadCachedPeriod(file) {
  showLoading(`${periodLabel(file.date)}を読み込んでいます。`);

  try {
    const data = await loadUsenFile(file);
    state.currentFile = file;
    state.currentData = data;
    renderPeriod();
    showApp();
  } catch (error) {
    showError(error);
  }
};

loadManifest = async function loadManifestWithPersistentCache(preserve = false) {
  const generation = ++usenLoadGeneration;
  showLoading("manifest.jsonを確認しています。");
  el.refreshButton.disabled = true;
  usenHistoryReady = false;

  try {
    const manifest = await fetchJson(MANIFEST_URL);
    if (generation !== usenLoadGeneration) return;

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

    const target = preserve && state.currentFile
      ? state.files.find((file) => fileKey(file) === fileKey(state.currentFile)) || state.files[0]
      : state.files[0];

    el.periodSelect.value = fileKey(target);
    const data = await loadUsenFile(target);
    if (generation !== usenLoadGeneration) return;

    state.currentFile = target;
    state.currentData = data;
    renderPeriod();
    showApp();

    showUsenHistoryPreparing();
    usenHistoryLoadPromise = hydrateUsenHistory(generation);
  } catch (error) {
    if (generation === usenLoadGeneration) showError(error);
  } finally {
    if (generation === usenLoadGeneration) el.refreshButton.disabled = false;
  }
};

const usenBaseSwitchView = switchView;
switchView = function switchViewWithLazyHistory(view) {
  usenBaseSwitchView(view);

  if (view === "song" && !usenHistoryReady) {
    el.historySongSelect.disabled = true;
    usenHistoryLoadPromise.catch((error) => {
      console.warn("Failed to prepare USEN history.", error);
    });
  }
};
