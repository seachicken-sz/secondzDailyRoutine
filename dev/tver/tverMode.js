// TVerモード：通常ホームとの切替・視聴チェック・共有
// 通常・TVer・ドリパスの起動時表示は一つのキーで排他管理する。
function getHomeDefaultMode() {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.homeDefaultMode);
    if (mode === "normal" || mode === "tver" || mode === "dreampass") return mode;
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
  if (tver) tver.checked = mode === "tver";
  if (dreamPass) dreamPass.checked = mode === "dreampass";
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

  if (enabled && state.currentStepElement !== homeStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false, saveFlow: false });
  }
  if (enabled) {
    const dreamContent = document.getElementById("dreamPassModeContent");
    const dreamToggle = document.getElementById("dreamPassModeToggleButton");
    if (dreamContent) dreamContent.classList.add("hidden");
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

function renderTverMode() {
  const list = document.getElementById("tverModeList");
  if (!list) return;
  if (!tverModeRecords.length) {
    list.textContent = "memberWorksに登録されたTVer番組はありません。";
    return;
  }
  list.innerHTML = tverModeRecords.map(item => {
    const key = item.seriesId || item.seriesUrl;
    // episodeIdがない番組はシリーズ単位のチェックとして保持。
    const watchKey = item.episodeId || (item.seriesId ? "series:" + item.seriesId : "url:" + item.seriesUrl);
    const checked = isTverEpisodeChecked(watchKey);
    const checkbox = `<label class="tver-mode-check" title="視聴済み"><input type="checkbox" data-tver-watch="${escapeTverModeHtml(watchKey)}" ${checked ? "checked" : ""} aria-label="${escapeTverModeHtml(item.title)}を視聴済みにする"><span>見た</span></label>`;
    const ranking = item.rankings.map(rank => {
      const value = rank.bestRank;
      return `<div class="tver-mode-compact-rank"><span>${escapeTverModeHtml(rank.label)}<br class="tver-mode-rank-break">最高順位</span><strong>${value === null ? "記録なし" : tverModeRankText(value)}</strong></div>`;
    }).join("");
    const graph = item.graphUrl ? `<a href="${escapeTverModeHtml(item.graphUrl)}" target="_blank" rel="noopener noreferrer" aria-label="グラフ" title="グラフ"><i class="bi bi-graph-up-arrow"></i></a>` : "";
    return `<article class="tver-mode-card ${item.hasReport ? "" : "is-simple"}" data-tver-episode-card="${escapeTverModeHtml(item.episodeId)}">
      ${tverModeCastHtml(item.members)}
      <div class="tver-mode-card-heading"><h3>${escapeTverModeHtml(item.title)}</h3>${checkbox}</div>
      ${item.broadcastDate ? `<p class="tver-mode-card-date">${escapeTverModeHtml(formatTverModeBroadcastDate(item.broadcastDate))} 放送</p>` : ""}
      ${item.subtitle ? `<p class="tver-mode-episode-title" title="${escapeTverModeHtml(item.subtitle)}">${escapeTverModeHtml(item.subtitle)}</p>` : ""}
      ${item.hasReport ? `<div class="tver-mode-rank-summary">${ranking || "順位データなし"}</div>
        <div class="tver-mode-counts"><div><span>いいね</span><strong>${escapeTverModeHtml(item.likesText)}</strong></div><div><span>お気に入り</span><strong>${escapeTverModeHtml(item.favoritesText)}</strong></div></div>` : '<p class="tver-mode-no-ranking">ランキング取得なし</p>'}
      <div class="tver-mode-actions">
        ${graph}
        <a href="${escapeTverModeHtml(item.seriesUrl)}" target="_blank" rel="noopener noreferrer" aria-label="TVerで見る" title="TVerで見る" data-tver-series-link="${escapeTverModeHtml(watchKey)}"><i class="bi bi-play-btn"></i></a>
        <button type="button" data-tver-share="${escapeTverModeHtml(key)}" aria-label="共有" title="共有"><i class="bi bi-box-arrow-up"></i></button>
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
    item.rankings.forEach(rank => {
      const value = rank.bestRank;
      lines.push(rank.label + " 最高：" +
        (value === null ? "記録なし" : tverModeRankText(value)));
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
