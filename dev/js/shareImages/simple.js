// ==================================================
// シンプルスタイル用フォント
// ==================================================
const SIMPLE_FONT = '"Zen Maru Gothic", sans-serif';

// ==================================================
// シンプルスタイル描画
// ==================================================
SHARE_IMAGE_RENDERERS.simple = function ({canvas, ctx, theme, dateText, titleText, tasks, userName = ""}) {
  // ==================================================
  // レイアウト設定
  // ==================================================
  const rowHeight = 76;
  const headerHeight = 420;
  const bottomPadding = rowHeight * 2;

  // タスク数に応じてCanvas高さを計算
  // 最低でも正方形サイズを維持
  const neededHeight = headerHeight + tasks.length * rowHeight + bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ==================================================
  // 背景グラデーション
  // ==================================================
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, theme.pale);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ==================================================
  // メインカード
  // ==================================================
  roundRect(ctx, 90, 90, 900, canvas.height - 180, 32);

  ctx.fillStyle = "#fffefb";
  ctx.fill();

  ctx.strokeStyle = hexToRgba(theme.main, 0.25);
  ctx.lineWidth = 4;
  ctx.stroke();

  // ==================================================
  // ヘッダー（日付・タイトル）
  // ==================================================
  ctx.fillStyle = "#575757";
  
  dateText = `Today ${dateText}`;
 
  ctx.font = `34px ${SIMPLE_FONT}`;
  ctx.fillText(dateText, 150, 160);

  ctx.font = `72px ${SIMPLE_FONT}`;
  ctx.fillText(titleText, 150, 260);

  // ==================================================
  // タスク一覧
  // ==================================================
  tasks.forEach((task, index) => {
    const y = 360 + index * rowHeight;

    // チェックマーク
    drawCheckCircle(ctx, 160, y + 0, theme.main);

    // タスク文字（長い場合は … で省略）
    ctx.font = `34px ${SIMPLE_FONT}`;
    drawEllipsizedText(ctx, task, 235, y + 10, 650);

    // タスク区切り線
    ctx.strokeStyle = hexToRgba(theme.main, 0.16);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(235, y + 35);
    ctx.lineTo(885, y + 35);
    ctx.stroke();
  });

  drawToolCredit(ctx, canvas, SIMPLE_FONT, userName);
};