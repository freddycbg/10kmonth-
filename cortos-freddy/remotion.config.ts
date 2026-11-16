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
// Busca la versión instalada (cambia al renovarse el contenedor).
const PW = "/opt/pw-browsers";
const shellDir = fs.existsSync(PW) ? fs.readdirSync(PW).find((d) => d.startsWith("chromium_headless_shell-")) : undefined;
const shell = shellDir
  ? ["chrome-linux/headless_shell", "chrome-headless-shell-linux64/chrome-headless-shell"]
      .map((p) => `${PW}/${shellDir}/${p}`)
      .find((p) => fs.existsSync(p))
  : undefined;
if (shell) {
  Config.setBrowserExecutable(shell);
}
