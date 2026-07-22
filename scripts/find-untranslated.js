const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not available? We can use recursive fs.readdir

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') {
        // console.warn('Ignoring ' + dirFile);
      }
    }
  });
  return filelist;
}

const targetDirs = ['app', 'components', 'features', 'providers', 'hooks'];
let allFiles = [];
targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        allFiles = allFiles.concat(walkSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts')));
    }
});

let remaining = [];

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Naive heuristic for JSX hardcoded text (doesn't cover everything, but good for a start)
        // Let's find tags like >Some Text<
        const matches = [...trimmed.matchAll(/>([^<{}]+)</g)];
        matches.forEach(match => {
            const text = match[1].trim();
            if (text.length > 0 && /[a-zA-Z]/.test(text)) {
                // Check if it's already translated
                if (!text.includes('t(')) {
                    remaining.push({ file, line: index + 1, text, fullLine: trimmed });
                }
            }
        });
        
        // Let's find placeholders
        const placeholderMatches = [...trimmed.matchAll(/placeholder="([^"]+)"/g)];
        placeholderMatches.forEach(match => {
            const text = match[1].trim();
            if (text.length > 0 && /[a-zA-Z]/.test(text)) {
                remaining.push({ file, line: index + 1, text, fullLine: trimmed });
            }
        });
    });
});

console.log(`Found ${remaining.length} untranslated strings.`);
if (remaining.length > 0) {
    console.log(remaining.slice(0, 50));
}
