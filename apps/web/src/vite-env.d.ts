/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SIGNAL_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
