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
      <div class="feature-list">${renderFeatureChips([...group.features])}</div>
      ${includedByNames.length
        ? `<p class="included-note">${includedByNames.map(escapeHtml).join("、")}に含まれています。</p>`
        : ""}
    </article>
  `;
}
