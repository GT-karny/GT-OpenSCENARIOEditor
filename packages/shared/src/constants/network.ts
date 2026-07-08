/**
 * Default development network ports.
 *
 * Single source of truth for runtime code that binds or targets these ports
 * (server listen/CORS, desktop dev URL and fallback). Build-time config files
 * (vite/playwright) intentionally duplicate the literal values with a reference
 * comment instead of importing this module, because those configs are evaluated
 * before `@osce/shared`'s `dist` is guaranteed to exist.
 */

/** Port the backend (`@osce/server`) listens on by default. */
export const DEFAULT_SERVER_PORT = 3001;

/** Port the Vite dev server serves the web frontend on by default. */
export const DEFAULT_WEB_PORT = 5173;
