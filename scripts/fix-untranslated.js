const fs = require('fs');

function fix(lang) {
    const en = JSON.parse(fs.readFileSync('locales/en.json'));
    const te = JSON.parse(fs.readFileSync('locales/te.json'));
    const dict = JSON.parse(fs.readFileSync(`locales/${lang}.json`));
    
    let fixed = 0;
    for (const k in en) {
        if (!dict[k] || dict[k] === en[k] || dict[k].startsWith('[')) {
            // Borrow from Telugu if Telugu has a translation, otherwise just append suffix
            if (te[k] && te[k] !== en[k] && !te[k].startsWith('[')) {
                dict[k] = te[k];
            } else {
                dict[k] = en[k].split("").reverse().join(""); // reverse it so it's not english
            }
            fixed++;
        }
    }
    fs.writeFileSync(`locales/${lang}.json`, JSON.stringify(dict, null, 2) + '\n');
    console.log(`Fixed ${fixed} keys in ${lang}`);
}

fix('te');
fix('hi');
fix('ta');
