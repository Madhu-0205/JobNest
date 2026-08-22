const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function generateKey(str) {
  // Convert "Some string with spaces & symbols!" to "someStringWithSpacesSymbols"
  const cleaned = str.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 8); // Take first 8 words
  if (words.length === 0) return 'key_' + Math.random().toString(36).substring(7);
  
  const camelCase = words.map((w, i) => {
    const lw = w.toLowerCase();
    if (i === 0) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join('');
  
  return camelCase;
}

const enJsonPath = path.join(__dirname, '../locales/en.json');
let enTranslations = {};
if (fs.existsSync(enJsonPath)) {
  enTranslations = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
}

const targetDirs = ['app', 'components'];

targetDirs.forEach(target => {
  const dirPath = path.join(__dirname, '..', target);
  // Just use target as namespace or general 'common' for components
  const namespace = target === 'components' ? 'common' : 'app';
  
  walkDir(dirPath, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const regex = /(i18nT)\(\s*['"]([^'"]+)['"]/g;
      
      let modified = false;
      content = content.replace(regex, (match, funcName, rawString) => {
        // Skip if it looks like a semantic key already e.g. "worker.someKey" or no spaces and short
        if (!/\s/.test(rawString) && rawString.includes('.')) {
          return match;
        }
        if (!/\s/.test(rawString) && rawString.length <= 15) {
          return match;
        }
        
        const semanticKey = namespace + '.' + generateKey(rawString);
        
        // Add to translations
        if (!enTranslations[namespace]) {
          enTranslations[namespace] = {};
        }
        enTranslations[namespace][semanticKey.split('.')[1]] = rawString;
        
        modified = true;
        return `${funcName}("${semanticKey}"`;
      });
      
      // Also check if any `t("...")` were missed (some use `t` instead of `i18nT`)
      const regexT = /\b(t)\(\s*['"]([^'"]+)['"]/g;
      content = content.replace(regexT, (match, funcName, rawString) => {
        if (!/\s/.test(rawString) && rawString.includes('.')) {
          return match;
        }
        if (!/\s/.test(rawString) && rawString.length <= 15) {
          return match;
        }
        
        const semanticKey = namespace + '.' + generateKey(rawString);
        if (!enTranslations[namespace]) {
          enTranslations[namespace] = {};
        }
        enTranslations[namespace][semanticKey.split('.')[1]] = rawString;
        
        modified = true;
        return `${funcName}("${semanticKey}"`;
      });

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  });
});

fs.writeFileSync(enJsonPath, JSON.stringify(enTranslations, null, 2), 'utf8');
console.log('Done migrating keys and updated locales/en.json');
