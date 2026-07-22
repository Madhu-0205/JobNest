const fs = require('fs');
const file = 'app/onboarding/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/min-h-\[480px\]/g, 'min-h-120');
content = content.replace(/top-\[34px\]/g, 'top-8.5');
content = content.replace(/max-h-\[290px\]/g, 'max-h-72.5');
content = content.replace(/max-h-\[300px\]/g, 'max-h-75');
content = content.replace(/max-w-\[200px\]/g, 'max-w-50');

fs.writeFileSync(file, content);
console.log('Fixed tailwind classes in app/onboarding/page.tsx');
