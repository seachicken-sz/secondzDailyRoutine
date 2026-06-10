(function loadShareImageStyles() {
  const styleFiles = [
    "simple.js",
    "paperWood.js",
    "minimalMemo.js",
    "stationeryPlanner.js",
    "yumekawaGradient.js"
  ];

  const currentScript = document.currentScript;
  const basePath = currentScript.src.replace("index.js", "");

  styleFiles.forEach((file) => {
    const script = document.createElement("script");
    script.src = `${basePath}${file}`;
    script.defer = false;
    document.head.appendChild(script);
  });
})();
