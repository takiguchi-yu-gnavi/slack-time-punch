import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // グローバル設定（無視するファイル）
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.vite/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/vite.config.*',
      '**/rollup.config.*',
      '**/webpack.config.*',
      '**/.eslintrc.*',
      '**/jest.config.*',
      // 各パッケージの設定ファイル（ルート設定を継承するため除外）
      '**/packages/*/eslint.config.mjs',
      '**/packages/*/prettier.config.mjs',
      // AWS CDK関連
      '**/cdk.out/**',
      '**/*.js.map',
      // AWS Lambda関連
      '**/.aws-sam/**',
      // Tauri関連
      '**/src-tauri/target/**',
      '**/src-tauri/gen/**',
    ],
  },

  // JavaScript/TypeScript 共通設定
  js.configs.recommended,

  // TypeScript用設定
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylistic,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.base.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // any型の使用を完全に禁止
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // 型安全性の強化
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // コード品質
      'prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-console': 'off', // 開発時はconsole.logを許可
    },
  },

  // React用設定（tauri, webパッケージ）
  {
    files: ['packages/tauri/**/*.{ts,tsx}', 'packages/web/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // React 特有のルール
      'react/prop-types': 'off', // TypeScriptを使用するため
      'react/react-in-jsx-scope': 'off', // React 17+では不要
      'react/jsx-uses-react': 'off', // React 17+では不要
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // アクセシビリティ
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // AWS Lambda用设定
  {
    files: ['packages/lambda/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Lambda特有のルール
      'no-process-env': 'off',
      'no-console': 'off', // Lambdaではログ出力を許可
    },
  },

  // AWS CDK用設定
  {
    files: ['packages/cdk/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // CDK特有のルール
      'no-process-env': 'off',
      'no-console': 'off', // CDKでもログ出力を許可
    },
  },

  // Shared用設定
  {
    files: ['packages/shared/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
  },

  // Import/Export用設定
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // TypeScriptのコンパイラーに任せる
      'import/no-duplicates': 'error',
      'import/no-useless-path-segments': 'error',
      'import/prefer-default-export': 'off',
    },
  },

  // Prettier設定（最後に適用してルールの競合を防ぐ）
  prettierConfig
);
