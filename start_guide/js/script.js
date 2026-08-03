"use strict";

const DATA_URL = "./data/services.json";
const STORAGE_KEY = "tamugotoStartGuideSelectedPlans";
const BUDGET_STORAGE_KEY = "tamugotoStartGuideBudget";

const CATEGORY_META = {
  music: { label: "音楽", icon: "bi-music-note-beamed" },
  video: { label: "動画", icon: "bi-play-btn" },
  radio: { label: "ラジオ", icon: "bi-broadcast" }
};

const FEATURE_LABELS = {
  "music-streaming": "公式音源を聴く",
  "stationhead-compatible": "Stationheadに参加する",
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
  "radio-unlimited-listening": "聴取時間制限なしで聴く"
};

const state = {
  data: null,
  selectedPlans: new Map(),
  budget: 0
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadData();
});

function cacheElements() {
  [
    "freeAppsGrid",
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
    "serviceFinderSection"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.resetSelectionButton.addEventListener("click", resetSelection);
  elements.showResultButton.addEventListener("click", showResults);
  elements.editSelectionButton.addEventListener("click", () => {
    elements.serviceFinderSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.budgetSelect.addEventListener("change", (event) => {
    state.budget = Number(event.target.value) || 0;
    localStorage.setItem(BUDGET_STORAGE_KEY, String(state.budget));
    if (!elements.resultSection.classList.contains("hidden")) {
      renderResults();
    }
  });
  elements.retryButton.addEventListener("click", loadData);
}

async function loadData() {
  showLoading(true);
  elements.errorPanel.classList.add("hidden");

  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.data = await response.json();
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
  elements.budgetSelect.value = String(state.budget);
}

function saveSelection() {
  const value = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function getServices() {
  return [...(state.data?.services || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

function renderFreeApps() {
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
      </article>
    `;
  }).join("");
}

function renderServiceGroups() {
  const selectableServices = getServices().filter((service) => service.showInServiceSelector !== false);
  const grouped = groupBy(selectableServices, (service) => service.category || "other");

  elements.serviceGroups.innerHTML = Object.entries(CATEGORY_META)
    .filter(([category]) => grouped[category]?.length)
    .map(([category, meta]) => `
      <section class="service-group">
        <div class="service-group-heading">
          <i class="bi ${meta.icon}" aria-hidden="true"></i>
          <h3>${meta.label}</h3>
        </div>
        <div class="service-list">
          ${grouped[category].map(renderServiceCard).join("")}
        </div>
      </section>
    `).join("");

  elements.serviceGroups.querySelectorAll("[data-plan-button]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePlan(button.dataset.serviceId, button.dataset.planId);
    });
  });
}

function renderServiceCard(service) {
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
      ${renderTrialPolicy(service)}
      ${renderServiceDetails(service)}
    </article>
  `;
}

function renderTrialPolicy(service) {
  const policy = service.trialPolicy;
  if (!policy?.available) return "";
  return `<span class="trial-chip"><i class="bi bi-stars"></i>${escapeHtml(policy.label || "無料体験あり")}</span>`;
}

function renderServiceDetails(service) {
  const sections = service.content?.sections || [];
  if (!sections.length) return "";

  return `
    <details class="service-details">
      <summary>このサービスについて</summary>
      <div class="service-detail-content">
        ${sections.map((section) => `
          <section>
            <h5>${escapeHtml(section.title || "")}</h5>
            ${sanitizeHtml(section.bodyHtml || "")}
          </section>
        `).join("")}
      </div>
    </details>
  `;
}

function togglePlan(serviceId, planId) {
  if (state.selectedPlans.get(serviceId) === planId) {
    state.selectedPlans.delete(serviceId);
  } else {
    state.selectedPlans.set(serviceId, planId);
  }

  saveSelection();
  renderServiceGroups();
  updateSelectionCount();
}

function resetSelection() {
  state.selectedPlans.clear();
  saveSelection();
  renderServiceGroups();
  updateSelectionCount();
  elements.resultSection.classList.add("hidden");
}

function updateSelectionCount() {
  const count = state.selectedPlans.size;
  elements.selectionCount.textContent = `${count}件`;
}

function showResults() {
  renderResults();
  elements.resultSection.classList.remove("hidden");
  elements.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResults() {
  const selectedRefs = Array.from(state.selectedPlans, ([serviceId, planId]) => ({ serviceId, planId }));
  const resolvedRefs = resolveIncludedPlans(selectedRefs);
  const currentItems = resolvedRefs.map((ref) => getPlanRecord(ref.serviceId, ref.planId)).filter(Boolean);

  elements.resultSummary.textContent = currentItems.length
    ? `${state.selectedPlans.size}件の選択から、${currentItems.length}件の利用可能なプランを確認しました。`
    : "利用中のプランがまだ選択されていません。";

  elements.resultCards.innerHTML = currentItems.map((item) => renderResultCard(item, resolvedRefs)).join("");
  elements.emptyCurrentResult.classList.toggle("hidden", currentItems.length > 0);

  renderAdditionalSupport(resolvedRefs);
}

function renderAdditionalSupport(currentRefs) {
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
    <article class="result-card">
      <div class="result-card-top">
        <div>
          <h4>${escapeHtml(candidate.plan.name)}</h4>
          <p class="result-card-summary">${escapeHtml(candidate.service.name)}で、今よりできることが増えます。</p>
        </div>
        <span class="source-badge">追加候補</span>
      </div>
      <p class="additional-price">月額＋${candidate.monthlyPrice.toLocaleString("ja-JP")}円</p>
      <div class="feature-list">${renderFeatureChips(candidate.newFeatures)}</div>
      ${renderIncludedPlanNames(candidate.candidateRefs)}
    </article>
  `).join("");
  elements.additionalSupportSection.classList.remove("hidden");
}

function renderResultCard(item, resolvedRefs) {
  const source = resolvedRefs.find((ref) => ref.serviceId === item.service.id && ref.planId === item.plan.id);
  const sourceLabel = source?.source === "included" ? "含まれるプラン" : "選択中";

  return `
    <article class="result-card">
      <div class="result-card-top">
        <div>
          <h4>${escapeHtml(item.plan.name)}</h4>
          <p class="result-card-summary">${escapeHtml(item.service.content?.summary || "")}</p>
        </div>
        <span class="source-badge">${sourceLabel}</span>
      </div>
      <div class="feature-list">${renderFeatureChips(item.plan.features || [])}</div>
      ${source?.includedBy ? `<p class="included-note">${escapeHtml(getPlanName(source.includedBy.serviceId, source.includedBy.planId))}に含まれています。</p>` : ""}
    </article>
  `;
}

function resolveIncludedPlans(initialRefs) {
  const result = [];
  const queue = initialRefs.map((ref) => ({ ...ref, source: "selected" }));
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

function getPlanRecord(serviceId, planId) {
  const service = getServices().find((item) => item.id === serviceId);
  const plan = service?.plans?.find((item) => item.id === planId);
  return service && plan ? { service, plan } : null;
}

function getPlanName(serviceId, planId) {
  return getPlanRecord(serviceId, planId)?.plan.name || "対象プラン";
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
  const monthly = getMonthlyPrice(plan);
  return monthly === null ? "料金は公式情報を確認" : `月額${monthly.toLocaleString("ja-JP")}円`;
}

function renderIncludedPlanNames(refs) {
  const included = refs.filter((ref) => ref.source === "included");
  if (!included.length) return "";
  const names = included.map((ref) => getPlanName(ref.serviceId, ref.planId));
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
  elements.loadingPanel.classList.toggle("hidden", !visible);
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
