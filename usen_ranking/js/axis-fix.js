"use strict";

const USEN_DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

window.renderChart = function renderFixedPeriodChart(data, songs) {
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const periodStart = usenParseTimestamp(data.period && data.period.startAt);
  const periodEnd = usenParseTimestamp(data.period && data.period.endAt);
  const hasPoints = songs.some((song) => song.points.length > 0);

  elements.chartTitle.textContent = songs.length === 1
    ? `${songs[0].songTitle || songs[0].songId} 順位推移`
    : "全曲 順位推移";

  if (!window.Chart) {
    usenShowChartEmpty("グラフライブラリを読み込めませんでした。");
    return;
  }

  if (!hasPoints) {
    usenShowChartEmpty("表示できる順位データがありません。");
    return;
  }

  if (periodStart === null || periodEnd === null || periodEnd <= periodStart) {
    usenShowChartEmpty("グラフ期間を判定できませんでした。");
    return;
  }

  elements.chartEmptyMessage.hidden = true;
  elements.chartScroll.hidden = false;

  const periodDays = Math.max(1, (periodEnd - periodStart) / USEN_DAY_MILLISECONDS);
  elements.chartSurface.style.width = `${Math.max(760, periodDays * 180)}px`;

  const timeline = usenBuildTimeline(data.snapshots || [], periodStart, periodEnd);
  const allRanks = songs.flatMap((song) => song.points.map((point) => point.rank));
  const maxRank = Math.max(20, Math.ceil(Math.max(...allRanks) / 10) * 10);

  const datasets = songs.map((song, index) => {
    const rankMap = new Map(
      song.points
        .map((point) => [usenParseTimestamp(point.capturedAt), point.rank])
        .filter(([timestamp]) => (
          timestamp !== null
          && timestamp >= periodStart
          && timestamp < periodEnd
        ))
    );

    const color = CHART_COLORS[index % CHART_COLORS.length];

    return {
      label: song.songTitle || song.songId,
      data: timeline.map((timestamp) => ({
        x: timestamp,
        y: rankMap.has(timestamp) ? rankMap.get(timestamp) : null,
      })),
      parsing: false,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2.5,
      pointRadius(context) {
        return context.raw && context.raw.y !== null ? 2.5 : 0;
      },
      pointHoverRadius: 5,
      tension: 0.15,
      spanGaps: false,
    };
  });

  state.chart = new Chart(elements.rankingChart, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      normalized: true,
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
          filter(item) {
            return item.parsed.y !== null;
          },
          callbacks: {
            title(items) {
              return items.length ? formatDisplayDateTime(items[0].parsed.x) : "";
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
          min: periodStart,
          max: periodEnd,
          bounds: "ticks",
          grid: {
            color: "rgba(120, 140, 140, 0.12)",
          },
          ticks: {
            stepSize: USEN_DAY_MILLISECONDS,
            autoSkip: false,
            maxRotation: 0,
            callback(value) {
              return usenFormat18AxisLabel(value);
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
};

function usenBuildTimeline(snapshots, periodStart, periodEnd) {
  const values = new Set([periodStart, periodEnd]);

  snapshots.forEach((value) => {
    const timestamp = usenParseTimestamp(value);

    if (timestamp !== null && timestamp >= periodStart && timestamp < periodEnd) {
      values.add(timestamp);
    }
  });

  return [...values].sort((a, b) => a - b);
}

function usenParseTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function usenFormat18AxisLabel(value) {
  const date = new Date(Number(value));

  if (Number.isNaN(date.getTime())) {
    return "";
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

function usenShowChartEmpty(message) {
  elements.chartEmptyMessage.hidden = false;
  elements.chartEmptyMessage.textContent = message;
  elements.chartScroll.hidden = true;
}
