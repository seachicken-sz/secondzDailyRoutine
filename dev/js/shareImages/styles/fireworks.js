// ==================================================
// 花火＋ガラスカード用フォント
// ==================================================
const FIREWORKS_TITLE_FONT = '"Klee One", sans-serif';
const FIREWORKS_TEXT_FONT = '"Klee One", sans-serif';

// ==================================================
// 花火画像設定
// _01：右上の大きい花火
// _02：左下の小さい花火
// ==================================================
const FIREWORKS_IMAGE_BASE_PATH = "../img/shareImg/fireworks/";
const FIREWORKS_THEME_KEYS = ["red", "purple", "green", "sky", "lime", "pink", "yellow", "white"];
const FIREWORKS_LOGO_PATH = "../img/shareImg/fireworks/fireworks_text.png";
// ==================================================
// 花火スタイル設定
// ==================================================
const FIREWORKS_LAYOUT = {
  paddingX: 72,
  titleY: 95,
  dateY: 180,
  panelX: 120,
  panelY: 225,
  panelW: 840,
  panelPaddingX: 64,
  panelPaddingTop: 56,
  panelHeaderH: 112,
  taskRowH: 76,
  panelBottomPadding: 74,
  largeFireworkSize: 680,
  largeFireworkRight: -48,
  largeFireworkTop: 65,
  smallFireworkSize: 360,
  smallFireworkLeft: 0,
  smallFireworkBottom: 360,
  logoW: 420,
  logoRight: 38,
  logoBottom: 55,
  logoRotate: -0.08,
  logoAlpha: 1,
  creditBottom: 340,
  bottomPadding: 380,
};


// ==================================================
// 花火＋ガラスカード描画
// ==================================================
SHARE_IMAGE_RENDERERS.fireworks = async function ({ canvas, ctx, theme, themeKey, dateText, titleText, tasks, userName = "" }) {
  const colors = getFireworksColors(theme);
  const taskItems = tasks.length > 0 ? tasks : ["タスクを入力してください"];
  const panelH =  taskItems.length * FIREWORKS_LAYOUT.taskRowH + FIREWORKS_LAYOUT.panelBottomPadding;
  const neededHeight = FIREWORKS_LAYOUT.panelY + panelH + FIREWORKS_LAYOUT.bottomPadding;
  const selection = getFireworksSelection(themeKey);
  const [largeFireworkImage, smallFireworkImage, logoImage] = await Promise.all([loadFireworksImage(selection.largePath), loadFireworksImage(selection.smallPath), loadFireworksImage(FIREWORKS_LOGO_PATH)]);

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFireworksNightSky(ctx, canvas, colors);
  drawFireworksGlow(ctx, canvas, colors);
  drawFireworksImage(ctx, largeFireworkImage, canvas.width - FIREWORKS_LAYOUT.largeFireworkSize - FIREWORKS_LAYOUT.largeFireworkRight, FIREWORKS_LAYOUT.largeFireworkTop, FIREWORKS_LAYOUT.largeFireworkSize, 0.96);
  drawFireworksImage(ctx, smallFireworkImage, FIREWORKS_LAYOUT.smallFireworkLeft, canvas.height - FIREWORKS_LAYOUT.smallFireworkSize - FIREWORKS_LAYOUT.smallFireworkBottom, FIREWORKS_LAYOUT.smallFireworkSize, 0.88);
  drawFireworksGlassPanel(ctx, colors, panelH);
  drawFireworksDate(ctx, colors, dateText);
  drawFireworksTitle(ctx, colors, titleText);
  drawFireworksTasks(ctx, colors, taskItems);
  drawFireworksCredit(ctx, canvas, colors, userName);
  drawFireworksLogo(ctx, canvas, logoImage);
};

// ==================================================
// 色取得
// ==================================================
function getFireworksColors(theme) {
  return {
    main: theme.main || "#3fbfa8",
    pale: theme.pale || "#f2fbf8",
    line: theme.line || "#c9e7df",
    ink: theme.ink || "#ffffff",
    mutedInk: theme.mutedInk || "#d7e6ef",
    shadow: theme.shadow || "rgba(0, 0, 0, 0.26)",
    skyTop: "#061127",
    skyMiddle: "#0a2347",
    skyBottom: "#102e54",
    glassTop: "rgba(255, 255, 255, 0.20)",
    glassBottom: "rgba(255, 255, 255, 0.09)",
    glassLine: "rgba(255, 255, 255, 0.34)",
    glassHighlight: "rgba(255, 255, 255, 0.28)"
  };
}

// ==================================================
// 花火選択
// normal：大・小を8色から別々にランダム選択
// その他：選択テーマ色を固定
// ==================================================
function getFireworksSelection(themeKey) {
  let largeThemeKey = themeKey;
  let smallThemeKey = themeKey;

  if (themeKey === "normal") {
    largeThemeKey = getRandomFireworksThemeKey();
    smallThemeKey = getRandomFireworksThemeKey();
  }

  if (!FIREWORKS_THEME_KEYS.includes(largeThemeKey)) largeThemeKey = "red";
  if (!FIREWORKS_THEME_KEYS.includes(smallThemeKey)) smallThemeKey = "red";

  return {
    largeThemeKey,
    smallThemeKey,
    largePath: `${FIREWORKS_IMAGE_BASE_PATH}${largeThemeKey}_01.png`,
    smallPath: `${FIREWORKS_IMAGE_BASE_PATH}${smallThemeKey}_02.png`
  };
}


// ==================================================
// ランダムテーマ取得
// ==================================================
function getRandomFireworksThemeKey() {
  return FIREWORKS_THEME_KEYS[Math.floor(Math.random() * FIREWORKS_THEME_KEYS.length)];
}

// ==================================================
// 花火画像読み込み
// ==================================================
function loadFireworksImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn("花火画像の読み込みに失敗しました", src);
      resolve(null);
    };
    image.src = src;
  });
}

// ==================================================
// 夜空背景
// ==================================================
function drawFireworksNightSky(ctx, canvas, colors) {
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  backgroundGradient.addColorStop(0, colors.skyTop);
  backgroundGradient.addColorStop(0.55, colors.skyMiddle);
  backgroundGradient.addColorStop(1, colors.skyBottom);
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawFireworksNebula(ctx, canvas);
  drawFireworksStars(ctx, canvas);
  drawFireworksShootingStars(ctx, canvas);
  drawFireworksHorizon(ctx, canvas);
}

// ==================================================
// 星雲
// ==================================================
function drawFireworksNebula(ctx, canvas) {
  const nebula1 = ctx.createRadialGradient(canvas.width * 0.18, canvas.height * 0.18, 0, canvas.width * 0.18, canvas.height * 0.18, canvas.width * 0.48);
  nebula1.addColorStop(0, "rgba(81, 112, 205, 0.24)");
  nebula1.addColorStop(0.45, "rgba(67, 76, 161, 0.10)");
  nebula1.addColorStop(1, "rgba(20, 31, 75, 0)");
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nebula2 = ctx.createRadialGradient(canvas.width * 0.82, canvas.height * 0.35, 0, canvas.width * 0.82, canvas.height * 0.35, canvas.width * 0.42);
  nebula2.addColorStop(0, "rgba(73, 168, 185, 0.14)");
  nebula2.addColorStop(0.55, "rgba(35, 94, 145, 0.07)");
  nebula2.addColorStop(1, "rgba(10, 27, 58, 0)");
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// 星
// ==================================================
function drawFireworksStars(ctx, canvas) {
  ctx.save();

  for (let i = 0; i < 150; i++) {
    const x = ((i * 157 + 47) % 997) / 997 * canvas.width;
    const y = ((i * 263 + 91) % 991) / 991 * canvas.height * 0.87;
    const radius = 0.8 + (i % 5) * 0.34;
    const alpha = 0.28 + (i % 7) * 0.08;

    ctx.globalAlpha = Math.min(alpha, 0.86);
    ctx.fillStyle = i % 6 === 0 ? "#ffe6a0" : "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  const sparklePoints = [
    { x: 82, y: 145, size: 8 },
    { x: 265, y: 78, size: 6 },
    { x: 585, y: 132, size: 7 },
    { x: 948, y: 345, size: 9 },
    { x: 754, y: 555, size: 6 },
    { x: 194, y: 632, size: 8 }
  ];

  sparklePoints.forEach((point) => drawFireworksSparkle(ctx, point.x, point.y, point.size));
}

// ==================================================
// 星のきらめき
// ==================================================
function drawFireworksSparkle(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 229, 151, 0.82)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();
  ctx.restore();
}

// ==================================================
// 流れ星
// ==================================================
function drawFireworksShootingStars(ctx, canvas) {
  drawFireworksShootingStar(ctx, canvas.width * 0.12, canvas.height * 0.12, 118, 54);
  drawFireworksShootingStar(ctx, canvas.width * 0.72, canvas.height * 0.30, 78, 34);
}

function drawFireworksShootingStar(ctx, x, y, length, drop) {
  const gradient = ctx.createLinearGradient(x, y, x + length, y + drop);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.75, "rgba(189, 211, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + length, y + drop);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x + length, y + drop, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ==================================================
// 地平線
// ==================================================
// ==================================================
// 地平線
// 山＋地面を単色で描画
// ==================================================
function drawFireworksHorizon(ctx, canvas) {
  const horizonY = canvas.height * 0.82;
  const groundColor = "#061020";

  ctx.save();
  ctx.fillStyle = groundColor;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(0, horizonY + 42);
  ctx.lineTo(canvas.width * 0.10, horizonY + 8);
  ctx.lineTo(canvas.width * 0.20, horizonY - 26);
  ctx.lineTo(canvas.width * 0.30, horizonY + 18);
  ctx.lineTo(canvas.width * 0.42, horizonY - 10);
  ctx.lineTo(canvas.width * 0.55, horizonY + 26);
  ctx.lineTo(canvas.width * 0.68, horizonY - 34);
  ctx.lineTo(canvas.width * 0.80, horizonY + 12);
  ctx.lineTo(canvas.width * 0.91, horizonY - 18);
  ctx.lineTo(canvas.width, horizonY + 20);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ==================================================
// テーマカラーの光
// ==================================================
function drawFireworksGlow(ctx, canvas, colors) {
  const glow = ctx.createRadialGradient(canvas.width * 0.75, canvas.height * 0.30, 0, canvas.width * 0.75, canvas.height * 0.30, canvas.width * 0.50);
  glow.addColorStop(0, hexToRgba(colors.main, 0.18));
  glow.addColorStop(0.55, hexToRgba(colors.main, 0.05));
  glow.addColorStop(1, hexToRgba(colors.main, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// 花火画像描画
// ==================================================
function drawFireworksImage(ctx, image, x, y, size, alpha) {
  if (!image) return;

  const ratio = image.width / image.height;
  let drawW = size;
  let drawH = drawW / ratio;

  if (drawH > size) {
    drawH = size;
    drawW = drawH * ratio;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(255, 255, 255, 0.28)";
  ctx.shadowBlur = 18;
  ctx.drawImage(image, x + (size - drawW) / 2, y + (size - drawH) / 2, drawW, drawH);
  ctx.restore();
}

// ==================================================
// ガラスパネル
// ==================================================
function drawFireworksGlassPanel(ctx, colors, panelH) {
  const x = FIREWORKS_LAYOUT.panelX;
  const y = FIREWORKS_LAYOUT.panelY;
  const w = FIREWORKS_LAYOUT.panelW;
  const h = panelH;
  const glassGradient = ctx.createLinearGradient(x, y, x, y + h);

  glassGradient.addColorStop(0, colors.glassTop);
  glassGradient.addColorStop(1, colors.glassBottom);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.52)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, x, y, w, h, 38);
  ctx.fillStyle = glassGradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colors.glassLine;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, 38);

  const highlightGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.34)");
  highlightGradient.addColorStop(0.42, "rgba(255, 255, 255, 0.05)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.14)");
  ctx.strokeStyle = highlightGradient;
  ctx.lineWidth = 4;
  roundRectStroke(ctx, x + 5, y + 5, w - 10, h - 10, 33);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.;
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < 36; i++) {
    const dotX = x + 30 + ((i * 79) % Math.max(1, w - 60));
    const dotY = y + 26 + ((i * 113) % Math.max(1, h - 52));
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ==================================================
// 日付
// ==================================================
function drawFireworksDate(ctx, colors, dateText) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.font = `600 25px ${FIREWORKS_TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dateText || "-", CANVAS_WIDTH / 2, FIREWORKS_LAYOUT.dateY);
  ctx.restore();
}

// ==================================================
// タイトル
// ==================================================
function drawFireworksTitle(ctx, colors, titleText) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `64px ${FIREWORKS_TITLE_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = hexToRgba(colors.main, 0.9);
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText("Task Complete!", CANVAS_WIDTH / 2, FIREWORKS_LAYOUT.titleY);

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillText("Task Complete!", CANVAS_WIDTH / 2, FIREWORKS_LAYOUT.titleY);
  ctx.fillText("Task Complete!", CANVAS_WIDTH / 2, FIREWORKS_LAYOUT.titleY);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colors.main;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2 - 120, FIREWORKS_LAYOUT.titleY + 50);
  ctx.lineTo(CANVAS_WIDTH / 2 + 120, FIREWORKS_LAYOUT.titleY + 50);
  ctx.stroke();
  ctx.restore();
}

// ==================================================
// タスク一覧
// ==================================================
function drawFireworksTasks(ctx, colors, tasks) {
  const startX = FIREWORKS_LAYOUT.panelX + FIREWORKS_LAYOUT.panelPaddingX;
  const startY = FIREWORKS_LAYOUT.panelY + 36;
  const contentW = FIREWORKS_LAYOUT.panelW - FIREWORKS_LAYOUT.panelPaddingX * 2;

  tasks.forEach((task, index) => {
    drawFireworksTaskRow(ctx, colors, task, index, startX, startY + index * FIREWORKS_LAYOUT.taskRowH, contentW);
  });
}

// ==================================================
// タスク行
// ==================================================
function drawFireworksTaskRow(ctx, colors, task, index, x, y, w) {
  const centerY = y + FIREWORKS_LAYOUT.taskRowH / 2;
  const markX = x + 20;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 58, y + FIREWORKS_LAYOUT.taskRowH - 6);
  ctx.lineTo(x + w, y + FIREWORKS_LAYOUT.taskRowH - 6);
  ctx.stroke();

  ctx.fillStyle = hexToRgba(colors.main, 0.22);
  ctx.strokeStyle = colors.main;
  ctx.lineWidth = 2.6;
  roundRect(ctx, markX - 16, centerY - 16, 32, 32, 8);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(markX - 8, centerY);
  ctx.lineTo(markX - 2, centerY + 7);
  ctx.lineTo(markX + 10, centerY - 8);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 30px ${FIREWORKS_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.81)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  drawEllipsizedText(ctx, task, x + 58, centerY, w - 70);
  ctx.restore();
}

// ==================================================
// クレジット
// ==================================================
function drawFireworksCredit(ctx, canvas, colors, userName) {
  const creditText = userName ? `${userName}  |  Made with タムごとDaily` : "Made with タムごとDaily";

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
  ctx.font = `500 23px ${FIREWORKS_TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(creditText, canvas.width / 2, canvas.height - FIREWORKS_LAYOUT.creditBottom);
  ctx.restore();
}

// ==================================================
// 右下ロゴ
// ==================================================
function drawFireworksLogo(ctx, canvas, image) {
  if (!image) return;

  const drawW = FIREWORKS_LAYOUT.logoW;
  const drawH = drawW * (image.height / image.width);
  const centerX = canvas.width - FIREWORKS_LAYOUT.logoRight - drawW / 2;
  const centerY = canvas.height - FIREWORKS_LAYOUT.logoBottom - drawH / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(FIREWORKS_LAYOUT.logoRotate);
  ctx.globalAlpha = FIREWORKS_LAYOUT.logoAlpha;
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}