// ==================================================
// 定数
// ==================================================

// シェア画像スタイル描画関数の登録先
// 各スタイルJSで SHARE_IMAGE_RENDERERS.simple のように登録する
const SHARE_IMAGE_RENDERERS = {};

// Canvasの基本サイズ
// 横幅は固定、縦幅は各スタイル側で内容量に応じて可変にする
const CANVAS_WIDTH = 1080;
const MIN_CANVAS_HEIGHT = 1080;

// アプリ名
const SHARE_IMAGE_TOOL_NAME = "Made with タムごとDaily";

// ==================================================
// 角丸四角形のパスを作成する
// fill() や stroke() は呼び出し側で実行する
// ==================================================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);

  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);

  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);

  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);

  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ==================================================
// 角丸四角形の枠線を描画する
// roundRect() でパスを作り、そのまま stroke() する
// ==================================================
function roundRectStroke(ctx, x, y, w, h, r) {
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
}

// ==================================================
// HEXカラーをRGBA文字列に変換する
// 例: hexToRgba("#ff0000", 0.5) → "rgba(255, 0, 0, 0.5)"
// ==================================================
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==================================================
// メンカラの丸＋白いチェックマークを描画する
// タスク完了リストの左側アイコンとして使う
// ==================================================
function drawCheckCircle(ctx, x, y, color) {
  ctx.save();

  // 丸
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();

  // チェックマーク
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x + 9, y - 8);
  ctx.stroke();

  ctx.restore();
}

// ==================================================
// 手書き風の下線を描画する
// 2本のベジェ曲線を少しずらして重ね、ラフな線に見せる
// ==================================================
function drawHandwrittenUnderline(ctx, x1, y1, x2, y2, color, lineWidth = 5) {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1本目の線
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1 + 40, y1 + 5, x2 - 50, y2 - 4, x2, y2 + 2);
  ctx.stroke();

  // 2本目の線
  // 少し薄く、少し位置をずらして手書き感を出す
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(x1 + 4, y1 + 7);
  ctx.bezierCurveTo(x1 + 55, y1 + 10, x2 - 40, y2 + 3, x2 - 3, y2 + 8);
  ctx.stroke();

  ctx.restore();
}

// ==================================================
// 指定幅に収まらない文字列を「…」で省略する
// Canvasは自動で折り返し・省略しないため、描画前に文字幅を測って調整する
// ==================================================
function getEllipsizedText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  const ellipsis = "…";
  let result = "";

  for (const char of Array.from(text)) {
    const next = result + char;

    if (ctx.measureText(next + ellipsis).width > maxWidth) {
      return result + ellipsis;
    }

    result = next;
  }

  return result;
}

// ==================================================
// 指定幅に収まるように省略した文字列を描画する
// タスク名など、長くなる可能性がある文字に使う
// ==================================================
function drawEllipsizedText(ctx, text, x, y, maxWidth) {
  const displayText = getEllipsizedText(ctx, text, maxWidth);
  ctx.fillText(displayText, x, y);
}


// ==================================================
// ツール名・任意ユーザー名を描画
// userName がある場合はツール名の下に同じ見た目で表示
// ==================================================
function drawToolCredit(ctx, canvas, font, userName = "", textColor = "rgba(0,0,0,.45)") {
  const right = canvas.width - 120;
  const bottom = canvas.height - 110;
  const lineHeight = 36;

  ctx.save();

  ctx.fillStyle = textColor;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.font = `26px ${font}`;

  if (userName) {
    ctx.fillText(SHARE_IMAGE_TOOL_NAME, right, bottom - lineHeight);
    ctx.fillText(userName, right, bottom);
  } else {
    ctx.fillText(SHARE_IMAGE_TOOL_NAME, right, bottom);
  }

  ctx.restore();
}

// ==================================================
// yyyy/MM/dd を M/d に変換する
// 想定外の形式ならそのまま返す
// ==================================================
function formatDateToMonthDay(dateText) {
  const match = dateText.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (!match) {
    return dateText;
  }

  return `${Number(match[2])}/${Number(match[3])}`;
}