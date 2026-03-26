/// <reference types="vite/client" />
/// <reference types="../../vite-env.d.ts" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET_HUGGINGFACE_SPACE: string
  readonly VITE_APP_DESKTOP_MACOS_DOWNLOAD_URL?: string
  readonly VITE_APP_DESKTOP_WINDOWS_DOWNLOAD_URL?: string
}
