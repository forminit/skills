# Next.js

App Router and Pages Router.

## Where the code goes

- Add the npm package `forminit` with the project's package manager. No script tag.
- App Router: the form component needs `"use client"` as its first line. Add it to the form component only, not to the page or layout. Pages Router: the same component without the directive.
- The form submits from the client component straight to Forminit. No other file or environment variable is needed.
- A Content Security Policy in `next.config` `headers()` needs `https://forminit.com` in `connect-src`.

## The handler

```tsx
"use client";

import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
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
        return setStatus((error && ERRORS[error.error]) || "Something went wrong. Please try again.");
      }
      // the existing success behavior, unchanged (router.push, toast, form.reset() only if already there)
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
      <button type="submit" disabled={sending}>Send</button>
      {/* only if the form has no message area or toast; reuse a text class from this form */}
      <p role="status">{status}</p>
    </form>
  );
}
```

Use the form's existing state, toast or message element instead of `status` when it has one, with its wording. Drop the file-size block when the form has no file inputs.

## Form libraries

shadcn/ui forms on react-hook-form with zod (the older `<Form>`/`FormField`, or `<Field>` with `Controller`): keep the registered names and build the FormData from the validated values, with the same guard, file-size check, submit and `finally`:

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
  // file-size check, set the ref and sending, submit and finally as in react.md, section "Form libraries"
};
// <form onSubmit={form.handleSubmit(onValid)}> ... <Button type="submit" disabled={sending || form.formState.isSubmitting}>
```

Copy the honeypot field from the form element when `values` lacks it. Radix `Select`, `Checkbox`, `RadioGroup` and date pickers may render no named native input: read them from `values` (dates as local `YYYY-MM-DD`). More library notes: `react.md`, section "Form libraries".

## Files

```tsx
<input type="file" name="fi-file-resume" />            {/* one file */}
<input type="file" name="fi-file-photos[]" multiple /> {/* multiple files from one input */}
```

Files kept in state or a ref (react-dropzone, a stored `FileList`) are appended from there, once per file for a `[]` name. Files go from the browser to Forminit, up to 24 MB of files (the 25 MB limit counts the whole request).

## Pitfalls

- Without `"use client"`, hooks and `onSubmit` fail in an App Router component. Add it to the form component, not the page or layout.
- `<form action={fn}>` and `next/form` with a function action reset uncontrolled fields: use `onSubmit`.
- `event.currentTarget` is `null` after an `await`, and `useState` alone allows a double submit. Keep the captured form and the ref.
- Never put `disabled={sending}` on inputs or a `<fieldset>`: disabled fields are left out of FormData.

## Check without sending

Run whichever of the project's checks exist: `tsc`, its lint script or `next build`. With Playwright already in the project:

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

Never press submit in a builder preview (v0, Lovable, Bolt) or any browser that cannot block requests.
