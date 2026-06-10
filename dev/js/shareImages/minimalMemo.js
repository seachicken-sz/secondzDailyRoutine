// ==================================================
// ミニマルメモスタイル用フォント
// ==================================================
const MINIMAL_MEMO_FONT = '"Zen Maru Gothic", sans-serif';

// ==================================================
// ミニマルメモスタイル設定
// ==================================================
const MINIMAL_MEMO = {
  headerHeight: 300,
  taskStartY: 300,
  taskRowHeight: 82,
  bottomPadding: 200,
  outerX: 70,
  outerY: 70,
  outerW: 940,
  headerH: 165
};

// ==================================================
// ミニマルメモスタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.minimalMemo = function ({canvas, ctx, theme, dateText, titleText, tasks, userName = ""}) {
  const neededHeight = MINIMAL_MEMO.headerHeight + tasks.length * MINIMAL_MEMO.taskRowHeight + MINIMAL_MEMO.bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMinimalMemoBackground(ctx, canvas);
  drawMinimalMemoFrame(ctx, canvas, theme);
  drawMinimalMemoHeader(ctx, theme, titleText,dateText);
  drawMinimalMemoTasks(ctx, theme, tasks);
  drawToolCredit(ctx, canvas, MINIMAL_MEMO_FONT, userName, hexToRgba(theme.main, 0.62));
};

// ==================================================
// 背景
// ==================================================
function drawMinimalMemoBackground(ctx, canvas) {
  ctx.fillStyle = "#fbfaf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// 外枠・上部帯
// ==================================================
function drawMinimalMemoFrame(ctx, canvas, theme) {
  const { outerX, outerY, outerW, headerH } = MINIMAL_MEMO;
  const outerH = canvas.height - outerY * 2;
  const borderW = 16;

  // 外枠色のベース
  ctx.fillStyle = theme.dusty;
  ctx.fillRect(outerX, outerY, outerW, outerH);

  // 内側の白地
  ctx.fillStyle = "#fffefc";
  ctx.fillRect(
    outerX + borderW,
    outerY + borderW,
    outerW - borderW * 2,
    outerH - borderW * 2
  );

  // 見出し帯
  // 外枠の内側から描くので、外枠と重なって濃くならない
  ctx.fillStyle = theme.dusty;
  ctx.fillRect(
    outerX + borderW,
    outerY + borderW,
    outerW - borderW * 2,
    headerH - borderW
  );
}
// ==================================================
// ヘッダー
// ==================================================
function drawMinimalMemoHeader(ctx, theme, titleText,dateText) {
  ctx.save();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const displayDateText = formatDateToMonthDay(dateText);
  const text = `${displayDateText}  Tasks Complete!`;
  ctx.font = `700 68px ${MINIMAL_MEMO_FONT}`;
  ctx.fillText(text, CANVAS_WIDTH / 2, 155);

  ctx.restore();
  
}

// ==================================================
// タスク一覧
// ==================================================
function drawMinimalMemoTasks(ctx, theme, tasks) {
  const checkX = 155;
  const textX = 220;
  const lineX1 = 125;
  const lineX2 = 955;

  tasks.forEach((task, index) => {
    const y = MINIMAL_MEMO.taskStartY + index * MINIMAL_MEMO.taskRowHeight;

    drawMinimalMemoSquareCheck(ctx, checkX, y + 16, theme.dusty);

    ctx.fillStyle = "#333";
    ctx.font = `500 34px ${MINIMAL_MEMO_FONT}`;
    ctx.textBaseline = "top";
    drawEllipsizedText(ctx, task, textX, y, 720);

    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX1, y + 58);
    ctx.lineTo(lineX2, y + 58);
    ctx.stroke();
  });
}

// ==================================================
// 小さめの四角チェック
// ==================================================
function drawMinimalMemoSquareCheck(ctx, x, y, color) {
  ctx.save();

  ctx.fillStyle = hexToRgba(color, 0.8);
  roundRect(ctx, x - 13, y - 13, 26, 26, 3);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x - 1, y + 5);
  ctx.lineTo(x + 8, y - 7);
  ctx.stroke();

  ctx.restore();
}

