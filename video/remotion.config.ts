import fs from "node:fs";
// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// El entorno en la nube no puede descargar Chrome Headless Shell desde remotion.media;
// usa el headless shell de Playwright ya instalado en el contenedor.
const PLAYWRIGHT_HEADLESS_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(PLAYWRIGHT_HEADLESS_SHELL)) {
  Config.setBrowserExecutable(PLAYWRIGHT_HEADLESS_SHELL);
}
