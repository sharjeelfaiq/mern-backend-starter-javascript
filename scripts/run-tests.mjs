import { spawnSync } from "node:child_process";

const args = [
  ...(process.argv.includes("--coverage") ? ["--experimental-test-coverage"] : []),
  "--test",
  "--test-reporter=tap",
  "test/integration.test.js",
];
const result = spawnSync(process.execPath, args, { encoding: "utf8", env: process.env });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
const passed = Number(result.stdout?.match(/^# pass (\d+)$/m)?.[1] ?? 0);
if (result.error) throw result.error;
if (result.status !== 0 || passed === 0) {
  process.stderr.write("Tests failed or no tests executed successfully.\n");
  process.exit(1);
}
