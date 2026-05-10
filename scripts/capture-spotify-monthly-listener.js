const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ARTIST_NAME = "timelesz";
const ARTIST_ID = "1ZFfhzyXjPvbzSYPlCIwo3";
const ARTIST_URL = `https://open.spotify.com/intl-ja/artist/${ARTIST_ID}`;

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "data",
  "spotifyMonthlyListenerJson.json"
);

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

  const date = `${values.year}-${values.month}-${values.day}`;
  const createdAt = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`;

  return {
    date,
    createdAt,
  };
}

function readCurrentHistory() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return [];
  }

  const rawText = fs.readFileSync(OUTPUT_PATH, "utf-8").trim();

  if (!rawText) {
    return [];
  }

  const parsed = JSON.parse(rawText);

  if (!Array.isArray(parsed)) {
    throw new Error("spotifyMonthlyListenerJson.json must be an array.");
  }

  return parsed;
}

function writeHistory(history) {
  const outputDir = path.dirname(OUTPUT_PATH);

  fs.mkdirSync(outputDir, {
    recursive: true,
  });

  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify(history, null, 2)}\n`,
    "utf-8"
  );
}

function extractListenerCount(listenerText) {
  const numericText = listenerText.replace(/[^\d]/g, "");

  if (!numericText) {
    throw new Error(`Could not extract listener count from: ${listenerText}`);
  }

  return Number(numericText);
}

function upsertTodayRecord(history, newRecord) {
  const existingIndex = history.findIndex((item) => {
    return item.date === newRecord.date;
  });

  if (existingIndex >= 0) {
    history[existingIndex] = {
      ...history[existingIndex],
      ...newRecord,
    };

    return history;
  }

  return [...history, newRecord];
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
    console.log("SPOTIFY_WEB_APP_URL is not set. Skip spreadsheet sync.");
    return;
  }

  const response = await fetch(SPOTIFY_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "spotifyMonthlyListener",
      ...record,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${response.status} ${responseText}`
    );
  }

  console.log("Spreadsheet sync response:");
  console.log(responseText);
}

async function main() {
  const { date, createdAt } = getJstDateParts();

  const listenerText = await getMonthlyListenerText();
  const listenerCount = extractListenerCount(listenerText);

  const currentHistory = readCurrentHistory();

  const newRecord = {
    date,
    artist: ARTIST_NAME,
    artistId: ARTIST_ID,
    listenerText,
    listenerCount,
    sourceUrl: ARTIST_URL,
    createdAt,
  };

  const nextHistory = upsertTodayRecord(currentHistory, newRecord);

  nextHistory.sort((a, b) => {
    return String(a.date).localeCompare(String(b.date));
  });

  writeHistory(nextHistory);

  await sendToSpreadsheet(newRecord);

  console.log("Saved Spotify monthly listener data:");
  console.log(JSON.stringify(newRecord, null, 2));
}

main().catch((error) => {
  console.error("Failed to capture Spotify monthly listener data.");
  console.error(error);
  process.exit(1);
});
