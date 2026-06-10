// ==================================================
// ゆめかわグラデスタイル用フォント
// ==================================================
const YUMEKAWA_TITLE_FONT = '"Hachi Maru Pop", sans-serif';
const YUMEKAWA_GRADIENT_FONT = '"Yomogi", sans-serif';

// ==================================================
// ゆめかわグラデスタイル設定
// ==================================================
const YUMEKAWA_GRADIENT = {
  headerHeight: 520,
  taskStartY: 610,
  taskRowHeight: 86,
  bottomPadding: 240,
  cardX: 90,
  cardW: 900
};

// ==================================================
// ゆめかわグラデスタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.yumekawaGradient = function ({canvas, ctx, theme, dateText, titleText, tasks, userName = ""}) {
  const neededHeight = YUMEKAWA_GRADIENT.headerHeight + tasks.length * YUMEKAWA_GRADIENT.taskRowHeight + YUMEKAWA_GRADIENT.bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

const color1 = theme.dream || theme.pale;
const color2 = theme.dreamSecond || theme.dream || theme.pale;
const accent1 = theme.dreamAccent || theme.dream || theme.main;
const accent2 = theme.dreamAccentSecond || theme.dreamSecond || theme.dream || theme.main;

  drawYumekawaGradientBackground(ctx, canvas, color1, color2, theme);
  drawYumekawaTitle(ctx, theme);
  drawYumekawaInfoCards(ctx, theme, dateText, userName);
  drawYumekawaTaskTitle(ctx, theme);
  drawYumekawaTasks(ctx, theme, tasks);
};

// ==================================================
// 背景グラデーション
// ハートとキラキラを重ねる
// ==================================================
function drawYumekawaGradientBackground(ctx, canvas, color1, color2, theme) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

  gradient.addColorStop(0, color1);
  gradient.addColorStop(0.48, "#fff8ff");
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

drawYumekawaHearts(ctx, canvas);
drawYumekawaDiagonalLaceRibbon(ctx, theme);
drawYumekawaSparkles(ctx, canvas);
}

// ==================================================
// 背景ハート
// ==================================================
function drawYumekawaHearts(ctx, canvas) {
  const hearts = [
    { x: 120, y: 165, size: 34, alpha: 0.20, rotate: -0.25 },
    { x: 930, y: 210, size: 24, alpha: 0.18, rotate: 0.20 },
    { x: 100, y: 780, size: 30, alpha: 0.17, rotate: 0.18 },
    { x: 940, y: 850, size: 38, alpha: 0.16, rotate: -0.18 },
    { x: 245, y: canvas.height - 150, size: 26, alpha: 0.14, rotate: -0.10 },
    { x: 865, y: canvas.height - 190, size: 28, alpha: 0.14, rotate: 0.15 }
  ];

  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  hearts.forEach((heart) => {
    ctx.save();
    ctx.globalAlpha = heart.alpha;
    ctx.translate(heart.x, heart.y);
    ctx.rotate(heart.rotate);
    drawYumekawaHeartPath(ctx, 0, 0, heart.size);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}
// ==================================================
// 左上レースリボン装飾
// ==================================================
function drawYumekawaLaceRibbon(ctx, theme) {
  const x = 42;
  const y = 38;
  const w = 245;
  const h = 74;
  const color1 = theme.dream || theme.main;
  const color2 = theme.dreamSecond || theme.dream || theme.main;

  ctx.save();

  ctx.globalAlpha = 0.88;
  ctx.shadowColor = "rgba(255,255,255,.75)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, 28);

  ctx.fillStyle = "rgba(255,255,255,.72)";
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(x + 24 + i * 25, y + h, 11, Math.PI, 0);
    ctx.fill();
  }

  ctx.strokeStyle = hexToRgba(color1, 0.42);
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x + 22, y + h / 2);
  ctx.lineTo(x + w - 22, y + h / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  drawYumekawaRibbon(ctx, x + 58, y + 36, color1, color2);

  ctx.restore();
}

// ==================================================
// 左上斜め掛けレースリボン
// ==================================================
function drawYumekawaDiagonalLaceRibbon(ctx, theme) {
  const color1 = theme.dream || theme.main;
  const color2 = theme.dreamSecond || theme.dream || theme.main;
  const ribbonGradient = ctx.createLinearGradient(-80, 0, 360, 0);

  ribbonGradient.addColorStop(0, color1);
  ribbonGradient.addColorStop(1, color2);

  ctx.save();

  ctx.translate(72, 34);
  ctx.rotate(-0.55);

  ctx.shadowColor = "rgba(255,255,255,.72)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;

  ctx.fillStyle = ribbonGradient;
  ctx.globalAlpha = 0.74;
  ctx.fillRect(-170, 0, 500, 88);

  ctx.globalAlpha = 0.48;
  ctx.fillStyle = "#fff";
  ctx.fillRect(-170, 14, 500, 12);
  ctx.fillRect(-170, 42, 500, 8);

  ctx.shadowBlur = 0;
  drawYumekawaRibbonLaceEdge(ctx, -170, 0, 500, 88);

  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = "rgba(255,255,255,.88)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(-150, 34);
  ctx.lineTo(310, 34);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

// ==================================================
// 斜めリボンのレース縁
// ==================================================
function drawYumekawaRibbonLaceEdge(ctx, x, y, w, h) {
  ctx.save();

  ctx.globalAlpha = 0.86;
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.strokeStyle = "rgba(255,255,255,.86)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i <= 21; i++) {
    const laceX = x + i * 24;

    ctx.beginPath();
    ctx.arc(laceX, y, 11, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(laceX, y + h, 11, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
// ==================================================
// ハートのパス
// ==================================================
function drawYumekawaHeartPath(ctx, x, y, size) {
  const s = size / 32;

  ctx.beginPath();
  ctx.moveTo(x, y + 10 * s);
  ctx.bezierCurveTo(x - 28 * s, y - 12 * s, x - 15 * s, y - 34 * s, x, y - 18 * s);
  ctx.bezierCurveTo(x + 15 * s, y - 34 * s, x + 28 * s, y - 12 * s, x, y + 10 * s);
}

// ==================================================
// キラキラ装飾
// ==================================================
function drawYumekawaSparkles(ctx, canvas) {
  const sparkles = [
    { x: 190, y: 95, size: 16, alpha: 0.55 },
    { x: 820, y: 115, size: 13, alpha: 0.45 },
    { x: 970, y: 440, size: 18, alpha: 0.45 },
    { x: 80, y: 530, size: 15, alpha: 0.45 },
    { x: 900, y: 640, size: 12, alpha: 0.40 },
    { x: 150, y: canvas.height - 90, size: 14, alpha: 0.40 },
    { x: 720, y: canvas.height - 130, size: 17, alpha: 0.38 }
  ];

  ctx.save();
  ctx.fillStyle = "#fff";

  sparkles.forEach((sparkle) => {
    ctx.globalAlpha = sparkle.alpha;
    drawYumekawaSparkle(ctx, sparkle.x, sparkle.y, sparkle.size);
  });

  ctx.restore();
}

// ==================================================
// ひし形キラキラ
// ==================================================
function drawYumekawaSparkle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.25, y - size * 0.25, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.25, y + size * 0.25, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.25, y + size * 0.25, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.25, y - size * 0.25, x, y - size);
  ctx.fill();
}

// ==================================================
// メインタイトル
// ==================================================
function drawYumekawaTitle(ctx, theme) {
  const shadowColor = theme.main;

  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 64px ${YUMEKAWA_TITLE_FONT}`;

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = "#fff";
  ctx.fillText("Tasks Complete!", CANVAS_WIDTH / 2, 135);

  ctx.restore();
}

// ==================================================
// 名前・日付・ツール名カード
// ==================================================
function drawYumekawaInfoCards(ctx, theme, dateText, userName) {
  const infoItems = [
    { label: "name:", value: userName || "-", labelColor: theme.dream || theme.main },
    { label: "date:", value: dateText, labelColor: theme.dreamSecond || theme.main },
    { label: "tool:", value: "タムごとDaily", labelColor: theme.dream || theme.main}
  ];

  const x = 170;
  const w = 740;
  const h = 54;
  const startY = 210;
  const gap = 18;

  infoItems.forEach((item, index) => {
    const y = startY + index * (h + gap);

    drawYumekawaSoftCard(ctx, x, y, w, h, 22);

    ctx.textBaseline = "middle";
    ctx.font = `700 28px ${YUMEKAWA_GRADIENT_FONT}`;

    ctx.textAlign = "left";
    ctx.fillStyle = item.labelColor;
    ctx.fillText(item.label, x + 92, y + h / 2);

    ctx.fillStyle = "#888";
    drawEllipsizedText(ctx, item.value, x + 205, y + h / 2 - 0, w - 260);
  });
}

// ==================================================
// Today’s Tasks見出し
// ==================================================
function drawYumekawaTaskTitle(ctx, theme) {
  const color1 = theme.dream || theme.main;
  const color2 = theme.dreamSecond || theme.dream || theme.main;
  const gradient = ctx.createLinearGradient(300, 0, 780, 0);

  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.save();

  ctx.fillStyle = "#fff";
  ctx.shadowColor = theme.main;
  ctx.shadowBlur = 10;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 42px ${YUMEKAWA_TITLE_FONT}`;
  ctx.fillText("Today’s Tasks", CANVAS_WIDTH / 2, 520);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(355, 552);
  ctx.lineTo(725, 552);
  ctx.stroke();

  ctx.restore();
}

// ==================================================
// タスク一覧
// タスク全体を1枚の白背景カードにまとめる
// ==================================================
function drawYumekawaTasks(ctx, theme, tasks) {
  const x = YUMEKAWA_GRADIENT.cardX;
  const w = YUMEKAWA_GRADIENT.cardW;
  const rowH = YUMEKAWA_GRADIENT.taskRowHeight;
  const innerTop = 28;
  const innerBottom = 28;
  const cardH = tasks.length * rowH + innerTop + innerBottom;
  const textX = x + 95;
  const cardY = YUMEKAWA_GRADIENT.taskStartY - 24;
  const lineColor1 = theme.dream || theme.main;
  const lineColor2 = theme.dreamSecond || theme.dream || theme.main;

  drawYumekawaSoftCard(ctx, x, cardY, w, cardH, 28);

  tasks.forEach((task, index) => {
    const y = cardY + innerTop + index * rowH;
    const accentColor = index % 2 === 0 ? lineColor1 : lineColor2;

    // 交互カラーの丸アクセント
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + 48, y + rowH / 2 - 8, 13, 0, Math.PI * 2);
    ctx.fill();

    // タスク文字
    ctx.fillStyle = "#888888";
    ctx.font = `600 31px ${YUMEKAWA_GRADIENT_FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    drawEllipsizedText(ctx, task, textX, y + rowH / 2 - 8, 730);

    // 横グラデライン
    if (index < tasks.length - 1) {
      const lineGradient = ctx.createLinearGradient(x + 42, 0, x + w - 42, 0);
      lineGradient.addColorStop(0, lineColor1);
      lineGradient.addColorStop(1, lineColor2);

      ctx.strokeStyle = lineGradient;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 42, y + rowH - 12);
      ctx.lineTo(x + w - 42, y + rowH - 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

// ==================================================
// 白背景カード
// 影と半透明白でフチをぼかしたように見せる
// ==================================================
function drawYumekawaSoftCard(ctx, x, y, w, h, r) {
  ctx.save();

  ctx.shadowColor = "rgba(255,255,255,.95)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.fill();

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, r);
}
