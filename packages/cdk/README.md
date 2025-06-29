# Slack Time Punch - CDK Infrastructure

このパッケージは、Slack Time Punch アプリケーションのAWSインフラストラクチャを定義するCDKプロジェクトです。

## アーキテクチャ

```
Internet → WAF → CloudFront → API Gateway → Lambda
```

### 構成コンポーネント

- **WAF (Web Application Firewall)**
  - IP制限: `163.116.128.0/17` のみを許可
  - AWS Managed Rules でセキュリティ強化
- **CloudFront**
  - API Gateway をオリジンとするCDN
  - WAF をアタッチしてセキュリティ強化
  - HTTPSリダイレクト強制
- **API Gateway**
  - RESTful API エンドポイント
  - Lambda プロキシ統合
  - CORS設定済み
- **Lambda**
  - Node.js 22.x ランタイム
  - `packages/lambda` のコードをデプロイ

## セットアップ

### 前提条件

- Node.js 22.x 以上
- AWS CLI設定済み
- AWS CDK CLI (`npm install -g aws-cdk`)

### インストール

```bash
# ルートディレクトリから
npm install

# または、このパッケージのみ
cd packages/cdk
npm install
```

## デプロイ方法

### npmスクリプト経由（推奨）

```bash
# ルートディレクトリから
npm run cdk:build    # TypeScriptビルド
npm run cdk:synth    # CloudFormationテンプレート生成
npm run cdk:deploy   # デプロイ
npm run cdk:destroy  # 削除
npm run cdk:diff     # 差分確認

# プロファイル指定する場合
npm run cdk:deploy -- --profile your-profile
npm run cdk:synth -- --profile your-profile
npm run cdk:destroy -- --profile your-profile
```

### CDKコマンド直接実行

```bash
cd packages/cdk

# ビルド
npm run build

# 基本的なCDKコマンド（デフォルトプロファイル）
npx cdk synth
npx cdk deploy
npx cdk destroy
npx cdk diff

# プロファイル指定
npx cdk synth --profile your-profile
npx cdk deploy --profile your-profile
npx cdk destroy --profile your-profile
npx cdk diff --profile your-profile

# 初回セットアップ（CDK Bootstrapが必要な場合）
npx cdk bootstrap --profile your-profile \
   --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' \
   --qualifier devcmn
```

### Lambda ビルド

CDKをデプロイする前に、Lambdaコードをビルドしてください：

```bash
cd packages/lambda
npm run build
```

### デプロイ

```bash
cd packages/cdk

# 初回のみ: CDK Bootstrap
npm run bootstrap

# スタックのシンセサイズ（テンプレート生成）
npm run synth

# デプロイ
npm run deploy
```

## コマンド

| コマンド          | 説明                             |
| ----------------- | -------------------------------- |
| `npm run build`   | TypeScriptコードをビルド         |
| `npm run watch`   | ファイル変更を監視してビルド     |
| `npm run synth`   | CloudFormationテンプレートを生成 |
| `npm run deploy`  | スタックをデプロイ               |
| `npm run destroy` | スタックを削除                   |
| `npm run diff`    | 現在のスタックとの差分を表示     |
| `npm run lint`    | コードをリント                   |
| `npm run format`  | コードをフォーマット             |

## 環境変数

必要に応じて以下の環境変数を設定してください：

```bash
export CDK_DEFAULT_ACCOUNT=123456789012  # AWSアカウントID
export CDK_DEFAULT_REGION=ap-northeast-1 # デプロイリージョン
```

## セキュリティ

- **IP制限**: WAFで指定されたIPアドレス範囲からのみアクセス可能
- **HTTPS強制**: CloudFrontでHTTPSリダイレクトを設定
- **AWS Managed Rules**: WAFで一般的な攻撃パターンをブロック

## モニタリング

- CloudWatch Logs で Lambda とAPI Gateway のログを監視
- CloudWatch メトリクスで各サービスの監視が可能
- WAF メトリクスでセキュリティ状況を監視

## トラブルシューティング

### Lambda デプロイエラー

Lambda コードが見つからない場合：

```bash
cd packages/lambda
npm run build
```

### WAF エラー

CloudFront用のWAFは `us-east-1` リージョンにデプロイする必要があります。現在の設定では自動的に適切なリージョンが選択されます。

## 削除

```bash
npm run destroy
```

**注意**: 削除時は依存関係の順序に注意してください。CloudFrontディストリビューションの削除には時間がかかる場合があります。
