import { fetch } from '@tauri-apps/plugin-http';

/**
 * Tauri環境用のHTTPクライアント
 * Tauri HTTP プラグインを使用してCORSを回避
 */
export const httpClient = {
  /**
   * GETリクエストを送信
   */
  get: async <T = unknown>(url: string, options?: { headers?: Record<string, string> }): Promise<T> => {
    try {
      const requestOptions: RequestInit = {
        method: 'GET',
      };

      if (options?.headers) {
        requestOptions.headers = options.headers;
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error('HTTP GET error:', error);
      throw error;
    }
  },

  /**
   * POSTリクエストを送信
   */
  post: async <T = unknown>(
    url: string,
    data?: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> => {
    try {
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      };

      if (data) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error('HTTP POST error:', error);
      throw error;
    }
  },
};
