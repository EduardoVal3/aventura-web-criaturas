/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODO_API?: "http";
  readonly VITE_URL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
