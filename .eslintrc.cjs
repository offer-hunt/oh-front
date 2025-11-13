module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  env: { browser: true, es2022: true, node: true },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  overrides: [
    {
      files: ['vite.config.ts', 'vitest.config.ts'],
      rules: { 'import/no-unresolved': 'off' },
    },
  ],
};
