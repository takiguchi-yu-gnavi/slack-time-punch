---
applyTo: '**'
---

あなたは、TypeScript のコードを生成するための AI アシスタントです。以下のガイドラインに従ってください。

# ガイドライン

- **言語:** **TypeScript (`"strict": true`) のみ**。JavaScript
  (`.js`) ファイルは禁止する。
- **`any` 型は禁止** 必ず適切な型定義を行い、安全性を担保する。
- **ユーティリティ型を活用**
  - `Partial<T>` / `Required<T>` / `Pick<T, K>` / `Omit<T, K>` / `Record<K, T>`
    など
  - 再利用性と可読性を高める。
- **型定義は明示的に**
  - `interface`／`type` を使用し、型の明確化を行う。
  - `type` はユーティリティ型や複雑な型定義に使用し、`interface`
    はオブジェクトの構造を定義する。
- **型の再利用を促進**
  - 型アノテーションを優先して採用し、型アサーション (`as`) は極力使用しない。
- **型ガードで安全性強化**
  - `typeof`／`instanceof`／カスタム型ガード関数
  - 外部入力や API レスポンス時は必ずチェック。
- **関数はアロー関数で統一**
  - `const fn = (…): ReturnType => { … }`
  - `this` の挙動が一定で、可読性も向上。
- **非同期処理は `async/await` を使用**
  - `Promise` の使用は避け、可読性を高める。
- **エラーハンドリングは `try/catch` を使用**
  - `Promise.catch` は使用せず、明示的なエラーハンドリングを行う。
- **コードの可読性を重視**
  - google の [Eng Practices](https://github.com/google/eng-practices)
    に準拠する。

# プロジェクト

- `npm workspace` を使用したモノレポ構成
- `packages` ディレクトリに各アプリケーションを配置
- `.env` ファイルを使用して各アプリケーションの環境変数を管理
- `tsconfig.base.json` はルートに配置し、各パッケージで継承
- `eslint` と `prettier` を使用し、コード品質を保つ
- `jest` を使用したテストフレームワーク

## ディレクトリ構成

```bash
.
├── packages
│   ├── lambda # AWS Lambda (TypeScript)
│   ├── cdk # AWS CDK (TypeScript)
│   ├── tauri # Tauri デスクトップアプリ (React + CSS-Modules + TypeScript + Rust)
│   └── shared # 共通の型定義やユーティリティ関数
├── tsconfig.base.json
├── package.json
├── eslint.config.js
└── prettier.config.js
```

# 注意点

- 各アプリケーションは独立しており、必要に応じて共通ライブラリを利用すること
- 型定義は `packages/types` に集約し、各アプリケーションで再利用すること
- ユーティリティ関数は `packages/utils`
  に集約し、各アプリケーションで再利用すること
