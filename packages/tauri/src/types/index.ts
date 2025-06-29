// Tauri共通型
export interface TauriResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// reexport共通型
export * from '@slack-time-punch/shared';
