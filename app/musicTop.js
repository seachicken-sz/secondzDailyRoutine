const MUSIC_TOP_API_URL = "https://script.google.com/macros/s/AKfycbyyETjEfIqs9fSUMD4Kj_3c5Zey_j92Sovy1DPld5Q03o63zpAmQqhTi6fB4FKy6xWU/exec?type=musicTopAll";

async function loadRequestRanking() {
  const area = document.getElementById("requestRankingArea");

  if (!area) {
    return;
  }

  try {
    const response = await fetch(MUSIC_TOP_API_URL);
    const data = await response.json();

    const recentItems = Array.isArray(data.recentMusicTop) ? data.recentMusicTop : [];
    const weeklyItems = Array.isArray(data.weeklyMusicTop) ? data.weeklyMusicTop : [];

    const recentRequestItems = getRequestRankingItems(recentItems);
    const thisWeekRequestItems = getThisWeekRequestRankingItems(weeklyItems);

    area.innerHTML = renderRequestRanking({
      recentRequestItems,
      thisWeekRequestItems,
    });

    setupRequestRankingToggle();
  } catch (error) {
    console.error("request ranking load error", error);
    area.innerHTML = '<p class="request-ranking-empty">人気リクエスト曲の読み込みに失敗しました。</p>';
  }
}

function getRequestRankingItems(items) {
  return items
    .filter((item) => item.taskType === "requestSong")
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .slice(0, 3);
}

function getThisWeekRequestRankingItems(items) {
  return items
    .filter((item) => {
      return item.taskType === "requestSong" && item.weekLabel === "今週";
    })
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .slice(0, 3);
}

function renderRequestRanking({ recentRequestItems, thisWeekRequestItems }) {
  return `
    <div class="request-ranking-content" data-expanded="false">
      ${renderRequestRankingBlock("人気リクエスト曲", recentRequestItems)}
      ${renderRequestRankingBlock("今週の人気リクエスト曲", thisWeekRequestItems)}

      <button type="button" id="requestRankingToggleButton" class="request-ranking-toggle">
        もっと見る
      </button>
    </div>
  `;
}

function renderRequestRankingBlock(title, items) {
  const firstItem = items[0];
  const hiddenItems = items.slice(1);

  return `
    <section class="request-ranking-block">
      <h2 class="request-ranking-title">${escapeHtml(title)}</h2>

      <div class="request-ranking-main">
        ${firstItem ? renderRequestRankingItem(firstItem) : '<p class="request-ranking-empty">データなし</p>'}
      </div>

      <div class="request-ranking-extra">
        ${hiddenItems.map(renderRequestRankingItem).join("")}
      </div>
    </section>
  `;
}

function renderRequestRankingItem(item) {
  const rank = Number(item.rank || 0);
  const title = item.title || "タイトル不明";
  const url = item.url || "";

  const innerHtml = `
    <span class="request-ranking-rank">${rank}</span>
    <span class="request-ranking-song">
      <span class="request-ranking-song-title">${escapeHtmltitle)}</span>
    </span>
  `;

  if (!url) {
    return `<div class="request-ranking-item">${innerHtml}</div>`;
  }

  return `
    <a class="request-ranking-item" href="${escapeHtmlurl)}" target="_blank" rel="noopener noreferrer">
      ${innerHtml}
    </a>
  `;
}

function setupRequestRankingToggle() {
  const content = document.querySelector(".request-ranking-content");
  const button = document.getElementById("requestRankingToggleButton");

  if (!content || !button) {
    return;
  }

  button.addEventListener("click", () => {
    const isExpanded = content.dataset.expanded === "true";
    const nextExpanded = !isExpanded;

    content.dataset.expanded = String(nextExpanded);
    button.textContent = nextExpanded ? "閉じる" : "もっと見る";
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
