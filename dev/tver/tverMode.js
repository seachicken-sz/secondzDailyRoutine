// TVerモード：通常ホームとの切替・保存状態の復元
function initializeTverMode() {
  const toggleButton = document.getElementById("tverModeToggleButton");
  if (!toggleButton) return;

  toggleButton.addEventListener("click", () => {
    const enabled = toggleButton.getAttribute("aria-pressed") !== "true";
    setTverModeEnabled(enabled);
  });

  let enabled = false;
  try {
    enabled = localStorage.getItem(STORAGE_KEYS.tverModeEnabled) === "true";
  } catch (error) {
    console.warn("TVerモード設定を読み込めませんでした", error);
  }
  setTverModeEnabled(enabled, { save: false });
}

function setTverModeEnabled(enabled, options = {}) {
  const toggleButton = document.getElementById("tverModeToggleButton");
  const normalContent = document.getElementById("normalHomeContent");
  const tverContent = document.getElementById("tverModeContent");
  if (!toggleButton || !normalContent || !tverContent) return;

  // TVer画面はホーム内で切り替え、ルーティンの保存データは変更しない
  if (enabled && state.currentStepElement !== homeStepElement) {
    showOnlyStep(homeStepElement, { recordHistory: false, saveFlow: false });
  }

  normalContent.classList.toggle("hidden", enabled);
  tverContent.classList.toggle("hidden", !enabled);
  toggleButton.setAttribute("aria-pressed", String(enabled));
  toggleButton.setAttribute("aria-label", enabled ? "通常モードに戻る" : "TVerモードに切り替え");
  toggleButton.title = enabled ? "通常モードに戻る" : "TVerモードに切り替え";

  if (enabled) {
    const list = document.getElementById("tverModeList");
    if (list && !list.hasChildNodes()) {
      const note = document.createElement("p");
      note.textContent = "TVerランキング表示は準備中です。";
      list.appendChild(note);
    }
  }

  if (options.save !== false) {
    try {
      localStorage.setItem(STORAGE_KEYS.tverModeEnabled, String(enabled));
    } catch (error) {
      console.warn("TVerモード設定を保存できませんでした", error);
    }
  }
}
