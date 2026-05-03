import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"

# 出力先ディレクトリがない場合は作成
DIST_DIR.mkdir(parents=True, exist_ok=True)

def load_json(filename: str):
    # 拡張子がなければ補完する設定にすると親切
    path = DATA_DIR / filename
    if not path.suffix:
        path = path.with_suffix(".json")

    if not path.exists():
        raise FileNotFoundError(f"入力ファイルが見つかりません: {path}")

    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_json(filename: str, data):
    path = DIST_DIR / filename
    if not path.suffix:
        path = path.with_suffix(".json")
        
    with path.open("w", encoding="utf-8", newline="\n") as f:
        # デバッグしやすいよう、indent=4 を入れるか検討してください
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

def build_song_menu(src_filename: str, dist_filename: str):
    # try-except で囲むとエラー時に原因が特定しやすくなります
    try:
        items = load_json(src_filename)
    except Exception as e:
        print(f"Error loading {src_filename}: {e}")
        return

    true_names = []
    false_names = []
    url_by_name = {}

    for item in items:
        # .get() のデフォルト値を利用
        name = item.get("name")
        url = item.get("url", "")
        flag = item.get("flag", False)

        if not name:
            continue

        url_by_name[name] = url
        if flag: # "is True" より簡潔な書き方
            true_names.append(name)
        else:
            false_names.append(name)

    save_json(
        dist_filename,
        {
            "trueNames": true_names,
            "falseNames": false_names,
            "allNames": true_names + false_names, # 順序は用途に合わせて
            "urlByName": url_by_name,
        },
    )

def main():
    # 拡張子を含めて指定
    build_song_menu("requestSong.json", "requestSongShortcut.json")
    build_song_menu("spotifySong.json", "spotifySongShortcut.json")

if __name__ == "__main__":
    main()
