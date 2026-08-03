"use strict";

const APP_LINKS_URL = "./data/appLinks.json";

const SELECTOR_CATEGORY_META = [
  {
    id: "official",
    label: "公式サービス",
    note: "ファンクラブ・公式ブログなど",
    icon: "bi-patch-check"
  },
  {
    id: "sns",
    label: "SNS",
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

CATEGORY_META.official = { label: "公式サービス", icon: "bi-patch-check" };
CATEGORY_META.sns = { label: "SNS", icon: "bi-share" };

let serviceInfoPreviousFocus = null;

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

renderFreeApps = function renderFreeAppsWithDescriptionsAndDownloadLinks() {
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
      <article class="free-app-card card-with-fixed-footer">
        <div class="free-app-top">
          <div>
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.content?.summary || "無料で利用できます。")}</p>
          </div>
          <span class="price-badge">無料</span>
        </div>
        ${renderServiceInfoButton(service)}
        <div class="card-description-spacer" aria-hidden="true"></div>
        <div class="feature-list">${renderFeatureChips(plan.features || [])}</div>
        <span class="service-category-chip">${escapeHtml(category.label)}</span>
        ${renderAppDownloadLinks(service.id)}
      </article>
    `;
  }).join("");
};

renderServiceGroups = function renderCollapsibleServiceGroups() {
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
    const hasSelectedService = services.some((service) => state.selectedPlans.has(service.id));
    const shouldOpen = category.id === "music" || hasSelectedService;

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

  elements.serviceGroups.querySelectorAll("[data-plan-button]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePlan(button.dataset.serviceId, button.dataset.planId);
    });
  });
};

renderServiceCard = function renderCompactSelectorServiceCard(service) {
  const selectedPlanId = state.selectedPlans.get(service.id);
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
    <article class="service-card selector-service-card">
      <div class="service-card-header selector-service-card-header">
        <div class="service-card-title">
          <h4>${escapeHtml(service.name)}</h4>
        </div>
      </div>
      <div class="plan-options">${plans}</div>
    </article>
  `;
};

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

  return items.length ? `<div class="app-download-links card-download-footer">${items.join("")}</div>` : "";
}

function getServiceById(serviceId) {
  return getServices().find((service) => service.id === serviceId) || null;
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
  const modal = document.getElementById("serviceInfoModal");
  const title = document.getElementById("serviceInfoModalTitle");
  const body = document.getElementById("serviceInfoModalBody");
  if (!service || !modal || !title || !body) return;

  serviceInfoPreviousFocus = triggerElement || document.activeElement;
  title.textContent = `${service.name}について`;
  body.innerHTML = buildServiceInfoModalBody(service);
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("service-info-modal-open");

  const closeButton = modal.querySelector(".service-info-modal-close");
  window.requestAnimationFrame(() => closeButton?.focus());
}

function closeServiceInfoModal() {
  const modal = document.getElementById("serviceInfoModal");
  if (!modal || modal.classList.contains("hidden")) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("service-info-modal-open");
  serviceInfoPreviousFocus?.focus?.();
  serviceInfoPreviousFocus = null;
}

function setupServiceInfoModal() {
  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-service-info-button]");
    if (openButton) {
      openServiceInfoModal(openButton.dataset.serviceId, openButton);
      return;
    }

    if (event.target.closest("[data-service-info-close]")) {
      closeServiceInfoModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeServiceInfoModal();
    }
  });
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

document.addEventListener("DOMContentLoaded", () => {
  setupStickyToc();
  setupServiceInfoModal();
});
