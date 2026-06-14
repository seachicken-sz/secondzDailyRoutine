// ==================================================
// stepHelpModal.js
// ステップ別解説モーダル
// ==================================================
const STEP_HELP_IMAGE_BASE_PATH = "../img/stepHelp/";
const STEP_HELP_MODAL_CONFIG = {
  spotify: {
    images: ["step_spotify_01.png"],
    buttons: []
  },
  limitedTask: {
    images: ["step_limited_01.png"],
    buttons: []
  },
  usenRequest: {
    images: ["step_usen_01.png", "usen_01.png"],
    buttons: []
  },
  dailyTask_01: {
    images: ["step_daily_01.png"],
    buttons: []
  },
  dailyTask_02: {
    images: ["step_daily_02.png"],
    buttons: []
  },
  snsShare: {
    images: ["step_sns_01.png"],
    buttons: []
  },
  homeUsen: {
    images: ["usen_01.png"],
    buttons: []
  },
  memberTver: {
    images: ["tver_01.png"],
    buttons: []
  },
  memberRadiko: {
    images: ["radiko_01.png"],
    buttons: []
  },
  memberYoutube: {
    images: ["youtube_01.png", "youtube_02.png"],
    buttons: []
  },
  memberDreampass: {
    images: ["dreampass_01.png"],
    buttons: []
  }
};

function openStepHelpModal(helpKey, option = {}) {
  const modalElement = document.getElementById("stepHelpModal");
  const bodyElement = document.getElementById("stepHelpModalBody");
  const buttonAreaElement = document.getElementById("stepHelpModalButtonArea");
  const config = STEP_HELP_MODAL_CONFIG[helpKey];

  if (!modalElement || !bodyElement || !buttonAreaElement || !config) {
    return;
  }

  bodyElement.innerHTML = "";
  buttonAreaElement.innerHTML = "";

  const images = Array.isArray(config.images) ? config.images : [];

  images.forEach((imageName) => {
    const imageElement = document.createElement("img");
    imageElement.className = "step-help-modal-image";
    imageElement.loading = "lazy";
    imageElement.decoding = "async";
    imageElement.src = `${STEP_HELP_IMAGE_BASE_PATH}${imageName}`;
    imageElement.alt = "";
    bodyElement.appendChild(imageElement);
  });

  const buttons = buildStepHelpModalButtons(config, option);

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      const linkElement = document.createElement("a");
      linkElement.className = button.className || "primary-button";
      linkElement.href = button.url;
      linkElement.textContent = button.label;
      linkElement.target = "_blank";
      linkElement.rel = "noopener noreferrer";
      buttonAreaElement.appendChild(linkElement);
    });

    buttonAreaElement.classList.remove("hidden");
  } else {
    buttonAreaElement.classList.add("hidden");
  }

  modalElement.classList.remove("hidden");
}

function closeStepHelpModal() {
  const modalElement = document.getElementById("stepHelpModal");

  if (!modalElement) {
    return;
  }

  modalElement.classList.add("hidden");
}

function buildStepHelpModalButtons(config, option) {
  const buttons = [];

  if (Array.isArray(config.buttons)) {
    buttons.push(...config.buttons);
  }

  if (option.url) {
    buttons.push({
      label: option.label || "ページを開く",
      url: option.url,
      className: option.className || "primary-button"
    });
  }

  return buttons.filter((button) => button && button.label && button.url);
}

function bindStepHelpModalEvents() {
  const closeButtonElement = document.getElementById("closeStepHelpModalButton");
  const modalElement = document.getElementById("stepHelpModal");

  if (closeButtonElement) {
    closeButtonElement.addEventListener("click", closeStepHelpModal);
  }

  if (modalElement) {
    modalElement.addEventListener("click", (event) => {
      if (event.target === modalElement) {
        closeStepHelpModal();
      }
    });
  }

  document.addEventListener("click", (event) => {
    const triggerElement = event.target.closest("[data-step-help-key]");

    if (!triggerElement) {
      return;
    }

    const helpKey = triggerElement.dataset.stepHelpKey;
    const helpUrl = triggerElement.dataset.stepHelpUrl || "";
    const helpLabel = triggerElement.dataset.stepHelpLabel || "";

    openStepHelpModal(helpKey, {
      url: helpUrl,
      label: helpLabel
    });
  });
}

document.addEventListener("DOMContentLoaded", bindStepHelpModalEvents);
