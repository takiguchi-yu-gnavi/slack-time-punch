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

// 設定値をログに出力
console.log('⚙️ Tauri設定値:', {
  SERVER_URL: config.SERVER_URL,
  LAMBDA_AUTH_URL: config.LAMBDA_AUTH_URL,
  TAURI_MODE: config.TAURI_MODE,
  rawEnvValues: {
    VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL as unknown,
    VITE_LAMBDA_AUTH_URL: import.meta.env.VITE_LAMBDA_AUTH_URL as unknown,
  },
});
