const fs = require('fs');

const filesToFix = [
  { file: 'app/employer/jobs/[id]/page.tsx', str: 'Loading geofenced job area...' },
  { file: 'app/employer/onboarding/page.tsx', str: 'Loading geofenced business map...' },
  { file: 'app/employer/page.tsx', str: 'Loading active worker tracking maps...' },
  { file: 'app/page.tsx', str: 'Loading interactive neighborhood map...' },
  { file: 'app/resident/page.tsx', str: 'Loading interactive neighborhood map...' },
  { file: 'app/worker/opportunities/[id]/page.tsx', str: 'Loading interactive geofence radar...' },
  { file: 'app/worker/opportunities/page.tsx', str: 'Loading active neighborhood map...' },
  { file: 'app/worker/page.tsx', str: 'Loading Guntur geofence map layers...' }
];

filesToFix.forEach(({ file, str }) => {
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('import(\'@/lib/i18n/context\').then')) {
    content = content.replace(/import\('@\/lib\/i18n\/context'\)\.then\(m => m\.useI18n\(\)\.t\("[^"]+"\)\) && <span className="text-xs text-muted-foreground">[^<]+<\/span> \/\* TODO proper fix \*\//, '<span className="text-xs text-muted-foreground">' + str + '</span>');
  }

  const loadingRegex = new RegExp('loading:\\s*\\(\\)\\s*=>\\s*([\\s\\S]*?)<span className="text-xs text-muted-foreground">' + str + '<\\/span>\\s*<\\/div>');
  const match = content.match(loadingRegex);

  if (match) {
    const originalPreSpan = match[1];
    const newComponent = `loading: function LoadingFallback() {\n      const { t: i18nT } = require("@/lib/i18n/context").useI18n();\n      return (${originalPreSpan}<span className="text-xs text-muted-foreground">{i18nT("${str}")}</span>\n      </div>);\n    }`;
    content = content.replace(loadingRegex, newComponent);
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  } else {
    console.log('Match not found for', file);
  }
});

// Also patch Dialog.tsx
let dialogContent = fs.readFileSync('components/ui/Dialog.tsx', 'utf8');
if (!dialogContent.includes('useI18n')) {
    dialogContent = dialogContent.replace(/import \* as React from "react";/, 'import * as React from "react";\nimport { useI18n } from "@/lib/i18n/context";');
    
    // forwardRef cannot use hooks natively without being inside the render function, but here it IS the render function.
    // wait, actually forwardRef((props, ref) => { ... }) allows hooks inside the arrow function!
    // But `DialogPrimitive.Content` might just be a standard element. Let's see: DialogContent is a forwardRef
    // It's defined as const DialogContent = React.forwardRef<...>(({ className, children, ...props }, ref) => ( ... <span sr-only>Close</span> ... ))
    
    // We can't just inject useI18n() inside JSX unless we call a component.
    // Let's create an inline component:
    dialogContent = dialogContent.replace(/<span className="sr-only">Close<\/span>/, '<span className="sr-only">{(() => { const { t } = useI18n(); return t("Close"); })()}</span>');
    fs.writeFileSync('components/ui/Dialog.tsx', dialogContent);
    console.log('Patched Dialog.tsx');
}
