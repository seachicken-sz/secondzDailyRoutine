"use strict";

const GLOBAL_SERVICE_CATEGORY_ORDER = ["official", "sns", "music", "video", "radio"];

function getGlobalServiceCategoryRank(category) {
  const index = GLOBAL_SERVICE_CATEGORY_ORDER.indexOf(category || "other");
  return index === -1 ? GLOBAL_SERVICE_CATEGORY_ORDER.length : index;
}

function compareByGlobalServiceCategory(a, b) {
  const categoryA = a?.service?.category || a?.category || "other";
  const categoryB = b?.service?.category || b?.category || "other";
  const categoryDiff = getGlobalServiceCategoryRank(categoryA) - getGlobalServiceCategoryRank(categoryB);
  if (categoryDiff !== 0) return categoryDiff;

  const orderA = Number(a?.service?.displayOrder ?? a?.displayOrder ?? 0);
  const orderB = Number(b?.service?.displayOrder ?? b?.displayOrder ?? 0);
  return orderA - orderB;
}

function applyGlobalCategoryLabels() {
  const snsSelectorMeta = SELECTOR_CATEGORY_META.find((category) => category.id === "sns");
  if (snsSelectorMeta) {
    snsSelectorMeta.label = "公式SNS";
    snsSelectorMeta.note = "公式SNS";
  }

  SELECTOR_CATEGORY_META.sort(
    (a, b) => getGlobalServiceCategoryRank(a.id) - getGlobalServiceCategoryRank(b.id)
  );

  CATEGORY_META.sns = {
    ...(CATEGORY_META.sns || {}),
    label: "公式SNS",
    icon: CATEGORY_META.sns?.icon || "bi-share"
  };
}

function sortRenderedCategoryCards(container, selector) {
  if (!container) return;

  const cards = [...container.querySelectorAll(selector)].map((card, index) => ({
    card,
    index,
    category: card.dataset.filterCategory || "other"
  }));

  cards.sort((a, b) => {
    const categoryDiff = getGlobalServiceCategoryRank(a.category) - getGlobalServiceCategoryRank(b.category);
    return categoryDiff !== 0 ? categoryDiff : a.index - b.index;
  });

  cards.forEach(({ card }) => container.appendChild(card));
}

function sortCategoryFilterButtons(container) {
  if (!container) return;

  const buttons = [...container.children].map((button, index) => ({
    button,
    index,
    value: button.dataset.cardFilterValue || button.dataset.paidFilterValue || "other"
  }));

  buttons.sort((a, b) => {
    if (a.value === "all") return -1;
    if (b.value === "all") return 1;

    const categoryDiff = getGlobalServiceCategoryRank(a.value) - getGlobalServiceCategoryRank(b.value);
    return categoryDiff !== 0 ? categoryDiff : a.index - b.index;
  });

  buttons.forEach(({ button }) => container.appendChild(button));
}

function sortAllRenderedCategoryAreas() {
  sortRenderedCategoryCards(elements.freeAppsGrid, '[data-filter-card="free"]');
  sortRenderedCategoryCards(document.getElementById("paidServicesGrid"), "[data-paid-filter-card]");
  sortRenderedCategoryCards(elements.additionalSupportCards, '[data-filter-card="additional"]');

  sortCategoryFilterButtons(
    document.querySelector('[data-card-filter-panel="free"] [data-card-filter-options="category"]')
  );
  sortCategoryFilterButtons(
    document.querySelector('[data-card-filter-panel="additional"] [data-card-filter-options="category"]')
  );
  sortCategoryFilterButtons(
    document.querySelector('[data-paid-service-filter-panel] [data-paid-filter-options="category"]')
  );
}

applyGlobalCategoryLabels();

const renderFreeAppsBeforeCategoryOrder = renderFreeApps;
renderFreeApps = function renderFreeAppsInGlobalCategoryOrder() {
  renderFreeAppsBeforeCategoryOrder();
  sortAllRenderedCategoryAreas();
};

const renderAdditionalSupportBeforeCategoryOrder = renderAdditionalSupport;
renderAdditionalSupport = function renderAdditionalSupportInGlobalCategoryOrder(currentRefs) {
  renderAdditionalSupportBeforeCategoryOrder(currentRefs);
  sortAllRenderedCategoryAreas();
};

const groupResultPlansByServiceBeforeCategoryOrder = groupResultPlansByService;
groupResultPlansByService = function groupResultPlansByGlobalCategory(refs) {
  return groupResultPlansByServiceBeforeCategoryOrder(refs).sort(compareByGlobalServiceCategory);
};

const renderCardFilterPanelBeforeCategoryOrder = renderCardFilterPanel;
renderCardFilterPanel = function renderCardFilterPanelInGlobalCategoryOrder(type, items) {
  renderCardFilterPanelBeforeCategoryOrder(type, items);
  sortCategoryFilterButtons(
    document.querySelector(`[data-card-filter-panel="${type}"] [data-card-filter-options="category"]`)
  );
};

const renderPaidServiceFilterPanelBeforeCategoryOrder = renderPaidServiceFilterPanel;
renderPaidServiceFilterPanel = function renderPaidServiceFilterPanelInGlobalCategoryOrder(items) {
  renderPaidServiceFilterPanelBeforeCategoryOrder(items);
  sortCategoryFilterButtons(
    document.querySelector('[data-paid-service-filter-panel] [data-paid-filter-options="category"]')
  );
};
