<script lang="ts">
  import { enhance } from "$app/forms";

  let { form } = $props();
  let attending = $state("yes");
</script>

<section class="rsvp">
  <h1 class="script">Will you join us?</h1>

  {#if form?.success}
    <p class="thanks">Thank you! We can't wait to celebrate with you.</p>
  {:else}
    <form method="POST" use:enhance class="rsvp-form">
      <label>Full name <input name="name" required /></label>
      <label>Email <input name="email" type="email" required /></label>
      <label>Mobile number <input name="phone" type="tel" placeholder="+44 7700 900123" pattern="\+[0-9 ]+" /></label>

      <fieldset>
        <legend>Attending?</legend>
        <label><input type="radio" name="attending" value="yes" bind:group={attending} /> Joyfully accepts</label>
        <label><input type="radio" name="attending" value="no" bind:group={attending} /> Regretfully declines</label>
      </fieldset>

      {#if attending === "yes"}
        <label>Number of guests <input name="guests" type="number" min="1" max="4" value="1" /></label>
        <fieldset>
          <legend>Dietary needs</legend>
          <label><input type="checkbox" name="diet" value="vegetarian" /> Vegetarian</label>
          <label><input type="checkbox" name="diet" value="vegan" /> Vegan</label>
          <label><input type="checkbox" name="diet" value="gluten-free" /> Gluten free</label>
        </fieldset>
        <label>Song request <input name="song" /></label>
      {/if}

      <label>A photo of you two for our guestbook (optional) <input type="file" name="photo" accept="image/*" /></label>
      <label>Message for the couple <textarea name="message" rows="3"></textarea></label>

      {#if form?.missing}<p class="err">Please tell us your name.</p>{/if}
      <button type="submit" class="btn">Send RSVP</button>
    </form>
  {/if}
</section>

<style>
  .rsvp { max-width: 560px; margin: 0 auto; padding: 48px 20px; text-align: center; }
  .script { font-family: "Great Vibes", cursive; font-size: 48px; }
  .rsvp-form { display: grid; gap: 14px; text-align: left; }
  .btn { background: #8a6d3b; color: white; border: none; padding: 12px; border-radius: 999px; }
  .thanks { font-size: 20px; }
  .err { color: #a33; }
</style>
