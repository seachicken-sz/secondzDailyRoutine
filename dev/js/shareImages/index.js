(function loadShareImageStyles() {
  const styleFiles = [
    "styles/simple.js",
    "styles/paperWood.js",
    "styles/minimalMemo.js",
    "styles/stationeryPlanner.js",
    "styles/yumekawaGradient.js",
    "styles/characterPhotoList.js",
    "styles/characterSimpleCard.js"
  ];

  const currentScript = document.currentScript;
  const basePath = currentScript.src.replace("index.js", "");

  function loadScript(index) {
    if (index >= styleFiles.length) {
      window.shareImageStylesLoaded = true;
      window.dispatchEvent(new Event("shareImageStylesLoaded"));
      return;
    }

    const script = document.createElement("script");
    script.src = `${basePath}${styleFiles[index]}`;
    script.onload = () => loadScript(index + 1);
    script.onerror = () => loadScript(index + 1);
    document.head.appendChild(script);
  }

  window.shareImageStylesLoaded = false;
  loadScript(0);
})();
