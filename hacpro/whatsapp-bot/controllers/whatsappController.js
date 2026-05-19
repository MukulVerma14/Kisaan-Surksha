import Farmer from "../models/Farmer.js";
import { sendMessage } from "../services/twilioService.js";
import { generateResponse } from "../services/groqService.js";
import { getAgroData } from "../services/weatherService.js";
import { transcribeAudio } from "../services/sarvamService.js";
import { getCoordinates, getDefaultStateCoordinates } from "../services/locationService.js";
import { isBotWhatsAppNumber } from "../utils/twilioWebhook.js";

// In-memory session tracking
const sessions = {};

const resetSession = (from) => {
  sessions[from] = {
    mode: "registration",
    step: 0,
    preferredLanguage: null, // Will be set during language selection
    data: {
      name: null,
      aadhar: null,
      dob: null,
      landReg: null,
      city: null,
      state: null,
      reason: null,
      totalLandArea: null,
    },
    history: [],
  };
};

// Helper function to get messages in selected language
const getMessage = (lang, key, params = {}) => {
  const messages = {
    en: {
      nameError: "Name should be at least 2 characters long. Please enter your full name.",
      nameInvalidChars: "Name contains too many invalid characters. Please use only letters and spaces.",
      nameNoLetters: "Name must contain letters. Please enter your actual name.",
      nameOnlyNumbers: "Name cannot be only numbers. Please enter your actual name.",
      aadhaarPrompt: "📄 Please enter your 12-digit Aadhaar number:",
      aadhaarEmpty: "Aadhaar number cannot be empty. Please enter your 12-digit Aadhaar number.",
      aadhaarLength: "Aadhaar should be exactly 12 digits. You entered ${length} digits. Please re-enter.",
      aadhaarInvalid: "Aadhaar should contain only numbers (0-9). Please re-enter without spaces or special characters.",
      aadhaarFormat: "Invalid Aadhaar format. Please enter exactly 12 digits.",
      dobPrompt: "📅 Enter your Date of Birth (dd/mm/yyyy or dd.mm.yyyy):\nExample: 15/01/1990",
      dobFormat: "Invalid date format. Please enter DOB in dd/mm/yyyy format.\nExample: 15/01/1990 or 05/12/1985",
      dobMonth: "Invalid month. Month should be between 01 and 12. Please re-enter (dd/mm/yyyy).",
      dobDay: "Invalid day. Day should be between 01 and 31. Please re-enter (dd/mm/yyyy).",
      dobYearFuture: "Year cannot be in the future. Please enter a valid year.",
      dobYearOld: "Year seems too old. Please enter a valid year.",
      dobInvalid: "Invalid date. Please check the day, month, and year are correct.\nExample: 15/01/1990",
      landRegPrompt: "🧾 What's your Land Registration number?",
      landRegEmpty: "Land Registration number cannot be empty. Please enter your Land Registration number.",
      landRegShort: "Land Registration number seems too short. Please enter a valid registration number.",
      landRegLong: "Land Registration number seems too long. Please enter a valid registration number (max 50 characters).",
      cityPrompt: "🏠 Which city or village are you from?",
      cityEmpty: "City/Village name cannot be empty. Please enter your city or village name.",
      cityShort: "City/Village name should be at least 2 characters. Please enter a valid name.",
      statePrompt: "🌍 Which state are you located in?",
      stateEmpty: "State name cannot be empty. Please enter your state name.",
      stateShort: "State name should be at least 2 characters. Please enter a valid state name.",
      reasonPrompt: "📝 Briefly describe the crop loss or assistance you need.",
      reasonEmpty: "Description cannot be empty. Please describe your crop loss or assistance need.",
      reasonShort: "Description is too short. Please share at least a few words about your situation.",
      reasonLong: "Description is too long. Please keep it under 500 characters.",
      totalLandAreaPrompt: "🌾 What is your total farm land area in square meters?\n\nExample: 10000 (for 1 hectare)\nTip: 1 hectare = 10,000 sq m",
      totalLandAreaEmpty: "Total farm area cannot be empty. Please enter your land area in square meters (numbers only).",
      totalLandAreaInvalid: "Please enter a valid number for total farm area in square meters.\nExample: 10000",
      totalLandAreaTooSmall: "Farm area seems too small. Please enter at least 1 sq meter.",
      totalLandAreaTooLarge: "Farm area seems too large. Please enter a value under 10,000,000 sq m.",
      dbDuplicate: "⚠️ This Aadhaar number is already registered. Please use a different Aadhaar or contact support.",
      dbError: "⚠️ Sorry, we couldn't save your details. Please try again or type 'quit' to restart.",
      somethingWrong: "Something went wrong. Type 'hi' to restart your registration.",
    },
    hi: {
      nameError: "नाम कम से कम 2 अक्षर का होना चाहिए। कृपया अपना पूरा नाम दर्ज करें।",
      nameInvalidChars: "नाम में बहुत अधिक अमान्य वर्ण हैं। कृपया केवल अक्षर और रिक्त स्थान का उपयोग करें।",
      nameNoLetters: "नाम में अक्षर होने चाहिए। कृपया अपना वास्तविक नाम दर्ज करें।",
      nameOnlyNumbers: "नाम केवल संख्याएं नहीं हो सकता। कृपया अपना वास्तविक नाम दर्ज करें।",
      aadhaarPrompt: "📄 कृपया अपना 12 अंकों का आधार नंबर दर्ज करें:",
      aadhaarEmpty: "आधार नंबर खाली नहीं हो सकता। कृपया अपना 12 अंकों का आधार नंबर दर्ज करें।",
      aadhaarLength: "आधार ठीक 12 अंकों का होना चाहिए। आपने ${length} अंक दर्ज किए हैं। कृपया पुनः दर्ज करें।",
      aadhaarInvalid: "आधार में केवल संख्याएं (0-9) होनी चाहिए। कृपया बिना रिक्त स्थान या विशेष वर्णों के पुनः दर्ज करें।",
      aadhaarFormat: "अमान्य आधार प्रारूप। कृपया ठीक 12 अंक दर्ज करें।",
      dobPrompt: "📅 अपनी जन्म तिथि दर्ज करें (dd/mm/yyyy या dd.mm.yyyy):\nउदाहरण: 15/01/1990",
      dobFormat: "अमान्य तिथि प्रारूप। कृपया dd/mm/yyyy प्रारूप में जन्म तिथि दर्ज करें।\nउदाहरण: 15/01/1990 या 05/12/1985",
      dobMonth: "अमान्य महीना। महीना 01 और 12 के बीच होना चाहिए। कृपया पुनः दर्ज करें (dd/mm/yyyy)।",
      dobDay: "अमान्य दिन। दिन 01 और 31 के बीच होना चाहिए। कृपया पुनः दर्ज करें (dd/mm/yyyy)।",
      dobYearFuture: "वर्ष भविष्य में नहीं हो सकता। कृपया एक वैध वर्ष दर्ज करें।",
      dobYearOld: "वर्ष बहुत पुराना लगता है। कृपया एक वैध वर्ष दर्ज करें।",
      dobInvalid: "अमान्य तिथि। कृपया जांचें कि दिन, महीना और वर्ष सही हैं।\nउदाहरण: 15/01/1990",
      landRegPrompt: "🧾 आपका भूमि पंजीकरण नंबर क्या है?",
      landRegEmpty: "भूमि पंजीकरण नंबर खाली नहीं हो सकता। कृपया अपना भूमि पंजीकरण नंबर दर्ज करें।",
      landRegShort: "भूमि पंजीकरण नंबर बहुत छोटा लगता है। कृपया एक वैध पंजीकरण नंबर दर्ज करें।",
      landRegLong: "भूमि पंजीकरण नंबर बहुत लंबा लगता है। कृपया एक वैध पंजीकरण नंबर दर्ज करें (अधिकतम 50 अक्षर)।",
      cityPrompt: "🏠 आप किस शहर या गाँव से हैं?",
      cityEmpty: "शहर/गाँव का नाम खाली नहीं हो सकता। कृपया अपने शहर या गाँव का नाम दर्ज करें।",
      cityShort: "शहर/गाँव का नाम कम से कम 2 अक्षर का होना चाहिए। कृपया एक वैध नाम दर्ज करें।",
      statePrompt: "🌍 आप किस राज्य में स्थित हैं?",
      stateEmpty: "राज्य का नाम खाली नहीं हो सकता। कृपया अपने राज्य का नाम दर्ज करें।",
      stateShort: "राज्य का नाम कम से कम 2 अक्षर का होना चाहिए। कृपया एक वैध राज्य नाम दर्ज करें।",
      reasonPrompt: "📝 फसल की हानि या आवश्यक सहायता का संक्षिप्त विवरण दें।",
      reasonEmpty: "विवरण खाली नहीं हो सकता। कृपया अपनी फसल की हानि या सहायता की आवश्यकता का वर्णन करें।",
      reasonShort: "विवरण बहुत छोटा है। कृपया अपनी स्थिति के बारे में कम से कम कुछ शब्द साझा करें।",
      reasonLong: "विवरण बहुत लंबा है। कृपया इसे 500 अक्षरों से कम रखें।",
      totalLandAreaPrompt: "🌾 आपके कुल खेत की जमीन का क्षेत्रफल वर्ग मीटर में क्या है?\n\nउदाहरण: 10000 (1 हेक्टेयर के लिए)\nसुझाव: 1 हेक्टेयर = 10,000 वर्ग मीटर",
      totalLandAreaEmpty: "कुल खेत क्षेत्र खाली नहीं हो सकता। कृपया वर्ग मीटर में अपनी जमीन का क्षेत्रफल दर्ज करें।",
      totalLandAreaInvalid: "कृपया वर्ग मीटर में एक वैध संख्या दर्ज करें।\nउदाहरण: 10000",
      totalLandAreaTooSmall: "खेत क्षेत्र बहुत छोटा लगता है। कृपया कम से कम 1 वर्ग मीटर दर्ज करें।",
      totalLandAreaTooLarge: "खेत क्षेत्र बहुत बड़ा लगता है। कृपया 10,000,000 वर्ग मीटर से कम मान दर्ज करें।",
      dbDuplicate: "⚠️ यह आधार नंबर पहले से पंजीकृत है। कृपया एक अलग आधार का उपयोग करें या सपोर्ट से संपर्क करें।",
      dbError: "⚠️ क्षमा करें, हम आपकी जानकारी सहेज नहीं सके। कृपया पुनः प्रयास करें या पुनः आरंभ करने के लिए 'quit' लिखें।",
      somethingWrong: "कुछ गलत हो गया। अपना पंजीकरण पुनः आरंभ करने के लिए 'hi' लिखें।",
    },
    te: {
      nameError: "పేరు కనీసం 2 అక్షరాలుగా ఉండాలి. దయచేసి మీ పూర్తి పేరును నమోదు చేయండి.",
      nameInvalidChars: "పేరులో చాలా చెల్లని అక్షరాలు ఉన్నాయి. దయచేసి అక్షరాలు మరియు ఖాళీలను మాత్రమే ఉపయోగించండి.",
      nameNoLetters: "పేరులో అక్షరాలు ఉండాలి. దయచేసి మీ నిజమైన పేరును నమోదు చేయండి.",
      nameOnlyNumbers: "పేరు సంఖ్యలు మాత్రమే కాకూడదు. దయచేసి మీ నిజమైన పేరును నమోదు చేయండి.",
      aadhaarPrompt: "📄 దయచేసి మీ 12 అంకెల ఆధార్ నంబర్ నమోదు చేయండి:",
      aadhaarEmpty: "ఆధార్ నంబర్ ఖాళీగా ఉండకూడదు. దయచేసి మీ 12 అంకెల ఆధార్ నంబర్ నమోదు చేయండి.",
      aadhaarLength: "ఆధార్ ఖచ్చితంగా 12 అంకెలు ఉండాలి. మీరు ${length} అంకెలు నమోదు చేసారు. దయచేసి మళ్లీ నమోదు చేయండి.",
      aadhaarInvalid: "ఆధార్ లో సంఖ్యలు మాత్రమే (0-9) ఉండాలి. దయచేసి ఖాళీలు లేదా ప్రత్యేక అక్షరాలు లేకుండా మళ్లీ నమోదు చేయండి.",
      aadhaarFormat: "చెల్లని ఆధార్ ఫార్మాట్. దయచేసి ఖచ్చితంగా 12 అంకెలు నమోదు చేయండి.",
      dobPrompt: "📅 మీ జన్మ తేదీని నమోదు చేయండి (dd/mm/yyyy లేదా dd.mm.yyyy):\nఉదాహరణ: 15/01/1990",
      dobFormat: "చెల్లని తేదీ ఫార్మాట్. దయచేసి dd/mm/yyyy ఫార్మాట్ లో జన్మ తేదీని నమోదు చేయండి.\nఉదాహరణ: 15/01/1990 లేదా 05/12/1985",
      dobMonth: "చెల్లని నెల. నెల 01 మరియు 12 మధ్య ఉండాలి. దయచేసి మళ్లీ నమోదు చేయండి (dd/mm/yyyy).",
      dobDay: "చెల్లని రోజు. రోజు 01 మరియు 31 మధ్య ఉండాలి. దయచేసి మళ్లీ నమోదు చేయండి (dd/mm/yyyy).",
      dobYearFuture: "సంవత్సరం భవిష్యత్తులో ఉండకూడదు. దయచేసి చెల్లుబాటు అయ్యే సంవత్సరాన్ని నమోదు చేయండి.",
      dobYearOld: "సంవత్సరం చాలా పాతదిగా అనిపిస్తుంది. దయచేసి చెల్లుబాటు అయ్యే సంవత్సరాన్ని నమోదు చేయండి.",
      dobInvalid: "చెల్లని తేదీ. దయచేసి రోజు, నెల మరియు సంవత్సరం సరైనవి అని తనిఖీ చేయండి.\nఉదాహరణ: 15/01/1990",
      landRegPrompt: "🧾 మీ భూమి నమోదు నంబర్ ఏమిటి?",
      landRegEmpty: "భూమి నమోదు నంబర్ ఖాళీగా ఉండకూడదు. దయచేసి మీ భూమి నమోదు నంబర్ నమోదు చేయండి.",
      landRegShort: "భూమి నమోదు నంబర్ చాలా చిన్నదిగా అనిపిస్తుంది. దయచేసి చెల్లుబాటు అయ్యే నమోదు నంబర్ నమోదు చేయండి.",
      landRegLong: "భూమి నమోదు నంబర్ చాలా పొడవుగా అనిపిస్తుంది. దయచేసి చెల్లుబాటు అయ్యే నమోదు నంబర్ నమోదు చేయండి (గరిష్టంగా 50 అక్షరాలు).",
      cityPrompt: "🏠 మీరు ఏ నగరం లేదా గ్రామం నుండి వచ్చారు?",
      cityEmpty: "నగరం/గ్రామం పేరు ఖాళీగా ఉండకూడదు. దయచేసి మీ నగరం లేదా గ్రామం పేరును నమోదు చేయండి.",
      cityShort: "నగరం/గ్రామం పేరు కనీసం 2 అక్షరాలుగా ఉండాలి. దయచేసి చెల్లుబాటు అయ్యే పేరును నమోదు చేయండి.",
      statePrompt: "🌍 మీరు ఏ రాష్ట్రంలో ఉన్నారు?",
      stateEmpty: "రాష్ట్రం పేరు ఖాళీగా ఉండకూడదు. దయచేసి మీ రాష్ట్రం పేరును నమోదు చేయండి.",
      stateShort: "రాష్ట్రం పేరు కనీసం 2 అక్షరాలుగా ఉండాలి. దయచేసి చెల్లుబాటు అయ్యే రాష్ట్రం పేరును నమోదు చేయండి.",
      reasonPrompt: "📝 పంట నష్టం లేదా అవసరమైన సహాయం గురించి సంక్షిప్తంగా వివరించండి.",
      reasonEmpty: "వివరణ ఖాళీగా ఉండకూడదు. దయచేసి మీ పంట నష్టం లేదా సహాయం అవసరాన్ని వివరించండి.",
      reasonShort: "వివరణ చాలా చిన్నది. దయచేసి మీ పరిస్థితి గురించి కనీసం కొన్ని పదాలను పంచుకోండి.",
      reasonLong: "వివరణ చాలా పొడవుగా ఉంది. దయచేసి దానిని 500 అక్షరాల కంటే తక్కువగా ఉంచండి.",
      totalLandAreaPrompt: "🌾 మీ మొత్తం పొలం విస్తీర్ణం చదరపు మీటర్లలో ఎంత?\n\nఉదాహరణ: 10000 (1 హెక్టార్ కోసం)\nచిట్కా: 1 హెక్టార్ = 10,000 చ.మీ",
      totalLandAreaEmpty: "మొత్తం పొలం విస్తీర్ణం ఖాళీగా ఉండకూడదు. దయచేసి చదరపు మీటర్లలో మీ భూమి విస్తీర్ణాన్ని నమోదు చేయండి.",
      totalLandAreaInvalid: "దయచేసి చదరపు మీటర్లలో చెల్లుబాటు అయ్యే సంఖ్యను నమోదు చేయండి.\nఉదాహరణ: 10000",
      totalLandAreaTooSmall: "పొలం విస్తీర్ణం చాలా చిన్నదిగా ఉంది. దయచేసి కనీసం 1 చ.మీ నమోదు చేయండి.",
      totalLandAreaTooLarge: "పొలం విస్తీర్ణం చాలా పెద్దదిగా ఉంది. దయచేసి 10,000,000 చ.మీ కంటే తక్కువ నమోదు చేయండి.",
      dbDuplicate: "⚠️ ఈ ఆధార్ నంబర్ ఇప్పటికే నమోదు చేయబడింది. దయచేసి వేరే ఆధార్ ఉపయోగించండి లేదా మద్దతుకు సంప్రదించండి.",
      dbError: "⚠️ క్షమించండి, మేము మీ వివరాలను సేవ్ చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి లేదా పునఃప్రారంభించడానికి 'quit' రాయండి.",
      somethingWrong: "ఏదో తప్పు జరిగింది. మీ నమోదును పునఃప్రారంభించడానికి 'hi' రాయండి.",
    },
  };
  let message = messages[lang]?.[key] || messages.en[key] || key;
  // Replace placeholders if any (e.g., ${length} in aadhaarLength message)
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach(param => {
      const placeholder = new RegExp(`\\$\\{${param}\\}`, 'g');
      message = message.replace(placeholder, params[param]);
    });
  }
  return message;
};

// Validation helper functions
const validateName = (name, lang = "en") => {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: getMessage(lang, "nameError") };
  }
  
  // Remove spaces for validation
  const nameWithoutSpaces = name.replace(/\s+/g, "");
  
  // Reject if name is only numbers
  if (/^\d+$/.test(nameWithoutSpaces)) {
    return { valid: false, error: getMessage(lang, "nameOnlyNumbers") };
  }
  
  // Allow letters from multiple scripts:
  // - English: a-zA-Z
  // - Hindi/Devanagari: \u0900-\u097F (includes मुकुल वर्मा)
  // - Telugu: \u0C00-\u0C7F
  // - Bengali: \u0980-\u09FF
  // - And other common Indian scripts
  // Only reject actual special characters like @#$%&*() etc.
  const allowedCharRegex = /[a-zA-Z\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF]/g;
  
  // Count valid characters (letters from allowed scripts)
  const validChars = nameWithoutSpaces.match(allowedCharRegex) || [];
  
  // Count invalid special characters (like @#$%&*() etc.)
  // These are characters that are NOT in our allowed list
  const invalidChars = nameWithoutSpaces.replace(allowedCharRegex, "").split("").filter(c => c.trim() !== "");
  
  // If there are no valid letters at all, reject
  if (validChars.length === 0) {
    return { valid: false, error: getMessage(lang, "nameNoLetters") };
  }
  
  // Reject if more than 20% are invalid special characters
  if (invalidChars.length > nameWithoutSpaces.length * 0.2) {
    return { valid: false, error: getMessage(lang, "nameInvalidChars") };
  }
  
  return { valid: true };
};

const validateAadhaar = (aadhaar, lang = "en") => {
  const digits = aadhaar.replace(/\s+/g, "");
  if (!/^\d{12}$/.test(digits)) {
    if (digits.length === 0) {
      return { valid: false, error: getMessage(lang, "aadhaarEmpty") };
    }
    if (digits.length < 12 || digits.length > 12) {
      return { valid: false, error: getMessage(lang, "aadhaarLength", { length: digits.length }) };
    }
    if (!/^\d+$/.test(digits)) {
      return { valid: false, error: getMessage(lang, "aadhaarInvalid") };
    }
    return { valid: false, error: getMessage(lang, "aadhaarFormat") };
  }
  return { valid: true, value: digits };
};

const validateDOB = (dobInput, lang = "en") => {
  // Normalize separators
  const normalized = dobInput.replace(/[.\-]/g, "/");
  
  // Check format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = normalized.match(dateRegex);
  
  if (!match) {
    return { 
      valid: false, 
      error: getMessage(lang, "dobFormat")
    };
  }
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validate date range
  if (month < 1 || month > 12) {
    return { valid: false, error: getMessage(lang, "dobMonth") };
  }
  
  if (day < 1 || day > 31) {
    return { valid: false, error: getMessage(lang, "dobDay") };
  }
  
  // Check for reasonable year (not future, not too old)
  const currentYear = new Date().getFullYear();
  if (year > currentYear) {
    return { valid: false, error: getMessage(lang, "dobYearFuture") };
  }
  if (year < 1900) {
    return { valid: false, error: getMessage(lang, "dobYearOld") };
  }
  
  // Validate actual date (handle leap years, month days correctly)
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { valid: false, error: getMessage(lang, "dobInvalid") };
  }
  
  // Format with leading zeros
  const formattedDay = day.toString().padStart(2, "0");
  const formattedMonth = month.toString().padStart(2, "0");
  const formattedDOB = `${formattedDay}/${formattedMonth}/${year}`;
  
  return { valid: true, value: formattedDOB };
};

const validateLandReg = (landReg, lang = "en") => {
  if (!landReg || landReg.trim().length === 0) {
    return { valid: false, error: getMessage(lang, "landRegEmpty") };
  }
  if (landReg.trim().length < 3) {
    return { valid: false, error: getMessage(lang, "landRegShort") };
  }
  if (landReg.trim().length > 50) {
    return { valid: false, error: getMessage(lang, "landRegLong") };
  }
  return { valid: true, value: landReg.trim() };
};

const validateCity = (city, lang = "en") => {
  if (!city || city.trim().length === 0) {
    return { valid: false, error: getMessage(lang, "cityEmpty") };
  }
  if (city.trim().length < 2) {
    return { valid: false, error: getMessage(lang, "cityShort") };
  }
  return { valid: true, value: city.trim() };
};

const validateState = (state, lang = "en") => {
  if (!state || state.trim().length === 0) {
    return { valid: false, error: getMessage(lang, "stateEmpty") };
  }
  if (state.trim().length < 2) {
    return { valid: false, error: getMessage(lang, "stateShort") };
  }
  return { valid: true, value: state.trim() };
};

const validateReason = (reason, lang = "en") => {
  if (!reason || reason.trim().length === 0) {
    return { valid: false, error: getMessage(lang, "reasonEmpty") };
  }
  if (reason.trim().length < 5) {
    return { valid: false, error: getMessage(lang, "reasonShort") };
  }
  if (reason.trim().length > 500) {
    return { valid: false, error: getMessage(lang, "reasonLong") };
  }
  return { valid: true, value: reason.trim() };
};

const validateTotalLandArea = (input, lang = "en") => {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: getMessage(lang, "totalLandAreaEmpty") };
  }
  const cleaned = input.trim().replace(/,/g, "");
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, error: getMessage(lang, "totalLandAreaInvalid") };
  }
  if (value < 1) {
    return { valid: false, error: getMessage(lang, "totalLandAreaTooSmall") };
  }
  if (value > 10000000) {
    return { valid: false, error: getMessage(lang, "totalLandAreaTooLarge") };
  }
  return { valid: true, value: Math.round(value * 100) / 100 };
};

const buildConfirmationSummary = (data, lang) => {
  const summaries = {
    en: `✅ Please confirm the details:\n\nName: ${data.name}\nAadhaar: ${data.aadhar}\nDOB: ${data.dob}\nLand Reg: ${data.landReg}\nCity: ${data.city}\nState: ${data.state}\nTotal Farm Area: ${data.totalLandArea} sq m\nReason: ${data.reason}\n\nReply 'yes' to submit or 'no' to restart.`,
    hi: `✅ कृपया विवरण की पुष्टि करें:\n\nनाम: ${data.name}\nआधार: ${data.aadhar}\nजन्म तिथि: ${data.dob}\nभूमि पंजीकरण: ${data.landReg}\nशहर: ${data.city}\nराज्य: ${data.state}\nकुल खेत क्षेत्र: ${data.totalLandArea} वर्ग मीटर\nकारण: ${data.reason}\n\nसबमिट करने के लिए 'yes' या पुनः आरंभ करने के लिए 'no' लिखें।`,
    te: `✅ దయచేసి వివరాలను నిర్ధారించండి:\n\nపేరు: ${data.name}\nఆధార్: ${data.aadhar}\nజన్మ తేదీ: ${data.dob}\nభూమి నమోదు: ${data.landReg}\nనగరం: ${data.city}\nరాష్ట్రం: ${data.state}\nమొత్తం పొలం విస్తీర్ణం: ${data.totalLandArea} చ.మీ\nకారణం: ${data.reason}\n\nసమర్పించడానికి 'yes' లేదా మళ్లీ ప్రారంభించడానికి 'no' రాయండి.`,
  };
  return summaries[lang] || summaries.en;
};

export const handleIncomingMessage = async (data) => {
  const from = data.From;
  const body = (data.Body || "").trim();
  const normalized = body.toLowerCase();

  if (!sessions[from]) resetSession(from);
  const session = sessions[from];

  // Quit or restart commands (works anytime)
  if (["quit", "exit", "restart", "start over"].includes(normalized)) {
    const lang = session?.preferredLanguage || "en";
    const quitMessages = {
      en: "👋 Session ended. Type 'hi' to start again.",
      hi: "👋 सत्र समाप्त। फिर से शुरू करने के लिए 'hi' लिखें।",
      te: "👋 సెషన్ ముగిసింది. మళ్లీ ప్రారంభించడానికి 'hi' రాయండి.",
    };
    await sendMessage(from, quitMessages[lang] || quitMessages.en);
    delete sessions[from];
    return;
  }

  // Conversational AI mode (after onboarding)
  if (session.mode === "chat") {
    try {
      // Load farmer profile for location and language
      let farmer = null;
      if (session.data?.aadhar) {
        farmer = await Farmer.findOne({ aadhar: session.data.aadhar }).lean();
        if (farmer && !session.preferredLanguage) {
          session.preferredLanguage = farmer.preferredLanguage;
        }
      }
      
      // Handle voice notes using Sarvam AI
      let text = body;
      
      // Get preferred language from session or farmer profile (user's choice takes priority)
      let selectedLanguage = session.preferredLanguage;
      if (!selectedLanguage && farmer?.preferredLanguage) {
        selectedLanguage = farmer.preferredLanguage;
        session.preferredLanguage = selectedLanguage; // Cache it
      }
      selectedLanguage = selectedLanguage || "en";
      
      const numMedia = parseInt(data.NumMedia || "0", 10);
      if (numMedia > 0 && data.MediaUrl0) {
        console.log("🎤 Voice note detected, transcribing with Sarvam AI...");
        try {
          const transcription = await transcribeAudio(data.MediaUrl0);
          if (transcription.text && transcription.text.trim()) {
            text = transcription.text;
            const detectedLang = transcription.language;
            console.log(`✅ Transcribed: "${text.substring(0, 50)}..." (Detected: ${detectedLang}, Using: ${selectedLanguage})`);
            
            // IMPORTANT: Do NOT override user's preferred language with detected language
            // The user chose their language during registration, respect that choice
            // Only use detected language if user hasn't set a preference yet (shouldn't happen after registration)
            if (!session.preferredLanguage && !farmer?.preferredLanguage && detectedLang && detectedLang !== "unknown") {
              // Only set if no preference exists (edge case for unregistered users)
              session.preferredLanguage = detectedLang;
              selectedLanguage = detectedLang;
              console.log(`ℹ️ No preferred language set, using detected: ${detectedLang}`);
            } else {
              console.log(`✅ Using user's preferred language: ${selectedLanguage} (ignoring detected: ${detectedLang})`);
            }
          } else {
            const langMessages = {
              en: "Sorry, I couldn't understand the voice note. Please try typing your question.",
              hi: "क्षमा करें, मैं वॉइस नोट समझ नहीं सका। कृपया अपना प्रश्न टाइप करके भेजें।",
              te: "క్షమించండి, నేను వాయిస్ నోట్ అర్థం చేసుకోలేదు. దయచేసి మీ ప్రశ్నను టైప్ చేసి పంపండి.",
            };
            await sendMessage(from, langMessages[session.preferredLanguage] || langMessages.en);
            return;
          }
        } catch (err) {
          console.error("❌ Voice transcription error:", err?.message || err);
          const langMessages = {
            en: "Sorry, I couldn't process the voice note. Please type your question instead.",
            hi: "क्षमा करें, मैं वॉइस नोट प्रोसेस नहीं कर सका। कृपया अपना प्रश्न टाइप करें।",
            te: "క్షమించండి, నేను వాయిస్ నోట్ ప్రాసెస్ చేయలేకపోయాను. దయచేసి మీ ప్రశ్నను టైప్ చేయండి.",
          };
          await sendMessage(from, langMessages[session.preferredLanguage] || langMessages.en);
          return;
        }
      }

      if (!text || !text.trim()) {
        // No text message
        const langMessages = {
          en: "Please share your question so I can help.",
          hi: "कृपया अपना प्रश्न साझा करें ताकि मैं मदद कर सकूं।",
          te: "దయచేసి మీ ప్రశ్నను పంచుకోండి తద్వారా నేను సహాయం చేయగలను।",
        };
        await sendMessage(from, langMessages[session.preferredLanguage] || langMessages.en);
        return;
      }

      if (!process.env.GROQ_API_KEY) {
        const langMessages = {
          en: "AI assistant is not configured yet. Please contact support.",
          hi: "AI सहायक अभी तक कॉन्फ़िगर नहीं किया गया है। कृपया सपोर्ट से संपर्क करें।",
          te: "AI సహాయకుడు ఇంకా కాన్ఫిగర్ చేయబడలేదు. దయచేసి మద్దతుకు సంప్రదించండి.",
        };
        await sendMessage(from, langMessages[session.preferredLanguage] || langMessages.en);
        return;
      }

      // Fetch agro-weather data using farmer's location
      let agroData = null;
      try {
        let lat = null;
        let lon = null;
        
        // Try to get coordinates from farmer's city and state
        if (farmer?.city && farmer?.state) {
          const coords = await getCoordinates(farmer.city, farmer.state);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          } else {
            // Fallback to state default coordinates
            const defaultCoords = getDefaultStateCoordinates(farmer.state);
            lat = defaultCoords.lat;
            lon = defaultCoords.lon;
          }
        } else if (farmer?.state) {
          // Use state default if city not available
          const defaultCoords = getDefaultStateCoordinates(farmer.state);
          lat = defaultCoords.lat;
          lon = defaultCoords.lon;
        }
        
        if (lat && lon) {
          console.log(`🌤️ Fetching weather data for: ${farmer.city || farmer.state} (${lat}, ${lon})`);
          agroData = await getAgroData(lat, lon);
          if (agroData) {
            console.log(`✅ Weather data: Temp ${agroData.temp}°C, Soil Moisture ${agroData.soil_moisture}%`);
          }
        } else {
          console.warn("⚠️ No location data available for weather fetch");
        }
      } catch (err) {
        console.warn("⚠️ Agro data fetch failed:", err?.message || err);
      }

      // selectedLanguage is already set above (user's preferred language from registration)
      // It should never be changed by voice note detection - user's choice is respected
      // Only update if it wasn't set earlier (shouldn't happen after registration)
      if (!selectedLanguage) {
        if (farmer?.preferredLanguage) {
          selectedLanguage = farmer.preferredLanguage;
          session.preferredLanguage = selectedLanguage; // Cache it
        } else if (session.data?.preferredLanguage) {
          selectedLanguage = session.data.preferredLanguage;
          session.preferredLanguage = selectedLanguage; // Cache it
        }
      }
      selectedLanguage = selectedLanguage || "en";
      
      console.log(`🌐 Generating response in user's preferred language: ${selectedLanguage} for user: ${from}`);
      const aiReply = await generateResponse(text, agroData || {}, selectedLanguage);

      session.history = [
        ...(session.history || []),
        { role: "farmer", text },
        { role: "bot", text: aiReply },
      ].slice(-10);

      await sendMessage(from, aiReply);
    } catch (err) {
      console.error("AI conversation error:", err);
      const lang = session.preferredLanguage || "en";
      
      // Check if it's a quota/API error
      const isQuotaError = err?.message?.includes("quota") || 
                           err?.message?.includes("GROQ_API_FAILED") ||
                           err?.message?.includes("rate limit") ||
                           err?.message?.includes("Unable to generate");
      
      const errorMessages = {
        en: isQuotaError 
          ? "⚠️ AI service is currently unavailable due to API quota limits. Please try again later or contact support."
          : "⚠️ I'm having trouble answering right now. Please try again later or contact your local agriculture office.",
        hi: isQuotaError
          ? "⚠️ API कोटा सीमा के कारण AI सेवा वर्तमान में अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें या सपोर्ट से संपर्क करें।"
          : "⚠️ अभी मुझे जवाब देने में परेशानी हो रही है। कृपया बाद में पुनः प्रयास करें या अपने स्थानीय कृषि कार्यालय से संपर्क करें।",
        te: isQuotaError
          ? "⚠️ API కోటా పరిమితుల కారణంగా AI సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి లేదా మద్దతుకు సంప్రదించండి."
          : "⚠️ నేను ఇప్పుడు సమాధానం ఇవ్వడంలో సమస్యను ఎదుర్కొంటున్నాను. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి లేదా మీ స్థానిక వ్యవసాయ కార్యాలయాన్ని సంప్రదించండి.",
      };
      await sendMessage(from, errorMessages[lang] || errorMessages.en);
    }
    return;
  }

  try {
    switch (session.step) {
      case 0: {
        if (["hi", "hello", "hey", "hola"].includes(normalized)) {
          await sendMessage(
            from,
            "🌾 Welcome to KisaanSuraksha WhatsApp portal!\n\nPlease select your preferred language:\n1. English\n2. Hindi (हिंदी)\n3. Telugu (తెలుగు)\n\nReply with 1, 2, or 3"
          );
          session.step = 0.5; // Language selection step
        } else {
          const lang = session?.preferredLanguage || "en";
          const startMessages = {
            en: "Say 'hi' to begin your registration.",
            hi: "अपना पंजीकरण शुरू करने के लिए 'hi' लिखें।",
            te: "మీ నమోదును ప్రారంభించడానికి 'hi' రాయండి.",
          };
          await sendMessage(from, startMessages[lang] || startMessages.en);
        }
        break;
      }

      case 0.5: {
        // Language selection
        const langChoice = normalized.trim();
        let selectedLang = null;
        let langName = "";
        let welcomeMsg = "";

        if (langChoice === "1" || langChoice === "english" || langChoice === "en") {
          selectedLang = "en";
          langName = "English";
          welcomeMsg = "Great! We'll continue in English.\n\nLet's get you registered.\nWhat's your full name?";
        } else if (langChoice === "2" || langChoice === "hindi" || langChoice === "hi" || langChoice === "हिंदी") {
          selectedLang = "hi";
          langName = "Hindi";
          welcomeMsg = "बढ़िया! हम हिंदी में जारी रखेंगे।\n\nआइए आपका पंजीकरण करते हैं।\nआपका पूरा नाम क्या है?";
        } else if (langChoice === "3" || langChoice === "telugu" || langChoice === "te" || langChoice === "తెలుగు") {
          selectedLang = "te";
          langName = "Telugu";
          welcomeMsg = "మంచిది! మేము తెలుగులో కొనసాగిస్తాము.\n\nమీ నమోదు చేద్దాం.\nమీ పూర్తి పేరు ఏమిటి?";
        } else {
          await sendMessage(
            from,
            "Invalid choice. Please select your preferred language:\n1. English\n2. Hindi (हिंदी)\n3. Telugu (తెలుగు)\n\nReply with 1, 2, or 3"
          );
          break;
        }

        session.preferredLanguage = selectedLang;
        session.data.preferredLanguage = selectedLang;
        console.log(`✅ Language selected: ${langName} (${selectedLang})`);
        await sendMessage(from, welcomeMsg);
        session.step = 1;
        break;
      }

      case 1: {
        // Validate name
        const lang = session.preferredLanguage || "en";
        const nameValidation = validateName(body, lang);
        if (!nameValidation.valid) {
          await sendMessage(from, `❗ ${nameValidation.error}`);
          // Stay on step 1 to ask again
          break;
        }
        session.data.name = body.trim();
        await sendMessage(from, getMessage(lang, "aadhaarPrompt"));
        session.step = 2;
        break;
      }

      case 2: {
        // Validate Aadhaar
        const lang = session.preferredLanguage || "en";
        const aadhaarValidation = validateAadhaar(body, lang);
        if (!aadhaarValidation.valid) {
          await sendMessage(from, `❗ ${aadhaarValidation.error}`);
          // Stay on step 2 to ask again
          break;
        }
        session.data.aadhar = aadhaarValidation.value;
        await sendMessage(from, getMessage(lang, "dobPrompt"));
        session.step = 3;
        break;
      }

      case 3: {
        // Validate DOB
        const lang = session.preferredLanguage || "en";
        const dobValidation = validateDOB(body, lang);
        if (!dobValidation.valid) {
          await sendMessage(from, `❗ ${dobValidation.error}`);
          // Stay on step 3 to ask again
          break;
        }
        session.data.dob = dobValidation.value;
        await sendMessage(from, getMessage(lang, "landRegPrompt"));
        session.step = 4;
        break;
      }

      case 4: {
        // Validate Land Registration
        const lang = session.preferredLanguage || "en";
        const landRegValidation = validateLandReg(body, lang);
        if (!landRegValidation.valid) {
          await sendMessage(from, `❗ ${landRegValidation.error}`);
          // Stay on step 4 to ask again
          break;
        }
        session.data.landReg = landRegValidation.value;
        await sendMessage(from, getMessage(lang, "cityPrompt"));
        session.step = 5;
        break;
      }

      case 5: {
        // Validate City
        const lang = session.preferredLanguage || "en";
        const cityValidation = validateCity(body, lang);
        if (!cityValidation.valid) {
          await sendMessage(from, `❗ ${cityValidation.error}`);
          // Stay on step 5 to ask again
          break;
        }
        session.data.city = cityValidation.value;
        await sendMessage(from, getMessage(lang, "statePrompt"));
        session.step = 6;
        break;
      }

      case 6: {
        // Validate State
        const lang = session.preferredLanguage || "en";
        const stateValidation = validateState(body, lang);
        if (!stateValidation.valid) {
          await sendMessage(from, `❗ ${stateValidation.error}`);
          // Stay on step 6 to ask again
          break;
        }
        session.data.state = stateValidation.value;
        await sendMessage(from, getMessage(lang, "reasonPrompt"));
        session.step = 7;
        break;
      }

      case 7: {
        // Validate Reason
        const lang = session.preferredLanguage || "en";
        const reasonValidation = validateReason(body, lang);
        if (!reasonValidation.valid) {
          await sendMessage(from, `❗ ${reasonValidation.error}`);
          // Stay on step 7 to ask again
          break;
        }
        session.data.reason = reasonValidation.value;
        await sendMessage(from, getMessage(lang, "totalLandAreaPrompt"));
        session.step = 8;
        break;
      }

      case 8: {
        const lang = session.preferredLanguage || "en";
        const landAreaValidation = validateTotalLandArea(body, lang);
        if (!landAreaValidation.valid) {
          await sendMessage(from, `❗ ${landAreaValidation.error}`);
          break;
        }
        session.data.totalLandArea = landAreaValidation.value;
        await sendMessage(from, buildConfirmationSummary(session.data, lang));
        session.step = 9;
        break;
      }

      case 9: {
        const lang = session.preferredLanguage || "en";
        // Accept yes/no in multiple languages
        const yesWords = {
          en: ["yes", "y", "correct", "ok"],
          hi: ["yes", "y", "हाँ", "सही", "ठीक", "ok"],
          te: ["yes", "y", "అవును", "సరైనది", "ok"],
        };
        const noWords = {
          en: ["no", "n", "wrong", "incorrect"],
          hi: ["no", "n", "नहीं", "गलत"],
          te: ["no", "n", "కాదు", "తప్పు"],
        };
        
        const yesList = yesWords[lang] || yesWords.en;
        const noList = noWords[lang] || noWords.en;
        
        if (yesList.includes(normalized)) {
          try {
            const { aadhar, name, dob, landReg, city, state, reason, totalLandArea, preferredLanguage } = session.data;
            const lang = preferredLanguage || session.preferredLanguage || "en";

            let farmer = await Farmer.findOne({ aadhar });
            const langMessages = {
              en: {
                updated: "✅ Your details are updated successfully. Thank you!",
                registered: "🎉 Registration complete! You're now part of KisaanSuraksha.",
                ready: "🤖 I can now answer your crop questions! Ask me anything about compensation, recovery steps, or future crop planning."
              },
              hi: {
                updated: "✅ आपकी जानकारी सफलतापूर्वक अपडेट की गई। धन्यवाद!",
                registered: "🎉 पंजीकरण पूर्ण! अब आप किसानसुरक्षा का हिस्सा हैं।",
                ready: "🤖 अब मैं आपके फसल के सवालों के जवाब दे सकता हूं! मुझसे क्षतिपूर्ति, रिकवरी के कदम, या भविष्य की फसल योजना के बारे में कुछ भी पूछें।"
              },
              te: {
                updated: "✅ మీ వివరాలు విజయవంతంగా నవీకరించబడ్డాయి. ధన్యవాదాలు!",
                registered: "🎉 నమోదు పూర్తయింది! మీరు ఇప్పుడు కిసాన్ సురక్షా భాగం.",
                ready: "🤖 నేను ఇప్పుడు మీ పంట ప్రశ్నలకు సమాధానం ఇవ్వగలను! నష్టపరిహారం, రికవరీ దశలు లేదా భవిష్యత్ పంట ప్రణాళిక గురించి ఏదైనా అడగండి."
              }
            };

            if (farmer) {
              farmer.set({ name, dob, landReg, city, state, reason, totalLandArea, preferredLanguage: lang });
              await farmer.save();
              await sendMessage(from, langMessages[lang]?.updated || langMessages.en.updated);
            } else {
              farmer = new Farmer({ aadhar, name, dob, landReg, city, state, reason, totalLandArea, preferredLanguage: lang });
              await farmer.save();
              await sendMessage(from, langMessages[lang]?.registered || langMessages.en.registered);
            }

            await sendMessage(from, langMessages[lang]?.ready || langMessages.en.ready);
            session.mode = "chat";
            session.step = null;
            session.history = [];
            session.preferredLanguage = lang; // Ensure language is set in session
            session.data = {
              ...session.data,
              name: farmer.name,
              aadhar: farmer.aadhar,
              dob: farmer.dob,
              landReg: farmer.landReg,
              city: farmer.city,
              state: farmer.state,
              reason: farmer.reason,
              totalLandArea: farmer.totalLandArea,
              preferredLanguage: lang,
            };
            console.log(`✅ Chat mode activated with language: ${lang}`);
          } catch (dbError) {
            console.error("Database error during registration:", dbError);
            const errorLang = session.preferredLanguage || "en";
            // Check if it's a duplicate Aadhaar error
            if (dbError.code === 11000 || dbError.message?.includes("duplicate")) {
              await sendMessage(from, getMessage(errorLang, "dbDuplicate"));
            } else {
              await sendMessage(from, getMessage(errorLang, "dbError"));
            }
            // Stay on confirmation step so user can try again or restart
          }
        } else if (noList.includes(normalized)) {
          const restartMessages = {
            en: "No worries. Let's start over. Say 'hi' to begin again.",
            hi: "कोई बात नहीं। चलिए फिर से शुरू करते हैं। फिर से शुरू करने के लिए 'hi' लिखें।",
            te: "పర్వాలేదు. మళ్లీ ప్రారంభిద్దాం. మళ్లీ ప్రారంభించడానికి 'hi' రాయండి.",
          };
          await sendMessage(from, restartMessages[lang] || restartMessages.en);
          delete sessions[from];
        } else {
          const invalidMessages = {
            en: "❗ Please reply with 'yes' to submit or 'no' to restart.",
            hi: "❗ कृपया सबमिट करने के लिए 'yes' या पुनः आरंभ करने के लिए 'no' लिखें।",
            te: "❗ దయచేసి సమర్పించడానికి 'yes' లేదా మళ్లీ ప్రారంభించడానికి 'no' రాయండి.",
          };
          await sendMessage(from, invalidMessages[lang] || invalidMessages.en);
          // Stay on confirmation step to ask again
        }
        break;
      }

      default: {
        const lang = session.preferredLanguage || "en";
        await sendMessage(from, getMessage(lang, "somethingWrong"));
        delete sessions[from];
      }
    }
  } catch (err) {
    console.error("Error handling message:", err);
    if (isBotWhatsAppNumber(from)) {
      return;
    }
    const lang = session?.preferredLanguage || "en";
    const errorMessages = {
      en: "⚠️ Sorry, something went wrong. Please try again later.",
      hi: "⚠️ क्षमा करें, कुछ गलत हो गया। कृपया बाद में पुनः प्रयास करें।",
      te: "⚠️ క్షమించండి, ఏదో తప్పు జరిగింది. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.",
    };
    try {
      await sendMessage(from, errorMessages[lang] || errorMessages.en);
    } catch (sendErr) {
      console.error("Failed to send error reply:", sendErr?.message || sendErr);
    }
    delete sessions[from];
  }
};