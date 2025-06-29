# ESLint & Prettier 統一設定

このプロジェクトでは、全パッケージで統一された ESLint と Prettier の設定を使用しています。

## 設定ファイルの構成

### ルートレベル設定

- `eslint.config.mjs`: 全パッケージ共通の ESLint 設定
- `prettier.config.mjs`: 全パッケージ共通の Prettier 設定
- `tsconfig.base.json`: 全パッケージ共通の TypeScript 設定

### パッケージ固有設定

各パッケージには軽量な設定ファイルがあり、ルートの設定を継承します：

- `packages/*/eslint.config.mjs`: ルート設定の継承
- `packages/*/prettier.config.mjs`: ルート設定の継承

これにより、個別パッケージでも `npm run lint` や `npm run format` を直接実行できます。

## 使用方法

### ルートレベルでの実行（推奨）

```bash
# 全パッケージのリント
npm run lint

# 全パッケージのリント修正
npm run lint:fix

# 全パッケージのフォーマット
npm run format

# 全パッケージのフォーマットチェック
npm run format:check
```

### 個別パッケージでの実行

```bash
# CDKパッケージ（パッケージディレクトリ内で直接実行可能）
cd packages/cdk
npm run lint
npm run format

# Lambdaパッケージ
cd packages/lambda
npm run lint
npm run format

# Tauriパッケージ
cd packages/tauri
npm run lint
npm run format

# Webパッケージ
cd packages/web
npm run lint
npm run format

# Sharedパッケージ
cd packages/shared
npm run lint
npm run format
```

> 各パッケージはルート設定を継承しているため、どこから実行しても同じルールが適用されます。

## パッケージ別の特別なルール

### React パッケージ（tauri, web）

- React Hook のルール適用
- JSX のアクセシビリティルール適用
- React 17+ 向けの設定

### AWS Lambda パッケージ

- `console.log` の使用を許可
- Node.js 環境変数の使用を許可

### AWS CDK パッケージ

- `console.log` の使用を許可
- Node.js 環境変数の使用を許可

### Shared パッケージ

- より厳密な型定義を要求
- 明示的な関数戻り値型の指定を推奨

## 重要な注意事項

- `any` 型の使用は完全に禁止されています
- TypeScript の `strict` モードが有効です
- 全てのパッケージで統一されたコードスタイルが適用されます
- Git コミット前に自動的にリントとフォーマットチェックが実行されます

## トラブルシューティング

### ESLint エラーが発生した場合

1. まず `npm run lint:fix` で自動修正を試す
2. 修正できないエラーは手動で対応
3. 型安全性に関するエラーは `any` 型を使わずに適切な型を定義

### Prettier エラーが発生した場合

1. `npm run format` でフォーマットを自動修正
2. 設定の競合がある場合はルートの `prettier.config.mjs` を確認
