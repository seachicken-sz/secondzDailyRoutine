// ==================================================
// home.js
// ホーム画面のイベント・ホームからの共有処理を管理するファイル
// ==================================================

// ==================================================
// ホーム画面イベント登録
// ==================================================
// app.js から呼び出して、ホーム画面で使うクリックイベントをまとめて登録する
function bindHomeEvents() {
  // ==================================================
  // 開始ボタン
  // ==================================================

  // ホーム画面の「開始する」ボタン押下時
  addClickEvent(startRoutineButtonElement, () => {
    // アプリ開始ログを送信する
    // ログ送信に失敗してもユーザー操作は止めない
    sendStartLog().catch((error) => {
      console.error("startError", error);
    });

    // Spotify画面へ進む
    showOnlyStep(spotifyStepElement);
  });

  // ==================================================
  // ホーム画面のSNS共有ボタン
  // ==================================================

  // ホーム上部の共有ボタン押下時
  addClickEvent(homeTopShareButtonElement, shareAppFromHome);

  // ホーム下部の「このツールを共有」ボタン押下時
  addClickEvent(homeBottomShareButtonElement, shareAppFromHome);

  // ==================================================
  //ホームメニュー
  // ==================================================
  addClickEvent(homeMenuButtonElement, openHomeMenu);
  addClickEvent(closeHomeMenuButtonElement, closeHomeMenu);
  addClickEvent(homeMenuOverlayElement, closeHomeMenu);

  bindHomeMenuAccordionEvents();

  addClickEvent(homeMenuSetupButtonElement, () => {
    closeHomeMenu();
    openFirstSetupModal();
  });

  addClickEvent(homeMenuUsageButtonElement, () => {
    closeHomeMenu();
    openUsageModal();
  });

  addClickEvent(homeMenuShareButtonElement, () => {
    closeHomeMenu();
    shareAppFromHome();
  });

  // ==================================================
  // おかわりDaily直行リンク
  // ==================================================
  bindHomeDailyJumpEvents();

  // ==================================================
  // ホーム限定：上に戻るボタン
  // ==================================================
  bindHomeBackToTopButton();

  // ==================================================
  // ホームのおかわりタスク操作
  // ==================================================
  bindHomeExtraTaskEvents();

  // ==================================================
  // ホーム用リクエスト曲選択
  // ==================================================
  bindHomeRequestSongSelectEvents();
}

// ==================================================
// ホーム画面からアプリを共有
// ==================================================
// Web Share API が使える環境では共有シートを開く
// 使えない環境ではクリップボードへURLをコピーする
async function shareAppFromHome() {
  // 共有する内容
  const shareData = {
    title: "タムごとDaily",
    text: "3分でラジリク全部終わらせちゃおう！",
    url: "https://seachicken-sz.github.io/secondzDailyRoutine/app/",
  };

  try {
    // Web Share API が使える場合
    // iPhone/Android/PWAなどでは共有シートが開く
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    // Web Share API が使えない場合
    // 共有文 + URL をクリップボードへコピーする
    await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);

    // コピーできたことをユーザーに伝える
    alert("共有が使えない環境のため、URLをコピーしました。");
  } catch (error) {
    // ユーザーが共有シートを閉じた場合はエラー扱いにしない
    if (error.name === "AbortError") {
      return;
    }

    // それ以外の共有失敗・コピー失敗はログに出して通知する
    console.error(error);
    alert("共有に失敗しました。");
  }
}

// おかわりDaily直行リンククリックイベント
function bindHomeDailyJumpEvents() {
  if (!homeDailyJumpButtonElement) {
    return;
  }

  homeDailyJumpButtonElement.addEventListener("click", () => {
    scrollHomeToElement("homeDailyExtraCard");
  });
}

// ホーム画面内で指定要素までスクロール
function scrollHomeToElement(targetId) {
  const target = document.getElementById(targetId);

  if (!homeStepElement || !target) {
    return;
  }

  const homeRect = homeStepElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const currentScrollTop = homeStepElement.scrollTop;
  const targetScrollTop = currentScrollTop + targetRect.top - homeRect.top - 12;

  homeStepElement.scrollTo({
    top: targetScrollTop,
    behavior: "smooth",
  });
}

// ==================================================
// ホーム限定：上に戻るボタン
// ==================================================

function bindHomeBackToTopButton() {
  if (!homeStepElement || !homeBackToTopButtonElement) {
    return;
  }

  homeStepElement.addEventListener("scroll", () => {
    const shouldShow =
      !homeStepElement.classList.contains("hidden") &&
      homeStepElement.scrollTop > 260;

    homeBackToTopButtonElement.classList.toggle("hidden", !shouldShow);
  });

  homeBackToTopButtonElement.addEventListener("click", () => {
    homeStepElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// ==================================================
// ホーム：おかわりタスク共通
// ==================================================

let HOME_EXTRA_DAILY_TASKS = [];
let HOME_EXTRA_ONCE_TASKS = [];
let HOME_EXTRA_USEN_TASKS = [];

// USEN疑似タスクGroupの開閉状態
// プルダウン変更で再描画しても、開いていたら開いたままにする
let HOME_USEN_EXTRA_GROUP_OPEN = false;

// sectionを表示/非表示にする
function toggleHomeExtraSection(cardElement, shouldShow) {
  if (!cardElement) {
    return;
  }

  cardElement.classList.toggle("hidden", !shouldShow);
}

// タスク名取得
function getHomeExtraTaskName(task, source) {
  if (source === "daily") {
    return getDailyTaskItemName(task);
  }

  if (source === "usen") {
    return task?.name || "USEN推し活リクエスト";
  }

  return task?.name || "名称未設定";
}

// タスクURL取得
function getHomeExtraTaskUrl(task, source) {
  if (source === "daily") {
    return getDailyTaskItemUrl(task);
  }

  if (source === "usen") {
    return task?.url || "";
  }

  return task?.url || "";
}

// タスク説明文取得
function getHomeExtraTaskComment(task, source) {
  if (source === "daily") {
    return task?.comment || "ページを開いてタスクを完了してください。";
  }

  if (source === "usen") {
    if (task?.url) {
      return `${task.songName}をUSEN推し活リクエストできます。\nページを開いてリクエストしてください。`;
    }

    return `${task.songName}はUSEN推し活リクエスト非対応です。`;
  }

  return buildOnceTaskMessage(task);
}

// once/daily判定
// 既存JSONの repeatType と、今後の type の両方に対応する
function getHomeTaskRepeatType(task) {
  return task?.type || task?.repeatType || "daily";
}

// ホーム用：一度きりタスクが完了済みか判定
function isHomeOnceTaskDone(task) {
  if (getHomeTaskRepeatType(task) !== "once") {
    return false;
  }

  const taskId = getTaskStorageId(task);

  if (!taskId) {
    return false;
  }

  const doneMap = loadOnceTaskDoneMap();

  return Boolean(doneMap[taskId]);
}

// ホーム用：一度きりタスクを完了済みにする
function markHomeOnceTaskDone(task) {
  if (getHomeTaskRepeatType(task) !== "once") {
    return;
  }

  const taskId = getTaskStorageId(task);

  if (!taskId) {
    console.warn("type/repeatType: once のタスクに id がありません", task);
    return;
  }

  const doneMap = loadOnceTaskDoneMap();

  doneMap[taskId] = {
    doneAt: new Date().toISOString(),
    expiresAt: getOnceTaskExpiresAt(task),
  };

  saveOnceTaskDoneMap(doneMap);
}

// source/index からタスク取得
function getHomeExtraTaskBySource(source, index) {
  const taskIndex = Number(index);

  if (Number.isNaN(taskIndex)) {
    return null;
  }

  if (source === "daily") {
    return HOME_EXTRA_DAILY_TASKS[taskIndex] || null;
  }

  if (source === "once") {
    return HOME_EXTRA_ONCE_TASKS[taskIndex] || null;
  }

  if (source === "usen") {
    return HOME_EXTRA_USEN_TASKS[taskIndex] || null;
  }

  return null;
}

// タスク詳細DOMを作る
// 通常Daily/期間限定用。USEN疑似タスクは1段表示にしたいため専用描画で作る。
function createHomeExtraTaskDetail({ task, source, index }) {
  const details = document.createElement("details");
  details.className = "home-extra-task-detail";

  const summary = document.createElement("summary");
  summary.className = "home-extra-task-summary";
  summary.textContent = getHomeExtraTaskName(task, source);

  const body = document.createElement("div");
  body.className = "home-extra-task-body";

  const comment = document.createElement("div");
  comment.className = "notice-box home-extra-task-comment";
  comment.textContent = normalizeDisplayNewlines(getHomeExtraTaskComment(task, source));

  if (source === "daily" && task["input-flag"] === true) {
    task._preparedHomeCopyText = buildHomeDailyTaskCopyText(task);
  } else {
    task._preparedHomeCopyText = "";
  }

  const copyPreview = createHomeDailyTaskCopyPreview(task, source);

  const actionArea = document.createElement("div");
  actionArea.className = "home-extra-task-actions";

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "primary-button compact-button";
  openButton.textContent = "ページを開く";
  openButton.dataset.homeExtraAction = "open";
  openButton.dataset.source = source;
  openButton.dataset.index = String(index);

  const shareXButton = document.createElement("button");
  shareXButton.type = "button";
  shareXButton.className = "secondary-button compact-button";
  shareXButton.textContent = "このタスクをXでシェア";
  shareXButton.dataset.homeExtraAction = "share-x";
  shareXButton.dataset.source = source;
  shareXButton.dataset.index = String(index);

  const shareThreadsButton = document.createElement("button");
  shareThreadsButton.type = "button";
  shareThreadsButton.className = "secondary-button compact-button";
  shareThreadsButton.textContent = "コピーしてThreadsを開く";
  shareThreadsButton.dataset.homeExtraAction = "share-threads";
  shareThreadsButton.dataset.source = source;
  shareThreadsButton.dataset.index = String(index);

  const taskUrl = getHomeExtraTaskUrl(task, source);

  if (!taskUrl) {
    openButton.classList.add("hidden");
  }

  actionArea.appendChild(openButton);
  actionArea.appendChild(shareXButton);
  actionArea.appendChild(shareThreadsButton);

  body.appendChild(comment);

  if (copyPreview) {
    body.appendChild(copyPreview);
  }

  body.appendChild(actionArea);

  details.appendChild(summary);
  details.appendChild(body);

  return details;
}

// おかわりDaily用：コピー内容プレビューDOMを作る
function createHomeDailyTaskCopyPreview(task, source) {
  if (source !== "daily") {
    return null;
  }

  if (task?.["input-flag"] !== true) {
    return null;
  }

  const copyText = task._preparedHomeCopyText || "";

  if (!copyText) {
    return null;
  }

  const requestInput = task["request-input"] || "";

  const previewArea = document.createElement("div");
  previewArea.className = "daily-task-copy-preview";

  const beforeNote = document.createElement("p");
  beforeNote.className = "daily-task-copy-preview-note";
  beforeNote.textContent = "「ページを開く」を押すと以下がコピーされます。";

  const previewText = document.createElement("div");
  previewText.className = "daily-task-copy-preview-text";
  previewText.textContent = copyText;

  const afterNote = document.createElement("p");
  afterNote.className = "daily-task-copy-preview-note";
  afterNote.textContent = requestInput
    ? `${requestInput}にペーストしてください。`
    : "指定の入力欄にペーストしてください。";

  previewArea.appendChild(beforeNote);
  previewArea.appendChild(previewText);
  previewArea.appendChild(afterNote);

  return previewArea;
}

// 今日、daily系グループが1つ以上完了しているかをbodyクラスへ反映する
function updateDailyStartedTodayClass() {
  const hasDoneDailyGroup =
    typeof isAnyDailyGroupDoneToday === "function" &&
    isAnyDailyGroupDoneToday(state.dailyGroups || []);

  const hasDoneUsenGroup =
    HOME_EXTRA_USEN_TASKS.some((task) => {
      return typeof isDailyTaskDone === "function" && isDailyTaskDone(task);
    });

  const isStarted = hasDoneDailyGroup || hasDoneUsenGroup;

  document.body.classList.toggle("daily-started-today", isStarted);
}

// ==================================================
// ホーム：おかわりDaily
// ==================================================

function renderHomeDailyExtraList(groups) {
  if (!homeDailyExtraListElement) {
    return;
  }

  HOME_EXTRA_DAILY_TASKS = [];
  homeDailyExtraListElement.innerHTML = "";

  if (!Array.isArray(groups) || groups.length === 0) {
    const hasUsenTasks = HOME_EXTRA_USEN_TASKS.length > 0;
    toggleHomeExtraSection(homeDailyExtraCardElement, hasUsenTasks);
    updateDailyStartedTodayClass();
    return;
  }

  groups.forEach((group) => {
    const items = getDailyGroupItems(group);

    if (items.length === 0) {
      return;
    }

    const isGroupDone =
      typeof isDailyGroupDone === "function" && isDailyGroupDone(group);

    const groupDetails = document.createElement("details");
    groupDetails.className = "home-extra-group";
    groupDetails.classList.toggle("is-daily-done", isGroupDone);

    const summary = document.createElement("summary");
    summary.className = "home-extra-group-summary";

    const summaryLabel = document.createElement("span");
    summaryLabel.className = "home-extra-group-summary-label";
    summaryLabel.textContent = group.listName || "グループ未設定";

    const doneMark = document.createElement("span");
    doneMark.className = "home-extra-group-done-mark show-when-daily-done";
    doneMark.textContent = "✅";
    doneMark.setAttribute("aria-label", "本日実行済み");

    summary.appendChild(summaryLabel);
    summary.appendChild(doneMark);

    const taskList = document.createElement("div");
    taskList.className = "home-extra-group-body";

    items.forEach((item) => {
      const index = HOME_EXTRA_DAILY_TASKS.length;
      HOME_EXTRA_DAILY_TASKS.push(item);

      taskList.appendChild(
        createHomeExtraTaskDetail({
          task: item,
          source: "daily",
          index,
        })
      );
    });

    groupDetails.appendChild(summary);
    groupDetails.appendChild(taskList);
    homeDailyExtraListElement.appendChild(groupDetails);
  });

  const hasDailyTasks = HOME_EXTRA_DAILY_TASKS.length > 0;
  const hasUsenTasks = HOME_EXTRA_USEN_TASKS.length > 0;

  toggleHomeExtraSection(homeDailyExtraCardElement, hasDailyTasks || hasUsenTasks);
  updateDailyStartedTodayClass();
}

// ==================================================
// ホーム：USEN推し活リクエスト疑似タスク
// ==================================================

function buildHomeUsenTaskFromSelectedSong() {
  const song = getHomeSelectedRequestSong();

  if (!song || !song.name) {
    return null;
  }

  const rawUrl = String(song.url || "").trim();
  const hasUrl = rawUrl !== "";

  return {
    // USENは曲ごとではなく、18時切替の1日単位で「1回でもやったら完了」にする
    id: "home_usen_request",
    name: `USEN推し活リクエスト：${song.name}`,
    shortName: "USEN推し活リクエスト",
    songName: song.name,
    song,
    url: hasUrl ? buildRequestSongUrl(rawUrl) : "",
    repeatType: "daily",
    inputFlag: false,
    isUsenTask: true,
  };
}

function renderHomeUsenExtraList() {
  if (!homeUsenExtraListElement) {
    return;
  }

  HOME_EXTRA_USEN_TASKS = [];
  homeUsenExtraListElement.innerHTML = "";

  const task = buildHomeUsenTaskFromSelectedSong();

  if (!task) {
    const hasDailyTasks = HOME_EXTRA_DAILY_TASKS.length > 0;
    toggleHomeExtraSection(homeDailyExtraCardElement, hasDailyTasks);
    updateDailyStartedTodayClass();
    return;
  }

  const isGroupDone =
    typeof isDailyTaskDone === "function" && isDailyTaskDone(task);

  const groupDetails = document.createElement("details");
  groupDetails.className = "home-extra-group home-usen-extra-group";
  groupDetails.classList.toggle("is-daily-done", isGroupDone);
  groupDetails.open = HOME_USEN_EXTRA_GROUP_OPEN;

  groupDetails.addEventListener("toggle", () => {
    HOME_USEN_EXTRA_GROUP_OPEN = groupDetails.open;
  });

  const summary = document.createElement("summary");
  summary.className = "home-extra-group-summary";

  const summaryLabel = document.createElement("span");
  summaryLabel.className = "home-extra-group-summary-label";
  summaryLabel.textContent = "USEN推し活リクエスト";

  const doneMark = document.createElement("span");
  doneMark.className = "home-extra-group-done-mark show-when-daily-done";
  doneMark.textContent = "✅";
  doneMark.setAttribute("aria-label", "本日実行済み");

  summary.appendChild(summaryLabel);
  summary.appendChild(doneMark);

  const taskBody = document.createElement("div");
  taskBody.className = "home-extra-group-body home-usen-extra-body";

  const taskTitle = document.createElement("p");
  taskTitle.className = "home-usen-task-title";
  taskTitle.textContent = task.name;

  const comment = document.createElement("div");
  comment.className = "notice-box home-extra-task-comment";
  comment.textContent = normalizeDisplayNewlines(getHomeExtraTaskComment(task, "usen"));

  const actionArea = document.createElement("div");
  actionArea.className = "home-extra-task-actions";

  const index = HOME_EXTRA_USEN_TASKS.length;
  HOME_EXTRA_USEN_TASKS.push(task);

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "primary-button compact-button";
  openButton.textContent = task.url ? "ページを開く" : "USEN非対応";
  openButton.dataset.homeExtraAction = "open";
  openButton.dataset.source = "usen";
  openButton.dataset.index = String(index);

  if (!task.url) {
    openButton.disabled = true;
    openButton.classList.add("is-disabled");
  }

  const shareXButton = document.createElement("button");
  shareXButton.type = "button";
  shareXButton.className = "secondary-button compact-button";
  shareXButton.textContent = "このタスクをXでシェア";
  shareXButton.dataset.homeExtraAction = "share-x";
  shareXButton.dataset.source = "usen";
  shareXButton.dataset.index = String(index);

  const shareThreadsButton = document.createElement("button");
  shareThreadsButton.type = "button";
  shareThreadsButton.className = "secondary-button compact-button";
  shareThreadsButton.textContent = "コピーしてThreadsを開く";
  shareThreadsButton.dataset.homeExtraAction = "share-threads";
  shareThreadsButton.dataset.source = "usen";
  shareThreadsButton.dataset.index = String(index);

  actionArea.appendChild(openButton);
  actionArea.appendChild(shareXButton);
  actionArea.appendChild(shareThreadsButton);

  taskBody.appendChild(taskTitle);
  taskBody.appendChild(comment);
  taskBody.appendChild(actionArea);

  groupDetails.appendChild(summary);
  groupDetails.appendChild(taskBody);
  homeUsenExtraListElement.appendChild(groupDetails);

  const hasDailyTasks = HOME_EXTRA_DAILY_TASKS.length > 0;
  const hasUsenTasks = HOME_EXTRA_USEN_TASKS.length > 0;

  toggleHomeExtraSection(homeDailyExtraCardElement, hasDailyTasks || hasUsenTasks);
  updateDailyStartedTodayClass();
}

// ==================================================
// ホーム：期間限定
// ==================================================

function renderHomeOnceMoreList(tasks) {
  if (!homeOnceMoreListElement) {
    return;
  }

  HOME_EXTRA_ONCE_TASKS = [];
  homeOnceMoreListElement.innerHTML = "";

  const executableTasks = getExecutableHomeOnceMoreTasks(tasks);

  if (executableTasks.length === 0) {
    toggleHomeExtraSection(homeOnceMoreCardElement, false);
    return;
  }

  executableTasks.forEach((task) => {
    const index = HOME_EXTRA_ONCE_TASKS.length;
    HOME_EXTRA_ONCE_TASKS.push(task);

    homeOnceMoreListElement.appendChild(
      createHomeExtraTaskDetail({
        task,
        source: "once",
        index,
      })
    );
  });

  toggleHomeExtraSection(homeOnceMoreCardElement, true);
}

function getExecutableHomeOnceMoreTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks.filter((task) => {
    if (!task || !task.name) {
      return false;
    }

    // loadOnceTasks() でも期間内に絞っているが、念のためここでも判定
    if (!isWithinPeriod(task.from, task.to)) {
      return false;
    }

    const repeatType = getHomeTaskRepeatType(task);

    // onceは一度も実行していないものだけ
    if (repeatType === "once") {
      return !isHomeOnceTaskDone(task);
    }

    // dailyは期間内なら表示
    return repeatType === "daily";
  });
}

// ==================================================
// ホーム：おかわりタスク操作
// ==================================================

function bindHomeExtraTaskEvents() {
  bindHomeExtraListEvents(homeUsenExtraListElement);
  bindHomeExtraListEvents(homeDailyExtraListElement);
  bindHomeExtraListEvents(homeOnceMoreListElement);
}

function bindHomeExtraListEvents(container) {
  if (!container) {
    return;
  }

  container.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-home-extra-action]");

    if (!button) {
      return;
    }

    const task = getHomeExtraTaskBySource(
      button.dataset.source,
      button.dataset.index
    );

    if (!task) {
      return;
    }

    const action = button.dataset.homeExtraAction;

    if (action === "open") {
      await openHomeExtraTaskPage(task, button.dataset.source);
      return;
    }

    if (action === "share-x") {
      openHomeExtraTaskXPost(task, button.dataset.source);
      return;
    }

    if (action === "share-threads") {
      await openHomeExtraTaskThreads(task, button.dataset.source);
    }
  });
}

async function openHomeExtraTaskPage(task, source) {
  const taskUrl = getHomeExtraTaskUrl(task, source);

  if (source === "usen" && !taskUrl) {
    alert(`${task.songName || "この曲"}はUSEN推し活リクエスト非対応です。`);
    return;
  }

  if (!taskUrl) {
    return;
  }

  // デイリーで入力補助が必要な場合は、表示時点で確定済みのコピー文を使う
  if (source === "daily" && task["input-flag"] === true) {
    const copyText = task._preparedHomeCopyText || "";

    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText);
      } catch (error) {
        console.error(error);
        alert("コピーに失敗しました。ページを開く前にもう一度試してください。");
        return;
      }
    }
  }

  try {
    const logPromises = [];

    if (typeof sendHomeTaskLog === "function") {
      logPromises.push(
        sendHomeTaskLog(task, {
          source,
          url: taskUrl,
        })
      );
    }

    if (
      source === "daily" &&
      task["input-flag"] === true &&
      typeof sendRequestSongLog === "function"
    ) {
      const selectedSong = getHomeSelectedRequestSong();

      if (selectedSong) {
        logPromises.push(sendRequestSongLog(selectedSong));
      }
    }

    if (
      source === "usen" &&
      task.song &&
      typeof sendRequestSongLog === "function"
    ) {
      logPromises.push(sendRequestSongLog(task.song));
    }

    if (logPromises.length > 0) {
      await Promise.allSettled(logPromises);
    }
  } catch (error) {
    console.error("homeTask/requestSongログ送信失敗", error);
  }

  // ホームのおかわりDaily/USENから開いたタスクも、18時切替の本日実行済みにする
  if (
    (source === "daily" || source === "usen") &&
    typeof markDailyTaskDone === "function"
  ) {
    markDailyTaskDone(task, source === "usen" ? "homeUsen" : "home");
    renderHomeUsenExtraList();
    renderHomeDailyExtraList(state.dailyGroups || []);
  }

  // 期間限定 once は、ホームから開いた時点で実行済みにする
  if (source === "once" && getHomeTaskRepeatType(task) === "once") {
    markHomeOnceTaskDone(task);
    renderHomeOnceMoreList(state.onceTasks || []);
  }

  location.href = taskUrl;
}

function openHomeExtraTaskXPost(task, source) {
  const postText = buildHomeExtraTaskShareText(task, source, "x");

  if (!postText) {
    return;
  }

  const taskUrl = getHomeExtraTaskUrl(task, source);

  // ホームタスクのSNSシェアログを送信する
  // シェア対象タスクURLも snsShareLog に入れる
  if (typeof sendSnsShareLog === "function") {
    sendSnsShareLog("x", {
      source: `homeTask:${source}`,
      title: getHomeExtraTaskName(task, source),
      url: taskUrl,
    }).catch((error) => {
      console.error("snsShareLog送信失敗", error);
    });
  }

  location.href = X_POST_URL + encodeURIComponent(postText);
}

async function openHomeExtraTaskThreads(task, source) {
  const postText = buildHomeExtraTaskShareText(task, source, "threads");

  if (!postText) {
    return;
  }

  const taskUrl = getHomeExtraTaskUrl(task, source);

  try {
    await navigator.clipboard.writeText(postText);

    if (typeof sendSnsShareLog === "function") {
      sendSnsShareLog("threads", {
        source: `homeTask:${source}`,
        title: getHomeExtraTaskName(task, source),
        url: taskUrl,
      }).catch((error) => {
        console.error("snsShareLog送信失敗", error);
      });
    }

    location.href = THREADS_URL;
  } catch (error) {
    console.error(error);
    alert("コピーに失敗しました。もう一度試してください。");
  }
}

function buildHomeExtraTaskShareText(task, source, platform = "x") {
  if (source === "usen") {
    const taskUrl = getHomeExtraTaskUrl(task, source);
    const lines = [`✅${task.songName}をUSEN推し活リクエスト`];

    if (taskUrl) {
      lines.push(taskUrl);
    }

    lines.push("");
    lines.push("タムごとDailyから応援中👍");
    lines.push(getAppShareUrlByPlatform(platform));

    return lines.join("\n");
  }

  const taskName =
    task?.["short-name"] ||
    task?.shortName ||
    getHomeExtraTaskName(task, source);

  const taskUrl = getHomeExtraTaskUrl(task, source);

  const lines = [`✅${taskName}`];

  if (taskUrl) {
    lines.push(taskUrl);
  }

  lines.push("");
  lines.push("タムごとDailyから応援中👍");
  lines.push(getAppShareUrlByPlatform(platform));

  return lines.join("\n");
}

// ==================================================
// ホーム：コピー用リクエスト曲選択
// ==================================================

function initializeHomeRequestSongSelect() {
  if (!homeRequestSongSelectElement || !homeRequestSongSelectAreaElement) {
    return;
  }

  homeRequestSongSelectElement.innerHTML = "";

  if (!Array.isArray(state.requestSongs) || state.requestSongs.length === 0) {
    state.homeSelectedRequestSong = null;
    homeRequestSongSelectAreaElement.classList.add("hidden");
    renderHomeUsenExtraList();
    renderHomeDailyExtraList(state.dailyGroups || []);
    return;
  }

  const defaultSong =
    state.requestSongs.find((song) => song && song.flag === true) ||
    state.requestSongs.find((song) => song && song.name) ||
    null;

  state.homeSelectedRequestSong = state.homeSelectedRequestSong || defaultSong;

  state.requestSongs.forEach((song, index) => {
    if (!song || !song.name) {
      return;
    }

    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = song.name;

    if (
      state.homeSelectedRequestSong &&
      song.name === state.homeSelectedRequestSong.name &&
      song.url === state.homeSelectedRequestSong.url
    ) {
      option.selected = true;
    }

    homeRequestSongSelectElement.appendChild(option);
  });

  homeRequestSongSelectAreaElement.classList.remove("hidden");
  renderHomeUsenExtraList();
  renderHomeDailyExtraList(state.dailyGroups || []);
}

function bindHomeRequestSongSelectEvents() {
  if (!homeRequestSongSelectElement) {
    return;
  }

  homeRequestSongSelectElement.addEventListener("change", () => {
    const selectedIndex = Number(homeRequestSongSelectElement.value);

    if (Number.isNaN(selectedIndex)) {
      state.homeSelectedRequestSong = null;
    } else {
      state.homeSelectedRequestSong = state.requestSongs[selectedIndex] || null;
    }

    renderHomeUsenExtraList();
    renderHomeDailyExtraList(state.dailyGroups || []);
  });
}

function getHomeSelectedRequestSong() {
  if (state.homeSelectedRequestSong?.name) {
    return state.homeSelectedRequestSong;
  }

  return (
    state.requestSongs.find((song) => song && song.flag === true) ||
    state.requestSongs.find((song) => song && song.name) ||
    null
  );
}

function getHomeSelectedRequestSongName() {
  const song = getHomeSelectedRequestSong();

  return song?.name || "";
}

function buildHomeDailyTaskCopyText(item) {
  const requestType = item["request-type"];
  const templateValue = state.requestTexts[requestType];

  if (!requestType || !templateValue) {
    return "";
  }

  const musicName = getHomeSelectedRequestSongName();

  if (!musicName) {
    return "";
  }

  const template = pickRequestTextTemplate(templateValue, `home_${requestType}`);

  if (!template) {
    return "";
  }

  return template
    .replaceAll("musicname", musicName)
    .replaceAll("\\n", "\n");
}

function openHomeMenu() {
  homeMenuOverlayElement?.classList.remove("hidden");
  homeSlideMenuElement?.classList.remove("hidden");
}

function closeHomeMenu() {
  homeMenuOverlayElement?.classList.add("hidden");
  homeSlideMenuElement?.classList.add("hidden");
}

function bindHomeMenuAccordionEvents() {
  const accordionButtons = document.querySelectorAll("[data-home-menu-accordion]");

  accordionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.homeMenuAccordion;
      const detail = document.querySelector(`[data-home-menu-detail="${key}"]`);
      const arrow = button.querySelector(".home-menu-arrow");

      if (!detail) {
        return;
      }

      const isOpen = !detail.classList.contains("hidden");

      detail.classList.toggle("hidden", isOpen);

      if (arrow) {
        arrow.textContent = isOpen ? "＋" : "−";
      }
    });
  });
}
