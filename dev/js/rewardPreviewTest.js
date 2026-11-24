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
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;";
    REWARD_COLLECTION_TYPES.filter(type => REWARD_AVAILABLE_TYPES.includes(type.id)).forEach(type => {
      REWARD01_COLORS.forEach((color, colorIndex) => {
        const card = {
          typeId: type.id,
          colorIndex,
          dayKey: getDailyTaskDayKey(),
          count: 48,
          nickname: ""
        };
        grid.appendChild(createRewardMiniCard(card, () => openTestCard(type, colorIndex)));
      });
    });
    list.appendChild(grid);
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
