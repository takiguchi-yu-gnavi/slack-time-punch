// 共有型定義のエクスポート
export * from './types';

// 共通ユーティリティ関数（将来使用）
export const API_ENDPOINTS = {
  AUTH: {
    SLACK: '/auth/slack',
    CALLBACK: '/auth/slack/callback',
    STATUS: '/auth/status',
    USER_INFO: '/auth/user-info',
    CHANNELS: '/auth/channels',
    POST_MESSAGE: '/auth/post-message',
    TOKEN_ROTATION_STATUS: '/auth/token-rotation-status',
    MOCK_USER_INFO: '/auth/mock-user-info',
  },
} as const;

export const DEFAULT_SERVER_PORT = 3000;
export const DEFAULT_CLIENT_PORT = 5173;

// 環境変数から設定を取得するヘルパー関数
export const getHostConfig = () => {
  // 完全なURLを直接使用
  const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${DEFAULT_CLIENT_PORT}`;
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${DEFAULT_SERVER_PORT}`;

  return {
    CLIENT_URL,
    SERVER_URL,
  };
};
