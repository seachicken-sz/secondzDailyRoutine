// ==================================================
// 文具プランナースタイル用フォント
// ==================================================
const STATIONERY_PLANNER_FONT = '"Zen Maru Gothic", sans-serif';

// ==================================================
// 文具プランナースタイル設定
// ==================================================
const STATIONERY_PLANNER = {
  headerHeight: 330,
  taskStartY: 375,
  taskRowHeight: 76,
  bottomPadding: 240,
  outerX: 70,
  outerY: 70,
  outerW: 940
};

// ==================================================
// 文具プランナースタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.stationeryPlanner = function ({canvas, ctx, theme, dateText, titleText, tasks, userName = ""}) {
  const neededHeight = STATIONERY_PLANNER.headerHeight + tasks.length * STATIONERY_PLANNER.taskRowHeight + STATIONERY_PLANNER.bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStationeryPlannerBackground(ctx, canvas, theme);
  drawStationeryPlannerFrame(ctx, canvas, theme);
  drawStationeryPlannerHeader(ctx, theme);
  drawStationeryPlannerTasks(ctx, theme, tasks);
  drawStationeryPlannerDate(ctx, theme, dateText, tasks);
  drawToolCredit(ctx, canvas, STATIONERY_PLANNER_FONT, userName, hexToRgba(theme.main, 0.58));
};

// ==================================================
// 背景
// ==================================================
function drawStationeryPlannerBackground(ctx, canvas, theme) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fffdf9");
  gradient.addColorStop(1, theme.pale);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// 外枠
// ==================================================
function drawStationeryPlannerFrame(ctx, canvas, theme) {
  const { outerX, outerY, outerW } = STATIONERY_PLANNER;
  const outerH = canvas.height - outerY * 2;

  ctx.fillStyle = "#fffefb";
  ctx.fillRect(outerX, outerY, outerW, outerH);

  ctx.strokeStyle = hexToRgba(theme.main, 0.36);
  ctx.lineWidth = 4;
  ctx.strokeRect(outerX, outerY, outerW, outerH);
}

// ==================================================
// ラベル見出し
// ==================================================
function drawStationeryPlannerHeader(ctx, theme) {
  const labelX = 210;
  const labelY = 135;
  const labelW = 660;
  const labelH = 105;

  ctx.save();

  ctx.strokeStyle = hexToRgba(theme.main, 0.75);
  ctx.lineWidth = 4;
  drawStationeryLabelPath(ctx, labelX, labelY, labelW, labelH);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(theme.main, 0.35);
  ctx.lineWidth = 2;
  drawStationeryLabelPath(ctx, labelX + 10, labelY + 10, labelW - 20, labelH - 20);
  ctx.stroke();

  ctx.fillStyle = hexToRgba(theme.main, 0.82);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 44px ${STATIONERY_PLANNER_FONT}`;
  ctx.fillText("Today's Tasks", CANVAS_WIDTH / 2, labelY + labelH / 2 + 2);

  ctx.restore();

  drawStationeryDots(ctx, theme, 145, 285, 790);
}

// ==================================================
// 文具ラベルの枠
// ==================================================
function drawStationeryLabelPath(ctx, x, y, w, h) {
  const cut = 36;

  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.quadraticCurveTo(x + w - 8, y, x + w - 8, y + 8);
  ctx.lineTo(x + w - 8, y + h - 8);
  ctx.quadraticCurveTo(x + w - 8, y + h, x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.quadraticCurveTo(x + 8, y + h, x + 8, y + h - 8);
  ctx.lineTo(x + 8, y + 8);
  ctx.quadraticCurveTo(x + 8, y, x + cut, y);
  ctx.closePath();
}

// ==================================================
// 点線飾り
// ==================================================
function drawStationeryDots(ctx, theme, x, y, width) {
  ctx.save();

  ctx.fillStyle = hexToRgba(theme.main, 0.45);

  for (let i = 0; i <= width; i += 18) {
    ctx.beginPath();
    ctx.arc(x + i, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ==================================================
// タスク一覧
// ==================================================
function drawStationeryPlannerTasks(ctx, theme, tasks) {
  const checkX = 125;
  const textX = 180;
  const lineX1 = 125;
  const lineX2 = 955;

  tasks.forEach((task, index) => {
    const y = STATIONERY_PLANNER.taskStartY + index * STATIONERY_PLANNER.taskRowHeight;

    drawStationeryCheckBox(ctx, checkX, y + 17, theme.main);

    ctx.fillStyle = "#333";
    ctx.font = `500 32px ${STATIONERY_PLANNER_FONT}`;
    ctx.textBaseline = "top";
    drawEllipsizedText(ctx, task, textX, y, 720);

    ctx.strokeStyle = hexToRgba(theme.main, 0.24);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX1, y + 54);
    ctx.lineTo(lineX2, y + 54);
    ctx.stroke();
  });
}

// ==================================================
// 四角チェック
// ==================================================
function drawStationeryCheckBox(ctx, x, y, color) {
  ctx.save();

  ctx.strokeStyle = hexToRgba(color, 0.65);
  ctx.lineWidth = 3;
  roundRectStroke(ctx, x - 13, y - 13, 26, 26, 2);

  ctx.strokeStyle = hexToRgba(color, 0.75);
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

// ==================================================
// タスク下の日付
// ==================================================
function drawStationeryPlannerDate(ctx, theme, dateText, tasks) {
  const lastTaskY = STATIONERY_PLANNER.taskStartY + tasks.length * STATIONERY_PLANNER.taskRowHeight;
  const dateY = lastTaskY + 36;

  ctx.save();

  const text = `Today ${dateText}`;
  ctx.fillStyle = hexToRgba(theme.main, 0.62);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `500 28px ${STATIONERY_PLANNER_FONT}`;
  ctx.fillText(text, 120, dateY);

  ctx.restore();
}
