# Docker デプロイメントガイド

## 📋 概要

Slack Time Punch AppのサーバーをDockerコンテナとして実行するためのガイドです。

## 🚀 クイックスタート

### 1. 環境変数の設定

`.env`ファイルを作成して、Slack OAuth設定を記述：

```env
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:3000/auth/slack/callback
SLACK_SCOPES=channels:read,groups:read
SLACK_USER_SCOPES=identify,channels:read,channels:write,groups:read,groups:write
PORT=3000
```

### 2. サーバーの起動

```bash
# スクリプトを使用した起動（推奨）
npm run docker:server

# または手動でコマンド実行
docker-compose -f docker-compose.server.yml up -d
```

### 3. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# レスポンス例
{"status":"OK","timestamp":"2025-06-26T13:30:00.000Z","environment":"development"}
```

## 🛠️ Docker コマンド

### ビルド
```bash
npm run docker:server:build
```

### 起動
```bash
npm run docker:server:up
```

### 停止
```bash
npm run docker:server:down
```

### ログ確認
```bash
npm run docker:server:logs
```

### 再起動（ビルド含む）
```bash
npm run docker:server:restart
```

## 📊 コンテナ監視

### ヘルスチェック

Dockerコンテナには自動ヘルスチェックが設定されています：

- **間隔**: 30秒
- **タイムアウト**: 3秒  
- **リトライ**: 3回
- **開始待機**: 5秒

### ログ監視

```bash
# リアルタイムログ
docker-compose -f docker-compose.server.yml logs -f

# 最新100行
docker-compose -f docker-compose.server.yml logs --tail=100
```

### コンテナ状態確認

```bash
# コンテナ一覧
docker-compose -f docker-compose.server.yml ps

# 詳細情報
docker inspect slack-time-punch-server
```

## 🔧 トラブルシューティング

### 1. ポート競合エラー

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# 既存プロセスを終了
kill <PID>
```

### 2. 環境変数が読み込まれない

- `.env`ファイルがルートディレクトリにあることを確認
- 環境変数の値にスペースや特殊文字が含まれていないか確認

### 3. 共有パッケージのビルドエラー

```bash
# 共有パッケージを手動ビルド
cd packages/shared
npm run build

# Docker イメージを再ビルド
npm run docker:server:build --no-cache
```

### 4. Slack OAuth 認証エラー

- `REDIRECT_URI`が正しく設定されているか確認
- Slack App設定でリダイレクトURLが登録されているか確認

## 🏗️ アーキテクチャ

### マルチステージビルド

1. **shared-build**: 共有パッケージのビルド
2. **server-deps**: サーバー本番依存関係のインストール  
3. **build**: TypeScriptコンパイル
4. **production**: 本番実行イメージ

### セキュリティ機能

- **非rootユーザー**: `nodejs`ユーザーでの実行
- **軽量イメージ**: Alpine Linuxベース
- **レイヤーキャッシュ**: 効率的なイメージビルド

## 🌐 本番環境での実行

### 環境変数の設定

```bash
# .env ファイルではなく、環境変数として設定
export SLACK_CLIENT_ID=your_client_id
export SLACK_CLIENT_SECRET=your_client_secret
export REDIRECT_URI=https://your-domain.com/auth/slack/callback
export NODE_ENV=production
```

### HTTPS対応

```bash
# Nginx や Load Balancer でHTTPS終端
# REDIRECT_URI は https:// を使用
```

### スケーリング

```bash
# レプリカを追加
docker-compose -f docker-compose.server.yml up -d --scale server=3
```
