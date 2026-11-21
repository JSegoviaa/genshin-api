interface ImportMetaEnv {
  readonly PUBLIC_API_URL?: string;
  readonly IMAGES_BASE_URL?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
