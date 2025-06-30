import { useEffect } from 'react';

/**
 * デバッグ用のヘルパー関数とコンポーネント
 */

// Rustのコンソールにログを出力
export const logToRust = async (message: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('log_to_console', { message });
    }
  } catch (error) {
    console.error('Rustログ出力エラー:', error);
  }
};

// 開発者ツールを開く
export const openDevTools = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_devtools');
      console.log('✅ 開発者ツールを開きました');
    }
  } catch (error) {
    console.error('開発者ツール起動エラー:', error);
  }
};

/**
 * デバッグ用のコンポーネント
 * 本番ビルドでもデバッグ情報を表示
 */
export const DebugPanel = (): JSX.Element => {
  useEffect(() => {
    // 起動時にRustログに出力
    void logToRust('🚀 DebugPanel mounted');
  }, []);

  const handleOpenDevTools = (): void => {
    console.log('📱 デバッグパネルから開発者ツールを開く試行...');
    void openDevTools();
  };

  const handleLogTest = (): void => {
    const message = `📊 Test log at ${new Date().toLocaleTimeString()}`;
    console.log(message);
    void logToRust(message);
  };

  const handleShowDebugInfo = (): void => {
    const info = {
      isTauri: '__TAURI__' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString(),
    };
    console.log('🔍 Debug Info:', info);
    void logToRust(`🔍 Debug Info: ${JSON.stringify(info)}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        border: '1px solid #333',
        maxWidth: '200px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔧 Debug Panel v2</div>
      <button
        onClick={handleOpenDevTools}
        style={{
          padding: '6px 12px',
          fontSize: '11px',
          background: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        🛠️ DevTools
      </button>
      <button
        onClick={handleLogTest}
        style={{
          padding: '6px 12px',
          fontSize: '11px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        📋 Test Log
      </button>
      <button
        onClick={handleShowDebugInfo}
        style={{
          padding: '6px 12px',
          fontSize: '11px',
          background: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        🔍 Debug Info
      </button>
      <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>💡 ログはコンソール & ターミナルで確認</div>
    </div>
  );
};
