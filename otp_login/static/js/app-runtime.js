/*
 * Rendering runtime: owns DOM updates and screen selection.
 * Screen builders and state are supplied by app.js.
 */
function render() {
  const app = document.getElementById('app');
  if (!app) return;

  app.className = 'app-shell';
  document.body.className = THEME;
  document.documentElement.dataset.theme = THEME;
  app.innerHTML = buildView();

  APP.vaultPinVal.forEach((value, index) => {
    const input = document.getElementById('pin' + index);
    if (input && value) input.value = value;
  });
}

function buildView() {
  if (!APP.loggedIn) return buildLogin();

  const screens = {
    booking: () => APP.selDoc ? buildBooking() : buildHome(),
    map: buildMap,
    emergency: buildEmergency,
    'ai-symptom': buildSymptom,
    'ai-medicine': buildMedicine,
    'ai-summary': buildAISummary,
    tracker: buildTracker,
    'second-opinion': buildSecondOpinion,
    reminders: buildReminders,
    insurance: buildInsurance,
    settings: buildSettings,
    privacy: buildPrivacy,
    about: buildAbout
  };

  const main = APP.screen && screens[APP.screen]
    ? screens[APP.screen]()
    : ({
        home: buildHome,
        doctors: buildDoctors,
        ai: buildAIHub,
        vault: buildVault,
        profile: buildProfile
      }[APP.tab] || buildHome)();

  const sidebar = APP.showSortSidebar ? buildSortSidebar() : '';
  const orderModal = APP.orderModal ? buildOrderModal() : '';
  return main + sidebar + orderModal;
}
