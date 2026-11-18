// ドリパスチェックモード：memberWorksJsonを唯一のデータソースにする
const DREAM_PASS_WORKS_URL = "../data/memberWorksJson.json";
let dreamPassRecords = [];
let dreamPassLoadVersion = 0;
let dreamPassSelectedMembers = new Set(["all"]);
let dreamPassSortOrder = "asc";
const DREAM_PASS_PINS_KEY = "secondzDailyRoutineDreamPassPinnedWorks";
let dreamPassPinnedIds = new Set();
function dreamPassPinKey(item) {
  // イベントURLは変化するので、可能な限り作品ID（m数字）に紐づける。
  const url = String(item.workUrl || item.platformUrl || "");
  const match = url.match(/\/m(\d+)(?:[/?#]|$)/);
  return match ? "m" + match[1] : url.split(/[?#]/)[0].replace(/\/+$/, "");
}
function loadDreamPassPins() {
  try {
    const saved = JSON.parse(localStorage.getItem(DREAM_PASS_PINS_KEY) || "[]");
    dreamPassPinnedIds = new Set(Array.isArray(saved) ? saved.filter(id => typeof id === "string") : []);
  } catch (error) { dreamPassPinnedIds = new Set(); }
}
function toggleDreamPassPin(key) {
  if (!key) return;
  if (dreamPassPinnedIds.has(key)) dreamPassPinnedIds.delete(key);
  else dreamPassPinnedIds.add(key);
  try { localStorage.setItem(DREAM_PASS_PINS_KEY, JSON.stringify([...dreamPassPinnedIds])); }
  catch (error) { console.warn("ドリパスピン留めを保存できませんでした", error); }
  renderDreamPassMode();
}
function dreamPassPinButtonHtml(item) {
  const key = dreamPassPinKey(item);
  const pinned = dreamPassPinnedIds.has(key);
  return `<button type="button" class="check-mode-pin-button${pinned ? " is-pinned" : ""}" data-dreampass-pin="${dreamPassSafeHtml(key)}" aria-pressed="${pinned}" aria-label="${pinned ? "ピン留め解除" : "ピン留め"}" title="${pinned ? "ピン留め解除" : "先頭にピン留め"}"><i class="bi bi-pin-angle${pinned ? "-fill" : ""}" aria-hidden="true"></i></button>`;
}

function initializeDreamPassMode() {
  const toggle = document.getElementById("dreamPassModeToggleButton");
  if (!toggle) return;
  loadDreamPassPins();
  dreamPassSelectedMembers = createCheckModeMemberFilter("dreamPassMemberFilter", renderDreamPassMode);
  const list = document.getElementById("dreamPassModeList");
  if (list) {
    list.addEventListener("click", event => {
      const pin = event.target.closest("[data-dreampass-pin]");
      if (pin) { toggleDreamPassPin(pin.dataset.dreampassPin); return; }
      const link = event.target.closest("a[data-dreampass-mode-link]");
      if (!link || !list.contains(link)) return;
      if (typeof sendCheckModeLog === "function") void sendCheckModeLog("dreampass", "link", {
        title: link.dataset.dreampassTitle || "",
        programId: link.dataset.dreampassWorkId || "",
        workType: link.dataset.dreampassType || "",
        url: link.href
      });
    });
    list.addEventListener("change", event => {
      if (event.target.id !== "dreamPassSortOrder") return;
      dreamPassSortOrder = event.target.value === "desc" ? "desc" : "asc";
      renderDreamPassMode();
    });
  }
  const defaultCheckbox = document.getElementById("dreamPassModeDefaultCheckbox");
  if (defaultCheckbox) {
    defaultCheckbox.addEventListener("change", () =>
      setHomeDefaultMode(defaultCheckbox.checked ? "dreampass" : "normal", "dreampass")
    );
  }
  syncHomeDefaultModeCheckboxes();
  if (getHomeDefaultMode() === "dreampass") setDreamPassModeEnabled(true);
}

function setDreamPassModeEnabled(enabled) {
  const toggle = document.getElementById("dreamPassModeToggleButton");
  const content = document.getElementById("dreamPassModeContent");
  const normal = document.getElementById("normalHomeContent");
  const tver = document.getElementById("tverModeContent");
  const tverToggle = document.getElementById("tverModeToggleButton");
  if (!toggle || !content || !normal || !tver) return;
  const wasHidden = content.classList.contains("hidden");
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
  if (enabled) {
    document.getElementById("usenModeContent")?.classList.add("hidden");
    homeStepElement.classList.remove("usen-mode-active");
  }
  content.classList.toggle("hidden", !enabled);
  normal.classList.toggle("hidden", enabled);
  homeStepElement.classList.toggle("dream-pass-mode-active", enabled);
  homeStepElement.classList.toggle("tver-mode-active", false);
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", enabled ? "通常モードに戻る" : "ドリパスチェックモードに切り替え");
  toggle.title = enabled ? "通常モードに戻る" : "ドリパスチェックモードに切り替え";
  syncHomeModeButtons();
  if (enabled) {
    if (wasHidden && typeof sendCheckModeLog === "function")
      void sendCheckModeLog("dreampass", "open");
    void loadDreamPassMode();
  }
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
      (item.workType === "dreampass" ||
        item.workType === "dreampass_kouho" ||
        item.workType === "dreampass_hanbai") && item.platformUrl
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
  const isTicket = item.workType === "dreampass_hanbai";
  const label = isTicket ? "チケット情報を見る" : isVoting ? "投票する" : "作品を見る";
  return `<article class="dream-pass-card">
    <div class="check-mode-card-top-row">
      ${cast || '<div class="tver-mode-cast" aria-hidden="true"></div>'}
      ${dreamPassPinButtonHtml(item)}
    </div>
    <h3 title="${dreamPassSafeHtml(item.title)}">${dreamPassSafeHtml(item.title)}</h3>
    ${isVoting ? `<div class="dream-pass-card-rank"><span>現在順位</span><strong>${rank === null ? "順位未取得" : rank.toLocaleString("ja-JP") + "位"}</strong></div>` : ""}
    ${isTicket && item.status === "未成立" ? '<p class="dream-pass-section-description">上映未成立</p>' : ""}
    <a class="dream-pass-vote-button" href="${dreamPassSafeHtml(item.platformUrl)}" target="_blank" rel="noopener noreferrer" data-dreampass-mode-link="true" data-dreampass-title="${dreamPassSafeHtml(item.title)}" data-dreampass-type="${dreamPassSafeHtml(item.workType)}" data-dreampass-work-id="${dreamPassSafeHtml(item.platformUrl.split(/[?#]/)[0].split("/").pop())}">${label}<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
  </article>`;
}

function renderDreamPassMode() {
  const list = document.getElementById("dreamPassModeList");
  if (!list) return;
  // ピン留めした作品はフィルター・順位sortの対象外。
  const pinned = dreamPassRecords.filter(item => dreamPassPinnedIds.has(dreamPassPinKey(item)));
  const pinnedKeys = new Set(pinned.map(item => dreamPassPinKey(item)));
  const pinnedUnique = pinned.filter((item, index) =>
    pinned.findIndex(record => dreamPassPinKey(record) === dreamPassPinKey(item)) === index);
  const visibleRecords = dreamPassRecords.filter(item =>
    !pinnedKeys.has(dreamPassPinKey(item)) &&
    isCheckModeMemberVisible(item, dreamPassSelectedMembers));
  const voting = visibleRecords.filter(item => item.workType === "dreampass")
    .sort((a, b) => {
      const rankA = dreamPassRank(a.rank), rankB = dreamPassRank(b.rank);
      // 未取得の順位は昇順・降順のどちらでも最後。
      if (rankA === null) return rankB === null ? 0 : 1;
      if (rankB === null) return -1;
      return dreamPassSortOrder === "desc" ? rankB - rankA : rankA - rankB;
    });
  const candidates = visibleRecords.filter(item => item.workType === "dreampass_kouho");
  const tickets = visibleRecords.filter(item => item.workType === "dreampass_hanbai");
  const confirmed = tickets.filter(item => item.status === "成立");
  const pending = tickets.filter(item => item.status !== "成立");
  const section = (heading, description, items, isVoting, icon = isVoting ? "🗳️" : "✅") => items.length
    ? `<section class="dream-pass-section">
      <div class="dream-pass-section-heading">
        <h3 class="dream-pass-section-title">${icon}${heading}</h3>
        ${isVoting ? `<label class="check-mode-sort-label">並び順
          <select id="dreamPassSortOrder" class="check-mode-sort-select" aria-label="投票中の作品の並び順">
            <option value="asc" ${dreamPassSortOrder === "asc" ? "selected" : ""}>順位昇順</option>
            <option value="desc" ${dreamPassSortOrder === "desc" ? "selected" : ""}>順位降順</option>
          </select></label>` : ""}
      </div>
      <p class="dream-pass-section-description">${description}</p>
      <div class="dream-pass-grid">${items.map(item => dreamPassCardHtml(item, isVoting)).join("")}</div>
    </section>` : "";
  const pinnedHtml = pinnedUnique.length
    ? `<section class="dream-pass-section"><div class="dream-pass-section-heading"><h3 class="dream-pass-section-title"><i class="bi bi-pin-angle-fill" aria-hidden="true"></i>お気に入り</h3></div><div class="dream-pass-grid">${pinnedUnique.map(item => dreamPassCardHtml(item, item.workType === "dreampass")).join("")}</div></section>`
    : "";
  list.innerHTML = pinnedHtml + section("投票中", "再上映のチャンス！見たい作品に投票しよ！", voting, true) +
    section("上映候補入り", "上映候補入りした作品はこちら！見たい作品にはファン登録しておこ！", candidates, false) +
    section("チケット販売中", "チケット販売が決まったよ！詳細はドリパスのページで！", confirmed, false, "🎬") +
    section("チケット情報", "上映の成立状況やチケット情報はイベントページで確認してね！", pending, false, "🎟️");
  if (!list.innerHTML) list.textContent = "選択したメンバーの作品はありません。";
}
