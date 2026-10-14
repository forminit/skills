# Astro

## Where the code goes

- A plain `.astro` form gets its handler in a `<script>` tag in the same component. Astro bundles that script: add the npm package `forminit` with the project's package manager and `import { Forminit } from "forminit"`. The script runs once per page, not once per component instance, and is module scoped.
- `is:inline`, `define:vars`, `type="module"` or any attribute other than `src` makes a script inline: it is not bundled, so a bare import fails. An inline script needs `<script is:inline src="https://forminit.com/sdk/v1/forminit.js"></script>` before it and the global `Forminit`. Astro copies inline scripts as written, once per component instance, without stripping TypeScript: use the plain-JS handler from `html.md` there, keep its `(() => { ... })()` wrapper and lazy instance, and bind each `form[data-forminit]` behind the `forminitBound` guard below.
- Never put the handler in the frontmatter (`---`): it does not run in the browser.
- A form inside a framework island (a React, Vue or Svelte component with `client:load`, `client:visible` or `client:idle`): follow that framework's file. Never turn a plain `.astro` form into an island to wire it.
- With `<ClientRouter />` (View Transitions) the script does not run again after a navigation: bind inside `astro:page-load` and guard against binding twice, as below.

## The handler

```astro
<script>
  import { Forminit } from "forminit";

  const FORM_ID = "abc12def345"; // the Form ID from the request
  const forminit = new Forminit();

  function bind(form: HTMLFormElement) {
    if (form.dataset.forminitBound) return; // already bound
    form.dataset.forminitBound = "true";
    const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      'button[type="submit"], button:not([type]), input[type="submit"]'
    );
    const status = form.querySelector<HTMLElement>("[data-form-status]")!; // the form's existing message element; it must be inside the form
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
      status.textContent = "";
      sending = true;
      buttons.forEach((b) => (b.disabled = true));
      try {
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
  }

  const bindAll = () => document.querySelectorAll<HTMLFormElement>("form[data-forminit]").forEach(bind);
  bindAll();
  document.addEventListener("astro:page-load", bindAll); // fires only with <ClientRouter />
</script>
```

Mark the target form with `data-forminit` (or select it by its existing `id`). `querySelectorAll` covers a component rendered twice on one page, and the data attribute stops a second listener when both lines run or the form uses `transition:persist`. Use the form's existing message element and wording and give it `data-form-status`; it must be inside the `<form>`, because the handler looks only there (outside it, select it by its `id` from `document`). Only if it has none, add `<p data-form-status role="status"></p>` after the button with a text class the form already uses. Drop the file-size block when the form has no file inputs.

## Renaming

- Inputs from a shared component (`<Input name="email" />`): change the `name` prop at this call site only. If the component hardcodes the name, keep it and remap.
- Fields rendered from data (a content collection, CMS JSON): rename in the data only when nothing else reads it.
- Other scripts read `form.elements.email`, or CSS selects by name: keep the name and remap right after `new FormData(form)` with the `getAll`, `append`, `delete` loop from SKILL.md.

## Files

```astro
<input type="file" name="fi-file-resume" />
<input type="file" name="fi-file-photos[]" multiple />
```

Use the shape the user chose in the plan. A wrapper component must forward `name` and `multiple` (`{...Astro.props}`): check what it renders. Files go from the browser straight to Forminit.

## Pitfalls

- `import { Forminit } from "forminit"` inside `is:inline` or `define:vars` fails in the browser. Write `FORM_ID` as a const in the bundled script instead of passing it with `define:vars`.
- With `<ClientRouter />`, a form bound only at the top level stops working after the first navigation.
- `document.querySelector("#contact-form")` binds only the first instance of a component used twice.
- `client:*` directives do not apply to `.astro` components: islands are framework components only.
- Status text goes through `textContent`, never `innerHTML` or `set:html`.

## Check without sending

Against `astro build && astro preview` or `astro dev`, with Playwright already in the project:

```ts
let posts = 0;
await page.route("https://forminit.com/f/**", async (route) => {
  posts++;
  await page.waitForTimeout(300);
  await route.fulfill({ json: { success: true, redirectUrl: "", submission: { hashId: "test" } } });
});
await page.fill('[name="fi-sender-email"]', "test@example.com");
await page.getByRole("button", { name: /send/i }).dblclick();
await page.getByRole("button", { name: /send/i }).evaluate((b: HTMLButtonElement) => { b.form!.requestSubmit(); b.form!.requestSubmit(); }); // bypasses the disabled button: only the in-flight flag stops these
await page.waitForTimeout(1000);
expect(posts).toBe(1);
```

With `<ClientRouter />`, also navigate away and back, submit again, and expect exactly one more request.
