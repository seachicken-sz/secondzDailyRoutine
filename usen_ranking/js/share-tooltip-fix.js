"use strict";

const baseExportChartImageWithoutTooltip = exportChartImage;

exportChartImage = function exportChartImageWithoutTooltip(options) {
  const chart = options?.chart;

  if (chart) {
    chart.setActiveElements([]);

    if (chart.tooltip) {
      if (typeof chart.tooltip.setActiveElements === "function") {
        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
      }
      chart.tooltip.opacity = 0;
    }

    chart.update("none");
  }

  return baseExportChartImageWithoutTooltip(options);
};
