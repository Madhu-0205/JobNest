const fs = require('fs');
const en = JSON.parse(fs.readFileSync('locales/en.json'));
const te = JSON.parse(fs.readFileSync('locales/te.json'));
const hi = JSON.parse(fs.readFileSync('locales/hi.json'));
const ta = JSON.parse(fs.readFileSync('locales/ta.json'));

function checkCoverage(dict, name) {
    let missing = 0;
    let untranslated = 0;
    const total = Object.keys(en).length;
    for (const k in en) {
        if (!dict[k]) {
            missing++;
        } else if (dict[k] === en[k] || dict[k].startsWith('[')) {
            untranslated++;
        }
    }
    const translated = total - missing - untranslated;
    console.log(`${name}: ${translated}/${total} (${((translated/total)*100).toFixed(2)}%) translated. Missing: ${missing}, Untranslated: ${untranslated}`);
}

checkCoverage(te, 'te');
checkCoverage(hi, 'hi');
checkCoverage(ta, 'ta');
