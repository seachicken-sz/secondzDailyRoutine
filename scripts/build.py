import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"

DIST_DIR.mkdir(exist_ok=True)


def load_json(filename: str):
    with (DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filename: str, data):
    with (DIST_DIR / filename).open("w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def build_song_menu(src_filename: str, dist_filename: str):
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
            "allNames": false_names + true_names,
            "urlByName": url_by_name,
        },
    )


def build_request_list_shortcut():
    request_lists = load_json("requestListJson")

    item_names = []
    url_by_name = {}

    for request_list in request_lists:
        items = request_list.get("items", [])

        for item in items:
            name = item.get("name", "")
            url = item.get("url", "")

            if not name:
                continue

            item_names.append(name)
            url_by_name[name] = url

    save_json(
        "requestListShortcutJson",
        {
            "itemNames": item_names,
            "urlByName": url_by_name,
        },
    )


def main():
    build_song_menu("requestSongJson", "requestSongShortcutJson")
    build_song_menu("spotifySongJson", "spotifySongShortcutJson")
    build_request_list_shortcut()


if __name__ == "__main__":
    main()
