// ==================================================
// 「本当のことを言うと」先行配信記念シェア画像
// 花火版と同様にタイトルはカード外、タスクはカード内
// ==================================================
const HONKOTO_FONT = '"Zen Maru Gothic", sans-serif';
const HONKOTO_TITLE_FONT = '"Klee One", "Zen Maru Gothic", sans-serif';
const HONKOTO_IMAGE_PATH = "../img/shareImg/honkoto/botanical.svg";
const HONKOTO_BOTTOM_IMAGE_PATH = "../img/shareImg/honkoto/botanical-bottom.svg";
const HONKOTO_GREEN = "#65775c";
const HONKOTO_LAYOUT = {
  titleY: 95,
  dateY: 178,
  panelX: 120,
  panelY: 225,
  panelW: 840,
  rowHeight: 76,
  panelPaddingTop: 44,
  panelPaddingBottom: 62,
  bottomPadding: 310
};

async function renderHonkoto({canvas, ctx, theme, themeKey, dateText, tasks, userName = "", characterImage = null}, showCharacter = false) {
  const memberColor = themeKey === "lime" ? "#a39112" : (themeKey === "white" ? "#777777" : (theme?.main || HONKOTO_GREEN));
  const memberPale = themeKey === "lime" ? "#fffbe8" : (theme?.pale || "#f5f6ed");
  const panelH = HONKOTO_LAYOUT.panelPaddingTop + tasks.length * HONKOTO_LAYOUT.rowHeight + HONKOTO_LAYOUT.panelPaddingBottom;
  const bottomPadding = showCharacter ? 340 : HONKOTO_LAYOUT.bottomPadding;
  const neededHeight = HONKOTO_LAYOUT.panelY + panelH + bottomPadding;

  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, neededHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#faf9f2");
  background.addColorStop(0.65, "#fdfcf7");
  background.addColorStop(1, memberPale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const [topDecoration, bottomDecoration] = await Promise.all([
    loadShareImageAsset(HONKOTO_IMAGE_PATH),
    loadShareImageAsset(HONKOTO_BOTTOM_IMAGE_PATH)
  ]);

  // 上側の花は上端を基準に、下側の枝は画像の右下を基準に配置。
  if (topDecoration) ctx.drawImage(topDecoration, 0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
  if (bottomDecoration) ctx.drawImage(bottomDecoration, 0, canvas.height - CANVAS_WIDTH, CANVAS_WIDTH, CANVAS_WIDTH);

  ctx.fillStyle = hexToRgba(memberColor, 0.045);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 花火版と同様にカードより上へ英語タイトルと日付を配置。
  ctx.save();
  ctx.fillStyle = memberColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 64px ${HONKOTO_TITLE_FONT}`;
  ctx.fillText("Task Complete!", CANVAS_WIDTH / 2, HONKOTO_LAYOUT.titleY);
  ctx.strokeStyle = hexToRgba(memberColor, 0.66);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(420, 143);
  ctx.quadraticCurveTo(540, 138, 660, 143);
  ctx.stroke();
  ctx.font = `500 28px ${HONKOTO_TITLE_FONT}`;
  ctx.fillText(dateText || "-", CANVAS_WIDTH / 2, HONKOTO_LAYOUT.dateY);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(61,81,53,.12)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "rgba(255,255,251,.84)";
  roundRect(ctx, HONKOTO_LAYOUT.panelX, HONKOTO_LAYOUT.panelY, HONKOTO_LAYOUT.panelW, panelH, 34);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = hexToRgba(memberColor, 0.34);
  ctx.lineWidth = 2;
  roundRectStroke(ctx, HONKOTO_LAYOUT.panelX, HONKOTO_LAYOUT.panelY, HONKOTO_LAYOUT.panelW, panelH, 34);

  tasks.forEach((task, index) => {
    const y = HONKOTO_LAYOUT.panelY + HONKOTO_LAYOUT.panelPaddingTop + index * HONKOTO_LAYOUT.rowHeight;
    const centerY = y + 25;
    ctx.save();
    ctx.strokeStyle = memberColor;
    ctx.lineWidth = 3;
    roundRectStroke(ctx, 178, centerY - 17, 34, 34, 7);
    ctx.beginPath();
    ctx.moveTo(187, centerY);
    ctx.lineTo(194, centerY + 7);
    ctx.lineTo(207, centerY - 9);
    ctx.stroke();

    ctx.fillStyle = "#333c31";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `500 34px ${HONKOTO_FONT}`;
    drawEllipsizedText(ctx, String(task), 246, centerY, 645);
    ctx.strokeStyle = hexToRgba(memberColor, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(246, y + 65);
    ctx.lineTo(900, y + 65);
    ctx.stroke();
    ctx.restore();
  });

  if (showCharacter) drawFireworksMiniCharacter(ctx, canvas, characterImage);

  // 曲名・発売日の告知は表示せず、既存のクレジットを残す。
  drawToolCredit(ctx, canvas, HONKOTO_FONT, userName, hexToRgba(memberColor, 0.65));
}

SHARE_IMAGE_RENDERERS.honkoto = renderHonkoto;
SHARE_IMAGE_RENDERERS.honkotoCharacter = (options) => renderHonkoto(options, true);
