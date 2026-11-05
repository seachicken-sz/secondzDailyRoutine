// ドリパスチェックモード：memberWorksJsonを唯一のデータソースにする
const DREAM_PASS_WORKS_URL = "../data/memberWorksJson.json";
let dreamPassRecords = [];
let dreamPassLoadVersion = 0;

function initializeDreamPassMode() {
  const toggle = document.getElementById("dreamPassModeToggleButton");
  if (!toggle) return;
  toggle.addEventListener("click", () => setDreamPassModeEnabled(toggle.getAttribute("aria-pressed") !== "true"));
}

function setDreamPassModeEnabled(enabled) {
  const toggle = document.getElementById("dreamPassModeToggleButton");
  const content = document.getElementById("dreamPassModeContent");
  const normal = document.getElementById("normalHomeContent");
  const tver = document.getElementById("tverModeContent");
  const tverToggle = document.getElementById("tverModeToggleButton");
  if (!toggle || !content || !normal || !tver) return;
  if (enabled && state.currentStepElement !== homeStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false, saveFlow: false });
  }

  if (enabled) {
    tver.classList.add("hidden");
    if (tverToggle) {
      tverToggle.setAttribute("aria-pressed", "false");
      tverToggle.setAttribute("aria-label", "TVerモードに切り替え");
      tverToggle.title = "TVerモードに切り替え";
    }
  }
  content.classList.toggle("hidden", !enabled);
  normal.classList.toggle("hidden", enabled);
  homeStepElement.classList.toggle("dream-pass-mode-active", enabled);
  homeStepElement.classList.toggle("tver-mode-active", false);
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", enabled ? "通常モードに戻る" : "ドリパスチェックモードに切り替え");
  toggle.title = enabled ? "通常モードに戻る" : "ドリパスチェックモードに切り替え";
  if (enabled) void loadDreamPassMode();
}

async function loadDreamPassMode() {
  const list = document.getElementById("dreamPassModeList");
  if (!list) return;
  const version = ++dreamPassLoadVersion;
  list.textContent = "データ読み込み中…";
  try {
    const response = await fetch(DREAM_PASS_WORKS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("memberWorks取得失敗: " + response.status);
    const works = await response.json();
    if (!Array.isArray(works)) throw new Error("memberWorksのデータ形式が不正です");
    if (version !== dreamPassLoadVersion) return;
    dreamPassRecords = works.filter(item =>
      (item.workType === "dreampass" || item.workType === "dreampass_kouho") && item.platformUrl
    );
    renderDreamPassMode();
  } catch (error) {
    if (version !== dreamPassLoadVersion) return;
    console.error("ドリパスモード読込失敗", error);
    list.textContent = "ドリパス情報を読み込めませんでした。再度切り替えて更新してください。";
  }
}

function dreamPassSafeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function dreamPassRank(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function dreamPassCastHtml(members) {
  // TVerの出演メンバーハートと同じ描画を使用
  return typeof tverModeCastHtml === "function" ? tverModeCastHtml(members) : "";
}

function dreamPassCardHtml(item, isVoting) {
  const rank = dreamPassRank(item.rank);
  const cast = dreamPassCastHtml(item.members);
  const label = isVoting ? "投票する" : "作品を見る";
  return `<article class="dream-pass-card">
    ${cast || '<div class="tver-mode-cast" aria-hidden="true"></div>'}
    <h3 title="${dreamPassSafeHtml(item.title)}">${dreamPassSafeHtml(item.title)}</h3>
    <div class="dream-pass-card-rank">
      ${isVoting ? `<span>現在順位</span><strong>${rank === null ? "順位未取得" : rank.toLocaleString("ja-JP") + "位"}</strong>`
        : '<span>上映候補入り</span><strong>候補入り</strong>'}
    </div>
    <a class="dream-pass-vote-button" href="${dreamPassSafeHtml(item.platformUrl)}" target="_blank" rel="noopener noreferrer">${label}<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
  </article>`;
}

function renderDreamPassMode() {
  const list = document.getElementById("dreamPassModeList");
  if (!list) return;
  const voting = dreamPassRecords.filter(item => item.workType === "dreampass")
    .sort((a, b) => (dreamPassRank(a.rank) ?? Infinity) - (dreamPassRank(b.rank) ?? Infinity));
  const candidates = dreamPassRecords.filter(item => item.workType === "dreampass_kouho");
  const section = (heading, items, isVoting) => items.length
    ? `<section class="dream-pass-section"><h3 class="dream-pass-section-title">${heading}</h3><div class="dream-pass-grid">${items.map(item => dreamPassCardHtml(item, isVoting)).join("")}</div></section>`
    : "";
  list.innerHTML = section("投票中", voting, true) + section("上映候補入り", candidates, false);
  if (!list.innerHTML) list.textContent = "ドリパスの登録作品はありません。";
}
