/**
 * Instruction 20.79-A — bootstrap local commerce foundation.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const run = (cmd: string) => {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
};

run("npm run db:generate");
run("npm run db:push");
run("npm run commerce:seed");
console.log("\n[commerce:bootstrap] OK — démarrez core (3200) et commerce-bff (3210)");
