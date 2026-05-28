// ==================================================
// post.js
// SNS共有確認画面・投稿文編集画面・投稿/コピー処理を管理するファイル
// ==================================================

// ==================================================
// SNS共有画面イベント登録
// ==================================================
// app.js から呼び出して、SNS共有確認〜投稿文編集画面のイベントをまとめて登録する
function bindPostEvents() {
  // ==================================================
  // SNS共有確認画面
  // ==================================================

  // SNS共有確認画面の「共有する！」ボタン押下時
  addClickEvent(makePostButtonElement, () => {
    // 投稿文編集画面へ進む
    showPostEditStep();
  });

  // SNS共有確認画面の「やめとく」ボタン押下時
  addClickEvent(skipPostButtonElement, () => {
    // YouTube確認画面へ進む
    showYoutubeAskStep();
  });

  // ==================================================
  // 投稿文プレビュー切り替え
  // ==================================================

  // X版プレビュータブ押下時
  addClickEvent(postPreviewXTabButtonElement, () => {
    // 投稿文プレビューをX用に切り替える
    setPostPreviewPlatform("x");
  });

  // Threads版プレビュータブ押下時
  addClickEvent(postPreviewThreadsTabButtonElement, () => {
    // 投稿文プレビューをThreads用に切り替える
    setPostPreviewPlatform("threads");
  });

  // ==================================================
  // X投稿文コピー
  // ==================================================

  // X版投稿文をコピーするボタン押下時
  addClickEvent(copyXPostTextButtonElement, async () => {
    // X投稿では必ずX版の投稿文を使う
    const postText = buildPostText("x");

    // 投稿文が空の場合はエラー表示して処理を止める
    if (!postText) {
      showError(postErrorAreaElement, MESSAGES.errors.noCopyPostText);
      return;
    }

    try {
      // X版投稿文をクリップボードへコピー
      await navigator.clipboard.writeText(postText);

      // コピー成功後、ボタン文言を一時的に変更する
      if (copyXPostTextButtonElement) {
        copyXPostTextButtonElement.textContent = "コピーしました";
      }

      // コピー成功時はエラー表示を消す
      hideError(postErrorAreaElement);
    } catch (error) {
      // コピーに失敗した場合は、手動コピーを促す
      console.error(error);
      showError(postErrorAreaElement, MESSAGES.errors.copyFailed);
    }
  });

  // ==================================================
  // X投稿
  // ==================================================

  // Xに投稿ボタン押下時
  addClickEvent(openXPostButtonElement, () => {
    // X投稿では必ずX版の投稿文を使う
    const postText = buildPostText("x");

    // 投稿文が空の場合はエラー表示して処理を止める
    if (!postText) {
      showError(postErrorAreaElement, MESSAGES.errors.noPostText);
      return;
    }

    // SNS共有ログを送信する
    // ログ送信に失敗しても投稿遷移は止めない
    sendSnsShareLog("x").catch((error) => {
      console.error("snsShareLog送信失敗", error);
    });

    // X投稿画面用URLを作成して移動
    const url = X_POST_URL + encodeURIComponent(postText);
    location.href = url;
  });

  // ==================================================
  // Threads投稿
  // ==================================================

  // Threadsを開くボタン押下時
  addClickEvent(openThreadsButtonElement, async () => {
    // Threads投稿では必ずThreads版の投稿文を使う
    const postText = buildPostText("threads");

    // 投稿文が空の場合はエラー表示して処理を止める
    if (!postText) {
      showError(postErrorAreaElement, MESSAGES.errors.noPostText);
      return;
    }

    try {
      // Threadsは投稿文をURLに渡せないため、先にクリップボードへコピーする
      await navigator.clipboard.writeText(postText);

      // コピー成功時はエラー表示を消す
      hideError(postErrorAreaElement);

      // SNS共有ログを送信する
      // ログ送信に失敗してもThreads遷移は止めない
      sendSnsShareLog("threads").catch((error) => {
        console.error("snsShareLog送信失敗", error);
      });

      // Threadsへ移動
      location.href = THREADS_URL;
    } catch (error) {
      // コピーに失敗した場合は、手動コピーを促す
      console.error(error);
      showError(postErrorAreaElement, MESSAGES.errors.copyFailed);
    }
  });

  // ==================================================
  // 投稿文編集画面：「次へ」ボタン
  // ==================================================

  // 投稿文編集画面の次へボタン押下時
  addClickEvent(postNextButtonElement, () => {
    // YouTube確認画面へ進む
    showYoutubeAskStep();
  });
}

// ==================================================
// SNS共有確認画面表示
// ==================================================
// デイリータスク終了後に呼ばれる
// 途中再開用の保存を止め、デイリータスクログを送信してSNS共有確認画面を表示する
function showPostAskStep() {
  // ここ以降はタスク本編が完了した扱いなので、途中再開保存を止める
  state.isFlowStateSaveDisabled = true;

  // 保存済みの途中再開データを削除する
  clearFlowState();

  // デイリータスクログを送信する
  sendSheetLogOnPostAskStep();

  // SNS共有確認画面を表示する
  // saveFlow: false にして、この画面を途中再開対象にしない
  showOnlyStep(postAskStepElement, { saveFlow: false });
}

// ==================================================
// デイリータスクログ送信
// ==================================================
// SNS共有確認画面に到達したタイミングで、完了済みデイリータスクを1回だけ送信する
function sendSheetLogOnPostAskStep() {
  // 同一フロー内で送信済みなら二重送信しない
  if (state.isSheetLogSentInCurrentFlow) {
    return;
  }

  // 完了済みデイリータスクログを送信する
  // ログ送信に失敗しても画面遷移は止めない
  sendDailyTaskLog(state.completedDailyItems).catch((error) => {
    console.error("dailyTaskLog送信失敗", error);
  });

  // 同一フロー内での再送信防止フラグを立てる
  state.isSheetLogSentInCurrentFlow = true;
}

// ==================================================
// 投稿文編集画面表示
// ==================================================
// SNS共有確認画面で「共有する！」を押した時に呼ばれる
// 投稿用アイテムを作成し、一覧とプレビューを初期表示する
function showPostEditStep() {
  // 投稿文に入れる項目一覧を作成する
  // 実際の生成ルールは postBuilder.js 側で管理する
  state.postItems = buildPostItems();

  // 投稿項目一覧を描画する
  renderPostItemList(state.postItems);

  // 初期表示はX版プレビューにする
  setPostPreviewPlatform("x");

  // 投稿文編集画面を表示する
  showOnlyStep(postEditStepElement);
}
