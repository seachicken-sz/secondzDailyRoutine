const { chromium } = require("playwright");

const ARTIST_NAME = "timelesz";
const RANKING_URL = "https://usen.oshireq.com/";

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
  });

  const parts = formatter.formatToParts(now);
  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  const date = `${values.year}-${values.month}-${values.day}`;
  const hour = `${values.hour}:00`;
  const capturedHour = `${values.year}-${values.month}-${values.day}T${values.hour}:00:00+09:00`;
  const createdAt = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`;

  return {
    date,
    hour,
    capturedHour,
    createdAt,
  };
}

function normalizeText(text) {
  return text ? text.trim() : "";
}

function extractNumber(text) {
  const numericText = String(text || "").replace(/[^\d]/g, "");

  if (!numericText) {
    return null;
  }

  return Number(numericText);
}

async function scrollToBottom(page) {
  let previousHeight = 0;
  let previousItemCount = 0;
  let stableCount = 0;

  while (stableCount < 3) {
    const currentHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });

    const currentItemCount = await page.locator("li").count();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1200);

    const isHeightStable = currentHeight === previousHeight;
    const isItemCountStable = currentItemCount === previousItemCount;

    if (isHeightStable && isItemCountStable) {
      stableCount += 1;
    } else {
      stableCount = 0;
    }

    previousHeight = currentHeight;
    previousItemCount = currentItemCount;
  }

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  await page.waitForTimeout(500);
}

async function getTextOrEmpty(locator) {
  const count = await locator.count();

  if (count === 0) {
    return "";
  }

  const text = await locator.first().textContent();
  return normalizeText(text);
}

async function getAttributeOrEmpty(locator, name) {
  const count = await locator.count();

  if (count === 0) {
    return "";
  }

  const value = await locator.first().getAttribute(name);
  return value || "";
}

async function getTimeleszRankingItems(page) {
  const artistElements = page.locator("dd", {
    hasText: /^timelesz$/,
  });

  const count = await artistElements.count();

  const results = [];

  for (let i = 0; i < count; i++) {
    const artistElement = artistElements.nth(i);
    const item = artistElement.locator("xpath=ancestor::li[1]");
    const link = item.locator("a").first();

    const valueText = await getTextOrEmpty(item.locator("h4"));
    const songTitle = await getTextOrEmpty(item.locator("dt"));
    const href = await getAttributeOrEmpty(link, "href");
    const songId = await getAttributeOrEmpty(link, "id");

    if (!valueText || !songTitle) {
      continue;
    }

    const url = href ? new URL(href, RANKING_URL).toString() : "";

    results.push({
      valueText,
      valueNumber: extractNumber(valueText),
      artist: ARTIST_NAME,
      songTitle,
      songId,
      url,
    });
  }

  return results;
}

async function captureRankingItems() {
  if (!RANKING_URL || RANKING_URL === "ここにランキングページURL") {
    throw new Error("RANKING_URL is not set.");
  }

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1280,
        height: 1200,
      },
      locale: "ja-JP",
    });

    console.log(`Opening ranking page: ${RANKING_URL}`);

    await page.goto(RANKING_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    console.log("Page loaded. Waiting for ranking list...");

    await page.waitForSelector("li", {
      state: "visible",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    await scrollToBottom(page);

    const items = await getTimeleszRankingItems(page);

    console.log(`Captured timelesz ranking items: ${items.length}`);

    return items;
  } finally {
    await browser.close();
  }
}

async function sendToSpreadsheet(snapshot) {
  if (!RANKING_WEB_APP_URL) {
    throw new Error("RANKING_WEB_APP_URL is not set.");
  }

  const payload = {
    type: "timeleszRequestRanking",
    ...snapshot,
  };

  console.log("Sending to spreadsheet...");
  console.log(
    `POST URL is set: ${RANKING_WEB_APP_URL.startsWith(
      "https://script.google.com/macros/s/"
    )}`
  );
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch(RANKING_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  console.log(`Spreadsheet response status: ${response.status}`);
  console.log(`Spreadsheet final URL: ${response.url}`);
  console.log(`Spreadsheet redirected: ${response.redirected}`);
  console.log("Spreadsheet sync response:");
  console.log(responseText);

  if (!response.ok) {
    throw new Error(
      `Spreadsheet sync failed: ${response.status} ${responseText}`
    );
  }
}

async function main() {
  const { date, hour, capturedHour, createdAt } = getJstDateParts();

  const items = await captureRankingItems();

  const snapshot = {
    date,
    hour,
    capturedHour,
    artist: ARTIST_NAME,
    sourceUrl: RANKING_URL,
    itemCount: items.length,
    items,
    createdAt,
  };

  await sendToSpreadsheet(snapshot);

  console.log("Saved timelesz request ranking data to spreadsheet:");
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error("Failed to capture timelesz request ranking data.");
  console.error(error);
  process.exit(1);
});
