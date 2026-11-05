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

  const defaultCheckbox = document.getElementById("tverModeDefaultCheckbox");
  let defaultEnabled = false;
  try {
    const savedDefault = localStorage.getItem(STORAGE_KEYS.tverModeDefault);
    // 旧仕様ではモードON/OFF自体が保存されていたため、初回だけ移行。
    defaultEnabled = savedDefault === null
      ? localStorage.getItem(STORAGE_KEYS.tverModeEnabled) === "true"
      : savedDefault === "true";
    if (savedDefault === null) {
      localStorage.setItem(STORAGE_KEYS.tverModeDefault, String(defaultEnabled));
    }
  } catch (error) {
    console.warn("TVerデフォルト設定を読み込めませんでした", error);
  }
  if (defaultCheckbox) {
    defaultCheckbox.checked = defaultEnabled;
    defaultCheckbox.addEventListener("change", () => {
      try {
        localStorage.setItem(STORAGE_KEYS.tverModeDefault, String(defaultCheckbox.checked));
      } catch (error) {
        console.warn("TVerデフォルト設定を保存できませんでした", error);
      }
    });
  }
  setTverModeEnabled(defaultEnabled);
}

function setTverModeEnabled(enabled) {
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

function renderTverMode() {
  const list = document.getElementById("tverModeList");
  if (!list) return;
  if (!tverModeRecords.length) {
    list.textContent = "memberWorksに登録されたTVer番組はありません。";
    return;
  }
  list.innerHTML = tverModeRecords.map(item => {
    const key = item.seriesId || item.seriesUrl;
    const checked = item.episodeId && isTverEpisodeChecked(item.episodeId);
    const checkbox = item.episodeId ? `<label class="tver-mode-check" title="視聴済み"><input type="checkbox" data-tver-watch="${escapeTverModeHtml(item.episodeId)}" ${checked ? "checked" : ""} aria-label="${escapeTverModeHtml(item.title)}を視聴済みにする"><span>見た</span></label>` : "";
    const ranking = item.rankings.map(rank => {
      const value = item.displayRankType === "current" ? rank.currentRank : rank.bestRank;
      return `<div class="tver-mode-compact-rank"><span>${escapeTverModeHtml(rank.label)}・${item.displayRankType === "current" ? "現在順位" : "最高順位"}</span><strong>${value === null ? (item.displayRankType === "current" ? "圏外" : "記録なし") : tverModeRankText(value)}</strong></div>`;
    }).join("");
    const graph = item.graphUrl ? `<a href="${escapeTverModeHtml(item.graphUrl)}" target="_blank" rel="noopener noreferrer" aria-label="グラフ" title="グラフ"><i class="bi bi-graph-up-arrow"></i></a>` : "";
    return `<article class="tver-mode-card ${item.hasReport ? "" : "is-simple"}" data-tver-episode-card="${escapeTverModeHtml(item.episodeId)}">
      <div class="tver-mode-card-heading"><h3>${escapeTverModeHtml(item.title)}</h3>${checkbox}</div>
      ${item.broadcastDate ? `<p class="tver-mode-card-date">${escapeTverModeHtml(item.broadcastDate)}</p>` : ""}
      ${item.hasReport ? `<div class="tver-mode-rank-summary">${ranking || "順位データなし"}</div>
        <div class="tver-mode-counts"><div><span>いいね</span><strong>${escapeTverModeHtml(item.likesText)}</strong></div><div><span>お気に入り</span><strong>${escapeTverModeHtml(item.favoritesText)}</strong></div></div>` : '<p class="tver-mode-no-ranking">ランキング取得なし</p>'}
      <div class="tver-mode-actions">
        ${graph}
        <a href="${escapeTverModeHtml(item.seriesUrl)}" target="_blank" rel="noopener noreferrer" aria-label="TVerで見る" title="TVerで見る" data-tver-series-link="${escapeTverModeHtml(item.episodeId)}"><i class="bi bi-play-btn"></i></a>
        <button type="button" data-tver-share="${escapeTverModeHtml(key)}" aria-label="共有" title="共有"><i class="bi bi-share"></i></button>
      </div>
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
