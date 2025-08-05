const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.jest,
        ...globals.node,
        chrome: 'readonly',
        UniversalBypass: 'readonly',
        // Add test globals
        Chart: 'readonly',
        // Add structuredClone for Node.js 17+ environments
        structuredClone: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'space-before-function-paren': ['error', 'never'],
      'no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]