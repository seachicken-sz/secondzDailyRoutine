"use strict";

renderResults = function renderResultsByService() {
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
  const hasSelectedPlan = group.items.some(({ ref }) => ref.source !== "included");
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
                : `月額＋${candidate.monthlyPrice.toLocaleString("ja-JP")}円`}</p>
              <div class="feature-list">${renderFeatureChips(candidate.newFeatures)}</div>
              ${renderIncludedPlanNames(candidate.candidateRefs)}
            </section>
          `).join("")}
      </div>
      ${renderAppDownloadLinks(group.service.id)}
    </article>
  `).join("");

  elements.additionalSupportSection.classList.remove("hidden");
};
