interface ImportMetaEnv {
  readonly PUBLIC_API_URL?: string;
  readonly IMAGES_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
