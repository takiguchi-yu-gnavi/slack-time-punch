# Slack 出退勤打刻アプリ

TypeScriptで実装されたSlack連携出退勤打刻システムです。AWS Lambda + CDK構成でサーバーレス化しています。

## 🏗️ アーキテクチャ

### モノレポ構成（サーバーレス・アーキテクチャ）

```
packages/
├── shared/     # 共有型定義・ユーティリティ
├── lambda/     # AWS Lambda関数（API Gateway + Lambda）
├── cdk/        # AWS CDK構成（CloudFront + WAF + API Gateway + Lambda）
└── web/        # React.js フロントエンド (Vite)
```

- **サーバーレス**: AWS Lambda + API Gatewayによる高可用性・低コスト運用
- **型安全性**: 共有型定義で一貫性を保証
- **CDK Infrastructure as Code**: AWS リソースをコードで管理
- **環境変数管理**: 完全なURLベースの設定で簡素化

## 🚀 機能

- **⏰ 出退勤打刻**: ワンクリックで出勤・退勤メッセージを投稿
- **⚙️ メッセージカスタマイズ**: 出退勤時のメッセージを自由に設定可能
- **🔐 OAuth 2.0認証**: Slackの公式OAuth 2.0フローを実装
- **📋 チャンネル選択**: 参加しているチャンネルから投稿先を選択
- **🛡️ セキュリティ**: CSRF攻撃対策のためのstateパラメータ検証
- **👤 ユーザープロフィール表示**: 認証後にSlackユーザー名・プロフィール画像を表示
- **⏳ トークン有効期限管理**: トークンの有効期限表示と期限切れ警告
- **🎨 モダンUI**: レスポンシブでユーザーフレンドリーなインターフェース（Vite + React）
- **📝 TypeScript**: 型安全性とコード品質の確保
- **☁️ サーバーレス**: AWS Lambda + API Gatewayによる高可用性・低コスト運用
- **� CDK Infrastructure**: Infrastructure as Codeでリソース管理
- **🔧 環境変数管理**: 完全なURLベースの設定で開発・本番環境の切り替えが簡単

## 📋 前提条件

- Node.js (v22以上推奨)
- npm または yarn
- Slackアプリの作成とクライアント情報
- AWS SAM CLI（ローカル開発時）
- AWS CDK（デプロイ時）

## 🛠️ セットアップ

### 1. Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. "Create New App" → "From scratch"を選択
3. アプリ名とワークスペースを指定
4. "OAuth & Permissions"セクションで以下を設定：
   - **Redirect URLs**: `http://localhost:3000/api/auth/slack/callback`
   - **Scopes**: 必要に応じて以下のスコープを追加
     - Bot Token Scopes: `channels:read`, `groups:read`
     - User Token Scopes: `identify`, `channels:read`, `groups:read`, `chat:write`

### 2. 環境変数の設定

AWS Lambda用の環境変数ファイルを作成：

```bash
# Lambda用の環境変数
cp packages/lambda/env.example.json packages/lambda/env.json
```

`packages/lambda/env.json`ファイルを編集：

```json
{
  "Parameters": {
    "SLACK_CLIENT_ID": "your_slack_client_id_here",
    "SLACK_CLIENT_SECRET": "your_slack_client_secret_here",
    "NODE_ENV": "development",
    "CLIENT_URL": "http://localhost:5173",
    "REDIRECT_URI": "http://localhost:3000/api/auth/slack/callback",
    "SLACK_SCOPES": "channels:read,groups:read",
    "SLACK_USER_SCOPES": "identify,channels:read,groups:read,chat:write"
  }
}
```

Web用の環境変数も設定：

```bash
# Web用の環境変数
cp packages/web/.env.example packages/web/.env
```

`packages/web/.env`ファイルを編集：

```env
# Web用環境変数（VITEプレフィックス必須）
VITE_SERVER_URL=http://localhost:3000
VITE_LAMBDA_AUTH_URL=http://localhost:3000/api
```

**環境変数の説明**:

- **AWS Lambda設定**: JSON形式でLambda環境変数を管理
- **API Gateway**: エンドポイントは `/api` プレフィックス付き
- **完全URL設定**: 開発・本番でURLを変更するだけ
- **本番環境**: これらのURLを本番サーバーのURLに変更するだけ

### 3. 依存関係のインストール

```bash
npm install
```

### 4. アプリケーション起動

#### 🔥 開発モード（推奨）

```bash
# 共有ライブラリのビルド
npm run shared:build

# AWS SAM Lambda関数をローカル起動（API: http://localhost:3000）
npm run sam:dev

# 別のターミナルでWebクライアント起動（UI: http://localhost:5173）
npm run web:dev
```

#### 🚀 個別起動

```bash
# Lambda関数のみ（API: http://localhost:3000）
npm run sam:dev

# デバッグモード（詳細ログ付き）
npm run sam:dev:debug

# Webクライアントのみ（UI: http://localhost:5173）
npm run web:dev
```

#### 🏗️ CDKデプロイ

```bash
# CDKプロジェクトのビルド
npm run cdk:build

# AWSへのデプロイ
npm run cdk:deploy

# 差分確認
npm run cdk:diff

# 削除
npm run cdk:destroy
```

#### 📦 本番ビルド

```bash
# 共有ライブラリビルド
npm run shared:build

# Webクライアントビルド
npm run web:build

# CDKビルド
npm run cdk:build
```

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

```bash
# Lambda用環境変数
cp packages/lambda/env.example.json packages/lambda/env.json
# packages/lambda/env.jsonファイルを編集してSlackアプリ情報を設定

# Web用環境変数
cp packages/web/.env.example packages/web/.env
# packages/web/.envファイルを編集
```

### 3. アプリケーション起動

#### AWS SAM開発モード（推奨）

```bash
# 共有ライブラリビルド
npm run shared:build

# Lambda関数をローカル起動
npm run sam:dev

# 別ターミナルでWebクライアント起動
npm run web:dev
```

### 4. アクセス

- **フロントエンド**: http://localhost:5173
- **API サーバー**: http://localhost:3000
- **Slack認証**: http://localhost:3000/api/auth/slack

## 📡 API エンドポイント

### 認証関連

- **GET `/`**: メインページ（クライアントアプリにリダイレクト）
- **GET `/api/auth/slack`**: OAuth認証開始
- **GET `/api/auth/slack/callback`**: OAuth認証コールバック
- **GET `/api/health`**: ヘルスチェック

### Slack API連携

- **GET `/api/auth/channels?token=<user_token>`**: チャンネル一覧取得
- **POST `/api/auth/post-message`**: 個人ユーザーとしてメッセージ投稿
- **GET `/api/auth/user-info?token=<user_token>`**: ユーザー情報・トークン有効期限取得
- **POST `/api/auth/user-info`**: ユーザー情報取得（POSTボディ経由）
- **POST `/api/auth/refresh`**: トークンリフレッシュ
- **POST `/api/auth/logout`**: ログアウト

### トークン有効期限機能

このアプリは2種類のSlackトークンに対応しています：

#### 1. 永続的なトークン（デフォルト）

- **有効期限なし**: Token Rotationが無効な場合
- **表示**: 「♾️ 永続的なトークン」として表示
- **利点**: 実装がシンプル、更新処理不要

#### 2. 有効期限付きトークン（Token Rotation有効時）

- **有効期限**: 12時間（Token Rotation有効時）
- **表示**: 残り時間と有効期限日時を表示
- **警告**: 24時間以内、1時間以内で段階的に警告表示

**Token Rotationの有効化方法**:

1. [Slack API Apps](https://api.slack.com/apps) → 対象アプリ選択
2. OAuth & Permissions → Token Rotation を有効化
3. 注意: 一度有効にすると無効化できません

詳細は `SLACK_TOKEN_EXPIRATION.md` を参照してください。

### ✅ **有効期限なしトークンの継続利用**

**はい、有効期限なしのトークンは継続して使用できます。**

#### 永続利用の条件

- **デフォルト動作**: Token Rotationを有効にしない限り、Slackトークンは無期限
- **継続使用**: アプリの削除や手動取り消しまで有効
- **メンテナンスフリー**: 定期更新やrefresh token管理が不要

#### トークンが無効になる場合

1. **ユーザーがアプリを削除** (Slack設定で手動削除)
2. **ワークスペース管理者がアプリを削除**
3. **認証ユーザーのアカウント無効化**
4. **開発者が明示的に取り消し** (`auth.revoke` API)

#### 使い分けの指針

- **個人・小規模利用**: 有効期限なしトークンで十分
- **エンタープライズ**: セキュリティ要件に応じてToken Rotation検討
- **商用アプリ**: Token Rotationの採用を推奨

現在の設定状況は `/auth/token-rotation-status` で確認できます。

### OAuth フロー

1. **認証開始**: ユーザーが `/api/auth/slack` にアクセス
2. **Slack認証**: Slackの認証ページにリダイレクト
3. **コールバック**: 認証後 `/api/auth/slack/callback` に戻る
4. **トークン取得**: 認証コードをアクセストークンに交換

## 📱 使用方法

### 基本的な使い方

1. **認証**: 「Slackで認証する」ボタンをクリック
2. **チャンネル選択**: 出退勤メッセージを投稿したいチャンネルを選択
3. **打刻**: 「🟢 出勤」または「🔴 退勤」ボタンをクリック

### メッセージカスタマイズ

1. **設定画面**: 「⚙️ メッセージ設定」ボタンをクリック
2. **メッセージ編集**: 出勤・退勤メッセージを自由に変更
3. **保存**: 「設定を保存」ボタンで設定を保存
4. **リセット**: 「デフォルトに戻す」ボタンでデフォルトメッセージに復元

**デフォルトメッセージ**:

- 出勤: 「業務を開始します」
- 退勤: 「業務を終了します」

**カスタマイズ例**:

- 出勤: 「おはようございます！今日も頑張ります💪」
- 退勤: 「お疲れ様でした！本日の業務を終了します🏠」

設定はブラウザのローカルストレージに保存され、次回アクセス時も維持されます。

## 🔒 セキュリティ機能

- **State Parameter**: CSRF攻撃対策
- **HTTPS Redirect**: 本番環境でのセキュア通信
- **Token Management**: アクセストークンの安全な管理
- **Error Handling**: 適切なエラーハンドリング

## 🎨 使用技術

### Backend (AWS Lambda)

- **Runtime**: Node.js 22.x, TypeScript
- **Framework**: AWS Lambda + API Gateway
- **HTTP Client**: Axios
- **Environment**: dotenv
- **Development**: AWS SAM CLI
- **Infrastructure**: AWS CDK

### Frontend (Web Client)

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI**: CSS Modules
-- **Future Ready**: 削除済み

### Shared

- **Types**: TypeScript型定義の共有
- **Utils**: 共通ユーティリティ関数
- **Constants**: API エンドポイント定数

### DevOps

- **Infrastructure**: AWS CDK (CloudFront + WAF + API Gateway + Lambda)
- **Development Tools**: ESLint, Prettier, TypeScript
- **Monorepo**: npm workspaces

## 📚 プロジェクト構成

```
.
├── packages/
│   ├── shared/                    # 共有ライブラリ
│   │   ├── src/
│   │   │   ├── index.ts          # 共有関数・設定
│   │   │   └── types.ts          # 共有型定義
│   │   └── package.json
│   ├── lambda/                    # AWS Lambda関数
│   │   ├── src/
│   │   │   ├── index.ts          # メインLambdaハンドラー
│   │   │   ├── common.ts         # 共通ユーティリティ
│   │   │   ├── handlers/
│   │   │   │   ├── auth.ts       # 認証ハンドラー
│   │   │   │   └── health.ts     # ヘルスチェックハンドラー
│   │   │   ├── services/
│   │   │   │   └── slackAuth.ts  # Slack認証サービス
│   │   │   ├── types/
│   │   │   │   └── shared.ts     # Lambda型定義
│   │   │   └── utils/
│   │   │       └── stateManager.ts # セキュリティ状態管理
│   │   ├── template.yaml         # AWS SAMテンプレート
│   │   ├── env.json              # Lambda環境変数
│   │   └── package.json
│   ├── cdk/                       # AWS CDK Infrastructure
│   │   ├── src/
│   │   │   └── slack-time-punch-stack.ts # CDKスタック定義
│   │   ├── cdk.json              # CDK設定
│   │   └── package.json
│   └── web/                       # React.js フロントエンド
│       ├── src/
│       │   ├── main.tsx          # エントリーポイント
│       │   ├── App.tsx           # メインアプリ
│       │   ├── config/
│       │   │   └── index.ts      # 設定管理
│       │   ├── components/       # Reactコンポーネント
│       │   ├── hooks/            # カスタムフック
│       │   ├── styles/           # CSS Modules
│       ├── public/
│       ├── vite.config.ts        # Vite設定
│       └── package.json
│       ├── src/
│       │   ├── main.tsx          # エントリーポイント
│       │   ├── App.tsx           # メインアプリ
│       │   └── components/       # Reactコンポーネント
│       ├── public/
│       └── package.json
├── tsconfig.base.json             # ルートTypeScript設定
├── eslint.config.mjs              # ESLint設定
├── prettier.config.mjs            # Prettier設定
└── package.json                   # ワークスペース設定
```

## 🔧 開発

### 利用可能なスクリプト

#### ワークスペース全体

- `npm run shared:build`: 共有ライブラリのビルド
- `npm run lint`: 全パッケージのESLintチェック
- `npm run lint:fix`: 全パッケージのESLint自動修正
- `npm run format`: 全パッケージのPrettierフォーマット
- `npm run format:check`: 全パッケージのPrettierフォーマットチェック

#### Lambda関連

- `npm run sam:dev`: AWS SAMでローカル開発サーバー起動
- `npm run sam:dev:debug`: デバッグモードでローカル開発サーバー起動
- `npm run sam:local:test`: ローカルAPIのヘルスチェック
- `npm run sam:clean`: SAMビルドファイルクリーンアップ

#### Web関連

- `npm run web:dev`: Webクライアント開発モード
- `npm run web:build`: Webクライアントビルド

#### CDK関連

- `npm run cdk:build`: CDKプロジェクトビルド
- `npm run cdk:synth`: CloudFormationテンプレート生成
- `npm run cdk:deploy`: AWSへのデプロイ
- `npm run cdk:diff`: 現在のスタックとの差分表示
- `npm run cdk:destroy`: スタックの削除

**個別パッケージでの実行例:**

```bash
# Lambda関数のリント
cd packages/lambda && npm run lint

# Web用のフォーマット
cd packages/web && npm run format
```

### 環境変数詳細

#### Lambda環境変数 (`packages/lambda/env.json`)

| 変数名              | 説明                                            | デフォルト                                    | 必須 |
| ------------------- | ----------------------------------------------- | --------------------------------------------- | ---- |
| **Slack OAuth設定** |
| SLACK_CLIENT_ID     | SlackアプリのClient ID                          | -                                             | ✅   |
| SLACK_CLIENT_SECRET | SlackアプリのClient Secret                      | -                                             | ✅   |
| REDIRECT_URI        | OAuth認証後のリダイレクトURL                    | http://localhost:3000/api/auth/slack/callback | ✅   |
| SLACK_SCOPES        | Slackで要求するボットスコープ（カンマ区切り）   | channels:read,groups:read                     | ✅   |
| SLACK_USER_SCOPES   | Slackで要求するユーザースコープ（カンマ区切り） | identify,channels:read,groups:read,chat:write | ✅   |
| **実行環境**        |
| NODE_ENV            | 実行環境                                        | development                                   | -    |
| CLIENT_URL          | クライアントアプリのベースURL                   | http://localhost:5173                         | -    |

#### Web環境変数 (`packages/web/.env`)

| 変数名               | 説明                     | デフォルト                | 必須 |
| -------------------- | ------------------------ | ------------------------- | ---- |
| VITE_SERVER_URL      | サーバーAPIのベースURL   | http://localhost:3000     | ✅   |
| VITE_LAMBDA_AUTH_URL | Lambda認証APIのベースURL | http://localhost:3000/api | -    |

**URL設定の特徴**:

- **API Gateway**: エンドポイントは `/api` プレフィックス付き
- **環境切り替え**: 開発・本番でURLを変更するだけ
- **AWS統合**: CDKデプロイ時は自動的に適切な設定が適用

## ⚠️ 注意事項

1. **本番環境では必ずHTTPS**を使用してください
2. **Client Secret**は絶対に公開しないでください
3. **適切なスコープ**のみを要求してください
4. **アクセストークン**は安全に保存してください
5. **AWS SAM CLI**が正しくインストールされていることを確認してください
6. **Lambda環境変数**はJSON形式で管理されます

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはISCライセンスの下で公開されています。

## 🆘 サポート

問題が発生した場合は、以下のドキュメントをご確認ください：

### 📖 ドキュメント

- **`SLACK_SETUP.md`**: Slackアプリの詳細な設定手順
- **`packages/lambda/README.md`**: Lambda関数の詳細ドキュメント
- **`packages/cdk/README.md`**: CDKデプロイメントガイド

### ✅ 基本チェックリスト

1. **Slackアプリの設定が正しいか**
2. **Lambda環境変数が正しく設定されているか**（`packages/lambda/env.json`）
3. **Web環境変数が正しく設定されているか**（`packages/web/.env`）
4. **リダイレクトURLが一致しているか**（`/api/auth/slack/callback`）
5. **必要なスコープが設定されているか**
6. **AWS SAM CLIがインストールされているか**

### 🔍 デバッグ方法

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# SAMローカルテスト
npm run sam:local:test

# デバッグモードでSAM起動
npm run sam:dev:debug

# 個別パッケージのデバッグ
cd packages/lambda && npm run lint
cd packages/web && npm run dev
```

### 🌐 外部リソース

- [Slack API Documentation](https://api.slack.com/authentication/oauth-v2)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
