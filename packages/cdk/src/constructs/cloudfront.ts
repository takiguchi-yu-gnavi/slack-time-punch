import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface CloudFrontProps {
  apiGateway: apigateway.RestApi;
  webAcl: wafv2.CfnWebACL;
}

export class CloudFront extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontProps) {
    super(scope, id);

    const { apiGateway, webAcl } = props;

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

    // Create custom Cache Policy for API Gateway to handle Authorization header
    const cachePolicy = new cloudfront.CachePolicy(this, 'ApiGatewayCachePolicy', {
      cachePolicyName: 'slack-time-punch-api-cache-policy',
      comment: 'Cache policy for API Gateway to handle Authorization header',
      defaultTtl: cdk.Duration.seconds(0), // No caching
      maxTtl: cdk.Duration.seconds(1),
      minTtl: cdk.Duration.seconds(0),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization'),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'SlackTimePunchDistribution', {
      comment: 'CloudFront distribution for Slack Time Punch API',
      defaultBehavior: {
        origin: new origins.RestApiOrigin(apiGateway, {
          originPath: '/prod', // API Gateway stage
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy, // Use custom cache policy
        originRequestPolicy, // Use custom origin request policy
      },
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
