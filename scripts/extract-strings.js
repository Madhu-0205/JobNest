const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {}
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

let extractedStrings = new Set();
let failures = 0;

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    try {
        const ast = parser.parse(content, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });

        traverse(ast, {
            JSXText(path) {
                const text = path.node.value.trim();
                if (text && /[a-zA-Z]/.test(text) && !text.includes('{') && !text.includes('}')) {
                    extractedStrings.add(text);
                }
            },
            JSXAttribute(path) {
                if (path.node.name && ['placeholder', 'title', 'alt', 'label', 'aria-label'].includes(path.node.name.name)) {
                    if (path.node.value && path.node.value.type === 'StringLiteral') {
                        const text = path.node.value.value.trim();
                        if (text && /[a-zA-Z]/.test(text)) {
                            extractedStrings.add(text);
                        }
                    }
                }
            }
        });
    } catch (e) {
        failures++;
    }
});

console.log(`Successfully extracted ${extractedStrings.size} unique strings from ${allFiles.length - failures} files.`);
fs.writeFileSync('scripts/extracted-strings.json', JSON.stringify(Array.from(extractedStrings), null, 2));
