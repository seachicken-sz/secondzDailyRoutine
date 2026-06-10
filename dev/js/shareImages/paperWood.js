// ==================================================
// 木目紙スタイル用フォント
// ==================================================
const PAPER_WOOD_FONT = '"Yomogi", sans-serif';

// ==================================================
// 木目紙スタイル設定
// ==================================================
const PAPER_WOOD = {
  headerHeight: 380,
  taskStartY: 395,
  taskRowHeight: 82,
  bottomPadding: 220,
  contentRotation: -0.05,
  woodRotation: -0.025,
  woodRandomSeed: 6315
};

// ==================================================
// 木目紙スタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.paperWood = function ({canvas,ctx,theme,dateText,titleText,tasks, userName= ""}) {
  // タスク数に応じてCanvas高さを計算
  const neededHeight =
    PAPER_WOOD.headerHeight +
    tasks.length * PAPER_WOOD.taskRowHeight +
    PAPER_WOOD.bottomPadding;

  const canvasHeight = Math.max(
    MIN_CANVAS_HEIGHT,
    neededHeight
  );

  canvas.width = CANVAS_WIDTH;
  canvas.height = canvasHeight;

  // 前回描画をクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景 → 本体描画
  drawPaperWoodBackground(ctx, canvas);
  drawPaperWoodContent(ctx,canvas,theme,dateText,titleText, tasks,userName);
  
};

// ==================================================
// 木目背景描画
// ==================================================
function drawPaperWoodBackground(ctx, canvas) {
  ctx.save();

  // 背景のみ少し傾ける
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(PAPER_WOOD.woodRotation);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // 回転時に端が見切れないよう広めに描画
  const bgX = -120;
  const bgY = -120;
  const bgW = canvas.width + 240;
  const bgH = canvas.height + 240;

  // 木目ベースカラー
  const baseGradient = ctx.createLinearGradient( 0, bgY, 0, bgY + bgH );

  baseGradient.addColorStop(0, "#818374");
  baseGradient.addColorStop(0.35, "#cabfb0");
  baseGradient.addColorStop(0.65, "#bbafa0");
  baseGradient.addColorStop(1, "#534d44");

  ctx.fillStyle = baseGradient;
  ctx.fillRect(bgX, bgY, bgW, bgH);

  // 木目ディテール追加
  drawPaperWoodPlanks(ctx, bgX, bgY, bgW, bgH);
  drawPaperWoodScratches(ctx, bgX, bgY, bgW, bgH);
  drawPaperWoodStains(ctx, bgX, bgY, bgW, bgH);
  drawPaperWoodKnots(ctx);

  ctx.restore();

  // 外側を少し暗くする
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    220,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.75
  );

  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(65, 48, 35, 0.20)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==================================================
// 木板のライン描画
// ==================================================
function drawPaperWoodPlanks(ctx, bgX, bgY, bgW, bgH) {
  const plankHeight = 210;

  for (
    let y = bgY;
    y < bgY + bgH + plankHeight;
    y += plankHeight
  ) {
    // 板ごとに少し色を変える
    const tone =
      Math.floor((y - bgY) / plankHeight) % 2 === 0
        ? "rgba(255, 245, 220, 0.10)"
        : "rgba(95, 70, 45, 0.08)";

    ctx.fillStyle = tone;
    ctx.fillRect(bgX, y, bgW, plankHeight);

    // 板の境界線
    ctx.strokeStyle = "rgba(70, 52, 35, 0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bgX, y + plankHeight);
    ctx.lineTo(bgX + bgW, y + plankHeight - 4);
    ctx.stroke();

    // 境界のハイライト
    ctx.strokeStyle = "rgba(255, 250, 235, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bgX, y + plankHeight - 8);
    ctx.lineTo(bgX + bgW, y + plankHeight - 10);
    ctx.stroke();
  }
}

// ==================================================
// 木目の細かい傷描画
// ==================================================
function drawPaperWoodScratches(ctx, bgX, bgY, bgW, bgH) {
  ctx.save();

  const rand = createPaperWoodSeededRandom(
    PAPER_WOOD.woodRandomSeed
  );

  for (let i = 0; i < 420; i++) {
    const x = bgX + rand() * bgW;
    const y = bgY + rand() * bgH;
    const len = 25 + rand() * 160;
    const alpha = 0.08 + rand() * 0.18;
    const width = rand() < 0.75 ? 1 : 2;

    // 暗い線と明るい線を混ぜる
    ctx.strokeStyle =
      rand() < 0.65
        ? `rgba(80, 58, 38, ${alpha})`
        : `rgba(255, 246, 225, ${alpha})`;

    ctx.lineWidth = width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x, y);

    const wave = rand() * 8;

    ctx.bezierCurveTo(
      x + len * 0.35,
      y + Math.sin(i) * wave,
      x + len * 0.7,
      y - Math.cos(i) * wave,
      x + len,
      y + (rand() - 0.5) * 8
    );

    ctx.stroke();
  }

  ctx.restore();
}

// ==================================================
// 木目の色ムラ描画
// ==================================================
function drawPaperWoodStains(ctx, bgX, bgY, bgW, bgH) {
  ctx.save();

  const rand = createPaperWoodSeededRandom(PAPER_WOOD.woodRandomSeed + 1000);

  for (let i = 0; i < 36; i++) {
    const x = bgX + rand() * bgW;
    const y = bgY + rand() * bgH;
    const rx = 60 + rand() * 180;
    const ry = 18 + rand() * 55;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, rx);

    gradient.addColorStop(0,"rgba(92, 65, 42, 0.12)");
    gradient.addColorStop(1,"rgba(92, 65, 42, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry,rand() * 0.25,0,Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
// ==================================================
// 木目紙本体描画
// ==================================================
function drawPaperWoodContent(ctx,canvas,theme,dateText,titleText,tasks,userName) {
  ctx.save();

  // 紙全体を少し傾ける
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(PAPER_WOOD.contentRotation);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // 紙 → クリップ → ヘッダー → タスク順で描画
  drawPaperWoodPaper(ctx, canvas);
  drawPaperWoodClip(ctx, theme);
  drawPaperWoodHeader(ctx, theme, dateText, titleText);
  drawPaperWoodTasks(ctx, theme, tasks);
  drawToolCredit(ctx, canvas, PAPER_WOOD_FONT, userName);
  ctx.restore();
}

// ==================================================
// 紙部分描画
// ==================================================
function drawPaperWoodPaper(ctx, canvas) {
  const paperHeight = canvas.height - 140;

  ctx.save();

  // 紙の影
  ctx.shadowColor = "rgba(50,35,20,.27)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 6;

  roundRect(ctx, 90, 70, 900, paperHeight, 20);

  ctx.fillStyle = "#fffefb";
  ctx.fill();

  ctx.restore();

  // 紙の枠線
  roundRect(ctx, 90, 70, 900, paperHeight, 20);

  ctx.strokeStyle = "rgba(0,0,0,.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ==================================================
// 左上クリップ描画
// ==================================================
function drawPaperWoodClip(ctx, theme) {
  ctx.save();

  // 少し斜めに配置
  ctx.translate(105, 42);
  ctx.rotate(-0.2);

  ctx.strokeStyle = theme.main;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  // 外側
  roundRectStroke(ctx, 0, 0, 42, 110, 20);

  // 内側
  roundRectStroke(ctx, 16, 18, 30, 74, 15);

  ctx.restore();
}

// ==================================================
// ヘッダー描画
// 日付・Today’s Log・タイトル
// ==================================================
function drawPaperWoodHeader(ctx,theme,dateText,titleText) {
  ctx.fillStyle = "#111";
  ctx.textBaseline = "top";

  // 日付
  ctx.font = `34px ${PAPER_WOOD_FONT}`;
  ctx.fillText(dateText, 200, 126);

  // 英字タイトル
  ctx.font = `30px ${PAPER_WOOD_FONT}`;
  ctx.fillText("Today’s Log", 725, 126);

  // メインタイトル
  ctx.font = `70px ${PAPER_WOOD_FONT}`;
  ctx.fillText(titleText, 220, 235);

  // タイトル下ライン
  drawHandwrittenUnderline(ctx, 215, 330, 620, 315, hexToRgba(theme.main, 0.45), 8 );
}

// ==================================================
// タスク一覧描画
// ==================================================
function drawPaperWoodTasks(ctx, theme, tasks) {
  const startX = 170;
  const textX = 250;

  tasks.forEach((task, index) => {
    const y =
      PAPER_WOOD.taskStartY +
      index * PAPER_WOOD.taskRowHeight;

    // チェックマーク
    drawCheckCircle(
      ctx,
      startX,
      y + 18,
      theme.main
    );

    // タスク文字
    ctx.fillStyle = "#111";
    ctx.font = `34px ${PAPER_WOOD_FONT}`;
    ctx.textBaseline = "top";

    // 長い文字は「…」省略
    drawEllipsizedText( ctx, task, textX, y, 635);

    // 区切り線
    ctx.strokeStyle = "rgba(0,0,0,.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(textX, y + 58);
    ctx.lineTo(885, y + 58);
    ctx.stroke();
  });
}
// ==================================================
// 木目の節描画
// ==================================================
function drawPaperWoodKnots(ctx) {
  ctx.save();

  // 固定位置に木目の節を配置
  const knots = [
    { x: 130, y: 145, r: 24 },
    { x: 920, y: 260, r: 18 },
    { x: 820, y: 720, r: 22 },
    { x: 180, y: 860, r: 17 }
  ];

  knots.forEach((knot) => {
    // 節のベース
    ctx.fillStyle = "rgba(70, 45, 25, 0.35)";
    ctx.beginPath();
    ctx.ellipse(knot.x, knot.y, knot.r * 1.4, knot.r, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 外側リング
    ctx.strokeStyle = "rgba(45, 30, 18, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(knot.x, knot.y, knot.r * 1.8, knot.r * 1.25, -0.12, 0, Math.PI * 2);
    ctx.stroke();

    // ハイライト
    ctx.strokeStyle = "rgba(255, 235, 200, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(knot.x + 4, knot.y - 4, knot.r * 1.2, knot.r * 0.75, -0.12, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.restore();
}
// ==================================================
// シード固定ランダム生成
// 毎回同じ木目模様になるよう固定乱数を使う
// ==================================================
function createPaperWoodSeededRandom(seed) {
  let value = seed;

  return function () {
    value =
      (value * 9301 + 49297) %
      233280;

    return value / 233280;
  };
}