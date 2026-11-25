// ==================================================
// So Goodday♡ — 2026/11/27 誕生日記念シェア画像
// ==================================================
const BIRTHDAY_SO_FONT = '"Zen Maru Gothic", sans-serif';
const BIRTHDAY_SO_TITLE_FONT = '"Klee One", "Zen Maru Gothic", sans-serif';
const BIRTHDAY_SO_ASSET_DIR = "../img/shareImg/birthday/20261127/";
const BIRTHDAY_SO_LAYOUT = {
  titleY: 95, dateY: 178, panelX: 120, panelY: 225, panelW: 840,
  rowHeight: 76, panelPaddingTop: 44, panelPaddingBottom: 62,
  illustrationW: 930, illustrationGap: 45, bottomPadding: 28
};

function drawBirthdaySoBackground(ctx, canvas, theme) {
  const h = canvas.height;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  [[0, theme.dream || theme.pale], [0.22, "#f5eee8"], [0.36, "#c7d9b9"],
    [0.50, "#719c70"], [0.72, "#47814e"], [1, "#30613a"]].forEach(([p, color]) => g.addColorStop(p, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, h);
  // 固定の相対座標で、再描画しても配置が変わらない玉ボケ。
  const balls = [[80,.065,120],[300,.043,54],[980,.12,105],[790,.046,75],
    [90,.25,110],[970,.28,80],[50,.46,100],[1000,.50,110],
    [60,.66,92],[890,.64,105],[1020,.82,80],[135,.92,85],
    [800,.96,70],[130,.36,38],[960,.38,44],[390,.12,36],
    [38,.18,25],[1040,.21,32],[72,.57,23],[1000,.69,35],[540,.83,24],[940,.91,28]];
  balls.forEach(([x, ratio, r]) => {
    const y = h * ratio;
    const a = ratio > .73 ? .22 : .43;
    const b = ctx.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, "rgba(255,255,255," + a + ")");
    b.addColorStop(.65, "rgba(255,255,255," + a * .85 + ")");
    b.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBirthdaySoBranches(ctx, canvas, branch, panelBottom) {
  if (!branch) return;
  const ratio = branch.naturalHeight / branch.naturalWidth;
  ctx.save();
  ctx.globalAlpha = .85;
  // 左上は上端から垂れる向き、右下はカード下端を基準に配置。
  ctx.translate(340, -85);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(branch, 0, 0, 600, 600 * ratio);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = .8;
  ctx.translate(canvas.width + 100, panelBottom + 55);
  ctx.rotate(Math.PI);
  ctx.drawImage(branch, 0, 0, 500, 500 * ratio);
  ctx.restore();
}

function drawBirthdaySoSparkles(ctx, canvas, panelBottom) {
  const points = [[70,155,13],[970,75,11],[1002,285,15],[52,canvas.height*.42,9],
    [1010,canvas.height*.54,16],[57,panelBottom-90,11],[1007,panelBottom-55,10],
    [480,panelBottom+20,10],[945,panelBottom+30,12],
    [110,80,5],[930,190,6],[44,canvas.height*.31,5],[1030,canvas.height*.63,6],[40,panelBottom+24,5]];
  ctx.save();
  points.forEach(([x,y,r], index) => {
    ctx.fillStyle = index % 3 === 0 ? "#fff0c6" : "rgba(255,255,255,.88)";
    ctx.beginPath();
    ctx.moveTo(x,y-r);
    ctx.quadraticCurveTo(x+1,y-1,x+r,y);
    ctx.quadraticCurveTo(x+1,y+1,x,y+r);
    ctx.quadraticCurveTo(x-1,y+1,x-r,y);
    ctx.quadraticCurveTo(x-1,y-1,x,y-r);
    ctx.fill();
    // 大きな光の周囲に小さな光の粒を添える。
    if (index < 12) {
      ctx.fillStyle = index % 2 === 0 ? "rgba(255,240,198,.9)" : "rgba(255,255,255,.8)";
      [[-r-12,-r*.7,2.8],[r+9,r*.6,2]].forEach(([dx,dy,size]) => {
        ctx.beginPath();
        ctx.arc(x+dx,y+dy,size,0,Math.PI*2);
        ctx.fill();
      });
    }
  });
  // 手描き風ハート。カード外側の余白に限定する。
  const hearts = [[66,220,12,-.26],[1015,canvas.height*.35,13,.24],
    [48,panelBottom-35,10,-.2],[1030,panelBottom+80,12,.25]];
  hearts.forEach(([x,y,r,angle], index) => {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.scale(r/12,r/12);
    ctx.strokeStyle = index % 2 === 0 ? "rgba(255,240,198,.88)" : "rgba(255,255,255,.78)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(0,8);
    ctx.bezierCurveTo(-25,-7,-10,-21,0,-8);
    ctx.bezierCurveTo(11,-22,24,-7,0,8);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

async function renderBirthdaySo({canvas, ctx, theme, dateText, tasks, userName = ""}) {
  const l = BIRTHDAY_SO_LAYOUT;
  const [branch, biscuit] = await Promise.all([
    loadShareImageAsset(BIRTHDAY_SO_ASSET_DIR + "branch.png"),
    loadShareImageAsset(BIRTHDAY_SO_ASSET_DIR + "biscuit.png")
  ]);
  const panelH = l.panelPaddingTop + tasks.length * l.rowHeight + l.panelPaddingBottom;
  const panelBottom = l.panelY + panelH;
  const illustrationH = biscuit ? l.illustrationW * biscuit.naturalHeight / biscuit.naturalWidth : 260;
  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, Math.ceil(panelBottom + l.illustrationGap + illustrationH + l.bottomPadding));
  const illustrationY = panelBottom + l.illustrationGap;
  drawBirthdaySoBackground(ctx, canvas, theme);
  drawBirthdaySoBranches(ctx, canvas, branch, panelBottom);

  ctx.save();
  ctx.fillStyle = "#36583a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 64px ${BIRTHDAY_SO_TITLE_FONT}`;
  ctx.fillText("Task Complete!", CANVAS_WIDTH / 2, l.titleY);
  ctx.strokeStyle = "#789d76";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(420, 143);
  ctx.quadraticCurveTo(540, 138, 660, 143);
  ctx.stroke();
  ctx.strokeStyle = "#e7cc91";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(424, 148);
  ctx.quadraticCurveTo(540, 143, 656, 148);
  ctx.stroke();
  ctx.font = `500 28px ${BIRTHDAY_SO_TITLE_FONT}`;
  ctx.fillText(dateText || "-", CANVAS_WIDTH / 2, l.dateY);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(61,81,53,.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "rgba(255,255,255,.68)";
  roundRect(ctx, l.panelX, l.panelY, l.panelW, panelH, 34);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, l.panelX, l.panelY, l.panelW, panelH, 34);

  tasks.forEach((task, index) => {
    const y = l.panelY + l.panelPaddingTop + index * l.rowHeight;
    const centerY = y + 25;
    ctx.save();
    ctx.strokeStyle = "#517e51";
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
    ctx.font = `500 34px ${BIRTHDAY_SO_FONT}`;
    drawEllipsizedText(ctx, String(task), 246, centerY, 645);
    ctx.strokeStyle = "rgba(50,85,50,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(246, y + 65);
    ctx.lineTo(900, y + 65);
    ctx.stroke();
    ctx.restore();
  });

  drawBirthdaySoSparkles(ctx, canvas, panelBottom);
  if (biscuit) ctx.drawImage(biscuit, (CANVAS_WIDTH - l.illustrationW) / 2, illustrationY, l.illustrationW, illustrationH);
  // 斜めの誕生日文字の右下余白にクレジットを寄せる。
  ctx.save();
  ctx.fillStyle = "#f4faf0";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `26px ${BIRTHDAY_SO_FONT}`;
  const right = CANVAS_WIDTH - 75;
  const bottom = Math.min(canvas.height - 12, illustrationY + illustrationH + 22);
  ctx.fillText(SHARE_IMAGE_TOOL_NAME, right, userName ? bottom - 30 : bottom);
  if (userName) drawEllipsizedText(ctx, userName, right, bottom, 420);
  ctx.restore();
}

SHARE_IMAGE_RENDERERS.birthdaySo = renderBirthdaySo;
