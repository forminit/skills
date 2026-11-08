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

## Cursor plugin

The Forminit plugin for Cursor bundles this skill with the [Forminit MCP server](https://forminit.com/docs/mcp/) (`https://api.forminit.com/mcp`). Install **Forminit** from the [Cursor Marketplace](https://cursor.com/marketplace) or from **Customize** in Cursor. The first time the agent uses a Forminit tool, Cursor opens the Forminit sign-in: approve the permissions you want to give. No API key is needed, and you can revoke access in Forminit under Account & settings.

With the MCP server, the agent acts as you in Forminit, limited to the forms and workspaces you can open in the dashboard and to your plan:

- **Forms:** list and create forms, change their settings and allowed domains, and get the integration guide for your stack.
- **Submissions:** list, search and read submissions, mark them read or unread, star them, set their status and add notes.
- **Trash:** move submissions to the trash or back. Emptying the trash deletes permanently and needs your confirmation of the count first.
- **Numbers and problems:** count submissions over time or by country, device and browser, and find failed emails, integration deliveries, spam blocks and failed workflow runs.

API keys, workflow editing and CSV exports stay in the [Forminit dashboard](https://app.forminit.com).

Ask, for example: "Create a Forminit form for my contact page and connect it", "Show me this week's unread submissions from my contact form" or "Why didn't I get an email for yesterday's submissions?"

## From the dashboard

Every form's page in the [Forminit dashboard](https://app.forminit.com) shows one setup prompt with the Form ID filled in, for any agent or app builder. An agent that can run terminal commands installs this skill and follows it. An app builder without a terminal (Lovable, Bolt, v0, Replit) reads the same guide from https://forminit.com/setup.md. An agent that can do neither stops and tells you.

## Repository layout

| Path | What it is |
|---|---|
| `skills/forminit-setup/` | The skill: `SKILL.md` plus one reference per stack and a troubleshooting reference |
| `.claude-plugin/marketplace.json` | The Claude Code plugin marketplace (the skill only) |
| `.cursor-plugin/plugin.json`, `mcp.json`, `assets/logo.png` | The Cursor plugin: the skill plus the Forminit MCP server |
| `prompts/setup-prompt.mjs` | Renders the dashboard and docs copy-paste prompt; `prompts/examples/` shows its output |
| `scripts/check.mjs` | Spec, size, link and fact checks (`npm run check`) |
| `scripts/build.mjs` | Builds `dist/hosted/`, the copy served at forminit.com/setup.md, and the prompt examples (`npm run build`) |
| `evals/` | Test cases and fixture projects for agent runs |

## License

MIT
