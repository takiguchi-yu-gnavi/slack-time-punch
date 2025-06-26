// 環境変数から設定を取得
const getServerUrl = () => {
  // Viteでは環境変数にVITE_プレフィックスが必要
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
};

export const config = {
  SERVER_URL: getServerUrl(),
};
