import json
from pathlib import Path

# スクリプトが scripts/build.py にある場合、
# .parent は scripts/ を指すため、もう一つ上のリポジトリルートを指定します
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"

# 出力先ディレクトリがない場合は自動作成
DIST_DIR.mkdir(parents=True, exist_ok=True)


def load_json(filename: str):
    path = DATA_DIR / filename

    if not path.exists():
        # デバッグしやすいよう、探している絶対パスをエラーに出す
        raise FileNotFoundError(f"入力ファイルが見つかりません: {path.absolute()}")

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
    # 拡張子 .json を含めて指定
    build_song_menu("requestSongJson.json", "requestSongShortcutJson.json")
    build_song_menu("spotifySongJson.json", "spotifySongShortcutJson.json")


if __name__ == "__main__":
    main()