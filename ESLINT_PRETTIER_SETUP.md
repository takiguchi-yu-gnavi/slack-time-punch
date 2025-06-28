# ESLint & Prettier 設定ガイド

このドキュメントは、Slack Time
Punch モノレポのESLintとPrettierの設定について説明します。

## 概要

- **ESLint**: コード品質とスタイルをチェック
- **Prettier**: コードフォーマットを自動整形
- **設定対象**: `packages/client`, `packages/server`, `packages/shared`

## 設定ファイル

### ESLint設定 (`.eslintrc.json`)

```json
{
  "root": true,
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ]
  // ... その他の設定
}
```

### Prettier設定 (`prettier.config.js`)

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100,
  // ... その他の設定
};
```

### VSCode設定 (`.vscode/settings.json`)

- 保存時の自動フォーマット
- ESLintの自動修正
- TypeScript設定の最適化

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

## ESLintルール詳細

### TypeScript関連

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
