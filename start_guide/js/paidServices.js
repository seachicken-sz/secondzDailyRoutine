"use strict";

const PAID_SERVICE_FILTER_STATE = {
  category: "all",
  feature: "all"
};

const renderFreeAppsWithoutPaidServices = renderFreeApps;
renderFreeApps = function renderFreeAndPaidServices() {
  renderFreeAppsWithoutPaidServices();
  renderPaidServices();
};

function renderPaidServices() {
  const grid = document.getElementById("paidServicesGrid");
  if (!grid) return;

  const paidServices = getServices()
    .filter((service) => service.selectionType !== "conditional")
    .map((service) => {
      const plans = (service.plans || []).filter((plan) => plan.planType === "paid");
      const features = [...new Set(plans.flatMap((plan) => plan.features || []))];
      return { service, plans, features };
    })
    .filter((item) => item.plans.length > 0);

  grid.innerHTML = paidServices.map(renderPaidServiceCard).join("");
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
    </section>
  `;
}

function renderPaidServiceFilterPanel(items) {
  const grid = document.getElementById("paidServicesGrid");
  if (!grid) return;

  const panel = document.querySelector('[data-paid-service-filter-panel]');
  const empty = document.querySelector('[data-paid-service-filter-empty]');
  if (!panel || !empty) return;

  const categories = [...new Set(items.map((item) => item.service.category || "other"))];
  const features = [...new Set(items.flatMap((item) => item.features || []))];

  if (!categories.includes(PAID_SERVICE_FILTER_STATE.category)) {
    PAID_SERVICE_FILTER_STATE.category = "all";
  }
  if (!features.includes(PAID_SERVICE_FILTER_STATE.feature)) {
    PAID_SERVICE_FILTER_STATE.feature = "all";
  }

  const categoryOptions = panel.querySelector('[data-paid-filter-options="category"]');
  const featureOptions = panel.querySelector('[data-paid-filter-options="feature"]');

  categoryOptions.innerHTML = renderPaidFilterButtons(
    "category",
    categories.map((value) => ({
      value,
      label: CATEGORY_META[value]?.label || value
    })),
    PAID_SERVICE_FILTER_STATE.category
  );

  featureOptions.innerHTML = renderPaidFilterButtons(
    "feature",
    features
      .map((value) => ({ value, label: FEATURE_LABELS[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    PAID_SERVICE_FILTER_STATE.feature
  );

  panel.classList.toggle("hidden", items.length === 0);
  empty.classList.add("hidden");
}

function renderPaidFilterButtons(group, options, selectedValue) {
  const allButton = renderPaidFilterButton(group, "all", "すべて", selectedValue === "all");
  return allButton + options.map((option) =>
    renderPaidFilterButton(group, option.value, option.label, selectedValue === option.value)
  ).join("");
}

function renderPaidFilterButton(group, value, label, selected) {
  return `
    <button
      type="button"
      class="card-filter-button${selected ? " active" : ""}"
      data-paid-filter-button
      data-paid-filter-group="${escapeAttribute(group)}"
      data-paid-filter-value="${escapeAttribute(value)}"
      aria-pressed="${selected}"
    >${escapeHtml(label)}</button>
  `;
}

function applyPaidServiceFilters() {
  const grid = document.getElementById("paidServicesGrid");
  const empty = document.querySelector('[data-paid-service-filter-empty]');
  if (!grid || !empty) return;

  let visibleCount = 0;

  grid.querySelectorAll("[data-paid-filter-card]").forEach((card) => {
    const categoryMatches = PAID_SERVICE_FILTER_STATE.category === "all"
      || card.dataset.filterCategory === PAID_SERVICE_FILTER_STATE.category;
    const cardFeatures = (card.dataset.filterFeatures || "").split(/\s+/).filter(Boolean);
    const featureMatches = PAID_SERVICE_FILTER_STATE.feature === "all"
      || cardFeatures.includes(PAID_SERVICE_FILTER_STATE.feature);
    const visible = categoryMatches && featureMatches;

    card.classList.toggle("filter-hidden", !visible);

    card.querySelectorAll("[data-paid-filter-plan]").forEach((plan) => {
      const planFeatures = (plan.dataset.filterFeatures || "").split(/\s+/).filter(Boolean);
      const planVisible = PAID_SERVICE_FILTER_STATE.feature === "all"
        || planFeatures.includes(PAID_SERVICE_FILTER_STATE.feature);
      plan.classList.toggle("filter-hidden", !planVisible);
    });

    if (visible) visibleCount += 1;
  });

  empty.classList.toggle("hidden", visibleCount > 0);

  document.querySelectorAll("[data-paid-filter-button]").forEach((button) => {
    const selected = PAID_SERVICE_FILTER_STATE[button.dataset.paidFilterGroup]
      === button.dataset.paidFilterValue;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setupPaidServiceFilters() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-paid-filter-button]");
    if (!button) return;

    const group = button.dataset.paidFilterGroup;
    if (!["category", "feature"].includes(group)) return;

    PAID_SERVICE_FILTER_STATE[group] = button.dataset.paidFilterValue;
    applyPaidServiceFilters();
  });
}

document.addEventListener("DOMContentLoaded", setupPaidServiceFilters);
