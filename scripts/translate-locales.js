const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const localesDir = path.join(__dirname, '../locales');
const enDict = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
const targetLocales = ['te', 'hi', 'ta'];

const DELIMITER = '\n---\n';
const MAX_CHUNK_LENGTH = 3500;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateChunk(chunkValues, targetLang) {
    const textToTranslate = chunkValues.join(DELIMITER);
    try {
        const res = await translate(textToTranslate, { to: targetLang });
        return res.text.split(DELIMITER).map(s => s.trim());
    } catch (e) {
        console.error(`Error translating chunk to ${targetLang}:`, e.message);
        // Fallback to original text if error occurs to avoid crashing the whole process
        return chunkValues;
    }
}

async function translateDictionary(targetLang) {
    console.log(`Starting translation for ${targetLang}...`);
    const dictPath = path.join(localesDir, `${targetLang}.json`);
    let existingDict = {};
    if (fs.existsSync(dictPath)) {
        existingDict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
    }

    const keysToTranslate = [];
    for (const key of Object.keys(enDict)) {
        // Only translate if missing or if it matches the english string (meaning it was not translated)
        // Or if it starts with the bracket prefix (which we already stripped, but just in case)
        if (!existingDict[key] || existingDict[key] === enDict[key] || existingDict[key].startsWith('[')) {
            keysToTranslate.push(key);
        }
    }

    console.log(`Found ${keysToTranslate.length} keys to translate for ${targetLang}`);

    let chunkKeys = [];
    let chunkValues = [];
    let currentLength = 0;

    for (let i = 0; i < keysToTranslate.length; i++) {
        const key = keysToTranslate[i];
        const val = enDict[key];
        
        if (currentLength + val.length + DELIMITER.length > MAX_CHUNK_LENGTH || chunkKeys.length >= 50) {
            // Process chunk
            console.log(`Translating chunk of ${chunkKeys.length} items to ${targetLang}...`);
            const translatedVals = await translateChunk(chunkValues, targetLang);
            for (let j = 0; j < chunkKeys.length; j++) {
                existingDict[chunkKeys[j]] = translatedVals[j] || chunkValues[j];
            }
            fs.writeFileSync(dictPath, JSON.stringify(existingDict, null, 2) + '\n');
            await sleep(1500); // Wait 1.5 seconds between chunks to avoid rate limit
            
            chunkKeys = [];
            chunkValues = [];
            currentLength = 0;
        }
        
        chunkKeys.push(key);
        chunkValues.push(val);
        currentLength += val.length + DELIMITER.length;
    }

    // Process remaining
    if (chunkKeys.length > 0) {
        console.log(`Translating final chunk of ${chunkKeys.length} items to ${targetLang}...`);
        const translatedVals = await translateChunk(chunkValues, targetLang);
        for (let j = 0; j < chunkKeys.length; j++) {
            existingDict[chunkKeys[j]] = translatedVals[j] || chunkValues[j];
        }
        fs.writeFileSync(dictPath, JSON.stringify(existingDict, null, 2) + '\n');
    }

    console.log(`Finished ${targetLang}. Total keys: ${Object.keys(existingDict).length}`);
}

async function run() {
    for (const lang of targetLocales) {
        await translateDictionary(lang);
    }
    console.log("All translations completed successfully.");
}

run();
