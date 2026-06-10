// ==================================================
// キャラ付きシンプルカード用フォント
// ==================================================
const CHARACTER_SIMPLE_CARD_TITLE_FONT = '"Darumadrop One", "Zen Maru Gothic", sans-serif';
const CHARACTER_SIMPLE_CARD_TEXT_FONT = '"Zen Maru Gothic", sans-serif';

// ==================================================
// キャラ付きシンプルカード設定
// ==================================================
const CHARACTER_SIMPLE_CARD = {
  paddingX: 72,
  titleY: 80,
  dateX: 824,
  dateY: 215,
  dateW: 236,
  dateH: 54,
  taskCardX: 72,
  taskCardY: 190,
  taskCardW: 936,
  taskHeaderH: 120,
  taskRowH: 74,
  taskBottomPadding: 44,
  characterMaxH: 300,
  bottomPadding: 130
};

// ==================================================
// キャラ付きシンプルカード描画
// ==================================================
SHARE_IMAGE_RENDERERS.characterSimpleCard = async function ({ canvas, ctx, theme, themeKey, dateText, titleText, tasks, userName = "", characterImage = null, characterThemeKey = themeKey }) {
  const colors = getCharacterSimpleCardColors(theme);
  const taskItems = tasks.length > 0 ? tasks : ["タスクを入力してください"];
  const taskCardH = CHARACTER_SIMPLE_CARD.taskHeaderH + taskItems.length * CHARACTER_SIMPLE_CARD.taskRowH + CHARACTER_SIMPLE_CARD.taskBottomPadding;
  const neededHeight = CHARACTER_SIMPLE_CARD.taskCardY + taskCardH + CHARACTER_SIMPLE_CARD.bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCharacterSimpleCardBackground(ctx, canvas, colors);
  drawCharacterSimpleCardTitle(ctx, colors);
  drawCharacterSimpleCardTaskCard(ctx, colors, taskItems);
  drawCharacterSimpleCardDate(ctx, colors, dateText);
  drawCharacterSimpleCardCharacter(ctx, canvas, characterImage, colors);
  drawCharacterSimpleCardCredit(ctx, canvas, colors, userName);
};

// ==================================================
// 色取得
// ==================================================
function getCharacterSimpleCardColors(theme) {
  return {
    main: theme.main || "#e85b4f",
    pale: theme.pale || "#fff7f5",
    dusty: theme.dusty || "#d79a9a",
    line: theme.line || "#ead0d0",
    paper: theme.paper || "#fff8ee",
    paperSecond: theme.paperSecond || "#fffdf8",
    ink: theme.ink || "#3f332f",
    mutedInk: theme.mutedInk || theme.dusty || "#8b7770",
    shadow: theme.shadow || "rgba(88, 62, 42, 0.16)"
  };
}

// ==================================================
// 背景
// ==================================================
function drawCharacterSimpleCardBackground(ctx, canvas, colors) {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// タイトル
// ==================================================
function drawCharacterSimpleCardTitle(ctx, colors) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `64px ${CHARACTER_SIMPLE_CARD_TITLE_FONT}`;
  ctx.fillStyle = colors.main;
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillText("Tasks Complete!", CHARACTER_SIMPLE_CARD.paddingX, CHARACTER_SIMPLE_CARD.titleY);
  ctx.restore();
}

// ==================================================
// 日付
// ==================================================
function drawCharacterSimpleCardDate(ctx, colors, dateText) {
  const x = CHARACTER_SIMPLE_CARD.dateX;
  const y = CHARACTER_SIMPLE_CARD.dateY;
  const h = CHARACTER_SIMPLE_CARD.dateH;
  const text = dateText || "-";
  const textX = x;
  const textY = y + h / 2 - 2;
  const lineY = y + h - 6;

  ctx.save();
  ctx.fillStyle = colors.mutedInk;
  ctx.font = `700 25px ${CHARACTER_SIMPLE_CARD_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, textX, textY);

  const textWidth = ctx.measureText(text).width;
  const baseCharWidth = ctx.measureText("0").width;
  const leftExtra = baseCharWidth * 1.8;
  const rightExtra = baseCharWidth * 0.8;

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(textX - leftExtra, lineY);
  ctx.lineTo(textX + textWidth + rightExtra, lineY);
  ctx.stroke();
  ctx.restore();
}

// ==================================================
// タスクカード
// ==================================================
function drawCharacterSimpleCardTaskCard(ctx, colors, tasks) {
  const x = CHARACTER_SIMPLE_CARD.taskCardX;
  const y = CHARACTER_SIMPLE_CARD.taskCardY;
  const w = CHARACTER_SIMPLE_CARD.taskCardW;
  const h = CHARACTER_SIMPLE_CARD.taskHeaderH + tasks.length * CHARACTER_SIMPLE_CARD.taskRowH + CHARACTER_SIMPLE_CARD.taskBottomPadding;

  ctx.save();
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, x, y, w, h, 30);
  ctx.fillStyle = colors.paperSecond;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, 30);

  drawCharacterSimpleCardTaskHeader(ctx, x, y, w, colors);
  tasks.forEach((task, index) => {
    drawCharacterSimpleCardTaskRow(ctx, x + 44, y + CHARACTER_SIMPLE_CARD.taskHeaderH + index * CHARACTER_SIMPLE_CARD.taskRowH, w - 88, CHARACTER_SIMPLE_CARD.taskRowH, task, index, colors);
  });
}

// ==================================================
// タスク見出し
// ==================================================
function drawCharacterSimpleCardTaskHeader(ctx, x, y, w, colors) {
  ctx.save();
  ctx.fillStyle = colors.main;
  ctx.font = `700 34px ${CHARACTER_SIMPLE_CARD_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Today’s Tasks", x + 42, y + 52);
  ctx.restore();
}

// ==================================================
// タスク行
// ==================================================
function drawCharacterSimpleCardTaskRow(ctx, x, y, w, h, task, index, colors) {
  const markX = x + 23;
  const centerY = y + h / 2 - 1;

  ctx.save();
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 62, y + h - 8);
  ctx.lineTo(x + w - 10, y + h - 8);
  ctx.stroke();

  ctx.fillStyle = colors.main;
  ctx.beginPath();
  ctx.arc(markX, centerY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(markX - 7, centerY);
  ctx.lineTo(markX - 2, centerY + 6);
  ctx.lineTo(markX + 9, centerY - 8);
  ctx.stroke();

  ctx.fillStyle = colors.ink;
  ctx.font = `600 30px ${CHARACTER_SIMPLE_CARD_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawEllipsizedText(ctx, task, x + 58, centerY, w - 92);
  ctx.restore();
}

// ==================================================
// キャラ描画
// ==================================================
function drawCharacterSimpleCardCharacter(ctx, canvas, image, colors) {
  if (!image) return;

  const maxH = CHARACTER_SIMPLE_CARD.characterMaxH;
  const drawH = Math.min(maxH, canvas.height * 0.28);
  const drawW = drawH * (image.width / image.height);
  const x = canvas.width - drawW - 58;
  const y = canvas.height - drawH - 20;

  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "rgba(80, 60, 45, 0.14)";
  ctx.beginPath();
  ctx.ellipse(x + drawW / 2, y + drawH - 8, drawW * 0.4, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.drawImage(image, x, y, drawW, drawH);
  ctx.restore();
}

// ==================================================
// クレジット
// ==================================================
function drawCharacterSimpleCardCredit(ctx, canvas, colors, userName) {
  const creditText = userName ? `${userName}  |  Made with タムごとDaily` : "Made with タムごとDaily";

  ctx.save();
  ctx.fillStyle = colors.mutedInk;
  ctx.font = `500 23px ${CHARACTER_SIMPLE_CARD_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(creditText, CHARACTER_SIMPLE_CARD.paddingX, canvas.height - 50);
  ctx.restore();
}