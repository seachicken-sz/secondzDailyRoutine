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
      const file = new File([blob], "tamugoto-card-01-" + card.dayKey + ".png", { type: "image/png" });

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
  { id: "02", title: "努力好きなもんで" },
  { id: "03", title: "肩外れるぐらいやりました" },
  { id: "04", title: "ファンをなめてもらっちゃ困ります" },
  { id: "05", title: "全タスク脱落無し" },
  { id: "06", title: "お前本当は天使なんじゃないか？" }
];
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
  const obtainedColors = new Set(cards.map(card=>"01:"+card.colorIndex));
  summary.textContent = cards.length+"枚獲得 ／ カード "+obtainedColors.size+" / "+(REWARD_COLLECTION_TYPES.length*REWARD01_COLORS.length)+"種類";
  if (rewardCollectionView === "date") {
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.textContent = "まだ獲得したカードはありません。";
      body.appendChild(empty);
      return;
    }
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;";
    cards.forEach(card=>{
      const b=document.createElement("button");
      b.type="button";
      b.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:148px;padding:12px 8px;text-align:center;border:1px solid var(--color-border,#8886);border-radius:12px;background:var(--color-bg,#fff);color:inherit;cursor:pointer;";
      const number=document.createElement("strong");
      number.textContent="01";
      number.style.cssText="font-size:23px;color:"+ (REWARD01_COLORS[card.colorIndex]?.code||"#ccc")+";";
      const title=document.createElement("span");
      title.textContent=REWARD_COLLECTION_TYPES[0].title;
      title.style.cssText="font-size:13px;font-weight:600;";
      const date=document.createElement("span");
      date.textContent=card.dayKey.slice(0,4)+"/"+card.dayKey.slice(4,6)+"/"+card.dayKey.slice(6,8)+" ・ "+card.count+" TASKS";
      date.style.cssText="font-size:11px;opacity:.7;";
      b.append(number,title,date);
      b.addEventListener("click",()=>openRewardCollectionCard(card.dayKey));
      grid.appendChild(b);
    });
    body.appendChild(grid);
    return;
  }
  const list=document.createElement("div");
  list.style.cssText="display:flex;flex-direction:column;gap:10px;";
  REWARD_COLLECTION_TYPES.forEach(type=>{
    const related=type.id==="01"?cards:[];
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
