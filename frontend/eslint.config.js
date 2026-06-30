import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'vite.config.ts'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                project: true,
            },
        },
        plugins: {
            'prettier': prettierPlugin,
            'unused-imports': unusedImports,
            'import': importPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'unused-imports/no-unused-imports': 'error',
            'import/order': [
                'error',
                {
                    'groups': ['builtin', 'external', 'internal', ['parent', 'sibling']],
                    'newlines-between': 'always',
                    'alphabetize': { 'order': 'asc', 'caseInsensitive': true },
                },
            ],
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    prettierConfig,
);