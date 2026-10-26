import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import-x';

export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'public', 'vite.config.ts', 'src/api/schema.d.ts', 'postcss.config.cjs'],
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
            prettier: prettierPlugin,
            'unused-imports': unusedImports,
            import: importPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
        },
    },
    prettierConfig,
);
