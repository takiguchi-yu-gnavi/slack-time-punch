// Tauri環境用の設定
const getServerUrl = (): string => {
  // Tauriでは環境変数にVITE_プレフィックスが必要
  return import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000';
};

export const config = {
  SERVER_URL: getServerUrl(),
  TAURI_MODE: true, // Tauriモードフラグ
};
