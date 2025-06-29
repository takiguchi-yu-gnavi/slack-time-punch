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

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'SlackTimePunchDistribution', {
      comment: 'CloudFront distribution for Slack Time Punch API',
      defaultBehavior: {
        origin: new origins.RestApiOrigin(apiGateway, {
          originPath: '/prod', // API Gateway stage
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Disable caching for API calls
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
