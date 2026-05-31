// ==================================================
// 描画処理
// ==================================================
function renderHomeOnceTaskList(tasks) {
  if (!homeOnceTaskListElement) {
    return;
  }
  homeOnceTaskListElement.innerHTML = "";
  if (!tasks || tasks.length === 0) {
    homeOnceTaskListElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.onceTasks}</p>`;
    return;
  }
  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "home-list-item";
    item.textContent = `～${formatTaskLimitDate(task.to)} ${task.name}`;
    homeOnceTaskListElement.appendChild(item);
  });
}

function renderHomeInfoList(items) {
  if (!homeInfoListElement) {
    return;
  }

  homeInfoListElement.innerHTML = "";

  if (!items || items.length === 0) {
    homeInfoListElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.homeInfo}</p>`;
    return;
  }

  // YYYY-MM-DD / YYYY-MM-DDTHH:mm:ss+09:00 を安全に日時化する
  const getDateTimeValue = (dateValue) => {
    if (!dateValue) {
      return Number.MAX_SAFE_INTEGER;
    }

    const value = String(dateValue).trim();

    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    // YYYY-MM-DD だけなら日本時間の0時として扱う
    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00+09:00`
      : value;

    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      return Number.MAX_SAFE_INTEGER;
    }

    return date.getTime();
  };

  // 画面に表示したい日付を並び替え基準にする
  // displayDate があれば最優先
  // なければ従来項目から拾う
  const getHomeInfoDisplayDateTime = (item) => {
    return getDateTimeValue(
      item.displayDate ||
      item.release ||
      item.from ||
      item.to
    );
  };

  // 表示日が古い順に並べる
  const sortedItems = [...items].sort((a, b) => {
    return getHomeInfoDisplayDateTime(a) - getHomeInfoDisplayDateTime(b);
  });

  sortedItems.forEach((item) => {
    const dateLabel = formatHomeInfoDateLabel(item);
    const text = dateLabel ? `${dateLabel} ${item.name}` : item.name;
    const hasUrl = item.url && String(item.url).trim() !== "";

    if (hasUrl) {
      const link = document.createElement("a");
      link.className = "home-list-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = text;
      homeInfoListElement.appendChild(link);
      return;
    }

    const div = document.createElement("div");
    div.className = "home-list-item";
    div.textContent = text;
    homeInfoListElement.appendChild(div);
  });
}

function renderSpotifySongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button spotify-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectSong(song);
    });

    container.appendChild(button);
  });
}

function renderRequestSongList(container, songs) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-button request-song-button";
    button.textContent = song.name;

    button.addEventListener("click", () => {
      selectRequestSong(song);
    });

    container.appendChild(button);
  });
}

function renderOnceTaskCheckList(tasks) {
  if (!onceTaskListElement) {
    return;
  }

  onceTaskListElement.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    onceTaskListElement.innerHTML = `<p class="empty-text">${MESSAGES.empty.onceTasks}</p>`;
    return;
  }

  tasks.forEach((task, index) => {
    const isDone = isOnceTaskDone(task);

    const label = document.createElement("label");
    label.className = "check-item";

    if (isDone) {
      label.classList.add("is-done");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !isDone;
    checkbox.dataset.index = String(index);

    const text = document.createElement("span");
    text.textContent = isDone ? `${task.name}（完了済み）` : task.name;

    label.appendChild(checkbox);
    label.appendChild(text);
    onceTaskListElement.appendChild(label);
  });
}
