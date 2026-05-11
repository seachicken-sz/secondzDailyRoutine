// ==================================================
// SNSシェア画像生成
// ==================================================
// カラー定義
const SHARE_IMAGE_THEMES = {
  red: {
    name: "red",
    bg1: "#ff6b6b",
    bg2: "#ffd1d1",
    accent: "#ff4d4d",
    text: "#2b1a1a",
    soft: "#fff7f7",
  },
  purple: {
    name: "purple",
    bg1: "#a98cff",
    bg2: "#dfd3ff",
    accent: "#8664e8",
    text: "#251a3d",
    soft: "#f7f3ff",
  },
  green: {
    name: "green",
    bg1: "#4bd17f",
    bg2: "#c8f5d8",
    accent: "#24b85f",
    text: "#123324",
    soft: "#f3fff7",
  },
  blue: {
    name: "blue",
    bg1: "#75d8f6",
    bg2: "#d8f7ff",
    accent: "#35afd6",
    text: "#12313b",
    soft: "#f3fcff",
  },
  lime: {
    name: "lime",
    bg1: "#b9e84e",
    bg2: "#eefbc8",
    accent: "#93c900",
    text: "#263312",
    soft: "#fbfff1",
  },
  pink: {
    name: "pink",
    bg1: "#ff8fbd",
    bg2: "#ffddea",
    accent: "#ff5c9d",
    text: "#3b1730",
    soft: "#fff5fa",
  },
  yellow: {
    name: "yellow",
    bg1: "#ffd95e",
    bg2: "#fff3b8",
    accent: "#f4aa00",
    text: "#3d2d0a",
    soft: "#fffdf2",
  },
  white: {
    name: "white",
    bg1: "#f4efe8",
    bg2: "#ffffff",
    accent: "#8f8174",
    text: "#332d28",
    soft: "#ffffff",
  },
  normal: {
    name: "normal",
    bg1: "#ff8ebc",
    bg2: "#ffd7e7",
    accent: "#ff4f93",
    text: "#3b1730",
    soft: "#fff4f8",
  },
};

function getShareImageTaskName(item) {
  if (!item) {
    return "";
  }

  return item["short-name"] || item.shortName || item.name || "";
}

function buildShareImageItems({
  selectedOnceTasks = [],
  completedDailyItems = [],
  extraItems = [],
}) {
  const items = [];

  selectedOnceTasks.forEach((item) => {
    const text = getShareImageTaskName(item);
    if (text) {
      items.push(text);
    }
  });

  completedDailyItems.forEach((item) => {
    const text = getShareImageTaskName(item);
    if (text) {
      items.push(text);
    }
  });

  extraItems.forEach((item) => {
    const text = typeof item === "string" ? item : getShareImageTaskName(item);
    if (text) {
      items.push(text);
    }
  });

  return items;
}

function drawShareImage(canvas, options) {
  const {
    themeKey = "red",
    dateText = "",
    appName = "タムごとDaily",
    title = "タスク完了",
    requestText = "",
    bgmText = "",
    items = [],
  } = options;

  const theme = SHARE_IMAGE_THEMES[themeKey] || SHARE_IMAGE_THEMES.red;

  const width = 1200;
  const padding = 56;
  const headerHeight = 290;
  const requestHeight = requestText ? 74 : 0;
  const rowBaseHeight = 76;
  const footerHeight = bgmText ? 112 : 54;

  const wrappedItems = items.map((text) => ({
    text,
    lines: wrapTextForMeasure(canvas, text, 760, "700 38px sans-serif"),
  }));

  const itemHeights = wrappedItems.map((item) => {
    return Math.max(rowBaseHeight, item.lines.length * 44 + 34);
  });

  const listHeight = itemHeights.reduce((sum, height) => sum + height, 0);
  const cardHeight = 42 + listHeight + 42;
  const height =
    padding +
    headerHeight +
    requestHeight +
    28 +
    cardHeight +
    footerHeight +
    padding;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  drawShareImageBackground(ctx, width, height, theme);
  drawShareImageDecorations(ctx, width, height, theme);

  let y = padding;

  drawShareImageHeader(ctx, {
    x: padding,
    y,
    width: width - padding * 2,
    dateText,
    appName,
    title,
    theme,
  });

  y += headerHeight;

  if (requestText) {
    drawPill(ctx, {
      x: padding + 70,
      y,
      width: width - padding * 2 - 140,
      height: 62,
      text: requestText,
      theme,
      fontSize: 30,
    });

    y += requestHeight;
  }

  y += 28;

  drawRoundedRect(ctx, {
    x: padding,
    y,
    width: width - padding * 2,
    height: cardHeight,
    radius: 32,
    fill: "rgba(255,255,255,0.94)",
    shadow: true,
  });

  let rowY = y + 42;

  wrappedItems.forEach((item, index) => {
    drawChecklistRow(ctx, {
      x: padding + 38,
      y: rowY,
      width: width - padding * 2 - 76,
      height: itemHeights[index],
      lines: item.lines,
      theme,
      showDivider: index < wrappedItems.length - 1,
    });

    rowY += itemHeights[index];
  });

  y += cardHeight + 36;

  if (bgmText) {
    drawPill(ctx, {
      x: padding + 170,
      y,
      width: width - padding * 2 - 340,
      height: 66,
      text: `🎧 本日のBGM「${bgmText}」`,
      theme,
      fontSize: 30,
    });
  }

  return canvas.toDataURL("image/png");
}

function drawShareImageBackground(ctx, width, height, theme) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, theme.bg1);
  gradient.addColorStop(1, theme.bg2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawShareImageHeader(ctx, params) {
  const { x, y, width, dateText, appName, title, theme } = params;

  drawRoundedRect(ctx, {
    x,
    y,
    width: 180,
    height: 118,
    radius: 28,
    fill: "rgba(255,255,255,0.96)",
    shadow: true,
  });

  ctx.fillStyle = theme.accent;
  ctx.font = "800 50px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dateText, x + 90, y + 65);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`「${appName}」`, x + 220, y + 62);

  ctx.font = "900 105px sans-serif";
  ctx.fillText(`${title} 👍`, x + 20, y + 215);

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 6;
  ctx.strokeText(`${title} 👍`, x + 20, y + 215);
}

function drawChecklistRow(ctx, params) {
  const { x, y, width, height, lines, theme, showDivider } = params;

  const checkSize = 42;
  const checkX = x + 10;
  const checkY = y + 18;

  drawRoundedRect(ctx, {
    x: checkX,
    y: checkY,
    width: checkSize,
    height: checkSize,
    radius: 10,
    fill: theme.accent,
    shadow: false,
  });

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(checkX + 11, checkY + 22);
  ctx.lineTo(checkX + 19, checkY + 31);
  ctx.lineTo(checkX + 33, checkY + 13);
  ctx.stroke();

  ctx.fillStyle = theme.text;
  ctx.font = "800 38px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const textX = x + 78;
  let textY = y + 16;

  lines.forEach((line) => {
    ctx.fillText(line, textX, textY);
    textY += 44;
  });

  if (showDivider) {
    ctx.strokeStyle = `${theme.accent}33`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + height - 1);
    ctx.lineTo(x + width, y + height - 1);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPill(ctx, params) {
  const { x, y, width, height, text, theme, fontSize } = params;

  drawRoundedRect(ctx, {
    x,
    y,
    width,
    height,
    radius: height / 2,
    fill: "rgba(255,255,255,0.94)",
    shadow: true,
  });

  ctx.fillStyle = theme.accent;
  ctx.font = `800 ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const fittedText = fitText(ctx, text, width - 56);
  ctx.fillText(fittedText, x + width / 2, y + height / 2);
}

function drawShareImageDecorations(ctx, width, height, theme) {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "38px sans-serif";

  const marks = ["✦", "♡", "♪", "✧"];

  for (let i = 0; i < 18; i += 1) {
    const mark = marks[i % marks.length];
    const x = 24 + ((i * 173) % (width - 80));
    const y = 34 + ((i * 241) % (height - 80));

    ctx.globalAlpha = 0.35;
    ctx.fillText(mark, x, y);
  }

  ctx.globalAlpha = 1;

  ctx.strokeStyle = `${theme.accent}66`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(width - 82, height - 86, 26, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRoundedRect(ctx, params) {
  const { x, y, width, height, radius, fill, shadow } = params;

  ctx.save();

  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  ctx.restore();
}

function wrapTextForMeasure(canvas, text, maxWidth, font) {
  const ctx = canvas.getContext("2d");
  ctx.font = font;

  const chars = Array.from(text);
  const lines = [];
  let line = "";

  chars.forEach((char) => {
    const nextLine = line + char;

    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
      return;
    }

    line = nextLine;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let result = text;

  while (result.length > 0 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}…`;
}
