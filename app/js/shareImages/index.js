(function loadShareImageStyles() {
  const styleFiles = [
    "styles/simple.js",
    "styles/paperWood.js",
    "styles/minimalMemo.js",
    "styles/stationeryPlanner.js",
    "styles/yumekawaGradient.js",
    "styles/characterPhotoList.js",
    "styles/characterSimpleCard.js",
    "styles/fireworks.js",
    "styles/fireworksCharacter.js",
    "styles/honkoto.js"
  ];

  const loaderUrl = new URL(document.currentScript.src);
  const refreshToken = loaderUrl.searchParams.get("refreshAssets");

  function loadScript(index) {
    if (index >= styleFiles.length) {
      window.shareImageStylesLoaded = true;
      window.dispatchEvent(new Event("shareImageStylesLoaded"));
      return;
    }

    const script = document.createElement("script");
    const styleUrl = new URL(styleFiles[index], loaderUrl);
    if (refreshToken) {
      styleUrl.searchParams.set("refreshAssets", refreshToken);
    }
    script.src = styleUrl.href;
    script.onload = () => loadScript(index + 1);
    script.onerror = () => { console.warn("Share image style unavailable", styleUrl.href); loadScript(index + 1); };
    document.head.appendChild(script);
  }

  window.shareImageStylesLoaded = false;
  loadScript(0);
})();
