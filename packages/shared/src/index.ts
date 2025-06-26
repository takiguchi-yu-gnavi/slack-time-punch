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
    MOCK_USER_INFO: '/auth/mock-user-info'
  }
} as const;

export const DEFAULT_SERVER_PORT = 3000;
export const DEFAULT_CLIENT_PORT = 5173;
