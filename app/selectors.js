
function selectSong(song) {
  state.selectedSong = song;

  if (selectedSongNameElement) {
    selectedSongNameElement.textContent = song.name;
  }

  if (selectedAreaElement) {
    selectedAreaElement.classList.remove("hidden");
  }

  if (spotifyNextButtonElement) {
    spotifyNextButtonElement.classList.add("hidden");
  }
  setButtonStyle(openSpotifyButtonElement, "primary");
  setButtonStyle(spotifyNextButtonElement, "secondary");
  
  setSongListVisibility(recommendedSongsElement, true);
  setSongListVisibility(toggleOtherSongsButtonElement, true);
  updateOtherSongsAccordion();

  updateSelectedButtonStyle(".spotify-song-button", song);
  hideError(spotifyErrorAreaElement);
}

function selectRequestSong(song) {
  state.selectedRequestSong = song;

  if (selectedRequestSongNameElement) {
    selectedRequestSongNameElement.textContent = song.name;
  }

  if (selectedRequestSongAreaElement) {
    selectedRequestSongAreaElement.classList.remove("hidden");
  }

  if (requestSongNextButtonElement) {
    requestSongNextButtonElement.classList.add("hidden");
  }
  setButtonStyle(openRequestSongButtonElement, "primary");
  setButtonStyle(requestSongNextButtonElement, "secondary");
  
  setSongListVisibility(recommendedRequestSongsElement, true);
  setSongListVisibility(toggleOtherRequestSongsButtonElement, true);
  updateOtherRequestSongsAccordion();  

  updateSelectedButtonStyle(".request-song-button", song);
  hideError(requestSongErrorAreaElement);
}

function updateSelectedButtonStyle(selector, selectedSong) {
  const buttons = document.querySelectorAll(selector);

  buttons.forEach((button) => {
    button.classList.toggle("selected", button.textContent === selectedSong.name);
  });
}

function updateOtherSongsAccordion() {
  if (otherSongsWrapperElement) {
    otherSongsWrapperElement.classList.toggle("hidden", !state.isOtherSongsOpen);
  }

  if (toggleOtherSongsIconElement) {
    toggleOtherSongsIconElement.textContent = state.isOtherSongsOpen ? "－" : "＋";
  }
}

function updateOtherRequestSongsAccordion() {
  if (otherRequestSongsWrapperElement) {
    otherRequestSongsWrapperElement.classList.toggle("hidden", !state.isOtherRequestSongsOpen);
  }

  if (toggleOtherRequestSongsIconElement) {
    toggleOtherRequestSongsIconElement.textContent = state.isOtherRequestSongsOpen ? "－" : "＋";
  }
}

async function showOnceListSelectStep() {
  try {
    if (state.onceTasks.length === 0) {
      state.onceTasks = await loadOnceTasks();
    }

    renderOnceTaskCheckList(state.onceTasks);

    showOnlyStep(onceListSelectStepElement);

    hideError(onceListErrorAreaElement);
  } catch (error) {
    console.error(error);
    showError(spotifyErrorAreaElement, "期間限定タスクの読み込みに失敗しました。JSONの形式や配置を確認してください。");
  }
}
