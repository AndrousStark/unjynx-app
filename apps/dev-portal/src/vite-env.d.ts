/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GRAFANA_URL: string;
  readonly VITE_LOGTO_AUTHORITY: string;
  readonly VITE_LOGTO_CLIENT_ID: string;
  readonly VITE_LOGTO_REDIRECT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
