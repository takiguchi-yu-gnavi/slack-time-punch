import * as fs from 'fs';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface EnvConfig {
  SlackTimePunchFunction: Record<string, string>;
}

export class Lambda extends Construct {
  public readonly lambdaFunction: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Load environment variables from env.json
    const envPath = path.join(__dirname, '../../../lambda/env.production.json');
    const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8')) as EnvConfig;
    const lambdaEnvVars = envConfig.SlackTimePunchFunction;

    // Create IAM role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Slack Time Punch Lambda function',
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/slack-time-punch-function`,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    this.lambdaFunction = new nodejs.NodejsFunction(this, 'SlackTimePunchFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../../lambda/src/index.ts'),
      functionName: 'slack-time-punch-function',
      description: 'Slack Time Punch API Lambda function',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logGroup,
      environment: lambdaEnvVars,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2022',
        keepNames: true,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Add permissions for Lambda to write to CloudWatch Logs
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [`${logGroup.logGroupArn}:*`],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
