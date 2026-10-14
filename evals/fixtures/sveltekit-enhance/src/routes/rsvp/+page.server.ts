import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name");
    if (!name) return fail(400, { missing: true });
    // TODO: send RSVP somewhere
    console.log(Object.fromEntries(data));
    return { success: true };
  },
};
