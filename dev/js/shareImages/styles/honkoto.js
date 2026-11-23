// ==================================================
// 「本当のことを言うと」先行配信記念シェア画像
// 背景素材: /img/shareImg/honkoto/botanical.svg
// ==================================================
const HONKOTO_FONT = '"Zen Maru Gothic", sans-serif';
const HONKOTO_IMAGE_PATH = "../img/shareImg/honkoto/botanical.svg";
const HONKOTO_GREEN = "#65775c";

SHARE_IMAGE_RENDERERS.honkoto = async function ({canvas, ctx, theme, themeKey, dateText, titleText, tasks, userName = ""}) {
  const memberColor = themeKey === "white" ? "#777777" : (theme?.main || HONKOTO_GREEN);
  const memberPale = theme?.pale || "#f5f6ed";
  const rowHeight = 80;
  const listTop = 475;
  const cardBottom = listTop + tasks.length * rowHeight + 62;
  const neededHeight = cardBottom + 175;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // タスク数によって高さが変わっても、花を縦方向に引き延ばさない。
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#faf9f2");
  background.addColorStop(0.65, "#fdfcf7");
  background.addColorStop(1, memberPale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const decoration = await loadShareImageAsset(HONKOTO_IMAGE_PATH);
  if (decoration) {
    ctx.drawImage(decoration, 0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
    if (canvas.height > CANVAS_WIDTH) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(decoration, 0, canvas.height - CANVAS_WIDTH, CANVAS_WIDTH, CANVAS_WIDTH);
      ctx.restore();
    }
  }

  // 花の背景を保ったまま選択メンカラを淡く重ねる。
  ctx.fillStyle = hexToRgba(memberColor, 0.055);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 上部のアプリ名は表示せず、既存の共有画像に近いサイズの見出しを使う。
  ctx.save();
  ctx.shadowColor = "rgba(61,81,53,.12)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "rgba(255,255,251,.84)";
  roundRect(ctx, 90, 205, 900, cardBottom - 205, 34);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hexToRgba(memberColor, 0.34);
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 90, 205, 900, cardBottom - 205, 34);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = memberColor;
  ctx.font = `500 36px ${HONKOTO_FONT}`;
  ctx.fillText(formatDateToMonthDay(dateText), 150, 265);
  ctx.textAlign = "right";
  ctx.font = '38px "Klee One", "Zen Maru Gothic", sans-serif';
  ctx.fillText("Today's Log", 925, 265);

  ctx.textAlign = "left";
  ctx.font = `700 68px ${HONKOTO_FONT}`;
  ctx.fillText(titleText || "タスク完了！", 150, 338);

  ctx.strokeStyle = hexToRgba(memberColor, 0.75);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(152, 431);
  ctx.quadraticCurveTo(350, 415, 545, 433);
  ctx.stroke();

  tasks.forEach((task, index) => {
    const y = listTop + index * rowHeight;
    ctx.strokeStyle = memberColor;
    ctx.lineWidth = 3;
    roundRectStroke(ctx, 151, y + 2, 43, 43, 7);
    ctx.beginPath();
    ctx.moveTo(162, y + 21);
    ctx.lineTo(172, y + 31);
    ctx.lineTo(192, y + 7);
    ctx.stroke();

    ctx.fillStyle = "#333c31";
    ctx.font = `500 35px ${HONKOTO_FONT}`;
    drawEllipsizedText(ctx, String(task), 235, y + 4, 680);
    ctx.strokeStyle = hexToRgba(memberColor, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(235, y + 57);
    ctx.lineTo(920, y + 57);
    ctx.stroke();
  });

  drawToolCredit(ctx, canvas, HONKOTO_FONT, userName, hexToRgba(memberColor, 0.65));
};
