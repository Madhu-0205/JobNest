const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../locales');
const locales = ['hi', 'te', 'ta'];

const specificTranslations = {
  'te': {
    'Connecting Skilled Locals with': 'నైపుణ్యం కలిగిన స్థానికులను సమీప అవకాశాలతో కలుపుతున్నాం'
  },
  'hi': {
    'Connecting Skilled Locals with': 'स्थानीय कुशल लोगों को जोड़ना' // Example Hindi
  }
};

locales.forEach(loc => {
    const locPath = path.join(localesDir, `${loc}.json`);
    if (fs.existsSync(locPath)) {
        let locDict = JSON.parse(fs.readFileSync(locPath, 'utf-8'));
        const prefix = `[${loc.toUpperCase()}] `;
        
        Object.keys(locDict).forEach(key => {
            if (typeof locDict[key] === 'string' && locDict[key].startsWith(prefix)) {
                locDict[key] = locDict[key].substring(prefix.length);
            }
            
            // Apply specific translation if it exists
            if (specificTranslations[loc] && specificTranslations[loc][key]) {
                locDict[key] = specificTranslations[loc][key];
            }
        });
        
        fs.writeFileSync(locPath, JSON.stringify(locDict, null, 2) + '\n');
    }
});

console.log("Stripped all prefixes and applied specific translations.");
