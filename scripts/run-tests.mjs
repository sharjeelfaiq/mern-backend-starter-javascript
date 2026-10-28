import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const files = readdirSync("test")
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => `test/${name}`);
const result = spawnSync(
  process.execPath,
  ["--test", "--test-reporter=tap", ...files],
  { encoding: "utf8", env: process.env },
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
const passed = Number(result.stdout?.match(/^# pass (\d+)$/m)?.[1] ?? 0);
if (result.error) throw result.error;
if (result.status !== 0 || passed === 0) {
  process.stderr.write("Tests failed or no tests executed successfully.\n");
  process.exit(1);
}
