const MEMBER_WORK_LINK_GROUPS = [
  {
    key: "tver",
    label: "TVer",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "tv" &&
      Boolean(item.platformUrl)
  },
  {
    key: "radiko",
    label: "radiko",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "radio" &&
      Boolean(item.platformUrl)
  },
  {
    key: "message",
    label: "メッセージ",
    urlKey: "messageUrl",
    isTarget: (item) =>
      Boolean(item.messageUrl)
  },
  {
    key: "access",
    label: "アクセス",
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
      items: items
        .filter(group.isTarget)
        .sort(sortMemberWorks)
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

function sortMemberWorks(a, b) {
  const aDateValue = getDateValue(a);
  const bDateValue = getDateValue(b);

  if (aDateValue !== bDateValue) {
    return aDateValue - bDateValue;
  }

  return getTimeValue(a) - getTimeValue(b);
}

function getDateValue(item) {
  if (item.dateTime) {
    return Number(item.dateTime.slice(0, 8));
  }

  if (item.from) {
    return Number(item.from.slice(0, 8));
  }

  return 0;
}

function getTimeValue(item) {
  if (item.time) {
    return Number(String(item.time).replace(":", ""));
  }

  if (item.dateTime) {
    return Number(item.dateTime.slice(8, 12));
  }

  if (item.from) {
    return Number(item.from.slice(8, 12));
  }

  return 0;
}

function createWorkItemHtml(item, group) {
  return `
    <a
      class="member-work-link-card"
      href="${escapeHtml(item[group.urlKey])}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="member-work-link-title">
        ${escapeHtml(getProgramDisplayName(item))}
      </span>

      <span class="member-work-link-arrow" aria-hidden="true">
        ›
      </span>
    </a>
  `;
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
