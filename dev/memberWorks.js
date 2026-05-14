const WEEKDAY_LABELS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT"
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
    .filter(isVisibleMemberWork)
    .sort(sortMemberWorks);

  const grouped = groupByWeekday(visibleItems);

  memberWorksArea.innerHTML = "";

  grouped.forEach(({ weekday, items }) => {
    const section = document.createElement("section");

    section.className = "member-weekday-group";

    section.innerHTML = `
      <div class="member-weekday-heading">
        ${WEEKDAY_LABELS[weekday]}
      </div>

      <div class="member-weekday-items">
        ${items.map(createWorkItemHtml).join("")}
      </div>
    `;

    memberWorksArea.appendChild(section);
  });
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

  if (item.members.includes("all")) {
    return true;
  }

  return item.members.some((member) =>
    selectedMembers.has(member)
  );
}

function sortMemberWorks(a, b) {
  const aWeekday = getWeekday(a);
  const bWeekday = getWeekday(b);

  if (aWeekday !== bWeekday) {
    return aWeekday - bWeekday;
  }

  return getTimeValue(a) - getTimeValue(b);
}

function getWeekday(item) {
  if (typeof item.weekday !== "undefined") {
    return item.weekday;
  }

  return new Date(
    item.dateTime.slice(0, 4),
    item.dateTime.slice(4, 6) - 1,
    item.dateTime.slice(6, 8)
  ).getDay();
}

function getTimeValue(item) {
  if (item.time) {
    return Number(item.time.replace(":", ""));
  }

  return Number(item.dateTime.slice(8, 12));
}

function groupByWeekday(items) {
  const map = new Map();

  items.forEach((item) => {
    const weekday = getWeekday(item);

    if (!map.has(weekday)) {
      map.set(weekday, []);
    }

    map.get(weekday).push(item);
  });

  return Array.from(map.entries()).map(([weekday, groupItems]) => ({
    weekday,
    items: groupItems
  }));
}

function createWorkItemHtml(item) {
  return `
    <article class="member-work-row">
      <span class="member-work-type ${item.workType}">
        ${getWorkTypeLabel(item.workType)}
      </span>

      <span class="member-work-title">
        ${escapeHtml(item.title)}
      </span>

      <span class="member-work-meta">
        ${buildMetaText(item)}
      </span>

      <div class="member-work-links">
        ${buildPlatformLink(item)}
        ${buildMessageLink(item)}
      </div>
    </article>
  `;
}

function getWorkTypeLabel(workType) {
  const labelMap = {
    tv: "TV",
    radio: "RADIO"
  };

  return labelMap[workType] || workType.toUpperCase();
}

function buildPlatformLink(item) {
  if (!item.platformUrl) {
    return "";
  }

  const labelMap = {
    tv: "TVer",
    radio: "radiko"
  };

  const label =
    item.platformLabel ||
    labelMap[item.workType] ||
    "リンク";

  return `
    <a
      class="member-work-link"
      href="${item.platformUrl}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${label}
    </a>
  `;
}

function buildMessageLink(item) {
  if (!item.messageUrl) {
    return "";
  }

  return `
    <a
      class="member-work-link"
      href="${item.messageUrl}"
      target="_blank"
      rel="noopener noreferrer"
    >
      メッセージ
    </a>
  `;
}

function buildMetaText(item) {
  if (item.time) {
    return `${item.time}〜`;
  }

  return formatDateTime(item.dateTime);
}

function formatDateTime(value) {
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);

  return `${month}/${day} ${hour}:${minute}`;
}

function getTodayYmd() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function escapeHtml(value) {
  return String(value)
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
