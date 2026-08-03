"use strict";

const APP_LINKS_URL = "./data/appLinks.json";

loadData = async function loadDataWithAppLinks() {
  showLoading(true);
  elements.errorPanel.classList.add("hidden");

  try {
    const version = Date.now();
    const servicesResponse = await fetch(`${DATA_URL}?v=${version}`, { cache: "no-store" });
    if (!servicesResponse.ok) {
      throw new Error(`services.json: HTTP ${servicesResponse.status}`);
    }

    state.data = await servicesResponse.json();
    state.appLinks = { services: {} };

    try {
      const linksResponse = await fetch(`${APP_LINKS_URL}?v=${version}`, { cache: "no-store" });
      if (linksResponse.ok) {
        state.appLinks = await linksResponse.json();
      }
    } catch (linkError) {
      console.warn("アプリリンクを読み込めませんでした。", linkError);
    }

    restoreState();
    renderFreeApps();
    renderServiceGroups();
    updateSelectionCount();
    showLoading(false);
  } catch (error) {
    console.error(error);
    showLoading(false);
    elements.errorMessage.textContent = "サービス情報の取得に失敗しました。通信状況を確認して、もう一度お試しください。";
    elements.errorPanel.classList.remove("hidden");
  }
};

renderFreeApps = function renderFreeAppsWithDownloadLinks() {
  const freeItems = [];

  getServices().forEach((service) => {
    const freePlan = (service.plans || []).find((plan) => plan.planType === "free");
    if (freePlan) {
      freeItems.push({ service, plan: freePlan });
    }
  });

  elements.freeAppsGrid.innerHTML = freeItems.map(({ service, plan }) => {
    const category = CATEGORY_META[service.category] || { label: service.category || "その他" };
    return `
      <article class="free-app-card">
        <div class="free-app-top">
          <div>
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.content?.summary || "無料で利用できます。")}</p>
          </div>
          <span class="price-badge">無料</span>
        </div>
        <div class="feature-list">${renderFeatureChips(plan.features || [])}</div>
        <span class="service-category-chip">${escapeHtml(category.label)}</span>
        ${renderAppDownloadLinks(service.id)}
      </article>
    `;
  }).join("");
};

renderServiceCard = function renderServiceCardWithoutTrial(service) {
  const selectedPlanId = state.selectedPlans.get(service.id);
  const category = CATEGORY_META[service.category] || { label: service.category || "その他" };
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
      >
        <span class="plan-option-main">
          <span class="plan-option-name">${escapeHtml(plan.name)}</span>
          <span class="plan-option-price">${escapeHtml(formatPlanPrice(plan))}</span>
        </span>
        <span class="plan-option-check"><i class="bi bi-check-lg"></i></span>
      </button>
    `;
  }).join("");

  return `
    <article class="service-card">
      <div class="service-card-header">
        <div class="service-card-title">
          <h4>${escapeHtml(service.name)}</h4>
          <p>${escapeHtml(service.content?.summary || "")}</p>
        </div>
        <span class="service-category-chip">${escapeHtml(category.label)}</span>
      </div>
      <div class="plan-options">${plans}</div>
      ${renderServiceDetails(service)}
    </article>
  `;
};

renderAdditionalSupport = function renderAdditionalSupportWithServiceNames(currentRefs) {
  const budget = state.budget;
  const currentKeys = new Set(currentRefs.map((ref) => planKey(ref.serviceId, ref.planId)));
  const currentFeatures = new Set(
    currentRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || [])
  );

  if (budget <= 0) {
    elements.additionalSupportSection.classList.add("hidden");
    elements.additionalSupportCards.innerHTML = "";
    return;
  }

  const candidates = [];

  getServices().forEach((service) => {
    (service.plans || []).forEach((plan) => {
      const key = planKey(service.id, plan.id);
      if (plan.planType !== "paid" || currentKeys.has(key)) return;

      const monthlyPrice = getMonthlyPrice(plan);
      if (monthlyPrice === null || monthlyPrice > budget) return;

      const candidateRefs = resolveIncludedPlans([{ serviceId: service.id, planId: plan.id }]);
      const candidateFeatures = new Set(
        candidateRefs.flatMap((ref) => getPlanRecord(ref.serviceId, ref.planId)?.plan.features || [])
      );
      const newFeatures = [...candidateFeatures].filter((feature) => !currentFeatures.has(feature));
      if (!newFeatures.length) return;

      candidates.push({ service, plan, monthlyPrice, newFeatures, candidateRefs });
    });
  });

  candidates.sort((a, b) => a.monthlyPrice - b.monthlyPrice || a.service.displayOrder - b.service.displayOrder);

  if (!candidates.length) {
    elements.additionalSupportSection.classList.add("hidden");
    elements.additionalSupportCards.innerHTML = "";
    return;
  }

  elements.additionalBudgetBadge.textContent = `＋${budget.toLocaleString("ja-JP")}円まで`;
  elements.additionalSupportCards.innerHTML = candidates.map((candidate) => `
    <article class="result-card additional-support-card">
      <div class="result-card-top">
        <div>
          <h4 class="additional-service-name">${escapeHtml(candidate.service.name)}</h4>
          <p class="additional-plan-name">${escapeHtml(candidate.plan.name)}</p>
          <p class="result-card-summary">このサービスを追加すると、今よりできる応援が増えます。</p>
        </div>
        <span class="source-badge">追加候補</span>
      </div>
      <p class="additional-price">月額＋${candidate.monthlyPrice.toLocaleString("ja-JP")}円</p>
      <div class="feature-list">${renderFeatureChips(candidate.newFeatures)}</div>
      ${renderIncludedPlanNames(candidate.candidateRefs)}
      ${renderAppDownloadLinks(candidate.service.id)}
    </article>
  `).join("");
  elements.additionalSupportSection.classList.remove("hidden");
};

function renderAppDownloadLinks(serviceId) {
  const links = state.appLinks?.services?.[serviceId] || {};
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

  return items.length ? `<div class="app-download-links">${items.join("")}</div>` : "";
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

document.addEventListener("DOMContentLoaded", setupStickyToc);
