// Mechanical checks for the skill and the setup prompt. No dependencies.
//
//   node scripts/check.mjs
//
// Checks the Agent Skills spec rules that break installs, the size budgets,
// broken reference links, and the facts the prompt repeats from SKILL.md.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FORM_ID_PATTERN, renderSetupPrompt } from "../prompts/setup-prompt.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillName = "forminit-setup";
const skillDir = join(root, "skills", skillName);
const read = (p) => readFileSync(join(root, p), "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);

// Frontmatter
const skill = read(`skills/${skillName}/SKILL.md`);
const fmMatch = skill.match(/^---\n([\s\S]*?)\n---\n/);
if (!fmMatch) fail("SKILL.md: frontmatter must open the file");
const fm = fmMatch ? fmMatch[1] : "";
const topKeys = [...fm.matchAll(/^([a-zA-Z-]+):/gm)].map((m) => m[1]);
const allowed = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];
for (const key of topKeys) if (!allowed.includes(key)) fail(`SKILL.md: frontmatter key "${key}" is not in the Agent Skills spec`);
const name = fm.match(/^name:\s*(.+)$/m)?.[1].trim();
if (name !== skillName) fail(`SKILL.md: name "${name}" must equal the directory name "${skillName}"`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? "") || (name ?? "").length > 64) fail("SKILL.md: invalid name");
const descRaw = fm.match(/^description:\s*(.+)$/m)?.[1].trim() ?? "";
const desc = descRaw.startsWith('"') ? JSON.parse(descRaw) : descRaw;
if (!desc || desc.length > 1024) fail(`SKILL.md: description must be 1 to 1024 characters (is ${desc.length})`);
if (/[<>]/.test(desc)) fail("SKILL.md: description must not contain < or >");
if (!descRaw.startsWith('"') && /: /.test(desc)) fail('SKILL.md: quote the description, it contains ": "');
const version = fm.match(/^\s+version:\s*"([^"]+)"$/m)?.[1];
if (!version) fail('SKILL.md: metadata.version must be a quoted string');
if (version && !skill.includes(`(${skillName} ${version})`)) fail(`SKILL.md: the H1 must carry "(${skillName} ${version})"`);

// Size budgets (agentskills.io: under 500 lines, about 5000 tokens for SKILL.md)
const lines = skill.split("\n").length;
if (lines > 500) fail(`SKILL.md: ${lines} lines, keep it under 500`);
const approxTokens = Math.round(skill.length / 4);
if (approxTokens > 5500) fail(`SKILL.md: about ${approxTokens} tokens, keep it near 5000`);

// References: every linked file exists and every file is linked from SKILL.md
const refFiles = readdirSync(join(skillDir, "references")).filter((f) => f.endsWith(".md"));
const linked = new Set([...skill.matchAll(/`references\/([a-z-]+\.md)`/g)].map((m) => m[1]));
for (const f of linked) if (!refFiles.includes(f)) fail(`SKILL.md links references/${f}, which does not exist`);
for (const f of refFiles) if (!linked.has(f)) fail(`references/${f} is never linked from SKILL.md`);
const allDocs = [["SKILL.md", skill], ...refFiles.map((f) => [`references/${f}`, read(`skills/${skillName}/references/${f}`)])];
for (const [file, text] of allDocs) {
  for (const m of text.matchAll(/`([a-z-]+)\.md`/g)) {
    if (!refFiles.includes(`${m[1]}.md`) && m[1] !== "references") fail(`${file}: links ${m[1]}.md, which is not a reference file`);
  }
  if (/\.\.\//.test(text)) fail(`${file}: no ../ paths, references stay one level deep`);
  if (/[​-‏‪-‮⁠-⁤﻿]/.test(text)) fail(`${file}: hidden Unicode characters`);
  for (const block of text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)) {
    const code = block[1];
    if (/getform\.io/.test(code)) fail(`${file}: getform.io inside a code block`);
    if (/YOUR_FORM_ID|<your[- ]form[- ]id>/i.test(code)) fail(`${file}: placeholder Form ID inside a code block`);
    if (/fi-sender-(name|message)\b/.test(code)) fail(`${file}: invalid sender name inside a code block`);
    if (/FORM_ID = "/.test(code) && !/FORM_ID = "abc12def345"/.test(code)) fail(`${file}: example Form ID must be abc12def345`);
    if (/\bfd\.set\("fi-(checkbox|select|file)/.test(code)) fail(`${file}: fd.set on a multi-value field keeps one value`);
  }
}

// Facts the prompt repeats from SKILL.md must match
const prompt = renderSetupPrompt({ formId: "abc12def345" });
const docsPrompt = renderSetupPrompt({ ref: "docs" });
const full = renderSetupPrompt({ formId: "abc12def345", hasAuthorizedDomains: true, hasCustomRedirect: true });
// The prompt carries no field rules (the guide does); it must route every kind of agent to the guide
for (const must of [
  "Form ID: abc12def345",
  "npx skills add forminit/skills --skill forminit-setup -y",
  ".agents/skills/forminit-setup/SKILL.md",
  ".claude/skills/forminit-setup/SKILL.md",
  "https://forminit.com/setup.md?ref=dashboard",
  "stop and tell me",
]) {
  if (!prompt.includes(must)) fail(`prompt: missing "${must}"`);
}
if (!skill.includes(`name: ${skillName}`)) fail("SKILL.md: the install command's --skill must match the skill name");
for (const wrong of ["getform", "Getform", "YOUR_FORM_ID", "Endpoint:", "res.ok", "curl"]) {
  if (prompt.includes(wrong) || docsPrompt.includes(wrong) || full.includes(wrong)) fail(`prompt: must not contain "${wrong}"`);
}
if (/abc12def345|undefined|null/.test(docsPrompt)) fail("docs prompt: leaked an ID or an empty value");
if (!docsPrompt.includes("?ref=docs")) fail("docs prompt: ref must be docs");
if (renderSetupPrompt({ formId: "<script>" }) !== null) fail("prompt: an invalid Form ID must render nothing");
if (!renderSetupPrompt({ formId: "abc12def345", ref: '"; rm -rf ~; "' }).includes("?ref=dashboard ")) fail("prompt: an unknown ref must fall back to dashboard");
if (!FORM_ID_PATTERN.test("abcdefgh") || !FORM_ID_PATTERN.test("abc12def345")) fail("prompt: Form ID pattern rejects real IDs");
if (prompt.length > 800) fail(`prompt: ${prompt.length} characters, keep it under 800`);
if (full.length > 1400) fail(`prompt: ${full.length} characters with every setting, keep it under 1400`);
for (const [label, text] of [["prompt", prompt], ["docs prompt", docsPrompt], ["full prompt", full]]) {
  if (/[<>]/.test(text)) fail(`${label}: unexpected markup`);
}

// Marketplace manifest
const market = JSON.parse(read(".claude-plugin/marketplace.json"));
for (const plugin of market.plugins ?? []) {
  for (const p of plugin.skills ?? []) {
    if (!p.startsWith("./")) fail(`marketplace.json: skill path ${p} must start with ./`);
  }
}
if (!(market.plugins ?? []).some((p) => (p.skills ?? []).includes(`./skills/${skillName}`))) fail("marketplace.json: must list ./skills/forminit-setup");

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${skillName} ${version}: ${lines} lines, about ${approxTokens} tokens, ${refFiles.length} references, prompt ${prompt.length} characters (${full.length} with every setting)`);
