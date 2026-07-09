// Shared base ESLint 9 flat config (Node/TypeScript). Pragmatic baseline: correctness rules error;
// stylistic/size rules warn. Projects spread this and add their own ignores/overrides:
//   import base from '@tecnet-systems-gmbh/eslint-config';
//   export default [...base, { ignores: ['src/generated/**'] }];
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/*.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // File length: aim < 500 lines. Warning (non-blocking); grandfather legacy files per-file.
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      // `any` is used deliberately at some infra boundaries (DB clients, framework internals).
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { globals: { ...globals.node } },
  },
);
