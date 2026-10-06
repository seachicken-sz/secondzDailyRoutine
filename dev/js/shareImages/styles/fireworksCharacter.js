// ==================================================
// 花火＋ミニキャラ設定
// ==================================================
const FIREWORKS_CHARACTER_LAYOUT = {
  characterMaxH: 310,
  characterLeft: 26,
  characterBottom: 16,
  shadowWidthRatio: 0.38,
  shadowH: 18,
  shadowOffsetY: -6,
  shadowAlpha: 0.22
};

// ==================================================
// 花火＋ミニキャラ描画
// 既存のfireworksを描画してから左下にキャラを追加
// ==================================================
SHARE_IMAGE_RENDERERS.fireworksCharacter = async function ({ canvas, ctx, theme, themeKey, dateText, titleText, tasks, userName = "", characterImage = null, characterThemeKey = themeKey }) {
  await SHARE_IMAGE_RENDERERS.fireworks({ canvas, ctx, theme, themeKey, dateText, titleText, tasks, userName });
  drawFireworksMiniCharacter(ctx, canvas, characterImage);
};

// ==================================================
// 左下ミニキャラ
// ==================================================
function drawFireworksMiniCharacter(ctx, canvas, image) {
  if (!image) return;

  const maxH = FIREWORKS_CHARACTER_LAYOUT.characterMaxH;
  const drawH = Math.min(maxH, canvas.height * 0.24);
  const drawW = drawH * (image.width / image.height);
  const x = FIREWORKS_CHARACTER_LAYOUT.characterLeft;
  const y = canvas.height - drawH - FIREWORKS_CHARACTER_LAYOUT.characterBottom;

  ctx.save();
  ctx.globalAlpha = FIREWORKS_CHARACTER_LAYOUT.shadowAlpha;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(x + drawW / 2, y + drawH + FIREWORKS_CHARACTER_LAYOUT.shadowOffsetY, drawW * FIREWORKS_CHARACTER_LAYOUT.shadowWidthRatio, FIREWORKS_CHARACTER_LAYOUT.shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.drawImage(image, x, y, drawW, drawH);
  ctx.restore();
}