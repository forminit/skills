# Svelte and SvelteKit

## Where the code goes

- Add the npm package `forminit` with the project's package manager and `import { Forminit } from "forminit"` in the component's `<script>`. It needs no `onMount` or `browser` check.
- Keep the component's syntax. Runes components (`$state`, `$props`, `onsubmit`) get the Svelte 5 handler below; components with `export let` or `on:submit` get the Svelte 4 lines. Do not migrate a component.

## The handler

```svelte
<script lang="ts">
  import { Forminit } from "forminit";

  const FORM_ID = "abc12def345"; // the Form ID from the request
  const forminit = new Forminit();
  let formEl: HTMLFormElement;
  let sending = $state(false);
  let status = $state("");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (sending) return; // synchronous guard, before any await
    const fd = new FormData(formEl); // before anything is disabled
    // kept names: remap here (SKILL.md, section 4)
    // after any remap: curly apostrophes in sender names reject the submission
    for (const k of ["fi-sender-fullName", "fi-sender-firstName", "fi-sender-lastName"]) {
      const v = fd.get(k);
      if (typeof v === "string") fd.set(k, v.replace(/[\u2018\u2019]/g, "'")); // one value each, so set is right
    }
    let bytes = 0;
    for (const value of fd.values()) if (value instanceof File) bytes += value.size;
    if (bytes > 24 * 1024 * 1024) {
      status = "Files must total 24 MB or less.";
      return;
    }
    sending = true;
    status = "";
    try {
      const { data, error } = await forminit.submit(FORM_ID, fd);
      if (error || typeof data?.hashId !== "string") {
        console.error("Forminit:", error ?? data);
        status = error?.error === "TOO_MANY_REQUESTS"
          ? "Please wait a few seconds and try again."
          : "Something went wrong. Please try again.";
        return;
      }
      // the existing success behavior, unchanged (sent = true in place of form?.success; formEl.reset() only if it already reset)
    } catch (err) {
      console.error("Forminit:", err);
      status = "Something went wrong. Please try again.";
    } finally {
      sending = false;
    }
  }
</script>

<form bind:this={formEl} onsubmit={handleSubmit}>
  <!-- existing inputs, renamed as in the plan -->
  <button type="submit" disabled={sending}>Send</button>
  <!-- only if the form has no message area; reuse a text class from this form -->
  <p role="status">{status}</p>
</form>
```

Svelte 4: `let sending = false;` and `let status = "";` (plain `let` is reactive there), and `<form bind:this={formEl} on:submit|preventDefault={handleSubmit}>` with `event.preventDefault()` removed from the handler. Use the form's existing message variable or toast when it has one, with its wording. `{status}` escapes; never `{@html}`. Drop the file-size block when the form has no file inputs.

## Inputs and form libraries

`bind:value` and `bind:group` inputs often have no `name`, and FormData skips unnamed inputs. Adding `name="fi-..."` next to the binding is the simplest fix: `fi-checkbox-x[]` on every box of a `bind:group` checkbox group, `fi-radio-x` on radios.

When a library hands you values instead of a form, build the FormData from them and keep the same guard, status and `finally`:

```ts
function toFormData(entries: [string, unknown][]) {
  const fd = new FormData();
  for (const [name, value] of entries) {
    const list = value instanceof FileList || Array.isArray(value) ? Array.from(value) : [value];
    for (const v of list) {
      if (v === undefined || v === null || v === "") continue;
      fd.append(name, v instanceof Blob ? v : String(v));
    }
  }
  return fd;
}

const fd = toFormData([
  ["fi-sender-email", values.email],
  ["fi-checkbox-services[]", values.services], // an array: one entry per item
  ["fi-checkbox-terms", values.terms ? "yes" : undefined],
  ["fi-file-resume", files], // File, File[] or FileList
]);
```

- sveltekit-superforms: submit in `onUpdate({ form })` when `form.valid`, using `toFormData` on `form.data`. Do not change its validators.
- Felte and other value-based libraries: the same `toFormData` call.
- Inputs that keep their names inside a native form: use the `getAll`, `append`, `delete` remap from SKILL.md.

## Files

```svelte
<input type="file" name="fi-file-resume" />
<input type="file" name="fi-file-photos[]" multiple />
```

Use the shape the user chose in the plan. A `bind:files` input stays bound: add the `name`, or pass the bound FileList to `toFormData` under the chosen name.

## Pitfalls

- `disabled={sending}` applies on the next update, not when the handler starts. `if (sending) return` is the guard.
- Svelte 5 `onsubmit` has no modifiers: call `event.preventDefault()` before any `await`, or the browser posts the page.
- One component cannot mix `on:submit` and `onsubmit`: Svelte 5 refuses to compile it.
- `use:enhance` left on the form next to your handler sends twice: remove it from this form.
- An awaited validator before the guard lets two submits through: set `sending` before that await and clear it on every early return.
- `submit()` takes FormData only here. Passing `formEl`, a `$state` object or a superforms store throws.

## Check without sending

With Playwright already in the project:

```ts
let posts = 0;
await page.route("https://forminit.com/f/**", async (route) => {
  posts++;
  await new Promise((r) => setTimeout(r, 300));
  await route.fulfill({ json: { success: true, redirectUrl: "", submission: { hashId: "test" } } });
});
await page.fill('[name="fi-sender-email"]', "test@example.com"); // fill every required field first
await page.getByRole("button", { name: /send/i }).dblclick();
await page.getByRole("button", { name: /send/i }).evaluate((b: HTMLButtonElement) => { b.form!.requestSubmit(); b.form!.requestSubmit(); }); // bypasses the disabled button: only the in-flight flag stops these
await page.waitForTimeout(1000);
expect(posts).toBe(1);
```
