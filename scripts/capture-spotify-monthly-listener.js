const { chromium } = require("playwright");

const ARTIST_NAME = "timelesz";
const ARTIST_ID = "1ZFfhzyXjPvbzSYPlCIwo3";
const ARTIST_URL = `https://open.spotify.com/intl-ja/artist/${ARTIST_ID}`;

const SPOTIFY_WEB_APP_URL = process.env.SPOTIFY_WEB_APP_URL;

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
  });

  const parts = formatter.formatToParts(now);
  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    capturedAt: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`,
    createdAt: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`,
  };
}

function extractListenerCount(listenerText) {
  const numericText = String(listenerText || "").replace(/[^\d]/g, "");

  if (!numericText) {
    throw new Error(`Could not extract listener count from: ${listenerText}`);
  }

  return Number(numericText);
}

async function getMonthlyListenerText() {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1280,
        height: 900,
      },
      locale: "ja-JP",
    });

    console.log(`Opening Spotify artist page: ${ARTIST_URL}`);

    await page.goto(ARTIST_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const listenerElement = page
      .getByText(/月間リスナー|monthly listeners/i)
      .first();

    await listenerElement.waitFor({
      state: "visible",
      timeout: 30000,
    });

    const listenerText = await listenerElement.textContent();

    if (!listenerText) {
      throw new Error("Monthly listener text is empty.");
    }

    return listenerText.trim();
  } finally {
    await browser.close();
  }
}

async function sendToSpreadsheet(record) {
  if (!SPOTIFY_WEB_APP_URL) {
    throw new Error("SPOTIFY_WEB_APP_URL is not set.");
  }

  const payload = {
    type: "spotifyMonthlyListener",
    ...record,
  };

  console.log("Sending Spotify monthly listener to spreadsheet...");
  console.log(
    `POST URL is set: ${SPOTIFY_WEB_APP_URL.startsWith(
      "https://script.google.com/macros/s/"
    )}`
  );
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch(SPOTIFY_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  console.log(`Spreadsheet response status: ${response.status}`);
  console.log("Spreadsheet sync response:");
  console.log(responseText);

  if (!response.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${response.status} ${responseText}`
    );
  }
}

async function main() {
  const { date, capturedAt, createdAt } = getJstDateParts();

  const listenerText = await getMonthlyListenerText();
  const listenerCount = extractListenerCount(listenerText);

  const record = {
    date,
    capturedAt,
    artist: ARTIST_NAME,
    artistId: ARTIST_ID,
    listenerText,
    listenerCount,
    sourceUrl: ARTIST_URL,
    createdAt,
  };

  await sendToSpreadsheet(record);

  console.log("Saved Spotify monthly listener data to spreadsheet:");
  console.log(JSON.stringify(record, null, 2));
}

main().catch((error) => {
  console.error("Failed to capture Spotify monthly listener data.");
  console.error(error);
  process.exit(1);
});
