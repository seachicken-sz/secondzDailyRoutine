const MEMBER_WORK_LINK_GROUPS = [
  {
    key: "tver",
    label: "TVer",
    description: "TVerはいいねとあとで見るを押してね！",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "tv" &&
      Boolean(item.platformUrl)
  },
  {
    key: "radiko",
    label: "radiko",
    description: "radikoはSNSシェアを押してね！",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "radio" &&
      Boolean(item.platformUrl)
  },
  {
    key: "message",
    label: "メッセージ",
    description: "メッセージを送ろう！",
    urlKey: "messageUrl",
    isTarget: (item) =>
      Boolean(item.messageUrl)
  },
  {
    key: "access",
    label: "アクセス",
    description: "アクセスするだけでも応援！",
    urlKey: "accessUrl",
    isTarget: (item) =>
      Boolean(item.accessUrl)
  }
];

let MEMBER_WORKS = [];

let selectedMembers = new Set(["all"]);

const memberWorksArea = document.getElementById("memberWorksArea");
const memberFilterArea = document.getElementById("memberFilterArea");

async function initializeMemberWorks() {
  try {
    MEMBER_WORKS = await loadMemberWorks();

    renderMemberWorks();

  } catch (error) {
    console.error(
      "メンバーお仕事読み込み失敗:",
      error
    );
  }
}

function renderMemberWorks() {
  const visibleItems = MEMBER_WORKS
    .filter(isVisibleMemberWork);

  const grouped = groupByLinkType(visibleItems);

  memberWorksArea.innerHTML = "";

  grouped.forEach(({ group, items }) => {
    const section = document.createElement("section");

    section.className = `member-link-section member-link-section-${group.key}`;

    section.innerHTML = `
      <div class="member-link-section-header">
        <h3 class="member-link-section-title">
          ${escapeHtml(group.label)}
        </h3>
    
        <p class="member-link-section-description">
          ${escapeHtml(group.description)}
        </p>
      </div>
    
      <div class="member-link-list">
        ${items.map((item) => createWorkItemHtml(item, group)).join("")}
      </div>
    `;
    memberWorksArea.appendChild(section);
  });
}

function groupByLinkType(items) {
  return MEMBER_WORK_LINK_GROUPS
    .map((group) => ({
      group,
      items: items.filter(group.isTarget)
    }))
    .filter(({ items }) => items.length > 0);
}

function isVisibleMemberWork(item) {
  if (item.to) {
    const today = getTodayYmd();

    if (today > item.to) {
      return false;
    }
  }

  if (selectedMembers.has("all")) {
    return true;
  }

  if (Array.isArray(item.members) && item.members.includes("all")) {
    return true;
  }

  if (!Array.isArray(item.members)) {
    return false;
  }

  return item.members.some((member) =>
    selectedMembers.has(member)
  );
}

function getRemainingDays(item) {
  if (!item.to) {
    return null;
  }

  const to = String(item.to).slice(0, 8);

  const todayDate = createDateFromYmd(getTodayYmd());
  const toDate = createDateFromYmd(to);

  const diffTime = toDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / 86400000);

  if (diffDays < 0) {
    return null;
  }

  return diffDays;
}

function createDateFromYmd(value) {
  return new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(4, 6)) - 1,
    Number(value.slice(6, 8))
  );
}

function buildRemainingText(item) {
  const remainingDays = getRemainingDays(item);

  if (remainingDays === null || remainingDays > 7) {
    return "";
  }

  if (remainingDays === 0) {
    return `
      <span class="member-work-link-limit">
        ※本日まで
      </span>
    `;
  }

  return `
    <span class="member-work-link-limit">
      ※残り${remainingDays}日
    </span>
  `;
}

function createWorkItemHtml(item, group) {
  if (group.key === "tver") {
    return createTverWorkItemHtml(item, group);
  }

  return `
    <a
      class="member-work-link-card"
      href="${escapeHtml(item[group.urlKey])}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="member-work-link-main">
        <span class="member-work-link-title">
          ${escapeHtml(getProgramDisplayName(item))}
        </span>

        ${buildRemainingText(item)}
      </span>

      <span class="member-work-link-arrow" aria-hidden="true">
        ›
      </span>
    </a>
  `;
}

function createTverWorkItemHtml(item, group) {
  return `
    <div class="member-work-link-card member-work-link-card-tver">
      <span class="member-work-link-main member-work-link-main-tver">
        <span class="member-work-link-title member-work-link-title-tver">
          ${escapeHtml(getProgramDisplayName(item))}
        </span>

        ${buildRemainingText(item)}
      </span>

      <a
        class="member-work-link-button member-work-link-button-tver"
        href="${escapeHtml(item[group.urlKey])}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${escapeHtml(getTverLinkText(item))}
      </a>

      <span class="member-work-link-reserved" aria-hidden="true"></span>
    </div>
  `;
}

function getTverLinkText(item) {
  return item.platformLinkText || item.linkText || "TVer";
}

function getProgramDisplayName(item) {
  return item.programName || item.program || item.title || "リンク";
}

function getTodayYmd() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function handleMemberFilter(member) {
  if (member === "all") {
    selectedMembers = new Set(["all"]);
  } else {
    selectedMembers.delete("all");

    if (selectedMembers.has(member)) {
      selectedMembers.delete(member);
    } else {
      selectedMembers.add(member);
    }

    if (selectedMembers.size === 0) {
      selectedMembers.add("all");
    }
  }

  updateFilterUi();
  renderMemberWorks();
}

function updateFilterUi() {
  memberFilterArea
    .querySelectorAll("[data-member]")
    .forEach((button) => {
      const member = button.dataset.member;

      button.classList.toggle(
        "active",
        selectedMembers.has(member)
      );
    });
}

memberFilterArea.addEventListener("click", (event) => {
  const button = event.target.closest("[data-member]");

  if (!button) {
    return;
  }

  handleMemberFilter(button.dataset.member);
});

initializeMemberWorks();
