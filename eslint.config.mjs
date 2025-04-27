// @ts-check

import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: ['node_modules', 'dist'],
  },
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
);
