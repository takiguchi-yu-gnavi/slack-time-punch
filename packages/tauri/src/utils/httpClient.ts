/**
 * Tauri環境用のHTTPクライアント
 * 標準fetchを使用
 */
export const httpClient = {
  /**
   * GETリクエストを送信
   */
  get: async <T = unknown>(url: string, options?: { headers?: Record<string, string> }): Promise<T> => {
    try {
      console.log('🌐 HTTP GET リクエスト開始:', { url, options });

      const requestOptions: RequestInit = {
        method: 'GET',
      };

      if (options?.headers) {
        requestOptions.headers = options.headers;
      }

      const response = await fetch(url, requestOptions);

      console.log('🌐 HTTP GET レスポンス:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌐 HTTP GET エラーレスポンス:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jsonData = (await response.json()) as T;
      console.log('🌐 HTTP GET 成功:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('🌐 HTTP GET error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`HTTP GET リクエストが失敗しました: ${String(error)}`);
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
      console.log('🌐 HTTP POST リクエスト開始:', { url, data, options });

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

      console.log('🌐 HTTP POST レスポンス:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌐 HTTP POST エラーレスポンス:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jsonData = (await response.json()) as T;
      console.log('🌐 HTTP POST 成功:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('🌐 HTTP POST error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`HTTP POST リクエストが失敗しました: ${String(error)}`);
    }
  },
};
