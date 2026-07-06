// musicTopJson.jsonは、データ更新後も最新内容を取得できるよう時間単位でキャッシュを切り替える。
const MUSIC_TOP_API_URL = `../data/musicTopJson.json?v=${getMusicTopCacheKey()}`;

function getMusicTopCacheKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
  ].join("");
}

// 音楽トップ用JSONを取得し、Spotify・USEN・人気リクエスト曲の表示をまとめて更新する。
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

    // JSONの項目欠損時でも後続の描画処理が止まらないよう、配列項目は空配列に寄せる。
    const recentItems = Array.isArray(data.recentMusicTop)
      ? data.recentMusicTop
      : [];

    const spotifyListener = data.spotifyListener || null;

    const usenRankingItems = Array.isArray(data.latestUsenRanking)
      ? data.latestUsenRanking
      : [];

    renderSpotifyListenerInfo(spotifyListener);
    renderUsenRankingInfo(usenRankingItems);

    // リクエスト曲だけを順位順で上位3件に絞り、メインランキングへ表示する。
    const recentRequestItems = getRequestRankingItems(recentItems);
    
    area.innerHTML = renderRequestRanking({
      recentRequestItems,
      usenRankingItems,
    });
    // innerHTML反映後に「もっと見る」ボタンのイベントを設定する。
    setupRequestRankingToggle();
  } catch (error) {
    console.error("request ranking load error", error);

    // 一部の古い表示だけ残らないよう、取得失敗時は関連表示をまとめてリセットする。
    renderSpotifyListenerInfo(null);
    renderUsenRankingInfo([]);

    area.innerHTML =
      '<p class="request-ranking-empty">人気リクエスト曲の読み込みに失敗しました。</p>';
  }
}

// Spotifyの月間リスナー数と、取得できている場合のみ前日比を表示する。
function renderSpotifyListenerInfo(spotifyListener) {
  const countElement = spotifyListenerCountElement;

  if (!countElement) {
    return;
  }

  if (!spotifyListener || spotifyListener.today == null) {
    countElement.classList.add("hidden");
    countElement.innerHTML = "";
    return;
  }

  const today = toDisplayNumber(spotifyListener.today);
  const diff = toDisplayNumber(spotifyListener.diff);

  if (today === null) {
    countElement.classList.add("hidden");
    countElement.innerHTML = "";
    return;
  }

  const todayText = today.toLocaleString("ja-JP");

  let diffText = "";

  if (diff !== null && diff > 0) {
    diffText = `（前日比 ＋${diff.toLocaleString("ja-JP")}）`;
  }

  countElement.innerHTML = `
    <span class="spotify-listener-label">
      Spotify本日の月間リスナー数
    </span>
    <br>
    <strong>
      ${escapeHtml(todayText)}人${escapeHtml(diffText)}
    </strong>
  `;

  countElement.classList.remove("hidden");
}

// USEN推し活リクエストの最新順位を、30位以内に入っている曲だけ表示する。
function renderUsenRankingInfo(items) {
  const element = usenRankingInfoElement;

  if (!element) {
    return;
  }

  const rankingItems = Array.isArray(items)
    ? items.filter((item) => {
        const rank = Number(item.rank);
        return rank >= 1 && rank <= 30;
      })
    : [];

  if (rankingItems.length === 0) {
    element.classList.add("hidden");
    element.innerHTML = "";
    return;
  }

  element.innerHTML = rankingItems
    .map((item) => {
      const hour = escapeHtml(
        formatUsenHour(item.hour || item.capturedHour)
      );

      const rankNumber = Number(item.rank);
      const rank = escapeHtml(rankNumber);
      const songTitle = escapeHtml(
        item.songTitle || "タイトル不明"
      );

      const rankStatus =
        rankNumber <= 20
          ? {
              className: "usen-ranking-top20",
              text: "水曜18時まで20位以内をキープするとDAISOや松屋で流れるよ！",
            }
          : {
              className: "usen-ranking-top30",
              text: "水曜18時まで20位以内にあがるとDAISOや松屋で流れるよ！あと少し！",
            };

      return `
        <div class="usen-ranking-item ${rankStatus.className}">
          <span class="usen-ranking-line">
            ${hour}現在 USEN推し活リクエスト
            <strong>${rank}位！</strong>
            <span class="usen-ranking-status">${rankStatus.text}</span>
          </span>

          <span class="usen-ranking-song">
            <strong>${songTitle}</strong>
          </span>
        </div>
      `;
    })
    .join("");

  element.classList.remove("hidden");
}

// 時刻文字列・日時文字列のどちらでも「H:mm」形式へ整形する。
function formatUsenHour(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  const date = new Date(text);

  if (!Number.isNaN(date.getTime())) {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return text;
}

// 数値・カンマ付き文字列を安全に数値化し、扱えない値はnullにする。
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

// 直近データからリクエスト曲だけを順位順に上位3件取得する。
function getRequestRankingItems(items) {
  return items
    .filter((item) => item.taskType === "requestSong")
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .slice(0, 3);
}

// 将来「今週」表示を追加する場合の取得処理。現時点では描画には未使用。
function getThisWeekRequestRankingItems(items) {
  return items
    .filter((item) => {
      return item.taskType === "requestSong" && item.weekLabel === "今週";
    })
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .slice(0, 3);
}

// ランキング本体のHTMLを生成する。
// 人気リクエスト曲の先頭1件は常時表示し、残りの曲とUSEN順位は折り畳み内へ表示する。
function renderRequestRanking({
  recentRequestItems,
  usenRankingItems,
}) {
  return `
    <div class="request-ranking-content" data-expanded="false">
      ${renderRequestRankingBlock(
        { main: "人気リクエスト曲", ruby: "request ranking" },
        recentRequestItems,
        usenRankingItems
      )}

      <button
        type="button"
        id="requestRankingToggleButton"
        class="request-ranking-toggle"
      >
        もっと見る
      </button>
    </div>
  `;
}

function renderRequestRankingBlock(title, items, usenRankingItems) {
  const firstItem = items[0];
  const hiddenItems = items.slice(1);

  return `
    <section class="request-ranking-block">
      <h2 class="request-ranking-title ruby-h">
        <ruby>
          ${escapeHtml(title.main)}
          <rt>${escapeHtml(title.ruby)}</rt>
        </ruby>
      </h2>

      <div class="request-ranking-main">
        ${
          firstItem
            ? renderRequestRankingItem(firstItem)
            : '<p class="request-ranking-empty">データなし</p>'
        }
      </div>

      <div class="request-ranking-extra">
        ${hiddenItems.map(renderRequestRankingItem).join("")}

        ${renderRequestRankingUsenBlock(usenRankingItems)}
      </div>
    </section>
  `;
}

// 人気リクエスト曲の折り畳み内に表示するUSEN順位。
// 1〜20位と21〜30位で見た目・文言を分けられるclassを付与する。
function renderRequestRankingUsenBlock(items) {
  const rankingItems = Array.isArray(items)
    ? items
        .filter((item) => {
          const rank = Number(item.rank);
          return rank >= 1 && rank <= 30;
        })
        .sort((a, b) => Number(a.rank) - Number(b.rank))
    : [];

  if (rankingItems.length === 0) {
    return "";
  }

  return `
    <section class="request-ranking-usen">
      <h3 class="request-ranking-usen-title">
        USEN推し活リクエスト順位
      </h3>

      <div class="request-ranking-usen-list">
        ${rankingItems
          .map((item) => {
            const rankNumber = Number(item.rank);
            const rank = escapeHtml(rankNumber);
            const songTitle = escapeHtml(
              item.songTitle || "タイトル不明"
            );

            const hour = escapeHtml(
              formatUsenHour(item.hour || item.capturedHour)
            );

            const rankStatus =
              rankNumber <= 20
                ? {
                    className: "is-top20",
                    text: "超いい感じ！水曜18時まで20位以内をキープするとDAISOや松屋で流れるよ！",
                  }
                : {
                    className: "is-top30",
                    text: "いい感じ！水曜18時まで20位以内にあがるとDAISOや松屋で確実に流れるよ！",
                  };

            return `
              <div class="request-ranking-usen-item ${rankStatus.className}">
                <div class="request-ranking-usen-rank-row">
                  <span class="request-ranking-usen-rank">${rank}位</span>
                  <span class="request-ranking-usen-status">
                    ${rankStatus.text}
                  </span>
                </div>

                <strong class="request-ranking-usen-song">
                  ${songTitle}
                </strong>

                ${
                  hour
                    ? `<span class="request-ranking-usen-time">${hour}現在</span>`
                    : ""
                }
              </div>
            `;
          })
          .join("")}
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
        <span class="request-ranking-song-title">
          ${escapeHtml(title)}
        </span>
      </span>
    </div>
  `;
}

// 折り畳み対象がある場合だけ「もっと見る」を表示する。
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

    button.textContent = nextExpanded
      ? "閉じる"
      : "もっと見る";
  });
}

// 外部JSON由来の文字列をHTMLへ埋め込む前にエスケープする。
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
