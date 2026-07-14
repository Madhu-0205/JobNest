export type LocaleCode =
  | "en"
  | "hi"
  | "te"
  | "ta"
  | "kn"
  | "ml"
  | "mr"
  | "gu"
  | "bn"
  | "pa"
  | "or";

export interface TranslationDictionary {
  common: {
    welcome: string;
    search: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    language: string;
  };
  auth: {
    login: string;
    signup: string;
    email: string;
    password: string;
    username: string;
    forgot_password: string;
  };
  roles: {
    worker: string;
    employer: string;
    resident: string;
    student: string;
  };
  errors: {
    unauthorized: string;
    validation_failed: string;
    unexpected: string;
  };
}

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  en: {
    common: {
      welcome: "Welcome to JobNest",
      search: "Search jobs near you...",
      save: "Save Changes",
      cancel: "Cancel",
      edit: "Edit Profile",
      delete: "Delete Account",
      language: "Language",
    },
    auth: {
      login: "Sign In",
      signup: "Sign Up",
      email: "Email Address",
      password: "Password",
      username: "Username",
      forgot_password: "Forgot Password?",
    },
    roles: {
      worker: "Worker",
      employer: "Employer",
      resident: "Resident",
      student: "Student",
    },
    errors: {
      unauthorized: "Access denied. Authentication required.",
      validation_failed: "Please review the highlighted errors.",
      unexpected: "An unexpected error occurred. Please try again.",
    },
  },
  hi: {
    common: {
      welcome: "जॉबनेस्ट में आपका स्वागत है",
      search: "अपने आस-पास काम खोजें...",
      save: "बदलाव सुरक्षित करें",
      cancel: "रद्द करें",
      edit: "प्रोफ़ाइल संपादित करें",
      delete: "खाता हटाएं",
      language: "भाषा",
    },
    auth: {
      login: "लॉग इन करें",
      signup: "साइन अप करें",
      email: "ईमेल पता",
      password: "पासवर्ड",
      username: "यूज़रनेम",
      forgot_password: "पासवर्ड भूल गए?",
    },
    roles: {
      worker: "कामगार",
      employer: "नियोक्ता",
      resident: "निवासी",
      student: "छात्र",
    },
    errors: {
      unauthorized: "पहुंच अस्वीकृत। प्रमाणीकरण आवश्यक है।",
      validation_failed: "कृपया हाइलाइट की गई त्रुटियों की समीक्षा करें।",
      unexpected: "एक अप्रत्याशित त्रुटि हुई। कृपया पुन: प्रयास करें।",
    },
  },
  te: {
    common: {
      welcome: "జాబ్‌నెస్ట్‌కు స్వాగతం",
      search: "మీ సమీపంలోని పనుల కోసం వెతకండి...",
      save: "మార్పులను సేవ్ చేయి",
      cancel: "రద్దు చేయి",
      edit: "ప్రొఫైల్ సవరించు",
      delete: "ఖాతాను తొలగించు",
      language: "భాష",
    },
    auth: {
      login: "లాగిన్ అవ్వండి",
      signup: "సైన్ అప్ చేయి",
      email: "ఇమెయిల్ చిరునామా",
      password: "పాస్వర్డ్",
      username: "యూజర్ నేమ్",
      forgot_password: "పాస్వర్డ్ మర్చిపోయారా?",
    },
    roles: {
      worker: "ఉద్యోగి",
      employer: "యజమాని",
      resident: "నివాసి",
      student: "విద్యార్థి",
    },
    errors: {
      unauthorized: "అనుమతి నిరాకరించబడింది.",
      validation_failed: "దయచేసి ఎత్తిచూపిన తప్పులను సరిచూసుకోండి.",
      unexpected: "అనుకోని లోపం సంభవించింది. మళ్లీ ప్రయత్నించండి.",
    },
  },
  ta: {
    common: {
      welcome: "ஜாப்நெஸ்டிற்கு வரவேற்கிறோம்",
      search: "அருகிலுள்ள வேலைகளைத் தேடுங்கள்...",
      save: "மாற்றங்களைச் சேமி",
      cancel: "ரத்து செய்",
      edit: "சுயவிவரத்தைத் திருத்து",
      delete: "கணக்கை நீக்கு",
      language: "மொழி",
    },
    auth: {
      login: "உள்நுழைக",
      signup: "பதிவு செய்க",
      email: "மின்னஞ்சல் முகவரி",
      password: "கடவுச்சொல்",
      username: "பயனர் பெயர்",
      forgot_password: "கடவுச்சொல் மறந்துவிட்டதா?",
    },
    roles: {
      worker: "பணியாளர்",
      employer: "முதலாளி",
      resident: "குடிமகன்",
      student: "மாணவர்",
    },
    errors: {
      unauthorized: "அனுமதி மறுக்கப்பட்டது.",
      validation_failed: "பிழைகளைச் சரிபார்க்கவும்.",
      unexpected: "எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    },
  },
  kn: {
    common: {
      welcome: "ಜಾಬ್ನೆಸ್ಟ್‌ಗೆ ಸ್ವಾಗತ",
      search: "ನಿಮ್ಮ ಹತ್ತಿರದ ಕೆಲಸಗಳನ್ನು ಹುಡುಕಿ...",
      save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
      cancel: "ರದ್ದುಮಾಡಿ",
      edit: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
      delete: "ಖಾತೆಯನ್ನು ಅಳಿಸಿ",
      language: "ಭಾಷೆ",
    },
    auth: {
      login: "ಲಾಗಿನ್ ಮಾಡಿ",
      signup: "ಸೈನ್ ಅಪ್ ಮಾಡಿ",
      email: "ಇಮೇಲ್ ವಿಳಾಸ",
      password: "ಪಾಸ್ವರ್ಡ್",
      username: "ಬಳಕೆದಾರ ಹೆಸರು",
      forgot_password: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?",
    },
    roles: {
      worker: "ಕಾರ್ಮಿಕ",
      employer: "ಉದ್ಯೋಗದಾತ",
      resident: "ನಿವಾಸಿ",
      student: "ವಿದ್ಯಾರ್ಥಿ",
    },
    errors: {
      unauthorized: "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ.",
      validation_failed: "ದೋಷಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
      unexpected: "ಅನಿರೀಕ್ಷಿತ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
    },
  },
  ml: {
    common: {
      welcome: "ജോബ്നെസ്റ്റിലേക്ക് സ്വാഗതം",
      search: "അടുത്തുള്ള ജോലികൾക്കായി തിരയുക...",
      save: "മാറ്റങ്ങൾ സൂക്ഷിക്കുക",
      cancel: "റദ്ദാക്കുക",
      edit: "പ്രൊഫൈൽ തിരുത്തുക",
      delete: "അക്കൗണ്ട് ഇല്ലാതാക്കുക",
      language: "ഭാഷ",
    },
    auth: {
      login: "ലോഗിൻ ചെയ്യുക",
      signup: "സൈൻ അപ്പ് ചെയ്യുക",
      email: "ഇമെയിൽ വിലാസം",
      password: "പാസ്‌വേഡ്",
      username: "ഉപയോക്തൃനാമം",
      forgot_password: "പാസ്‌വേഡ് മറന്നുപോയോ?",
    },
    roles: {
      worker: "തൊഴിലാളി",
      employer: "തൊഴിലുടമ",
      resident: "താമസിപ്പുകാരൻ",
      student: "വിദ്യാർത്ഥി",
    },
    errors: {
      unauthorized: "പ്രവേശനം നിഷേധിച്ചു.",
      validation_failed: "പിഴവുകൾ പരിശോധിക്കുക.",
      unexpected: "പ്രതീക്ഷിക്കാത്ത പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.",
    },
  },
  mr: {
    common: {
      welcome: "जॉबनेस्टमध्ये आपले स्वागत आहे",
      search: "जवळपासचे काम शोधा...",
      save: "बदल जतन करा",
      cancel: "रद्द करा",
      edit: "प्रोफाइल संपादित करा",
      delete: "खाते हटवा",
      language: "भाषा",
    },
    auth: {
      login: "लॉग इन करा",
      signup: "साइन अप करा",
      email: "ईमेल पत्ता",
      password: "पासवर्ड",
      username: "वापरकर्तानाव",
      forgot_password: "पासवर्ड विसरलात?",
    },
    roles: {
      worker: "कामगार",
      employer: "नियोक्ता",
      resident: "रहिवासी",
      student: "विद्यार्थी",
    },
    errors: {
      unauthorized: "प्रवेश नाकारला.",
      validation_failed: "कृपया त्रुटी तपासा.",
      unexpected: "अनपेक्षित त्रुटी आली. पुन्हा प्रयत्न करा.",
    },
  },
  gu: {
    common: {
      welcome: "જૉબનેસ્ટમાં આપનું સ્વાગત છે",
      search: "નજીકની નોકરીઓ શોધો...",
      save: "ફેરફારો સાચવો",
      cancel: "રદ કરો",
      edit: "પ્રોફાઇલ સંપાદિત કરો",
      delete: "ખાતું કાઢી નાખો",
      language: "ભાષા",
    },
    auth: {
      login: "લોગ ઇન કરો",
      signup: "સાઇન અપ કરો",
      email: "ઈમેલ સરનામું",
      password: "પાસવર્ડ",
      username: "વપરાશકર્તા નામ",
      forgot_password: "પાસવર્ડ ભૂલી ગયા?",
    },
    roles: {
      worker: "કામદાર",
      employer: "નિયોક્તા",
      resident: "રહેવાસી",
      student: "વિદ્યાર્થી",
    },
    errors: {
      unauthorized: "પ્રવેશ નકારવામાં આવ્યો.",
      validation_failed: "ભૂલો તપાસો.",
      unexpected: "અણધારી ભૂલ આવી. ફરી પ્રયાસ કરો.",
    },
  },
  bn: {
    common: {
      welcome: "জবনেস্টে আপনাকে স্বাগত",
      search: "নিকটবর্তী কাজ খুঁজুন...",
      save: "পরিবর্তন সংরক্ষণ করুন",
      cancel: "বাতিল করুন",
      edit: "প্রোফাইল সম্পাদন",
      delete: "অ্যাকাউন্ট মুছুন",
      language: "ভাষা",
    },
    auth: {
      login: "লগ ইন",
      signup: "নিবন্ধন করুন",
      email: "ইমেল ঠিকানা",
      password: "পাসওয়ার্ড",
      username: "ব্যবহারকারীর নাম",
      forgot_password: "পাসওয়ার্ড ভুলে গেছেন?",
    },
    roles: {
      worker: "কর্মী",
      employer: "নিয়োগকর্তা",
      resident: "বাসিন্দা",
      student: "ছাত্র",
    },
    errors: {
      unauthorized: "প্রবেশাধিকার প্রত্যাখ্যান করা হয়েছে।",
      validation_failed: "ত্রুটিগুলি পরীক্ষা করুন।",
      unexpected: "অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    },
  },
  pa: {
    common: {
      welcome: "ਜਾਬਨੈਸਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
      search: "ਆਪਣੇ ਨੇੜੇ ਕੰਮ ਲੱਭੋ...",
      save: "ਬਦਲਾਅ ਸੰਭਾਲੋ",
      cancel: "ਰੱਦ ਕਰੋ",
      edit: "ਪ੍ਰੋਫਾਈਲ ਸੋਧੋ",
      delete: "ਖਾਤਾ ਹਟਾਓ",
      language: "ਭਾਸ਼ਾ",
    },
    auth: {
      login: "ਲੌਗ ਇਨ",
      signup: "ਸਾਈਨ ਅਪ",
      email: "ਈਮੇਲ ਪਤਾ",
      password: "ਪਾਸਵਰਡ",
      username: "ਯੂਜ਼ਰਨਾਮ",
      forgot_password: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?",
    },
    roles: {
      worker: "ਕਾਮਾ",
      employer: "ਮਾਲਕ",
      resident: "ਨਿਵਾਸੀ",
      student: "ਵਿਦਿਆਰਥੀ",
    },
    errors: {
      unauthorized: "ਪਹੁੰਚ ਤੋਂ ਇਨਕਾਰ।",
      validation_failed: "ਗਲਤੀਆਂ ਦੀ ਜਾਂਚ ਕਰੋ।",
      unexpected: "ਅਣਕਿਆਸੀ ਗਲਤੀ ਹੋਈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    },
  },
  or: {
    common: {
      welcome: "ଜବନେଷ୍ଟକୁ ସ୍ୱାଗତ",
      search: "ଆପଣଙ୍କ ନିକଟରେ କାମ ଖୋଜନ୍ତୁ...",
      save: "ପରିବର୍ତ୍ତନ ସଂରକ୍ଷଣ କରନ୍ତୁ",
      cancel: "ବାତିଲ କରନ୍ତୁ",
      edit: "ପ୍ରୋଫାଇଲ୍ ସଂଶୋଧନ କରନ୍ତୁ",
      delete: "ଖାତା ବିଲୋପ କରନ୍ତୁ",
      language: "ଭାଷା",
    },
    auth: {
      login: "ଲଗ୍ ଇନ୍",
      signup: "ସାଇନ୍ ଅପ୍",
      email: "ଇମେଲ୍ ଠିକଣା",
      password: "ପାସୱାର୍ଡ",
      username: "ୟୁଜର୍ ନାମ",
      forgot_password: "ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?",
    },
    roles: {
      worker: "କର୍ମଚାରୀ",
      employer: "ନିଯୁକ୍ତିଦାତା",
      resident: "ବାସିନ୍ଦା",
      student: "ଛାତ୍ର",
    },
    errors: {
      unauthorized: "ପ୍ରବେଶ ଅନୁମତି ନାହିଁ।",
      validation_failed: "ଭୁଲ୍ ଗୁଡିକ ଯାଞ୍ଚ କରନ୍ତୁ।",
      unexpected: "ଅପ୍ରତ୍ୟାଶିତ ତ୍ରୁଟି ଘଟିଲା। ପୁଣି ଚେଷ୍ଟା କରନ୍ତು।",
    },
  },
};

export const LANGUAGE_NAMES: Record<LocaleCode, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  mr: "मराठी",
  gu: "ગુજરાતી",
  bn: "বাংলা",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
};
