const MEMBER_WORK_LINK_GROUPS = [
  {
    key: "tver",
    label: "TV",
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
  },
  {
    key: "youtube",
    label: "YouTube",
    description: "時間があったらメンバーごとの再生リストも再生しとこ！",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "youtube" &&
      Boolean(item.platformUrl)
  },
  {
    key: "dreampass",
    label: "ドリパス",
    description: "再上映のチャンス！見たい作品に投票しよ！",
    urlKey: "platformUrl",
    isTarget: (item) =>
      item.workType === "dreampass" &&
      Boolean(item.platformUrl)
  }
];

let MEMBER_WORKS = [];

const TVER_RANKING_REPORT_JSON_PATH = "../graph/tverRankingReport.json";
const TVER_RANKING_REPORT_BASE_URL =
  "https://seachicken-sz.github.io/secondzDailyRoutine/graph/";

let TVER_RANKING_REPORT_IDS = new Set();

let selectedMembers = new Set(["all"]);

const memberWorksArea = document.getElementById("memberWorksArea");
const memberFilterArea = document.getElementById("memberFilterArea");

/**
 * メンバーお仕事一覧を初期化
 */
async function initializeMemberWorks() {
  try {
    const [
      memberWorks,
      tverRankingReportIds
    ] = await Promise.all([
      loadMemberWorks(),
      loadTverRankingReportIds()
    ]);

    MEMBER_WORKS = memberWorks;
    TVER_RANKING_REPORT_IDS = tverRankingReportIds;

    renderMemberWorks();

  } catch (error) {
    console.error(
      "メンバーお仕事読み込み失敗:",
      error
    );
  }
}

/**
 * TVerランキングレポートが存在するID一覧を取得
 */
async function loadTverRankingReportIds() {
  try {
    const response = await fetch(TVER_RANKING_REPORT_JSON_PATH, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`TVerランキングJSON読み込み失敗: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data.reports !== "object" || data.reports === null) {
      return new Set();
    }

    return new Set(Object.keys(data.reports));

  } catch (error) {
    console.warn(
      "TVerランキングJSON読み込み失敗:",
      error
    );

    return new Set();
  }
}

/**
 * メンバーお仕事一覧を描画
 */
function renderMemberWorks() {
  if (!memberWorksArea) {
    return;
  }

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
        ${createYoutubeModalButtonHtml(group)}
        ${items.map((item) => createWorkItemHtml(item, group)).join("")}
      </div>
    `;

    memberWorksArea.appendChild(section);
  });
}

/**
 * YouTubeセクション先頭に表示するモーダル起動ボタンを生成
 */
function createYoutubeModalButtonHtml(group) {
  if (group.key !== "youtube") {
    return "";
  }

  return `
    <a
      class="member-work-link-card"
      href="javascript:void(0)"
      data-open-youtube-modal="true"
    >
      <span class="member-work-link-main">
        <span class="member-work-link-title">
          タムごと
        </span>
      </span>

      <span class="member-work-link-arrow" aria-hidden="true">
        <i class="bi bi-chevron-right"></i>
      </span>
    </a>
  `;
}

/**
 * リンク種別ごとに表示対象をグルーピング
 */
function groupByLinkType(items) {
  return MEMBER_WORK_LINK_GROUPS
    .map((group) => ({
      group,
      items: items.filter(group.isTarget)
    }))
    .filter(({ items }) => items.length > 0);
}

/**
 * 現在選択中のメンバー条件で表示対象か判定
 */
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

/**
 * 残り日数を取得
 */
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

/**
 * yyyymmdd から Date を作成
 */
function createDateFromYmd(value) {
  return new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(4, 6)) - 1,
    Number(value.slice(6, 8))
  );
}

/**
 * 残り日数表示を生成
 */
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

/**
 * 通常リンクカードを生成
 */
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
        data-member-work-link="true"
        data-member-work-group-key="${escapeHtml(group.key)}"
        data-member-work-title="${escapeHtml(getProgramDisplayName(item))}"
        data-member-work-url="${escapeHtml(item[group.urlKey])}"
        data-member-work-work-type="${escapeHtml(item.workType || "")}"
        data-member-work-program-id="${escapeHtml(item.programId || item.seriesId || "")}"
        data-member-work-episode-id="${escapeHtml(item.episodeId || "")}"
        data-member-work-members="${escapeHtml(Array.isArray(item.members) ? item.members.join(",") : "")}"
      >
      <span class="member-work-link-main">
        <span class="member-work-link-title">
          ${escapeHtml(getProgramDisplayName(item))}
        </span>

        ${buildRemainingText(item)}
      </span>

      <span class="member-work-link-arrow" aria-hidden="true">
        <i class="bi bi-chevron-right"></i>
      </span>
    </a>
  `;
}

/**
 * TVer用リンクカードを生成
 */
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
        data-member-work-link="true"
        data-member-work-group-key="${escapeHtml(group.key)}"
        data-member-work-title="${escapeHtml(getProgramDisplayName(item))}"
        data-member-work-url="${escapeHtml(item[group.urlKey])}"
        data-member-work-work-type="${escapeHtml(item.workType || "")}"
        data-member-work-program-id="${escapeHtml(item.programId || item.seriesId || "")}"
        data-member-work-episode-id="${escapeHtml(item.episodeId || getTverEpisodeId(item.platformUrl) || "")}"
        data-member-work-members="${escapeHtml(Array.isArray(item.members) ? item.members.join(",") : "")}"
      >
        ${escapeHtml(getTverLinkText(item))}
      </a>

      <span class="member-work-link-rank-area">
        ${createTverRankingReportButtonHtml(item)}
      </span>
    </div>
  `;
}

/**
 * TVerリンク文言を取得
 */
function getTverLinkText(item) {
  return item.platformLinkText || item.linkText || "TVer";
}

/**
 * TVerランキングレポートボタンを生成
 */
function createTverRankingReportButtonHtml(item) {
  const episodeId = getTverEpisodeId(item.platformUrl);

  if (!episodeId || !TVER_RANKING_REPORT_IDS.has(episodeId)) {
    return "";
  }

  const reportUrl =
    `${TVER_RANKING_REPORT_BASE_URL}?id=${encodeURIComponent(episodeId)}`;

  return `
    <a
      class="member-work-link-rank-button"
      href="${escapeHtml(reportUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="ランク推移"
      title="ランク推移"
      data-member-work-link="true"
      data-member-work-group-key="tverGraph"
      data-member-work-title="${escapeHtml(getProgramDisplayName(item))}"
      data-member-work-url="${escapeHtml(reportUrl)}"
      data-member-work-work-type="${escapeHtml(item.workType || "tv")}"
      data-member-work-program-id="${escapeHtml(item.programId || item.seriesId || "")}"
      data-member-work-episode-id="${escapeHtml(episodeId)}"
      data-member-work-members="${escapeHtml(Array.isArray(item.members) ? item.members.join(",") : "")}"
    >
      <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
    </a>
  `;
}

/**
 * TVer URLからepisodeIdを取得
 */
function getTverEpisodeId(url) {
  if (!url) {
    return "";
  }

  const value = String(url).trim();

  try {
    const parsedUrl = new URL(value, window.location.href);
    const pathParts = parsedUrl.pathname
      .split("/")
      .filter(Boolean);

    return pathParts.at(-1) || "";

  } catch (error) {
    return value
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .filter(Boolean)
      .at(-1) || "";
  }
}

/**
 * 表示名を取得
 */
function getProgramDisplayName(item) {
  return item.programName || item.program || item.title || "リンク";
}

/**
 * 今日の日付を yyyymmdd 形式で取得
 */
function getTodayYmd() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * メンバーフィルターを更新
 */
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

/**
 * メンバーフィルターUIを更新
 */
function updateFilterUi() {
  if (!memberFilterArea) {
    return;
  }

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

/**
 * YouTubeモーダル起動ボタンのクリックイベント
 */
if (memberWorksArea) {
  memberWorksArea.addEventListener("click", (event) => {
    const youtubeModalButton = event.target.closest("[data-open-youtube-modal]");

    if (youtubeModalButton) {
      event.preventDefault();

      if (typeof openYoutubeModal === "function") {
        openYoutubeModal();
      }

      return;
    }

    const link = event.target.closest("[data-member-work-link]");

    if (!link) {
      return;
    }

    if (typeof sendMemberWorkLinkLog === "function") {
      sendMemberWorkLinkLog({
        groupKey: link.dataset.memberWorkGroupKey || "",
        title: link.dataset.memberWorkTitle || "",
        url: link.dataset.memberWorkUrl || link.href || "",
        workType: link.dataset.memberWorkWorkType || "",
        programId: link.dataset.memberWorkProgramId || "",
        episodeId: link.dataset.memberWorkEpisodeId || "",
        members: link.dataset.memberWorkMembers || ""
      });
    }
  });
}

/**
 * メンバーフィルターのクリックイベント
 */
if (memberFilterArea) {
  memberFilterArea.addEventListener("click", (event) => {
    const button = event.target.closest("[data-member]");

    if (!button) {
      return;
    }

    handleMemberFilter(button.dataset.member);
  });
}

initializeMemberWorks();
