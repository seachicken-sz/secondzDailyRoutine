// ==================================================
// SNSシェア画像生成
// ==================================================

const SHARE_IMAGE_THEMES = {
  normal: {
    name: "normal",
    bg1: "#ecfff3",
    bg2: "#02b9a5",
    brand: "#02b9a5",
    accent: "#00b7c2",
    accentText: "#1b6b3a",
    surface: "#ffffff",
    surfaceSoft: "#f4fffc",
    border: "#bdebcf",
    text: "#1b6b3a",
    subText: "#333333",
    muted: "#666666",
  },
  red: {
    name: "red",
    bg1: "#fff1f2",
    bg2: "#ef4444",
    brand: "#ef4444",
    accent: "#f43f5e",
    accentText: "#991b1b",
    surface: "#ffffff",
    surfaceSoft: "#fff1f2",
    border: "#fecdd3",
    text: "#991b1b",
    subText: "#333333",
    muted: "#666666",
  },

  purple: {
    name: "purple",
    bg1: "#f5f3ff",
    bg2: "#8b5cf6",
    brand: "#8b5cf6",
    accent: "#a78bfa",
    accentText: "#5b21b6",
    surface: "#ffffff",
    surfaceSoft: "#f5f3ff",
    border: "#ddd6fe",
    text: "#5b21b6",
    subText: "#333333",
    muted: "#666666",
  },

  green: {
    name: "green",
    bg1: "#f0fdf4",
    bg2: "#22c55e",
    brand: "#22c55e",
    accent: "#16a34a",
    accentText: "#166534",
    surface: "#ffffff",
    surfaceSoft: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    subText: "#333333",
    muted: "#666666",
  },

  sky: {
    name: "sky",
    bg1: "#f0f9ff",
    bg2: "#38bdf8",
    brand: "#38bdf8",
    accent: "#0ea5e9",
    accentText: "#075985",
    surface: "#ffffff",
    surfaceSoft: "#f0f9ff",
    border: "#bae6fd",
    text: "#075985",
    subText: "#333333",
    muted: "#666666",
  },

  lime: {
    name: "lime",
    bg1: "#f7fee7",
    bg2: "#84cc16",
    brand: "#84cc16",
    accent: "#65a30d",
    accentText: "#365314",
    surface: "#ffffff",
    surfaceSoft: "#f7fee7",
    border: "#d9f99d",
    text: "#365314",
    subText: "#333333",
    muted: "#666666",
  },

  pink: {
    name: "pink",
    bg1: "#fff0f7",
    bg2: "#f472b6",
    brand: "#f472b6",
    accent: "#fb7185",
    accentText: "#9d174d",
    surface: "#ffffff",
    surfaceSoft: "#fff5f9",
    border: "#f9c5df",
    text: "#9d174d",
    subText: "#333333",
    muted: "#666666",
  },

  yellow: {
    name: "yellow",
    bg1: "#fefce8",
    bg2: "#ffde22",
    brand: "#ffde22",
    accent: "#eab308",
    accentText: "#713f12",
    surface: "#ffffff",
    surfaceSoft: "#fefce8",
    border: "#fde68a",
    text: "#713f12",
    subText: "#333333",
    muted: "#666666",
  },

  white: {
    name: "white",
    bg1: "#fcfcfc",
    bg2: "#c5c5c5",
    brand: "#111827",
    accent: "#111827",
    accentText: "#111827",
    surface: "#ffffff",
    surfaceSoft: "#ffffff",
    border: "#ffffff",
    text: "#111827",
    subText: "#111827",
    muted: "#4b5563",
  },
};

// simple = 今のロゴ
// illustrated = イラスト入りロゴ
// normal は一種固定なので simple / illustrated とも同じ画像
const SHARE_IMAGE_LOGO_PATHS = {
  normal: {
    simple: "../img/logo.png",
    illustrated: "../img/logo.png",
  },
  red: {
    simple: "../img/logo-red.png",
    illustrated: "../img/logo/logo-red-illust.png",
  },
  purple: {
    simple: "../img/logo-purple.png",
    illustrated: "../img/logo/logo-purple-illust.png",
  },
  green: {
    simple: "../img/logo-green.png",
    illustrated: "../img/logo/logo-green-illust.png",
  },
  sky: {
    simple: "../img/logo-sky.png",
    illustrated: "../img/logo/logo-sky-illust.png",
  },
  lime: {
    simple: "../img/logo-lime.png",
    illustrated: "../img/logo/logo-lime-illust.png",
  },
  pink: {
    simple: "../img/logo-pink.png",
    illustrated: "../img/logo/logo-pink-illust.png",
  },
  yellow: {
    simple: "../img/logo-yellow.png",
    illustrated: "../img/logo/logo-yellow-illust.png",
  },
  white: {
    simple: "../img/logo-white.png",
    illustrated: "../img/logo/logo-white-illust.png",
  },
};

const SHARE_IMAGE_SIMPLE_FONT_FAMILY =
  "'Hiragino Maru Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif";

const SHARE_IMAGE_ILLUSTRATED_FONT_FAMILY =
  "'Yomogi', 'Hiragino Maru Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif";

const SHARE_IMAGE_ILLUSTRATED_TITLE_FONT_FAMILY =
  "'Hachi Maru Pop', 'Yomogi', 'Hiragino Maru Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif";

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      resolve(null);
    };

    image.src = src;
  });
}

function getShareImageTheme(themeKey) {
  return SHARE_IMAGE_THEMES[themeKey] || SHARE_IMAGE_THEMES.normal;
}

function getShareImageStyle(themeKey, imageStyle) {
  if (themeKey === "normal") {
    return "simple";
  }

  return imageStyle === "illustrated" ? "illustrated" : "simple";
}

function getShareImageLogoPath(themeKey, imageStyle) {
  const safeThemeKey = SHARE_IMAGE_LOGO_PATHS[themeKey]
    ? themeKey
    : "normal";

  const safeStyle = getShareImageStyle(safeThemeKey, imageStyle);
  const logoPaths = SHARE_IMAGE_LOGO_PATHS[safeThemeKey];

  return logoPaths[safeStyle] || logoPaths.simple || "";
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = String(text || "").split("");
  const lines = [];
  let currentLine = "";

  chars.forEach((char) => {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
      return;
    }

    currentLine = testLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  const visibleLines = lines.slice(0, maxLines);

  visibleLines.forEach((line, index) => {
    const isLast = index === maxLines - 1 && lines.length > maxLines;
    const textToDraw = isLast
      ? `${line.slice(0, Math.max(0, line.length - 1))}…`
      : line;

    ctx.fillText(textToDraw, x, y + lineHeight * index);
  });

  return visibleLines.length * lineHeight;
}

function getWrappedLineCount(ctx, text, maxWidth, maxLines) {
  const chars = String(text || "").split("");
  const lines = [];
  let currentLine = "";

  chars.forEach((char) => {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
      return;
    }

    currentLine = testLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return Math.min(lines.length, maxLines);
}

// ==================================================
// シンプル版背景
// 既存背景をそのまま残す
// ==================================================

function drawShareImageSimpleBackground(ctx, width, height, theme) {
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, theme.bg2);
  bgGradient.addColorStop(1, theme.bg1);

  ctx.fillStyle = bgGradient;
  drawRoundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // 左上の白っぽいぼかし風
  const radial = ctx.createRadialGradient(47, 39, 0, 47, 39, 148);
  radial.addColorStop(0, "rgba(255, 255, 255, 0.90)");
  radial.addColorStop(0.42, "rgba(255, 255, 255, 0.42)");
  radial.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = radial;
  drawRoundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // 装飾丸 1
  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.beginPath();
  ctx.arc(width - 52 + 75, 52 + 75, 75, 0, Math.PI * 2);
  ctx.fill();

  // 装飾丸 2
  ctx.beginPath();
  ctx.arc(-44 + 55, height - 72 + 55, 55, 0, Math.PI * 2);
  ctx.fill();
}

// ==================================================
// イラスト版背景
// ロゴ画像の雰囲気に合わせたポップ背景
// ==================================================

function drawShareImageIllustratedBackground(ctx, width, height, theme) {
  // =========================
  // ベース背景
  // =========================

  const isWhiteTheme = theme.name === "white";

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  
  if (isWhiteTheme) {
    bgGradient.addColorStop(0, "#ffffff");
    bgGradient.addColorStop(0.55, "#f8fafc");
    bgGradient.addColorStop(1, "#e5e7eb");
  } else {
    bgGradient.addColorStop(0, theme.bg1);
    bgGradient.addColorStop(0.62, theme.surfaceSoft);
    bgGradient.addColorStop(1, hexToRgba(theme.brand, 0.16));
  }

  ctx.fillStyle = bgGradient;
  drawRoundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // =========================
  // 白い大きめぼかし
  // =========================

  const topLight = ctx.createRadialGradient(
    width - 56,
    42,
    0,
    width - 56,
    42,
    170
  );
  topLight.addColorStop(0, "rgba(255, 255, 255, 0.78)");
  topLight.addColorStop(0.42, "rgba(255, 255, 255, 0.30)");
  topLight.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = topLight;
  drawRoundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  const bottomLight = ctx.createRadialGradient(
    28,
    height - 36,
    0,
    28,
    height - 36,
    160
  );
  bottomLight.addColorStop(0, "rgba(255, 255, 255, 0.62)");
  bottomLight.addColorStop(0.44, "rgba(255, 255, 255, 0.24)");
  bottomLight.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = bottomLight;
  drawRoundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // =========================
  // 斜めの白帯
  // =========================

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(width - 120, -20);
  ctx.lineTo(width + 24, -20);
  ctx.lineTo(width - 20, 152);
  ctx.lineTo(width - 168, 152);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-24, height - 118);
  ctx.lineTo(112, height - 118);
  ctx.lineTo(46, height + 24);
  ctx.lineTo(-56, height + 24);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // =========================
  // ギザギザ風ステッカー帯
  // =========================

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";

  drawZigzagRibbon(ctx, -18, 72, 124, 26, 10);
  drawZigzagRibbon(ctx, width - 112, height - 104, 130, 26, 10);

  ctx.restore();

  // =========================
  // テーマ色の薄い丸
  // =========================

  ctx.fillStyle = isWhiteTheme
    ? "rgba(17, 24, 39, 0.06)"
    : hexToRgba(theme.brand, 0.16);

  ctx.beginPath();
  ctx.arc(width - 56, height - 52, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(58, 92, 24, 0, Math.PI * 2);
  ctx.fill();

  // =========================
  // ドット
  // =========================

  ctx.fillStyle = isWhiteTheme
    ? "rgba(17, 24, 39, 0.12)"
    : "rgba(255, 255, 255, 0.58)";

  const dots = [
    [42, 42, 3],
    [72, 58, 2],
    [328, 38, 2.5],
    [350, 92, 3],
    [34, height - 88, 2.5],
    [82, height - 42, 3],
    [318, height - 82, 2],
    [352, height - 44, 2.5],
  ];

  dots.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // =========================
  // キラキラ
  // =========================

  ctx.strokeStyle = isWhiteTheme
    ? "rgba(17, 24, 39, 0.16)"
    : "rgba(255, 255, 255, 0.62)";
  ctx.lineWidth = 1.4;

  drawSparkle(ctx, 304, 72, 8);
  drawSparkle(ctx, 54, height - 64, 7);
  drawSparkle(ctx, 354, height - 116, 6);
}

function drawZigzagRibbon(ctx, x, y, width, height, toothSize) {
  ctx.beginPath();
  ctx.moveTo(x, y);

  let currentX = x;
  let isUp = true;

  while (currentX <= x + width) {
    ctx.lineTo(currentX, isUp ? y - toothSize : y);
    currentX += toothSize;
    isUp = !isUp;
  }

  ctx.lineTo(x + width, y + height);

  currentX = x + width;
  isUp = true;

  while (currentX >= x) {
    ctx.lineTo(currentX, isUp ? y + height + toothSize : y + height);
    currentX -= toothSize;
    isUp = !isUp;
  }

  ctx.closePath();
  ctx.fill();
}

function drawSparkle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - size * 0.58, y - size * 0.58);
  ctx.lineTo(x + size * 0.58, y + size * 0.58);
  ctx.moveTo(x + size * 0.58, y - size * 0.58);
  ctx.lineTo(x - size * 0.58, y + size * 0.58);
  ctx.stroke();
}

// ==================================================
// SNSシェア画像描画
// ==================================================

async function drawShareImage(canvas, options = {}) {
  if (!canvas) {
    return;
  }

  const themeKey = options.themeKey || "normal";
  const theme = getShareImageTheme(themeKey);
  const imageStyle = getShareImageStyle(themeKey, options.imageStyle);
  const isIllustrated = imageStyle === "illustrated";

  const fontStyle = options.fontStyle === "handwritten"
    ? "handwritten"
    : "default";
  
  const isHandwrittenFont = fontStyle === "handwritten";
  
  const fontFamily = isHandwrittenFont
    ? SHARE_IMAGE_ILLUSTRATED_FONT_FAMILY
    : SHARE_IMAGE_SIMPLE_FONT_FAMILY;

  const titleFontFamily = isIllustrated
    ? SHARE_IMAGE_ILLUSTRATED_TITLE_FONT_FAMILY
    : SHARE_IMAGE_SIMPLE_FONT_FAMILY;

  const items = buildShareImageDisplayItems(options);

  // CSS preview: 390 x 487 を高解像度化
  const scale = 3;
  const width = 390;
  const minHeight = 487;

  // =========================
  // Layout Constants
  // =========================

  const outerPadding = 28;
  const cardX = outerPadding;
  const cardY = outerPadding;
  const cardWidth = width - outerPadding * 2;

  const innerPaddingX = 22;
  const innerPaddingTop = 18;
  const innerPaddingBottom = 22;

  const innerX = cardX + innerPaddingX;
  const innerY = cardY + innerPaddingTop;
  const innerWidth = cardWidth - innerPaddingX * 2;

  const titleY = innerY + 28;
  const listStartY = titleY + 47;

  const checkSize = 20.8;
  const textXOffset = 29;
  const textMaxWidth = innerWidth - textXOffset;

  const itemFontSize = 15;
  const itemLineHeight = 20.7;
  const itemBottomPadding = 5;
  const itemGap = 9;
  const maxLinesPerItem = 2;

  // =========================
  // 高さを事前計算
  // =========================

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `500 ${itemFontSize}px ${fontFamily}`;

  const itemHeights = items.map((item) => {
    const text = String(item || "").trim();

    if (!text) {
      return 0;
    }

    const lineCount = getWrappedLineCount(
      measureCtx,
      text,
      textMaxWidth,
      maxLinesPerItem
    );

    const textHeight = lineCount * itemLineHeight;
    const rowHeight = Math.max(itemLineHeight, textHeight);

    return rowHeight + itemBottomPadding + itemGap;
  });

  const listHeight = itemHeights.reduce((total, height) => total + height, 0);

  const logoPath = getShareImageLogoPath(themeKey, imageStyle);
  const logoImage = await loadImage(logoPath);

  const simpleLogoWidth = 280;
  const illustratedLogoWidth = simpleLogoWidth * (1200 / 1081);
  
  const logoWidth = isIllustrated
    ? illustratedLogoWidth
    : simpleLogoWidth;
  
  const logoHeight = logoImage
    ? logoWidth * (logoImage.height / logoImage.width)
    : 0;

  const logoTopMargin = logoImage ? 18 : 0;
  const logoBottomMargin = logoImage ? 4 : 0;
  const logoAreaHeight = logoImage
    ? logoTopMargin + logoHeight + logoBottomMargin
    : 0;

  const cardHeight = Math.max(
    minHeight - outerPadding * 2,
    listStartY - cardY + listHeight + logoAreaHeight + innerPaddingBottom
  );
  const height = Math.max(minHeight, cardHeight + outerPadding * 2);

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // =========================
  // 背景
  // =========================

  if (isIllustrated) {
    drawShareImageIllustratedBackground(ctx, width, height, theme);
  } else {
    drawShareImageSimpleBackground(ctx, width, height, theme);
  }

  // =========================
  // メインカード
  // =========================

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = isIllustrated
    ? "rgba(255, 255, 255, 0.82)"
    : "rgba(255, 255, 255, 0.63)";
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isIllustrated
    ? hexToRgba(theme.brand, theme.name === "white" ? 0.18 : 0.34)
    : hexToRgba(theme.border, 0.92);
  ctx.lineWidth = 1;
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
  ctx.stroke();

  // =========================
  // Head Wrap
  // =========================

  ctx.font = `600 14px ${fontFamily}`;
  ctx.fillStyle = hexToRgba(theme.accentText, 0.6);
  ctx.fillText(options.dateText || "", innerX, innerY);

  const label = "Today's Log";
  ctx.font = `600 13px ${fontFamily}`;
  ctx.fillStyle = theme.accent;
  const labelWidth = ctx.measureText(label).width;
  ctx.fillText(label, innerX + innerWidth - labelWidth, innerY);

  // =========================
  // Title
  // =========================

  ctx.font = `600 24px ${fontFamily}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(options.title || "タスク完了！", innerX, titleY);

  // =========================
  // List
  // =========================

  const listX = innerX;
  let currentY = listStartY;

  items.forEach((item) => {
    const text = String(item || "").trim();

    if (!text) {
      return;
    }

    const checkX = listX;
    const checkY = currentY - 1;
    const textX = listX + textXOffset;

    // チェック箱
    ctx.fillStyle = hexToRgba(theme.brand, 0.8);
    drawRoundRect(ctx, checkX, checkY, checkSize, checkSize, 4);
    ctx.fill();

    // チェックマーク
    ctx.save();
    ctx.fillStyle = theme.surfaceSoft;
    ctx.font = `700 13px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✓", checkX + checkSize / 2, checkY + checkSize / 2 + 0.5);
    ctx.restore();

    // テキスト
    ctx.fillStyle = theme.subText;
    ctx.font = `500 ${itemFontSize}px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const usedHeight = drawWrappedText(
      ctx,
      text,
      textX,
      currentY,
      textMaxWidth,
      itemLineHeight,
      maxLinesPerItem
    );

    // 下線
    const lineY =
      currentY + Math.max(itemLineHeight, usedHeight) + itemBottomPadding;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textX, lineY);
    ctx.lineTo(innerX + innerWidth, lineY);
    ctx.stroke();

    currentY = lineY + itemGap;
  });

  // =========================
  // Logo
  // =========================

  // =========================
  // Logo
  // =========================

  if (logoImage) {

    const logoX = innerX + (innerWidth - logoWidth) / 2;

    const logoY = Math.max(
      currentY + logoTopMargin,
      cardY + cardHeight - innerPaddingBottom - logoHeight - logoBottomMargin
    );

    ctx.drawImage(
      logoImage,
      logoX,
      logoY,
      logoWidth,
      logoHeight
    );
  }
}

function buildShareImageDisplayItems(options = {}) {
  const items = [];

  if (options.requestText) {
    items.push(options.requestText);
  }

  if (Array.isArray(options.items)) {
    options.items.forEach((item) => {
      if (item) {
        items.push(item);
      }
    });
  }

  if (options.bgmText) {
    items.push(options.bgmText);
  }

  return items;
}

function buildShareImageItems({
  selectedOnceTasks = [],
  completedDailyItems = [],
} = {}) {
  const items = [];

  selectedOnceTasks.forEach((task) => {
    const name =
      task?.["short-name"] ||
      task?.shortName ||
      task?.name ||
      "";

    if (name) {
      items.push(name);
    }
  });

  completedDailyItems.forEach((item) => {
    const name =
      item?.["short-name"] ||
      item?.shortName ||
      item?.name ||
      "";

    if (name) {
      items.push(name);
    }
  });

  return items;
}

function hexToRgba(hex, alpha = 1) {
  const normalized = String(hex || "").replace("#", "");

  if (normalized.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.drawShareImage = drawShareImage;
window.buildShareImageItems = buildShareImageItems;
