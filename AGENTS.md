# Maintaining this repository

Notes for anyone (human or agent) editing the Forminit skills.

## What this is

`skills/forminit-setup/` is agent context, not documentation for people. An agent reads `SKILL.md` when a user asks to connect a form to Forminit, then reads one stack reference. Every sentence must change what the agent does. If an agent would get it right without the sentence, delete the sentence.

## Sources of truth

API facts come from Forminit's production backend and the published npm package `forminit` (0.2.4 at the time of writing), not from the docs site, which has drifted before. Verify a fact against the backend source before changing it.

Facts that agents get wrong and that the skill depends on: checkbox groups and multi-selects need `[]` (the backend keeps only the last bare value); unknown `fi-sender-*` names reject the whole submission; unknown types are dropped silently; `FORM_NOT_FOUND` is HTTP 200; spam (Authorized domains, honeypot) answers with a normal success; form-data numbers are cut to integers; 25 MB per submission; 1 request per 5 seconds per IP.

Scope, on purpose: browser forms submitted with the SDK. Protected mode, server-side submits (including the Next.js proxy), CAPTCHA and other form services are left out; do not add them back without a decision.

## Rules

- **One copy of each fact.** `SKILL.md` holds the rules and the field table. Stack references hold only stack-specific code and pitfalls. The setup prompt (`prompts/setup-prompt.mjs`) is one prompt for every agent and builder: the Form ID, the form's settings, and a route to the guide (install the skill if the agent has a terminal, else read forminit.com/setup.md, else stop). It carries no field rules; those belong in `SKILL.md`. `scripts/check.mjs` keeps the repeated facts in sync and enforces the size budget.
- **Frontmatter** uses only the spec keys (`name`, `description`, `license`, `compatibility`, `metadata`). `name` equals the folder name. The description has no `<` or `>` and stays under 1024 characters.
- **Size:** `SKILL.md` stays under 500 lines and about 5000 tokens. References stay one level deep.
- **Example Form ID** is always `abc12def345`. Never write placeholders like `YOUR_FORM_ID`.
- **No remote instructions** in the installed skill. The setup prompt may point to forminit.com/setup.md; the skill itself only reads its own `references/`.
- **Version:** bump `metadata.version` in `SKILL.md` and the H1 together on every change to the skill.
- Wording must hold both when the skill is installed and when the hosted copy is read from a URL. Refer to files as `references/<name>.md` (in `SKILL.md`) or `<name>.md` (inside references), so the build can rewrite them to absolute URLs.

## Before a release

```bash
npm run build
```

```bash
npm run check
```

Validators (pinned versions that were verified to work):

```bash
npx -y skills@1.7.2 add ./ --list
```

```bash
claude plugin validate --strict .
```

`claude plugin validate` never reads `skills/`, so also smoke-test the plugin install in a throwaway config: `CLAUDE_CONFIG_DIR=$(mktemp -d) claude plugin marketplace add ./`, then `claude plugin install forminit@forminit`, and check that `claude plugin details forminit@forminit` lists the `forminit-setup` skill.

```bash
uvx --python 3.12 --from skills-ref==0.1.1 agentskills validate skills/forminit-setup
```

Then run the evals in `evals/` against at least one model, including a run without the skill as the baseline. `node evals/prepare.mjs <dir> skill prompt baseline` copies each fixture into its own git repo; an agent works in each, and a grader diffs the result against `evals.json`. Publish `dist/hosted/` to forminit.com (`setup.md` and `setup/references/`) together with the GitHub release, so the dashboard prompt and the installed skill match.
