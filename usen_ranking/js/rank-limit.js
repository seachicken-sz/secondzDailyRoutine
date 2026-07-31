"use strict";

const USEN_GRAPH_MAX_RANK = 50;

const baseChartOptionsForRankLimit = chartOptions;
chartOptions = function chartOptionsTop50(min, max, absolute) {
  const options = baseChartOptionsForRankLimit(min, max, absolute);

  options.scales.y.max = USEN_GRAPH_MAX_RANK;
  options.scales.y.afterBuildTicks = (axis) => {
    axis.ticks = [1, 20, 30, 50].map((value) => ({ value }));
  };

  return options;
};

function toTop50Point(x, rank) {
  return {
    x,
    y: rank >= 1 && rank <= USEN_GRAPH_MAX_RANK ? rank : null,
  };
}

renderPeriodChart = function renderTop50PeriodChart() {
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
        .map((point) => toTop50Point(Date.parse(point.capturedAt), point.rank)),
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

renderHistoryChart = function renderTop50HistoryChart(weeks) {
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
  el.historyChartSurface.style.width = el.historyChartSurface.classList.contains("is-large") ? "920px" : "100%";

  const start = 0;
  const end = 7 * DAY;

  const datasets = selected.map((week) => {
    const base = Date.parse(week.data.period.startAt);
    const isLatestSelected = fileKey(week.file) === fileKey(selected[0].file);
    const color = getHistorySeriesColor(week, weeks, active);

    return {
      label: `${formatDateKey(week.file.date)}開始`,
      data: week.song.points
        .map((point) => toTop50Point(Date.parse(point.capturedAt) - base, point.rank))
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
