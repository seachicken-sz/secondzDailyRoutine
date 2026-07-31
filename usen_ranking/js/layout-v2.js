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

document.addEventListener("DOMContentLoaded", applyViewTabClasses);
