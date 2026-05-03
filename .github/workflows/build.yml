name: Build Shortcut JSON

on:
  push:
    paths:
      - "data/**"
      - "scripts/build.py"
      - ".github/workflows/build.yml"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - run: python scripts/build.py

      - name: Commit generated JSON
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add dist/*.json
          git diff --cached --quiet || git commit -m "Build shortcut JSON"
          git push
