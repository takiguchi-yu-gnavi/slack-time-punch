/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_SERVER_URL?: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
