import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './styles/index.css';

// Tauri deep linkプラグインと開発者ツールの初期化
const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Tauri アプリケーション初期化開始');

    // 開発者ツール用のグローバル関数をウィンドウに追加
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      interface WindowWithDevTools extends Window {
        openDevTools?: () => Promise<void>;
        logToRust?: (message: string) => Promise<void>;
      }

      const windowWithDevTools = window as WindowWithDevTools;
      const { invoke } = await import('@tauri-apps/api/core');

      // 開発者ツールを開く関数
      windowWithDevTools.openDevTools = async (): Promise<void> => {
        try {
          const result = await invoke('open_devtools');
          console.log('🛠️ 開発者ツール結果:', result);
        } catch (error) {
          console.log('❌ 開発者ツールの起動に失敗しました:', error);
        }
      };

      // Rustログに出力する関数
      windowWithDevTools.logToRust = async (message: string): Promise<void> => {
        try {
          await invoke('log_to_console', { message });
        } catch (error) {
          console.log('❌ Rustログ出力に失敗しました:', error);
        }
      };

      // 初期メッセージをRustログに送信
      await windowWithDevTools.logToRust('🌟 [JavaScript] アプリケーション初期化完了');

      console.log('ℹ️ デバッグコマンド:');
      console.log('  - window.openDevTools() : 開発者ツールを開く');
      console.log('  - window.logToRust("message") : Rustログに出力');
      console.log('� Tauriログはターミナル/コンソールで確認してください');
    } else {
      console.log('⚠️ Tauri環境ではありません（ブラウザモード）');
    }
  } catch (error) {
    console.error('❌ アプリケーション初期化に失敗:', error);
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// アプリケーションを初期化してからレンダリング
void initializeApp();
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
