"use client";

import { useState, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { useSafetySOS } from "@/hooks/useSafetySOS";
import { useDisputes } from "@/hooks/useDisputes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";

export interface TranslationDict {
  title: string;
  selectLanguage: string;
  trustScore: string;
  factorsTitle: string;
  identityKyc: string;
  businessGst: string;
  disputesMediation: string;
  safetySOS: string;
  fraudMonitor: string;
  documentType: string;
  documentNumber: string;
  gstNumber: string;
  gstCheck: string;
  submitDoc: string;
  activeBadges: string;
  sosTrigger: string;
  sosResolve: string;
  addContact: string;
  contactName: string;
  contactPhone: string;
  timeline: string;
  disputeChat: string;
  postMessage: string;
  scoreExplain: string;
}

// Dictionary mapping for all 11 regional languages
const TRANSLATIONS: Record<string, TranslationDict> = {
  en: {
    title: "Trust & Safety Operations Cockpit",
    selectLanguage: "Interface Language",
    trustScore: "Dynamic Trust Score",
    factorsTitle: "Weighted Trust Factors",
    identityKyc: "Identity Verification",
    businessGst: "Business GST Verification",
    disputesMediation: "Dispute Mediation",
    safetySOS: "Emergency AssistanceSOS",
    fraudMonitor: "Fraud Prevention Monitor",
    documentType: "Document Category",
    documentNumber: "Document ID Number",
    gstNumber: "GSTIN Code (29XXX)",
    gstCheck: "Lookup GST Registry",
    submitDoc: "Submit for Verification",
    activeBadges: "Earned Verification Badges",
    sosTrigger: "TRIGGER SOS ALERT",
    sosResolve: "CANCEL SOS ALERT",
    addContact: "Add Trusted Contact",
    contactName: "Contact Full Name",
    contactPhone: "Contact Phone Number",
    timeline: "Incident Log Timeline",
    disputeChat: "Mediator Timeline Chat",
    postMessage: "Submit Comment",
    scoreExplain: "Recalculated Score",
  },
  hi: {
    title: "विश्वास और सुरक्षा संचालन कॉकपिट",
    selectLanguage: "इंटरफ़ेस भाषा",
    trustScore: "गतिशील विश्वास स्कोर",
    factorsTitle: "भारित विश्वास कारक",
    identityKyc: "पहचान सत्यापन",
    businessGst: "व्यापार जीएसटी सत्यापन",
    disputesMediation: "विवाद मध्यस्थता",
    safetySOS: "आपातकालीन सहायता SOS",
    fraudMonitor: "धोखाधड़ी रोकथाम मॉनिटर",
    documentType: "दस्तावेज़ श्रेणी",
    documentNumber: "दस्तावेज़ पहचान संख्या",
    gstNumber: "जीएसटी संख्या (29XXX)",
    gstCheck: "जीएसटी खोजें",
    submitDoc: "सत्यापन के लिए भेजें",
    activeBadges: "अर्जित सत्यापन बैज",
    sosTrigger: "आपातकालीन चेतावनी (SOS)",
    sosResolve: "चेतावनी रद्द करें",
    addContact: "भरोसेमंद संपर्क जोड़ें",
    contactName: "संपर्क का पूरा नाम",
    contactPhone: "संपर्क फोन नंबर",
    timeline: "घटना इतिहास समयरेखा",
    disputeChat: "मध्यस्थ बातचीत समयरेखा",
    postMessage: "टिप्पणी भेजें",
    scoreExplain: "पुनर्गणना स्कोर",
  },
  te: {
    title: "ట్రస్ట్ & సేఫ్టీ ఆపరేషన్స్ కాక్‌పిట్",
    selectLanguage: "ఇంటర్ఫేస్ భాష",
    trustScore: "డైనమిక్ ట్రస్ట్ స్కోర్",
    factorsTitle: "ట్రస్ట్ స్కోర్ కారకాలు",
    identityKyc: "గుర్తింపు ధృవీకరణ",
    businessGst: "వ్యాపార GST ధృవీకరణ",
    disputesMediation: "వివాద పరిష్కారం",
    safetySOS: "అత్యవసర సహాయం SOS",
    fraudMonitor: "మోసం నివారణ మానిటర్",
    documentType: "పత్రం వర్గం",
    documentNumber: "పత్రం ఐడి సంఖ్య",
    gstNumber: "GST సంఖ్య (29XXX)",
    gstCheck: "GST శోధన",
    submitDoc: "ధృవీకరణ కోసం సమర్పించు",
    activeBadges: "ధృవీకరణ బ్యాడ్జీలు",
    sosTrigger: "SOS హెచ్చరికను ప్రారంభించు",
    sosResolve: "SOS హెచ్చరికను రద్దు చేయి",
    addContact: "నమ్మకమైన పరిచయాన్ని జోడించు",
    contactName: "పరిచయం పూర్తి పేరు",
    contactPhone: "పరిచయం ఫోన్ సంఖ్య",
    timeline: "ప్రమాద కాలక్రమం లాగ్",
    disputeChat: "మధ్యవర్తి సంభాషణ కాలక్రమం",
    postMessage: "వ్యాఖ్యను సమర్పించు",
    scoreExplain: "తిరిగి లెక్కించిన స్కోరు",
  },
  ta: {
    title: "நம்பிக்கை & பாதுகாப்பு செயல்பாட்டுக் கூடம்",
    selectLanguage: "இடைமுக மொழி",
    trustScore: "நம்பிக்கை மதிப்பீடு",
    factorsTitle: "நம்பிக்கை காரணிகள்",
    identityKyc: "அடையாள சரிபார்ப்பு",
    businessGst: "வணிக ஜிஎஸ்டி சரிபார்ப்பு",
    disputesMediation: "சர்ச்சை தீர்வு",
    safetySOS: "அவசரகால உதவி SOS",
    fraudMonitor: "மோடி தடுப்பு கண்காணிப்பு",
    documentType: "ஆவண வகை",
    documentNumber: "ஆவண எண்",
    gstNumber: "ஜிஎஸ்டி எண் (29XXX)",
    gstCheck: "ஜிஎஸ்டி சரிபார்",
    submitDoc: "சரிபார்ப்புக்கு சமர்ப்பி",
    activeBadges: "சரிபார்ப்பு சின்னங்கள்",
    sosTrigger: "SOS எச்சரிக்கை செய்",
    sosResolve: "SOS எச்சரிக்கை ரத்து செய்",
    addContact: "நம்பகமான தொடர்பைச் சேர்",
    contactName: "தொடர்பு முழு பெயர்",
    contactPhone: "தொடர்பு தொலைபேசி எண்",
    timeline: "சம்பவ காலவரிசை பதிவு",
    disputeChat: "மத்தியஸ்த காலவரிசை அரட்டை",
    postMessage: "கருத்தைச் சமர்ப்பி",
    scoreExplain: "மீண்டும் கணக்கிடப்பட்ட மதிப்பெண்",
  },
  kn: {
    title: "ವಿಶ್ವಾಸಾರ್ಹತೆ ಮತ್ತು ಸುರಕ್ಷತಾ ಕಾರ್ಯಾಚರಣೆಗಳ ಕಾಕ್‌ಪಿಟ್",
    selectLanguage: "ಇಂಟರ್ಫೇಸ್ ಭಾಷೆ",
    trustScore: "ಡೈನಾಮಿಕ್ ಟ್ರಸ್ಟ್ ಸ್ಕೋರ್",
    factorsTitle: "ಟ್ರಸ್ಟ್ ಸ್ಕೋರ್ ಅಂಶಗಳು",
    identityKyc: "ಗುರುತು ದೃಢೀಕರಣ",
    businessGst: "ವ್ಯವಹಾರ ಜಿಎಸ್ಟಿ ದೃಢೀಕರಣ",
    disputesMediation: "ವಿವಾದಗಳ ಸಂಧಾನ",
    safetySOS: "ತುರ್ತು ಸಹಾಯ SOS",
    fraudMonitor: "ವಂಚನೆ ತಡೆಗಟ್ಟುವಿಕೆ ಮಾನಿಟರ್",
    documentType: "ದಾಖಲೆ ವರ್ಗ",
    documentNumber: "ದಾಖಲೆ ಗುರುತು ಸಂಖ್ಯೆ",
    gstNumber: "ಜಿಎಸ್ಟಿ ಸಂಖ್ಯೆ (29XXX)",
    gstCheck: "ಜಿಎಸ್ಟಿ ಹುಡುಕಾಟ",
    submitDoc: "ದೃಢೀಕರಣಕ್ಕಾಗಿ ಸಲ್ಲಿಸಿ",
    activeBadges: "ದೃಢೀಕರಣ ಬ್ಯಾಡ್ಜ್ಗಳು",
    sosTrigger: "SOS ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯಗೊಳಿಸಿ",
    sosResolve: "SOS ಎಚ್ಚರಿಕೆ ರದ್ದುಗೊಳಿಸಿ",
    addContact: "ನಂಬಿಕಸ್ಥ ಸಂಪರ್ಕ ಸೇರಿಸಿ",
    contactName: "ಸಂಪರ್ಕದ ಪೂರ್ಣ ಹೆಸರು",
    contactPhone: "ಸಂಪರ್ಕದ ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    timeline: "ಘಟನೆಗಳ ಕಾಲಾನುಕ್ರಮ ಡೈರಿ",
    disputeChat: "ಸಂಧಾನ ಮಾತುಕತೆ ಕಾಲಕ್ರಮ",
    postMessage: "ಕಾಮೆಂಟ್ ಸಲ್ಲಿಸಿ",
    scoreExplain: "ಮರು ಲೆಕ್ಕಾಚಾರ ಸ್ಕೋರ್",
  },
  ml: {
    title: "ട്രസ്റ്റ് & സേഫ്റ്റി ഓപ്പറേഷൻസ് കോക്ക്പിറ്റ്",
    selectLanguage: "ഇന്റർഫേസ് ഭാഷ",
    trustScore: "ഡൈനാമിക് ട്രസ്റ്റ് സ്കോർ",
    factorsTitle: "ട്രസ്റ്റ് സ്കോർ ഘടകങ്ങൾ",
    identityKyc: "തിരിച്ചറിയൽ പരിശോധന",
    businessGst: "ബിസിനസ്സ് ജിഎസ്ടി പരിശോധന",
    disputesMediation: "തർക്ക പരിഹാരം",
    safetySOS: "അടിയന്തിര സഹായം SOS",
    fraudMonitor: "തട്ടിപ്പ് തടയൽ നിരീക്ഷണം",
    documentType: "പ്രമാണത്തിന്റെ തരം",
    documentNumber: "പ്രമാണത്തിന്റെ നമ്പർ",
    gstNumber: "ജിഎസ്ടി നമ്പർ (29XXX)",
    gstCheck: "ജിഎസ്ടി പരിശോധിക്കുക",
    submitDoc: "പരിശോധനയ്ക്കായി സമർപ്പിക്കുക",
    activeBadges: "വെരിഫിക്കേഷൻ ബാഡ്ജുകൾ",
    sosTrigger: "SOS അലേർട്ട് നൽകുക",
    sosResolve: "SOS അലേർട്ട് റദ്ദാക്കുക",
    addContact: "വിശ്വസ്ത കോൺടാക്റ്റ് ചേർക്കുക",
    contactName: "ബന്ധപ്പെടേണ്ട ആളുടെ പേര്",
    contactPhone: "ഫോൺ നമ്പർ",
    timeline: "അപകട സംഭവങ്ങളുടെ വിവരണം",
    disputeChat: "മധ്യസ്ഥ ചർച്ചാ ടൈംലൈൻ",
    postMessage: "അഭിപ്രായം രേഖപ്പെടുത്തുക",
    scoreExplain: "വീണ്ടും കണക്കാക്കിയ സ്കോർ",
  },
  mr: {
    title: "विश्वास आणि सुरक्षा ऑपरेशन कॉकपिट",
    selectLanguage: "इंटरफेस भाषा",
    trustScore: "डायनॅमिक ट्रस्ट स्कोअर",
    factorsTitle: "ट्रस्ट स्कोअर घटक",
    identityKyc: "ओळख पडताळणी",
    businessGst: "व्यवसाय जीएसटी पडताळणी",
    disputesMediation: "वाद निवारण",
    safetySOS: "तातडीची मदत SOS",
    fraudMonitor: "फसवणूक प्रतिबंध मॉनिटर",
    documentType: "दस्तऐवज प्रकार",
    documentNumber: "दस्तऐवज क्रमांक",
    gstNumber: "जीएसटी क्रमांक (29XXX)",
    gstCheck: "जीएसटी शोधा",
    submitDoc: "पडताळणीसाठी सादर करा",
    activeBadges: "पडताळणी बॅज",
    sosTrigger: "SOS अलर्ट पाठवा",
    sosResolve: "SOS अलर्ट रद्द करा",
    addContact: "विश्वासू संपर्क जोडा",
    contactName: "संपर्काचे पूर्ण नाव",
    contactPhone: "संपर्क फोन नंबर",
    timeline: "घटना इतिहास टाइमलाइन",
    disputeChat: "मध्यस्थ संवाद टाइमलाइन",
    postMessage: "टिप्पणी पाठवा",
    scoreExplain: "पुन्हा मोजलेले गुण",
  },
  gu: {
    title: "ટ્રસ્ટ અને સેફ્ટી ઓપરેશન્સ કોકપિટ",
    selectLanguage: "ભાષા પસંદ કરો",
    trustScore: "ડાયનેમિક ટ્રસ્ટ સ્કોર",
    factorsTitle: "ટ્રસ્ટ સ્કોર પરિબળો",
    identityKyc: "ઓળખની ચકાસણી",
    businessGst: "વ્યવસાય જીએસટી ચકાસણી",
    disputesMediation: "વિવાદ મધ્યસ્થતા",
    safetySOS: "કટોકટીની સહાય SOS",
    fraudMonitor: "છેતરપિંડી નિવારણ મોનિટર",
    documentType: "દસ્તાવેજ પ્રકાર",
    documentNumber: "દસ્તાવેજ નંબર",
    gstNumber: "જીએસટી નંબર (29XXX)",
    gstCheck: "જીએસટી ચકાસો",
    submitDoc: "ચકાસણી માટે મોકલો",
    activeBadges: "ચકાસણી બેજ",
    sosTrigger: "SOS એલર્ટ સક્રિય કરો",
    sosResolve: "SOS એલર્ટ રદ કરો",
    addContact: "વિશ્વાસુ સંપર્ક ઉમેરો",
    contactName: "સંપર્ક નામ",
    contactPhone: "મોબાઈલ નંબર",
    timeline: "ઘટના ઇતિહાસ સમયરેખા",
    disputeChat: "મધ્યસ્થી ચેટ સમયરેખા",
    postMessage: "ટિપ્પણી સબમિટ કરો",
    scoreExplain: "પુનઃ ગણતરી કરેલ સ્કોર",
  },
  pa: {
    title: "ਭਰੋਸਾ ਅਤੇ ਸੁਰੱਖਿਆ ਸੰਚਾਲਨ ਕਾਕਪਿਟ",
    selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    trustScore: "ਗਤੀਸ਼ੀਲ ਭਰੋਸਾ ਸਕੋਰ",
    factorsTitle: "ਭਰੋਸਾ ਸਕੋਰ ਦੇ ਕਾਰਕ",
    identityKyc: "ਪਛਾਣ ਦੀ ਪੜਤਾਲ",
    businessGst: "ਕਾਰੋਬਾਰ ਜੀਐਸਟੀ ਪੜਤਾਲ",
    disputesMediation: "ਵਿਵਾਦ ਨਿਪਟਾਰਾ",
    safetySOS: "ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ SOS",
    fraudMonitor: "ਧੋਖਾਧੜੀ ਰੋਕਥਾਮ ਨਿਗਰਾਨ",
    documentType: "ਦਸਤਾਵੇਜ਼ ਕਿਸਮ",
    documentNumber: "ਦਸਤਾਵੇਜ਼ ਨੰਬਰ",
    gstNumber: "ਜੀਐਸਟੀ ਨੰਬਰ (29XXX)",
    gstCheck: "ਜੀਐਸਟੀ ਚੈੱਕ ਕਰੋ",
    submitDoc: "ਪੜਤਾਲ ਲਈ ਭੇਜੋ",
    activeBadges: "ਪੜਤਾਲ ਵਾਲੇ ਬੈਜ",
    sosTrigger: "SOS ਚੇਤਾਵਨੀ ਭੇਜੋ",
    sosResolve: "SOS ਚੇਤਾਵਨੀ ਰੱਦ ਕਰੋ",
    addContact: "ਭਰੋਸੇਯੋਗ ਸੰਪਰਕ ਜੋੜੋ",
    contactName: "ਸੰਪਰਕ ਦਾ ਨਾਮ",
    contactPhone: "ਫ਼ੋਨ ਨੰਬਰ",
    timeline: "ਘਟਨਾ ਕ੍ਰਮ ਦੀ ਡਾਇਰੀ",
    disputeChat: "ਵਿਚੋਲਗੀ ਗੱਲਬਾਤ ਟਾਈਮਲਾਈਨ",
    postMessage: "ਟਿੱਪਣੀ ਭੇਜੋ",
    scoreExplain: "ਦੁਬਾਰਾ ਗਿਣਿਆ ਸਕੋਰ",
  },
  bn: {
    title: "বিশ্বাস ও নিরাপত্তা অপারেশন ককপিট",
    selectLanguage: "ভাষা নির্বাচন",
    trustScore: "গতিশীল বিশ্বাস স্কোর",
    factorsTitle: "বিশ্বাস যোগ্যতা নির্ধারক",
    identityKyc: "পরিচয়পত্র যাচাইকরণ",
    businessGst: "ব্যবসা জিএসটি যাচাইকরণ",
    disputesMediation: "বিরোধ নিষ্পত্তি",
    safetySOS: "জরুরী সহায়তা SOS",
    fraudMonitor: "জালিয়াতি প্রতিরোধ মনিটর",
    documentType: "নথিপত্র বিভাগ",
    documentNumber: "আইডি নম্বর",
    gstNumber: "জিএসটিআইএন কোড (29XXX)",
    gstCheck: "জিএসটি যাচাই করুন",
    submitDoc: "যাচাইয়ের জন্য পাঠান",
    activeBadges: "অনুমোদিত ভেরিফিকেশন ব্যাজ",
    sosTrigger: "জরুরী এসওএস অ্যালার্ট",
    sosResolve: "এসওএস অ্যালার্ট বাতিল করুন",
    addContact: "জরুরী যোগাযোগকারী যোগ করুন",
    contactName: "সম্পূর্ণ নাম",
    contactPhone: "ফোন নম্বর",
    timeline: "দুর্ঘটনা বিবরণ ডায়েরি",
    disputeChat: "মধ্যস্থতাকারী চ্যাট টাইমলাইন",
    postMessage: "মন্তব্য জমা দিন",
    scoreExplain: "পুনর্গণনা স্কোর",
  },
  or: {
    title: "ବିଶ୍ୱାସ ଏବଂ ସୁରକ୍ଷା କାର୍ଯ୍ୟକ୍ଷେତ୍ର",
    selectLanguage: "ଭାଷା ଚୟନ",
    trustScore: "ଡାଇନାମିକ ବିଶ୍ୱାସ ସ୍କୋର",
    factorsTitle: "ବିଶ୍ୱାସ ସ୍କୋର କାରକ",
    identityKyc: "ପରିଚୟ ଯାଞ୍ଚ",
    businessGst: "ବ୍ୟବସାୟ GST ଯାଞ୍ଚ",
    disputesMediation: "ବିବାଦ ସମାଧାନ",
    safetySOS: "জরুরী ସହାୟତା SOS",
    fraudMonitor: "ଜାଲିଆତି ନିରୋଧ ମନିଟର",
    documentType: "ଦଲିଲ ପ୍ରକାର",
    documentNumber: "ଦଲିଲ ନମ୍ବର",
    gstNumber: "GST ନମ୍ବର (29XXX)",
    gstCheck: "GST ଯାଞ୍ಚ କରନ୍ତୁ",
    submitDoc: "ଯାଞ୍ଚ ପାଇଁ ପଠାନ୍ତୁ",
    activeBadges: "ଯାଞ୍ଚ ବ୍ୟାଜ୍ ସମୂହ",
    sosTrigger: "SOS ସଙ୍କେତ ଦିଅନ୍ତୁ",
    sosResolve: "SOS ସଙ୍କେତ ରଦ୍ଦ କରନ୍ତୁ",
    addContact: "ବିଶ୍ୱସ୍ତ ସମ୍ପର୍କ ଯୋଡନ୍ତୁ",
    contactName: "ସମ୍ପର୍କ ନାମ",
    contactPhone: "ଫୋନ ନମ୍ବର",
    timeline: "ଘଟଣା ରେକର୍ଡ ସମୟ ସୀମା",
    disputeChat: "ମଧ୍ୟସ୍ଥି ଆଲୋଚନା ସମୟରେଖା",
    postMessage: "ମନ୍ତବ୍ୟ ଦିଅନ୍ତು",
    scoreExplain: "ପୁନଃଗଣନା ସ୍କୋର",
  }
};

export default function TrustDashboard() {
  const [lang, setLang] = useState("en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS["en"];

  // Profile Context (Simulated Arun the worker)
  const currentUserId = "worker-profile-id";

  // Realtime safety SOS hook
  const safety = useSafetySOS(currentUserId);

  // Verification request hook
  const verify = useVerification();



  // Disputes timeline hook
  const dispute = useDisputes();

  // State factors for Trust Score recalculator simulator
  const [scoreIdentityVerified, setScoreIdentityVerified] = useState(false);
  const [scoreBusinessVerified, setScoreBusinessVerified] = useState(false);
  const [scoreProfileComplete, setScoreProfileComplete] = useState(true);
  const [scoreRatingAvg, setScoreRatingAvg] = useState(5.0);
  const [scoreDisputesCount, setScoreDisputesCount] = useState(0);

  // Recalculated score value based on weights
  const [computedScore, setComputedScore] = useState(80);

  // Recalculate score on simulator updates
  useEffect(() => {
    let score = 0;
    score += scoreIdentityVerified ? 30 : 0;
    score += scoreBusinessVerified ? 20 : 0;
    score += scoreProfileComplete ? 15 : 0;
    score += scoreRatingAvg * 4; // 5 * 4 = 20 max
    score -= scoreDisputesCount * 15;
    
    // Member age bonus simulation
    score += 15; // default 10 months

    setComputedScore(Math.max(0, Math.min(100, Math.round(score))));
  }, [scoreIdentityVerified, scoreBusinessVerified, scoreProfileComplete, scoreRatingAvg, scoreDisputesCount]);

  // Form Fields
  const [kycDocType, setKycDocType] = useState("aadhaar");
  const [kycDocNum, setKycDocNum] = useState("");
  const [gstNumInput, setGstNumInput] = useState("");
  const [gstCompanyName, setGstCompanyName] = useState("");
  const [gstAddress, setGstAddress] = useState("");
  const [gstCategory, setGstCategory] = useState("");
  const [gstLoading, setGstLoading] = useState(false);

  // Safety contact inputs
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactPhoneInput, setContactPhoneInput] = useState("");

  // Dispute chat input
  const [disputeMsgInput, setDisputeMsgInput] = useState("");

  // Fraud Signal mock logs
  const [fraudSignals] = useState([
    {
      id: "f1",
      type: "suspicious_login",
      score: 0.72,
      time: "10 mins ago",
      details: "Expected Bangalore IP (ISP: Airtel), but log query flagged Chennai proxy block."
    },
    {
      id: "f2",
      type: "location_mismatch",
      score: 0.94,
      time: "1 hour ago",
      details: "Coordinates jumped 320km in 45 seconds. Anomaly triggers velocity limit alerts."
    }
  ]);

  const handleGstLookup = async () => {
    if (!gstNumInput.trim()) return;
    setGstLoading(true);
    const lookup = await verify.lookupGst(gstNumInput);
    setGstLoading(false);
    if (lookup.success) {
      setGstCompanyName(lookup.companyName || "");
      setGstAddress(lookup.address || "");
      setGstCategory(lookup.category || "");
    } else {
      setGstCompanyName("Not found in GST Registry");
      setGstAddress("");
      setGstCategory("");
    }
  };

  const handleKycSubmit = async () => {
    if (!kycDocNum.trim()) return;
    const res = await verify.submitKyc(
      "identity",
      kycDocType,
      kycDocNum,
      "https://storage.googleapis.com/jobnest-kyc/docs/doc_aadhaar_scan.jpg"
    );
    if (res.success) {
      setScoreIdentityVerified(true);
      setKycDocNum("");
    }
  };

  const handleGstSubmit = async () => {
    if (!gstCompanyName) return;
    const res = await verify.submitBusiness({
      gstNumber: gstNumInput,
      businessName: gstCompanyName,
      businessAddress: gstAddress,
      authorizedContact: "Arun Gowda",
      businessCategory: gstCategory,
    });
    if (res.success) {
      setScoreBusinessVerified(true);
      setGstNumInput("");
      setGstCompanyName("");
      setGstAddress("");
      setGstCategory("");
    }
  };

  const handleAddContact = async () => {
    if (!contactNameInput.trim() || !contactPhoneInput.trim()) return;
    await safety.addContact(contactNameInput, contactPhoneInput);
    setContactNameInput("");
    setContactPhoneInput("");
  };

  const handleTriggerSos = async () => {
    // Bangalore dummy coords
    await safety.triggerSOS({ latitude: 12.9716, longitude: 77.5946 });
  };

  const handleResolveSos = async () => {
    await safety.resolveSOS();
  };

  const handleSendDisputeMessage = async () => {
    if (!disputeMsgInput.trim()) return;
    await dispute.sendMessage("d1", disputeMsgInput, "worker-profile-id");
    setDisputeMsgInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground">
      {/* Luxury Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-linear-to-r from-amber-500 to-amber-600 flex items-center justify-center text-background font-extrabold text-lg">
              T
            </span>
            <Typography variant="h3" as="span" className="font-bold tracking-tight text-xl">
              {t.title}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground mr-1" htmlFor="lang-select">
              {t.selectLanguage}:
            </label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-muted text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border outline-none cursor-pointer"
            >
              <option value="en">English (English)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="or">ଓଡ଼ିଆ (Odia)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Trust Scoring & Badges */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Trust Score Engine Gauge */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">{t.trustScore}</CardTitle>
              <CardDescription className="text-xs">
                Real-time weighted score calculation according to trust vectors.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              {/* Dial Gauge */}
              <div className="flex flex-col items-center justify-center p-4 border border-border/40 rounded-2xl bg-black/25">
                <span className="text-5xl font-extrabold text-amber-500 font-mono tracking-tight">
                  {computedScore}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 mt-1">
                  {t.scoreExplain}
                </span>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-3 max-w-[200px]">
                  <div
                    className="bg-linear-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${computedScore}%` }}
                  />
                </div>
              </div>

              {/* Factors Configuration Simulation */}
              <div className="flex flex-col gap-3">
                <Typography variant="muted" className="text-xs font-bold uppercase tracking-wider block">
                  {t.factorsTitle}
                </Typography>

                <div className="flex items-center justify-between text-xs py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Identity Verified (+30)</span>
                  <input
                    type="checkbox"
                    checked={scoreIdentityVerified}
                    onChange={(e) => setScoreIdentityVerified(e.target.checked)}
                    className="cursor-pointer accent-amber-500"
                    aria-label="Toggle Identity Verification status for score simulation"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Business GST Verified (+20)</span>
                  <input
                    type="checkbox"
                    checked={scoreBusinessVerified}
                    onChange={(e) => setScoreBusinessVerified(e.target.checked)}
                    className="cursor-pointer accent-amber-500"
                    aria-label="Toggle Business GST Verification status for score simulation"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Profile Complete (+15)</span>
                  <input
                    type="checkbox"
                    checked={scoreProfileComplete}
                    onChange={(e) => setScoreProfileComplete(e.target.checked)}
                    className="cursor-pointer accent-amber-500"
                    aria-label="Toggle Profile Completeness status for score simulation"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs py-1 border-b border-border/10">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Rating: {scoreRatingAvg.toFixed(1)} stars</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={scoreRatingAvg}
                    onChange={(e) => setScoreRatingAvg(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                    aria-label="Adjust Average Rating for score simulation"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground">Active Disputes (-15 pts each)</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={scoreDisputesCount}
                    onChange={(e) => setScoreDisputesCount(parseInt(e.target.value) || 0)}
                    className="w-12 bg-muted text-foreground text-center border border-border rounded py-0.5 text-xs font-bold outline-none"
                    aria-label="Set Active Disputes count for score simulation"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Inventory */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">{t.activeBadges}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {scoreIdentityVerified && (
                <Badge variant="success" className="text-[10px] uppercase font-bold py-1 px-2.5">
                  🛡️ Verified Identity
                </Badge>
              )}
              {scoreBusinessVerified && (
                <Badge variant="primary" className="text-[10px] uppercase font-bold py-1 px-2.5">
                  🚜 Verified Business
                </Badge>
              )}
              {scoreRatingAvg >= 4.5 && (
                <Badge variant="warning" className="text-[10px] uppercase font-bold py-1 px-2.5">
                  🏆 Top Rated Worker
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] uppercase font-bold py-1 px-2.5">
                ⚡ Fast Responder
              </Badge>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold py-1 px-2.5">
                🤝 Trusted Partner
              </Badge>
            </CardContent>
          </Card>

        </div>

        {/* Center Column: Verification & Business Verification */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Identity Verification Forms */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">{t.identityKyc}</CardTitle>
              <CardDescription className="text-xs">
                Upload official identification documents for moderator review.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold" htmlFor="kyc-doc-type">
                  {t.documentType}
                </label>
                <select
                  id="kyc-doc-type"
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value)}
                  className="bg-muted text-foreground text-xs px-2 py-1.5 rounded border border-border outline-none cursor-pointer"
                >
                  <option value="aadhaar">Aadhaar (Indian ID)</option>
                  <option value="pan">PAN Card (Tax Registration)</option>
                  <option value="passport">Passport International</option>
                  <option value="driving_licence">Driving License</option>
                  <option value="voter_id">Voter Identification</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground font-semibold" htmlFor="kyc-doc-num">
                  {t.documentNumber}
                </label>
                <Input
                  id="kyc-doc-num"
                  placeholder="Enter document reference ID number..."
                  value={kycDocNum}
                  onChange={(e) => setKycDocNum(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="border border-dashed border-border/60 p-3 rounded-lg text-center bg-black/10 flex flex-col items-center justify-center">
                <span className="text-lg">📁</span>
                <span className="text-[10px] text-muted-foreground mt-1">Select scanned document file scans</span>
              </div>

              <Button size="sm" onClick={handleKycSubmit} className="bg-amber-600 hover:bg-amber-700 w-full text-xs">
                {t.submitDoc}
              </Button>
            </CardContent>
          </Card>

          {/* Business Verification GST */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">{t.businessGst}</CardTitle>
              <CardDescription className="text-xs">
                Validate organization tax registrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground font-semibold" htmlFor="gst-num">
                    {t.gstNumber}
                  </label>
                  <Input
                    id="gst-num"
                    placeholder="e.g. 29AAAAA0000A1Z1"
                    value={gstNumInput}
                    onChange={(e) => setGstNumInput(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleGstLookup}
                  className="bg-muted hover:bg-muted/80 text-foreground text-xs self-end h-8.5 border border-border"
                >
                  {gstLoading ? "..." : t.gstCheck}
                </Button>
              </div>

              {gstCompanyName && (
                <div className="text-xs bg-muted/40 p-2.5 rounded border border-border/30 flex flex-col gap-1">
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Business Legal Name</span>
                    <span className="font-semibold">{gstCompanyName}</span>
                  </div>
                  {gstAddress && (
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Registered Address</span>
                      <span>{gstAddress}</span>
                    </div>
                  )}
                  {gstCategory && (
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Sector Classification</span>
                      <span className="italic text-amber-500">{gstCategory}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                size="sm"
                onClick={handleGstSubmit}
                disabled={!gstCompanyName || gstCompanyName.startsWith("Not")}
                className="bg-amber-600 hover:bg-amber-700 w-full text-xs disabled:opacity-40"
              >
                {t.submitDoc}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: SOS Safety & Dispute Mediation */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Emergency Safety SOS Assistance */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-rose-500 font-bold flex items-center justify-between">
                <span>{t.safetySOS}</span>
                {safety.sosActive && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Activate warning alerts and log tracking status telemetry immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              <div className="flex gap-2">
                {safety.sosActive ? (
                  <Button
                    size="lg"
                    onClick={handleResolveSos}
                    className="bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold w-full text-sm h-12 shadow-lg"
                  >
                    🟢 {t.sosResolve}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleTriggerSos}
                    className="bg-linear-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold w-full text-sm h-12 shadow-lg animate-pulse"
                  >
                    🚨 {t.sosTrigger}
                  </Button>
                )}
              </div>

              {/* Incident timeline audit log */}
              {safety.sosActive && safety.incidentTimeline.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    {t.timeline}
                  </Typography>
                  <div className="bg-black/35 rounded-xl border border-rose-500/30 p-2.5 font-mono text-[9px] h-[100px] overflow-y-auto flex flex-col gap-1.5 text-rose-300">
                    {safety.incidentTimeline.map((log, idx) => (
                      <div key={idx} className="border-b border-rose-500/10 pb-1">
                        <span className="font-semibold text-rose-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>{" "}
                        - <span className="font-bold">[{log.event}]</span> {log.details}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trusted Contacts Grid */}
              <div className="flex flex-col gap-2.5">
                <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Trusted Emergency Contacts
                </Typography>

                <div className="flex flex-col gap-1.5">
                  {safety.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex justify-between items-center bg-muted/40 px-2.5 py-1.5 rounded border border-border/30 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{contact.contact_name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{contact.contact_phone}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => safety.removeContact(contact.id)}
                        className="text-[9px] text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-6 px-1.5"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add emergency contacts inputs */}
                <div className="flex flex-col gap-1.5 border-t border-border/25 pt-2 mt-1">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder={t.contactName}
                      value={contactNameInput}
                      onChange={(e) => setContactNameInput(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder={t.contactPhone}
                      value={contactPhoneInput}
                      onChange={(e) => setContactPhoneInput(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={handleAddContact} className="w-full text-xs h-8">
                    {t.addContact}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Mediation Board */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">{t.disputesMediation}</CardTitle>
              <CardDescription className="text-xs">
                Active opportunity dispute mediation timeline logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              
              {/* Timeline scroller */}
              <div className="bg-black/20 border border-border/40 rounded-xl p-2.5 flex flex-col gap-2.5 h-[150px] overflow-y-auto">
                {dispute.disputes.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-2 border-b border-border/25 pb-2">
                    <span className="text-[10px] uppercase font-bold text-amber-500">
                      Dispute Case: {dispute.disputes[0].reason}
                    </span>
                    <p className="text-[10px] text-muted-foreground italic">
                      {dispute.disputes[0].description}
                    </p>
                  </div>
                )}

                {dispute.activeTimeline.length === 0 ? (
                  <Button
                    size="sm"
                    onClick={() => dispute.loadTimeline("d1")}
                    className="m-auto text-[10px] bg-muted text-foreground border border-border"
                  >
                    Load Mediation Conversation Timeline Logs
                  </Button>
                ) : (
                  dispute.activeTimeline.map((msg) => {
                    const isMod = msg.sender_id === "moderator-profile-id";
                    const isOwn = msg.sender_id === "worker-profile-id";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isMod ? "self-center items-center" : isOwn ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl text-[10px] ${
                            isMod
                              ? "bg-amber-600/20 text-amber-300 border border-amber-500/20"
                              : isOwn
                              ? "bg-amber-600 text-white"
                              : "bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span className="font-bold block text-[8px] opacity-75 mb-0.5">
                            {isMod ? "Mediator" : isOwn ? "You (Arun)" : "Employer (Nisha)"}
                          </span>
                          {msg.message_text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Send */}
              {dispute.activeTimeline.length > 0 && (
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter mediation notes..."
                    value={disputeMsgInput}
                    onChange={(e) => setDisputeMsgInput(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                  <Button size="sm" onClick={handleSendDisputeMessage} className="bg-amber-600 hover:bg-amber-700 text-xs px-2.5 h-8.5">
                    {t.postMessage}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fraud Security Signal Log Ticker */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-500 font-bold">{t.fraudMonitor}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/35 border border-border/40 p-2.5 rounded-xl font-mono text-[9px] flex flex-col gap-2 text-muted-foreground">
                {fraudSignals.map((sig) => (
                  <div key={sig.id} className="border-b border-border/10 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-rose-400 uppercase tracking-wide">
                        ⚠️ {sig.type}
                      </span>
                      <Badge variant="danger" className="text-[8px] px-1 py-0 font-bold">
                        {(sig.score * 100).toFixed(0)}% Alert
                      </Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{sig.details}</p>
                    <span className="text-[8px] text-muted-foreground/50 block mt-0.5">{sig.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </main>
    </div>
  );
}
