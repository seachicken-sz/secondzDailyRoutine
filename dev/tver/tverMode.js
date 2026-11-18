// TVerモード：通常ホームとの切替・視聴チェック・共有
// 通常・TVer・ドリパスの起動時表示は一つのキーで排他管理する。
function getHomeDefaultMode() {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.homeDefaultMode);
    if (mode === "normal" || mode === "tver" || mode === "dreampass" || mode === "usen") return mode;
    // TVer単独だった旧設定から一度だけ移行する。
    const legacy = localStorage.getItem(STORAGE_KEYS.tverModeDefault);
    const migrated = legacy === "true" ||
      (legacy === null && localStorage.getItem(STORAGE_KEYS.tverModeEnabled) === "true")
      ? "tver" : "normal";
    localStorage.setItem(STORAGE_KEYS.homeDefaultMode, migrated);
    return migrated;
  } catch (error) {
    console.warn("起動時の表示設定を読み込めませんでした", error);
    return "normal";
  }
}
function syncHomeDefaultModeCheckboxes() {
  const mode = getHomeDefaultMode();
  const tver = document.getElementById("tverModeDefaultCheckbox");
  const dreamPass = document.getElementById("dreamPassModeDefaultCheckbox");
  const usen = document.getElementById("usenModeDefaultCheckbox");
  if (tver) tver.checked = mode === "tver";
  if (dreamPass) dreamPass.checked = mode === "dreampass";
  if (usen) usen.checked = mode === "usen";
}
function setHomeDefaultMode(nextMode, changedMode) {
  // 選択中のチェックを解除した場合のみ通常ホームに戻す。
  const current = getHomeDefaultMode();
  const mode = nextMode === "normal" && current !== changedMode ? current : nextMode;
  try {
    localStorage.setItem(STORAGE_KEYS.homeDefaultMode, mode);
  } catch (error) {
    console.warn("起動時の表示設定を保存できませんでした", error);
  }
  syncHomeDefaultModeCheckboxes();
}

// 既存の「メンバーごと」と同じ、複数選択できる出演者フィルター。
const CHECK_MODE_MEMBERS = [
  ["all", "全員"], ["shori", "佐藤"], ["fuma", "菊池"], ["so", "松島"],
  ["teranishi", "寺西"], ["hara", "原"], ["hashimoto", "橋本"], ["shinozuka", "篠塚"]
];
function createCheckModeMemberFilter(elementId, onFilterChange) {
  const container = document.getElementById(elementId);
  const selected = new Set(["all"]);
  if (!container) return selected;
  container.innerHTML = CHECK_MODE_MEMBERS.map(([id, label]) =>
    '<button type="button" class="member-filter-chip' + (id === "all" ? " active" : "") +
    '" data-check-mode-member="' + id + '" aria-pressed="' + (id === "all" ? "true" : "false") +
    '">' + label + '</button>'
  ).join("");
  container.addEventListener("click", event => {
    const button = event.target.closest("[data-check-mode-member]");
    if (!button || !container.contains(button)) return;
    const member = button.dataset.checkModeMember;
    if (member === "all") {
      selected.clear();
      selected.add("all");
    } else {
      selected.delete("all");
      if (selected.has(member)) selected.delete(member);
      else selected.add(member);
      if (!selected.size) selected.add("all");
    }
    container.querySelectorAll("[data-check-mode-member]").forEach(item => {
      const active = selected.has(item.dataset.checkModeMember);
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    onFilterChange();
  });
  return selected;
}
function isCheckModeMemberVisible(item, selected) {
  return selected.has("all") || (Array.isArray(item.members) &&
    (item.members.includes("all") || item.members.some(member => selected.has(member))));
}

let tverSelectedMembers = new Set(["all"]);
let tverSortOrder = "newest";
let tverUnwatchedOnly = false;
const TVER_MODE_PINS_KEY = "secondzDailyRoutineTverModePinnedPrograms";
let tverModePinnedIds = new Set();
function getTverModePinKey(item) {
  return item.seriesId ? "series:" + item.seriesId :
    item.seriesUrl ? "url:" + item.seriesUrl.split(/[?#]/)[0].replace(/\/+$/, "") : "";
}
function loadTverModePins() {
  try {
    const saved = JSON.parse(localStorage.getItem(TVER_MODE_PINS_KEY) || "[]");
    tverModePinnedIds = new Set(Array.isArray(saved) ? saved.filter(id => typeof id === "string") : []);
  } catch (error) { tverModePinnedIds = new Set(); }
}
function toggleTverModePin(key) {
  if (!key) return;
  if (tverModePinnedIds.has(key)) tverModePinnedIds.delete(key);
  else tverModePinnedIds.add(key);
  try { localStorage.setItem(TVER_MODE_PINS_KEY, JSON.stringify([...tverModePinnedIds])); }
  catch (error) { console.warn("TVerピン留めを保存できませんでした", error); }
  renderTverMode();
}
function tverModePinButtonHtml(item) {
  const key = getTverModePinKey(item);
  if (!key) return "";
  const pinned = tverModePinnedIds.has(key);
  return `<button type="button" class="check-mode-pin-button${pinned ? " is-pinned" : ""}" data-tver-pin="${escapeTverModeHtml(key)}" aria-pressed="${pinned}" aria-label="${pinned ? "ピン留め解除" : "ピン留め"}" title="${pinned ? "ピン留め解除" : "先頭にピン留め"}"><i class="bi bi-pin-angle${pinned ? "-fill" : ""}" aria-hidden="true"></i></button>`;
}

// 3つのモードボタンを表示内容と同期する。起動時のデフォルト設定は変更しない。
function syncHomeModeButtons() {
  const dream = !document.getElementById("dreamPassModeContent")?.classList.contains("hidden");
  const tver = !document.getElementById("tverModeContent")?.classList.contains("hidden");
  const usen = !document.getElementById("usenModeContent")?.classList.contains("hidden");
  const active = usen ? "usen" : dream ? "dreampass" : tver ? "tver" : "home";
  document.querySelectorAll(".check-mode-tab-nav [data-home-mode]").forEach(button => {
    const selected = button.dataset.homeMode === active;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-active", selected);
  });
}
function initializeHomeModeNavigation() {
  // 画面ごとに同じタブを配置するため、共通の遷移処理をイベント委譲する。
  document.querySelectorAll(".check-mode-tab-nav, .home-check-mode-links").forEach(nav => {
    nav.addEventListener("click", event => {
      const button = event.target.closest("button[data-home-mode]");
      if (!button || !nav.contains(button)) return;
      if (button.dataset.homeMode === "home") showNormalHomeMode();
      else if (button.dataset.homeMode === "tver") setTverModeEnabled(true);
      else if (button.dataset.homeMode === "dreampass") setDreamPassModeEnabled(true);
      else if (button.dataset.homeMode === "usen") setUsenModeEnabled(true);
    });
  });
}
function showNormalHomeMode() {
  document.getElementById("normalHomeContent")?.classList.remove("hidden");
  document.getElementById("tverModeContent")?.classList.add("hidden");
  document.getElementById("dreamPassModeContent")?.classList.add("hidden");
  document.getElementById("usenModeContent")?.classList.add("hidden");
  homeStepElement.classList.remove("tver-mode-active", "dream-pass-mode-active", "usen-mode-active");
  syncHomeModeButtons();
}

function initializeTverMode() {
  const toggle = document.getElementById("tverModeToggleButton");
  const list = document.getElementById("tverModeList");
  if (!toggle || !list) return;

  initializeHomeModeNavigation();
  loadTverModePins();
  tverSelectedMembers = createCheckModeMemberFilter("tverMemberFilter", renderTverMode);
  const sort = document.getElementById("tverSortOrder");
  if (sort) {
    sort.value = tverSortOrder;
    sort.addEventListener("change", () => {
      tverSortOrder = sort.value === "oldest" ? "oldest" : "newest";
      renderTverMode();
    });
  }
  const unwatchedChip = document.getElementById("tverUnwatchedOnly");
  if (unwatchedChip) {
    unwatchedChip.addEventListener("click", () => {
      tverUnwatchedOnly = !tverUnwatchedOnly;
      unwatchedChip.classList.toggle("active", tverUnwatchedOnly);
      unwatchedChip.setAttribute("aria-pressed", String(tverUnwatchedOnly));
      renderTverMode();
    });
  }
  list.addEventListener("click", handleTverModeClick);
  list.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-tver-watch]");
    if (input) {
      markTverModeChecked(input.dataset.tverWatch, input.checked);
      const episode = tverModeRecords.find(item => getTverModeWatchKey(item) === input.dataset.tverWatch);
      if (typeof sendCheckModeLog === "function") void sendCheckModeLog("tver",
        input.checked ? "check" : "uncheck", {
          episodeId: episode?.episodeId || "",
          programId: episode?.seriesId || "",
          title: episode?.title || "TVer視聴チェック",
          url: episode?.watchUrl || episode?.seriesUrl || location.href
        });
    }
  });

  const defaultCheckbox = document.getElementById("tverModeDefaultCheckbox");
  if (defaultCheckbox) {
    defaultCheckbox.addEventListener("change", () =>
      setHomeDefaultMode(defaultCheckbox.checked ? "tver" : "normal", "tver")
    );
  }
  syncHomeDefaultModeCheckboxes();
  setTverModeEnabled(getHomeDefaultMode() === "tver");
}

function setTverModeEnabled(enabled) {
  const toggle = document.getElementById("tverModeToggleButton");
  const normal = document.getElementById("normalHomeContent");
  const tver = document.getElementById("tverModeContent");
  if (!toggle || !normal || !tver) return;
  const wasHidden = tver.classList.contains("hidden");

  if (enabled && state.currentStepElement !== homeStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false, saveFlow: false });
  }
  if (enabled) {
    const dreamContent = document.getElementById("dreamPassModeContent");
    const dreamToggle = document.getElementById("dreamPassModeToggleButton");
    if (dreamContent) dreamContent.classList.add("hidden");
    document.getElementById("usenModeContent")?.classList.add("hidden");
    homeStepElement.classList.remove("usen-mode-active");
    homeStepElement.classList.remove("dream-pass-mode-active");
    if (dreamToggle) {
      dreamToggle.setAttribute("aria-pressed", "false");
      dreamToggle.setAttribute("aria-label", "ドリパスチェックモードに切り替え");
      dreamToggle.title = "ドリパスチェックモードに切り替え";
    }
  }
  normal.classList.toggle("hidden", enabled);
  tver.classList.toggle("hidden", !enabled);
  homeStepElement.classList.toggle("tver-mode-active", enabled);
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", enabled ? "通常モードに戻る" : "TVerモードに切り替え");
  toggle.title = enabled ? "通常モードに戻る" : "TVerモードに切り替え";
  syncHomeModeButtons();
  if (enabled) {
    if (wasHidden && typeof sendCheckModeLog === "function")
      void sendCheckModeLog("tver", "open");
    loadAndRenderTverMode();
  }


}

let tverModeRecords = [];
let tverModeLoadRequest = 0;
async function loadAndRenderTverMode() {
  const list = document.getElementById("tverModeList");
  const updated = document.getElementById("tverModeUpdatedAt");
  if (!list) return;
  const request = ++tverModeLoadRequest;
  list.textContent = "データ読み込み中…";
  try {
    const data = await loadTverModeData();
    if (request !== tverModeLoadRequest) return;
    tverModeRecords = data.records;
    if (updated) updated.textContent = data.updatedAt ? "最終更新：" + data.updatedAt : "";
    renderTverMode();
  } catch (error) {
    if (request !== tverModeLoadRequest) return;
    console.error("TVerモード読み込み失敗", error);
    list.textContent = "TVerデータを読み込めませんでした。再度切り替えて更新してください。";
  }
}

function escapeTverModeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function formatTverModeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("ja-JP") : "—";
}
function tverModeChangeHtml(value) {
  return value ? '<span class="tver-mode-improvement">↑' + formatTverModeNumber(value.delta) +
    (value.hours > 0 ? '（' + value.hours + '時間前比）' : '') + '</span>' : "";
}
function tverModeRankText(rank) {
  return rank === null ? "圏外" : formatTverModeNumber(rank) + "位";
}
function tverModeCompareText(comparison, unit) {
  return comparison ? formatTverModeNumber(comparison.value) + unit +
    "（公開" + comparison.hour + "時間時点）" : "記録なし";
}

function formatTverModeBroadcastDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  return match ? match[1] + "/" + match[2].padStart(2, "0") + "/" + match[3].padStart(2, "0") : text;
}

// 出演者ハートはテーマのメンバーカラーに対応する。
const TVER_MEMBER_HEARTS = {
  shori: { name: "佐藤勝利", color: "#ef4444" },
  fuma: { name: "菊池風磨", color: "#8b5cf6" },
  so: { name: "松島聡", color: "#22c55e" },
  teranishi: { name: "寺西拓人", color: "#38bdf8" },
  hara: { name: "原嘉孝", color: "#84cc16" },
  hashimoto: { name: "橋本将生", color: "#f472b6" },
  shinozuka: { name: "篠塚大輝", color: "#ffffff" }
};
function tverModeCastHtml(members) {
  if (!Array.isArray(members) || !members.length) return "";
  if (members.includes("all")) {
    return '<div class="tver-mode-cast"><span class="tver-mode-cast-all">ALL</span></div>';
  }
  const hearts = members.map(id => {
    const member = TVER_MEMBER_HEARTS[id];
    if (!member) return "";
    return '<i class="bi bi-suit-heart-fill tver-mode-member-heart' +
      (id === "shinozuka" ? ' is-white' : '') + '" style="color:' + member.color +
      '" role="img" aria-label="' + escapeTverModeHtml(member.name) +
      '" title="' + escapeTverModeHtml(member.name) + '"></i>';
  }).join("");
  return hearts ? '<div class="tver-mode-cast" aria-label="出演メンバー">' + hearts + '</div>' : "";
}

// 同じ番組の全エピソードをランキング有無に関係なく1カードへまとめる。
function groupTverModeRecordsByProgram(records) {
  const groups = new Map();
  const result = [];
  records.forEach(item => {
    const groupKey = item.seriesId || item.seriesUrl;
    if (!groups.has(groupKey)) {
      const group = { ...item, groupedEpisodes: [item] };
      groups.set(groupKey, group);
      result.push(group);
    } else {
      const group = groups.get(groupKey);
      if (!group.groupedEpisodes.some(existing =>
        item.episodeId ? existing.episodeId === item.episodeId : !existing.episodeId)) {
        group.groupedEpisodes.push(item);
      }
      // グループ内の出演者も失わない。
      group.members = [...new Set([...group.members, ...item.members])];
    }
  });
  return result;
}

function getTverModeWatchKey(item) {
  return item.episodeId || (item.seriesId ? "series:" + item.seriesId : "url:" + item.seriesUrl);
}

// 複数回を持つ番組カード。各回のタイトル・視聴チェック・再生・共有・ランキングを維持。
function tverModeGroupedCardHtml(item) {
  const episodeRows = item.groupedEpisodes.map(episode => {
    const watchKey = getTverModeWatchKey(episode);
    const checked = isTverEpisodeChecked(watchKey);
    const episodeTitle = episode.subtitle || "エピソードタイトル未取得";
    const shareKey = episode.episodeId || episode.seriesId || episode.seriesUrl;
    const rankings = episode.hasReport ? episode.rankings.map(rank =>
      `<div class="tver-mode-compact-rank"><span>${escapeTverModeHtml(rank.label)}<br class="tver-mode-rank-break">最高順位</span><strong>${rank.bestRank === null ? "記録なし" : tverModeRankText(rank.bestRank)}</strong></div>`
    ).join("") : "";
    const rankingSection = episode.hasReport
      ? `<div class="tver-mode-rank-summary">${rankings || "順位データなし"}</div>
         <div class="tver-mode-counts">
           <div><span>いいね</span><strong>${escapeTverModeHtml(episode.likesText)}</strong></div>
           <div><span>お気に入り</span><strong>${escapeTverModeHtml(episode.favoritesText)}</strong></div>
         </div>`
      : "";
    const graphLink = episode.graphUrl
      ? `<a href="${escapeTverModeHtml(episode.graphUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeTverModeHtml(episodeTitle)}のグラフ" title="グラフ"><i class="bi bi-graph-up-arrow"></i></a>`
      : "";
    return `<div class="tver-mode-group-episode">
      <div class="tver-mode-group-episode-head">
        <label class="tver-mode-check" title="視聴済み"><input type="checkbox" data-tver-watch="${escapeTverModeHtml(watchKey)}" ${checked ? "checked" : ""} aria-label="${escapeTverModeHtml(episodeTitle)}を視聴済みにする"><span>見た</span></label>
        <span class="tver-mode-group-episode-title" title="${escapeTverModeHtml(episodeTitle)}">${escapeTverModeHtml(episodeTitle)}</span>
      </div>
      <div class="tver-mode-group-episode-actions">
        ${graphLink}
        <a href="${escapeTverModeHtml(episode.watchUrl || episode.seriesUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeTverModeHtml(episodeTitle)}をTVerで見る" title="TVerで見る" data-tver-series-link="${escapeTverModeHtml(watchKey)}"><i class="bi bi-play-btn"></i></a>
        <button type="button" data-tver-share="${escapeTverModeHtml(shareKey)}" aria-label="${escapeTverModeHtml(episodeTitle)}を共有" title="共有"><i class="bi bi-box-arrow-up"></i></button>
      </div>
      ${rankingSection}
    </div>`;
  }).join("");
  return `<article class="tver-mode-card is-grouped">
    <div class="check-mode-card-top-row">
      ${tverModeCastHtml(item.members)}
      ${tverModePinButtonHtml(item)}
    </div>
    <div class="tver-mode-card-heading"><h3>${escapeTverModeHtml(item.title)}</h3></div>
    <p class="tver-mode-no-ranking">${item.groupedEpisodes.length}エピソード</p>
    <div class="tver-mode-group-episodes">${episodeRows}</div>
  </article>`;
}

function renderTverMode() {
  const list = document.getElementById("tverModeList");
  if (!list) return;
  if (!tverModeRecords.length) {
    list.innerHTML = '<p class="tver-mode-empty-message">memberWorksに登録されたTVer番組はありません。</p>';
    return;
  }
  // ピン留めはフィルターとsortの対象外。番組IDで保持する。
  const pinned = groupTverModeRecordsByProgram(tverModeRecords)
    .filter(item => tverModePinnedIds.has(getTverModePinKey(item)));
  const visibleRecords = tverModeRecords.filter(item => {
    if (tverModePinnedIds.has(getTverModePinKey(item))) return false;
    if (!isCheckModeMemberVisible(item, tverSelectedMembers)) return false;
    return !tverUnwatchedOnly || !isTverEpisodeChecked(getTverModeWatchKey(item));
  }).sort((a, b) => (tverSortOrder === "oldest" ? a.sortTimestamp - b.sortTimestamp :
    b.sortTimestamp - a.sortTimestamp) || a.index - b.index);
  const normal = groupTverModeRecordsByProgram(visibleRecords);
  const pinnedHtml = pinned.length
    ? '<div class="check-mode-pinned-heading"><i class="bi bi-pin-angle-fill" aria-hidden="true"></i>お気に入り</div>' +
      pinned.map(item => tverModeGroupedCardHtml(item)).join("")
    : "";
  const normalHtml = normal.map(item => tverModeGroupedCardHtml(item)).join("");
  list.innerHTML = pinnedHtml + (normalHtml || (!pinned.length
    ? `<p class="tver-mode-empty-message">${tverUnwatchedOnly ? "未視聴の番組はありません。" : "選択したメンバーの番組はありません。"}</p>`
    : ""));
}

function markTverModeChecked(episodeId, checked) {
  if (checked) markTverEpisodeChecked(episodeId);
  else {
    const map = loadTverCheckedEpisodeMap();
    delete map[episodeId];
    saveTverCheckedEpisodeMap(map);
  }
  renderTverMode();
  // 通常ホーム側も再描画してチェック状態を揃える
  if (typeof renderMemberWorks === "function") renderMemberWorks();
}

function handleTverModeClick(event) {
  const pin = event.target.closest("[data-tver-pin]");
  if (pin) {
    toggleTverModePin(pin.dataset.tverPin);
    return;
  }
  const link = event.target.closest("[data-tver-series-link]");
  if (link && link.dataset.tverSeriesLink) {
    markTverModeChecked(link.dataset.tverSeriesLink, true);
    const ep = tverModeRecords.find(item => getTverModeWatchKey(item) === link.dataset.tverSeriesLink);
    if (typeof sendCheckModeLog === "function") void sendCheckModeLog("tver", "link", {
      episodeId: ep?.episodeId || "",
      programId: ep?.seriesId || "",
      title: ep?.title || "TVer",
      url: link.href
    });
    return;
  }
  const share = event.target.closest("[data-tver-share]");
  if (share) {
    const ep = tverModeRecords.find(item =>
      (item.episodeId || item.seriesId || item.seriesUrl) === share.dataset.tverShare);
    if (typeof sendCheckModeLog === "function") void sendCheckModeLog("tver", "share", {
      episodeId: ep?.episodeId || "", programId: ep?.seriesId || "",
      title: ep?.title || "TVer", url: ep?.watchUrl || ep?.seriesUrl || location.href
    });
    void shareTverModeRecord(share.dataset.tverShare);
  }
}

async function shareTverModeRecord(key) {
  const item = tverModeRecords.find(record => (record.episodeId || record.seriesId || record.seriesUrl) === key);
  if (!item) return;
  const lines = [item.title, item.subtitle];
  if (item.hasReport) {
    item.rankings.forEach(rank => {
      const value = rank.bestRank;
      lines.push(rank.label + " 最高：" +
        (value === null ? "記録なし" : tverModeRankText(value)));
    });
    lines.push("いいね：" + item.likesText + " / お気に入り：" + item.favoritesText);
  }
  lines.push(item.watchUrl || item.seriesUrl);
  const text = lines.filter(Boolean).join("\n");
  try {
    if (navigator.share) await navigator.share({ text });
    else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alert("共有テキストをコピーしました。");
    } else prompt("共有テキストをコピーしてください", text);
  } catch (error) {
    if (error?.name !== "AbortError") console.error("TVer共有に失敗しました", error);
  }
}
