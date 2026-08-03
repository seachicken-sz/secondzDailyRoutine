"use strict";

const CARD_FILTER_STATE = {
  free: { category: "all", feature: "all" },
  additional: { category: "all", feature: "all" }
};

renderFreeApps = function renderFreeAppsWithFilters() {
  const freeItems = [];

  getServices().forEach((service) => {
    const freePlan = (service.plans || []).find((plan) => plan.planType === "free");
    if (freePlan) {
      freeItems.push({ service, plan: freePlan });
    }
  });

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
};

renderAdditionalSupport = function renderAdditionalSupportWithFilters(currentRefs) {
  const budget = state.budget;
  const currentKeys = new Set(currentRefs.map((ref) => planKey(ref.serviceId, ref.planId)));
  const currentServiceIds = new Set(currentRefs.map((ref) => ref.serviceId));
  const currentFeatures = new Set(
    currentRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || [])
  );
  const candidates = [];

  getServices().forEach((service) => {
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
          isFree: true
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

      candidates.push({ service, plan, monthlyPrice, newFeatures, candidateRefs, isFree: false });
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
    .sort((a, b) => a.minimumPrice - b.minimumPrice || (a.service.displayOrder || 0) - (b.service.displayOrder || 0));

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
            <p class="result-card-summary">${group.candidates.every((candidate) => candidate.isFree)
              ? "まだ選んでいない、追加料金なしで始められる応援です。"
              : "無料で始められる応援と、予算内で増やせる応援があります。"}</p>
          </div>
          <span class="source-badge">${group.candidates.every((candidate) => candidate.isFree) ? "無料" : "追加候補"}</span>
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
                  : `月額＋${candidate.monthlyPrice.toLocaleString("ja-JP")}円`}</p>
                <div class="feature-list">${renderFeatureChips(candidate.newFeatures)}</div>
                ${renderIncludedPlanNames(candidate.candidateRefs)}
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
};

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

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const features = [...new Set(items.flatMap((item) => item.features || []))];

  if (!categories.includes(CARD_FILTER_STATE[type].category)) {
    CARD_FILTER_STATE[type].category = "all";
  }
  if (!features.includes(CARD_FILTER_STATE[type].feature)) {
    CARD_FILTER_STATE[type].feature = "all";
  }

  const categoryContainer = panel.querySelector('[data-card-filter-options="category"]');
  const featureContainer = panel.querySelector('[data-card-filter-options="feature"]');

  categoryContainer.innerHTML = renderCardFilterButtons(
    type,
    "category",
    categories.map((value) => ({
      value,
      label: CATEGORY_META[value]?.label || value
    })),
    CARD_FILTER_STATE[type].category
  );

  featureContainer.innerHTML = renderCardFilterButtons(
    type,
    "feature",
    features
      .map((value) => ({ value, label: FEATURE_LABELS[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    CARD_FILTER_STATE[type].feature
  );

  applyCardFilters(type);
}

function renderCardFilterButtons(type, group, options, selectedValue) {
  const allButton = renderCardFilterButton(type, group, "all", "すべて", selectedValue === "all");
  const optionButtons = options.map((option) =>
    renderCardFilterButton(type, group, option.value, option.label, selectedValue === option.value)
  ).join("");
  return allButton + optionButtons;
}

function renderCardFilterButton(type, group, value, label, selected) {
  return `
    <button
      type="button"
      class="card-filter-button${selected ? " active" : ""}"
      data-card-filter-button
      data-card-filter-type="${escapeAttribute(type)}"
      data-card-filter-group="${escapeAttribute(group)}"
      data-card-filter-value="${escapeAttribute(value)}"
      aria-pressed="${selected}"
    >${escapeHtml(label)}</button>
  `;
}

function applyCardFilters(type) {
  const stateValue = CARD_FILTER_STATE[type];
  const grid = type === "free" ? elements.freeAppsGrid : elements.additionalSupportCards;
  if (!grid) return;

  let visibleCount = 0;

  grid.querySelectorAll(`[data-filter-card="${type}"]`).forEach((card) => {
    const categoryMatches = stateValue.category === "all"
      || card.dataset.filterCategory === stateValue.category;
    const cardFeatures = (card.dataset.filterFeatures || "").split(/\s+/).filter(Boolean);
    const featureMatches = stateValue.feature === "all"
      || cardFeatures.includes(stateValue.feature);
    const visible = categoryMatches && featureMatches;

    card.classList.toggle("filter-hidden", !visible);

    if (type === "additional") {
      card.querySelectorAll("[data-filter-plan-candidate]").forEach((candidate) => {
        const candidateFeatures = (candidate.dataset.filterFeatures || "").split(/\s+/).filter(Boolean);
        const candidateVisible = stateValue.feature === "all"
          || candidateFeatures.includes(stateValue.feature);
        candidate.classList.toggle("filter-hidden", !candidateVisible);
      });
    }

    if (visible) visibleCount += 1;
  });

  document.querySelector(`[data-card-filter-empty="${type}"]`)
    ?.classList.toggle("hidden", visibleCount > 0);

  document.querySelectorAll(`[data-card-filter-button][data-card-filter-type="${type}"]`).forEach((button) => {
    const selected = stateValue[button.dataset.cardFilterGroup] === button.dataset.cardFilterValue;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setupCardFilterEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-card-filter-button]");
    if (!button) return;

    const type = button.dataset.cardFilterType;
    const group = button.dataset.cardFilterGroup;
    const value = button.dataset.cardFilterValue;
    if (!CARD_FILTER_STATE[type] || !["category", "feature"].includes(group)) return;

    CARD_FILTER_STATE[type][group] = value;
    applyCardFilters(type);
  });
}

document.addEventListener("DOMContentLoaded", setupCardFilterEvents);
