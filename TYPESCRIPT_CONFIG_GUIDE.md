# TypeScript Configuration for Production-Grade Standards

## Recommended tsconfig.json

```json
{
  "compilerOptions": {
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Module Resolution
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",

    // Emit
    "noEmit": true,
    "jsx": "react-jsx",

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"]
    },

    // Skip Library Checks (for faster builds)
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "build"]
}
```

## ESLint Configuration for TypeScript

**File: `.eslintrc.json`**

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    // TypeScript Specific
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",

    // React Specific
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // General
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

## Vite Configuration with Path Aliases

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\""
  }
}
```

## Pre-commit Hook (Husky)

**File: `.husky/pre-commit`**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm run lint
```

## Type-Safe Environment Variables

**File: `src/vite-env.d.ts`**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Usage:**

```typescript
// ❌ WRONG - No type safety
const apiKey = import.meta.env.VITE_API_KEY;

// ✅ CORRECT - Type-safe with autocomplete
const getApiKey = (): string => {
  const key = import.meta.env.VITE_API_KEY;
  if (!key) {
    throw new Error('VITE_API_KEY is not defined');
  }
  return key;
};
```

## Utility Types

**File: `src/types/utility.types.ts`**

```typescript
// Make all properties required and non-nullable
export type RequiredNotNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// Extract function return type
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

## Type Guards

**File: `src/lib/utils/typeGuards.ts`**

```typescript
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};
```

---

## Migration Steps

1. **Update tsconfig.json** with strict settings
2. **Install ESLint & Prettier**:
   ```bash
   npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks prettier
   ```
3. **Run type-check**: `npm run type-check`
4. **Fix all TypeScript errors** before proceeding
5. **Enable path aliases** in vite.config.ts
6. **Update imports** to use aliases

---

**Result**: Zero runtime type errors, full IDE autocomplete, and production-ready code.
