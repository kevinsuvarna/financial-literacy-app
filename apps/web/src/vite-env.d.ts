/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Where apps/api is running, e.g. http://localhost:8787. Leave it unset and the game makes
   * no requests at all: progress simply stays on the device.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
