# React

Vite, React Router, Remix, TanStack Start, Gatsby and Create React App. Lovable and Bolt projects are usually Vite + React with shadcn/ui and react-hook-form. Next.js has its own file: `nextjs.md`.

## Where the code goes

- Add the npm package `forminit` with the project's package manager and `import { Forminit } from "forminit"` (named export, ESM only). No script tag in a bundled app.
- Edit the component that renders the form. Create the instance once, at module scope: `const forminit = new Forminit()`.

## The handler

```tsx
import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Forminit } from "forminit";

const FORM_ID = "abc12def345"; // the Form ID from the request
const forminit = new Forminit();

export function ContactForm() {
  const sendingRef = useRef(false); // synchronous guard
  const [sending, setSending] = useState(false); // drives disabled
  const [status, setStatus] = useState("");

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    const form = event.currentTarget; // capture before any await
    const fd = new FormData(form); // before anything is disabled
    // kept names: remap here (SKILL.md, section 4)
    // after any remap: curly apostrophes in sender names reject the submission
    for (const k of ["fi-sender-fullName", "fi-sender-firstName", "fi-sender-lastName"]) {
      const v = fd.get(k);
      if (typeof v === "string") fd.set(k, v.replace(/[\u2018\u2019]/g, "'")); // one value each, so set is right
    }
    let bytes = 0;
    for (const value of fd.values()) if (value instanceof File) bytes += value.size;
    if (bytes > 24 * 1024 * 1024) return setStatus("Files must total 24 MB or less.");
    sendingRef.current = true;
    setSending(true);
    setStatus("");
    try {
      const { data, error } = await forminit.submit(FORM_ID, fd);
      if (error || typeof data?.hashId !== "string") {
        console.error("Forminit:", error ?? data);
        return setStatus(error?.error === "TOO_MANY_REQUESTS"
          ? "Please wait a few seconds and try again."
          : "Something went wrong. Please try again.");
      }
      // the existing success behavior, unchanged (form.reset() only if it already reset)
    } catch (err) {
      console.error("Forminit:", err);
      setStatus("Something went wrong. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="fi-sender-email" type="email" required />
      <input type="checkbox" name="fi-checkbox-services[]" value="design" />
      <input type="checkbox" name="fi-checkbox-services[]" value="development" />
      <button type="submit" disabled={sending}>Send</button>
      {/* only if the form has no message area or toast; reuse a text class from this form */}
      <p role="status">{status}</p>
    </form>
  );
}
```

Use the form's existing state, toast (`sonner`, `useToast`) or message element instead of `status` when it has one, with its wording. Drop the file-size block when the form has no file inputs.

## Form libraries

react-hook-form (including shadcn/ui `<Form>` or `<Field>` with `Controller`) hands you validated values, and its field names feed schemas and error paths: keep the names and build the FormData from the values.

```tsx
const onValid = async (values: FormValues) => {
  if (sendingRef.current) return;
  const fd = new FormData();
  const add = (name: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    fd.append(name, value instanceof Blob ? value : String(value));
  };
  add("fi-sender-fullName", values.name?.replace(/[\u2018\u2019]/g, "'"));
  add("fi-sender-email", values.email);
  for (const s of values.services ?? []) add("fi-checkbox-services[]", s);
  if (values.consent) add("fi-checkbox-consent", "yes");
  for (const f of Array.from(values.attachments ?? [])) add("fi-file-attachments[]", f);
  // the file-size check from the handler above goes here
  sendingRef.current = true;
  setSending(true);
  setStatus("");
  try {
    const { data, error } = await forminit.submit(FORM_ID, fd);
    if (error || typeof data?.hashId !== "string") {
      console.error("Forminit:", error ?? data);
      return setStatus(error?.error === "TOO_MANY_REQUESTS" ? "Please wait a few seconds and try again." : "Something went wrong. Please try again."); // or the form's toast; never error.message
    }
    // the existing success behavior (toast, reset()) unchanged
  } catch (err) {
    console.error("Forminit:", err);
    setStatus("Something went wrong. Please try again.");
  } finally {
    sendingRef.current = false;
    setSending(false);
  }
};
// <form onSubmit={form.handleSubmit(onValid)}> ... <Button type="submit" disabled={sending || form.formState.isSubmitting}>
// keep `sending ||`: a guarded second handleSubmit clears isSubmitting while the first send is still running
```

- Keep the ref guard even with `formState.isSubmitting` or Formik's `isSubmitting`. Formik: an async `onSubmit={async (values) => ...}`; Formik clears `isSubmitting` when it settles.
- TanStack Form: the body goes in `useForm({ onSubmit: async ({ value }) => ... })` and the form calls `e.preventDefault(); form.handleSubmit();`. `form.handleSubmit(onValid)` never calls `onValid`.
- Copy the honeypot field from the form element when `values` lacks it.
- shadcn/Radix `Select`, `Checkbox`, `RadioGroup` and date pickers may render no named native input: read them from `values`. Radix `Checkbox` with a `name` sends `"on"` unless given `value="yes"`.
- Dates from a picker are `Date` objects: send local `YYYY-MM-DD` (date-fns `format(d, "yyyy-MM-dd")`), because `toISOString()` can shift the day.
- Phone widgets (`react-phone-number-input`) already hold an international number: send it as `fi-sender-phone`.

## Files

```tsx
<input type="file" name="fi-file-resume" />            {/* one file */}
<input type="file" name="fi-file-photos[]" multiple /> {/* multiple files from one input */}
```

Use the shape the user chose in the plan. File inputs are never controlled. When a library keeps files in state or a ref (react-dropzone, a stored `FileList`), the native input may be empty: append from there, once per file for a `[]` name.

## Pitfalls

- `event.currentTarget` is `null` after an `await`: capture the form first.
- `disabled={sending}` stops a double click, because React re-renders between clicks, but not two submits that start before that re-render (`requestSubmit()` twice). The ref is the guard.
- Never put `disabled={sending}` on inputs or a `<fieldset>`: disabled fields are left out of FormData.
- Numbers from state go in as `String(value)`; decimals and money go to `fi-text-*`. Booleans: append `"yes"` when true, nothing when false.
- `import Forminit from "forminit"` and `const Forminit = require("forminit")` fail: there is no default export. Use `import { Forminit } from "forminit"`.

## Check without sending

Run the existing typecheck, lint or build. With Playwright already in the project:

```ts
let posts = 0;
await page.route("https://forminit.com/f/**", async (route) => {
  posts++;
  await page.waitForTimeout(300);
  await route.fulfill({ json: { success: true, redirectUrl: "", submission: { hashId: "test" } } });
});
await page.fill('[name="fi-sender-email"]', "test@example.com"); // fill every required field first
await page.getByRole("button", { name: /send/i }).dblclick();
await page.getByRole("button", { name: /send/i }).evaluate((b: HTMLButtonElement) => { b.form!.requestSubmit(); b.form!.requestSubmit(); }); // bypasses the disabled button: only the in-flight flag stops these
await page.waitForTimeout(1000);
expect(posts).toBe(1);
```

Never press submit in a builder preview (Lovable, Bolt) or any browser that cannot block requests.
