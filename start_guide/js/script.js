"use strict";

(async () => {
  try {
    const [coreResponse, mobileResponse] = await Promise.all([
      fetch("./js/script-core.js", { cache: "no-store" }),
      fetch("./js/mobile-ui.js", { cache: "no-store" })
    ]);

    if (!coreResponse.ok) throw new Error(`script-core.js: HTTP ${coreResponse.status}`);
    if (!mobileResponse.ok) throw new Error(`mobile-ui.js: HTTP ${mobileResponse.status}`);

    let coreSource = await coreResponse.text();
    const mobileSource = await mobileResponse.text();

    coreSource = coreSource.replace(
      'document.addEventListener("DOMContentLoaded", initialize);',
      ""
    );

    const run = new Function(`${coreSource}\n${mobileSource}\ninitialize();`);
    run();
  } catch (error) {
    console.error("スタートガイドの初期化に失敗しました。", error);
  }
})();
