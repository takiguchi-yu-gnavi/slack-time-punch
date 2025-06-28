# Slack Time Punch Lambda

AWS Lambda + API Gateway構成でのSlack Time Punchアプリケーションのバックエンド部分です。

## 📁 プロジェクト構成

```bash
packages/lambda/
├── src/
│   ├── index.ts              # メインのLambdaハンドラー
│   ├── common.ts             # 共通ユーティリティ
│   ├── handlers/
│   │   ├── auth.ts           # 認証関連ハンドラー
│   │   └── health.ts         # ヘルスチェックハンドラー
│   ├── services/
│   │   └── slackAuth.ts      # Slack認証サービス
│   └── utils/
│       └── stateManager.ts   # OAuth stateパラメータ管理
├── template.yaml             # AWS SAMテンプレート
├── package.json
├── tsconfig.json
└── env.example.json         # 環境変数の例
```

## 🚀 開発環境セットアップ

### 1. 依存関係のインストール

```bash
cd packages/lambda
npm install
```

### 2. 環境変数の設定

**⚠️ セキュリティ重要**: Slack の認証情報は秘匿情報です。

```bash
# 1. env.example.json をコピーして env.json を作成
cp env.example.json env.json

# 2. env.json ファイルを編集してSlackアプリの認証情報を設定
# - SLACK_CLIENT_ID: SlackアプリのClient ID
# - SLACK_CLIENT_SECRET: SlackアプリのClient Secret
```

**📋 env.json ファイルの例:**
```json
{
  "SlackTimePunchFunction": {
    "SLACK_CLIENT_ID": "1234567890.1234567890",
    "SLACK_CLIENT_SECRET": "abcdef1234567890abcdef1234567890",
    "NODE_ENV": "development",
    "CLIENT_URL": "http://localhost:5173",
    "REDIRECT_URI": "http://localhost:3000/auth/slack/callback",
    "SLACK_SCOPES": "channels:read,groups:read",
    "SLACK_USER_SCOPES": "identify,channels:read,groups:read,chat:write"
  }
}
```

**📖 各環境変数の説明:**
- `NODE_ENV`: 実行環境 (development/staging/production)
- `CLIENT_URL`: フロントエンドアプリケーションのURL
- `REDIRECT_URI`: Slack OAuth認証後のリダイレクト先URL
- `SLACK_CLIENT_ID`: SlackアプリのClient ID（Slack App管理画面で取得）
- `SLACK_CLIENT_SECRET`: SlackアプリのClient Secret（Slack App管理画面で取得）
- `SLACK_SCOPES`: Slackアプリが要求するアプリレベルのスコープ
- `SLACK_USER_SCOPES`: Slackアプリが要求するユーザーレベルのスコープ

**🔒 セキュリティ:**
- `env.json` は `.gitignore` に含まれており、Git にコミットされません
- `env.example.json` をテンプレートとして使用してください
- 本番環境では AWS Systems Manager Parameter Store や AWS Secrets Manager を使用してください

### 3. TypeScriptビルド

```bash
npm run build
```

## 🛠️ ローカル開発

### AWS SAMを使用したローカル開発

```bash
# SAMビルド
npm run sam:build

# ローカルでAPI Gateway + Lambdaを起動（ポート3000）
npm run sam:local
```

これで `http://localhost:3000` でAPIサーバーが起動します。

### 利用可能なエンドポイント

- `GET /` - クライアントアプリへのリダイレクト
- `GET /health` - ヘルスチェック
- `GET /auth/slack` - Slack OAuth認証開始
- `GET /auth/slack/callback` - Slack OAuth認証コールバック
- `GET /auth/user` - ユーザー情報取得（未実装）
- `POST /auth/refresh` - トークンリフレッシュ（未実装）
- `POST /auth/logout` - ログアウト（未実装）
- `GET /auth/channels` - チャンネル一覧取得（未実装）
- `POST /auth/punch` - タイムパンチ投稿（未実装）

## 🏗️ AWS環境へのデプロイ

## 🚀 デプロイメント

### CDKでのデプロイ（推奨）

本プロジェクトでは、CDKパッケージから統合デプロイを行います：

```bash
cd packages/cdk
npm run deploy
```

**注意**: `sam deploy` は使用しません。すべてのAWSリソースはCDKで管理されます。

## 🔧 開発コマンド

```bash
# TypeScriptビルド
npm run build

# ビルド結果のクリーンアップ
npm run clean

# ESLintによるコード検査
npm run lint
npm run lint:fix

# Prettierによるコードフォーマット
npm run format
npm run format:check

# SAM関連
npm run sam:build    # SAMビルド
npm run sam:local    # ローカルAPI起動
```

## 🔒 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NODE_ENV` | 実行環境 | `development` |
| `CLIENT_URL` | クライアントアプリのURL | `http://localhost:5173` |
| `SLACK_CLIENT_ID` | Slack OAuth Client ID | - |
| `SLACK_CLIENT_SECRET` | Slack OAuth Client Secret | - |
| `REDIRECT_URI` | OAuth認証後のリダイレクトURI | - |
| `SLACK_SCOPES` | Slack ボットスコープ | `commands,incoming-webhook,chat:write` |
| `SLACK_USER_SCOPES` | Slack ユーザースコープ | `channels:read,chat:write,identify` |
| `DISABLE_SSL_VERIFY` | SSL証明書検証の無効化 | `true` |

## 📋 実装状況

### ✅ 完了している機能

- [x] `GET /` - クライアントアプリへのリダイレクト
- [x] `GET /health` - ヘルスチェック
- [x] `GET /auth/slack` - Slack OAuth認証開始
- [x] `GET /auth/slack/callback` - Slack OAuth認証コールバック
- [x] `GET /auth/user?token=<user_token>` - ユーザー情報取得
- [x] `POST /auth/refresh` - トークンリフレッシュ（有効性確認）
- [x] `POST /auth/logout` - ログアウト
- [x] `GET /auth/channels?token=<user_token>` - チャンネル一覧取得
- [x] `POST /auth/punch` - タイムパンチ投稿

### 🔧 実装済みの主要な機能

1. **OAuth認証フロー** - 完全にSlack OAuth v2に対応
2. **トークン管理** - セキュアなstateパラメータ管理
3. **API統合** - Slack Web APIとの完全統合
4. **エラーハンドリング** - 包括的なエラー処理
5. **CORS対応** - クロスオリジンリクエスト対応
6. **型安全性** - TypeScript strictモード対応

## 🧪 ローカルテスト方法

### 1. 環境変数の設定

```bash
# env.jsonファイルを編集して実際のSlack OAuth情報を設定
cp env.json.example env.json
# 以下の値を実際の値に変更してください：
# - SLACK_CLIENT_ID
# - SLACK_CLIENT_SECRET
```

### 2. ローカルサーバーの起動

```bash
# ビルド
npm run build

# SAMローカル起動
npm run sam:build
npm run sam:local
```

### 3. 動作テスト

```bash
# ヘルスチェック
curl http://localhost:3000/health

# OAuth認証開始（ブラウザで実行）
# http://localhost:3000/auth/slack

# その他のAPIテスト（トークンが必要）
curl "http://localhost:3000/auth/user?token=YOUR_USER_TOKEN"
curl "http://localhost:3000/auth/channels?token=YOUR_USER_TOKEN"
```

## 🚨 注意事項

- 現在のコードにはESLintエラーが存在します（主に型安全性の警告）
- 本番環境では適切な型定義とエラーハンドリングの改善が推奨されます
- Slack APIのレスポンス構造に変更があった場合は型定義の更新が必要です

## 📊 API エンドポイント詳細

### `GET /auth/user`
**説明**: 認証済みユーザーの情報を取得
**パラメータ**: `token` (query parameter)
**レスポンス例**:
```json
{
  "success": true,
  "user": {
    "id": "U1234567890",
    "name": "user.name",
    "team_id": "T1234567890",
    "team_name": "Example Team"
  },
  "token_info": {
    "is_permanent": true
  }
}
```

### `GET /auth/channels`
**説明**: ユーザーがアクセス可能なチャンネル一覧を取得
**パラメータ**: `token` (query parameter)
**レスポンス例**:
```json
{
  "success": true,
  "channels": [
    {
      "id": "C1234567890",
      "name": "general",
      "is_private": false,
      "is_member": true
    }
  ],
  "count": 1
}
```

### `POST /auth/punch`
**説明**: タイムパンチメッセージをSlackチャンネルに投稿
**リクエストボディ**:
```json
{
  "token": "user_token_here",
  "channelId": "C1234567890",
  "message": "出勤しました",
  "punchType": "clock_in"
}
```
**レスポンス例**:
```json
{
  "success": true,
  "message": "タイムパンチを投稿しました",
  "data": {
    "channelId": "C1234567890",
    "punchType": "clock_in",
    "timestamp": "2025/06/29 10:00:00"
  }
}
```
