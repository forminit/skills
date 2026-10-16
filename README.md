# Forminit agent skills

Official [Forminit](https://forminit.com) skills for AI coding agents. Forminit is a headless form backend: your site keeps its own form, Forminit stores the submissions.

## forminit-setup

Connects an existing form in your project to Forminit, or fixes a Forminit integration. The agent:

1. Detects the stack (HTML, React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Astro and plain browser code) and finds the form.
2. Sends one plan: every input with its Forminit field name, what changes, and its questions. For each file input it asks whether the input takes one file or multiple files. Then it waits for your answer.
3. Renames inputs (or maps them in the submit handler) to Forminit's field blocks: `fi-sender-email`, `fi-sender-phone`, `fi-select-*`, `fi-radio-*`, `fi-checkbox-*[]`, `fi-file-*` and the rest.
4. Wires the submit with the official `forminit` SDK, disables the submit button while sending, and keeps your input on errors.
5. Leaves your layout, styles, copy, validation and other logic alone, then asks you to send one test submission.

## Install

```bash
npx skills add forminit/skills
```

Works with Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf, OpenCode and other agents that support skills. In Claude Code you can also install it as a plugin:

```bash
claude plugin marketplace add forminit/skills
```

```bash
claude plugin install forminit@forminit
```

Then ask your agent: "Connect my contact form to Forminit, Form ID abc12def345", or run `/forminit-setup abc12def345`.

## From the dashboard

Every form's page in the [Forminit dashboard](https://app.forminit.com) shows one setup prompt with the Form ID filled in, for any agent or app builder. An agent that can run terminal commands installs this skill and follows it. An app builder without a terminal (Lovable, Bolt, v0, Replit) reads the same guide from https://forminit.com/setup.md. An agent that can do neither stops and tells you.

## Repository layout

| Path | What it is |
|---|---|
| `skills/forminit-setup/` | The skill: `SKILL.md` plus one reference per stack and a troubleshooting reference |
| `prompts/setup-prompt.mjs` | Renders the dashboard and docs copy-paste prompt; `prompts/examples/` shows its output |
| `scripts/check.mjs` | Spec, size, link and fact checks (`npm run check`) |
| `scripts/build.mjs` | Builds `dist/hosted/`, the copy served at forminit.com/setup.md, and the prompt examples (`npm run build`) |
| `evals/` | Test cases and fixture projects for agent runs |

## License

MIT
