const { chromium } = require("playwright");

const ARTIST_NAME = "timelesz";
const ARTIST_ID = "1ZFfhzyXjPvbzSYPlCIwo3";
const SPOTIFY_URL =
  `https://open.spotify.com/intl-ja/artist/${ARTIST_ID}`;

const RANKING_WEB_APP_URL =
  process.env.RANKING_WEB_APP_URL;

// ==================================================
// JST日時
// ==================================================

function getJstDateParts() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  const date =
    `${values.year}-${values.month}-${values.day}`;

  const capturedAt =
    `${date}T${values.hour}:${values.minute}:${values.second}+09:00`;

  return {
    date,
    capturedAt,
    createdAt: capturedAt,
  };
}

// ==================================================
// 共通
// ==================================================

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseListenerCount(listenerText) {
  const text = normalizeText(listenerText);

  const match = text.match(
    /([\d,]+)\s*(?:人の月間リスナー|monthly listeners)/i
  );

  if (!match) {
    return null;
  }

  const listenerCount = Number(
    match[1].replace(/,/g, "")
  );

  if (!Number.isFinite(listenerCount)) {
    return null;
  }

  return listenerCount;
}

// ==================================================
// Spotify月間リスナー取得
// ==================================================

async function captureSpotifyMonthlyListener() {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 1200,
      },
      locale: "ja-JP",
    });

    const page = await context.newPage();

    console.log(
      `Opening Spotify artist page: ${SPOTIFY_URL}`
    );

    await page.goto(SPOTIFY_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    const artistPage = page.locator(
      'section[data-testid="artist-page"]'
    );

    await artistPage.waitFor({
      state: "visible",
      timeout: 60000,
    });

    /*
     * SpotifyはDOMContentLoaded後に
     * 月間リスナー数が描画されることがあるので、
     * テキストが出るまで待つ。
     */
    await page.waitForFunction(
      () => {
        const artistPage = document.querySelector(
          'section[data-testid="artist-page"]'
        );

        if (!artistPage) {
          return false;
        }

        const text =
          artistPage.textContent || "";

        return (
          /[\d,]+\s*人の月間リスナー/.test(text) ||
          /[\d,]+\s*monthly listeners/i.test(text)
        );
      },
      null,
      {
        timeout: 60000,
      }
    );

    /*
     * class名はSpotify側で変更される可能性があるため、
     * classではなく表示テキストから探す。
     *
     * 添付HTMLでは、
     * artist-pageヘッダー内に
     * 「704,761人の月間リスナー」
     * のような形で表示されている。
     */
    const listenerElements = artistPage.getByText(
      /[\d,]+\s*(?:人の月間リスナー|monthly listeners)/i
    );

    const listenerElementCount =
      await listenerElements.count();

    console.log(
      `Monthly listener text candidates: ${listenerElementCount}`
    );

    let listenerText = "";

    for (
      let i = 0;
      i < listenerElementCount;
      i += 1
    ) {
      const candidate =
        listenerElements.nth(i);

      const text = normalizeText(
        await candidate.textContent()
      );

      if (
        /[\d,]+\s*(?:人の月間リスナー|monthly listeners)/i.test(
          text
        )
      ) {
        listenerText = text;
        break;
      }
    }

    /*
     * getByTextで取れなかった場合の保険として、
     * artist-page全体から正規表現で抽出する。
     */
    if (!listenerText) {
      const artistPageText = normalizeText(
        await artistPage.textContent()
      );

      const fallbackMatch =
        artistPageText.match(
          /[\d,]+\s*(?:人の月間リスナー|monthly listeners)/i
        );

      if (fallbackMatch) {
        listenerText =
          normalizeText(fallbackMatch[0]);
      }
    }

    if (!listenerText) {
      const debugText = normalizeText(
        await artistPage.textContent()
      );

      console.log(
        "Spotify artist page text:"
      );

      console.log(
        debugText.slice(0, 5000)
      );

      throw new Error(
        "Spotify monthly listener text was not found."
      );
    }

    const listenerCount =
      parseListenerCount(listenerText);

    if (listenerCount === null) {
      throw new Error(
        `Spotify monthly listener count could not be parsed: ${listenerText}`
      );
    }

    console.log(
      `Captured Spotify monthly listener: ${listenerText}`
    );

    console.log(
      `Listener count: ${listenerCount}`
    );

    return {
      listenerText,
      listenerCount,
    };
  } finally {
    await browser.close();
  }
}

// ==================================================
// GASへPOST
// ==================================================

async function sendToSpreadsheet(snapshot) {
  if (!RANKING_WEB_APP_URL) {
    throw new Error(
      "RANKING_WEB_APP_URL is not set."
    );
  }

  const payload = {
    type: "spotifyMonthlyListener",
    ...snapshot,
  };

  console.log(
    "Sending Spotify monthly listener to spreadsheet..."
  );

  console.log(
    `POST URL is set: ${RANKING_WEB_APP_URL.startsWith(
      "https://script.google.com/macros/s/"
    )}`
  );

  console.log(
    "POST payload:"
  );

  console.log(
    JSON.stringify(payload, null, 2)
  );

  const response = await fetch(
    RANKING_WEB_APP_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const responseText =
    await response.text();

  console.log(
    `Spreadsheet response status: ${response.status}`
  );

  console.log(
    "Spreadsheet sync response:"
  );

  console.log(responseText);

  if (!response.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${response.status} ${responseText}`
    );
  }

  let result;

  try {
    result =
      JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Spreadsheet response is not JSON: ${responseText}`
    );
  }

  if (!result.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${
        result.error || responseText
      }`
    );
  }

  return result;
}

// ==================================================
// メイン
// ==================================================

async function main() {
  const {
    date,
    capturedAt,
    createdAt,
  } = getJstDateParts();

  const {
    listenerText,
    listenerCount,
  } =
    await captureSpotifyMonthlyListener();

  const snapshot = {
    date,
    capturedAt,
    artist: ARTIST_NAME,
    artistId: ARTIST_ID,
    listenerText,
    listenerCount,
    sourceUrl: SPOTIFY_URL,
    createdAt,
  };

  await sendToSpreadsheet(snapshot);

  console.log(
    "Saved Spotify monthly listener:"
  );

  console.log(
    JSON.stringify(snapshot, null, 2)
  );
}

main().catch((error) => {
  console.error(
    "Failed to capture Spotify monthly listener."
  );

  console.error(error);

  process.exit(1);
});
