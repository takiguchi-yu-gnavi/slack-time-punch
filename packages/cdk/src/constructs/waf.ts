import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class Waf extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create IP Set for allowed IPs
    const allowedIpSet = new wafv2.CfnIPSet(this, 'AllowedIpSet', {
      name: 'slack-time-punch-allowed-ips',
      scope: 'CLOUDFRONT',
      ipAddressVersion: 'IPV4',
      addresses: ['163.116.128.0/17'],
      description: 'Allowed IP addresses for Slack Time Punch application',
    });

    // Create Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: 'slack-time-punch-web-acl',
      scope: 'CLOUDFRONT',
      defaultAction: {
        block: {}, // Block by default
      },
      description: 'WAF for Slack Time Punch application with IP restrictions',
      rules: [
        // Rule to allow traffic from specified IP ranges
        {
          name: 'AllowedIpRule',
          priority: 10,
          statement: {
            ipSetReferenceStatement: {
              arn: allowedIpSet.attrArn,
            },
          },
          action: {
            allow: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AllowedIpRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SlackTimePunchWebAcl',
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF Web ACL ID',
    });
  }
}
