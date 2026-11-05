// TVerモード：通常ホームとの切替・視聴チェック・共有
function initializeTverMode() {
  const toggle = document.getElementById("tverModeToggleButton");
  const list = document.getElementById("tverModeList");
  if (!toggle || !list) return;

  toggle.addEventListener("click", () => {
    setTverModeEnabled(toggle.getAttribute("aria-pressed") !== "true");
  });
  list.addEventListener("click", handleTverModeClick);

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
    list.textContent = "現在表示できるTVerエピソードはありません。";
    return;
  }
  list.innerHTML = tverModeRecords.map((item) => {
    const watched = isTverEpisodeChecked(item.episodeId);
    const rankings = item.rankings.map((rank) => `
      <div class="tver-mode-stat">
        <span class="tver-mode-stat-label">${escapeTverModeHtml(rank.label)}</span>
        <strong>${tverModeRankText(rank.currentRank)}</strong>
        ${rank.currentRank === null ? "" : tverModeChangeHtml(rank.improvement)}
      </div>`).join("");
    const comparisons = item.rankings.map((rank) => `
      <div class="tver-mode-compare-row">
        <span>${escapeTverModeHtml(rank.label)}</span>
        <span>同時間帯：${tverModeCompareText(rank.previousRank, "位")}</span>
        <span>前回最高：${rank.previousBestRank === null ? "記録なし" : tverModeRankText(rank.previousBestRank)}</span>
      </div>`).join("");
    return `
      <article class="tver-mode-card" data-tver-episode-card="${escapeTverModeHtml(item.episodeId)}">
        <div class="tver-mode-card-heading">
          <div>
            <h3>${escapeTverModeHtml(item.title)}</h3>
            <p>${escapeTverModeHtml(item.broadcastDate)} ${escapeTverModeHtml(item.subtitle)}</p>
          </div>
          <span class="tver-mode-watch-status">${watched ? "視聴済み" : "未チェック"}</span>
        </div>
        <p class="tver-mode-record-date">取得：${escapeTverModeHtml(item.updatedAt)}</p>
        <div class="tver-mode-stats">
          ${rankings}
          <div class="tver-mode-stat">
            <span class="tver-mode-stat-label">いいね数</span>
            <strong>${escapeTverModeHtml(item.likesText)}</strong>
            ${tverModeChangeHtml(item.likeImprovement)}
          </div>
        </div>
        <div class="tver-mode-previous">
          <h4>前回エピソードとの比較</h4>
          ${comparisons}
          <div class="tver-mode-compare-row">
            <span>いいね数</span>
            <span>同時間帯：${tverModeCompareText(item.previousLikes, "")}</span>
            <span>前回最高：${formatTverModeNumber(item.previousBestLikes)}</span>
          </div>
          <p class="tver-mode-note">※同時間帯は公開からの経過時間（±1時間）で比較。元データに正確な取得日時がないため表示していません。</p>
        </div>
        <div class="tver-mode-actions">
          <button type="button" data-tver-watch="${escapeTverModeHtml(item.episodeId)}">${watched ? "チェック解除" : "視聴済みにする"}</button>
          <a href="${escapeTverModeHtml(item.graphUrl)}" target="_blank" rel="noopener noreferrer">グラフ</a>
          <a href="${escapeTverModeHtml(item.seriesUrl)}" target="_blank" rel="noopener noreferrer" data-tver-series-link="${escapeTverModeHtml(item.episodeId)}">TVerで見る</a>
          <button type="button" data-tver-share="${escapeTverModeHtml(item.episodeId)}">共有</button>
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
  const watch = event.target.closest("[data-tver-watch]");
  if (watch) {
    const episodeId = watch.dataset.tverWatch;
    markTverModeChecked(episodeId, !isTverEpisodeChecked(episodeId));
    return;
  }
  const link = event.target.closest("[data-tver-series-link]");
  if (link) {
    const episodeId = link.dataset.tverSeriesLink;
    markTverModeChecked(episodeId, true);
    return;
  }
  const share = event.target.closest("[data-tver-share]");
  if (share) void shareTverModeRecord(share.dataset.tverShare);
}

async function shareTverModeRecord(episodeId) {
  const item = tverModeRecords.find((record) => record.episodeId === episodeId);
  if (!item) return;
  const lines = [
    item.title,
    item.subtitle,
    "取得：" + item.updatedAt,
    ...item.rankings.map((rank) => rank.label + "：" + tverModeRankText(rank.currentRank) +
      (rank.improvement ? " ↑" + rank.improvement.delta : "")),
    "いいね：" + item.likesText + (item.likeImprovement ? " +" + item.likeImprovement.delta : ""),
    item.seriesUrl
  ];
  const text = lines.filter(Boolean).join("\n");
  try {
    if (navigator.share) await navigator.share({ text });
    else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alert("共有テキストをコピーしました。");
    } else {
      prompt("共有テキストをコピーしてください", text);
    }
  } catch (error) {
    if (error?.name !== "AbortError") console.error("TVer共有に失敗しました", error);
  }
}
