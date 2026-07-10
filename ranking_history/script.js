'use strict';

const RANKING_HISTORY_JSON_URL = './tverRankingHistory48h.json';

const state = {
  data: null,
  snapshotIndex: -1,
  rankingType: '',
  filter: 'all'
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  loadRankingHistory();
});

function cacheElements() {
  elements.latestUpdatedAt = document.getElementById('latestUpdatedAt');
  elements.currentObservedAt = document.getElementById('currentObservedAt');
  elements.snapshotPosition = document.getElementById('snapshotPosition');
  elements.previousSnapshotButton = document.getElementById('previousSnapshotButton');
  elements.nextSnapshotButton = document.getElementById('nextSnapshotButton');
  elements.rankingTabs = document.getElementById('rankingTabs');
  elements.statusMessage = document.getElementById('statusMessage');
  elements.rankingContent = document.getElementById('rankingContent');
  elements.rankingTypeLabel = document.getElementById('rankingTypeLabel');
  elements.rankingTableSection = document.getElementById('rankingTableSection');
  elements.rankingTableBody = document.getElementById('rankingTableBody');
  elements.emptyRankingMessage = document.getElementById('emptyRankingMessage');
  elements.outSection = document.getElementById('outSection');
  elements.outList = document.getElementById('outList');
  elements.rankedCount = document.getElementById('rankedCount');
  elements.upCount = document.getElementById('upCount');
  elements.newCount = document.getElementById('newCount');
  elements.outCount = document.getElementById('outCount');
  elements.filterCards = Array.from(document.querySelectorAll('[data-filter]'));
}

function bindEvents() {
  elements.previousSnapshotButton.addEventListener('click', () => {
    moveSnapshot(-1);
  });

  elements.nextSnapshotButton.addEventListener('click', () => {
    moveSnapshot(1);
  });

  elements.filterCards.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter || 'all';
      render();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      moveSnapshot(-1);
    }

    if (event.key === 'ArrowRight') {
      moveSnapshot(1);
    }
  });
}

async function loadRankingHistory() {
  setStatus('ランキングデータを読み込んでいます。');

  try {
    const response = await fetch(RANKING_HISTORY_JSON_URL, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`JSON取得に失敗しました。status=${response.status}`);
    }

    const data = await response.json();
    validateRankingHistoryData(data);

    state.data = data;
    state.snapshotIndex = resolveInitialSnapshotIndex(data);
    state.rankingType = resolveInitialRankingType(data, state.snapshotIndex);

    elements.latestUpdatedAt.textContent = data.updatedAt || '--';

    buildRankingTabs();
    render();
  } catch (error) {
    console.error(error);
    setStatus(
      'ランキングデータを読み込めませんでした。JSONの配置先とファイル名を確認してください。',
      true
    );
  }
}

function validateRankingHistoryData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('JSONがオブジェクトではありません。');
  }

  if (!Array.isArray(data.snapshots)) {
    throw new Error('snapshotsが配列ではありません。');
  }

  if (!data.episodes || typeof data.episodes !== 'object') {
    throw new Error('episodesがありません。');
  }
}

function resolveInitialSnapshotIndex(data) {
  if (data.snapshots.length === 0) {
    return -1;
  }

  const latestIndex = Number(data.latestIndex);

  if (
    Number.isInteger(latestIndex) &&
    latestIndex >= 0 &&
    latestIndex < data.snapshots.length
  ) {
    return latestIndex;
  }

  return data.snapshots.length - 1;
}

function resolveInitialRankingType(data, snapshotIndex) {
  const definitions = getRankingTypeDefinitions(data);
  const snapshot = data.snapshots[snapshotIndex] || null;

  if (snapshot && snapshot.types) {
    const availableDefinition = definitions.find((definition) => {
      return Object.prototype.hasOwnProperty.call(snapshot.types, definition.type);
    });

    if (availableDefinition) {
      return availableDefinition.type;
    }

    const firstSnapshotType = Object.keys(snapshot.types)[0];

    if (firstSnapshotType) {
      return firstSnapshotType;
    }
  }

  return definitions[0]?.type || '';
}

function getRankingTypeDefinitions(data) {
  if (Array.isArray(data.rankingTypes)) {
    return data.rankingTypes
      .filter((definition) => definition && definition.type)
      .map((definition) => ({
        type: String(definition.type),
        label: String(definition.label || definition.type)
      }));
  }

  return [];
}

function buildRankingTabs() {
  elements.rankingTabs.replaceChildren();

  const definitions = getRankingTypeDefinitions(state.data);

  definitions.forEach((definition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ranking-tab';
    button.role = 'tab';
    button.dataset.rankingType = definition.type;
    button.textContent = definition.label;
    button.setAttribute(
      'aria-selected',
      String(definition.type === state.rankingType)
    );

    button.addEventListener('click', () => {
      state.rankingType = definition.type;
      render();
    });

    elements.rankingTabs.appendChild(button);
  });
}

function moveSnapshot(direction) {
  if (!state.data || state.snapshotIndex < 0) {
    return;
  }

  const nextIndex = state.snapshotIndex + direction;

  if (nextIndex < 0 || nextIndex >= state.data.snapshots.length) {
    return;
  }

  state.snapshotIndex = nextIndex;

  const snapshot = state.data.snapshots[nextIndex];

  if (
    !snapshot.types ||
    !Object.prototype.hasOwnProperty.call(snapshot.types, state.rankingType)
  ) {
    state.rankingType = resolveInitialRankingType(state.data, nextIndex);
  }

  render();
}

function render() {
  if (!state.data) {
    return;
  }

  if (state.snapshotIndex < 0 || state.data.snapshots.length === 0) {
    elements.rankingContent.hidden = true;
    setStatus('過去48時間内のランキングデータはありません。');
    updateNavigationButtons();
    return;
  }

  const snapshot = state.data.snapshots[state.snapshotIndex];
  const typeResult = snapshot.types?.[state.rankingType] || {
    items: [],
    out: []
  };

  const items = Array.isArray(typeResult.items) ? typeResult.items : [];
  const outItems = Array.isArray(typeResult.out) ? typeResult.out : [];

  setStatus('');
  elements.rankingContent.hidden = false;
  elements.currentObservedAt.textContent = snapshot.observedAt || '--';
  elements.snapshotPosition.textContent = buildSnapshotPositionText();

  updateNavigationButtons();
  updateTabs();
  updateFilterCards();
  updateSummary(items, outItems);

  const filteredItems = filterRankingItems(items, state.filter);
  const showOutOnly = state.filter === 'out';

  elements.rankingTableSection.hidden = showOutOnly;
  renderRankingTable(showOutOnly ? [] : filteredItems);
  renderOutList(showOutOnly || state.filter === 'all' ? outItems : []);
  elements.emptyRankingMessage.textContent = buildEmptyMessage(state.filter);

  if (showOutOnly) {
    elements.emptyRankingMessage.hidden = outItems.length > 0;
  }

  const definition = getRankingTypeDefinitions(state.data).find((item) => {
    return item.type === state.rankingType;
  });

  elements.rankingTypeLabel.textContent = definition?.label || state.rankingType || 'ランキング';
}

function buildSnapshotPositionText() {
  const total = state.data.snapshots.length;
  const current = state.snapshotIndex + 1;
  const isLatest = state.snapshotIndex === total - 1;

  return `${current} / ${total}${isLatest ? '・最新' : ''}`;
}

function updateNavigationButtons() {
  const hasData = Boolean(state.data && state.data.snapshots.length > 0);

  elements.previousSnapshotButton.disabled = !hasData || state.snapshotIndex <= 0;
  elements.nextSnapshotButton.disabled =
    !hasData ||
    state.snapshotIndex >= state.data.snapshots.length - 1;
}

function updateTabs() {
  elements.rankingTabs.querySelectorAll('.ranking-tab').forEach((button) => {
    button.setAttribute(
      'aria-selected',
      String(button.dataset.rankingType === state.rankingType)
    );
  });
}

function updateFilterCards() {
  elements.filterCards.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function filterRankingItems(items, filter) {
  if (filter === 'up') {
    return items.filter((item) => item.changeType === 'up');
  }

  if (filter === 'new') {
    return items.filter((item) => item.changeType === 'new');
  }

  if (filter === 'out') {
    return [];
  }

  return items;
}

function buildEmptyMessage(filter) {
  if (filter === 'up') {
    return 'この取得時点で順位アップしたエピソードはありません。';
  }

  if (filter === 'new') {
    return 'この取得時点で新規ランクインしたエピソードはありません。';
  }

  if (filter === 'out') {
    return '今回圏外になったエピソードはありません。';
  }

  return 'この取得時点のランキングデータはありません。';
}

function updateSummary(items, outItems) {
  elements.rankedCount.textContent = String(items.length);
  elements.upCount.textContent = String(
    items.filter((item) => item.changeType === 'up').length
  );
  elements.newCount.textContent = String(
    items.filter((item) => item.changeType === 'new').length
  );
  elements.outCount.textContent = String(outItems.length);
}

function renderRankingTable(items) {
  elements.rankingTableBody.replaceChildren();
  elements.emptyRankingMessage.hidden = items.length > 0;

  items.forEach((item) => {
    const episode = getEpisode(item.episodeId);
    const row = document.createElement('tr');

    row.appendChild(createRankCell(item.rank));
    row.appendChild(createChangeCell(item));
    row.appendChild(createEpisodeCell(episode));
    row.appendChild(createTextCell(episode.broadcaster || '-', '放送局'));
    row.appendChild(createTextCell(
      item.bestRank48h ? `${item.bestRank48h}位` : '-',
      '48h最高'
    ));
    row.appendChild(createFirstAppearanceCell(item));

    elements.rankingTableBody.appendChild(row);
  });
}

function createRankCell(rank) {
  const cell = document.createElement('td');
  cell.dataset.label = '順位';
  cell.className = 'mobile-rank-cell';
  const value = document.createElement('span');
  value.className = 'rank-value';
  value.textContent = `${rank}位`;
  cell.appendChild(value);
  return cell;
}

function createChangeCell(item) {
  const cell = document.createElement('td');
  cell.dataset.label = '前回比';
  cell.className = 'mobile-change-cell';
  const badge = document.createElement('span');
  const changeType = normalizeChangeType(item.changeType);

  badge.className = `change-badge ${changeType}`;
  badge.textContent = buildChangeDisplayText(item);
  badge.title = buildChangeTitle(item);

  cell.appendChild(badge);
  return cell;
}

function normalizeChangeType(value) {
  const allowed = new Set(['up', 'down', 'keep', 'new']);
  return allowed.has(value) ? value : 'keep';
}

function buildChangeDisplayText(item) {
  if (item.changeType === 'up') {
    return `↑ ${item.changeText || ''}`.trim();
  }

  if (item.changeType === 'down') {
    return `↓ ${item.changeText || ''}`.trim();
  }

  return item.changeText || '-';
}

function buildChangeTitle(item) {
  if (item.previousRank === null || item.previousRank === undefined) {
    return '前回の取得時点ではランク外です。';
  }

  return `前回 ${item.previousRank}位 → 今回 ${item.rank}位`;
}

function createEpisodeCell(episode) {
  const cell = document.createElement('td');
  cell.dataset.label = '番組・エピソード';
  cell.className = 'mobile-title-cell';
  const programTitle = document.createElement('span');
  const episodeTitle = document.createElement('span');

  programTitle.className = 'program-title';
  programTitle.textContent = episode.programTitle || '番組名なし';

  episodeTitle.className = 'episode-title';
  episodeTitle.textContent = episode.episodeTitle || 'エピソード名なし';

  cell.append(programTitle, episodeTitle);
  return cell;
}

function createTextCell(text, label = '') {
  const cell = document.createElement('td');
  if (label) {
    cell.dataset.label = label;
  }
  const value = document.createElement('span');
  value.className = 'meta-value';
  value.textContent = text;
  cell.appendChild(value);
  return cell;
}

function createFirstAppearanceCell(item) {
  const cell = document.createElement('td');
  cell.dataset.label = '初登場時刻';
  const value = document.createElement('span');

  value.className = 'first-appearance-value';
  value.textContent = item.firstAppearedAt48h || '-';

  cell.appendChild(value);
  return cell;
}

function renderOutList(outItems) {
  elements.outList.replaceChildren();
  elements.outSection.hidden = outItems.length === 0;

  outItems.forEach((item) => {
    const episode = getEpisode(item.episodeId);
    const container = document.createElement('article');
    const badge = document.createElement('span');
    const titles = document.createElement('div');
    const programTitle = document.createElement('span');
    const episodeTitle = document.createElement('span');
    const previousRank = document.createElement('span');

    container.className = 'out-item';
    badge.className = 'out-badge';
    badge.textContent = item.changeText || 'OUT';

    programTitle.className = 'program-title';
    programTitle.textContent = episode.programTitle || '番組名なし';

    episodeTitle.className = 'episode-title';
    episodeTitle.textContent = episode.episodeTitle || 'エピソード名なし';

    previousRank.className = 'out-previous-rank';
    previousRank.textContent = item.previousRank
      ? `前回 ${item.previousRank}位`
      : '前回順位なし';

    titles.append(programTitle, episodeTitle);
    container.append(badge, titles, previousRank);
    elements.outList.appendChild(container);
  });
}

function getEpisode(episodeId) {
  return state.data.episodes?.[episodeId] || {
    programTitle: '',
    episodeTitle: '',
    broadcaster: ''
  };
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.hidden = !message;
  elements.statusMessage.classList.toggle('is-error', isError);
}
