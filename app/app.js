<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>secondz Daily Routine⌛</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="app">
    <section id="spotifyStep" class="step-screen">
      <header class="header">
        <p class="step-label">STEP 1</p>
        <h1>今日のBGM🎧</h1>
        <p class="description">
          Spotifyで<strong>１日１曲</strong>聞くと月間アクティブユーザーに貢献👍<br>
          聴きながらデイリータスク終わらせちゃお😊
        </p>
      </header>

      <section id="selectedArea" class="selected-area hidden">
        <p class="selected-label">選択中</p>
        <p id="selectedSongName" class="selected-song"></p>

        <button id="openSpotifyButton" class="primary-button">
          Spotifyで開く
        </button>

        <button id="spotifyNextButton" class="secondary-button hidden">
          次へ
        </button>
      </section>

      <section id="spotifyErrorArea" class="error-area hidden"></section>

      <section class="scroll-area">
        <section class="song-section">
          <h2>おすすめ</h2>
          <div id="recommendedSongs" class="song-list"></div>
        </section>

        <section class="song-section">
          <button id="toggleOtherSongsButton" class="accordion-button" type="button">
            <span>その他</span>
            <span id="toggleOtherSongsIcon">＋</span>
          </button>

          <div id="otherSongsWrapper" class="accordion-content hidden">
            <div id="otherSongs" class="song-list"></div>
          </div>
        </section>
      </section>
    </section>

    <section id="onceListSelectStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 2</p>
        <h1>期間限定タスク✅</h1>
        <p class="description">
          今日やるものにチェックを入れてください。<br>
          デフォルトでは期限内のタスクをすべて「済み」扱いにしています。
        </p>
      </header>

      <section id="onceListErrorArea" class="error-area hidden"></section>

      <section class="scroll-area">
        <section class="check-control-area">
          <div class="button-row">
            <button id="checkAllOnceTasksButton" class="secondary-button compact-button">
              すべてチェック
            </button>
            <button id="clearAllOnceTasksButton" class="secondary-button compact-button">
              すべてクリア
            </button>
          </div>
        </section>

        <div id="onceTaskList" class="check-list"></div>

        <section class="bottom-action-area">
          <button id="startOnceTasksButton" class="primary-button">
            次へ
          </button>
        </section>
      </section>
    </section>

    <section id="onceTaskRunStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 2</p>
        <h1>期間限定タスクを実行</h1>
        <p id="onceTaskProgress" class="description"></p>
      </header>

      <section class="task-card">
        <p class="selected-label">タスク</p>
        <h2 id="onceTaskName" class="task-title"></h2>

        <div id="onceTaskMessageArea" class="notice-box"></div>

        <button id="openOnceTaskUrlButton" class="primary-button">
          ページを開く
        </button>

        <button id="onceTaskNextButton" class="secondary-button hidden">
          次へ
        </button>
      </section>

      <section id="onceTaskRunErrorArea" class="error-area hidden"></section>
    </section>

    <section id="requestSongStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 3</p>
        <h1>本日のリクエスト曲🎶</h1>
        <p class="description">
          今日リクエストする曲を選んでください。<br>
          おすすめ曲を優先表示しています。
        </p>
      </header>

      <section id="selectedRequestSongArea" class="selected-area hidden">
        <p class="selected-label">選択中</p>
        <p id="selectedRequestSongName" class="selected-song"></p>

        <button id="openRequestSongButton" class="primary-button">
          リクエストページを開く
        </button>

        <button id="requestSongNextButton" class="secondary-button hidden">
          次へ
        </button>
      </section>

      <section id="requestSongErrorArea" class="error-area hidden"></section>

      <section class="scroll-area">
        <section class="song-section">
          <h2>おすすめ</h2>
          <div id="recommendedRequestSongs" class="song-list"></div>
        </section>

        <section class="song-section">
          <button id="toggleOtherRequestSongsButton" class="accordion-button" type="button">
            <span>その他</span>
            <span id="toggleOtherRequestSongsIcon">＋</span>
          </button>

          <div id="otherRequestSongsWrapper" class="accordion-content hidden">
            <div id="otherRequestSongs" class="song-list"></div>
          </div>
        </section>
      </section>
    </section>

    <section id="dailyTaskStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 4</p>
        <h1>リクエストループ📮</h1>
        <p id="dailyTaskHeaderDescription" class="description"></p>
      </header>

      <section class="task-card">
        <p id="dailyTaskGroupName" class="group-label"></p>
        <p id="dailyTaskProgress" class="description"></p>

        <p class="selected-label">タスク</p>
        <h2 id="dailyTaskName" class="task-title"></h2>

        <div id="dailyTaskCommentArea" class="notice-box"></div>

        <section id="dailyTaskCopyArea" class="copy-area hidden">
          <p class="selected-label">コピーする文言</p>
          <div id="dailyTaskCopyText" class="copy-text"></div>

          <button id="copyDailyTaskTextButton" class="secondary-button">
            コピーする
          </button>
        </section>

        <button id="openDailyTaskUrlButton" class="primary-button">
          ページを開く
        </button>

        <button id="dailyTaskNextButton" class="secondary-button hidden">
          次へ
        </button>
      </section>

      <section id="dailyTaskErrorArea" class="error-area hidden"></section>
    </section>

    <section id="dailyGroupEndStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 4</p>
        <h1>リクエストループ📮</h1>
      </header>

      <section class="task-card">
        <p id="endedGroupName" class="group-label"></p>
        <h2 class="task-title">もうちょっと頑張る？</h2>

        <button id="continueDailyGroupButton" class="primary-button">
          頑張る！
        </button>

        <button id="stopDailyGroupButton" class="secondary-button">
          今日はここまで
        </button>
      </section>
    </section>

    <section id="postAskStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 5</p>
        <h1>ポストする？📝</h1>
        <p class="description">
          今日のリクエスト報告文を作れます。
        </p>
      </header>

      <section class="task-card">
        <button id="makePostButton" class="primary-button">
          ポスト文を作る
        </button>

        <button id="skipPostButton" class="secondary-button">
          投稿しない
        </button>
      </section>
    </section>

    <section id="postEditStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">STEP 5</p>
        <h1>ポスト文作成📝</h1>
        <p class="description">
          追加したい項目にチェックを入れてください。
        </p>
      </header>

      <section id="postErrorArea" class="error-area hidden"></section>

      <section class="scroll-area">
        <section class="task-card">
          <p class="selected-label">固定で入る内容</p>
          <div id="fixedPostTextPreview" class="copy-text"></div>
        </section>

        <section class="check-control-area">
          <div class="button-row">
            <button id="checkAllPostItemsButton" class="secondary-button compact-button">
              すべてチェック
            </button>
            <button id="clearAllPostItemsButton" class="secondary-button compact-button">
              すべてクリア
            </button>
          </div>
        </section>

        <div id="postItemList" class="check-list"></div>

        <section class="task-card">
          <p class="selected-label">チェック</p>
          <p id="postTextCount" class="description"></p>
          <p id="postLinkCount" class="description"></p>
        </section>

        <section class="task-card">
          <p class="selected-label">生成文</p>
          <div id="generatedPostText" class="copy-text"></div>

          <button id="copyPostTextButton" class="secondary-button">
            コピーする
          </button>

          <button id="openXPostButton" class="primary-button">
            Xに投稿
          </button>

          <button id="openThreadsButton" class="secondary-button">
            コピーしてThreadsを開く
          </button>
        </section>
      </section>
    </section>

    <section id="placeholderNextStep" class="step-screen hidden">
      <header class="header">
        <p class="step-label">NEXT</p>
        <h1>ここまで完了⌛</h1>
        <p id="placeholderMessage" class="description"></p>
      </header>
    </section>
  </main>

  <script src="./app.js"></script>
</body>
</html>
