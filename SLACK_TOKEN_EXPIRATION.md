# Slackトークンの有効期限について

## 調査結果

### 1. Slackトークンの有効期限の仕様

**重要な発見：**
- **デフォルトのSlackトークンは無期限**：Token Rotationを有効にしない限り、Slackの OAuth v2 トークンには有効期限がありません
- **Token Rotationを有効にした場合のみ12時間の有効期限**：Token Rotationを有効にすると、アクセストークンは12時間で期限切れになり、refresh tokenを使った更新が必要になります

### 2. auth.testメソッドのexpires_in

- `auth.test`のレスポンスに`expires_in`が含まれるのは、**Token Rotationが有効な場合のみ**
- Token Rotationが無効な通常のアプリでは、`expires_in`フィールドは返されません

### 3. 現在の実装状況

#### 実装済み機能

1. **型定義の更新** (`src/types/slack.ts`)
   - `TokenExpiryInfo`インターフェースに`is_permanent`フィールドを追加
   - 永続的なトークンと有効期限付きトークンの両方に対応

2. **サーバー側の処理** (`src/routes/auth.ts`)
   - `/auth/user-info`エンドポイントでexpires_inの有無を確認
   - expires_inが存在する場合：12時間の有効期限情報を計算・返却
   - expires_inが存在しない場合：`is_permanent: true`を返却

3. **Reactコンポーネント** (`src/client/components/TokenExpiryInfo.tsx`)
   - 永続的なトークンの場合：「永続的なトークン」と表示
   - 有効期限付きトークンの場合：残り時間と有効期限日時を表示
   - 有効期限が近い場合の警告表示（24時間以内、1時間以内）

4. **開発・テスト用機能**
   - `/auth/mock-user-info`エンドポイントで両方のケースをテスト可能
   - 開発環境で永続・有効期限付きトークンの表示をテスト可能

#### UI表示

**永続的なトークンの場合：**
```
♾️ 認証トークン状態
永続的なトークン
このトークンは有効期限がありません。
手動で取り消すか、アプリを削除するまで有効です。
```

**有効期限付きトークンの場合：**
```
🕐 認証トークン有効期限
残り: 0日 12時間
有効期限: 2025/6/26 12:35:35
```

## Token Rotationの有効化方法

### Slack App設定での有効化

1. **Slack App Management**にアクセス
   - https://api.slack.com/apps
   - 対象のアプリを選択

2. **OAuth & Permissions**セクション
   - "Token Rotation"の設定を探す
   - "Enable Token Rotation"をONにする

3. **注意事項**
   - 一度有効にすると無効化できません
   - 既存のトークンは最初の更新時に12時間の有効期限が設定されます
   - refresh tokenを使った定期的な更新処理の実装が必要になります

### Token Rotation対応の実装が必要な場合

Token Rotationを有効にする場合は、以下の追加実装が必要です：

1. **oauth.v2.exchange**の実装
   - 既存の長期トークンを有効期限付きトークンとrefresh tokenに交換

2. **定期的なトークン更新処理**
   - 12時間以内にrefresh tokenを使ってトークンを更新
   - バックグラウンドジョブやスケジューラーの実装

3. **refresh token の安全な保存**
   - データベースや安全なストレージにrefresh tokenを保存

## 推奨アプローチ

### 現在の設定を維持する場合（推奨）

- Token Rotationを有効にせず、永続的なトークンを使用
- 実装がシンプルで、追加の更新処理が不要
- セキュリティ面で若干の懸念があるが、個人用アプリなら十分

### Token Rotationを有効にする場合

- より高いセキュリティを求める場合
- エンタープライズ環境や本格的な商用アプリの場合
- 12時間ごとの自動更新処理の実装が必要

## テスト方法

開発環境では以下のテストが可能です：

1. **永続トークンのテスト**
   ```bash
   curl "http://localhost:3000/auth/mock-user-info?type=permanent"
   ```

2. **有効期限付きトークンのテスト**
   ```bash
   curl "http://localhost:3000/auth/mock-user-info?type=expiring"
   ```

3. **UI でのテスト**
   - 認証前の画面で「トークン有効期限テスト」ボタンを使用
   - 両方のケースの表示を確認可能
