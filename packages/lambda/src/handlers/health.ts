import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { createResponse } from '../common';

export const healthHandler = {
  health: (_event: APIGatewayProxyEvent, context: Context): APIGatewayProxyResult => {
    console.log('🔍 ヘルスチェック実行');

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
      version: '1.0.0',
      requestId: context.awsRequestId,
    };

    console.log('✅ ヘルスチェック完了:', healthData);
    return createResponse(200, healthData);
  },
};
