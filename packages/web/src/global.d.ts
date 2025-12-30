// Vite の環境変数型と CSS モジュールの型定義
interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}
