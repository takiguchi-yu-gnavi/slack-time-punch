# Slackアプリ設定ガイド

このドキュメントでは、Slack OAuth認証アプリと連携するためのSlackアプリの詳細な設定方法を説明します。

## 📱 Slackアプリの作成手順

### 1. Slack API ダッシュボードにアクセス

1. [https://api.slack.com/apps](https://api.slack.com/apps) にアクセス
2. Slackアカウントでログイン
3. **"Create New App"** ボタンをクリック

### 2. アプリの基本設定

1. **"From scratch"** を選択
2. アプリ情報を入力：
   - **App Name**: `Time Punch OAuth App` （または任意の名前）
   - **Pick a workspace**: 開発用のワークスペースを選択
3. **"Create App"** をクリック

### 3. OAuth & Permissions の設定

#### 3.1 Redirect URLs の設定

1. 左メニューから **"OAuth & Permissions"** を選択
2. **"Redirect URLs"** セクションで **"Add New Redirect URL"** をクリック
3. 以下のURLを追加：
   ```
   http://localhost:3000/auth/slack/callback
   ```
4. 本番環境の場合は、HTTPSのURLを追加：
   ```
   https://yourdomain.com/auth/slack/callback
   ```

#### 3.2 Scopes の設定

**Bot Token Scopes** セクションで以下のスコープを追加：

- `chat:write` - メッセージの投稿
- `commands` - スラッシュコマンドの使用
- `incoming-webhook` - Webhook経由でのメッセージ送信
- `users:read` - ユーザー情報の読み取り（オプション）
- `channels:read` - チャンネル一覧の取得（オプション）

**User Token Scopes**（必要に応じて）：
- `identify` - ユーザーの基本情報取得

### 4. App Credentials の取得

1. **"Basic Information"** タブに移動
2. **"App Credentials"** セクションから以下の情報をコピー：
   - **Client ID**
   - **Client Secret** （"Show"ボタンをクリック）

### 5. 環境変数への設定

取得した情報を `.env` ファイルに設定：

```env
SLACK_CLIENT_ID=1234567890.1234567890123
SLACK_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
REDIRECT_URI=http://localhost:3000/auth/slack/callback
SLACK_SCOPES=commands,incoming-webhook,chat:write
PORT=3000
```

**スコープのカスタマイズ**

`SLACK_SCOPES`環境変数で、アプリが要求するSlackスコープを設定できます：

- **基本設定（推奨）**: `commands,incoming-webhook,chat:write`
- **拡張設定**: `commands,incoming-webhook,chat:write,users:read,channels:read`
- **最小設定**: `incoming-webhook`

よく使用されるスコープ：
- `chat:write` - メッセージの送信
- `commands` - スラッシュコマンドの使用
- `incoming-webhook` - Webhookでのメッセージ送信
- `users:read` - ユーザー情報の読み取り
- `channels:read` - チャンネル一覧の取得
- `files:write` - ファイルのアップロード

## 🔧 追加設定（オプション）

### App Display Information

アプリの見た目を改善するために以下を設定：

1. **"Basic Information"** → **"Display Information"**
2. 設定項目：
   - **App name**: アプリ名
   - **Short description**: 短い説明文
   - **App icon**: アプリアイコン（512x512px推奨）
   - **Background color**: 背景色

### Event Subscriptions

リアルタイムイベントを受信する場合：

1. **"Event Subscriptions"** タブを選択
2. **"Enable Events"** をオンに設定
3. **"Request URL"** に以下を設定：
   ```
   https://yourdomain.com/slack/events
   ```

### Slash Commands

カスタムコマンドを追加する場合：

1. **"Slash Commands"** タブを選択
2. **"Create New Command"** をクリック
3. コマンド情報を入力：
   - **Command**: `/punch` など
   - **Request URL**: `https://yourdomain.com/slack/commands`
   - **Short Description**: コマンドの説明

## 🚀 本番環境への配備

### 1. App Distribution

1. **"Manage Distribution"** タブを選択
2. アプリの配布設定を確認
3. 組織内配布または公開配布を選択

### 2. HTTPS設定

本番環境では必ずHTTPSを使用：

```env
REDIRECT_URI=https://yourdomain.com/auth/slack/callback
```

### 3. セキュリティ設定

- **Signing Secret** を取得して署名検証を実装
- **Token Rotation** を有効化（推奨）

## 🔍 テスト手順

### 1. 開発環境でのテスト

1. アプリを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000` にアクセス

3. **"Slackで認証する"** ボタンをクリック

4. Slackの認証画面で **"許可する"** をクリック

5. 認証成功メッセージが表示されることを確認

### 2. 認証フローの確認

認証が正常に完了すると、以下の情報が取得できます：

```json
{
  "ok": true,
  "access_token": "xoxb-...",
  "token_type": "bot",
  "scope": "commands,incoming-webhook,chat:write",
  "bot_user_id": "U...",
  "app_id": "A...",
  "team": {
    "name": "Your Team",
    "id": "T..."
  },
  "authed_user": {
    "id": "U..."
  }
}
```

## ❗ よくある問題と解決方法

### 1. `invalid_client_id` エラー

- **原因**: Client IDが間違っている
- **解決方法**: `.env`ファイルのSLACK_CLIENT_IDを確認

### 2. `bad_redirect_uri` エラー

- **原因**: リダイレクトURLが一致しない
- **解決方法**: SlackアプリとREDIRECT_URIの設定を一致させる

### 3. `invalid_scope` エラー

- **原因**: 設定されていないスコープを要求している
- **解決方法**: Slackアプリでスコープを追加

### 4. `access_denied` エラー

- **原因**: ユーザーが認証をキャンセルした
- **解決方法**: 再度認証を試すか、ユーザーに説明

## 📞 サポート

- [Slack API Documentation](https://api.slack.com/authentication/oauth-v2)
- [Slack Developer Community](https://slackcommunity.com/)
- [Slack API Troubleshooting](https://api.slack.com/authentication/oauth-v2#troubleshooting)
