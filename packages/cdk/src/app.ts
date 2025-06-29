#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { SlackTimePunchStack } from './stack/slack-time-punch-stack';

const app = new cdk.App();

new SlackTimePunchStack(app, 'SlackTimePunchStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012', // Replace with your account ID
    region: 'us-east-1', // WAF + CloudFront はグローバルサービスなので `us-east-1` を指定する必要がある
  },
  description: 'Slack Time Punch application infrastructure',
  tags: {
    Env: 'dev',
    Name: 'SlackTimePunch',
    Owner: 'takiguchi-yu',
  },
});

app.synth();
