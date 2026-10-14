// Builds the files served from forminit.com and the example prompts.
//
//   node scripts/build.mjs          write dist/hosted/ and prompts/examples/
//   node scripts/build.mjs --check  fail if prompts/examples/ is out of date
//
// dist/hosted/ mirrors the skill for agents that read it from a URL instead of
// installing it: setup.md is SKILL.md, references live under setup/references/,
// and relative reference paths become absolute URLs.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDE_URL, renderSetupPrompt } from "../prompts/setup-prompt.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "skills/forminit-setup");
const refsDir = join(skillDir, "references");
const HOSTED_REFS = "https://forminit.com/setup/references/";
const check = process.argv.includes("--check");

const refNames = readdirSync(refsDir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));

export function hostify(text) {
  const names = refNames.join("|");
  return text
    .replace(/`references\/([a-z-]+\.md)`/g, (_, file) => "`" + HOSTED_REFS + file + "`")
    .replace(new RegExp("`(" + names + ")\\.md`", "g"), (_, name) => "`" + HOSTED_REFS + name + ".md`")
    .replace(/\bSKILL\.md\b/g, GUIDE_URL);
}

const examples = {
  "dashboard.txt": renderSetupPrompt({ formId: "abc12def345" }),
  "dashboard-all-settings.txt": renderSetupPrompt({
    formId: "abc12def345",
    hasAuthorizedDomains: true,
    hasCustomRedirect: true,
  }),
  "docs.txt": renderSetupPrompt({ ref: "docs" }),
};

const examplesDir = join(root, "prompts/examples");
let stale = [];
for (const [file, text] of Object.entries(examples)) {
  const path = join(examplesDir, file);
  const body = text + "\n";
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== body) stale.push(`prompts/examples/${file}`);
  } else {
    mkdirSync(examplesDir, { recursive: true });
    writeFileSync(path, body);
  }
}

if (check) {
  if (stale.length) {
    console.error(`Out of date, run node scripts/build.mjs: ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log("prompts/examples is up to date");
} else {
  const out = join(root, "dist/hosted");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "setup/references"), { recursive: true });
  writeFileSync(join(out, "setup.md"), hostify(readFileSync(join(skillDir, "SKILL.md"), "utf8")));
  for (const name of refNames) {
    writeFileSync(join(out, "setup/references", `${name}.md`), hostify(readFileSync(join(refsDir, `${name}.md`), "utf8")));
  }
  console.log(`Wrote dist/hosted (setup.md + ${refNames.length} references) and prompts/examples (${Object.keys(examples).length} prompts)`);
}
