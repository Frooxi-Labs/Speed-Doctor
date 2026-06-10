module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2024: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error'
  }
};
