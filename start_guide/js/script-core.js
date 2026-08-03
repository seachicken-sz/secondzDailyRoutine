"use strict";

const DATA_URL = "./data/services.json";
const STORAGE_KEY = "tamugotoStartGuideSelectedPlans";
const BUDGET_STORAGE_KEY = "tamugotoStartGuideBudget";
const CATEGORY_STORAGE_KEY = "tamugotoStartGuideClosedServiceCategories";

const CATEGORY_ORDER = ["official", "sns", "music", "video", "radio"];
const CATEGORY_META = {
  official: { label: "公式サービス", note: "ファンクラブ・公式ブログなど", icon: "bi-patch-check" },
  sns: { label: "公式SNS", note: "公式SNS", icon: "bi-share" },
  music: { label: "音楽", note: "音楽配信サービス", icon: "bi-music-note-beamed" },
  video: { label: "動画", note: "動画配信サービス", icon: "bi-play-btn" },
  radio: { label: "ラジオ", note: "ラジオ配信サービス", icon: "bi-broadcast" }
};
const FEATURE_LABELS = {
  "music-streaming": "公式音源を聴く",
  "music-ad-free": "広告なしで再生する",
  "music-background-play": "バックグラウンド再生する",
  "music-offline-play": "オフライン再生する",
  "catch-up-video": "見逃し配信を見る",
  "video-streaming": "出演番組・作品を見る",
  "channel-subscribe": "公式チャンネルを登録する",
  "video-like": "公式動画を高評価する",
  "video-ad-free": "広告なしで視聴する",
  "video-background-play": "バックグラウンド再生する",
  "video-offline-play": "オフライン再生する",
  "radio-live": "放送を聴く",
  "radio-timeshift-local": "タイムフリーで聴く",
  "radio-area-free": "全国の放送局を聴く",
  "radio-time-free-30": "過去30日以内の番組を聴く",
  "radio-unlimited-listening": "聴取時間制限なしで聴く",
  "stationhead-group-listening": "みんなと一緒に公式音源を聴く",
  "stationhead-official-streaming": "公式音源の再生で応援する",
  "official-sns-follow": "公式アカウントをフォローする",
  "official-sns-comment": "公式投稿にコメントする",
  "official-sns-share": "公式投稿をシェアする",
  "family-club-membership": "公式ファンクラブに入会する",
  "family-club-member-content": "会員限定コンテンツを見る",
  "family-club-online-live": "生配信・オンライン配信を見る",
  "family-club-online-ticket": "配信チケットを購入して見る",
  "family-club-mail-view": "メール伝言板を確認する",
  "family-club-mail-notification": "新しいお知らせを通知で受け取る",
  "family-club-web-blog": "有料ブログを読む",
  "family-club-web-live": "個人生配信を見る",
  "fod-ad-supported-10000": "広告付きで約1万本を見る",
  "fod-video-100000": "10万本以上の動画を見る",
  "fod-magazines": "雑誌200誌以上を読む",
  "fod-movie-discount": "映画割引特典を利用する",
  "fod-monthly-points": "毎月ポイントを受け取る"
};

const state = {
  data: null,
  selectedPlans: new Map(),
  budget: 0,
  closedCategories: loadClosedCategories(),
  previousFocus: null
};
const elements = {};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  cacheElements();
  bindEvents();
  setupStickyToc();
  loadData();
}

function cacheElements() {
  ["serviceGroups","selectionCount","resetSelectionButton","showResultButton","budgetSelect","resultSection","resultSummary","resultCards","emptyCurrentResult","freeAdditionalSupportSection","freeAdditionalSupportCards","paidAdditionalSupportSection","paidAdditionalSupportCards","paidAdditionalBudgetBadge","editSelectionButton","loadingPanel","errorPanel","errorMessage","retryButton","serviceFinderSection","serviceInfoModal","serviceInfoModalTitle","serviceInfoModalBody"].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.resetSelectionButton?.addEventListener("click", resetSelection);
  elements.showResultButton?.addEventListener("click", showResults);
  elements.editSelectionButton?.addEventListener("click", () => elements.serviceFinderSection?.scrollIntoView({ behavior: "smooth", block: "start" }));
  elements.budgetSelect?.addEventListener("change", handleBudgetChange);
  elements.retryButton?.addEventListener("click", loadData);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeServiceInfoModal(); });
  document.addEventListener("toggle", handleCategoryToggle, true);
}

function handleDocumentClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const planButton = target.closest("[data-plan-button]");
  if (planButton) {
    togglePlan(planButton.dataset.serviceId, planButton.dataset.planId);
    return;
  }
  const infoButton = target.closest("[data-service-info-button]");
  if (infoButton) {
    openServiceInfoModal(infoButton.dataset.serviceId, infoButton);
    return;
  }
  if (target.closest("[data-service-info-close]")) closeServiceInfoModal();
}

function handleBudgetChange(event) {
  state.budget = Number(event.target.value) || 0;
  localStorage.setItem(BUDGET_STORAGE_KEY, String(state.budget));
  if (!elements.resultSection?.classList.contains("hidden")) renderResults();
}

function handleCategoryToggle(event) {
  const accordion = event.target;
  if (!(accordion instanceof HTMLDetailsElement) || !accordion.matches("[data-service-category]")) return;
  const categoryId = accordion.dataset.serviceCategory;
  if (!categoryId) return;
  accordion.open ? state.closedCategories.delete(categoryId) : state.closedCategories.add(categoryId);
  saveClosedCategories();
}

async function loadData() {
  showLoading(true);
  elements.errorPanel?.classList.add("hidden");
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`services.json: HTTP ${response.status}`);
    const data = await response.json();
    validateData(data);
    state.data = data;
    restoreState();
    removeInvalidSelections();
    renderGuideServiceCards();
    renderServiceGroups();
    updateSelectionCount();
    showLoading(false);
  } catch (error) {
    console.error(error);
    showLoading(false);
    if (elements.errorMessage) elements.errorMessage.textContent = "サービス情報の取得に失敗しました。通信状況を確認して、もう一度お試しください。";
    elements.errorPanel?.classList.remove("hidden");
  }
}

function validateData(data) {
  if (!data || !Array.isArray(data.services)) throw new Error("services.jsonのservicesが配列ではありません。");
  const serviceIds = new Set();
  const planKeys = new Set();
  data.services.forEach((service) => {
    if (!service?.id || serviceIds.has(service.id)) throw new Error(`サービスIDが不正または重複しています: ${service?.id || "(空)"}`);
    if (!Array.isArray(service.plans)) throw new Error(`plansが配列ではありません: ${service.id}`);
    serviceIds.add(service.id);
    const planIds = new Set();
    service.plans.forEach((plan) => {
      if (!plan?.id || planIds.has(plan.id)) throw new Error(`プランIDが不正または重複しています: ${service.id}/${plan?.id || "(空)"}`);
      planIds.add(plan.id);
      planKeys.add(planKey(service.id, plan.id));
    });
  });
  data.services.forEach((service) => {
    service.plans.forEach((plan) => (plan.includedPlans || []).forEach((included) => {
      if (!planKeys.has(planKey(included.serviceId, included.planId))) throw new Error(`includedPlansの参照先が存在しません: ${service.id}/${plan.id}`);
    }));
    (service.requirements?.anyPlans || []).forEach((required) => {
      if (!planKeys.has(planKey(required.serviceId, required.planId))) throw new Error(`requirementsの参照先が存在しません: ${service.id}`);
    });
  });
}

function renderGuideServiceCards() {
  document.querySelectorAll(".service-data-card[data-id]").forEach((card) => {
    const service = getServiceById(card.dataset.id);
    if (!service) {
      card.innerHTML = `<p class="service-data-card-error">サービス情報を読み込めませんでした。</p>`;
      return;
    }
    const prices = (service.plans || []).map(formatPlanPrice);
    const uniquePrices = [...new Set(prices)];
    const priceText = uniquePrices.length <= 2 ? uniquePrices.join("／") : `${uniquePrices[0]}〜`;
    card.innerHTML = `
      <div class="service-data-card-main">
        <div class="service-data-card-heading">
          <h4>${escapeHtml(service.name)}</h4>
          <span class="service-data-category">${escapeHtml(CATEGORY_META[service.category]?.label || service.category || "サービス")}</span>
        </div>
        <p>${escapeHtml(service.content?.summary || "サービス情報を確認できます。")}</p>
        <p class="service-data-price">${escapeHtml(priceText || "料金は公式情報を確認")}</p>
        ${service.requirements?.label ? `<p class="service-data-requirement">${escapeHtml(service.requirements.label)}</p>` : ""}
        ${renderServiceInfoButton(service)}
      </div>
      ${renderServiceLinks(service)}
    `;
  });
}

function restoreState() {
  state.selectedPlans.clear();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) saved.forEach((item) => { if (item?.serviceId && item?.planId) state.selectedPlans.set(item.serviceId, item.planId); });
  } catch (error) { console.warn("保存済みプランを復元できませんでした。", error); }
  state.budget = Number(localStorage.getItem(BUDGET_STORAGE_KEY)) || 0;
  if (elements.budgetSelect) {
    const exists = [...elements.budgetSelect.options].some((option) => Number(option.value) === state.budget);
    if (!exists) state.budget = 0;
    elements.budgetSelect.value = String(state.budget);
  }
}

function saveSelection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }))));
}
function loadClosedCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : []);
  } catch (error) { return new Set(); }
}
function saveClosedCategories() { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify([...state.closedCategories])); }
function getServices() { return [...(state.data?.services || [])].sort(compareServices); }
function compareServices(a, b) {
  const rankA = CATEGORY_ORDER.includes(a?.category) ? CATEGORY_ORDER.indexOf(a.category) : CATEGORY_ORDER.length;
  const rankB = CATEGORY_ORDER.includes(b?.category) ? CATEGORY_ORDER.indexOf(b.category) : CATEGORY_ORDER.length;
  return rankA !== rankB ? rankA - rankB : Number(a?.displayOrder || 0) - Number(b?.displayOrder || 0);
}
function getServiceById(serviceId) { return (state.data?.services || []).find((service) => service.id === serviceId) || null; }
function getPlanRecord(serviceId, planId) {
  const service = getServiceById(serviceId);
  const plan = service?.plans?.find((item) => item.id === planId);
  return service && plan ? { service, plan } : null;
}
function getSelectedRefs() { return Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId })); }
function getResolvedSelectedRefs() { return resolveIncludedPlans(getSelectedRefs()); }

function removeInvalidSelections() {
  let changed = false;
  [...state.selectedPlans].forEach(([serviceId, planId]) => {
    if (!getPlanRecord(serviceId, planId)) { state.selectedPlans.delete(serviceId); changed = true; }
  });
  if (removeInvalidConditionalSelections()) changed = true;
  if (changed) saveSelection();
}
function removeInvalidConditionalSelections() {
  let changed = false;
  let removed = true;
  while (removed) {
    removed = false;
    const refs = getResolvedSelectedRefs();
    getServices().filter((service) => service.selectionType === "conditional" && state.selectedPlans.has(service.id)).forEach((service) => {
      if (!isRequirementSatisfied(service, refs)) { state.selectedPlans.delete(service.id); changed = true; removed = true; }
    });
  }
  return changed;
}

function renderServiceGroups() {
  if (!elements.serviceGroups) return;
  const refs = getResolvedSelectedRefs();
  const visibleServices = getServices().filter((service) => service.showInServiceSelector !== false && (service.selectionType !== "conditional" || isRequirementSatisfied(service, refs)));
  elements.serviceGroups.innerHTML = CATEGORY_ORDER.map((categoryId) => {
    const meta = CATEGORY_META[categoryId];
    const services = visibleServices.filter((service) => service.category === categoryId);
    const open = !state.closedCategories.has(categoryId);
    return `<details class="service-category-accordion" data-service-category="${escapeAttribute(categoryId)}"${open ? " open" : ""}>
      <summary class="service-category-summary"><span class="service-category-summary-main"><span class="service-category-summary-icon"><i class="bi ${escapeAttribute(meta.icon)}"></i></span><span class="service-category-summary-text"><strong>${escapeHtml(meta.label)}</strong><small>${escapeHtml(meta.note)}</small></span></span><span class="service-category-summary-side"><span class="service-category-count">${services.length}</span><i class="bi bi-chevron-down service-category-chevron"></i></span></summary>
      <div class="service-category-panel">${services.length ? `<div class="service-list">${services.map(renderServiceCard).join("")}</div>` : `<p class="service-category-empty">サービス情報は準備中です。</p>`}</div>
    </details>`;
  }).join("");
}
function renderServiceCard(service) {
  const selectedPlanId = state.selectedPlans.get(service.id);
  return `<article class="service-card selector-service-card${service.selectionType === "conditional" ? " conditional-service-card" : ""}"><div class="service-card-title"><h4>${escapeHtml(service.name)}</h4></div><div class="plan-options">${(service.plans || []).map((plan) => renderPlanOption(service, plan, selectedPlanId === plan.id)).join("")}</div></article>`;
}
function renderPlanOption(service, plan, selected) {
  return `<button type="button" class="plan-option${selected ? " selected" : ""}" data-plan-button data-service-id="${escapeAttribute(service.id)}" data-plan-id="${escapeAttribute(plan.id)}" aria-pressed="${selected}"><span class="plan-option-main"><span class="plan-option-name">${escapeHtml(plan.name)}</span><span class="plan-option-price">${escapeHtml(formatPlanPrice(plan))}</span></span><span class="plan-option-check"><i class="bi bi-check-lg"></i></span></button>`;
}
function togglePlan(serviceId, planId) {
  const service = getServiceById(serviceId);
  if (!service || !getPlanRecord(serviceId, planId)) return;
  const selected = state.selectedPlans.get(serviceId) === planId;
  if (!selected && service.selectionType === "conditional" && !isRequirementSatisfied(service, getResolvedSelectedRefs())) return;
  selected ? state.selectedPlans.delete(serviceId) : state.selectedPlans.set(serviceId, planId);
  removeInvalidConditionalSelections();
  saveSelection();
  renderServiceGroups();
  updateSelectionCount();
  if (!elements.resultSection?.classList.contains("hidden")) renderResults();
}
function resetSelection() {
  state.selectedPlans.clear();
  saveSelection();
  renderServiceGroups();
  updateSelectionCount();
  elements.resultSection?.classList.add("hidden");
  hideCandidateSections();
}
function updateSelectionCount() { if (elements.selectionCount) elements.selectionCount.textContent = `${state.selectedPlans.size}件`; }
function showResults() {
  renderResults();
  elements.resultSection?.classList.remove("hidden");
  elements.resultSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResults() {
  if (removeInvalidConditionalSelections()) { saveSelection(); renderServiceGroups(); updateSelectionCount(); }
  const refs = getResolvedSelectedRefs();
  const groups = groupRefsByService(refs);
  if (elements.resultSummary) elements.resultSummary.textContent = groups.length ? `${state.selectedPlans.size}件の選択から、${groups.length}サービスでできる応援を確認しました。` : "利用中のプランがまだ選択されていません。";
  if (elements.resultCards) elements.resultCards.innerHTML = groups.map(renderSelectedResultCard).join("");
  elements.emptyCurrentResult?.classList.toggle("hidden", groups.length > 0);
  renderCandidateSections(refs);
}
function groupRefsByService(refs) {
  const grouped = new Map();
  refs.forEach((ref) => {
    const record = getPlanRecord(ref.serviceId, ref.planId);
    if (!record) return;
    if (!grouped.has(record.service.id)) grouped.set(record.service.id, { service: record.service, items: [], features: new Set() });
    const group = grouped.get(record.service.id);
    group.items.push({ ref, plan: record.plan });
    (record.plan.features || []).forEach((feature) => group.features.add(feature));
  });
  return [...grouped.values()].sort((a, b) => compareServices(a.service, b.service));
}
function renderSelectedResultCard(group) {
  const selected = group.items.some(({ ref }) => ref.source === "selected");
  const names = group.items.map(({ ref, plan }) => `${plan.name}（${ref.source === "included" ? "含まれるプラン" : "選択中"}）`);
  const includedBy = [...new Set(group.items.filter(({ ref }) => ref.includedBy).map(({ ref }) => getPlanRecord(ref.includedBy.serviceId, ref.includedBy.planId)?.plan.name).filter(Boolean))];
  return `<article class="result-card service-result-card"><div class="result-card-top"><div><h4>${escapeHtml(group.service.name)}</h4><p class="additional-plan-name">${names.map(escapeHtml).join("<br>")}</p><p class="result-card-summary">${escapeHtml(group.service.content?.summary || "")}</p></div><span class="source-badge">${selected ? "選択中" : "含まれるサービス"}</span></div>${renderServiceInfoButton(group.service)}<div class="feature-list">${renderFeatureChips([...group.features])}</div>${includedBy.length ? `<p class="included-note">${includedBy.map(escapeHtml).join("、")}に含まれています。</p>` : ""}${renderServiceLinks(group.service)}</article>`;
}

function renderCandidateSections(currentRefs) {
  const currentKeys = new Set(currentRefs.map((ref) => planKey(ref.serviceId, ref.planId)));
  const currentServiceIds = new Set(currentRefs.map((ref) => ref.serviceId));
  const currentFeatures = new Set(currentRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || []));
  const freeCandidates = [];
  const paidCandidates = [];
  getServices().forEach((service) => {
    if (service.selectionType === "conditional" && !isRequirementSatisfied(service, currentRefs)) return;
    (service.plans || []).forEach((plan) => {
      if (currentKeys.has(planKey(service.id, plan.id))) return;
      if (plan.planType === "free") {
        if (!currentServiceIds.has(service.id)) freeCandidates.push(buildCandidate(service, plan, 0));
        return;
      }
      if (state.budget <= 0 || plan.planType !== "paid") return;
      const monthlyPrice = getMonthlyPrice(plan);
      if (monthlyPrice === null || monthlyPrice > state.budget) return;
      const candidate = buildCandidate(service, plan, monthlyPrice);
      candidate.features = candidate.allFeatures.filter((feature) => !currentFeatures.has(feature));
      if (candidate.features.length) paidCandidates.push(candidate);
    });
  });
  renderCandidateSection(elements.freeAdditionalSupportSection, elements.freeAdditionalSupportCards, groupCandidatesByService(freeCandidates), "free");
  renderCandidateSection(elements.paidAdditionalSupportSection, elements.paidAdditionalSupportCards, groupCandidatesByService(paidCandidates), "paid");
  if (elements.paidAdditionalBudgetBadge) elements.paidAdditionalBudgetBadge.textContent = `＋${state.budget.toLocaleString("ja-JP")}円まで`;
}
function buildCandidate(service, plan, monthlyPrice) {
  const refs = resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]);
  const allFeatures = [...new Set(refs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || []))];
  return { service, plan, monthlyPrice, refs, allFeatures, features: allFeatures };
}
function groupCandidatesByService(candidates) {
  const grouped = new Map();
  candidates.forEach((candidate) => {
    if (!grouped.has(candidate.service.id)) grouped.set(candidate.service.id, { service: candidate.service, candidates: [], features: new Set() });
    const group = grouped.get(candidate.service.id);
    group.candidates.push(candidate);
    candidate.features.forEach((feature) => group.features.add(feature));
  });
  return [...grouped.values()].sort((a, b) => compareServices(a.service, b.service));
}
function renderCandidateSection(section, cards, groups, type) {
  if (!section || !cards) return;
  if (!groups.length) { section.classList.add("hidden"); cards.innerHTML = ""; return; }
  cards.innerHTML = groups.map((group) => renderCandidateCard(group, type)).join("");
  section.classList.remove("hidden");
}
function renderCandidateCard(group, type) {
  const category = CATEGORY_META[group.service.category]?.label || group.service.category || "その他";
  return `<article class="result-card additional-support-card card-with-fixed-footer"><div class="result-card-top"><h4 class="additional-service-name">${escapeHtml(group.service.name)}</h4><span class="source-badge">${type === "free" ? "無料" : "追加候補"}</span></div>${renderServiceInfoButton(group.service)}<div class="card-description-spacer"></div><span class="service-category-chip additional-category-chip">${escapeHtml(category)}</span><div class="service-plan-candidates">${group.candidates.sort((a,b) => a.monthlyPrice-b.monthlyPrice).map((candidate) => renderCandidatePlan(candidate, type)).join("")}</div>${renderServiceLinks(group.service)}</article>`;
}
function renderCandidatePlan(candidate, type) {
  return `<section class="service-plan-candidate"><p class="additional-plan-name">${escapeHtml(candidate.plan.name)}</p><p class="additional-price">${type === "free" ? "追加料金なし" : escapeHtml(formatAdditionalPrice(candidate.plan, candidate.monthlyPrice))}</p>${candidate.service.selectionType === "conditional" && candidate.service.requirements?.label ? `<p class="included-note">${escapeHtml(candidate.service.requirements.label)}</p>` : ""}<div class="feature-list">${renderFeatureChips(candidate.features)}</div>${renderIncludedPlanNames(candidate.refs)}${candidate.plan.priceNote ? `<p class="included-note">${escapeHtml(candidate.plan.priceNote)}</p>` : ""}</section>`;
}
function hideCandidateSections() {
  elements.freeAdditionalSupportSection?.classList.add("hidden");
  elements.paidAdditionalSupportSection?.classList.add("hidden");
  if (elements.freeAdditionalSupportCards) elements.freeAdditionalSupportCards.innerHTML = "";
  if (elements.paidAdditionalSupportCards) elements.paidAdditionalSupportCards.innerHTML = "";
}

function isRequirementSatisfied(service, refs) {
  const requirements = service.requirements?.anyPlans || [];
  if (!requirements.length) return true;
  const keys = new Set((refs || []).map((ref) => planKey(ref.serviceId, ref.planId)));
  return requirements.some((required) => keys.has(planKey(required.serviceId, required.planId)));
}
function resolveIncludedPlans(initialRefs) {
  const result = [];
  const queue = initialRefs.map((ref) => ({ ...ref, source: ref.source || "selected" }));
  const seen = new Set();
  while (queue.length) {
    const ref = queue.shift();
    const key = planKey(ref.serviceId, ref.planId);
    if (seen.has(key)) continue;
    const record = getPlanRecord(ref.serviceId, ref.planId);
    if (!record) continue;
    seen.add(key);
    result.push(ref);
    (record.plan.includedPlans || []).forEach((included) => queue.push({ serviceId: included.serviceId, planId: included.planId, source: "included", includedBy: { serviceId: ref.serviceId, planId: ref.planId } }));
  }
  return result;
}
function getPreferredMonthlyOption(plan) {
  const monthly = (plan.billingOptions || []).filter((option) => option.cycle === "monthly" && Number.isFinite(option.amount));
  return monthly.find((option) => option.default !== false) || monthly[0] || null;
}
function getMonthlyPrice(plan) {
  const monthly = getPreferredMonthlyOption(plan);
  if (monthly) return Number(monthly.amount);
  const yearly = (plan.billingOptions || []).find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  return yearly ? Math.ceil(Number(yearly.amount) / 12) : null;
}
function formatPlanPrice(plan) {
  if (plan.planType === "free") return "無料";
  const monthly = getPreferredMonthlyOption(plan);
  if (monthly) return `月額${Number(monthly.amount).toLocaleString("ja-JP")}円`;
  const yearly = (plan.billingOptions || []).find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  return yearly ? `年額${Number(yearly.amount).toLocaleString("ja-JP")}円` : "料金は公式情報を確認";
}
function formatAdditionalPrice(plan, monthlyPrice) {
  const monthly = getPreferredMonthlyOption(plan);
  if (monthly) return `月額＋${Number(monthly.amount).toLocaleString("ja-JP")}円`;
  const yearly = (plan.billingOptions || []).find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  return yearly ? `年額${Number(yearly.amount).toLocaleString("ja-JP")}円（月あたり約${monthlyPrice.toLocaleString("ja-JP")}円）` : "料金は公式情報を確認";
}
function renderFeatureChips(features) {
  return [...new Set(features)].map((feature) => `<span class="feature-chip"><i class="bi bi-check-circle"></i>${escapeHtml(FEATURE_LABELS[feature] || feature)}</span>`).join("");
}
function renderIncludedPlanNames(refs) {
  const names = [...new Set(refs.filter((ref) => ref.source === "included").map((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.name).filter(Boolean))];
  return names.length ? `<p class="included-note">${escapeHtml(names.join("、"))}も含まれます。</p>` : "";
}
function renderServiceInfoButton(service) {
  if (!(service.content?.sections || []).length) return "";
  return `<button type="button" class="service-info-button" data-service-info-button data-service-id="${escapeAttribute(service.id)}"><i class="bi bi-info-circle"></i><span>詳しく見る</span></button>`;
}
function renderServiceLinks(service) {
  if (!service) return "";
  const officialPage = service.officialPageUrl ? `<div class="app-download-links app-download-links-single"><a class="app-store-link" href="${escapeAttribute(service.officialPageUrl)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i><span>${escapeHtml(service.officialPageLabel || "公式ページ")}</span></a></div>` : "";
  const downloads = [];
  if (service.downloadLinks?.ios) downloads.push(`<a class="app-store-link" href="${escapeAttribute(service.downloadLinks.ios)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-apple"></i><span>iPhone</span></a>`);
  if (service.downloadLinks?.android) downloads.push(`<a class="app-store-link" href="${escapeAttribute(service.downloadLinks.android)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-google-play"></i><span>Android</span></a>`);
  const appLinks = downloads.length ? `<div class="app-download-links${officialPage ? " app-download-links-after-official" : ""}">${downloads.join("")}</div>` : "";
  return officialPage || appLinks ? `<div class="card-download-footer">${officialPage}${appLinks}</div>` : "";
}

function openServiceInfoModal(serviceId, trigger) {
  const service = getServiceById(serviceId);
  if (!service || !elements.serviceInfoModal) return;
  state.previousFocus = trigger || document.activeElement;
  elements.serviceInfoModalTitle.textContent = `${service.name}の詳細`;
  elements.serviceInfoModalBody.innerHTML = buildModalBody(service);
  elements.serviceInfoModal.classList.remove("hidden");
  elements.serviceInfoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("service-info-modal-open");
  window.requestAnimationFrame(() => elements.serviceInfoModal.querySelector(".service-info-modal-close")?.focus());
}
function closeServiceInfoModal() {
  if (!elements.serviceInfoModal || elements.serviceInfoModal.classList.contains("hidden")) return;
  elements.serviceInfoModal.classList.add("hidden");
  elements.serviceInfoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("service-info-modal-open");
  state.previousFocus?.focus?.();
  state.previousFocus = null;
}
function buildModalBody(service) {
  const sections = service.content?.sections || [];
  if (!sections.length) return `<p>${escapeHtml(service.content?.summary || "説明は準備中です。")}</p>`;
  return sections.map((section) => `<section class="service-info-modal-section">${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ""}${sanitizeHtml(section.bodyHtml || "")}</section>`).join("");
}
function setupStickyToc() {
  const links = [...document.querySelectorAll(".page-toc-link")];
  if (!links.length) return;
  links.forEach((link) => link.addEventListener("click", () => { links.forEach((item) => item.classList.remove("active")); link.classList.add("active"); }));
  const targets = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const href = `#${visible.target.id}`;
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === href));
  }, { rootMargin: "-72px 0px -65% 0px", threshold: [0.05, 0.25, 0.5] });
  targets.forEach((target) => observer.observe(target));
}
function sanitizeHtml(html) {
  const allowedTags = new Set((state.data?.htmlPolicy?.allowedTags || []).map((tag) => tag.toUpperCase()));
  const allowedClasses = new Set(state.data?.htmlPolicy?.allowedSpanClasses || []);
  const template = document.createElement("template");
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!allowedTags.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      if (node.tagName === "SPAN" && attribute.name === "class") {
        const valid = attribute.value.split(/\s+/).filter((name) => allowedClasses.has(name));
        valid.length ? node.setAttribute("class", valid.join(" ")) : node.removeAttribute("class");
      } else node.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}
function planKey(serviceId, planId) { return `${serviceId}::${planId}`; }
function showLoading(visible) { elements.loadingPanel?.classList.toggle("hidden", !visible); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttribute(value) { return escapeHtml(value); }
