/*
 * Application configuration: theme tokens and translations.
 * Loaded before app.js so the renderer can consume the shared UI vocabulary.
 */
let THEME = 'dark';
const T = {
  dark: {
    bg: '#060d0a', surf: '#0c1812', card: '#111f18', card2: '#162920',
    border: '#1e3228', primary: '#00c87a', gold: '#f0b429', text: '#dff2ea',
    muted: '#5a7a6a', dim: '#8aac9a', navBg: '#0c1812',
    hdrGrad: 'linear-gradient(160deg,#050e08 0%,#0a1f14 60%,#0d3326 100%)'
  },
  light: {
    bg: '#f0faf5', surf: '#ffffff', card: '#ffffff', card2: '#e8f5ee',
    border: '#b0d8c0', primary: '#009a5e', gold: '#d4900a', text: '#0a2010',
    muted: '#3a6a4a', dim: '#2a5a3a', navBg: '#ffffff',
    hdrGrad: 'linear-gradient(160deg,#c8f0de 0%,#d8f5e8 60%,#b0e8cc 100%)'
  }
};

function C() {
  return T[THEME];
}

function isDark() {
  return THEME === 'dark';
}

const LD = {
  en: {home:'Home',doctors:'Doctors',aiTab:'AI Hub',vaultTab:'Vault',profileTab:'Profile',greeting:'Good Morning',greeting2:'New Delhi, India',healthScore:'Health Score',excellent:'Excellent',good:'Good',attention:'Needs Attention',findDoctors:'Find Doctors',searchPlaceholder:'Name, specialty, location...',doctorsFound:'doctors found',aiHub:'AI Health Hub',vault:'Health Vault',vaultSub:'Zero-knowledge encrypted · Only you hold the key',profile:'My Profile',medHistory:'Medical History',familyHub:'Family Health Hub',confirm:'Confirm',selectSlot:'Select a Slot',symptomChecker:'AI Symptom Checker',medicineFinder:'Medicine Price Finder',emergency:'Emergency',tracker:'Health Tracker',aiSummary:'AI Health Summary',reminders:'Reminders',insurance:'Insurance Coverage',languages:'Language',theme:'Theme',darkMode:'Dark Mode',lightMode:'Light Mode',vaultLocked:'Vault Locked',unlockVault:'Unlock Vault',demoPin:'Demo PIN: 1234',grantAccess:'Grant Access:',revoke:'Revoke',doctorNote:'Doctor Note',addRecord:'+ Upload New Record',generateSummary:'Generate My AI Summary',bestPrice:'BEST PRICE',inStock:'In Stock',outOfStock:'Out of Stock',copy:'Copy Summary',regen:'Regenerate',privacy:'Privacy & Security',aboutArogya:'About Arogya',logout:'Logout'},
  hi: {home:'होम',doctors:'डॉक्टर',aiTab:'AI हब',vaultTab:'वॉल्ट',profileTab:'प्रोफाइल',greeting:'सुप्रभात',greeting2:'नई दिल्ली, भारत',healthScore:'स्वास्थ्य स्कोर',excellent:'उत्कृष्ट',good:'अच्छा',attention:'ध्यान दें',findDoctors:'डॉक्टर खोजें',searchPlaceholder:'नाम, विशेषता...',doctorsFound:'डॉक्टर मिले',aiHub:'AI स्वास्थ्य हब',vault:'स्वास्थ्य वॉल्ट',vaultSub:'एन्क्रिप्टेड · केवल आपके पास चाबी',profile:'मेरी प्रोफाइल',medHistory:'चिकित्सा इतिहास',familyHub:'परिवार हब',confirm:'पुष्टि करें',selectSlot:'स्लॉट चुनें',symptomChecker:'AI लक्षण जाँच',medicineFinder:'दवा मूल्य',emergency:'आपातकाल',tracker:'ट्रैकर',aiSummary:'AI सारांश',reminders:'रिमाइंडर',insurance:'बीमा',languages:'भाषा',theme:'थीम',darkMode:'डार्क',lightMode:'लाइट',vaultLocked:'वॉल्ट बंद',unlockVault:'खोलें',demoPin:'डेमो PIN: 1234',grantAccess:'एक्सेस दें:',revoke:'रद्द',doctorNote:'डॉक्टर नोट',addRecord:'+ रिकॉर्ड अपलोड',generateSummary:'AI सारांश बनाएं',bestPrice:'बेस्ट प्राइस',inStock:'उपलब्ध',outOfStock:'उपलब्ध नहीं',copy:'कॉपी',regen:'दोबारा',privacy:'गोपनीयता',aboutArogya:'आरोग्य के बारे में',logout:'लॉगआउट'}
};

let LANG = 'en';
function L(key) {
  return (LD[LANG] || LD.en)[key] || LD.en[key] || key;
}
