// Copies each fixture into a fresh git repo per run, so graders can diff the agent's changes.
//
//   node evals/prepare.mjs <outDir> [condition[:model[:fixture,...]] ...]
//
// Prints a JSON array of runs: { id, dir, fixture, condition, model, request, reply }.

import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSetupPrompt } from "../prompts/setup-prompt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "evals.json"), "utf8"));
const [outDir, ...variants] = process.argv.slice(2);
if (!outDir) throw new Error("usage: node evals/prepare.mjs <outDir> [condition[:model] ...]");
const runs = [];
const dashboardPrompt = renderSetupPrompt({ formId: config.formId });

for (const variant of variants.length ? variants : ["skill", "prompt", "baseline"]) {
  // condition[:model][:fixture,fixture] — the third part limits the run to those fixtures
  const [condition, model = "default", only] = variant.split(":");
  const onlyFixtures = only ? only.split(",") : null;
  for (const c of config.cases) {
    if (onlyFixtures && !onlyFixtures.includes(c.fixture)) continue;
    const id = `${c.fixture}__${condition}__${model}`;
    const dir = join(outDir, id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    cpSync(join(here, "fixtures", c.fixture), dir, { recursive: true });
    const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
    git("init", "-q", "-b", "main");
    git("add", "-A");
    git("-c", "user.name=eval", "-c", "user.email=eval@example.com", "commit", "-q", "-m", "fixture");
    let request = c.request;
    if (condition === "baseline") request = c.baselineRequest;
    if (condition === "prompt") request = c.fixture === "html-fix-existing" ? `${dashboardPrompt}\n\n${c.request}` : dashboardPrompt;
    runs.push({ id, dir, fixture: c.fixture, condition, model, request, reply: config.reply, expect: c.expect });
  }
}
console.log(JSON.stringify(runs, null, 2));
