import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface CloudFrontProps {
  apiGateway: apigateway.RestApi;
  webBucket: s3.Bucket;
  webAcl: wafv2.CfnWebACL;
}

export class CloudFront extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontProps) {
    super(scope, id);

    const { apiGateway, webBucket, webAcl } = props;

    // Origin Access Control for S3 (OAC - 新しい推奨方式)
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: 'OAC for Slack Time Punch Web Bucket',
    });

    // S3 Origin with OAC
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(webBucket, {
      originAccessControl,
    });

    // Create custom Origin Request Policy for API Gateway
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'ApiGatewayOriginRequestPolicy', {
      originRequestPolicyName: 'slack-time-punch-api-origin-request-policy',
      comment: 'Origin request policy for API Gateway to forward query strings and headers',
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'Content-Type',
        'X-Forwarded-For',
        'X-Forwarded-Host',
        'User-Agent',
        'Accept',
        'Accept-Language',
        'Referer'
      ),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
    });

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'SlackTimePunchDistribution', {
      comment: 'CloudFront distribution for Slack Time Punch Web App and API',
      defaultBehavior: {
        // デフォルトは静的ファイル (S3) を配信 - キャッシュ無効化
        origin: s3Origin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // AWS管理のキャッシュ無効化ポリシー
        compress: true,
      },
      additionalBehaviors: {
        // API パスは API Gateway に転送 - キャッシュ完全無効化
        '/api/*': {
          origin: new origins.RestApiOrigin(apiGateway, {
            originPath: '/prod', // API Gateway stage
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // AWS管理のキャッシュ無効化ポリシー
          originRequestPolicy, // API 用のオリジンリクエストポリシー
        },
      },
      // SPA のルーティング対応: 404 エラーを index.html にリダイレクト
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      webAclId: webAcl.attrArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });
  }
}
