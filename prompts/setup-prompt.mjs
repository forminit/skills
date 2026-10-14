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
    ? "Connect a form in this project to my Forminit form (forminit.com, a form backend). The form already exists, so do not ask me to sign up, create a form, add fields in a dashboard (the fi-* input names are the fields) or give an API key."
    : "Connect a form in this project to Forminit (forminit.com), my form backend. Do not ask me to add fields in a dashboard (the fi-* input names are the fields) or to give an API key.";

  const idLine = hasId
    ? `Form ID: ${formId}`
    : "Form ID: ask me for it in your plan, before writing code (it is on my form's page at app.forminit.com). In the code, FORM_ID stands for that ID as a string literal (it is public, so no environment variable). Without it, stop after the plan; never use a placeholder.";

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
    `Use the forminit-setup skill if it is installed. Otherwise read ${GUIDE_URL}?ref=${ref} in full and follow it. If you cannot load it, stop and tell me, so I can install the skill with: npx skills add forminit/skills`,
    "",
    "My requirements:",
    "1. Keep my design and logic: change only input names and the submit code.",
    "2. Scan the project, then send me one plan (each input and its Forminit name) with your questions, and wait for my answer. For every file input, ask me: one file or multiple files?",
    "3. Disable the submit button while sending, so a double click sends once.",
    "4. Checkbox groups and multi-selects end in [] (fi-checkbox-services[]). Sender fields are fi-sender-email, fi-sender-fullName (or fi-sender-firstName and fi-sender-lastName), fi-sender-phone and fi-sender-company; any other fi-sender-* name rejects the whole submission.",
  ].join("\n");
}
