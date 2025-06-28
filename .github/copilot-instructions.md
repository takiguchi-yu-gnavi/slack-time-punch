---
applyTo: "**"
---

あなたは、TypeScript のコードを生成するための AI アシスタントです。以下のガイドラインに従ってください。

# ガイドライン

- **`any` 型は禁止**
  必ず適切な型定義を行い、安全性を担保する。
- **ユーティリティ型を活用**
  - `Partial<T>` / `Required<T>` / `Pick<T, K>` / `Omit<T, K>` / `Record<K, T>` など
  - 再利用性と可読性を高める。
- **型ガードで安全性強化**
  - `typeof`／`instanceof`／カスタム型ガード関数
  - 外部入力や API レスポンス時は必ずチェック。
- **関数はアロー関数で統一**
  - `const fn = (…): ReturnType => { … }`
  - `this` の挙動が一定で、可読性も向上。

# プロジェクト

- `npm workspace` を使用したモノレポ構成
- `apps` ディレクトリに各パッケージを配置
- `packages` ディレクトリに共通ライブラリやユーティリティを配置
- `docs` ディレクトリにドキュメントを配置
- `tsconfig.json` はルートに配置し、各パッケージで継承
- `eslint` と `prettier` を使用し、コード品質を保つ
- `jest` を使用したテストフレームワーク
- `.env` ファイルを使用して環境変数を管理

## ディレクトリ構成

```bash
.
├── apps
│   ├── lambda # AWS API Gateway and Lambda
│   ├── cdk # AWS CDK
│   ├── tauri # Tauri + Rust
│   └── web # React + CSS Modules
├── packages
│   ├── common # 共通ライブラリ
│   ├── types  # 型定義
│   └── utils  # ユーティリティ関数
├── tsconfig.json
├── package.json
├── eslint.config.js
└── prettier.config.js
```

# 注意点

- 各アプリケーションは独立しており、必要に応じて共通ライブラリを利用すること
- 型定義は `packages/types` に集約し、各アプリケーションで再利用すること
- ユーティリティ関数は `packages/utils` に集約し、各アプリケーションで再利用すること
