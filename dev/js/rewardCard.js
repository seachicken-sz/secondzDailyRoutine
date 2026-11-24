// ごほうびトレカ 01・02・05・06（開発版）
const REWARD01_KEY = "tamugotoRewardCard01History";
const REWARD01_NAME_KEY = "tamugotoRewardCardNickname";
const REWARD01_COLORS = [
  { name: "赤", code: "#d94b58" }, { name: "紫", code: "#9663bb" },
  { name: "緑", code: "#399e71" }, { name: "水色", code: "#65b6d8" },
  { name: "黄緑", code: "#a8c947" }, { name: "ピンク", code: "#e77eac" },
  { name: "白", code: "#f4f4f4" }
];

function loadReward01Cards() {
  try {
    const value = JSON.parse(localStorage.getItem(REWARD01_KEY) || "[]");
    return Array.isArray(value) ? value.filter(card => card && /^\d{8}$/.test(card.dayKey)) : [];
  } catch (error) {
    console.error("ごほうびカード履歴の読み込みに失敗", error);
    return [];
  }
}
function saveReward01Cards(cards) {
  localStorage.setItem(REWARD01_KEY, JSON.stringify(cards));
  updateReward01HomeButton();
}
function getReward01Eligibility() {
  const groups = Array.isArray(state.dailyGroups) ? state.dailyGroups : [];
  const tasks = groups.flatMap(group => getDailyGroupItems(group));
  const unique = [...new Map(tasks.map(item => [getDailyTaskStorageKey(item), item])).values()]
    .filter(item => getDailyTaskStorageKey(item));
  const completed = unique.filter(item => isDailyTaskDone(item)).length;
  const dayMap = loadDailyTaskDoneMap()[getDailyTaskDayKey()] || {};
  const usenDone = Boolean(dayMap.home_usen_request);
  return {
    eligible: unique.length > 0 && completed === unique.length && usenDone,
    count: completed + (usenDone ? 1 : 0)
  };
}
// 各種別の優遇カラー。未解放の03・04も設定のみ保持する。
const REWARD_COLOR_BONUS = { "01": "紫", "02": "白", "03": "赤", "04": "緑" };
const REWARD_COLOR_BONUS_WEIGHT = 5;

function drawUnownedRewardCard(cards) {
  const owned = new Set(cards.map(card => (card.typeId || "01") + ":" + card.colorIndex));
  const candidates = REWARD_AVAILABLE_TYPES.flatMap(typeId =>
    REWARD01_COLORS.map((color, colorIndex) => ({
      typeId,
      colorIndex,
      weight: REWARD_COLOR_BONUS[typeId] === color.name ? REWARD_COLOR_BONUS_WEIGHT : 1
    })).filter(candidate => !owned.has(candidate.typeId + ":" + candidate.colorIndex))
  );
  if (candidates.length === 0) return null;
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let random = Math.random() * totalWeight;
  for (const candidate of candidates) {
    random -= candidate.weight;
    if (random < 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function awardReward01AtFinish() {
  const { eligible, count } = getReward01Eligibility();
  const area = document.getElementById("reward01FinishArea");
  if (!area) return;
  area.replaceChildren();
  if (!eligible) return;
  const dayKey = getDailyTaskDayKey();
  const cards = loadReward01Cards();
  let card = cards.find(item => item.dayKey === dayKey);
  if (!card) {
    const selection = drawUnownedRewardCard(cards);
    if (!selection) {
      const heading = document.createElement("h3");
      heading.textContent = "CLEAR COLLECTION コンプリート！";
      const message = document.createElement("p");
      message.textContent = "現在抽選できるカードをすべて獲得済みです。";
      area.append(heading, message);
      updateReward01HomeButton();
      return;
    }
    card = {
      dayKey, typeId: selection.typeId, colorIndex: selection.colorIndex,
      count, nickname: localStorage.getItem(REWARD01_NAME_KEY) || ""
    };
    cards.push(card);
    saveReward01Cards(cards);
  }
  const heading = document.createElement("h3");
  heading.textContent = "ごほうびトレカを獲得！";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.textContent = "獲得したカードを見る";
  button.addEventListener("click", () => openReward01Card(card.dayKey));
  area.append(heading, button);
  updateReward01HomeButton();
}
function updateReward01HomeButton() {
  const collectionButton = document.getElementById("rewardCollectionButton");
  if (!collectionButton) return;
  const hasCards = loadReward01Cards().length > 0;
  collectionButton.classList.toggle("hidden", !hasCards);
  collectionButton.setAttribute("aria-hidden", String(!hasCards));
}
function openReward01Card(dayKey) {
  const cards = loadReward01Cards();
  const card = cards.find(item => item.dayKey === dayKey) || cards[cards.length - 1];
  if (!card) return;
  const modal = document.getElementById("reward01Modal");
  const canvas = document.getElementById("reward01Canvas");
  const nameInput = document.getElementById("reward01Nickname");
  const list = document.getElementById("reward01History");
  if (!modal || !canvas || !nameInput || !list) return;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  // カード固有の名前を表示。初回は空欄で、入力済みの名前は新規獲得時に引き継ぐ。
  nameInput.value = card.nickname || "";
  const shareError = document.getElementById("reward01ShareError");
  if (shareError) { shareError.textContent = ""; shareError.classList.add("hidden"); }
  list.replaceChildren();
  [...cards].reverse().forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.dayKey.slice(0,4) + "/" + item.dayKey.slice(4,6) + "/" + item.dayKey.slice(6,8);
    button.className = "secondary-button";
    button.style.cssText = "font-size:12px;padding:7px 10px;min-width:auto;";
    if (item.dayKey === card.dayKey) button.disabled = true;
    button.addEventListener("click", () => openReward01Card(item.dayKey));
    list.appendChild(button);
  });
  nameInput.oninput = () => {
    const nextName = nameInput.value.slice(0,15);
    card.nickname = nextName;
    const updated = loadReward01Cards();
    const target = updated.find(item => item.dayKey === card.dayKey);
    if (target) {
      target.nickname = nextName;
      saveReward01Cards(updated);
    }
    // 空欄に戻しても、以前入力した名前の記憶は消さない。
    if (nextName.trim()) localStorage.setItem(REWARD01_NAME_KEY, nextName);
    drawReward01Canvas(canvas, card);
  };
  const saveButton = document.getElementById("reward01SaveButton");
  saveButton.onclick = async () => {
    const shareError = document.getElementById("reward01ShareError");
    if (shareError) { shareError.textContent = ""; shareError.classList.add("hidden"); }
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG画像を生成できませんでした");
      const file = new File([blob], "tamugoto-card-" + (card.typeId || "01") + "-" + card.dayKey + ".png", { type: "image/png" });

      // iPhone/PWAなどで共有可能なら、SNSや写真保存を選べる共有シートを表示する。
      if (typeof navigator.share === "function" &&
          (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        try {
          await navigator.share({ files: [file], title: "タムごとDaily ごほうびトレカ" });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
          // 共有APIの実行失敗はダウンロードへフォールバックする。
          console.error("ごほうびトレカの共有に失敗", error);
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("ごほうびトレカの保存・共有に失敗", error);
      if (shareError) {
        shareError.textContent = "画像の保存・共有に失敗しました。もう一度お試しください。";
        shareError.classList.remove("hidden");
      }
    }
  };
  drawReward01Canvas(canvas, card);
}
function closeReward01Card() {
  const modal = document.getElementById("reward01Modal");
  if (modal) { modal.classList.add("hidden"); modal.style.display = "none"; }
  document.body.style.overflow = "";
  if (rewardCollectionReturnOnCardClose) {
    rewardCollectionReturnOnCardClose = false;
    openRewardCollection();
  }
}
function drawReward0304Canvas(canvas, card) {
  const c = canvas.getContext("2d");
  const accent = REWARD01_COLORS[card.colorIndex]?.code || REWARD01_COLORS[0].code;
  const type = REWARD_COLLECTION_TYPES.find(item => item.id === card.typeId);
  const title = type?.title || "";
  c.clearRect(0, 0, 720, 960);
  c.fillStyle = "#121212";
  c.beginPath();c.roundRect(0, 0, 720, 960, 52);c.fill();
  c.save();c.beginPath();c.roundRect(0, 0, 720, 960, 52);c.clip();
  c.textAlign = "left";
  c.fillStyle = "#eeeeee";c.font = "400 58px sans-serif";
  c.fillText(card.typeId, 52, 112);
  c.save();c.globalAlpha = .065;c.font = "700 500px sans-serif";
  c.strokeStyle = "#fff";c.lineWidth = 3;c.textAlign = "right";
  c.strokeText(card.typeId, 770, 570);c.restore();
  const englishTitle = card.typeId === "03" ? "NOT YET" : "WE DID IT!";
  c.fillStyle = "#eeeeee";
  let englishSize = 90;
  do {
    c.font = "700 " + englishSize + "px sans-serif";
    if (c.measureText(englishTitle).width <= 616) break;
    englishSize--;
  } while (englishSize > 18);
  c.fillText(englishTitle, 52, 300);
  c.fillStyle = accent;c.fillRect(52, 328, 272, 11);
  c.fillStyle = "#bcbcbc";c.font = "400 48px sans-serif";c.fillText("COLLECTION", 52, 408);
  c.strokeStyle = "#444";c.beginPath();c.moveTo(52, 450);c.lineTo(668, 450);c.stroke();
  c.fillStyle = accent;c.font = "700 29px sans-serif";c.fillText("ALL CLEAR", 52, 507);
  const date = card.dayKey.slice(0,4) + "/" + card.dayKey.slice(4,6) + "/" + card.dayKey.slice(6,8);
  c.fillStyle = "#bcbcbc";c.font = "500 27px sans-serif";c.fillText(date, 52, 553);
  c.fillStyle = accent;c.font = "700 27px sans-serif";c.fillText(String(card.count), 245, 553);
  c.fillStyle = "#bcbcbc";c.font = "500 27px sans-serif";c.fillText("TASKS", 287, 553);
  if (card.nickname) {
    let size = 25;
    while (size > 18) {
      c.font = "400 " + size + "px sans-serif";
      if (c.measureText(card.nickname).width <= 616) break;
      size--;
    }
    c.fillStyle = "#a9a9a9";c.font = "400 " + size + "px sans-serif";
    c.fillText(card.nickname, 52, 598);
  }
  const lines = getRewardMiniTitleLines(card.typeId);
  const lineHeight = 78;
  const firstY = 720 - ((lines.length - 1) * lineHeight) / 2;
  c.fillStyle = "#f6f6f6";c.font = "700 58px sans-serif";
  lines.forEach((value, i) => c.fillText(value, 52, firstY + lineHeight * i));
  c.strokeStyle = "#444";c.beginPath();c.moveTo(52, 861);c.lineTo(668, 861);c.stroke();
  c.textAlign = "center";c.fillStyle = "#a6a6a6";c.font = "500 22px sans-serif";
  c.fillText("タムごとDaily", 360, 902);
  c.fillStyle = "#858585";c.font = "400 17px sans-serif";
  c.fillText("非公式ファンメイドツール", 360, 934);
  c.restore();
}

function drawReward01Canvas(canvas, card) {
  if (card.typeId === "03" || card.typeId === "04") {
    drawReward0304Canvas(canvas, card);
    return;
  }
  if (card.typeId === "05" || card.typeId === "06") {
    drawReward0506Canvas(canvas, card);
    return;
  }
  const c = canvas.getContext("2d");
  const accent = REWARD01_COLORS[card.colorIndex]?.code || REWARD01_COLORS[0].code;
  const x0 = 52, right = 668;
  const text = (str,x,y,size,color,weight="400",align="left") => {
    c.font = weight + " " + size + "px sans-serif";
    c.fillStyle=color;c.textAlign=align;c.textBaseline="alphabetic";
    c.fillText(str,x,y);
    return c.measureText(str).width;
  };
  const fit=(str,maxWidth,size,weight="700")=>{
    while(size>18){c.font=weight+" "+size+"px sans-serif";
      if(c.measureText(str).width<=maxWidth)break;size--;
    }return size;
  };
  const line=(y)=>{c.strokeStyle="#444";c.lineWidth=2;c.beginPath();c.moveTo(x0,y);c.lineTo(right,y);c.stroke();};
  c.clearRect(0,0,720,960);
  c.fillStyle="#121212";c.beginPath();c.roundRect(0,0,720,960,52);c.fill();
  c.save();c.beginPath();c.roundRect(0,0,720,960,52);c.clip();
  const typeId = card.typeId || "01";
  const isEffort = typeId === "02";
  text(typeId,52,112,59,"#eeeeee");
  c.save();c.globalAlpha=.07;c.strokeStyle="#fff";c.lineWidth=3;
  c.font="700 500px sans-serif";c.textAlign="right";c.strokeText(typeId,770,575);c.restore();
  text(isEffort ? "EFFORT" : "RADIO",52,306,isEffort ? 112 : 132,"#f1f1f1","700");
  c.fillStyle=accent;c.fillRect(52,333,272,11);
  text(isEffort ? "KEEP GOING" : "REQUEST",52,407,isEffort ? 46 : 48,"#bcbcbc");
  line(450);
  text("ALL CLEAR",52,507,29,accent,"700");
  let x=52;
  x+=text(card.dayKey.slice(0,4)+"/"+card.dayKey.slice(4,6)+"/"+card.dayKey.slice(6,8),x,553,27,"#bcbcbc","500")+22;
  x+=text(String(card.count),x,553,27,accent,"700")+8;
  text("TASKS",x,553,27,"#bcbcbc","500");
  if(card.nickname)text(card.nickname,52,598,fit(card.nickname,616,25,"400"),"#a9a9a9");
  if (isEffort) {
    text("努力好きなんで。",52,751,fit("努力好きなんで。",616,68),"#f7f7f7","700");
  } else {
    text("ラジリクはね、",52,713,fit("ラジリクはね、",616,68),"#f7f7f7","700");
    text("やっとかないと。",52,805,fit("やっとかないと。",616,68),"#f7f7f7","700");
  }
  line(861);
  text("タムごとDaily",360,902,22,"#a6a6a6","500","center");
  text("非公式ファンメイドツール",360,934,17,"#858585","400","center");
  c.restore();
}

const REWARD0506_PALETTES = [
  { bg: "#b32329", band: "#e4d4af" },
  { bg: "#71368c", band: "#e6cc7c" },
  { bg: "#167047", band: "#efb9a1" },
  { bg: "#338ba8", band: "#efb08c" },
  { bg: "#789e27", band: "#c9b4e8" },
  { bg: "#be4f83", band: "#bcd9c5" },
  { bg: "#f1f1ed", band: "#303036" }
];
function drawReward0506Canvas(canvas, card) {
  const c = canvas.getContext("2d");
  const is05 = card.typeId === "05";
  const palette = REWARD0506_PALETTES[card.colorIndex] || REWARD0506_PALETTES[0];
  const isWhite = card.colorIndex === 6;
  const black = "#111111", white = "#ffffff";
  c.clearRect(0,0,720,960);
  c.save();c.beginPath();c.roundRect(0,0,720,960,38);c.clip();
  c.fillStyle = palette.bg;c.fillRect(0,0,720,960);
  const text = (str,x,y,size,color,weight="700",align="left",font="Arial,sans-serif") => {
    c.font=weight+" "+size+"px "+font;c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";
    c.fillText(str,x,y);return c.measureText(str).width;
  };
  const fit=(str,max,size,weight="700")=>{
    while(size>18){c.font=weight+" "+size+"px Arial,sans-serif";
      if(c.measureText(str).width<=max)break;size--;
    }return size;
  };
  const condensed=(str,x,y,size,maxWidth)=>{
    c.save();c.font="900 "+size+"px Impact,'Arial Narrow','Arial Black',sans-serif";
    const raw=c.measureText(str).width;
    c.translate(x,y);c.scale(Math.min(.79,maxWidth/raw),1);
    c.fillStyle=black;c.textAlign="center";c.textBaseline="middle";c.fillText(str,0,0);c.restore();
  };
  const overlaid=(str,y,size)=>{
    const adjusted=fit(str,680,size,"900");
    c.font="900 "+adjusted+"px Arial,sans-serif";c.textAlign="center";c.textBaseline="middle";
    if(isWhite){c.lineJoin="round";c.lineWidth=3.5;c.strokeStyle=black;c.strokeText(str,360,y);}
    c.fillStyle=white;c.fillText(str,360,y);
  };
  c.fillStyle=palette.band;c.fillRect(0,48,720,79);
  text(card.typeId,47,88,47,isWhite?white:black,"900");
  text("FULL POWER SECONDZ!!",673,88,31,isWhite?white:black,"900","right");
  const centerY=435;
  condensed(is05?"SURVIVE":"ANGEL?",360,centerY,208,704);
  if(is05){
    overlaid("脱落タスクなし！",centerY,84);
  }else{
    overlaid("お前本当は",centerY-47,76);
    overlaid("天使なんじゃないか？",centerY+47,76);
  }
  c.fillStyle=isWhite?palette.band:black;c.fillRect(52,624,616,2);
  if(isWhite){
    c.fillStyle=palette.band;c.beginPath();c.roundRect(52,645,237,63,5);c.fill();
    text("ALL CLEAR",68,677,33,white,"800");
  }else{
    text("ALL CLEAR",52,676,36,white,"800");
  }
  let x=52;
  x+=text(card.dayKey.slice(0,4)+"/"+card.dayKey.slice(4,6)+"/"+card.dayKey.slice(6,8),x,735,28,black,"500")+23;
  x+=text(String(card.count),x,735,28,isWhite?palette.band:white,"900")+9;
  text("TASKS",x,735,28,black,"500");
  if(card.nickname)text(card.nickname,52,793,fit(card.nickname,616,29,"500"),black,"500");
  c.fillStyle=isWhite?palette.band:black;c.fillRect(52,834,616,2);
  text("タムごとDaily",360,886,26,black,"600","center");
  text("非公式ファンメイドツール",360,927,19,black,"400","center");
  c.restore();
}

function bindReward01Events() {
  document.getElementById("reward01CloseButton")?.addEventListener("click",closeReward01Card);
  document.getElementById("reward01Modal")?.addEventListener("click",event=>{
    if(event.target.id==="reward01Modal")closeReward01Card();
  });
  updateReward01HomeButton();
  document.addEventListener("DOMContentLoaded", updateReward01HomeButton);
  window.addEventListener("pageshow", updateReward01HomeButton);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateReward01HomeButton();
  });
  bindRewardCollectionEvents();
}


// ごほうびコレクション：未実装のカードも図鑑として表示する
const REWARD_COLLECTION_TYPES = [
  { id: "01", title: "ラジリクはね、やっとかないと。" },
  { id: "02", title: "努力好きなんで。" },
  { id: "03", title: "肩外れてもいいと思ってやってるから。" },
  { id: "04", title: "ファンを舐めてもらっちゃ困ります。" },
  { id: "05", title: "脱落タスクなし！" },
  { id: "06", title: "お前本当は天使なんじゃないか？" }
];
const REWARD_AVAILABLE_TYPES = ["01", "02", "03", "04", "05", "06"];
let rewardCollectionView = "date";
let rewardCollectionReturnOnCardClose = false;
function openRewardCollection() {
  const modal = document.getElementById("rewardCollectionModal");
  if (!modal) return;
  rewardCollectionReturnOnCardClose = false;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  renderRewardCollection();
}
function closeRewardCollection() {
  const modal = document.getElementById("rewardCollectionModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}
function openRewardCollectionCard(dayKey) {
  closeRewardCollection();
  rewardCollectionReturnOnCardClose = true;
  openReward01Card(dayKey);
}
// 日付順と試験用の共通ミニカード。実カードの称号・改行を踏襲する。
function getRewardMiniTitleLines(typeId) {
  if (typeId === "01") return ["ラジリクはね、", "やっとかないと。"];
  if (typeId === "03") return ["肩外れてもいいと", "思ってやってるから。"];
  if (typeId === "04") return ["ファンを舐めて", "もらっちゃ困ります。"];
  if (typeId === "06") return ["お前本当は", "天使なんじゃないか？"];
  return [REWARD_COLLECTION_TYPES.find(type => type.id === typeId)?.title || "？？？"];
}
function createRewardMiniCard(card, onClick) {
  const typeId = card.typeId || "01";
  const color = REWARD01_COLORS[card.colorIndex]?.code || "#bbb";
  const isSpecial = typeId === "05" || typeId === "06";
  const background = isSpecial ? (REWARD0506_PALETTES[card.colorIndex] || REWARD0506_PALETTES[0]).bg : "#121212";
  const foreground = isSpecial && card.colorIndex === 6 ? "#111111" : "#ffffff";
  const muted = isSpecial && card.colorIndex === 6 ? "#555555" : "#dddddd";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "reward-mini-card";
  button.style.cssText = "display:flex;flex-direction:column;min-width:0;aspect-ratio:1/1;padding:12px;border:0;border-radius:12px;background:"+background+";color:"+foreground+";text-align:left;cursor:pointer;overflow:hidden;font-family:Arial,sans-serif;";
  const number = document.createElement("strong");
  number.textContent = typeId;
  number.style.cssText = "font-size:36px;line-height:1.1;color:"+(isSpecial?foreground:color)+";"+(!isSpecial&&card.colorIndex===6?"text-shadow:0 0 2px #777;":"");
  const title = document.createElement("span");
  const lines = getRewardMiniTitleLines(typeId);
  title.textContent = lines.join("\n");
  title.style.cssText = "display:block;margin-top:auto;padding:10px 0 8px;font-size:18px;font-weight:700;line-height:1.4;color:"+foreground+";white-space:pre-line;text-align:left;";
  const divider = document.createElement("span");
  divider.style.cssText = "display:block;width:100%;height:1px;background:"+(isSpecial?(card.colorIndex===6?"#999999":"rgba(255,255,255,.55)"):"#555")+";flex-shrink:0;margin-bottom:7px;";
  const date = document.createElement("span");
  const day = card.dayKey || getDailyTaskDayKey();
  date.textContent = day.slice(0,4)+"/"+day.slice(4,6)+"/"+day.slice(6,8);
  date.style.cssText = "font-size:10px;line-height:1.2;color:"+(isSpecial?muted:"#bcbcbc")+";white-space:nowrap;";
  button.append(number,title,divider,date);
  // 表示中のカード幅と各行の実測文字幅から最大のフォントサイズを決める。
  const context = document.createElement("canvas").getContext("2d");
  const fitTitle = () => {
    const availableWidth = button.clientWidth - 24;
    if (!context || availableWidth <= 0) return;
    let size = 20;
    while (size > 9) {
      context.font = "700 "+size+"px Arial,sans-serif";
      if (lines.every(line => context.measureText(line).width <= availableWidth)) break;
      size -= 0.5;
    }
    title.style.fontSize = size+"px";
  };
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(fitTitle).observe(button);
  } else {
    requestAnimationFrame(fitTitle);
  }
  if (onClick) button.addEventListener("click",onClick);
  return button;
}
function renderRewardCollection() {
  const body = document.getElementById("rewardCollectionBody");
  const summary = document.getElementById("rewardCollectionSummary");
  const dateTab = document.getElementById("rewardCollectionDateTab");
  const typeTab = document.getElementById("rewardCollectionTypeTab");
  if (!body || !summary || !dateTab || !typeTab) return;
  const cards = loadReward01Cards().slice().sort((a,b)=>b.dayKey.localeCompare(a.dayKey));
  body.replaceChildren();
  dateTab.classList.toggle("active", rewardCollectionView === "date");
  typeTab.classList.toggle("active", rewardCollectionView === "type");
  dateTab.setAttribute("aria-selected", String(rewardCollectionView === "date"));
  typeTab.setAttribute("aria-selected", String(rewardCollectionView === "type"));
  const obtainedColors = new Set(cards.map(card=>(card.typeId || "01")+":"+card.colorIndex));
  summary.textContent = obtainedColors.size+"/"+(REWARD_COLLECTION_TYPES.length*REWARD01_COLORS.length)+"獲得";
  if (rewardCollectionView === "date") {
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.textContent = "まだ獲得したカードはありません。";
      body.appendChild(empty);
      return;
    }
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;";
    cards.forEach(card => grid.appendChild(createRewardMiniCard(card, () => openRewardCollectionCard(card.dayKey))));
    body.appendChild(grid);
    return;
  }
  const list=document.createElement("div");
  list.style.cssText="display:flex;flex-direction:column;gap:10px;";
  REWARD_COLLECTION_TYPES.forEach(type=>{
    const related=cards.filter(card=>(card.typeId || "01")===type.id);
    const block=document.createElement("div");
    block.style.cssText="padding:12px;border:1px solid var(--color-border,#8886);border-radius:12px;";
    const head=document.createElement("div");
    head.style.cssText="display:flex;align-items:center;gap:12px;margin-bottom:10px;";
    const number=document.createElement("strong");
    number.textContent=type.id;
    number.style.cssText="font-size:23px;opacity:"+(related.length?"1":".35")+";";
    const name=document.createElement("span");
    name.textContent=related.length?type.title:"？？？";
    name.style.cssText="font-size:13px;font-weight:600;flex:1;";
    const count=document.createElement("span");
    count.textContent=(new Set(related.map(c=>c.colorIndex))).size+"/7";
    count.style.cssText="font-size:12px;opacity:.7;";
    head.append(number,name,count);
    const hearts=document.createElement("div");
    hearts.style.cssText="display:flex;gap:7px;flex-wrap:wrap;align-items:center;";
    REWARD01_COLORS.forEach((color,index)=>{
      const owned=related.find(card=>card.colorIndex===index);
      const heart=document.createElement(owned?"button":"span");
      if(owned){heart.type="button";heart.addEventListener("click",()=>openRewardCollectionCard(owned.dayKey));}
      heart.textContent="♥";
      heart.title=color.name+(owned?"：獲得済み":"：未取得");
      heart.setAttribute("aria-label",heart.title);
      heart.style.cssText="display:inline-flex;justify-content:center;align-items:center;width:32px;height:32px;border:0;border-radius:7px;background:transparent;font-size:26px;line-height:1;"+(owned?"cursor:pointer;color:"+color.code+";"+(index===6?"text-shadow:0 0 2px #555;":""):"color:#aaa;opacity:.28;");
      hearts.appendChild(heart);
    });
    block.append(head,hearts);
    list.appendChild(block);
  });
  body.appendChild(list);
}
function bindRewardCollectionEvents() {
  document.getElementById("rewardCollectionButton")?.addEventListener("click",openRewardCollection);
  document.getElementById("rewardCollectionCloseButton")?.addEventListener("click",closeRewardCollection);
  document.getElementById("rewardCollectionModal")?.addEventListener("click",event=>{
    if(event.target.id==="rewardCollectionModal")closeRewardCollection();
  });
  document.getElementById("rewardCollectionDateTab")?.addEventListener("click",()=>{
    rewardCollectionView="date";renderRewardCollection();
  });
  document.getElementById("rewardCollectionTypeTab")?.addEventListener("click",()=>{
    rewardCollectionView="type";renderRewardCollection();
  });
}
