// ごほうびトレカ 01（開発版）
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
    card = {
      dayKey, colorIndex: Math.floor(Math.random() * REWARD01_COLORS.length),
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
  const button = document.getElementById("reward01HomeButton");
  if (button) button.classList.toggle("hidden", loadReward01Cards().length === 0);
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
  nameInput.value = card.nickname || "";
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
    localStorage.setItem(REWARD01_NAME_KEY, nextName);
    drawReward01Canvas(canvas, card);
  };
  const saveButton = document.getElementById("reward01SaveButton");
  saveButton.onclick = () => {
    const link = document.createElement("a");
    link.download = "tamugoto-card-01-" + card.dayKey + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  drawReward01Canvas(canvas, card);
}
function closeReward01Card() {
  const modal = document.getElementById("reward01Modal");
  if (modal) { modal.classList.add("hidden"); modal.style.display = "none"; }
  document.body.style.overflow = "";
}
function drawReward01Canvas(canvas, card) {
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
  text("01",52,112,59,"#eeeeee");
  c.save();c.globalAlpha=.07;c.strokeStyle="#fff";c.lineWidth=3;
  c.font="700 500px sans-serif";c.textAlign="right";c.strokeText("01",770,575);c.restore();
  text("RADIO",52,306,132,"#f1f1f1","700");
  c.fillStyle=accent;c.fillRect(52,333,272,11);
  text("REQUEST",52,407,48,"#bcbcbc");
  line(450);
  text("ALL CLEAR",52,507,29,accent,"700");
  let x=52;
  x+=text(card.dayKey.slice(0,4)+"/"+card.dayKey.slice(4,6)+"/"+card.dayKey.slice(6,8),x,553,27,"#bcbcbc","500")+22;
  x+=text(String(card.count),x,553,27,accent,"700")+8;
  text("TASKS",x,553,27,"#bcbcbc","500");
  if(card.nickname)text(card.nickname,52,598,fit(card.nickname,616,25,"400"),"#a9a9a9");
  text("ラジリクはね、",52,713,fit("ラジリクはね、",616,68),"#f7f7f7","700");
  text("やっとかないと。",52,805,fit("やっとかないと。",616,68),"#f7f7f7","700");
  line(861);
  text("タムごとDaily",360,902,22,"#a6a6a6","500","center");
  text("非公式ファンメイドツール",360,934,17,"#858585","400","center");
  c.restore();
}
function bindReward01Events() {
  document.getElementById("reward01HomeButton")?.addEventListener("click",()=>openReward01Card());
  document.getElementById("reward01CloseButton")?.addEventListener("click",closeReward01Card);
  document.getElementById("reward01Modal")?.addEventListener("click",event=>{
    if(event.target.id==="reward01Modal")closeReward01Card();
  });
  updateReward01HomeButton();
}
