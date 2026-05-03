import json
from pathlib import Path

# スクリプトの場所を基準にプロジェクトのルートを設定
# main.pyがリポジトリのルート直下にある場合は .parent
# もし scripts/ などのサブフォルダ内にある場合は .parents[1] に変更してください
ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"

# 出力先ディレクトリがない場合は自動作成
DIST_DIR.mkdir(parents=True, exist_ok=True)


def load_json(filename: str):
    path = DATA_DIR / filename
    
    if not path.exists():
        raise FileNotFoundError(f"入力ファイルが見つかりません: {path}")

    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filename: str, data):
    # ファイルを書き出し（minifyして保存）
    with (DIST_DIR / filename).open("w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def build_song_menu(src_filename: str, dist_filename: str):
    """
    ファン活動のルーティンを自動化するためのJSONを構築します。
    """
    items = load_json(src_filename)

    true_names = []
    false_names = []
    url_by_name = {}

    for item in items:
        name = item.get("name", "")
        url = item.get("url", "")
        flag = item.get("flag", False)

        if not name:
            continue

        url_by_name[name] = url

        if flag is True:
            true_names.append(name)
        else:
            false_names.append(name)

    save_json(
        dist_filename,
        {
            "trueNames": true_names,
            "falseNames": false_names,
            "allNames": true_names + false_names,
            "urlByName": url_by_name,
        },
    )


def main():
    # 実際のファイル名（拡張子 .json）に合わせて指定
    # これにより GitHub Actions 上で dist/ 内に正しくファイルが生成されます
    build_song_menu("requestSong.json", "requestSongShortcut.json")
    build_song_menu("spotifySong.json", "spotifySongShortcut.json")


if __name__ == "__main__":
    main()
