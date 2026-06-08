// ==================================================
// shareImage.js
// SNS共有画像モーダル・画像生成・画像保存/共有を管理するファイル
// ==================================================

// ==================================================
// シェア画像の現在テーマ
// ==================================================
// 初期値は、現在アプリで選択されているテーマから決める
let currentShareImageTheme = getCurrentThemeKeyForShareImage();

// ==================================================
// シェア画像の現在スタイル
// ==================================================
// simple: 通常版
// illustrated: イラスト版
let currentShareImageStyle = "simple";

// ==================================================
// シェア画像スタイル用チェックボックス取得
// ==================================================
function getShareImageIllustratedCheckboxElement() {
  return document.getElementById("shareImageIllustratedCheckbox");
}

// ==================================================
// シェア画像スタイル用チェックボックスのラベル取得
// ==================================================
function getShareImageIllustratedCheckboxLabelElement() {
  const checkbox = getShareImageIllustratedCheckboxElement();

  if (!checkbox) {
    return null;
  }

  return checkbox.closest("label");
}

// ==================================================
// シェア画像スタイル取得
// ==================================================
function getCurrentShareImageStyle() {
  // normalテーマは必ずシンプル
  if (currentShareImageTheme === "normal") {
    return "simple";
  }

  const checkbox = getShareImageIllustratedCheckboxElement();

  if (!checkbox) {
    return "simple";
  }

  return checkbox.checked ? "illustrated" : "simple";
}

// ==================================================
// シェア画像スタイルチェックボックス更新
// ==================================================
function updateShareImageStyleCheckbox() {
  const checkbox = getShareImageIllustratedCheckboxElement();
  const label = getShareImageIllustratedCheckboxLabelElement();

  if (!checkbox) {
    currentShareImageStyle = "simple";
    return;
  }

  // normalテーマはイラスト版なし
  if (currentShareImageTheme === "normal") {
    checkbox.checked = false;
    checkbox.disabled = true;
    currentShareImageStyle = "simple";

    if (label) {
      label.classList.add("is-disabled");
    }

    return;
  }

  checkbox.disabled = false;

  if (label) {
    label.classList.remove("is-disabled");
  }

  currentShareImageStyle = checkbox.checked ? "illustrated" : "simple";
}

// ==================================================
// SNS共有画像イベント登録
// ==================================================
// app.js から呼び出して、共有画像モーダル関連のイベントをまとめて登録する
function bindShareImageEvents() {
  // ==================================================
  // シェア画像モーダルを開く
  // ==================================================

  // 「画像を作る」ボタン押下時
  addClickEvent(openShareImageModalButtonElement, () => {
    // モーダル要素がない場合は何もしない
    if (!shareImageModalElement) {
      return;
    }

    // シェア画像モーダルを表示する
    shareImageModalElement.classList.remove("hidden");

    // テーマに応じてスタイルチェックボックスを更新する
    updateShareImageStyleCheckbox();

    // 現在の投稿項目・テーマで画像を描画する
    renderShareImage();
  });

  // ==================================================
  // シェア画像モーダルを閉じる
  // ==================================================

  // 閉じるボタン押下時
  addClickEvent(closeShareImageModalButtonElement, () => {
    // モーダル要素がない場合は何もしない
    if (!shareImageModalElement) {
      return;
    }

    // シェア画像モーダルを非表示にする
    shareImageModalElement.classList.add("hidden");
  });

  // モーダルの外側クリック時
  // モーダル本文ではなく、背景部分をクリックした場合だけ閉じる
  if (shareImageModalElement) {
    shareImageModalElement.addEventListener("click", (event) => {
      if (event.target === shareImageModalElement) {
        shareImageModalElement.classList.add("hidden");
      }
    });
  }

  // ==================================================
  // シェア画像テーマ切り替え
  // ==================================================

  // テーマ選択ボタンを1つずつ処理する
  shareImageThemeButtonElements.forEach((button) => {
    button.addEventListener("click", () => {
      // ボタンに設定された data-share-image-theme を取得する
      // なければ現在のアプリテーマから判定する
      const themeKey =
        button.dataset.shareImageTheme || getCurrentThemeKeyForShareImage();

      // 現在テーマを更新
      currentShareImageTheme = themeKey;

      // normalならチェック不可・シンプル固定にする
      updateShareImageStyleCheckbox();

      // 選択テーマで画像を再描画する
      renderShareImage(currentShareImageTheme);
    });
  });

  // ==================================================
  // シェア画像スタイル切り替え
  // ==================================================

  const shareImageIllustratedCheckboxElement =
    getShareImageIllustratedCheckboxElement();

  if (shareImageIllustratedCheckboxElement) {
    shareImageIllustratedCheckboxElement.addEventListener("change", () => {
      // チェック状態を currentShareImageStyle に反映
      updateShareImageStyleCheckbox();

      // 現在テーマ・現在スタイルで再描画
      renderShareImage(currentShareImageTheme);
    });
  }

  // ==================================================
  // シェア画像保存/共有
  // ==================================================

  // 画像保存ボタン押下時
  addClickEvent(downloadShareImageButtonElement, async () => {
    // 保存前に現在テーマ・現在スタイルで画像を再描画する
    await renderShareImage(currentShareImageTheme);

    // canvasから画像Blobを取得する
    const blob = await getShareImageBlob();

    // Blobが作れない場合はエラー表示
    if (!blob) {
      showError(postErrorAreaElement, "画像の作成に失敗しました。");
      return;
    }

    // Web Share APIで共有するためのFileを作成
    const file = new File([blob], "tamugoto-daily-share.png", {
      type: "image/png",
    });

    try {
      // PWA / スマホ向け：共有シートを優先
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "タムごとDaily",
          text: `タムごとDaily 本日のタスク完了👍
        ${location.origin}${location.pathname}`,
        });

        // 成功時はエラー表示を消す
        hideError(postErrorAreaElement);
        return;
      }

      // 共有シート非対応環境：通常ダウンロード
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "tamugoto-daily-share.png";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 生成したObject URLを少し後で破棄する
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      // 成功時はエラー表示を消す
      hideError(postErrorAreaElement);
    } catch (error) {
      // 共有シートをユーザーがキャンセルした場合はエラー扱いにしない
      if (error.name === "AbortError") {
        return;
      }

      // その他の保存/共有失敗はエラー表示
      console.error(error);
      showError(postErrorAreaElement, "画像の保存に失敗しました。");
    }
  });
}

// ==================================================
// canvasから画像Blobを取得
// ==================================================
// shareImageCanvasElement に描画済みの内容を PNG Blob として取得する
function getShareImageBlob() {
  return new Promise((resolve) => {
    // canvasが存在しない場合は null を返す
    if (!shareImageCanvasElement) {
      resolve(null);
      return;
    }

    // canvasをPNG形式のBlobへ変換する
    shareImageCanvasElement.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

// ==================================================
// 現在のアプリテーマからシェア画像テーマを取得
// ==================================================
// localStorage の selectedTheme を、canvas描画用テーマ名に変換する
function getCurrentThemeKeyForShareImage() {
  // アプリ本体で保存しているテーマ
  const savedTheme = localStorage.getItem("selectedTheme");

  // アプリテーマ名 → シェア画像テーマ名の対応表
  const themeMap = {
    red: "red",
    purple: "purple",
    green: "green",
    sky: "blue",
    blue: "blue",
    lime: "lime",
    pink: "pink",
    yellow: "yellow",
    white: "white",
    normal: "normal",
  };

  // 未対応テーマの場合は normal にフォールバック
  return themeMap[savedTheme] || "normal";
}

// ==================================================
// シェア画像の日付テキスト作成
// ==================================================
// 画像内に表示する日付を M/D 形式で返す
function getShareImageDateText() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

// ==================================================
// シェア画像用：USEN推しリク曲名
// ==================================================
// 選択済みUSEN曲があれば「USEN：曲名」の形式で返す
function getShareImageRequestText() {
  // USEN推しリク曲が未選択なら表示しない
  if (!state.selectedRequestSong) {
    return "";
  }

  // 曲名を取得
  const name = state.selectedRequestSong.name || "";

  // 曲名があれば画像用テキストを返す
  return name ? `USEN：${name}` : "";
}

// ==================================================
// シェア画像用：BGM曲名
// ==================================================
// 選択済みSpotify曲があれば「BGM：曲名」の形式で返す
function getShareImageBgmText() {
  // Spotify曲が未選択、またはURLがない場合は表示しない
  if (!state.selectedSong || !state.selectedSong.url) {
    return "";
  }

  // 曲名を取得
  const name = state.selectedSong.name || "";

  // 曲名があれば画像用テキストを返す
  return name ? `BGM：${name}` : "";
}

// ==================================================
// シェア画像用タスク名取得
// ==================================================
// short-name / shortName / name の順で画像用の短い表示名を返す
function getShareImageTaskName(item) {
  // itemがない場合は空文字
  if (!item) {
    return "";
  }

  // 画像では短い名前を優先する
  return item["short-name"] || item.shortName || item.name || "";
}

// ==================================================
// シェア画像用タスク一覧取得
// ==================================================
// 期間限定タスク + 完了済みデイリータスクを画像用の項目としてまとめる
// 現状は getCheckedPostItemsForShareImage() を主に使っているため、補助関数として残す
function getShareImageTaskItems() {
  const items = [];

  // 選択済み期間限定タスクを追加
  state.selectedOnceTasks.forEach((task) => {
    const name = getShareImageTaskName(task);

    if (name) {
      items.push(name);
    }
  });

  // 完了済みデイリータスクを追加
  state.completedDailyItems.forEach((item) => {
    const name = getShareImageTaskName(item);

    if (name) {
      items.push(name);
    }
  });

  return items;
}

// ==================================================
// チェック済み投稿項目からシェア画像用項目を取得
// ==================================================
// 投稿文編集画面でチェックされている項目のうち、画像に載せるものだけ返す
function getCheckedPostItemsForShareImage() {
  const items = [];

  // postItemsが配列でない場合は空配列
  if (!Array.isArray(state.postItems)) {
    return items;
  }

  // 投稿項目を1件ずつ確認する
  state.postItems.forEach((item) => {
    // itemがない、または未チェックなら対象外
    if (!item || item.checked !== true) {
      return;
    }

    // SNSシェア、USEN推しリク、BGMは画像のチェック項目には入れない
    // USEN/BGMは専用の表示枠で出すため重複防止
    if (
      item.id === "app-share" ||
      item.id === "usen-request" ||
      item.id === "spotify-bgm"
    ) {
      return;
    }

    // 画像用テキストを優先して取得
    const name =
      item.imageText ||
      item["short-name"] ||
      item.shortName ||
      item.postText ||
      item.name ||
      "";

    // 名前がある場合だけ画像項目へ追加
    if (name) {
      items.push(name);
    }
  });

  return items;
}

// ==================================================
// シェア画像描画
// ==================================================
// 現在の投稿項目・選択曲・テーマをもとにcanvasへ画像を描画する
async function renderShareImage(themeKey = currentShareImageTheme) {
  // canvasがない場合は何もしない
  if (!shareImageCanvasElement) {
    return;
  }

  // 投稿文編集画面でチェック済みの項目を取得
  const items = getCheckedPostItemsForShareImage();

  // 画像に入れる内容が何もない場合はエラー表示
  if (items.length === 0 && !state.selectedRequestSong && !state.selectedSong) {
    showError(postErrorAreaElement, "画像にする内容がありません。");
    return;
  }

  // 現在選択中の画像テーマを更新
  currentShareImageTheme = themeKey;

  // テーマに応じてチェックボックス状態を反映
  updateShareImageStyleCheckbox();

  // 現在の画像スタイルを取得
  currentShareImageStyle = getCurrentShareImageStyle();

  // canvas.js の drawShareImage() で実際に描画する
  await drawShareImage(shareImageCanvasElement, {
    themeKey: currentShareImageTheme,
    imageStyle: currentShareImageStyle,
    dateText: getShareImageDateText(),
    appName: "タムごとDaily",
    title: "タスク完了！",
    requestText: getShareImageRequestText(),
    bgmText: getShareImageBgmText(),
    items,
  });

  // 描画成功時はエラー表示を消す
  hideError(postErrorAreaElement);
}
