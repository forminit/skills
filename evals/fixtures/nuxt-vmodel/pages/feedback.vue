<script setup lang="ts">
import { ref, reactive } from "vue";

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  classDate: "",
  instructor: "",
  rating: "",
  topics: [] as string[],
  comments: "",
});
const done = ref(false);
const failed = ref(false);

async function submitFeedback() {
  failed.value = false;
  try {
    await $fetch("/api/feedback", { method: "POST", body: form });
    done.value = true;
  } catch {
    failed.value = true;
  }
}
</script>

<template>
  <div class="wrap">
    <h1>How was your class?</h1>
    <p v-if="done" class="note">Thank you, namaste!</p>
    <form v-else class="f" @submit.prevent="submitFeedback">
      <label>First name <input v-model="form.firstName" required /></label>
      <label>Last name <input v-model="form.lastName" /></label>
      <label>Email <input v-model="form.email" type="email" required /></label>
      <label>Class date <input v-model="form.classDate" type="date" /></label>
      <label>
        Instructor
        <select v-model="form.instructor">
          <option value="maya">Maya</option>
          <option value="leo">Leo</option>
          <option value="ana">Ana</option>
        </select>
      </label>
      <fieldset>
        <legend>Rating</legend>
        <div class="stars">
          <label v-for="n in 5" :key="n"><input v-model="form.rating" type="radio" :value="String(n)" /> {{ n }}</label>
        </div>
      </fieldset>
      <label>
        Topics you want more of
        <select v-model="form.topics" multiple>
          <option value="breathwork">Breathwork</option>
          <option value="mobility">Mobility</option>
          <option value="meditation">Meditation</option>
        </select>
      </label>
      <label>Comments <textarea v-model="form.comments" rows="4" /></label>
      <p v-if="failed" class="note">Could not send. Please try again.</p>
      <button class="cta" type="submit">Send feedback</button>
    </form>
  </div>
</template>
