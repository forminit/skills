// Renders the copy-paste setup prompt shown in the Forminit dashboard and docs.
// Zero dependencies: the dashboard copies this file as is. Keep the rules in
// sync with skills/forminit-setup/SKILL.md (scripts/check.mjs enforces the key facts).
// Render only after the form's settings have loaded:
// rendering earlier silently drops the settings lines.

export const GUIDE_URL = "https://forminit.com/setup.md";
const REFS = ["dashboard", "docs", "home"];

// Form IDs are lowercase letters and digits today (11 characters; older forms 8).
// The pattern is wider on purpose, and only exists to keep markup out of the prompt.
export const FORM_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

/**
 * @param {object} options
 * @param {string} [options.formId] Form ID. Omit for the docs and homepage prompt, which asks for it.
 * @param {"dashboard"|"docs"|"home"} [options.ref] Where the prompt is shown. Defaults to "dashboard" with a Form ID, "docs" without.
 * @param {boolean} [options.hasAuthorizedDomains] Authorized domains are set for the form.
 * @param {boolean} [options.hasCustomRedirect] A custom redirect page is set for the form (not the default thank-you page).
 * @returns {string|null} The prompt, or null when formId is present but invalid.
 */
export function renderSetupPrompt(options = {}) {
  const { formId, hasAuthorizedDomains = false, hasCustomRedirect = false } = options;
  if (formId !== undefined && formId !== null && !FORM_ID_PATTERN.test(String(formId))) return null;
  const hasId = Boolean(formId);
  const ref = REFS.includes(options.ref) ? options.ref : (hasId ? "dashboard" : "docs");

  const intro = hasId
    ? "Connect a form in this project to my Forminit form (forminit.com, a form backend)."
    : "Connect a form in this project to Forminit (forminit.com), my form backend.";

  const idLine = hasId
    ? `Form ID: ${formId}`
    : "Form ID: ask me for it before writing code (it is on my form's page at app.forminit.com).";

  const settings = [];
  if (hasId && hasAuthorizedDomains) {
    settings.push("Authorized domains are set for this form: submissions from other hosts (localhost, preview URLs) or without a Referer header (a no-referrer policy) land in Spam. Remind me to test from an allowed domain.");
  }
  if (hasId && hasCustomRedirect) {
    settings.push("A redirect page is set for this form. In the plan, ask whether to keep my current success behavior (default, even if it redirects) or to navigate to the redirectUrl that submit() returns after success.");
  }

  return [
    intro,
    "",
    idLine,
    ...settings,
    "",
    "Get the Forminit setup guide, then follow it:",
    "1. If you can run terminal commands, install it: npx skills add forminit/skills --skill forminit-setup -y. Then read .agents/skills/forminit-setup/SKILL.md (or .claude/skills/forminit-setup/SKILL.md).",
    `2. Otherwise read ${GUIDE_URL}?ref=${ref} in full.`,
    "3. If you can do neither, stop and tell me.",
  ].join("\n");
}
