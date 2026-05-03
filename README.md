各データについて

〇data/listJson.json
リクエスト先一覧。ひとかたまりで続ける？メニューが出る。
強制的に長くするとモチベが下がりそうなので分けてます。

・listName→特に使ってないが今後SNS共有などで使えると良し？
・lastFlag→最後のもの以外falseで。trueにするとそれ以降ぜんぶ無視します。過去のものとか試験的に格納するのにあり？
・items→この中にリスト一覧
itemsの中のキー
・name→ページタイトル
・url→ページURL
・request-type→ペーストする系の時の形式。text,music,artist/music,music/artistの四種。
・request-input→ペーストするときの入力欄名称
・comment→通知文言
・input-flag→ペーストの有無を判定
・alert-flag→アラートの有無を判定

〇data/spotifySongJson.json
〇data/requestSongJson.json
リクエスト曲、Spotify再生曲一覧。どちらも構成は同じです。
新曲が出たら追加（たぶん上側に追加した方がいい感じ）

・name→曲名
・url→それぞれ末尾のID
・flag→これがtrueだと最初に表示されます（falseだと「その他」選択時のみ表示）

〇data/youtubeMVListJson.json
〇data/youtubePlayListJson.json
YoutubeのMVと再生リスト。
新曲が出たら上に追加、再生リストは順次入れ替え（予定）。

・name→動画または再生リスト名
・url→動画または再生リストのURL

〇data/requestTextJson.json
↑のペーストするときの形式定義。
musicnameがショートカットの中で選択した曲名に置き換わります。
形式名:形式文で作成。
