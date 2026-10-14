# Troubleshooting

Read this when a Forminit form already exists in the code and fails, or when the user reports that submissions do not arrive.

## Error codes

The SDK returns them as `error.error`. Any validation error rejects the whole submission: nothing is stored.

| Code | HTTP | Cause | Fix |
|---|---|---|---|
| `FORM_NOT_FOUND` | 200 | Wrong Form ID, or `undefined` from a missing env variable | Use the ID from the dashboard as a string literal. |
| `FORM_DISABLED` | 403 | The form is turned off | The user turns it on in the dashboard. |
| `LIMIT_EXPIRED` | 403 | The account is over its plan's quota | The user upgrades or waits for the next period. |
| `TOO_MANY_REQUESTS` | 429 | More than 1 request per 5 seconds from one IP | Ask the visitor to wait. Never retry automatically. |
| `EMPTY_SUBMISSION` | 400 | No field has a valid `fi-{type}-{name}` name | Rename the inputs. The message lists the names it ignored. |
| `PERMISSION_DENIED` | 403 | File upload on a plan without uploads | The user checks their plan, or the file input goes. |
| `FI_FIELD_INVALID_PROPERTIES` | 400 | Unknown `fi-sender-*` or `fi-tracking-*` name, such as `fi-sender-name` or `fi-tracking-utm_source` | Use the exact names from SKILL.md, section 4. |
| `FI_FIELD_NAME_MISSING` | 400 | A type without a name, such as `fi-email` | `fi-email-work` |
| `FI_FIELD_INVALID_NAME_PATTERN` | 400 | `{name}` has a character other than ASCII letters, digits, `_` and `-`, such as `:`, `@`, `/`, `+` or `ı`. In form posts, spaces and dots are not rejected but turned into `_` (`fi-text-full name` is stored as `full_name`). | Letters, digits, `_` and `-` only. |
| `FI_FIELD_DUPLICATE_NAME` | 400 | Two fields share one name | Make names unique, or use `[]` for a real group. |
| `FI_FIELD_NAME_CONFLICT` | 400 | `{name}` is `sender`, `tracking`, `order`, `location` or `schedule` | Add a word: `fi-text-order_notes`. |
| `FI_FIELD_NAME_RESTRICTED` | 400 | `{name}` is a blocked word such as `id`, `password` or `cardNumber` | Rename it. Never send passwords or card data. |
| `FI_FIELD_TOTAL_SINGLE_BLOCK_LIMIT_EXCEEDED`, `FI_FIELD_SINGLE_BLOCK_TYPE_LIMIT_EXCEEDED` | 400 | More than 100 fields, or more than 50 of one type | Merge fields. |
| `FI_RULES_PHONE_INVALID` | 400 | Not a valid phone number, or a local number without a usable country hint (SKILL.md phone rule; `fi-phone-*` ignores `fi-sender-country`) | International format (`+14155550123`), a country hint as in the phone rule, or `fi-text-*`. |
| `FI_SCHEMA_FORMAT_EMAIL` | 400 | Invalid email | Keep `type="email"` on the input. |
| `FI_SCHEMA_FORMAT_URI` | 400 | URL without a scheme, such as `example.com` | `type="url"`, or `fi-text-*`. |
| `FI_DATA_COUNTRY_INVALID` | 400 | Country not an uppercase two-letter ISO code (`us`, `USA`, `UK`, `Germany`) | ISO alpha-2 values (`GB` for the UK), or `fi-select-*`. |
| `FI_SCHEMA_PATTERN` | 400 | A `fi-date-*` value that is not `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM` or an ISO date-time with seconds (`10/12/2026`, `2026-10-12 14:30`); a non-numeric `fi-number-*` value (`1,000`); or a sender name with commas, parentheses, `&`, `@` or a curly apostrophe (`O’Brien`) | Send the native input value; `fi-text-*` for other date formats or formatted numbers. Names allow letters, digits, spaces, `-`, the straight `'`, `.` and `_`: replace `’` with `'` before submitting. |
| `FI_DATA_VALIDATION` | 400 | Every field empty, a text over 5000 characters, a choice over 200 characters, or a rating outside 1 to 5 | Shorten or remap the field. |
| `FI_DATA_TYPE_INVALID` | 400 | `[]` on a single-value type. On a phone field, or a country field in a form with a phone, `[]` gives 500 `UNKNOWN_ERROR` instead | `[]` only on checkbox groups, multi-selects and multiple files. |
| `FI_SCHEMA_REQUIRED_FIELDS` | 400 | A sender block without email, phone, fullName, firstName, lastName or userId | Add one of them, or move the fields to `fi-text-*`. |
| `HTTP_ERROR` with code 413 | 413 | The request is over 25 MB, files plus other fields (Forminit's message still says 5 MB) | Check the files against 24 MB before sending. |
| `HTTP_ERROR` with another code | 401, 403, 404, 405, 500 | An error answer without an `error` field, usually an HTML page; `message` holds its text | Check the request in the browser's Network tab. |
| `UNKNOWN_ERROR` | 500 | `[]` on a phone field | Remove `[]` from phone and country fields. |
| `GENERIC_ERROR` | 0 or 500 | Network failure, an ad blocker, or a Content Security Policy that blocks `https://forminit.com` | Add `https://forminit.com` to `connect-src` (and `script-src` for the script tag). |

## The form says success, but nothing is in the inbox

Spam rules answer with a normal success. Ask the user to open the form's Spam folder, then check:

- **Authorized domains** are set and the submission came from another host (localhost, a preview URL), or the browser sent no `Referer` (`Referrer-Policy: no-referrer` or `<meta name="referrer" content="no-referrer">`).
- **Honeypot:** the `_gotcha` field (the default honeypot name) had a value. Autofill or a visible field named `_gotcha` can fill it.
- Several submits within 5 seconds: the later ones got `TOO_MANY_REQUESTS`.

## A submission arrived, but fields or files are missing

- Inputs without the `fi-` prefix, or with an unknown type (`fi-textarea-*`, `fi-message-*`, `fi-tel-*`, `fi-hidden-*`), are dropped without an error.
- Inputs without a `name` attribute are not in FormData (React controlled inputs, `v-model`, `bind:value`).
- A checkbox group, multi-select or multiple-file input without `[]` keeps only the last value.
- Disabled inputs or a disabled `<fieldset>` at the moment FormData was built are left out.
- `fi-number-*` cuts decimals (`19.99` is stored as `19`): use `fi-text-*`.
- A file type Forminit does not accept, or a full storage quota, drops the file while the submission succeeds.
- A page URL with `utm_*` or click-ID parameters makes the SDK add tracking data, so a submission can succeed with only tracking fields when every real field was dropped.

## Other symptoms

- **Double submissions:** the in-flight flag is missing, set after the first `await`, or kept only in render state.
- **The page navigates to forminit.com/thank-you:** the browser posted natively because the handler did not run, `preventDefault()` is missing, or the code navigates to `redirectUrl`.
- **Works locally, fails in production:** a Content Security Policy that only production applies, or Authorized domains without the production host.
- **`Forminit is not defined`:** the script tag loads after the handler, or with `async`.
- **No error and no `hashId`, and the console shows `Forminit: undefined`:** a 2xx answer that is not JSON. Check the request in the browser's Network tab.
- **The old service still receives data:** a leftover `action`, hidden field, or second listener.
