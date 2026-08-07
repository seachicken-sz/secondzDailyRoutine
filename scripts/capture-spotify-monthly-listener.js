const { chromium } = require("playwright");

const ARTIST_NAME = "timelesz";
const ARTIST_ID = "1ZFfhzyXjPvbzSYPlCIwo3";
const SPOTIFY_URL = `https://open.spotify.com/artist/${ARTIST_ID}`;
const RANKING_WEB_APP_URL = process.env.RANKING_WEB_APP_URL;

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

  const capturedAt =
    `${values.year}-${values.month}-${values.day}` +
    `T${values.hour}:${values.minute}:${values.second}+09:00`;

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    capturedAt,
    createdAt: capturedAt,
  };
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListenerInfo(text) {
  const normalized = normalizeText(text);

  const patterns = [
    /([\d,]+)\s+monthly listeners/i,
    /([\d,]+)\s*(?:人の)?月間リスナー/i,
    /月間リスナー\s*([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const listenerCount = Number(
      String(match[1]).replace(/[^\d]/g, "")
    );

    if (!Number.isFinite(listenerCount)) {
      continue;
    }

    return {
      listenerText: normalizeText(match[0]),
      listenerCount,
    };
  }

  return null;
}

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
      locale: "en-US",
    });

    const page = await context.newPage();

    console.log(`Opening Spotify artist page: ${SPOTIFY_URL}`);

    await page.goto(SPOTIFY_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    await page.waitForSelector("body", {
      state: "visible",
      timeout: 60000,
    });

    /*
     * Spotifyはクライアント側でプロフィール情報を描画するため、
     * DOMContentLoaded直後では月間リスナー数がまだ存在しない場合がある。
     */
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";

        return (
          /[\d,]+\s+monthly listeners/i.test(text) ||
          /[\d,]+\s*(?:人の)?月間リスナー/i.test(text) ||
          /月間リスナー\s*[\d,]+/i.test(text)
        );
      },
      null,
      {
        timeout: 60000,
      }
    );

    const bodyText = await page.locator("body").innerText();

    const listenerInfo = extractListenerInfo(bodyText);

    if (!listenerInfo) {
      console.log("Spotify body text:");
      console.log(bodyText.slice(0, 5000));

      throw new Error(
        "Spotify monthly listener count was not found."
      );
    }

    console.log(
      `Captured Spotify monthly listener: ${listenerInfo.listenerCount}`
    );

    return listenerInfo;
  } finally {
    await browser.close();
  }
}

async function sendToSpreadsheet(snapshot) {
  if (!RANKING_WEB_APP_URL) {
    throw new Error("RANKING_WEB_APP_URL is not set.");
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
    `Listener count: ${snapshot.listenerCount}`
  );

  const response = await fetch(RANKING_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  console.log(
    `Spreadsheet response status: ${response.status}`
  );

  console.log("Spreadsheet sync response:");
  console.log(responseText);

  if (!response.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${response.status} ${responseText}`
    );
  }

  let result;

  try {
    result = JSON.parse(responseText);
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
}

async function main() {
  const {
    date,
    capturedAt,
    createdAt,
  } = getJstDateParts();

  const {
    listenerText,
    listenerCount,
  } = await captureSpotifyMonthlyListener();

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

  console.log("Saved Spotify monthly listener:");
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(
    "Failed to capture Spotify monthly listener."
  );
  console.error(error);
  process.exit(1);
});
