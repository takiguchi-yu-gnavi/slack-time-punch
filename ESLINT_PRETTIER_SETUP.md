# ESLint & Prettier 設定ガイド

このドキュメントは、Slack Time Punch モノレポのESLint v9 (Flat
Config) とPrettierの設定について説明します。

## 概要

- **ESLint v9**: 厳格な型チェックとコード品質チェック（Flat Config形式）
- **Prettier**: コードフォーマットを自動整形
- **TypeScript**: strict modeでany型を完全禁止
- **設定対象**: `packages/client` (React), `packages/server` (Node.js),
  `packages/shared` (共通型定義)

## 設定ファイル

### ESLint設定 (`eslint.config.mjs`) - Flat Config形式

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // TypeScript strict type checking
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // React用設定（client package）
  // Node.js用設定（server package）
  // 共通設定（shared package）
  prettierConfig // Prettier競合回避
);
```

### Prettier設定 (`prettier.config.js`)

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100,
  endOfLine: 'lf',
};
```

### TypeScript設定 (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true
    // 厳格な型チェック設定
  },
  "include": ["packages/*/src/**/*"]
}
```

## 利用可能なコマンド

### ルートプロジェクト

```bash
# 全パッケージのlint実行
npm run lint

# 自動修正可能なESLintエラーを修正
npm run lint:fix

# 全パッケージのフォーマット実行
npm run format

# フォーマットチェック（CIで使用）
npm run format:check
```

### 各パッケージ

```bash
# clientパッケージ
cd packages/client
npm run lint
npm run lint:fix
npm run format
npm run format:check

# serverパッケージ
cd packages/server
npm run lint
npm run lint:fix
npm run format
npm run format:check

# sharedパッケージ
cd packages/shared
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## 主要な型安全性ルール

### any型の完全禁止

- `@typescript-eslint/no-explicit-any`: any型の明示的な使用を禁止
- `@typescript-eslint/no-unsafe-assignment`: any値の代入を禁止
- `@typescript-eslint/no-unsafe-call`: any値の関数呼び出しを禁止
- `@typescript-eslint/no-unsafe-member-access`: any値のプロパティアクセスを禁止
- `@typescript-eslint/no-unsafe-return`: any値の戻り値を禁止
- `@typescript-eslint/no-unsafe-argument`: any値の引数渡しを禁止

### 型安全性の強化

- `@typescript-eslint/prefer-nullish-coalescing`: `??` 演算子の使用を推奨
- `@typescript-eslint/prefer-optional-chain`: `?.` 演算子の使用を推奨
- `@typescript-eslint/no-non-null-assertion`: `!` 演算子の使用を禁止
- `@typescript-eslint/explicit-function-return-type`: 関数の戻り値型を明示
- `@typescript-eslint/consistent-type-definitions`: `interface` の使用を強制

### React特有のルール

- React 17+ 新しいJSX変換に対応
- アクセシビリティ（a11y）ルール
- Hooks の正しい使用

### Node.js特有のルール

- プロセス環境変数の適切な使用
- 非同期処理の安全な実装

## 運用フロー

### 1. 開発時

```bash
# 開発開始前にsharedパッケージをビルド
npm run build --workspace=packages/shared

# コード変更後
npm run lint        # エラーチェック
npm run lint:fix    # 自動修正可能なエラーを修正
npm run format      # コードフォーマット
```

### 2. CI/CD

```bash
# 型チェック・リント・フォーマットチェック
npm run lint
npm run format:check
```

### 3. VS Code設定

- 保存時の自動ESLint修正
- 保存時の自動Prettierフォーマット
- TypeScript strict mode

## トラブルシューティング

### ESLint v9 移行関連

- `.eslintrc.*` ファイルは削除済み（Flat Config移行）
- `eslint.config.mjs` 形式で ES module として動作
- `package.json` の `"type": "module"` 設定不要

### 型エラーが多発する場合

1. `shared` パッケージをビルド: `npm run build --workspace=packages/shared`
2. `tsconfig.base.json` の `include` パスを確認
3. 各パッケージの `tsconfig.json` で `extends` を確認

### パフォーマンスの問題

- ESLint の `project` オプションで適切な `tsconfig.json` を指定
- 不要なファイルを `ignores` に追加

- `@typescript-eslint/no-explicit-any`: `any`型の使用を禁止
- `@typescript-eslint/consistent-type-definitions`:
  `interface`の代わりに`type`を推奨
- `@typescript-eslint/array-type`: 配列型記法の統一

### React関連（clientパッケージ）

- `react/react-in-jsx-scope`: React 17+では不要なため無効化
- `react-hooks/rules-of-hooks`: Hooksのルールを強制
- `react-hooks/exhaustive-deps`: useEffectの依存配列チェック

### 一般的なルール

- `no-console`: `console.log`等の使用を許可（全パッケージ共通）
- `no-debugger`: `debugger`文の使用を禁止
- `prefer-const`: 再代入されない変数は`const`を使用
- `no-var`: `var`の使用を禁止
- `prefer-arrow-callback`: アロー関数の使用を推奨
- `arrow-body-style`: アロー関数の記法統一

## パッケージ固有の設定

### Client（React）

- ブラウザ環境の設定
- Reactプラグインの追加設定
- JSXルールの適用

### Server（Express）

- Node.js環境の設定
- `console.log`の使用を許可

### Shared（共通）

- Node.js + ブラウザ両対応
- 汎用的なTypeScriptルール

## 開発ワークフロー

### 1. 開発時

VSCodeの設定により、保存時に自動でフォーマットとlint修正が実行されます。

### 2. コミット前

```bash
npm run lint && npm run format
```

### 3. CI/CD

```bash
npm run lint
npm run format:check
```

## トラブルシューティング

### ESLintエラーが表示される場合

1. `npm run lint:fix`で自動修正を試す
2. 手動でエラーを修正
3. 特定のルールを無効化する場合は`// eslint-disable-next-line`を使用

### Prettierフォーマットが適用されない場合

1. VSCodeの設定を確認
2. `.prettierignore`でファイルが除外されていないか確認
3. `npm run format`を手動実行

### TypeScriptバージョンの警告

ESLintプラグインが最新のTypeScriptバージョンに対応していない場合の警告です。通常は問題なく動作します。

## カスタマイズ

プロジェクトの要件に応じて以下をカスタマイズできます：

1. **ルールの追加・削除**: `.eslintrc.json`の`rules`セクション
2. **フォーマットオプション**: `prettier.config.js`
3. **無視ファイル**: `.prettierignore`の追加作成

## 参考リンク

- [ESLint公式ドキュメント](https://eslint.org/)
- [Prettier公式ドキュメント](https://prettier.io/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
