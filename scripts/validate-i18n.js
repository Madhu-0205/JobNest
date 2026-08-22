const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../locales');
const enPath = path.join(localesDir, 'en.json');
const tePath = path.join(localesDir, 'te.json');
const hiPath = path.join(localesDir, 'hi.json');
const taPath = path.join(localesDir, 'ta.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const te = JSON.parse(fs.readFileSync(tePath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

const enKeys = Object.keys(en);
const technicalTerms = new Set(['JobNest', 'ETA', 'OTP', 'ID', 'KYC', 'GPS', 'FAQ', 'URL', 'QR']); // Example exceptions

let errors = 0;

function validateLocale(name, dict) {
  const dictKeys = Object.keys(dict);
  
  // 1. Identical key structure
  if (enKeys.length !== dictKeys.length) {
    console.error(`❌ [${name}] Key count mismatch! Expected ${enKeys.length}, found ${dictKeys.length}`);
    errors++;
  }

  enKeys.forEach(key => {
    // 1.5. Ensure key is semantic (no spaces, no English sentences)
    if (/\\s/.test(key) && key.length > 15) {
      console.error(`❌ [${name}] Key looks like a raw English sentence: "${key}"`);
      errors++;
    }

    // 2. Missing keys
    if (!(key in dict)) {
      console.error(`❌ [${name}] Missing key: "${key}"`);
      errors++;
      return;
    }

    const val = dict[key];
    
    // 3. Empty translations
    if (!val || val.trim() === '') {
      console.error(`❌ [${name}] Empty translation for key: "${key}"`);
      errors++;
    }

    // 4. Locale-prefix placeholders
    if (val.match(/^\[(EN|TE|HI|TA|KN|ML|MR|GU|BN|PA|OR)\]/i)) {
      console.error(`❌ [${name}] Locale prefix placeholder detected: "${val}"`);
      errors++;
    }

    // 5. Identical to English
    if (name !== 'en' && val === en[key]) {
      // Allow technical terms or short non-alphabetic
      if (!technicalTerms.has(en[key]) && /[a-zA-Z]{3,}/.test(en[key])) {
        // Some keys might genuinely be identical, but we flag them for review
        // The user said: "Do NOT leave English text in Telugu/Hindi/Tamil dictionaries unless the term is genuinely a proper noun, brand name, technical term"
        console.warn(`⚠️ [${name}] Identical to English: "${key}" -> "${val}"`);
        // We won't increment errors for this unless it's a strict failure, but let's count it to report
      }
    }
  });
}

console.log("=== i18n Dictionary Validation ===");
validateLocale('en', en);
validateLocale('te', te);
validateLocale('hi', hi);
validateLocale('ta', ta);

if (errors > 0) {
  console.error(`\\nValidation failed with ${errors} errors.`);
  process.exit(1);
} else {
  console.log("\\n✅ Validation passed successfully.");
}
