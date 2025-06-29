import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ApiGateway } from '../constructs/api-gateway';
import { CloudFront } from '../constructs/cloudfront';
import { Lambda } from '../constructs/lambda';
import { Waf } from '../constructs/waf';

export class SlackTimePunchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda functions
    const lambda = new Lambda(this, 'Lambda');

    // Create API Gateway
    const apiGateway = new ApiGateway(this, 'ApiGateway', {
      lambdaFunction: lambda.lambdaFunction,
    });

    // Create WAF
    const waf = new Waf(this, 'Waf');

    // Create CloudFront
    new CloudFront(this, 'CloudFront', {
      apiGateway: apiGateway.apiGateway,
      webAcl: waf.webAcl,
    });
  }
}
