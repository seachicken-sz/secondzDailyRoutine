const MUSIC_TOP_API_URL = "https://script.google.com/macros/s/AKfycbzSxC7H8f6QufHRP_HvK98QdmKjraXAXoRY6bHW2-8UDOz6rvb6CtksaSoVlMy2feTE/exec?type=musicTopAll";

async function loadRequestRanking() {
  const area = document.getElementById("requestRankingArea");

  if (!area) {
    return;
  }

  try {
    const response = await fetch(MUSIC_TOP_API_URL);

    if (!response.ok) {
      throw new Error(`Music top API error: ${response.status}`);
    }

    const data = await response.json();

    const recentItems = Array.isArray(data.recentMusicTop) ? data.recentMusicTop : [];
    const spotifyListener = data.spotifyListener || null;

    renderSpotifyListenerInfo(spotifyListener);

    const recentRequestItems = getRequestRankingItems(recentItems);

    area.innerHTML = renderRequestRanking({
      recentRequestItems,
    });

    setupRequestRankingToggle();
  } catch (error) {
    console.error("request ranking load error", error);

    renderSpotifyListenerInfo(null);

    area.innerHTML = '<p class="request-ranking-empty">人気リクエスト曲の読み込みに失敗しました。</p>';
  }
}

function renderSpotifyListenerInfo(spotifyListener) {
  const countElement = document.getElementById("spotifyListenerCount");

  if (!countElement) {
    return;
  }

  if (!spotifyListener || spotifyListener.today == null) {
    countElement.classList.add("hidden");
    countElement.textContent = "";
    return;
  }

  const today = toDisplayNumber(spotifyListener.today);
  const diff = toDisplayNumber(spotifyListener.diff);

  if (today === null) {
    countElement.classList.add("hidden");
    countElement.textContent = "";
    return;
  }

  const todayText = today.toLocaleString("ja-JP");

  let diffText = "";

  if (diff !== null && diff > 0) {
    diffText = `（前日比 ＋${diff.toLocaleString("ja-JP")}）`;
  }

  countElement.textContent =
    `Spotify本日の月間リスナー数<br>${todayText}人${diffText}`;

  countElement.classList.remove("hidden");
}

function toDisplayNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace(/,/g, ""));

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
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
      ${renderRequestRankingBlock(
        { main: "人気リクエスト曲", ruby: "request ranking" },
        recentRequestItems
      )}
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
      <h2 class="request-ranking-title ruby-h">
        <ruby>${escapeHtml(title.main)}<rt>${escapeHtml(title.ruby)}</rt></ruby>
      </h2>

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

  return `
    <div class="request-ranking-item">
      <span class="request-ranking-rank">${rank}</span>
      <span class="request-ranking-song">
        <span class="request-ranking-song-title">${escapeHtml(title)}</span>
      </span>
    </div>
  `;
}

function setupRequestRankingToggle() {
  const content = document.querySelector(".request-ranking-content");
  const button = document.getElementById("requestRankingToggleButton");

  if (!content || !button) {
    return;
  }

  const extraItems = content.querySelectorAll(".request-ranking-extra");

  const hasHiddenItems = Array.from(extraItems).some((extraItem) => {
    return extraItem.children.length > 0;
  });

  if (!hasHiddenItems) {
    button.classList.add("hidden");
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
