import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cypressCli = path.resolve(scriptDir, "..", "node_modules", "cypress", "bin", "cypress");
const environment = { ...process.env };
delete environment.ELECTRON_RUN_AS_NODE;

const child = spawn(process.execPath, [cypressCli, ...process.argv.slice(2)], {
  cwd: path.resolve(scriptDir, ".."),
  env: environment,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Unable to start Cypress:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
