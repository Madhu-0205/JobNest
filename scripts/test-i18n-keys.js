const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

let hasErrors = false;

walkDir(path.join(__dirname, '../components'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match t("...") or t('...') or i18nT("...") or i18nT('...')
    const regex = /\b(?:t|i18nT)\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      if (/\s/.test(key) && key.length > 15) {
        console.error(`❌ [${path.basename(filePath)}] English sentence used as key: "${key}"`);
        hasErrors = true;
      }
    }
  }
});

walkDir(path.join(__dirname, '../app'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /\b(?:t|i18nT)\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      if (/\s/.test(key) && key.length > 15) {
        console.error(`❌ [${path.basename(filePath)}] English sentence used as key: "${key}"`);
        hasErrors = true;
      }
    }
  }
});

if (hasErrors) {
  process.exit(1);
} else {
  console.info("✅ No raw English sentences found in t() calls.");
}
