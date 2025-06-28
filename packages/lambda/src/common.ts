import https from 'https';

import { APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// SSL/TLS設定の初期化
const initializeSSLSettings = (): void => {
  console.log('🔒 SSL/TLS設定の初期化:', {
    NODE_ENV: process.env.NODE_ENV,
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    DISABLE_SSL_VERIFY: process.env.DISABLE_SSL_VERIFY,
  });

  // 開発環境でSSL証明書エラーを回避するためのaxios設定
  const shouldDisableSSLVerify =
    process.env.NODE_ENV !== 'production' ||
    process.env.DISABLE_SSL_VERIFY === 'true' ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

  if (shouldDisableSSLVerify) {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      timeout: 30000,
    });
    axios.defaults.httpsAgent = httpsAgent;
    console.log('🔧 SSL証明書検証を無効化しました');
  } else {
    console.log('🔒 SSL証明書検証は有効です');
  }
};

// 共通レスポンスヘルパー
const createResponse = (
  statusCode: number,
  body: Record<string, unknown> | string,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  // CORS ヘッダーの設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.CLIENT_URL ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    ...headers,
  };

  return {
    statusCode,
    headers: corsHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
};

// エラーハンドラー
const handleError = (error: unknown, context: string): APIGatewayProxyResult => {
  console.error(`❌ ${context}でエラーが発生:`, error);

  if (error instanceof Error) {
    return createResponse(500, {
      error: 'Internal Server Error',
      message: error.message,
      context,
    });
  }

  return createResponse(500, {
    error: 'Internal Server Error',
    message: 'Unknown error occurred',
    context,
  });
};

// SSL設定を初期化
initializeSSLSettings();

export { createResponse, handleError };
