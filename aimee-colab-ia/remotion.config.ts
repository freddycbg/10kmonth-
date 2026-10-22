/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import fs from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// El entorno en la nube no puede descargar Chrome Headless Shell desde remotion.media;
// usa el headless shell de Playwright ya instalado en el contenedor.
const PLAYWRIGHT_HEADLESS_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(PLAYWRIGHT_HEADLESS_SHELL)) {
  Config.setBrowserExecutable(PLAYWRIGHT_HEADLESS_SHELL);
}
