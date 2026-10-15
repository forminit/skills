# Phone input with a country picker

Read this when the plan's phone answer is a phone library or a dial-code dropdown. Use the countries the user named, the first one as the default. `fi-sender-phone` must arrive in international form (`+447700900123`); both options below take care of that, so the visitor never types a `+`.

Never add hint text such as "Include your country code" under the input. A placeholder shows the default country's local format, like `07700 900123` for the UK.

## Phone library (the better experience)

React and Next.js: `react-phone-number-input`. Its `value` is already international.

```tsx
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const [phone, setPhone] = useState<string | undefined>();

<PhoneInput
  countries={["GB", "US"]} // the countries the user named
  defaultCountry="GB"
  international
  value={phone}
  onChange={setPhone}
/>

// in the submit handler, after building fd:
if (phone) fd.set("fi-sender-phone", phone);
```

Other stacks (HTML with a bundler, Vue, Svelte, Astro): `intl-tel-input`. Keep `name="fi-sender-phone"` on the input and initialise it once, after the input exists (Vue `onMounted`, Svelte `onMount`, Astro inside `bind`):

```js
import intlTelInput from "intl-tel-input";
import "intl-tel-input/styles";

const phoneInput = form.querySelector('[name="fi-sender-phone"]');
const iti = intlTelInput(phoneInput, {
  onlyCountries: ["gb", "us"], // the countries the user named, lowercase
  initialCountry: "gb",
  separateDialCode: true, // shows +44 next to the flag
  loadUtils: () => import("intl-tel-input/utils"),
});

// in the submit handler, after building fd:
if (phoneInput.value.trim()) fd.set("fi-sender-phone", iti.getNumber()); // +447700900123
```

Pages without a bundler: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/css/intlTelInput.css">` and `<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/js/intlTelInputWithUtils.min.js"></script>` (global `intlTelInput`, utils included, so no `loadUtils`).

## Dial-code dropdown (no dependency)

A `<select>` with no `name`, one option per country the user named, right before the phone input and in one row with it. Give it the form's existing select or input classes; wrap the pair in a `<div>` with `display: flex` and the form's gap only if no existing class does that.

```html
<div class="phone-row">
  <select data-dial-code aria-label="Country code">
    <option value="+44">+44</option>
    <option value="+1">+1</option>
  </select>
  <input type="tel" name="fi-sender-phone" autocomplete="tel-national" placeholder="07700 900123">
</div>
```

After building the FormData, combine the two. This is the only allowed rewrite of a phone value:

```js
const dial = form.querySelector("[data-dial-code]")?.value;
const phone = fd.get("fi-sender-phone");
if (dial && typeof phone === "string" && phone.trim() && !phone.trim().startsWith("+")) {
  fd.set("fi-sender-phone", dial + phone.replace(/\D/g, "").replace(/^0/, "")); // drop the local leading 0
}
```

Italian landlines keep their leading 0 (`+39 06...`); if the user lists Italy, use the phone library instead.
