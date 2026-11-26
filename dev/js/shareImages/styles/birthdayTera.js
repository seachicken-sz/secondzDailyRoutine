// 143 — annual 12/31 birthday share image
async function renderBirthdayTera({canvas, ctx, theme, themeKey, tasks, userName = ""}) {
  const owl = await loadShareImageAsset("../img/shareImg/birthday/1231/owl.png");
  const w = CANVAS_WIDTH, x = 105, y = 190, pw = w - 210;
  const row = 76, ph = 88 + tasks.length * row, bottom = y + ph;
  const iw = 950, ih = owl ? iw * owl.naturalHeight / owl.naturalWidth : 280;
  const iy = bottom + 30;
  canvas.width = w;
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, Math.ceil(iy + ih + (userName ? 110 : 76)));
  const h = canvas.height, sky = "#bdeeff";
  const accent = themeKey === "white" ? "#ffffff" : themeKey === "normal" || themeKey === "sky" ? sky : theme.dream || theme.main;
  const font = '"Zen Maru Gothic", sans-serif';
  const g = ctx.createLinearGradient(0,0,w*.35,h);
  g.addColorStop(0,"#101d35"); g.addColorStop(.55,"#294968"); g.addColorStop(1,"#527b9a");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  function glow(cx,cy,r,color,alpha) {
    const b=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    b.addColorStop(0,hexToRgba(color,alpha)); b.addColorStop(1,hexToRgba(color,0));
    ctx.fillStyle=b;ctx.fillRect(cx-r,cy-r,r*2,r*2);
  }
  glow(135,85,260,sky,.22);
  glow(w-70,bottom+ih*.65,350,accent,.24);
  glow(30,y+ph*.55,230,accent,.15);
  let seed=143;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function star(cx,cy,r,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(cx,cy-r);
    ctx.quadraticCurveTo(cx+1,cy-1,cx+r,cy);
    ctx.quadraticCurveTo(cx+1,cy+1,cx,cy+r);
    ctx.quadraticCurveTo(cx-1,cy+1,cx-r,cy);
    ctx.quadraticCurveTo(cx-1,cy-1,cx,cy-r);ctx.fill();
  }
  for(let i=0;i<Math.min(360,Math.ceil(h/8));i++){
    const sx=15+random()*(w-30),sy=12+random()*(h-24),r=1+random()*2.4;
    if(sx>x-8&&sx<x+pw+8&&sy>y-8&&sy<bottom+8)continue;
    ctx.fillStyle=hexToRgba(i%5===0?accent:"#ffffff",.25+random()*.55);
    ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
  }
  for(const [sx,sy,r,i] of [[80,150,12,0],[245,45,9,1],[980,62,15,2],[1015,155,8,3],[55,bottom-65,10,4],[1025,bottom+35,13,5],[72,bottom+90,10,6],[980,iy+ih*.65,12,7],[125,iy+ih*.9,8,8]]){
    const c=i%3===0?accent:i%3===1?sky:"#ffffff";
    glow(sx,sy,r*3,c,.22);star(sx,sy,r,c);
  }
  // Two clean curves form the white crescent.
  ctx.save();ctx.strokeStyle="#ffffff";ctx.lineWidth=3;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(183,15);ctx.bezierCurveTo(19,17,23,193,198,172);
  ctx.bezierCurveTo(91,142,88,59,183,15);ctx.stroke();ctx.restore();
  ctx.save();ctx.fillStyle="#ffffff";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font='400 66px "Caveat", cursive';ctx.fillText("Mischief managed!",w/2+72,100);ctx.restore();
  // Frosted glass: quiet background, translucent tint and reflected edge light.
  ctx.save();ctx.shadowColor="rgba(5,15,30,.35)";ctx.shadowBlur=26;ctx.shadowOffsetY=10;
  ctx.fillStyle="rgba(20,39,61,.46)";roundRect(ctx,x,y,pw,ph,34);ctx.fill();ctx.restore();
  ctx.save();roundRect(ctx,x,y,pw,ph,34);ctx.clip();
  const glass=ctx.createLinearGradient(x,y,x+pw,bottom);
  glass.addColorStop(0,"rgba(255,255,255,.20)");glass.addColorStop(.5,"rgba(210,237,255,.08)");glass.addColorStop(1,hexToRgba(accent,.17));
  ctx.fillStyle=glass;ctx.fillRect(x,y,pw,ph);
  glow(x+25,y+20,220,"#ffffff",.13);glow(x+pw,bottom,250,accent,.18);ctx.restore();
  ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=2.5;roundRectStroke(ctx,x,y,pw,ph,34);
  ctx.strokeStyle="rgba(255,255,255,.19)";ctx.lineWidth=1.5;roundRectStroke(ctx,x+7,y+7,pw-14,ph-14,28);
  tasks.forEach((task,i)=>{
    const cy=y+44+i*row+25;
    ctx.save();ctx.strokeStyle=sky;ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";
    ctx.beginPath();ctx.arc(x+65,cy,17,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+57,cy);ctx.lineTo(x+63,cy+6);ctx.lineTo(x+74,cy-8);ctx.stroke();
    ctx.fillStyle="#f7fbff";ctx.textAlign="left";ctx.textBaseline="middle";ctx.font='500 34px '+font;
    drawEllipsizedText(ctx,String(task),x+112,cy,pw-158);
    if(i<tasks.length-1){ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+112,cy+37);ctx.lineTo(x+pw-45,cy+37);ctx.stroke();}
    ctx.restore();
  });
  if(owl)ctx.drawImage(owl,(w-iw)/2,iy,iw,ih);
  ctx.save();ctx.fillStyle="#e5f1fa";ctx.textAlign="right";ctx.textBaseline="bottom";ctx.font="26px "+font;
  const creditY=h-32;ctx.fillText(SHARE_IMAGE_TOOL_NAME,w-40,userName?creditY-32:creditY);
  if(userName)drawEllipsizedText(ctx,userName,w-40,creditY,420);ctx.restore();
}
SHARE_IMAGE_RENDERERS.birthdayTera = renderBirthdayTera;
