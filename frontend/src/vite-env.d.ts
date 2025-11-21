/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENOKI_PUBLIC_KEY: string;
    readonly VITE_GOOGLE_KEY: string;
    // Add your other variables here...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
