const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../locales');
const extractedStrings = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_strings.json'), 'utf-8'));

const enPath = path.join(localesDir, 'en.json');
let enDict = {};
if (fs.existsSync(enPath)) {
    enDict = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
}

extractedStrings.forEach(str => {
    if (!enDict[str]) {
        enDict[str] = str;
    }
});

// Save en.json
fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));

// Generate other locales
const locales = ['hi', 'te', 'ta'];
const prefixMap = {
    'hi': '[HI]',
    'te': '[TE]',
    'ta': '[TA]',
    'kn': '[KN]',
    'ml': '[ML]',
    'mr': '[MR]',
    'gu': '[GU]',
    'bn': '[BN]',
    'pa': '[PA]',
    'or': '[OR]'
};

locales.forEach(loc => {
    const locPath = path.join(localesDir, `${loc}.json`);
    let locDict = {};
    if (fs.existsSync(locPath)) {
        locDict = JSON.parse(fs.readFileSync(locPath, 'utf-8'));
    }

    Object.keys(enDict).forEach(key => {
        // If it's already translated, maybe prefix it?
        // Let's just prefix the english value to ensure we can see it change
        locDict[key] = `${prefixMap[loc]} ${enDict[key]}`;
    });

    fs.writeFileSync(locPath, JSON.stringify(locDict, null, 2));
});

console.log("Successfully generated all locale files with prefixes for verification.");
