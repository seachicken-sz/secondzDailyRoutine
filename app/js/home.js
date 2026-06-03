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
  // ホーム目次
  // ==================================================
  bindHomeIndexEvents();

  // ==================================================
  // ホーム限定：上に戻るボタン
  // ==================================================
  bindHomeBackToTopButton();
  // ==================================================
  // ホームのおかわりタスク操作
  // ==================================================
  bindHomeExtraTaskEvents();
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

// ==================================================
// ホーム目次
// ==================================================

// ホーム目次を現在存在するホーム内セクションから作る
function updateHomeIndex() {
  if (!homeIndexListElement) {
    return;
  }
  const indexItems = [];
  if (isVisibleHomeSection("homeDailyExtraCard")) {
    indexItems.push({
      label: "おかわりDaily",
      targetId: "homeDailyExtraCard",
    });
  }
  if (isVisibleHomeSection("homeOnceMoreCard")) {
    indexItems.push({
      label: "期間限定",
      targetId: "homeOnceMoreCard",
    });
  }
  if (isVisibleHomeSection("homeInfoCard")) {
    indexItems.push({
      label: "最近のタムごと",
      targetId: "homeInfoCard",
    });
  }
  homeIndexListElement.innerHTML = "";
  if (indexItems.length === 0) {
    homeIndexListElement.innerHTML = `<p class="empty-text">表示できる項目はありません。</p>`;
    return;
  }

  indexItems.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-index-button";
    button.textContent = item.label;
    button.dataset.homeIndexTarget = item.targetId;

    homeIndexListElement.appendChild(button);
  });
}
function isVisibleHomeSection(id) {
  const element = document.getElementById(id);

  return Boolean(element && !element.classList.contains("hidden"));
}
// ホーム目次クリックイベント
function bindHomeIndexEvents() {
  if (!homeIndexListElement) {
    return;
  }

  homeIndexListElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-index-target]");

    if (!button) {
      return;
    }

    scrollHomeToElement(button.dataset.homeIndexTarget);
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

  return task?.name || "名称未設定";
}

// タスクURL取得
function getHomeExtraTaskUrl(task, source) {
  if (source === "daily") {
    return getDailyTaskItemUrl(task);
  }

  return task?.url || "";
}

// タスク説明文取得
function getHomeExtraTaskComment(task, source) {
  if (source === "daily") {
    return task?.comment || "ページを開いてタスクを完了してください。";
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

  return null;
}

// タスク詳細DOMを作る
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
  body.appendChild(actionArea);

  details.appendChild(summary);
  details.appendChild(body);

  return details;
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
    toggleHomeExtraSection(homeDailyExtraCardElement, false);
    updateHomeIndex();
    return;
  }

  groups.forEach((group) => {
    const items = getDailyGroupItems(group);

    if (items.length === 0) {
      return;
    }

    const groupDetails = document.createElement("details");
    groupDetails.className = "home-extra-group";

    const summary = document.createElement("summary");
    summary.className = "home-extra-group-summary";
    summary.textContent = group.listName || "グループ未設定";

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

  const hasTasks = HOME_EXTRA_DAILY_TASKS.length > 0;

  toggleHomeExtraSection(homeDailyExtraCardElement, hasTasks);
  updateHomeIndex();
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
    updateHomeIndex();
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
  updateHomeIndex();
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

  if (!taskUrl) {
    return;
  }

  // デイリーで入力補助が必要な場合は、ホーム用の曲名でコピーする
  if (source === "daily" && task["input-flag"] === true) {
    const copyText = buildHomeDailyTaskCopyText(task);

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

  // ホームからタスクを開いたログを送信する
  // 遷移直前なので、ここだけはawaitしてから移動する
  if (typeof sendHomeTaskLog === "function") {
    try {
      await sendHomeTaskLog(task, {
        source,
        url: taskUrl
      });
    } catch (error) {
      console.error("homeTaskLog送信失敗", error);
    }
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
      url: taskUrl
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
        url: taskUrl
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
  const taskName =
    task?.["short-name"] ||
    task?.shortName ||
    getHomeExtraTaskName(task, source);

  const taskUrl = getHomeExtraTaskUrl(task, source);

  const lines = [
    `✅${taskName}`,
  ];

  if (taskUrl) {
    lines.push(taskUrl);
  }

  lines.push("");
  lines.push("タムごとDailyから応援中👍");
  lines.push(getAppShareUrlByPlatform(platform));

  return lines.join("\n");
}
