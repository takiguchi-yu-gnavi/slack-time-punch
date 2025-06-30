// Tauri環境用の設定
const getServerUrl = (): string => {
  // Tauriでは環境変数にVITE_プレフィックスが必要
  const serverUrl = import.meta.env.VITE_SERVER_URL as unknown;
  return typeof serverUrl === 'string' && serverUrl ? serverUrl : 'http://localhost:3000';
};

const getLambdaAuthUrl = (): string => {
  // Lambda OAuth認証URL
  const authUrl = import.meta.env.VITE_LAMBDA_AUTH_URL as unknown;
  return typeof authUrl === 'string' && authUrl ? authUrl : `${getServerUrl()}/auth/slack`;
};

export const config = {
  SERVER_URL: getServerUrl(),
  LAMBDA_AUTH_URL: getLambdaAuthUrl(),
  TAURI_MODE: true, // Tauriモードフラグ
};
