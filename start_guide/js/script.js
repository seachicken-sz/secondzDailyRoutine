"use strict";

const DATA_URL = "./data/services.json";
const STORAGE_KEY = "tamugotoStartGuideSelectedPlans";
const BUDGET_STORAGE_KEY = "tamugotoStartGuideBudget";
const SERVICE_CATEGORY_STATE_STORAGE_KEY = "tamugotoStartGuideClosedServiceCategories";

const GLOBAL_SERVICE_CATEGORY_ORDER = ["official", "sns", "music", "video", "radio"];

const CATEGORY_META = {
  official: { label: "公式サービス", icon: "bi-patch-check" },
  sns: { label: "公式SNS", icon: "bi-share" },
  music: { label: "音楽", icon: "bi-music-note-beamed" },
  video: { label: "動画", icon: "bi-play-btn" },
  radio: { label: "ラジオ", icon: "bi-broadcast" }
};

const SELECTOR_CATEGORY_META = [
  {
    id: "official",
    label: "公式サービス",
    note: "ファンクラブ・公式ブログなど",
    icon: "bi-patch-check"
  },
  {
    id: "sns",
    label: "公式SNS",
    note: "公式SNS",
    icon: "bi-share"
  },
  {
    id: "music",
    label: "音楽",
    note: "音楽配信サービス",
    icon: "bi-music-note-beamed"
  },
  {
    id: "video",
    label: "動画",
    note: "動画配信サービス",
    icon: "bi-play-btn"
  },
  {
    id: "radio",
    label: "ラジオ",
    note: "ラジオ配信サービス",
    icon: "bi-broadcast"
  }
];

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
  "family-club-web-blog": "有料ブログを読む",
  "family-club-web-live": "個人生配信を見る",
  "famikura-store-photos": "生写真を購入する",
  "famikura-store-goods": "公式グッズを購入する"
};

const state = {
  data: null,
  selectedPlans: new Map(),
  budget: 0,
  closedServiceCategories: loadClosedServiceCategories(),
  cardFilters: {
    free: { category: "all", feature: "all" },
    additional: { category: "all", feature: "all" },
    paid: { category: "all", feature: "all" }
  },
  serviceInfoPreviousFocus: null
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
  [
    "freeAppsGrid",
    "paidServicesGrid",
    "serviceGroups",
    "selectionCount",
    "resetSelectionButton",
    "showResultButton",
    "budgetSelect",
    "resultSection",
    "resultSummary",
    "resultCards",
    "emptyCurrentResult",
    "additionalSupportSection",
    "additionalSupportCards",
    "additionalBudgetBadge",
    "editSelectionButton",
    "loadingPanel",
    "errorPanel",
    "errorMessage",
    "retryButton",
    "serviceFinderSection",
    "serviceInfoModal",
    "serviceInfoModalTitle",
    "serviceInfoModalBody"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.resetSelectionButton?.addEventListener("click", resetSelection);
  elements.showResultButton?.addEventListener("click", showResults);
  elements.editSelectionButton?.addEventListener("click", () => {
    elements.serviceFinderSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.budgetSelect?.addEventListener("change", handleBudgetChange);
  elements.retryButton?.addEventListener("click", loadData);

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
}

function handleBudgetChange(event) {
  state.budget = Number(event.target.value) || 0;
  localStorage.setItem(BUDGET_STORAGE_KEY, String(state.budget));

  if (!elements.resultSection?.classList.contains("hidden")) {
    renderResults();
  }
}

function handleDocumentClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const serviceInfoButton = target.closest("[data-service-info-button]");
  if (serviceInfoButton) {
    openServiceInfoModal(serviceInfoButton.dataset.serviceId, serviceInfoButton);
    return;
  }

  if (target.closest("[data-service-info-close]")) {
    closeServiceInfoModal();
    return;
  }

  const cardFilterButton = target.closest("[data-card-filter-button]");
  if (cardFilterButton) {
    const type = cardFilterButton.dataset.cardFilterType;
    const group = cardFilterButton.dataset.cardFilterGroup;
    const value = cardFilterButton.dataset.cardFilterValue;

    if (state.cardFilters[type] && ["category", "feature"].includes(group)) {
      state.cardFilters[type][group] = value;
      applyCardFilters(type);
    }
    return;
  }

  const paidFilterButton = target.closest("[data-paid-filter-button]");
  if (paidFilterButton) {
    const group = paidFilterButton.dataset.paidFilterGroup;
    if (["category", "feature"].includes(group)) {
      state.cardFilters.paid[group] = paidFilterButton.dataset.paidFilterValue;
      applyPaidServiceFilters();
    }
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    closeServiceInfoModal();
  }
}

async function loadData() {
  showLoading(true);
  elements.errorPanel?.classList.add("hidden");

  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`services.json: HTTP ${response.status}`);
    }

    const data = await response.json();
    validateServiceData(data);
    state.data = data;

    restoreState();
    removeInvalidSelections();
    renderAllServiceAreas();
    updateSelectionCount();
    showLoading(false);
  } catch (error) {
    console.error(error);
    showLoading(false);
    if (elements.errorMessage) {
      elements.errorMessage.textContent = "サービス情報の取得に失敗しました。通信状況を確認して、もう一度お試しください。";
    }
    elements.errorPanel?.classList.remove("hidden");
  }
}

function validateServiceData(data) {
  if (!data || !Array.isArray(data.services)) {
    throw new Error("services.jsonのservicesが配列ではありません。");
  }

  const serviceIds = new Set();
  const planKeys = new Set();

  data.services.forEach((service) => {
    if (!service?.id || serviceIds.has(service.id)) {
      throw new Error(`サービスIDが不正または重複しています: ${service?.id || "(空)"}`);
    }
    if (!Array.isArray(service.plans)) {
      throw new Error(`plansが配列ではありません: ${service.id}`);
    }

    serviceIds.add(service.id);
    const planIds = new Set();

    service.plans.forEach((plan) => {
      if (!plan?.id || planIds.has(plan.id)) {
        throw new Error(`プランIDが不正または重複しています: ${service.id}/${plan?.id || "(空)"}`);
      }
      planIds.add(plan.id);
      planKeys.add(planKey(service.id, plan.id));
    });
  });

  data.services.forEach((service) => {
    service.plans.forEach((plan) => {
      (plan.includedPlans || []).forEach((included) => {
        if (!planKeys.has(planKey(included.serviceId, included.planId))) {
          throw new Error(`includedPlansの参照先が存在しません: ${service.id}/${plan.id}`);
        }
      });
    });

    (service.requirements?.anyPlans || []).forEach((required) => {
      if (!planKeys.has(planKey(required.serviceId, required.planId))) {
        throw new Error(`requirementsの参照先が存在しません: ${service.id}`);
      }
    });
  });
}

function renderAllServiceAreas() {
  renderFreeApps();
  renderPaidServices();
  renderServiceGroups();
}

function restoreState() {
  state.selectedPlans.clear();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      saved.forEach((item) => {
        if (item?.serviceId && item?.planId) {
          state.selectedPlans.set(item.serviceId, item.planId);
        }
      });
    }
  } catch (error) {
    console.warn("保存済みプランを復元できませんでした。", error);
  }

  state.budget = Number(localStorage.getItem(BUDGET_STORAGE_KEY)) || 0;
  if (elements.budgetSelect) {
    const optionExists = [...elements.budgetSelect.options].some(
      (option) => Number(option.value) === state.budget
    );
    if (!optionExists) state.budget = 0;
    elements.budgetSelect.value = String(state.budget);
  }
}

function saveSelection() {
  const value = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function loadClosedServiceCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(SERVICE_CATEGORY_STATE_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : []);
  } catch (error) {
    console.warn("カテゴリの開閉状態を復元できませんでした。", error);
    return new Set();
  }
}

function saveClosedServiceCategories() {
  localStorage.setItem(
    SERVICE_CATEGORY_STATE_STORAGE_KEY,
    JSON.stringify([...state.closedServiceCategories])
  );
}

function getGlobalServiceCategoryRank(category) {
  const index = GLOBAL_SERVICE_CATEGORY_ORDER.indexOf(category || "other");
  return index === -1 ? GLOBAL_SERVICE_CATEGORY_ORDER.length : index;
}

function compareServices(a, b) {
  const categoryDiff = getGlobalServiceCategoryRank(a?.category) - getGlobalServiceCategoryRank(b?.category);
  if (categoryDiff !== 0) return categoryDiff;
  return Number(a?.displayOrder || 0) - Number(b?.displayOrder || 0);
}

function compareServiceGroups(a, b) {
  return compareServices(a.service, b.service);
}

function getServices() {
  return [...(state.data?.services || [])].sort(compareServices);
}

function getServiceById(serviceId) {
  return (state.data?.services || []).find((service) => service.id === serviceId) || null;
}

function getPlanRecord(serviceId, planId) {
  const service = getServiceById(serviceId);
  const plan = service?.plans?.find((item) => item.id === planId);
  return service && plan ? { service, plan } : null;
}

function getPlanName(serviceId, planId) {
  return getPlanRecord(serviceId, planId)?.plan.name || "対象プラン";
}

function removeInvalidSelections() {
  let changed = false;

  [...state.selectedPlans].forEach(([serviceId, planId]) => {
    if (!getPlanRecord(serviceId, planId)) {
      state.selectedPlans.delete(serviceId);
      changed = true;
    }
  });

  if (removeInvalidConditionalSelections()) changed = true;
  if (changed) saveSelection();
}

function removeInvalidConditionalSelections() {
  let changed = false;
  let removedInPass = true;

  while (removedInPass) {
    removedInPass = false;
    const selectedRefs = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
    const resolvedRefs = resolveIncludedPlans(selectedRefs);

    getServices()
      .filter((service) => service.selectionType === "conditional" && state.selectedPlans.has(service.id))
      .forEach((service) => {
        if (!isServiceRequirementSatisfied(service, resolvedRefs)) {
          state.selectedPlans.delete(service.id);
          removedInPass = true;
          changed = true;
        }
      });
  }

  return changed;
}

function renderFreeApps() {
  const freeItems = getServices()
    .filter((service) => service.selectionType !== "conditional")
    .map((service) => ({
      service,
      plan: (service.plans || []).find((plan) => plan.planType === "free")
    }))
    .filter((item) => Boolean(item.plan));

  elements.freeAppsGrid.innerHTML = freeItems.map(({ service, plan }) => {
    const category = CATEGORY_META[service.category] || { label: service.category || "その他" };
    const features = plan.features || [];

    return `
      <article
        class="free-app-card card-with-fixed-footer filterable-card"
        data-filter-card="free"
        data-filter-category="${escapeAttribute(service.category || "other")}"
        data-filter-features="${escapeAttribute(features.join(" "))}"
      >
        <div class="free-app-top">
          <div>
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.content?.summary || "無料で利用できます。")}</p>
          </div>
          <span class="price-badge">無料</span>
        </div>
        ${renderServiceInfoButton(service)}
        <div class="card-description-spacer" aria-hidden="true"></div>
        <div class="feature-list">${renderFeatureChips(features)}</div>
        <span class="service-category-chip">${escapeHtml(category.label)}</span>
        ${renderAppDownloadLinks(service.id)}
      </article>
    `;
  }).join("");

  renderCardFilterPanel("free", freeItems.map(({ service, plan }) => ({
    category: service.category || "other",
    features: plan.features || []
  })));
}

function renderPaidServices() {
  if (!elements.paidServicesGrid) return;

  const paidServices = getServices()
    .filter((service) => service.selectionType !== "conditional")
    .map((service) => {
      const plans = (service.plans || []).filter((plan) => plan.planType === "paid");
      const features = [...new Set(plans.flatMap((plan) => plan.features || []))];
      return { service, plans, features };
    })
    .filter((item) => item.plans.length > 0);

  elements.paidServicesGrid.innerHTML = paidServices.map(renderPaidServiceCard).join("");
  renderPaidServiceFilterPanel(paidServices);
  applyPaidServiceFilters();
}

function renderPaidServiceCard(item) {
  const { service, features } = item;
  const category = CATEGORY_META[service.category] || { label: service.category || "その他" };
  const sortedPlans = [...item.plans].sort((a, b) => {
    const priceA = getMonthlyPrice(a);
    const priceB = getMonthlyPrice(b);
    return (priceA ?? Number.POSITIVE_INFINITY) - (priceB ?? Number.POSITIVE_INFINITY);
  });

  return `
    <article
      class="paid-service-card card-with-fixed-footer filterable-card"
      data-paid-filter-card
      data-filter-category="${escapeAttribute(service.category || "other")}"
      data-filter-features="${escapeAttribute(features.join(" "))}"
    >
      <div class="paid-service-card-top">
        <div>
          <h3>${escapeHtml(service.name)}</h3>
          <p>${escapeHtml(service.content?.summary || "有料プランを利用できるサービスです。")}</p>
        </div>
        <span class="paid-service-badge">有料</span>
      </div>
      ${renderServiceInfoButton(service)}
      <div class="card-description-spacer" aria-hidden="true"></div>
      <span class="service-category-chip paid-service-category-chip">${escapeHtml(category.label)}</span>
      <div class="paid-service-plans">
        ${sortedPlans.map((plan) => renderPaidServicePlan(service, plan)).join("")}
      </div>
      ${renderAppDownloadLinks(service.id)}
    </article>
  `;
}

function renderPaidServicePlan(service, plan) {
  const features = plan.features || [];
  const includedRefs = resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]);

  return `
    <section
      class="paid-service-plan"
      data-paid-filter-plan
      data-filter-features="${escapeAttribute(features.join(" "))}"
    >
      <div class="paid-service-plan-heading">
        <h4>${escapeHtml(plan.name)}</h4>
        <span>${escapeHtml(formatPlanPrice(plan))}</span>
      </div>
      <div class="feature-list">${renderFeatureChips(features)}</div>
      ${renderIncludedPlanNames(includedRefs)}
      ${plan.priceNote ? `<p class="included-note">${escapeHtml(plan.priceNote)}</p>` : ""}
    </section>
  `;
}

function renderServiceGroups() {
  const selectableServices = getServices().filter((service) => service.showInServiceSelector !== false);
  const grouped = groupBy(selectableServices, (service) => service.category || "other");
  const knownCategoryIds = new Set(SELECTOR_CATEGORY_META.map((category) => category.id));
  const additionalCategories = Object.keys(grouped)
    .filter((categoryId) => !knownCategoryIds.has(categoryId))
    .map((categoryId) => ({
      id: categoryId,
      label: CATEGORY_META[categoryId]?.label || categoryId,
      note: "その他のサービス",
      icon: CATEGORY_META[categoryId]?.icon || "bi-grid"
    }))
    .sort((a, b) => getGlobalServiceCategoryRank(a.id) - getGlobalServiceCategoryRank(b.id));

  const categories = [...SELECTOR_CATEGORY_META, ...additionalCategories];

  elements.serviceGroups.innerHTML = categories.map((category) => {
    const services = grouped[category.id] || [];
    const shouldOpen = !state.closedServiceCategories.has(category.id);

    return `
      <details class="service-category-accordion" data-service-category="${escapeAttribute(category.id)}"${shouldOpen ? " open" : ""}>
        <summary class="service-category-summary">
          <span class="service-category-summary-main">
            <span class="service-category-summary-icon"><i class="bi ${escapeAttribute(category.icon)}" aria-hidden="true"></i></span>
            <span class="service-category-summary-text">
              <strong>${escapeHtml(category.label)}</strong>
              <small>${escapeHtml(category.note)}</small>
            </span>
          </span>
          <span class="service-category-summary-side">
            <span class="service-category-count">${services.length}</span>
            <i class="bi bi-chevron-down service-category-chevron" aria-hidden="true"></i>
          </span>
        </summary>
        <div class="service-category-panel">
          ${services.length
            ? `<div class="service-list">${services.map(renderServiceCard).join("")}</div>`
            : `<p class="service-category-empty">サービス情報は準備中です。</p>`}
        </div>
      </details>
    `;
  }).join("");

  elements.serviceGroups.querySelectorAll("[data-service-category]").forEach((accordion) => {
    accordion.addEventListener("toggle", () => {
      const categoryId = accordion.dataset.serviceCategory;
      if (!categoryId) return;

      if (accordion.open) {
        state.closedServiceCategories.delete(categoryId);
      } else {
        state.closedServiceCategories.add(categoryId);
      }
      saveClosedServiceCategories();
    });
  });

  elements.serviceGroups.querySelectorAll("[data-plan-button]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePlan(button.dataset.serviceId, button.dataset.planId);
    });
  });
}

function renderServiceCard(service) {
  if (service.selectionType === "conditional") {
    return renderConditionalSelectorServiceCard(service);
  }

  const selectedPlanId = state.selectedPlans.get(service.id);
  const plans = (service.plans || []).map((plan) => renderPlanOption(service, plan, selectedPlanId === plan.id, true)).join("");

  return `
    <article class="service-card selector-service-card">
      <div class="service-card-header selector-service-card-header">
        <div class="service-card-title">
          <h4>${escapeHtml(service.name)}</h4>
        </div>
      </div>
      <div class="plan-options">${plans}</div>
    </article>
  `;
}

function renderConditionalSelectorServiceCard(service) {
  const selectedPlanId = state.selectedPlans.get(service.id);
  const currentRefs = resolveIncludedPlans(
    Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }))
  );
  const available = isServiceRequirementSatisfied(service, currentRefs);
  const requirementLabel = service.requirements?.label || "利用条件があります";
  const plans = (service.plans || []).map((plan) => renderPlanOption(
    service,
    plan,
    selectedPlanId === plan.id,
    available,
    available ? "選択できます" : requirementLabel
  )).join("");

  return `
    <article class="service-card selector-service-card conditional-service-card${available ? " available" : ""}">
      <div class="service-card-header selector-service-card-header">
        <div class="service-card-title">
          <h4>${escapeHtml(service.name)}</h4>
        </div>
        <span class="conditional-service-status">${available ? "選択可能" : "条件あり"}</span>
      </div>
      <div class="plan-options">${plans}</div>
    </article>
  `;
}

function renderPlanOption(service, plan, selected, enabled, customPriceLabel = null) {
  const label = customPriceLabel ?? formatPlanPrice(plan);

  return `
    <button
      type="button"
      class="plan-option${selected ? " selected" : ""}"
      data-plan-button
      data-service-id="${escapeAttribute(service.id)}"
      data-plan-id="${escapeAttribute(plan.id)}"
      aria-pressed="${selected}"
      aria-disabled="${enabled ? "false" : "true"}"
      ${enabled ? "" : "disabled"}
    >
      <span class="plan-option-main">
        <span class="plan-option-name">${escapeHtml(plan.name)}</span>
        <span class="plan-option-price">${escapeHtml(label)}</span>
      </span>
      <span class="plan-option-check"><i class="bi bi-check-lg"></i></span>
    </button>
  `;
}

function togglePlan(serviceId, planId) {
  const service = getServiceById(serviceId);
  const isSelected = state.selectedPlans.get(serviceId) === planId;

  if (!isSelected && service?.selectionType === "conditional") {
    const currentRefs = resolveIncludedPlans(
      Array.from(state.selectedPlans, ([selectedServiceId, selectedPlanId]) => ({
        serviceId: selectedServiceId,
        planId: selectedPlanId
      }))
    );

    if (!isServiceRequirementSatisfied(service, currentRefs)) return;
  }

  if (isSelected) {
    state.selectedPlans.delete(serviceId);
  } else {
    state.selectedPlans.set(serviceId, planId);
  }

  removeInvalidConditionalSelections();
  saveSelection();
  renderServiceGroups();
  updateSelectionCount();

  if (!elements.resultSection?.classList.contains("hidden")) {
    renderResults();
  }
}

function resetSelection() {
  state.selectedPlans.clear();
  saveSelection();
  renderServiceGroups();
  updateSelectionCount();
  elements.resultSection?.classList.add("hidden");
  removeCardFilterPanel("additional");
}

function updateSelectionCount() {
  if (elements.selectionCount) {
    elements.selectionCount.textContent = `${state.selectedPlans.size}件`;
  }
}

function showResults() {
  renderResults();
  elements.resultSection?.classList.remove("hidden");
  elements.resultSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResults() {
  if (removeInvalidConditionalSelections()) {
    saveSelection();
    renderServiceGroups();
    updateSelectionCount();
  }

  const selectedRefs = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  const resolvedRefs = resolveIncludedPlans(selectedRefs);
  const serviceItems = groupResultPlansByService(resolvedRefs);

  elements.resultSummary.textContent = serviceItems.length
    ? `${state.selectedPlans.size}件の選択から、${serviceItems.length}サービスでできる応援を確認しました。`
    : "利用中のプランがまだ選択されていません。";

  elements.resultCards.innerHTML = serviceItems.map(renderServiceResultCard).join("");
  elements.emptyCurrentResult.classList.toggle("hidden", serviceItems.length > 0);

  renderAdditionalSupport(resolvedRefs);
}

function groupResultPlansByService(refs) {
  const grouped = new Map();

  refs.forEach((ref) => {
    const record = getPlanRecord(ref.serviceId, ref.planId);
    if (!record) return;

    if (!grouped.has(record.service.id)) {
      grouped.set(record.service.id, {
        service: record.service,
        items: [],
        features: new Set()
      });
    }

    const group = grouped.get(record.service.id);
    group.items.push({ ref, plan: record.plan });
    (record.plan.features || []).forEach((feature) => group.features.add(feature));
  });

  return [...grouped.values()].sort(compareServiceGroups);
}

function renderServiceResultCard(group) {
  const hasSelectedPlan = group.items.some(({ ref }) => ref.source === "selected");
  const planNames = group.items.map(({ ref, plan }) => {
    const status = ref.source === "included" ? "含まれるプラン" : "選択中";
    return `${plan.name}（${status}）`;
  });

  const includedByNames = [...new Set(
    group.items
      .filter(({ ref }) => ref.includedBy)
      .map(({ ref }) => getPlanName(ref.includedBy.serviceId, ref.includedBy.planId))
  )];

  return `
    <article class="result-card service-result-card">
      <div class="result-card-top">
        <div>
          <h4>${escapeHtml(group.service.name)}</h4>
          <p class="additional-plan-name">${planNames.map(escapeHtml).join("<br>")}</p>
          <p class="result-card-summary">${escapeHtml(group.service.content?.summary || "")}</p>
        </div>
        <span class="source-badge">${hasSelectedPlan ? "選択中" : "含まれるサービス"}</span>
      </div>
      ${renderServiceInfoButton(group.service)}
      <div class="feature-list">${renderFeatureChips([...group.features])}</div>
      ${includedByNames.length
        ? `<p class="included-note">${includedByNames.map(escapeHtml).join("、")}に含まれています。</p>`
        : ""}
    </article>
  `;
}

function renderAdditionalSupport(currentRefs) {
  const budget = state.budget;
  const currentKeys = new Set(currentRefs.map((ref) => planKey(ref.serviceId, ref.planId)));
  const currentServiceIds = new Set(currentRefs.map((ref) => ref.serviceId));
  const currentFeatures = new Set(
    currentRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || [])
  );
  const candidates = [];

  getServices().forEach((service) => {
    if (service.selectionType === "conditional") {
      if (currentServiceIds.has(service.id) || !isServiceRequirementSatisfied(service, currentRefs)) return;

      (service.plans || []).forEach((plan) => {
        const key = planKey(service.id, plan.id);
        if (currentKeys.has(key)) return;

        candidates.push({
          service,
          plan,
          monthlyPrice: 0,
          newFeatures: plan.features || [],
          candidateRefs: resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]),
          isFree: true,
          isConditional: true
        });
      });
      return;
    }

    (service.plans || []).forEach((plan) => {
      const key = planKey(service.id, plan.id);

      if (plan.planType === "free") {
        if (currentKeys.has(key) || currentServiceIds.has(service.id)) return;

        candidates.push({
          service,
          plan,
          monthlyPrice: 0,
          newFeatures: plan.features || [],
          candidateRefs: resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]),
          isFree: true,
          isConditional: false
        });
        return;
      }

      if (budget <= 0 || plan.planType !== "paid" || currentKeys.has(key)) return;

      const monthlyPrice = getMonthlyPrice(plan);
      if (monthlyPrice === null || monthlyPrice > budget) return;

      const candidateRefs = resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]);
      const candidateFeatures = new Set(
        candidateRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || [])
      );
      const newFeatures = [...candidateFeatures].filter((feature) => !currentFeatures.has(feature));
      if (!newFeatures.length) return;

      candidates.push({
        service,
        plan,
        monthlyPrice,
        newFeatures,
        candidateRefs,
        isFree: false,
        isConditional: false
      });
    });
  });

  const grouped = new Map();
  candidates.forEach((candidate) => {
    if (!grouped.has(candidate.service.id)) {
      grouped.set(candidate.service.id, {
        service: candidate.service,
        candidates: []
      });
    }
    grouped.get(candidate.service.id).candidates.push(candidate);
  });

  const serviceGroups = [...grouped.values()]
    .map((group) => ({
      ...group,
      minimumPrice: Math.min(...group.candidates.map((candidate) => candidate.monthlyPrice)),
      features: [...new Set(group.candidates.flatMap((candidate) => candidate.newFeatures || []))]
    }))
    .sort((a, b) => a.minimumPrice - b.minimumPrice || compareServices(a.service, b.service));

  if (!serviceGroups.length) {
    elements.additionalSupportSection.classList.add("hidden");
    elements.additionalSupportCards.innerHTML = "";
    removeCardFilterPanel("additional");
    return;
  }

  elements.additionalBudgetBadge.textContent = budget === 0
    ? "追加料金なし"
    : `＋${budget.toLocaleString("ja-JP")}円まで`;

  elements.additionalSupportCards.innerHTML = serviceGroups.map((group) => {
    const category = CATEGORY_META[group.service.category] || { label: group.service.category || "その他" };
    const allFree = group.candidates.every((candidate) => candidate.isFree);

    return `
      <article
        class="result-card additional-support-card card-with-fixed-footer filterable-card"
        data-filter-card="additional"
        data-filter-category="${escapeAttribute(group.service.category || "other")}"
        data-filter-features="${escapeAttribute(group.features.join(" "))}"
      >
        <div class="result-card-top">
          <div>
            <h4 class="additional-service-name">${escapeHtml(group.service.name)}</h4>
            <p class="result-card-summary">${allFree
              ? "まだ選んでいない、追加料金なしで始められる応援です。"
              : "無料で始められる応援と、予算内で増やせる応援があります。"}</p>
          </div>
          <span class="source-badge">${allFree ? "無料" : "追加候補"}</span>
        </div>
        ${renderServiceInfoButton(group.service)}
        <div class="card-description-spacer" aria-hidden="true"></div>
        <span class="service-category-chip additional-category-chip">${escapeHtml(category.label)}</span>
        <div class="service-plan-candidates">
          ${group.candidates
            .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
            .map((candidate) => `
              <section
                class="service-plan-candidate"
                data-filter-plan-candidate
                data-filter-features="${escapeAttribute((candidate.newFeatures || []).join(" "))}"
              >
                <p class="additional-plan-name">${escapeHtml(candidate.plan.name)}</p>
                <p class="additional-price">${candidate.isFree
                  ? "追加料金なし"
                  : formatAdditionalPrice(candidate.plan, candidate.monthlyPrice)}</p>
                ${candidate.isConditional && group.service.requirements?.label
                  ? `<p class="included-note">${escapeHtml(group.service.requirements.label)}</p>`
                  : ""}
                <div class="feature-list">${renderFeatureChips(candidate.newFeatures)}</div>
                ${renderIncludedPlanNames(candidate.candidateRefs)}
                ${candidate.plan.priceNote ? `<p class="included-note">${escapeHtml(candidate.plan.priceNote)}</p>` : ""}
              </section>
            `).join("")}
        </div>
        ${renderAppDownloadLinks(group.service.id)}
      </article>
    `;
  }).join("");

  elements.additionalSupportSection.classList.remove("hidden");
  renderCardFilterPanel("additional", serviceGroups.map((group) => ({
    category: group.service.category || "other",
    features: group.features
  })));
}

function getAvailablePlanKeySet(refs) {
  return new Set((refs || []).map((ref) => planKey(ref.serviceId, ref.planId)));
}

function isServiceRequirementSatisfied(service, refs) {
  const anyPlans = service.requirements?.anyPlans || [];
  if (!anyPlans.length) return true;
  const availableKeys = getAvailablePlanKeySet(refs);
  return anyPlans.some((required) => availableKeys.has(planKey(required.serviceId, required.planId)));
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

    (record.plan.includedPlans || []).forEach((included) => {
      queue.push({
        serviceId: included.serviceId,
        planId: included.planId,
        source: "included",
        includedBy: { serviceId: ref.serviceId, planId: ref.planId }
      });
    });
  }

  return result;
}

function getMonthlyPrice(plan) {
  const options = plan.billingOptions || [];
  const monthly = options.find((option) => option.cycle === "monthly" && Number.isFinite(option.amount));
  if (monthly) return Number(monthly.amount);

  const yearly = options.find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  if (yearly) return Math.ceil(Number(yearly.amount) / 12);

  return null;
}

function formatPlanPrice(plan) {
  if (plan.planType === "free") return "無料";
  const options = plan.billingOptions || [];
  const monthly = options.find((option) => option.cycle === "monthly" && Number.isFinite(option.amount));
  if (monthly) return `月額${Number(monthly.amount).toLocaleString("ja-JP")}円`;
  const yearly = options.find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  if (yearly) return `年額${Number(yearly.amount).toLocaleString("ja-JP")}円`;
  return "料金は公式情報を確認";
}

function formatAdditionalPrice(plan, monthlyPrice) {
  const options = plan.billingOptions || [];
  const monthly = options.find((option) => option.cycle === "monthly" && Number.isFinite(option.amount));
  if (monthly) return `月額＋${Number(monthly.amount).toLocaleString("ja-JP")}円`;
  const yearly = options.find((option) => option.cycle === "yearly" && Number.isFinite(option.amount));
  if (yearly) {
    return `年額${Number(yearly.amount).toLocaleString("ja-JP")}円（月あたり約${monthlyPrice.toLocaleString("ja-JP")}円）`;
  }
  return "料金は公式情報を確認";
}

function renderIncludedPlanNames(refs) {
  const included = refs.filter((ref) => ref.source === "included");
  if (!included.length) return "";
  const names = [...new Set(included.map((ref) => getPlanName(ref.serviceId, ref.planId)))];
  return `<p class="included-note">${escapeHtml(names.join("、"))}も含まれます。</p>`;
}

function renderFeatureChips(features) {
  const unique = [...new Set(features)];
  if (!unique.length) {
    return `<span class="feature-chip"><i class="bi bi-check-circle"></i>利用できる応援を確認中</span>`;
  }

  return unique.map((feature) => `
    <span class="feature-chip"><i class="bi bi-check-circle"></i>${escapeHtml(FEATURE_LABELS[feature] || feature)}</span>
  `).join("");
}

function renderServiceInfoButton(service) {
  const sections = service.content?.sections || [];
  if (!sections.length) return "";

  return `
    <button
      type="button"
      class="service-info-button"
      data-service-info-button
      data-service-id="${escapeAttribute(service.id)}"
    >
      <i class="bi bi-info-circle" aria-hidden="true"></i>
      <span>このサービスについて</span>
    </button>
  `;
}

function renderAppDownloadLinks(serviceId) {
  const links = getServiceById(serviceId)?.downloadLinks || {};
  const items = [];

  if (links.ios) {
    items.push(`
      <a class="app-store-link" href="${escapeAttribute(links.ios)}" target="_blank" rel="noopener noreferrer" aria-label="App Storeでダウンロード">
        <i class="bi bi-apple" aria-hidden="true"></i>
        <span>iPhone</span>
      </a>
    `);
  }

  if (links.android) {
    items.push(`
      <a class="app-store-link" href="${escapeAttribute(links.android)}" target="_blank" rel="noopener noreferrer" aria-label="Google Playでダウンロード">
        <i class="bi bi-google-play" aria-hidden="true"></i>
        <span>Android</span>
      </a>
    `);
  }

  return items.length ? `<div class="app-download-links card-download-footer">${items.join("")}</div>` : "";
}

function buildServiceInfoModalBody(service) {
  const sections = service.content?.sections || [];
  if (!sections.length) {
    return `<p>${escapeHtml(service.content?.summary || "説明は準備中です。")}</p>`;
  }

  return sections.map((section) => `
    <section class="service-info-modal-section">
      ${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ""}
      ${sanitizeHtml(section.bodyHtml || "")}
    </section>
  `).join("");
}

function openServiceInfoModal(serviceId, triggerElement) {
  const service = getServiceById(serviceId);
  if (!service || !elements.serviceInfoModal || !elements.serviceInfoModalTitle || !elements.serviceInfoModalBody) return;

  state.serviceInfoPreviousFocus = triggerElement || document.activeElement;
  elements.serviceInfoModalTitle.textContent = `${service.name}について`;
  elements.serviceInfoModalBody.innerHTML = buildServiceInfoModalBody(service);
  elements.serviceInfoModal.classList.remove("hidden");
  elements.serviceInfoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("service-info-modal-open");

  const closeButton = elements.serviceInfoModal.querySelector(".service-info-modal-close");
  window.requestAnimationFrame(() => closeButton?.focus());
}

function closeServiceInfoModal() {
  if (!elements.serviceInfoModal || elements.serviceInfoModal.classList.contains("hidden")) return;

  elements.serviceInfoModal.classList.add("hidden");
  elements.serviceInfoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("service-info-modal-open");
  state.serviceInfoPreviousFocus?.focus?.();
  state.serviceInfoPreviousFocus = null;
}

function ensureCardFilterPanel(type) {
  const grid = type === "free" ? elements.freeAppsGrid : elements.additionalSupportCards;
  if (!grid) return null;

  let panel = document.querySelector(`[data-card-filter-panel="${type}"]`);
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "card-filter-panel";
    panel.dataset.cardFilterPanel = type;
    panel.innerHTML = `
      <div class="card-filter-row">
        <p class="card-filter-label">カテゴリ</p>
        <div class="card-filter-options" data-card-filter-options="category"></div>
      </div>
      <div class="card-filter-row">
        <p class="card-filter-label">できる応援</p>
        <div class="card-filter-options" data-card-filter-options="feature"></div>
      </div>
    `;
    grid.before(panel);
  }

  let empty = document.querySelector(`[data-card-filter-empty="${type}"]`);
  if (!empty) {
    empty = document.createElement("div");
    empty.className = "card-filter-empty hidden";
    empty.dataset.cardFilterEmpty = type;
    empty.innerHTML = `<i class="bi bi-search" aria-hidden="true"></i><p>条件に合うサービスがありません。</p>`;
    grid.after(empty);
  }

  return panel;
}

function removeCardFilterPanel(type) {
  document.querySelector(`[data-card-filter-panel="${type}"]`)?.remove();
  document.querySelector(`[data-card-filter-empty="${type}"]`)?.remove();
}

function renderCardFilterPanel(type, items) {
  const panel = ensureCardFilterPanel(type);
  if (!panel) return;

  const categories = sortCategoryValues([...new Set(items.map((item) => item.category).filter(Boolean))]);
  const features = [...new Set(items.flatMap((item) => item.features || []))];
  const filterState = state.cardFilters[type];

  if (!categories.includes(filterState.category)) filterState.category = "all";
  if (!features.includes(filterState.feature)) filterState.feature = "all";

  const categoryContainer = panel.querySelector('[data-card-filter-options="category"]');
  const featureContainer = panel.querySelector('[data-card-filter-options="feature"]');

  categoryContainer.innerHTML = renderCardFilterButtons(
    type,
    "category",
    categories.map((value) => ({ value, label: CATEGORY_META[value]?.label || value })),
    filterState.category
  );

  featureContainer.innerHTML = renderCardFilterButtons(
    type,
    "feature",
    features
      .map((value) => ({ value, label: FEATURE_LABELS[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    filterState.feature
  );

  applyCardFilters(type);
}

function renderCardFilterButtons(type, group, options, selectedValue) {
  return [
    { value: "all", label: "すべて" },
    ...options
  ].map((option) => `
    <button
      type="button"
      class="card-filter-button${selectedValue === option.value ? " active" : ""}"
      data-card-filter-button
      data-card-filter-type="${escapeAttribute(type)}"
      data-card-filter-group="${escapeAttribute(group)}"
      data-card-filter-value="${escapeAttribute(option.value)}"
      aria-pressed="${selectedValue === option.value}"
    >${escapeHtml(option.label)}</button>
  `).join("");
}

function applyCardFilters(type) {
  const filterState = state.cardFilters[type];
  const grid = type === "free" ? elements.freeAppsGrid : elements.additionalSupportCards;
  if (!filterState || !grid) return;

  let visibleCount = 0;

  grid.querySelectorAll(`[data-filter-card="${type}"]`).forEach((card) => {
    const categoryMatches = filterState.category === "all"
      || card.dataset.filterCategory === filterState.category;
    const cardFeatures = splitDataValues(card.dataset.filterFeatures);
    const featureMatches = filterState.feature === "all"
      || cardFeatures.includes(filterState.feature);
    const visible = categoryMatches && featureMatches;

    card.classList.toggle("filter-hidden", !visible);

    if (type === "additional") {
      card.querySelectorAll("[data-filter-plan-candidate]").forEach((candidate) => {
        const candidateFeatures = splitDataValues(candidate.dataset.filterFeatures);
        const candidateVisible = filterState.feature === "all"
          || candidateFeatures.includes(filterState.feature);
        candidate.classList.toggle("filter-hidden", !candidateVisible);
      });
    }

    if (visible) visibleCount += 1;
  });

  document.querySelector(`[data-card-filter-empty="${type}"]`)
    ?.classList.toggle("hidden", visibleCount > 0);

  document.querySelectorAll(`[data-card-filter-button][data-card-filter-type="${type}"]`).forEach((button) => {
    const selected = filterState[button.dataset.cardFilterGroup] === button.dataset.cardFilterValue;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderPaidServiceFilterPanel(items) {
  const panel = document.querySelector("[data-paid-service-filter-panel]");
  const empty = document.querySelector("[data-paid-service-filter-empty]");
  if (!panel || !empty) return;

  const categories = sortCategoryValues([...new Set(items.map((item) => item.service.category || "other"))]);
  const features = [...new Set(items.flatMap((item) => item.features || []))];
  const filterState = state.cardFilters.paid;

  if (!categories.includes(filterState.category)) filterState.category = "all";
  if (!features.includes(filterState.feature)) filterState.feature = "all";

  const categoryOptions = panel.querySelector('[data-paid-filter-options="category"]');
  const featureOptions = panel.querySelector('[data-paid-filter-options="feature"]');

  categoryOptions.innerHTML = renderPaidFilterButtons(
    "category",
    categories.map((value) => ({ value, label: CATEGORY_META[value]?.label || value })),
    filterState.category
  );

  featureOptions.innerHTML = renderPaidFilterButtons(
    "feature",
    features
      .map((value) => ({ value, label: FEATURE_LABELS[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    filterState.feature
  );

  panel.classList.toggle("hidden", items.length === 0);
  empty.classList.add("hidden");
}

function renderPaidFilterButtons(group, options, selectedValue) {
  return [
    { value: "all", label: "すべて" },
    ...options
  ].map((option) => `
    <button
      type="button"
      class="card-filter-button${selectedValue === option.value ? " active" : ""}"
      data-paid-filter-button
      data-paid-filter-group="${escapeAttribute(group)}"
      data-paid-filter-value="${escapeAttribute(option.value)}"
      aria-pressed="${selectedValue === option.value}"
    >${escapeHtml(option.label)}</button>
  `).join("");
}

function applyPaidServiceFilters() {
  const empty = document.querySelector("[data-paid-service-filter-empty]");
  if (!elements.paidServicesGrid || !empty) return;

  const filterState = state.cardFilters.paid;
  let visibleCount = 0;

  elements.paidServicesGrid.querySelectorAll("[data-paid-filter-card]").forEach((card) => {
    const categoryMatches = filterState.category === "all"
      || card.dataset.filterCategory === filterState.category;
    const cardFeatures = splitDataValues(card.dataset.filterFeatures);
    const featureMatches = filterState.feature === "all"
      || cardFeatures.includes(filterState.feature);
    const visible = categoryMatches && featureMatches;

    card.classList.toggle("filter-hidden", !visible);

    card.querySelectorAll("[data-paid-filter-plan]").forEach((plan) => {
      const planFeatures = splitDataValues(plan.dataset.filterFeatures);
      const planVisible = filterState.feature === "all"
        || planFeatures.includes(filterState.feature);
      plan.classList.toggle("filter-hidden", !planVisible);
    });

    if (visible) visibleCount += 1;
  });

  empty.classList.toggle("hidden", visibleCount > 0);

  document.querySelectorAll("[data-paid-filter-button]").forEach((button) => {
    const selected = filterState[button.dataset.paidFilterGroup] === button.dataset.paidFilterValue;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function sortCategoryValues(values) {
  return [...values].sort((a, b) => {
    const rankDiff = getGlobalServiceCategoryRank(a) - getGlobalServiceCategoryRank(b);
    return rankDiff !== 0 ? rankDiff : String(a).localeCompare(String(b), "ja");
  });
}

function splitDataValues(value) {
  return String(value || "").split(/\s+/).filter(Boolean);
}

function setupStickyToc() {
  const links = [...document.querySelectorAll(".page-toc-link")];
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const targets = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const activeHref = `#${visible.target.id}`;
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === activeHref);
    });
  }, {
    rootMargin: "-72px 0px -65% 0px",
    threshold: [0.05, 0.25, 0.5]
  });

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
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    [...node.attributes].forEach((attribute) => {
      if (node.tagName === "SPAN" && attribute.name === "class") {
        const validClasses = attribute.value.split(/\s+/).filter((className) => allowedClasses.has(className));
        if (validClasses.length) {
          node.setAttribute("class", validClasses.join(" "));
        } else {
          node.removeAttribute("class");
        }
      } else {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return template.innerHTML;
}

function groupBy(items, keyGetter) {
  return items.reduce((groups, item) => {
    const key = keyGetter(item);
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}

function planKey(serviceId, planId) {
  return `${serviceId}::${planId}`;
}

function showLoading(visible) {
  elements.loadingPanel?.classList.toggle("hidden", !visible);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
