import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class S3Bucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Web サイト用 S3 バケットを作成
    this.bucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: `slack-time-punch-web-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA のため 404 も index.html にリダイレクト
      publicReadAccess: false, // CloudFront 経由でのみアクセス可能
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用のため削除可能
      autoDeleteObjects: true, // バケット削除時にオブジェクトも自動削除
      versioned: false,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 300,
        },
      ],
    });

    // Web アプリのビルド成果物をデプロイ
    new s3deploy.BucketDeployment(this, 'WebDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../../web/dist'))],
      destinationBucket: this.bucket,
      prune: true, // 古いファイルを削除
      retainOnDelete: false, // Stack 削除時にファイルも削除
    });

    // Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket name for web assets',
    });

    new cdk.CfnOutput(this, 'S3BucketWebsiteURL', {
      value: this.bucket.bucketWebsiteUrl,
      description: 'S3 Bucket website URL',
    });
  }
}
