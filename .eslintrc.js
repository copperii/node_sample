export default {
  env: {
    es6: true,
    browser: true,
  },
  parser: 'babel-eslint',
  extends: ['eslint:recommended', 'plugin:react/recommended'],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': 0,

    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'no-console': 0,
    eqeqeq: 'error',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],

    'react/prop-types': 0,
    'react/forbid-component-props': 0,
    'eslint.workingDirectories': ['backend', 'frontend'],
  },
}
