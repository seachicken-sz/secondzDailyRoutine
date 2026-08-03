"use strict";

const DATA_URL = "./data/services.json";
const STORAGE_KEY = "tamugotoStartGuideSelectedPlans";

const CATEGORY_META = {
  music: { label: "音楽", icon: "bi-music-note-beamed" },
  video: { label: "動画", icon: "bi-play-btn" },
  radio: { label: "ラジオ", icon: "bi-broadcast" }
};

const FEATURE_LABELS = {
  "music-streaming": "公式音源を聴く",
  "stationhead-compatible": "Stationhead連携",
  "music-ad-free": "広告なし再生",
  "music-background-play": "バックグラウンド再生",
  "music-offline-play": "オフライン再生",
  "catch-up-video": "見逃し配信を見る",
  "video-streaming": "出演作品を見る",
  "channel-subscribe": "チャンネル登録",
  "video-like": "高評価",
  "video-ad-free": "広告なし視聴",
  "video-background-play": "バックグラウンド再生",
  "video-offline-play": "オフライン再生",
  "radio-live": "放送を聴く",
  "radio-timeshift-local": "タイムフリー",
  "radio-area-free": "全国の放送局を聴く",
  "radio-time-free-30": "過去30日以内を聴く",
  "radio-unlimited-listening": "聴取時間制限なし"
};

const state = {
  data: null,
  selectedPlans: new Map(),
  mode: "services"
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindStaticEvents();
  loadGuideData();
});

function cacheElements() {
  elements.loadingPanel = document.getElementById("loadingPanel");
  elements.errorPanel = document.getElementById("errorPanel");
  elements.errorMessage = document.getElementById("errorMessage");
  elements.retryButton = document.getElementById("retryButton");
  elements.serviceTab = document.getElementById("serviceTab");
  elements.freeTab = document.getElementById("freeTab");
  elements.servicePanel = document.getElementById("servicePanel");
  elements.freePanel = document.getElementById("freePanel");
  elements.serviceGroups = document.getElementById("serviceGroups");
  elements.freeServiceGroups = document.getElementById("freeServiceGroups");
  elements.selectionCount = document.getElementById("selectionCount");
  elements.resetSelectionButton = document.getElementById("resetSelectionButton");
  elements.showResultButton = document.getElementById("showResultButton");
  elements.resultSection = document.getElementById("resultSection");
  elements.resultSummary = document.getElementById("resultSummary");
  elements.resultCards = document.getElementById("resultCards");
  elements.editSelectionButton = document.getElementById("editSelectionButton");
}

function bindStaticEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
  });

  elements.retryButton.addEventListener("click", loadGuideData);
  elements.resetSelectionButton.addEventListener("click", resetSelection);
  elements.showResultButton.addEventListener("click", showResults);
  elements.editSelectionButton.addEventListener("click", () => {
    switchMode("services");
    elements.servicePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function loadGuideData() {
  setLoading(true);
  hideError();

  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    validateGuideData(data);
    state.data = data;
    restoreSelection();
    renderAll();
  } catch (error) {
    console.error("start_guide data load failed", error);
    showError("サービス情報を読み込めませんでした。通信状態を確認して、再読み込みしてください。");
  } finally {
    setLoading(false);
  }
}

function validateGuideData(data) {
  if (!data || !Array.isArray(data.services)) {
    throw new Error("services.json の形式が正しくありません");
  }

  for (const service of data.services) {
    if (!service.id || !service.name || !Array.isArray(service.plans)) {
      throw new Error(`サービスデータが不完全です: ${service?.id || "unknown"}`);
    }
  }
}

function renderAll() {
  renderServiceSelector();
  renderFreeServices();
  updateSelectionUI();

  if (state.selectedPlans.size > 0) {
    renderResults();
  } else {
    elements.resultSection.classList.add("hidden");
  }
}

function renderServiceSelector() {
  elements.serviceGroups.replaceChildren();
  const services = [...state.data.services]
    .filter((service) => service.showInServiceSelector)
    .sort(sortByDisplayOrder);

  Object.keys(CATEGORY_META).forEach((category) => {
    const categoryServices = services.filter((service) => service.category === category);
    if (categoryServices.length === 0) return;

    const section = document.createElement("section");
    section.className = "service-group";

    const heading = createCategoryHeading(category);
    const list = document.createElement("div");
    list.className = "service-list";

    categoryServices.forEach((service) => list.append(createServiceSelectorCard(service)));
    section.append(heading, list);
    elements.serviceGroups.append(section);
  });
}

function createServiceSelectorCard(service) {
  const card = document.createElement("article");
  card.className = "service-card";
  card.dataset.serviceId = service.id;

  const header = document.createElement("div");
  header.className = "service-card-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "service-card-title";

  const title = document.createElement("h4");
  title.textContent = service.name;

  const summary = document.createElement("p");
  summary.textContent = service.content?.summary || "";

  const categoryChip = document.createElement("span");
  categoryChip.className = "service-category-chip";
  categoryChip.textContent = CATEGORY_META[service.category]?.label || service.category;

  titleWrap.append(title, summary);
  header.append(titleWrap, categoryChip);

  const plans = document.createElement("div");
  plans.className = "plan-options";
  plans.setAttribute("role", "radiogroup");
  plans.setAttribute("aria-label", `${service.name}のプラン`);

  service.plans.forEach((plan) => plans.append(createPlanOption(service, plan)));

  card.append(header, plans);

  if (service.trialPolicy?.available) {
    const trial = document.createElement("span");
    trial.className = "trial-chip";
    trial.innerHTML = `<i class="bi bi-stars"></i>${escapeText(service.trialPolicy.label || "無料体験あり")}`;
    card.append(trial);
  }

  const details = createContentDetails(service.content, state.data.htmlPolicy);
  if (details) card.append(details);

  return card;
}

function createPlanOption(service, plan) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "plan-option";
  button.dataset.serviceId = service.id;
  button.dataset.planId = plan.id;
  button.setAttribute("role", "radio");

  const main = document.createElement("span");
  main.className = "plan-option-main";

  const name = document.createElement("span");
  name.className = "plan-option-name";
  name.textContent = plan.shortName || plan.name;

  const price = document.createElement("span");
  price.className = "plan-option-price";
  price.textContent = formatPlanPrice(plan);

  const check = document.createElement("span");
  check.className = "plan-option-check";
  check.innerHTML = '<i class="bi bi-check"></i>';
  check.setAttribute("aria-hidden", "true");

  main.append(name, price);
  button.append(main, check);
  button.addEventListener("click", () => togglePlanSelection(service.id, plan.id));

  return button;
}

function togglePlanSelection(serviceId, planId) {
  if (state.selectedPlans.get(serviceId) === planId) {
    state.selectedPlans.delete(serviceId);
  } else {
    state.selectedPlans.set(serviceId, planId);
  }

  persistSelection();
  updateSelectionUI();
  elements.resultSection.classList.add("hidden");
}

function updateSelectionUI() {
  document.querySelectorAll(".plan-option").forEach((button) => {
    const selected = state.selectedPlans.get(button.dataset.serviceId) === button.dataset.planId;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });

  const count = state.selectedPlans.size;
  elements.selectionCount.textContent = `${count}件`;
  elements.resetSelectionButton.disabled = count === 0;
  elements.showResultButton.innerHTML = count === 0
    ? '無料でできる応援を見る<i class="bi bi-arrow-down"></i>'
    : 'できる応援を見る<i class="bi bi-arrow-down"></i>';
}

function resetSelection() {
  state.selectedPlans.clear();
  persistSelection();
  updateSelectionUI();
  elements.resultSection.classList.add("hidden");
}

function renderFreeServices() {
  elements.freeServiceGroups.replaceChildren();

  Object.keys(CATEGORY_META).forEach((category) => {
    const freeEntries = getFreePlanEntries().filter(({ service }) => service.category === category);
    if (freeEntries.length === 0) return;

    const section = document.createElement("section");
    section.className = "service-group";
    const heading = createCategoryHeading(category);
    const list = document.createElement("div");
    list.className = "free-card-list";

    freeEntries.forEach(({ service, plan }) => list.append(createFreeServiceCard(service, plan)));
    section.append(heading, list);
    elements.freeServiceGroups.append(section);
  });
}

function getFreePlanEntries() {
  return [...state.data.services]
    .sort(sortByDisplayOrder)
    .flatMap((service) => service.plans
      .filter((plan) => plan.planType === "free")
      .map((plan) => ({ service, plan })));
}

function createFreeServiceCard(service, plan) {
  const card = document.createElement("article");
  card.className = "free-service-card";

  const top = document.createElement("div");
  top.className = "free-card-top";

  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = plan.name;
  const summary = document.createElement("p");
  summary.textContent = service.content?.summary || "";

  const badge = document.createElement("span");
  badge.className = "price-badge";
  badge.textContent = "無料";

  titleWrap.append(title, summary);
  top.append(titleWrap, badge);
  card.append(top, createFeatureList(plan.features));

  const details = createContentDetails(service.content, state.data.htmlPolicy);
  if (details) card.append(details);

  return card;
}

function showResults() {
  renderResults();
  elements.resultSection.classList.remove("hidden");
  elements.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResults() {
  const entries = resolveAvailablePlans();
  elements.resultCards.replaceChildren();

  if (entries.length === 0) {
    elements.resultSummary.innerHTML = "<p>有料サービスを選ばなくても、無料で始められる応援があります。</p>";
    getFreePlanEntries().forEach(({ service, plan }) => {
      elements.resultCards.append(createResultCard(service, plan, { source: "free" }));
    });
    return;
  }

  const directCount = entries.filter((entry) => entry.source === "selected").length;
  const includedCount = entries.length - directCount;
  const includedText = includedCount > 0 ? `、契約に含まれるサービス${includedCount}件` : "";
  elements.resultSummary.innerHTML = `<p>選択したサービス${directCount}件${includedText}から、追加料金なしでできることを表示しています。</p>`;

  entries.forEach((entry) => {
    const service = findService(entry.serviceId);
    const plan = findPlan(entry.serviceId, entry.planId);
    if (!service || !plan) return;
    elements.resultCards.append(createResultCard(service, plan, entry));
  });
}

function resolveAvailablePlans() {
  const resolved = new Map();
  const queue = [];

  state.selectedPlans.forEach((planId, serviceId) => {
    queue.push({ serviceId, planId, source: "selected", includedBy: null });
  });

  while (queue.length > 0) {
    const entry = queue.shift();
    const key = `${entry.serviceId}.${entry.planId}`;
    if (resolved.has(key)) continue;

    const plan = findPlan(entry.serviceId, entry.planId);
    if (!plan) continue;

    resolved.set(key, entry);
    (plan.includedPlans || []).forEach((included) => {
      queue.push({
        serviceId: included.serviceId,
        planId: included.planId,
        source: "included",
        includedBy: { serviceId: entry.serviceId, planId: entry.planId }
      });
    });
  }

  return [...resolved.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "selected" ? -1 : 1;
    return sortByDisplayOrder(findService(a.serviceId), findService(b.serviceId));
  });
}

function createResultCard(service, plan, entry) {
  const card = document.createElement("article");
  card.className = `result-card${entry.source === "included" ? " included" : ""}`;

  const top = document.createElement("div");
  top.className = "result-card-top";

  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = plan.name;
  const summary = document.createElement("p");
  summary.className = "result-card-summary";
  summary.textContent = service.content?.summary || "";

  const price = document.createElement("span");
  price.className = "price-badge";
  price.textContent = entry.source === "free" ? "無料" : "追加料金なし";

  titleWrap.append(title, summary);
  top.append(titleWrap, price);

  const badges = document.createElement("div");
  badges.className = "result-card-badges";
  const sourceBadge = document.createElement("span");
  sourceBadge.className = `source-badge${entry.source === "included" ? " included" : ""}`;
  sourceBadge.textContent = entry.source === "included" ? "契約に含まれる" : entry.source === "free" ? "無料サービス" : "選択したプラン";
  badges.append(sourceBadge);

  card.append(top, badges, createFeatureList(plan.features));

  if (entry.source === "included" && entry.includedBy) {
    const parentPlan = findPlan(entry.includedBy.serviceId, entry.includedBy.planId);
    const note = document.createElement("p");
    note.className = "plan-inclusion-note";
    note.textContent = `${parentPlan?.name || "選択したプラン"}に含まれているため利用できます。`;
    card.append(note);
  }

  if (service.trialPolicy?.available && service.trialPolicy.appliesToPlanIds?.includes(plan.id)) {
    const trial = document.createElement("span");
    trial.className = "trial-chip";
    trial.innerHTML = `<i class="bi bi-stars"></i>${escapeText(service.trialPolicy.label || "無料体験あり")}`;
    card.append(trial);
  }

  const details = createContentDetails(service.content, state.data.htmlPolicy);
  if (details) card.append(details);

  return card;
}

function createFeatureList(features = []) {
  const list = document.createElement("div");
  list.className = "feature-list";

  features.forEach((feature) => {
    const chip = document.createElement("span");
    chip.className = "feature-chip";
    chip.textContent = FEATURE_LABELS[feature] || feature;
    list.append(chip);
  });

  return list;
}

function createContentDetails(content, policy) {
  if (!content?.sections?.length) return null;

  const details = document.createElement("details");
  details.className = "service-details";
  const summary = document.createElement("summary");
  summary.textContent = "詳しく見る";
  const wrapper = document.createElement("div");
  wrapper.className = "service-detail-content";

  content.sections.forEach((section) => {
    if (section.title) {
      const heading = document.createElement("h5");
      heading.textContent = section.title;
      wrapper.append(heading);
    }

    const body = document.createElement("div");
    body.innerHTML = sanitizeHtml(section.bodyHtml || "", policy);
    wrapper.append(body);
  });

  details.append(summary, wrapper);
  return details;
}

function sanitizeHtml(html, policy = {}) {
  const allowedTags = new Set((policy.allowedTags || ["p", "strong", "em", "ul", "ol", "li", "br", "small", "span"]).map((tag) => tag.toUpperCase()));
  const allowedSpanClasses = new Set(policy.allowedSpanClasses || []);
  const template = document.createElement("template");
  template.innerHTML = html;

  const sanitizeNode = (node) => {
    [...node.children].forEach((child) => {
      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent || ""));
        return;
      }

      const originalClass = child.tagName === "SPAN" ? (child.getAttribute("class") || "") : "";
      [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
      if (child.tagName === "SPAN") {
        const safeClasses = originalClass.split(/\s+/).filter((name) => allowedSpanClasses.has(name));
        if (safeClasses.length > 0) child.className = safeClasses.join(" ");
      }
      sanitizeNode(child);
    });
  };

  sanitizeNode(template.content);
  return template.innerHTML;
}

function createCategoryHeading(category) {
  const meta = CATEGORY_META[category] || { label: category, icon: "bi-circle" };
  const heading = document.createElement("div");
  heading.className = "service-group-heading";
  heading.innerHTML = `<i class="bi ${meta.icon}"></i><h3>${escapeText(meta.label)}</h3>`;
  return heading;
}

function switchMode(mode) {
  state.mode = mode;
  const showServices = mode === "services";
  elements.serviceTab.classList.toggle("active", showServices);
  elements.freeTab.classList.toggle("active", !showServices);
  elements.serviceTab.setAttribute("aria-selected", String(showServices));
  elements.freeTab.setAttribute("aria-selected", String(!showServices));
  elements.servicePanel.classList.toggle("hidden", !showServices);
  elements.freePanel.classList.toggle("hidden", showServices);
}

function formatPlanPrice(plan) {
  if (plan.planType === "free") return "無料";
  if (!Array.isArray(plan.billingOptions) || plan.billingOptions.length === 0) return "料金は公式情報を確認";

  const parts = plan.billingOptions.map((option) => {
    const cycle = option.cycle === "monthly" ? "月額" : option.cycle === "yearly" ? "年額" : option.cycle;
    if (typeof option.amount !== "number") return `${cycle}料金は公式情報を確認`;
    return `${cycle}${option.amount.toLocaleString("ja-JP")}円`;
  });
  return parts.join("・");
}

function findService(serviceId) {
  return state.data?.services.find((service) => service.id === serviceId) || null;
}

function findPlan(serviceId, planId) {
  return findService(serviceId)?.plans.find((plan) => plan.id === planId) || null;
}

function persistSelection() {
  const data = [...state.selectedPlans.entries()].map(([serviceId, planId]) => ({ serviceId, planId }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("selection save failed", error);
  }
}

function restoreSelection() {
  state.selectedPlans.clear();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return;

    saved.forEach((entry) => {
      if (entry?.serviceId && entry?.planId && findPlan(entry.serviceId, entry.planId)) {
        state.selectedPlans.set(entry.serviceId, entry.planId);
      }
    });
  } catch (error) {
    console.warn("selection restore failed", error);
  }
}

function sortByDisplayOrder(a, b) {
  return (a?.displayOrder ?? 9999) - (b?.displayOrder ?? 9999);
}

function setLoading(isLoading) {
  elements.loadingPanel.classList.toggle("hidden", !isLoading);
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorPanel.classList.remove("hidden");
}

function hideError() {
  elements.errorPanel.classList.add("hidden");
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
