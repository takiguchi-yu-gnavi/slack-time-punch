import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { createResponse, handleError } from './common';
import { authHandler } from './handlers/auth';
import { healthHandler } from './handlers/health';

// ルーティング定義
interface RouteHandler {
  method: string;
  path: string;
  handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult> | APIGatewayProxyResult;
}

const routes: RouteHandler[] = [
  // 認証関連
  { method: 'GET', path: '/auth/slack', handler: authHandler.slackAuth },
  { method: 'GET', path: '/auth/slack/callback', handler: authHandler.slackCallback },
  { method: 'GET', path: '/auth/user-info', handler: authHandler.getUserInfo },
  { method: 'POST', path: '/auth/user-info', handler: authHandler.getUserInfo }, // POSTメソッドも追加
  { method: 'POST', path: '/auth/refresh', handler: authHandler.refreshToken },
  { method: 'POST', path: '/auth/logout', handler: authHandler.logout },
  { method: 'GET', path: '/auth/channels', handler: authHandler.getChannels },
  { method: 'POST', path: '/auth/post-message', handler: authHandler.postMessage },

  // ヘルスチェック
  { method: 'GET', path: '/health', handler: healthHandler.health },
];

// ルートマッチング関数
const findRoute = (method: string, path: string): RouteHandler | undefined => {
  return routes.find((route) => route.method === method && route.path === path);
};

// メインのLambdaハンドラー
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('📥 リクエスト受信:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    // CORS プリフライトリクエストの処理
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'OK' });
    }

    // ルートページ - クライアントアプリケーションにリダイレクト
    if (event.httpMethod === 'GET' && event.path === '/') {
      const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
      const queryString = event.queryStringParameters
        ? `?${Object.entries(event.queryStringParameters)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`)
            .join('&')}`
        : '';
      const redirectUrl = `${clientUrl}${queryString}`;

      console.log(`🔗 クライアントにリダイレクト: ${redirectUrl}`);

      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl,
          'Access-Control-Allow-Origin': process.env.CLIENT_URL ?? '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: '',
      };
    }

    // ルートハンドラーを検索
    const route = findRoute(event.httpMethod, event.path);

    if (!route) {
      console.log(`❌ ルートが見つかりません: ${event.httpMethod} ${event.path}`);
      return createResponse(404, {
        error: 'エンドポイントが見つかりません',
        method: event.httpMethod,
        path: event.path,
      });
    }

    // ハンドラーを実行
    console.log(`🎯 ルートハンドラーを実行: ${route.method} ${route.path}`);
    return await route.handler(event, context);
  } catch (error) {
    return handleError(error, 'メインハンドラー');
  }
};
