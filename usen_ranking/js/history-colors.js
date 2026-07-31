"use strict";

renderHistory = function renderHistoryWithFocusedLatest() {
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

  const allActive = new Set(weeks.map((week) => fileKey(week.file)));
  const items = weeks.map((week) => ({
    id: fileKey(week.file),
    label: `${formatDateKey(week.file.date)}開始`,
    color: getHistorySeriesColor(week, weeks, allActive),
  }));

  renderSeriesControls(el.historySeriesControls, items, () => {
    updateHistorySeriesControlColors(weeks);
    renderHistoryChart(weeks);
  });

  updateHistorySeriesControlColors(weeks);
  renderHistoryChart(weeks);
  renderHistoryTable(weeks);
};

renderHistoryChart = function renderFocusedHistoryChart(weeks) {
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
    const isLatestSelected = fileKey(week.file) === fileKey(selected[0].file);
    const color = getHistorySeriesColor(week, weeks, active);

    return {
      label: `${formatDateKey(week.file.date)}開始`,
      data: week.song.points
        .map((point) => ({ x: Date.parse(point.capturedAt) - base, y: point.rank }))
        .filter((point) => point.x >= 0 && point.x < end),
      borderColor: color,
      backgroundColor: color,
      borderWidth: isLatestSelected ? 3 : 2.2,
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
};

function getHistorySeriesColor(week, weeks, activeIdsSet) {
  const activeWeeks = weeks.filter((item) => activeIdsSet.has(fileKey(item.file)));
  const activeIndex = activeWeeks.findIndex((item) => fileKey(item.file) === fileKey(week.file));

  if (activeIndex < 0) return "rgba(107,114,128,.18)";
  if (activeIndex === 0) return "#02b9a5";

  const olderCount = Math.max(1, activeWeeks.length - 1);
  const ratio = olderCount <= 1 ? 0 : (activeIndex - 1) / Math.max(1, olderCount - 1);
  const opacity = .78 - ratio * .5;
  return `rgba(107,114,128,${Math.max(.28, opacity).toFixed(2)})`;
}

function updateHistorySeriesControlColors(weeks) {
  const active = activeIds(el.historySeriesControls);

  el.historySeriesControls
    .querySelectorAll('.series-list input[type="checkbox"]')
    .forEach((input) => {
      const week = weeks.find((item) => fileKey(item.file) === input.value);
      const dot = input.closest(".series-chip")?.querySelector(".series-dot");
      if (!week || !dot) return;
      dot.style.background = getHistorySeriesColor(week, weeks, active);
    });
}
