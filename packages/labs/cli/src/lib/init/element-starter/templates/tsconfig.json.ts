import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateTsconfig = (): FileTree => {
  return {
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "inlineSources": true,
    "rootDir": "src",
    "outDir": "lib",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "noImplicitOverride": true,
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}`,
  };
};
