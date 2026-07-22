const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

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
let filesModified = 0;

function getValidReactComponent(path) {
    let current = path.getFunctionParent();
    while (current) {
        let name = null;
        if (current.isFunctionDeclaration() && current.node.id) {
            name = current.node.id.name;
        } else if (current.parentPath && current.parentPath.isVariableDeclarator() && current.parentPath.node.id.type === 'Identifier') {
            name = current.parentPath.node.id.name;
        }
        
        if (name && (/^[A-Z]/.test(name) || /^use[A-Z]/.test(name))) {
            return current;
        }
        
        if (current.parentPath && current.parentPath.isExportDefaultDeclaration()) {
            return current;
        }

        current = current.getFunctionParent();
    }
    return null;
}

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (file.includes('i18n/context') || file.includes('LanguageSwitcher') || file.includes('translations')) {
        return;
    }

    let ast;
    try {
        ast = parser.parse(content, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });
    } catch (e) {
        return;
    }

    let modified = false;
    let needsImport = false;
    let componentsToInject = new Set();
    let hasUseI18nImport = false;

    traverse(ast, {
        ImportDeclaration(path) {
            if (path.node.source.value === "@/lib/i18n/context") {
                hasUseI18nImport = true;
            }
        },
        JSXText(path) {
            let text = path.node.value;
            if (/[a-zA-Z]/.test(text)) {
                const trimmed = text.trim();
                if (trimmed && /[a-zA-Z]/.test(trimmed) && !trimmed.includes('{') && !trimmed.includes('}')) {
                    const funcParent = getValidReactComponent(path);
                    if (funcParent) {
                        extractedStrings.add(trimmed);
                        const tCall = t.callExpression(t.identifier('i18nT'), [t.stringLiteral(trimmed)]);
                        path.replaceWith(t.jsxExpressionContainer(tCall));
                        modified = true;
                        componentsToInject.add(funcParent.node);
                    }
                }
            }
        },
        JSXAttribute(path) {
            const attrName = path.node.name.name;
            if (['placeholder', 'title', 'aria-label', 'alt', 'label'].includes(attrName)) {
                if (path.node.value && path.node.value.type === 'StringLiteral') {
                    const text = path.node.value.value.trim();
                    if (text && /[a-zA-Z]/.test(text)) {
                        const funcParent = getValidReactComponent(path);
                        if (funcParent) {
                            extractedStrings.add(text);
                            const tCall = t.callExpression(t.identifier('i18nT'), [t.stringLiteral(text)]);
                            path.node.value = t.jsxExpressionContainer(tCall);
                            modified = true;
                            componentsToInject.add(funcParent.node);
                        }
                    }
                }
            }
        }
    });

    if (modified) {
        componentsToInject.forEach(funcNode => {
            if (funcNode.body && funcNode.body.type === 'BlockStatement') {
                // Check if already injected i18nT
                const alreadyInjected = funcNode.body.body.some(stmt => {
                    if (stmt.type === 'VariableDeclaration') {
                        return stmt.declarations.some(decl => {
                            if (decl.id.type === 'ObjectPattern') {
                                return decl.id.properties.some(prop => prop.value && prop.value.name === 'i18nT');
                            }
                            return false;
                        });
                    }
                    return false;
                });
                
                if (!alreadyInjected) {
                    const useI18nDecl = t.variableDeclaration('const', [
                        t.variableDeclarator(
                            t.objectPattern([
                                t.objectProperty(t.identifier('t'), t.identifier('i18nT'), false, false)
                            ]),
                            t.callExpression(t.identifier('useI18n'), [])
                        )
                    ]);
                    funcNode.body.body.unshift(useI18nDecl);
                    needsImport = true;
                }
            } else if (funcNode.body && funcNode.body.type !== 'BlockStatement') {
                const useI18nDecl = t.variableDeclaration('const', [
                    t.variableDeclarator(
                        t.objectPattern([
                            t.objectProperty(t.identifier('t'), t.identifier('i18nT'), false, false)
                        ]),
                        t.callExpression(t.identifier('useI18n'), [])
                    )
                ]);
                const returnStmt = t.returnStatement(funcNode.body);
                funcNode.body = t.blockStatement([useI18nDecl, returnStmt]);
                needsImport = true;
            }
        });

        if (needsImport && !hasUseI18nImport) {
            const importDecl = t.importDeclaration(
                [t.importSpecifier(t.identifier('useI18n'), t.identifier('useI18n'))],
                t.stringLiteral('@/lib/i18n/context')
            );
            if (ast.program.directives && ast.program.directives.length > 0) {
                ast.program.body.splice(1, 0, importDecl); // insert after directives like "use client"
            } else {
                ast.program.body.unshift(importDecl);
            }
        }

        try {
            const output = generate(ast, { retainLines: true }, content);
            fs.writeFileSync(file, output.code);
            filesModified++;
        } catch(e) {
            console.error("Generate error in", file, e);
        }
    }
});

console.log(`Modified ${filesModified} files. Extracted ${extractedStrings.size} unique strings.`);
fs.writeFileSync('scripts/extracted_strings.json', JSON.stringify(Array.from(extractedStrings), null, 2));
