// TVerモード：通常ホームとの切替・視聴チェック・共有
function initializeTverMode() {
  const toggle = document.getElementById("tverModeToggleButton");
  const list = document.getElementById("tverModeList");
  if (!toggle || !list) return;

  toggle.addEventListener("click", () => {
    setTverModeEnabled(toggle.getAttribute("aria-pressed") !== "true");
  });
  list.addEventListener("click", handleTverModeClick);
  list.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-tver-watch]");
    if (input) markTverModeChecked(input.dataset.tverWatch, input.checked);
  });

  let enabled = false;
  try {
    enabled = localStorage.getItem(STORAGE_KEYS.tverModeEnabled) === "true";
  } catch (error) {
    console.warn("TVerモード設定を読み込めませんでした", error);
  }
  setTverModeEnabled(enabled, { save: false });
}

function setTverModeEnabled(enabled, options = {}) {
  const toggle = document.getElementById("tverModeToggleButton");
  const normal = document.getElementById("normalHomeContent");
  const tver = document.getElementById("tverModeContent");
  if (!toggle || !normal || !tver) return;

  if (enabled && state.currentStepElement !== homeStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false, saveFlow: false });
  }
  normal.classList.toggle("hidden", enabled);
  tver.classList.toggle("hidden", !enabled);
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", enabled ? "通常モードに戻る" : "TVerモードに切り替え");
  toggle.title = enabled ? "通常モードに戻る" : "TVerモードに切り替え";
  if (enabled) loadAndRenderTverMode();

  if (options.save !== false) {
    try {
      localStorage.setItem(STORAGE_KEYS.tverModeEnabled, String(enabled));
    } catch (error) {
      console.warn("TVerモード設定を保存できませんでした", error);
    }
  }
}

let tverModeRecords = [];
let tverModeLoadRequest = 0;
const tverModeExpanded = new Set();
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

function renderTverMode() {
  const list = document.getElementById("tverModeList");
  if (!list) return;
  if (!tverModeRecords.length) {
    list.textContent = "memberWorksに登録されたTVer番組はありません。";
    return;
  }
  list.innerHTML = tverModeRecords.map(item => {
    const key = item.seriesId || item.seriesUrl;
    const expanded = item.hasReport && tverModeExpanded.has(key);
    const checked = item.episodeId && isTverEpisodeChecked(item.episodeId);
    const checkbox = item.episodeId ? `<label class="tver-mode-check" title="視聴済み"><input type="checkbox" data-tver-watch="${escapeTverModeHtml(item.episodeId)}" ${checked ? "checked" : ""} aria-label="${escapeTverModeHtml(item.title)}を視聴済みにする"></label>` : "";
    const ranking = item.rankings.map(rank => {
      const value = item.displayRankType === "current" ? rank.currentRank : rank.bestRank;
      return `<div class="tver-mode-compact-rank"><span>${escapeTverModeHtml(rank.label)}・${item.displayRankType === "current" ? "現在順位" : "最高順位"}</span><strong>${value === null ? (item.displayRankType === "current" ? "圏外" : "記録なし") : tverModeRankText(value)}</strong></div>`;
    }).join("");
    const compare = item.rankings.map(rank => `<div class="tver-mode-compare-row"><span>${escapeTverModeHtml(rank.label)}：現在 ${tverModeRankText(rank.currentRank)} / 最高 ${rank.bestRank === null ? "記録なし" : tverModeRankText(rank.bestRank)}</span><span>前回同時間帯：${tverModeCompareText(rank.previousRank, "位")}</span><span>前回最高：${rank.previousBestRank === null ? "記録なし" : tverModeRankText(rank.previousBestRank)}</span>${rank.currentRank === null ? "" : tverModeChangeHtml(rank.improvement)}</div>`).join("");
    const graph = item.graphUrl ? `<a href="${escapeTverModeHtml(item.graphUrl)}" target="_blank" rel="noopener noreferrer" aria-label="グラフ" title="グラフ"><i class="bi bi-graph-up-arrow"></i></a>` : "";
    return `<article class="tver-mode-card ${expanded ? "is-expanded" : ""} ${item.hasReport ? "" : "is-simple"}" data-tver-episode-card="${escapeTverModeHtml(item.episodeId)}">
      <div class="tver-mode-card-heading"><h3>${escapeTverModeHtml(item.title)}</h3>${checkbox}</div>
      ${item.broadcastDate ? `<p class="tver-mode-card-date">${escapeTverModeHtml(item.broadcastDate)}</p>` : ""}
      ${item.hasReport ? `<div class="tver-mode-rank-summary">${ranking || "順位データなし"}</div>
        <div class="tver-mode-counts"><div><span>いいね</span><strong>${escapeTverModeHtml(item.likesText)}</strong></div><div><span>お気に入り</span><strong>${escapeTverModeHtml(item.favoritesText)}</strong></div></div>` : '<p class="tver-mode-no-ranking">ランキング取得なし</p>'}
      <div class="tver-mode-actions">
        ${graph}
        <a href="${escapeTverModeHtml(item.seriesUrl)}" target="_blank" rel="noopener noreferrer" aria-label="TVerで見る" title="TVerで見る" data-tver-series-link="${escapeTverModeHtml(item.episodeId)}"><i class="bi bi-play-btn"></i></a>
        <button type="button" data-tver-share="${escapeTverModeHtml(key)}" aria-label="共有" title="共有"><i class="bi bi-share"></i></button>
      </div>
      ${item.hasReport ? `<button type="button" class="tver-mode-detail-toggle" data-tver-expand="${escapeTverModeHtml(key)}" aria-expanded="${expanded}">${expanded ? "詳細を閉じる" : "詳細を見る"} <i class="bi bi-chevron-${expanded ? "up" : "down"}"></i></button>
        ${expanded ? `<div class="tver-mode-details">
          <p>${escapeTverModeHtml(item.subtitle)}</p><p class="tver-mode-record-date">取得：${escapeTverModeHtml(item.updatedAt)}</p>
          <h4>現在・最高順位と前回比較</h4>${compare || "<p>記録なし</p>"}
          <h4>いいね数の前回比較</h4>
          <div class="tver-mode-compare-row"><span>同時間帯：${tverModeCompareText(item.previousLikes, "")}</span><span>前回最高：${formatTverModeNumber(item.previousBestLikes)}</span>${tverModeChangeHtml(item.likeImprovement)}</div>
          <p class="tver-mode-note">同時間帯は公開からの経過時間（±1時間）で比較。元データに正確な取得日時がない記録は日時を表示しません。</p>
        </div>` : ""}` : ""}
    </article>`;
  }).join("");
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
  const expand = event.target.closest("[data-tver-expand]");
  if (expand) {
    const key = expand.dataset.tverExpand;
    if (tverModeExpanded.has(key)) tverModeExpanded.delete(key);
    else tverModeExpanded.add(key);
    renderTverMode();
    return;
  }
  const link = event.target.closest("[data-tver-series-link]");
  if (link && link.dataset.tverSeriesLink) {
    markTverModeChecked(link.dataset.tverSeriesLink, true);
    return;
  }
  const share = event.target.closest("[data-tver-share]");
  if (share) void shareTverModeRecord(share.dataset.tverShare);
}

async function shareTverModeRecord(key) {
  const item = tverModeRecords.find(record => (record.seriesId || record.seriesUrl) === key);
  if (!item) return;
  const lines = [item.title, item.subtitle];
  if (item.hasReport) {
    lines.push("取得：" + item.updatedAt);
    item.rankings.forEach(rank => {
      const value = item.displayRankType === "current" ? rank.currentRank : rank.bestRank;
      lines.push(rank.label + " " + (item.displayRankType === "current" ? "現在" : "最高") + "：" +
        (value === null ? (item.displayRankType === "current" ? "圏外" : "記録なし") : tverModeRankText(value)));
    });
    lines.push("いいね：" + item.likesText + " / お気に入り：" + item.favoritesText);
  }
  lines.push(item.seriesUrl);
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
