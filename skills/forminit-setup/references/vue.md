# Vue and Nuxt

## Where the code goes

- Bundled Vue and Nuxt: add the npm package `forminit` with the project's package manager and `import { Forminit } from "forminit"` in the component. Vue loaded from a CDN without a bundler: use the script tag from `html.md`, keep `let forminit;` outside the handler and create it as the first line inside `try` (`if (!forminit) forminit = new window.Forminit();`), as html.md does.
- Keep the component's style: `<script setup>`, `defineComponent`, or the Options API (`sending: false` in `data()`, the handler in `methods`, `this.sending`, `this.$refs.formEl`).
- Nuxt needs no plugin, module, `runtimeConfig` entry or `<ClientOnly>`: the component code below runs as is.

## The handler

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Forminit } from "forminit";

// Forminit form: inputs are named fi-{type}-{name}. Rules: https://forminit.com/setup.md
const FORM_ID = "abc12def345"; // the Form ID from the request
// Messages visitors see: write them in the page's language
const ERRORS: Record<string, string> = {
  FI_RULES_PHONE_INVALID: "Please enter a valid phone number with the country code, like +1 415 555 0123.",
  FI_SCHEMA_FORMAT_EMAIL: "Please enter a valid email address.",
  TOO_MANY_REQUESTS: "Please wait a few seconds and try again.",
};
const forminit = new Forminit();
const formEl = ref<HTMLFormElement | null>(null);
const sending = ref(false);
const status = ref("");

async function onSubmit() {
  if (sending.value || !formEl.value) return; // refs update synchronously: check and set before any await
  const fd = new FormData(formEl.value); // before anything is disabled
  // kept names: remap here (SKILL.md, section 4)
  // after any remap: curly apostrophes in sender names reject the submission
  for (const k of ["fi-sender-fullName", "fi-sender-firstName", "fi-sender-lastName"]) {
    const v = fd.get(k);
    if (typeof v === "string") fd.set(k, v.replace(/[\u2018\u2019]/g, "'")); // one value each, so set is right
  }
  let bytes = 0;
  for (const value of fd.values()) if (value instanceof File) bytes += value.size;
  if (bytes > 24 * 1024 * 1024) {
    status.value = "Files must total 24 MB or less.";
    return;
  }
  sending.value = true;
  status.value = "";
  try {
    const { data, error } = await forminit.submit(FORM_ID, fd);
    if (error || typeof data?.hashId !== "string") {
      console.error("Forminit:", error ?? data);
      status.value = (error && ERRORS[error.error]) || "Something went wrong. Please try again.";
      return;
    }
    // the existing success behavior, unchanged (formEl.value.reset() only if it already reset)
  } catch (err) {
    console.error("Forminit:", err);
    status.value = "Something went wrong. Please try again.";
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <form ref="formEl" @submit.prevent="onSubmit">
    <!-- existing inputs, renamed as in the plan -->
    <button type="submit" :disabled="sending">Send</button>
    <!-- only if the form has no message area; reuse a text class from this form -->
    <p role="status">{{ status }}</p>
  </form>
</template>
```

Use the form's existing message ref, toast or alert instead of `status` when it has one, with its wording. Text interpolation escapes; never `v-html`. Drop the file-size block when the form has no file inputs.

## Inputs and form libraries

`v-model` inputs often have no `name`, and FormData skips unnamed inputs. Adding `name="fi-..."` next to `v-model` is the simplest fix: `fi-checkbox-x[]` on every box of a checkbox group bound to one array, `fi-radio-x` on radios bound to one value.

When a library hands you values instead of a form (vee-validate `handleSubmit((values) => ...)`, Nuxt UI `<UForm @submit>` with `event.data`, FormKit `@submit`, Vuetify `<v-form>` with refs), build the FormData from the values and keep the same guard, status and `finally`:

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
  ["fi-sender-fullName", values.name?.replace(/[\u2018\u2019]/g, "'")],
  ["fi-sender-email", values.email],
  ["fi-checkbox-services[]", values.services], // an array: one entry per item
  ["fi-checkbox-terms", values.terms ? "yes" : undefined],
  ["fi-file-resume", values.resume], // File, File[] or FileList
]);
```

A `ref` on a component (`<v-form>`, `<UForm>`) is the component, not the `<form>` element, so `new FormData(ref)` throws: use the values path. Inputs that keep their names inside a native form: use the `getAll`, `append`, `delete` remap from SKILL.md.

## Files

```vue
<input type="file" name="fi-file-resume" />
<input type="file" name="fi-file-photos[]" multiple />
```

Use the shape the user chose in the plan. `v-model` does not work on file inputs: if an `@change` handler stores the files in a ref, keep it and either add the `name` or pass the stored File, File[] or FileList to `toFormData`. FormKit file values are `[{ name, file }]`: pass `value.map((f) => f.file)`. Never put files in JSON or a reactive object.

## Pitfalls

- `:disabled` applies on Vue's next render, not when the handler starts. The `sending.value` check at the top is the guard.
- An awaited validator (`await validate()`) before the guard lets two submits through: set `sending` before that await and clear it on every early return.
- Build the FormData from the template ref (`new FormData(formEl.value)`), never from the reactive state, which is often also named `form`. Passing `formEl.value`, `toRaw(state)` or any plain object to `submit()` rejects with a TypeError.
- Without `.prevent` the page reloads. `<UForm>` already prevents it.

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

Unit test alternative: `vi.mock("forminit")` with `submit` returning a pending promise, trigger `submit` twice with `@vue/test-utils`, and expect one call.
