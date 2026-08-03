"use strict";

(async () => {
  try {
    const [coreResponse, mobileResponse, firstGuideResponse] = await Promise.all([
      fetch("./js/script-core.js", { cache: "no-store" }),
      fetch("./js/mobile-ui.js", { cache: "no-store" }),
      fetch("./js/first-guide-mobile.js", { cache: "no-store" })
    ]);

    if (!coreResponse.ok) throw new Error(`script-core.js: HTTP ${coreResponse.status}`);
    if (!mobileResponse.ok) throw new Error(`mobile-ui.js: HTTP ${mobileResponse.status}`);
    if (!firstGuideResponse.ok) throw new Error(`first-guide-mobile.js: HTTP ${firstGuideResponse.status}`);

    let coreSource = await coreResponse.text();
    const mobileSource = await mobileResponse.text();
    const firstGuideSource = await firstGuideResponse.text();

    coreSource = coreSource.replace(
      'document.addEventListener("DOMContentLoaded", initialize);',
      ""
    );

    const run = new Function(`${coreSource}\n${mobileSource}\n${firstGuideSource}\ninitialize();`);
    run();
  } catch (error) {
    console.error("スタートガイドの初期化に失敗しました。", error);
  }
})();
