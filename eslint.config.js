import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';

const ignores = [
  '**/dist/**',
  '**/coverage/**',
  '**/node_modules/**',
  'apps/api/**',
  'apps/**/.expo/**',
  'design/**',
];

export default [
  {
    ignores,
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      'react-refresh': reactRefresh,
      'testing-library': testingLibrary,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/jsx-uses-react': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['apps/customer-app/**/*.{js,jsx}', 'apps/rider-app/**/*.{js,jsx}'],
    rules: {
      'react-native/no-inline-styles': 'off',
    },
  },
  {
    files: [
      'apps/portal-web/**/*.{test,spec}.{js,jsx}',
      'apps/customer-app/**/*.{test,spec}.{js,jsx}',
      'apps/rider-app/**/*.{test,spec}.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
];
