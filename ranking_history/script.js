'use strict';

const RANKING_HISTORY_JSON_URL = './tverRankingHistory48h.json';

const state = {
  data: null,
  snapshotIndex: -1,
  rankingType: '',
  filter: 'all',
  searchQuery: ''
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  loadRankingHistory();
});

function cacheElements() {
  [
    'latestUpdatedAt','currentObservedAt','snapshotPosition',
    'previousSnapshotButton','nextSnapshotButton','rankingTabs',
    'rankingSearchInput','clearSearchButton','searchResultText',
    'statusMessage','rankingContent','rankingTypeLabel',
    'rankingTableTitle','rankingTableSection','rankingTableBody',
    'emptyRankingMessage','outSection','outList',
    'rankedCount','upCount','newCount','outCount',
    'historyTimeHeader'
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });

  elements.filterCards = Array.from(document.querySelectorAll('[data-filter]'));
}

function bindEvents() {
  elements.previousSnapshotButton.addEventListener('click', () => moveSnapshot(-1));
  elements.nextSnapshotButton.addEventListener('click', () => moveSnapshot(1));

  document.querySelector('.summary-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter || 'all';
    render();
  });

  elements.rankingSearchInput.addEventListener('input', (event) => {
    state.searchQuery = normalizeSearchText(event.target.value);
    elements.clearSearchButton.disabled = !state.searchQuery;
    render();
  });

  elements.clearSearchButton.addEventListener('click', () => {
    elements.rankingSearchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchButton.disabled = true;
    elements.rankingSearchInput.focus();
    render();
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable;

    if (isTyping || state.searchQuery) return;
    if (event.key === 'ArrowLeft') moveSnapshot(-1);
    if (event.key === 'ArrowRight') moveSnapshot(1);
  });
}

async function loadRankingHistory() {
  setStatus('ランキングデータを読み込んでいます。');

  try {
    const response = await fetch(RANKING_HISTORY_JSON_URL, { cache: 'no-store' });
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
  if (!data.snapshots.length) return -1;
  const latestIndex = Number(data.latestIndex);
  return Number.isInteger(latestIndex) &&
    latestIndex >= 0 &&
    latestIndex < data.snapshots.length
      ? latestIndex
      : data.snapshots.length - 1;
}

function resolveInitialRankingType(data, snapshotIndex) {
  const definitions = getRankingTypeDefinitions(data);
  const snapshot = data.snapshots[snapshotIndex];

  if (snapshot?.types) {
    const found = definitions.find((definition) =>
      Object.prototype.hasOwnProperty.call(snapshot.types, definition.type)
    );
    if (found) return found.type;

    const firstType = Object.keys(snapshot.types)[0];
    if (firstType) return firstType;
  }

  return definitions[0]?.type || '';
}

function getRankingTypeDefinitions(data) {
  if (!Array.isArray(data.rankingTypes)) return [];
  return data.rankingTypes
    .filter((definition) => definition?.type)
    .map((definition) => ({
      type: String(definition.type),
      label: String(definition.label || definition.type)
    }));
}

function buildRankingTabs() {
  elements.rankingTabs.replaceChildren();

  getRankingTypeDefinitions(state.data).forEach((definition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ranking-tab';
    button.role = 'tab';
    button.dataset.rankingType = definition.type;
    button.textContent = definition.label;
    button.setAttribute('aria-selected', String(definition.type === state.rankingType));

    button.addEventListener('click', () => {
      state.rankingType = definition.type;
      render();
    });

    elements.rankingTabs.appendChild(button);
  });
}

function moveSnapshot(direction) {
  if (!state.data || state.snapshotIndex < 0 || state.searchQuery) return;

  const nextIndex = state.snapshotIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.data.snapshots.length) return;

  state.snapshotIndex = nextIndex;
  const snapshot = state.data.snapshots[nextIndex];

  if (!snapshot.types ||
      !Object.prototype.hasOwnProperty.call(snapshot.types, state.rankingType)) {
    state.rankingType = resolveInitialRankingType(state.data, nextIndex);
  }

  render();
}

function render() {
  if (!state.data) return;

  if (state.snapshotIndex < 0 || !state.data.snapshots.length) {
    elements.rankingContent.hidden = true;
    setStatus('ランキング履歴データはありません。');
    updateNavigationButtons();
    return;
  }

  setStatus('');
  elements.rankingContent.hidden = false;
  updateTabs();
  updateFilterCards();

  if (state.searchQuery) {
    renderAllPeriodSearch();
  } else {
    renderCurrentSnapshot();
  }
}

function renderCurrentSnapshot() {
  const snapshot = state.data.snapshots[state.snapshotIndex];
  const typeResult = snapshot.types?.[state.rankingType] || { items: [], out: [] };
  const items = Array.isArray(typeResult.items) ? typeResult.items : [];
  const outItems = Array.isArray(typeResult.out) ? typeResult.out : [];

  elements.currentObservedAt.textContent = snapshot.observedAt || '--';
  elements.snapshotPosition.textContent = buildSnapshotPositionText();
  elements.rankingTableTitle.textContent = '順位表';
  elements.historyTimeHeader.textContent = '初登場時刻';

  updateNavigationButtons();
  updateSummary(items, outItems);
  elements.searchResultText.textContent = '';

  const filteredItems = filterRankingItems(items, state.filter);
  const showOutOnly = state.filter === 'out';

  elements.rankingTableSection.hidden = showOutOnly;
  renderRankingTable(showOutOnly ? [] : filteredItems, false);
  renderOutList(showOutOnly || state.filter === 'all' ? outItems : [], false);
  elements.emptyRankingMessage.textContent = buildEmptyMessage(state.filter, false);

  updateRankingTypeLabel();
}

function renderAllPeriodSearch() {
  const history = collectAllPeriodHistory();
  const rankedHistory = history.ranked;
  const outHistory = history.out;

  elements.currentObservedAt.textContent = '全期間検索';
  elements.snapshotPosition.textContent =
    `${state.data.rangeStartAt || '最古'} ～ ${state.data.rangeEndAt || state.data.updatedAt || '最新'}`;
  elements.rankingTableTitle.textContent = '全期間のランキング履歴';
  elements.historyTimeHeader.textContent = '取得時刻';

  updateNavigationButtons();
  updateSummary(rankedHistory, outHistory);

  const filteredRanked = filterRankingItems(rankedHistory, state.filter);
  const showOutOnly = state.filter === 'out';

  elements.rankingTableSection.hidden = showOutOnly;
  renderRankingTable(showOutOnly ? [] : filteredRanked, true);
  renderOutList(showOutOnly || state.filter === 'all' ? outHistory : [], true);
  elements.emptyRankingMessage.textContent = buildEmptyMessage(state.filter, true);

  const visibleCount = showOutOnly ? outHistory.length : filteredRanked.length;
  elements.searchResultText.textContent =
    `「${elements.rankingSearchInput.value.trim()}」の全期間履歴：${visibleCount}件`;

  updateRankingTypeLabel();
}

function collectAllPeriodHistory() {
  const ranked = [];
  const out = [];

  state.data.snapshots.forEach((snapshot) => {
    const typeResult = snapshot.types?.[state.rankingType];
    if (!typeResult) return;

    (Array.isArray(typeResult.items) ? typeResult.items : []).forEach((item) => {
      if (!matchesSearch(item.episodeId)) return;
      ranked.push({
        ...item,
        observedAt: snapshot.observedAt || ''
      });
    });

    (Array.isArray(typeResult.out) ? typeResult.out : []).forEach((item) => {
      if (!matchesSearch(item.episodeId)) return;
      out.push({
        ...item,
        observedAt: snapshot.observedAt || ''
      });
    });
  });

  ranked.sort(compareHistoryNewestFirst);
  out.sort(compareHistoryNewestFirst);
  return { ranked, out };
}

function compareHistoryNewestFirst(a, b) {
  return parseDisplayDate(b.observedAt) - parseDisplayDate(a.observedAt);
}

function parseDisplayDate(value) {
  const normalized = String(value || '').replace(/\//g, '-').replace(' ', 'T');
  const time = new Date(normalized).getTime();
  return Number.isFinite(time) ? time : 0;
}

function matchesSearch(episodeId) {
  const episode = getEpisode(episodeId);
  return normalizeSearchText(
    `${episode.programTitle || ''} ${episode.episodeTitle || ''}`
  ).includes(state.searchQuery);
}

function buildSnapshotPositionText() {
  const total = state.data.snapshots.length;
  const current = state.snapshotIndex + 1;
  const isLatest = state.snapshotIndex === total - 1;
  return `${current} / ${total}${isLatest ? '・最新' : ''}`;
}

function updateNavigationButtons() {
  const hasData = Boolean(state.data?.snapshots?.length);
  const searching = Boolean(state.searchQuery);

  elements.previousSnapshotButton.disabled =
    searching || !hasData || state.snapshotIndex <= 0;
  elements.nextSnapshotButton.disabled =
    searching || !hasData || state.snapshotIndex >= state.data.snapshots.length - 1;
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
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function updateRankingTypeLabel() {
  const definition = getRankingTypeDefinitions(state.data)
    .find((item) => item.type === state.rankingType);
  elements.rankingTypeLabel.textContent =
    definition?.label || state.rankingType || 'ランキング';
}

function filterRankingItems(items, filter) {
  if (filter === 'up') {
    return items.filter((item) => normalizeChangeType(item.changeType) === 'up');
  }
  if (filter === 'new') {
    return items.filter((item) => normalizeChangeType(item.changeType) === 'new');
  }
  if (filter === 'out') return [];
  return items;
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildEmptyMessage(filter, isAllPeriod) {
  const scope = isAllPeriod ? '全期間で検索条件に一致する' : 'この取得時点で';

  if (filter === 'up') return `${scope}順位アップ履歴はありません。`;
  if (filter === 'new') return `${scope}新規ランクイン履歴はありません。`;
  if (filter === 'out') return `${scope}圏外履歴はありません。`;
  return isAllPeriod
    ? '全期間で検索条件に一致するランキング履歴はありません。'
    : 'この取得時点のランキングデータはありません。';
}

function updateSummary(items, outItems) {
  elements.rankedCount.textContent = String(items.length);
  elements.upCount.textContent = String(
    items.filter((item) => normalizeChangeType(item.changeType) === 'up').length
  );
  elements.newCount.textContent = String(
    items.filter((item) => normalizeChangeType(item.changeType) === 'new').length
  );
  elements.outCount.textContent = String(outItems.length);
}

function renderRankingTable(items, isAllPeriod) {
  elements.rankingTableBody.replaceChildren();
  elements.emptyRankingMessage.hidden = items.length > 0;

  items.forEach((item) => {
    const episode = getEpisode(item.episodeId);
    const row = document.createElement('tr');

    row.appendChild(createRankCell(item.rank));
    row.appendChild(createChangeCell(item));
    row.appendChild(createEpisodeCell(episode));
    row.appendChild(createTextCell(episode.broadcaster || '-', '放送局'));

    const bestRank = item.bestRankAllTime ?? item.bestRank48h ?? null;
    row.appendChild(createTextCell(
      bestRank ? `${bestRank}位` : '-',
      '全期間最高'
    ));

    row.appendChild(
      isAllPeriod
        ? createTextCell(item.observedAt || '-', '取得時刻')
        : createFirstAppearanceCell(item)
    );

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
  const type = normalizeChangeType(item.changeType);
  badge.className = `change-badge ${type}`;
  badge.textContent = buildChangeDisplayText(item);
  badge.title = buildChangeTitle(item);
  cell.appendChild(badge);
  return cell;
}

function normalizeChangeType(value) {
  const normalized = String(value || '').toLowerCase();
  return ['up', 'down', 'keep', 'new'].includes(normalized)
    ? normalized
    : 'keep';
}

function buildChangeDisplayText(item) {
  const type = normalizeChangeType(item.changeType);
  if (type === 'up') return `↑ ${item.changeText || ''}`.trim();
  if (type === 'down') return `↓ ${item.changeText || ''}`.trim();
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
  programTitle.className = 'program-title';
  programTitle.textContent = episode.programTitle || '番組名なし';

  const episodeTitle = document.createElement('span');
  episodeTitle.className = 'episode-title';
  episodeTitle.textContent = episode.episodeTitle || 'エピソード名なし';

  cell.append(programTitle, episodeTitle);
  return cell;
}

function createTextCell(text, label = '') {
  const cell = document.createElement('td');
  if (label) cell.dataset.label = label;

  const value = document.createElement('span');
  value.className = 'meta-value';
  value.textContent = text;
  cell.appendChild(value);
  return cell;
}

function createFirstAppearanceCell(item) {
  const value =
    item.firstAppearedAtAllTime ??
    item.firstAppearedAt48h ??
    '';

  return createTextCell(value || '-', '初登場時刻');
}

function renderOutList(outItems, isAllPeriod) {
  elements.outList.replaceChildren();
  elements.outSection.hidden = outItems.length === 0;

  outItems.forEach((item) => {
    const episode = getEpisode(item.episodeId);
    const container = document.createElement('article');
    container.className = 'out-item';

    const badge = document.createElement('span');
    badge.className = 'out-badge';
    badge.textContent = item.changeText || 'OUT';

    const titles = document.createElement('div');
    const programTitle = document.createElement('span');
    programTitle.className = 'program-title';
    programTitle.textContent = episode.programTitle || '番組名なし';

    const episodeTitle = document.createElement('span');
    episodeTitle.className = 'episode-title';
    episodeTitle.textContent = episode.episodeTitle || 'エピソード名なし';
    titles.append(programTitle, episodeTitle);

    const detail = document.createElement('span');
    detail.className = 'out-previous-rank';
    const rankText = item.previousRank ? `前回 ${item.previousRank}位` : '前回順位なし';
    detail.textContent = isAllPeriod && item.observedAt
      ? `${item.observedAt}・${rankText}`
      : rankText;

    container.append(badge, titles, detail);
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
