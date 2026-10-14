# Plain HTML, CMS templates and other browser code

Static pages, CMS templates, static generators (Jekyll, Hugo, Eleventy) and any framework without its own file in this skill. In a framework (Angular, Solid, Preact, Qwik, Lit), apply the same steps inside its submit handler and add the npm package instead of the script tag.

## Where the code goes

- No bundler: load `<script src="https://forminit.com/sdk/v1/forminit.js"></script>` (global `Forminit`), then the handler, both after the form. In `<head>`, both need `defer` and the handler must be a separate file, because inline scripts ignore `defer`. Never use `async`.
- A page built by Vite, webpack or another bundler: add the npm package `forminit` and `import { Forminit } from "forminit"`.
- Select the target form by its `id` or a data attribute. Never `document.querySelector("form")`: pages often also have a search or newsletter form.
- An existing vanilla or jQuery handler is adapted in place: swap only its transport (`fetch`, `$.ajax`, `XMLHttpRequest`) for `forminit.submit`. Never add a second listener.
- A form whose `action` points at the old service: set `action="https://forminit.com/f/FORM_ID" method="POST" enctype="multipart/form-data"`. If JavaScript is off or the handler does not run, the browser still posts the fields renamed in the markup and lands on Forminit's thank-you page (or the redirect page set in the dashboard). If only the SDK script is blocked, the handler stays attached and shows the form's error message instead.

## The handler

```html
<script src="https://forminit.com/sdk/v1/forminit.js"></script>
<script>
  (() => {
    const FORM_ID = "abc12def345"; // the Form ID from the request
    const form = document.getElementById("contact-form");
    const buttons = form.querySelectorAll('button[type="submit"], button:not([type]), input[type="submit"]');
    const status = form.querySelector("[data-form-status]"); // the form's existing message element (outside the form: getElementById)
    let forminit; // created on first submit: a blocked SDK then shows the error instead of a native GET with the fields in the URL
    let sending = false;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (sending) return;
      const fd = new FormData(form); // before anything is disabled
      // kept names: remap here (SKILL.md, section 4)
      // after any remap: curly apostrophes in sender names reject the submission
      for (const k of ["fi-sender-fullName", "fi-sender-firstName", "fi-sender-lastName"]) {
        const v = fd.get(k);
        if (typeof v === "string") fd.set(k, v.replace(/[\u2018\u2019]/g, "'")); // one value each, so set is right
      }
      let bytes = 0;
      for (const value of fd.values()) if (value instanceof File) bytes += value.size;
      if (bytes > 24 * 1024 * 1024) {
        status.textContent = "Files must total 24 MB or less.";
        return;
      }
      status.textContent = ""; // before the flag: nothing that can throw sits between the flag and try
      sending = true;
      buttons.forEach((b) => (b.disabled = true));
      try {
        if (!forminit) forminit = new Forminit();
        const { data, error } = await forminit.submit(FORM_ID, fd);
        if (error || typeof data?.hashId !== "string") {
          console.error("Forminit:", error ?? data);
          status.textContent = error?.error === "TOO_MANY_REQUESTS"
            ? "Please wait a few seconds and try again."
            : "Something went wrong. Please try again.";
          return;
        }
        // the existing success behavior, unchanged (form.reset() only if it already reset)
      } catch (err) {
        console.error("Forminit:", err);
        status.textContent = "Something went wrong. Please try again.";
      } finally {
        sending = false;
        buttons.forEach((b) => (b.disabled = false));
      }
    });
  })();
</script>
```

- Drop the file-size block when the form has no file inputs.
- Use the form's existing message element and wording; if it sits outside the `<form>`, select it with `document.getElementById(...)`. Only if there is none, add `<p data-form-status role="status"></p>` after the button with a text class the form already uses. Write messages with `textContent`, never `innerHTML`.
- Submit buttons that carry their own `name` and `value` (two buttons with different actions): `new FormData(form, event.submitter)` includes the clicked one.

## Renaming

Rename in the markup unless something reads the old name: `form.elements.email`, a `[name="email"]` selector in CSS or JS, a plugin's generated markup, a shared template. Then keep the name and remap right after `new FormData(form)` with the `getAll`, `append`, `delete` loop from SKILL.md. The loop also fixes a checkbox group that repeats a bare name: every checked value moves to the `[]` name.

## Files

```html
<input type="file" name="fi-file-resume">                 <!-- one file -->
<input type="file" name="fi-file-photos[]" multiple>      <!-- multiple files from one input -->
```

Use the shape the user chose in the plan. Keep `accept`, `required` and any drop zone. A drop zone that keeps files in a JavaScript array: `fd.delete` the input's own entry, then `fd.append("fi-file-photos[]", file)` once per file.

## Pitfalls

- `Forminit is not defined`: the SDK loads after the handler, or with `async`.
- An inline `onsubmit`, a builder's own handler, or a leftover `fetch` next to yours sends twice or navigates away. Keep one submit path.
- A Content Security Policy needs `https://forminit.com` in `script-src` (for the script tag) and `connect-src`. Add only that origin; never loosen the whole policy.

## Check without sending

With Playwright already in the project:

```js
let posts = 0;
await page.route("https://forminit.com/f/**", async (route) => {
  posts++;
  await page.waitForTimeout(300);
  await route.fulfill({ json: { success: true, redirectUrl: "", submission: { hashId: "test" } } });
});
await page.fill('[name="fi-sender-email"]', "test@example.com");
await page.getByRole("button", { name: /send/i }).dblclick();
await page.getByRole("button", { name: /send/i }).evaluate((b) => { b.form.requestSubmit(); b.form.requestSubmit(); }); // bypasses the disabled button: only the in-flight flag stops these
await page.waitForTimeout(1000);
expect(posts).toBe(1);
```

Never press submit in a builder preview or any browser that cannot block requests.
