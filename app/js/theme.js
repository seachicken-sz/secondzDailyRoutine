// ==================================================
// テーマ設定
// ==================================================
const THEME_LOGO_MAP = {
  normal: "../img/logo.png",
  red: "../img/logo-red.png",
  purple: "../img/logo-purple.png",
  green: "../img/logo-green.png",
  sky: "../img/logo-sky.png",
  lime: "../img/logo-lime.png",
  pink: "../img/logo-pink.png",
  yellow: "../img/logo-yellow.png",
  white: "../img/logo-white.png",
};

function updateThemeLogo(themeName) {
  if (!homeLogoImageElement) {
    return;
  }

  homeLogoImageElement.src = THEME_LOGO_MAP[themeName] || THEME_LOGO_MAP.normal;
}
const THEME_STORAGE_KEY = "selectedTheme";

const THEME_LIST = [
  {
    id: "normal",
    label: "default",
  },
  {
    id: "red",
    label: "赤",
  },
  {
    id: "purple",
    label: "紫",
  },
  {
    id: "green",
    label: "緑",
  },
  {
    id: "sky",
    label: "水色",
  },
  {
    id: "lime",
    label: "黄緑",
  },
  {
    id: "pink",
    label: "ピンク",
  },
  {
    id: "yellow",
    label: "黄色",
  },
  {
    id: "white",
    label: "白",
  },
];

function isValidTheme(themeName) {
  return THEME_LIST.some((theme) => theme.id === themeName);
}

function getSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (!savedTheme || !isValidTheme(savedTheme)) {
    return "normal";
  }

  return savedTheme;
}

function applyTheme(themeName) {
  const safeThemeName = isValidTheme(themeName) ? themeName : "normal";

  if (safeThemeName === "normal") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = safeThemeName;
  }

  localStorage.setItem(THEME_STORAGE_KEY, safeThemeName);
  updateThemeButtonState(safeThemeName);
  updateThemeLogo(safeThemeName);
}

function updateThemeButtonState(themeName) {
  document.querySelectorAll("[data-theme-button]").forEach((button) => {
    const isActive = button.dataset.themeButton === themeName;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function openThemeModal() {
  const themeModalElement = document.getElementById("themeModal");

  if (!themeModalElement) {
    return;
  }

  themeModalElement.classList.remove("hidden");
}

function closeThemeModal() {
  const themeModalElement = document.getElementById("themeModal");

  if (!themeModalElement) {
    return;
  }

  themeModalElement.classList.add("hidden");
}

function setupThemeModal() {
  const openThemeModalButtonElement = document.getElementById("openThemeModalButton");
  const closeThemeModalButtonElement = document.getElementById("closeThemeModalButton");
  const themeModalElement = document.getElementById("themeModal");

  if (openThemeModalButtonElement) {
    openThemeModalButtonElement.addEventListener("click", openThemeModal);
  }

  if (closeThemeModalButtonElement) {
    closeThemeModalButtonElement.addEventListener("click", closeThemeModal);
  }

  if (themeModalElement) {
    themeModalElement.addEventListener("click", (event) => {
      if (event.target === themeModalElement) {
        closeThemeModal();
      }
    });
  }
}

function setupThemeButtons() {
  document.querySelectorAll("[data-theme-button]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeButton);
    });
  });
}

function setupTheme() {
  setupThemeModal();
  setupThemeButtons();
  applyTheme(getSavedTheme());
}

setupTheme();
