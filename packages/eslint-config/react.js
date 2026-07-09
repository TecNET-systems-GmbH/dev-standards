// Shared ESLint config for React/web packages: the base config + browser globals + react-hooks rules.
//   import base from '@tecnet-systems-gmbh/eslint-config/react';
//   export default [...base, { ignores: ['dist/**'] }];
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import base from './index.js';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
