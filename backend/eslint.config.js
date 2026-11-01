import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import googleConfig from 'eslint-config-google';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // mengabaikan folder hasil build atau dependensi
  {
    ignores: ['dist/', 'node_modules/', 'build/', 'prisma/',
      'prisma.config.ts'],
  },

  // menerapkan rekomendasi JavaScript bawaan ESLint
  js.configs.recommended,

  // Gabungkan aturan Google dan TypeScript
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsdoc': jsdoc,
    },
    rules: {
      // Mengambil semua aturan bawaan dari Google Config
      ...googleConfig.rules,
      // Matikan aturan JSDoc Google terlalu ketat untuk TS
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
      'linebreak-style': 'off',
      'object-curly-spacing': ['error', 'always'],
      'jsdoc/require-jsdoc': 'error',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',

      // Mengambil rekomendasi aturan untuk TypeScript
      ...tsPlugin.configs.recommended.rules,

      // Penyesuaian khusus TypeScript agar tidak konflik dengan aturan Google:
      'no-unused-vars': 'off', // Matikan bawaan JS
      '@typescript-eslint/no-unused-vars': ['error'], // bawaan TS

    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
