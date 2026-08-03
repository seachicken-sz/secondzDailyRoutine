"use strict";

renderConditionalSelectorServiceCard = function renderSelectableConditionalServiceCard(service) {
  const selectedPlanId = state.selectedPlans.get(service.id);
  const currentRefs = resolveIncludedPlans(
    Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }))
  );
  const available = isServiceRequirementSatisfied(service, currentRefs);
  const requirementLabel = service.requirements?.label || "利用条件があります";

  const plans = (service.plans || []).map((plan) => {
    const selected = selectedPlanId === plan.id;

    return `
      <button
        type="button"
        class="plan-option${selected ? " selected" : ""}"
        data-plan-button
        data-service-id="${escapeAttribute(service.id)}"
        data-plan-id="${escapeAttribute(plan.id)}"
        aria-pressed="${selected}"
        aria-disabled="${available ? "false" : "true"}"
        ${available ? "" : "disabled"}
      >
        <span class="plan-option-main">
          <span class="plan-option-name">${escapeHtml(plan.name)}</span>
          <span class="plan-option-price">${available ? "選択できます" : escapeHtml(requirementLabel)}</span>
        </span>
        <span class="plan-option-check"><i class="bi bi-check-lg"></i></span>
      </button>
    `;
  }).join("");

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
};

togglePlan = function togglePlanWithConditionalValidation(serviceId, planId) {
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
};

function removeInvalidConditionalSelections() {
  const selectedRefs = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  const resolvedRefs = resolveIncludedPlans(selectedRefs);

  getServices()
    .filter((service) => service.selectionType === "conditional" && state.selectedPlans.has(service.id))
    .forEach((service) => {
      if (!isServiceRequirementSatisfied(service, resolvedRefs)) {
        state.selectedPlans.delete(service.id);
      }
    });
}

renderResults = function renderResultsByService() {
  removeInvalidConditionalSelections();
  saveSelection();

  const selectedRefs = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  const resolvedRefs = resolveIncludedPlans(selectedRefs);
  const serviceItems = groupResultPlansByService(resolvedRefs);

  elements.resultSummary.textContent = serviceItems.length
    ? `${state.selectedPlans.size}件の選択から、${serviceItems.length}サービスでできる応援を確認しました。`
    : "利用中のプランがまだ選択されていません。";

  elements.resultCards.innerHTML = serviceItems.map(renderServiceResultCard).join("");
  elements.emptyCurrentResult.classList.toggle("hidden", serviceItems.length > 0);

  renderAdditionalSupport(resolvedRefs);
};

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

  return [...grouped.values()].sort(
    (a, b) => (a.service.displayOrder || 0) - (b.service.displayOrder || 0)
  );
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

renderAdditionalSupport = function renderAdditionalSupportByService(currentRefs) {
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
      minimumPrice: Math.min(...group.candidates.map((candidate) => candidate.monthlyPrice))
    }))
    .sort((a, b) => a.minimumPrice - b.minimumPrice || (a.service.displayOrder || 0) - (b.service.displayOrder || 0));

  if (!serviceGroups.length) {
    elements.additionalSupportSection.classList.add("hidden");
    elements.additionalSupportCards.innerHTML = "";
    return;
  }

  elements.additionalBudgetBadge.textContent = budget === 0
    ? "追加料金なし"
    : `＋${budget.toLocaleString("ja-JP")}円まで`;

  elements.additionalSupportCards.innerHTML = serviceGroups.map((group) => `
    <article class="result-card additional-support-card card-with-fixed-footer">
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
      <div class="service-plan-candidates">
        ${group.candidates
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
          .map((candidate) => `
            <section class="service-plan-candidate">
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
  `).join("");

  elements.additionalSupportSection.classList.remove("hidden");
};

const SERVICE_CATEGORY_STATE_STORAGE_KEY = "tamugotoStartGuideClosedServiceCategories";
let closedServiceCategories = loadClosedServiceCategories();

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
    JSON.stringify([...closedServiceCategories])
  );
}

renderServiceGroups = function renderPersistentOpenServiceGroups() {
  const selectableServices = getServices().filter((service) => service.showInServiceSelector !== false);
  const grouped = groupBy(selectableServices, (service) => service.category || "other");
  const knownCategoryIds = new Set(SELECTOR_CATEGORY_META.map((category) => category.id));
  const additionalCategories = Object.keys(grouped)
    .filter((categoryId) => !knownCategoryIds.has(categoryId))
    .map((categoryId) => ({
      id: categoryId,
      label: categoryId,
      note: "その他のサービス",
      icon: "bi-grid"
    }));

  const categories = [...SELECTOR_CATEGORY_META, ...additionalCategories];

  elements.serviceGroups.innerHTML = categories.map((category) => {
    const services = grouped[category.id] || [];
    const shouldOpen = !closedServiceCategories.has(category.id);

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
        closedServiceCategories.delete(categoryId);
      } else {
        closedServiceCategories.add(categoryId);
      }
      saveClosedServiceCategories();
    });
  });

  elements.serviceGroups.querySelectorAll("[data-plan-button]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePlan(button.dataset.serviceId, button.dataset.planId);
    });
  });
};
