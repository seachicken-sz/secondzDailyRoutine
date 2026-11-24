// CLEAR COLLECTION の検証専用UI。獲得データには一切書き込まない。
(function () {
  let selectedType = null;
  let selectedColorIndex = 0;

  function element(id) { return document.getElementById(id); }

  function openTestCollection() {
    element("rewardCollectionModal")?.classList.add("hidden");
    const modal = element("rewardTestCollectionModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderTestCollection();
  }

  function closeTestCollection(returnToCollection = true) {
    element("rewardTestCollectionModal")?.classList.add("hidden");
    if (returnToCollection) {
      element("rewardCollectionModal")?.classList.remove("hidden");
      if (typeof renderRewardCollection === "function") renderRewardCollection();
    } else {
      document.body.style.overflow = "";
    }
  }

  function renderTestCollection() {
    const list = element("rewardTestCollectionList");
    if (!list) return;
    list.replaceChildren();
    REWARD_COLLECTION_TYPES.forEach(type => {
      const item = document.createElement("section");
      item.style.cssText = "padding:12px;border:1px solid var(--color-border,#ccc);border-radius:12px;";
      const heading = document.createElement("div");
      heading.style.cssText = "display:flex;gap:12px;align-items:center;margin-bottom:10px;";
      const number = document.createElement("strong");
      number.style.fontSize = "23px";
      number.textContent = type.id;
      const title = document.createElement("span");
      title.style.cssText = "font-size:13px;font-weight:600;flex:1;";
      title.textContent = type.title;
      const count = document.createElement("span");
      count.style.cssText = "font-size:12px;opacity:.7;";
      count.textContent = "7 / 7";
      heading.append(number, title, count);
      const hearts = document.createElement("div");
      hearts.style.cssText = "display:flex;gap:7px;flex-wrap:wrap;";
      REWARD01_COLORS.forEach((color, index) => {
        const heart = document.createElement("button");
        heart.type = "button";
        heart.textContent = "♥";
        heart.setAttribute("aria-label", type.id + " " + color.name + "の試験カードを見る");
        heart.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:7px;background:transparent;font-size:26px;cursor:pointer;color:" + color.code + ";" + (index === 6 ? "text-shadow:0 0 2px #555;" : "");
        heart.addEventListener("click", () => openTestCard(type, index));
        hearts.appendChild(heart);
      });
      item.append(heading, hearts);
      list.appendChild(item);
    });
  }

  function openTestCard(type, colorIndex) {
    selectedType = type;
    selectedColorIndex = colorIndex;
    element("rewardTestCollectionModal")?.classList.add("hidden");
    const modal = element("rewardTestCardModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderTestCard();
  }

  function renderTestCard() {
    if (!selectedType) return;
    const canvas = element("rewardTestCardCanvas");
    const heading = element("rewardTestCardTitle");
    const note = element("rewardTestCardNote");
    if (!canvas || !heading || !note) return;
    const color = REWARD01_COLORS[selectedColorIndex];
    heading.textContent = "CARD " + selectedType.id + " ・ " + color.name;
    const dayKey = getDailyTaskDayKey();
    if (selectedType.id === "01") {
      // 実装済みカード01の実際のCanvas描画をそのまま確認。
      drawReward01Canvas(canvas, { dayKey, colorIndex: selectedColorIndex, nickname: "", count: 48 });
      note.textContent = "CARD 01：現在のCanvasデザイン（サンプル日付・48 TASKS）";
    } else {
      // 02〜06にはまだ専用デザインがない。仮デザインで7色の表示を検証する。
      const ctx = canvas.getContext("2d");
      const accent = color.code;
      ctx.clearRect(0, 0, 720, 960);
      ctx.fillStyle = "#121212";
      ctx.beginPath();
      ctx.roundRect(0, 0, 720, 960, 52);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, 720, 960, 52);
      ctx.clip();
      ctx.font = "400 58px sans-serif";
      ctx.fillStyle = "#eeeeee";
      ctx.fillText(selectedType.id, 52, 112);
      ctx.globalAlpha = 0.065;
      ctx.font = "700 500px sans-serif";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.textAlign = "right";
      ctx.strokeText(selectedType.id, 770, 570);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      ctx.font = "700 90px sans-serif";
      ctx.fillText("CLEAR", 52, 300);
      ctx.fillStyle = accent;
      ctx.fillRect(52, 328, 272, 11);
      ctx.font = "400 48px sans-serif";
      ctx.fillStyle = "#bcbcbc";
      ctx.fillText("COLLECTION", 52, 408);
      ctx.strokeStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(52, 450); ctx.lineTo(668, 450); ctx.stroke();
      ctx.fillStyle = accent;
      ctx.font = "700 29px sans-serif";
      ctx.fillText("ALL CLEAR", 52, 507);
      ctx.fillStyle = "#bcbcbc";
      ctx.font = "500 27px sans-serif";
      ctx.fillText(dayKey.slice(0,4)+"/"+dayKey.slice(4,6)+"/"+dayKey.slice(6,8), 52, 553);
      ctx.fillStyle = accent;
      ctx.font = "700 27px sans-serif";
      ctx.fillText("48", 245, 553);
      ctx.fillStyle = "#bcbcbc";
      ctx.font = "500 27px sans-serif";
      ctx.fillText("TASKS", 287, 553);
      const chars = Array.from(selectedType.title);
      const lines = [];
      let line = "";
      for (const ch of chars) {
        ctx.font = "700 58px sans-serif";
        if (ctx.measureText(line + ch).width > 600 && line) { lines.push(line); line = ch; }
        else line += ch;
      }
      if (line) lines.push(line);
      const lineHeight = 78;
      const firstY = 720 - ((lines.length - 1) * lineHeight) / 2;
      ctx.fillStyle = "#f6f6f6";
      ctx.font = "700 58px sans-serif";
      lines.forEach((value, i) => ctx.fillText(value, 52, firstY + lineHeight * i));
      ctx.strokeStyle = "#444";
      ctx.beginPath();ctx.moveTo(52, 861);ctx.lineTo(668, 861);ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#a6a6a6";
      ctx.font = "500 22px sans-serif";
      ctx.fillText("タムごとDaily", 360, 902);
      ctx.fillStyle = "#858585";
      ctx.font = "400 17px sans-serif";
      ctx.fillText("非公式ファンメイドツール", 360, 934);
      ctx.restore();
      note.textContent = "CARD " + selectedType.id + "：専用デザイン未実装のため仮レイアウト。実際の獲得カードではありません。";
    }
  }

  function closeTestCard() {
    element("rewardTestCardModal")?.classList.add("hidden");
    element("rewardTestCollectionModal")?.classList.remove("hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    element("rewardTestOpenButton")?.addEventListener("click", openTestCollection);
    element("rewardTestCollectionCloseButton")?.addEventListener("click", () => closeTestCollection());
    element("rewardTestCardCloseButton")?.addEventListener("click", closeTestCard);
    element("rewardTestCollectionModal")?.addEventListener("click", event => {
      if (event.target === element("rewardTestCollectionModal")) closeTestCollection();
    });
    element("rewardTestCardModal")?.addEventListener("click", event => {
      if (event.target === element("rewardTestCardModal")) closeTestCard();
    });
  });
})();
