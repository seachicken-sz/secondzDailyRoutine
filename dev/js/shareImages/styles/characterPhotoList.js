// ==================================================
// チェキ風＋リストスタイル用フォント
// ==================================================
const CHARACTER_PHOTO_LIST_TITLE_FONT = '"Darumadrop One", "Zen Maru Gothic", sans-serif';
const CHARACTER_PHOTO_LIST_TEXT_FONT = '"Zen Maru Gothic", sans-serif';
const CHARACTER_PHOTO_LIST_HAND_FONT = '"Klee One", "Yomogi", sans-serif';
const CHARACTER_PHOTO_LIST_CHEKI_FONT = '"Caveat", cursive';;

// ==================================================
// チェキ風＋リストスタイル設定
// ==================================================
const CHARACTER_PHOTO_LIST = {
  topPadding: 64,
  titleX:10,
  titleY: 100,
  headerY: 160,
  photoX: 52,
  photoY: 30,
  photoW: 330,
  photoH: 460,
  infoX: 430,
  infoY: 184,
  infoW: 578,
  infoRowH: 76,
  infoGap: 20,
  taskCardX: 72,
  taskCardY: 560,
  taskCardW: 936,
  taskTitleH: 96,
  taskRowH: 76,
  taskBottomPadding: 54,
  bottomPadding: 60
};

// ==================================================
// チェキ風＋リストスタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.characterPhotoList = async function ({
  canvas,
  ctx,
  theme,
  themeKey,
  dateText,
  titleText,
  tasks,
  userName = "",
  characterImage = null,
  characterThemeKey = themeKey
}) {
  const colors = getCharacterPhotoListColors(theme);
  const taskCount = Math.max(tasks.length, 1);
  const taskCardH =
    CHARACTER_PHOTO_LIST.taskTitleH +
    taskCount * CHARACTER_PHOTO_LIST.taskRowH +
    CHARACTER_PHOTO_LIST.taskBottomPadding;

  const neededHeight =
    CHARACTER_PHOTO_LIST.taskCardY +
    taskCardH +
    CHARACTER_PHOTO_LIST.bottomPadding;
    
  const characterComment = getCharacterPhotoListComment(theme, characterThemeKey);

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCharacterPhotoListBackground(ctx, canvas, colors);
  drawCharacterPhotoListTopTitle(ctx, colors);
  drawCharacterPhotoListCheki(ctx, colors, characterImage, characterComment);
  drawCharacterPhotoListInfo(ctx, colors, dateText, userName);
  drawCharacterPhotoListTaskCard(ctx, colors, tasks);
  drawCharacterPhotoListStamp(ctx, canvas, colors);
};

// ==================================================
// 色取得
// ==================================================
function getCharacterPhotoListColors(theme) {
  return {
    main: theme.main || "#e85b4f",
    pale: theme.pale || "#fff7f5",
    dusty: theme.dusty || "#d79a9a",
    line: theme.line || "#ead0d0",
    paper: theme.paper || "#fff8ee",
    paperSecond: theme.paperSecond || "#fffdf8",
    ink: theme.ink || "#3f332f",
    mutedInk: theme.mutedInk || theme.dusty || "#8b7770",
    photoBg: theme.photoBg || theme.pale || "#fff0f2",
    shadow: theme.shadow || "rgba(88, 62, 42, 0.16)",
    accent: theme.main || "#e85b4f"
  };
}
// ==================================================
// キャラコメント取得
// ==================================================
function getCharacterPhotoListComment(theme, characterThemeKey) {
  const characterTheme = SHARE_IMAGE_THEMES[characterThemeKey];
  return characterTheme?.characterComment || theme.characterComment || "";
}

// ==================================================
// 背景
// ==================================================
function drawCharacterPhotoListBackground(ctx, canvas, colors) {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCharacterPhotoListPaperNoise(ctx, canvas);
  drawCharacterPhotoListDotPattern(ctx, canvas, colors);
  drawCharacterPhotoListCornerDecor(ctx, canvas, colors);
}

// ==================================================
// 紙粒
// ==================================================
function drawCharacterPhotoListPaperNoise(ctx, canvas) {
  ctx.save();

  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < 180; i++) {
    const x = (i * 83) % canvas.width;
    const y = (i * 149) % canvas.height;
    const r = 0.8 + (i % 3) * 0.45;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.save();

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#c9bba8";

  for (let i = 0; i < 80; i++) {
    const x = (i * 137 + 41) % canvas.width;
    const y = (i * 91 + 29) % canvas.height;
    const w = 2 + (i % 4);
    const h = 1;

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

// ==================================================
// 小ドット背景
// ==================================================
function drawCharacterPhotoListDotPattern(ctx, canvas, colors) {
  ctx.save();

  ctx.globalAlpha = 0.13;
  ctx.fillStyle = colors.accent;

  for (let y = 44; y < canvas.height; y += 88) {
    for (let x = 52; x < canvas.width; x += 92) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ==================================================
// 背景角装飾
// ==================================================
function drawCharacterPhotoListCornerDecor(ctx, canvas, colors) {
  ctx.save();

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.arc(70, 84, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(canvas.width - 52, 112, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(66, canvas.height - 70, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.save();

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  drawCharacterPhotoListSparkle(ctx, 944, 78, 22);
  drawCharacterPhotoListSparkle(ctx, 110, 606, 18);
  drawCharacterPhotoListSparkle(ctx, 948, 584, 16);

  ctx.restore();
}

// ==================================================
// 上部タイトル
// ==================================================
function drawCharacterPhotoListTopTitle(ctx, colors) {
  ctx.save();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.font = `62px ${CHARACTER_PHOTO_LIST_TITLE_FONT}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = colors.accent;

  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 7;

  ctx.strokeText("Tasks Complete!", CANVAS_WIDTH / 2, CHARACTER_PHOTO_LIST.titleY);
  ctx.fillText("Tasks Complete!", CANVAS_WIDTH / 2, CHARACTER_PHOTO_LIST.titleY);

  ctx.restore();
}

// ==================================================
// チェキ
// ==================================================
function drawCharacterPhotoListCheki(ctx, colors, characterImage, characterComment) {
  const x = CHARACTER_PHOTO_LIST.photoX;
  const y = CHARACTER_PHOTO_LIST.photoY;
  const w = CHARACTER_PHOTO_LIST.photoW;
  const h = CHARACTER_PHOTO_LIST.photoH;
  const framePadding = 22;
  const bottomSpace = 40;
  const innerX = x + framePadding;
  const innerY = y + framePadding;
  const innerW = w - framePadding * 2;
  const innerH = h - framePadding * 2 - bottomSpace;

  ctx.save();

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.035);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 12;

  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.restore();

  ctx.save();

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.035);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  roundRect(ctx, innerX, innerY, innerW, innerH, 16);
  ctx.fillStyle = colors.photoBg;
  ctx.fill();

  drawCharacterPhotoListPhotoPattern(ctx, innerX, innerY, innerW, innerH, colors);

  if (characterImage) {
    drawCharacterPhotoListImageInPhoto(ctx, characterImage, innerX, innerY, innerW, innerH);
  } else {
    drawCharacterPhotoListPlaceholder(ctx, innerX, innerY, innerW, innerH, colors);
  }

  drawCharacterPhotoListChekiComment(ctx, colors, characterComment, x, y, w, h);
  ctx.restore();

  drawCharacterPhotoListTape(ctx, x + 34, y - 16, 120, 34, -0.18, colors);
  drawCharacterPhotoListTape(ctx, x + w - 112, y + h - 24, 126, 34, 0.16, colors);
}

// ==================================================
// チェキ下コメント
// ==================================================
function drawCharacterPhotoListChekiComment(ctx, colors, comment, x, y, w, h) {
  if (!comment) return;

  ctx.save();
  ctx.fillStyle = colors.line;
  ctx.font = `700 24px ${CHARACTER_PHOTO_LIST_CHEKI_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const text = getEllipsizedText(ctx, comment, w - 54);
  ctx.fillText(text, x + w / 2, y + h - 28);

  ctx.restore();
}

// ==================================================
// チェキ内パターン
// ==================================================
function drawCharacterPhotoListPhotoPattern(ctx, x, y, w, h, colors) {
  ctx.save();

  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  for (let i = -h; i < w; i += 28) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";

  for (let yy = y + 28; yy < y + h; yy += 54) {
    for (let xx = x + 26; xx < x + w; xx += 56) {
      ctx.beginPath();
      ctx.arc(xx, yy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ==================================================
// チェキ内キャラ画像
// ==================================================
function drawCharacterPhotoListImageInPhoto(ctx, image, x, y, w, h) {
  const maxW = w * 0.96;
  const maxH = h * 0.9;
  const ratio = image.width / image.height;

  let drawH = maxH;
  let drawW = drawH * ratio;

  if (drawW > maxW) {
    drawW = maxW;
    drawH = drawW / ratio;
  }

  const drawX = x + (w - drawW) / 2;
  const drawY = y + h - drawH + -10;

  ctx.save();
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

// ==================================================
// キャラなし時
// ==================================================
function drawCharacterPhotoListPlaceholder(ctx, x, y, w, h, colors) {
  ctx.save();

  ctx.fillStyle = hexToRgba(colors.accent, 0.18);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 - 12, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  drawCharacterPhotoListHeartPath(ctx, x + w / 2, y + h / 2 + 8, 42);
  ctx.fill();

  ctx.restore();
}

// ==================================================
// 情報欄
// ==================================================
function drawCharacterPhotoListInfo(ctx, colors, dateText, userName) {
  const items = [
    { label: "name", value: userName || "-", icon: "♡" },
    { label: "date", value: dateText || "-", icon: "◇" },
    { label: "tool", value: "タムごとDaily", icon: "✓" }
  ];

  items.forEach((item, index) => {
    const x = CHARACTER_PHOTO_LIST.infoX;
    const y =
      CHARACTER_PHOTO_LIST.infoY +
      index * (CHARACTER_PHOTO_LIST.infoRowH + CHARACTER_PHOTO_LIST.infoGap);

    drawCharacterPhotoListInfoCard(ctx, x, y, CHARACTER_PHOTO_LIST.infoW, CHARACTER_PHOTO_LIST.infoRowH, item, colors);
  });
}

// ==================================================
// 情報カード
// ==================================================
function drawCharacterPhotoListInfoCard(ctx, x, y, w, h, item, colors) {
  ctx.save();

  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = colors.paperSecond;
  ctx.fill();

  ctx.restore();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, 22);

  ctx.save();

  ctx.fillStyle = hexToRgba(colors.accent, 0.12);
  roundRect(ctx, x + 18, y + 17, 42, 42, 14);
  ctx.fill();

  ctx.fillStyle = colors.accent;
  ctx.font = `700 24px ${CHARACTER_PHOTO_LIST_TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(item.icon, x + 39, y + h / 2);

  ctx.textAlign = "left";
  ctx.font = `700 24px ${CHARACTER_PHOTO_LIST_TEXT_FONT}`;
  ctx.fillText(item.label, x + 76, y + h / 2 - 13);

  ctx.fillStyle = colors.ink;
  ctx.font = `500 28px ${CHARACTER_PHOTO_LIST_TEXT_FONT}`;
  drawEllipsizedText(ctx, item.value, x + 76, y + h / 2 + 18, w - 104);

  ctx.restore();
}

// ==================================================
// タスクカード
// ==================================================
function drawCharacterPhotoListTaskCard(ctx, colors, tasks) {
  const x = CHARACTER_PHOTO_LIST.taskCardX;
  const y = CHARACTER_PHOTO_LIST.taskCardY;
  const w = CHARACTER_PHOTO_LIST.taskCardW;
  const rowH = CHARACTER_PHOTO_LIST.taskRowH;
  const taskItems = tasks.length > 0 ? tasks : ["タスクを入力してください"];
  const cardH =
    CHARACTER_PHOTO_LIST.taskTitleH +
    taskItems.length * rowH +
    CHARACTER_PHOTO_LIST.taskBottomPadding;

  ctx.save();

  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 13;

  roundRect(ctx, x, y, w, cardH, 30);
  ctx.fillStyle = colors.paperSecond;
  ctx.fill();

  ctx.restore();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2.5;
  roundRectStroke(ctx, x, y, w, cardH, 30);

  drawCharacterPhotoListTaskHeader(ctx, x, y, w, colors);

  taskItems.forEach((task, index) => {
    drawCharacterPhotoListTaskRow(
      ctx,
      x + 44,
      y + CHARACTER_PHOTO_LIST.taskTitleH + index * rowH,
      w - 88,
      rowH,
      task,
      index,
      colors
    );
  });
}

// ==================================================
// タスク見出し
// ==================================================
function drawCharacterPhotoListTaskHeader(ctx, x, y, w, colors) {
  ctx.save();

  ctx.fillStyle = colors.accent;
  ctx.font = `700 31px ${CHARACTER_PHOTO_LIST_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Today’s Tasks", x + 58, y + 52);

  ctx.restore();
}

// ==================================================
// タスク行
// ==================================================
function drawCharacterPhotoListTaskRow(ctx, x, y, w, h, task, index, colors) {
  ctx.save();

  const markX = x + 24;
  const centerY = y + h / 2 - 2;

  if (index % 2 === 0) {
    ctx.fillStyle = hexToRgba(colors.accent, 0.14);
  } else {
    ctx.fillStyle = hexToRgba(colors.dusty, 0.16);
  }

  roundRect(ctx, x, y + 8, w, h - 16, 18);
  ctx.fill();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x + 72, y + h - 9);
  ctx.lineTo(x + w - 24, y + h - 9);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = index % 2 === 0 ? colors.accent : colors.dusty;
  ctx.beginPath();
  ctx.arc(markX, centerY, 16, 0, Math.PI * 2);
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
  ctx.font = `600 30px ${CHARACTER_PHOTO_LIST_TEXT_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawEllipsizedText(ctx, task, x + 62, centerY, w - 92);

  ctx.restore();
}

// ==================================================
// スタンプ
// ==================================================
function drawCharacterPhotoListStamp(ctx, canvas, colors) {
  const x = canvas.width - 250;
  const y = CHARACTER_PHOTO_LIST.taskCardY + 10;

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(0.2);

  ctx.strokeStyle = hexToRgba(colors.accent, 0.56);
  ctx.lineWidth = 3;
  ctx.fillStyle = "rgba(255,255,255,0.54)";

  roundRect(ctx, 0, 0, 164, 58, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.accent;
  ctx.font = `32px ${CHARACTER_PHOTO_LIST_TITLE_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DONE!", 82, 31);

  ctx.restore();
}

// ==================================================
// マステ
// ==================================================
function drawCharacterPhotoListTape(ctx, x, y, w, h, rotate, colors) {
  ctx.save();

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotate);
  ctx.translate(-w / 2, -h / 2);

  ctx.fillStyle = hexToRgba(colors.accent, 0.25);
  roundRect(ctx, 0, 0, w, h, 8);
  ctx.fill();

  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(14 + i * 16, h / 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ==================================================
// キラッと記号
// ==================================================
function drawCharacterPhotoListSparkle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.32, y - size * 0.32);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.32, y + size * 0.32);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.32, y + size * 0.32);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * 0.32, y - size * 0.32);
  ctx.closePath();
  ctx.stroke();
}

// ==================================================
// ハートパス
// ==================================================
function drawCharacterPhotoListHeartPath(ctx, x, y, size) {
  const s = size / 32;

  ctx.beginPath();
  ctx.moveTo(x, y + 10 * s);
  ctx.bezierCurveTo(x - 28 * s, y - 12 * s, x - 15 * s, y - 34 * s, x, y - 18 * s);
  ctx.bezierCurveTo(x + 15 * s, y - 34 * s, x + 28 * s, y - 12 * s, x, y + 10 * s);
}