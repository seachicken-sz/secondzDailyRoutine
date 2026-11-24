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
    REWARD_COLLECTION_TYPES.filter(type => REWARD_AVAILABLE_TYPES.includes(type.id)).forEach(type => {
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
    // 全種別で本番のカード描画処理を共用する。獲得履歴は更新しない。
    drawReward01Canvas(canvas, {
      dayKey: getDailyTaskDayKey(),
      typeId: selectedType.id,
      colorIndex: selectedColorIndex,
      nickname: "",
      count: 48
    });
    note.textContent = "抽選対象カードの実デザイン（サンプル日付・48 TASKS）";
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
