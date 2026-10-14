// Contact form: not connected to a backend yet.
const projectForm = document.getElementById("project-form");
const formMessage = document.getElementById("form-message");

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!projectForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(projectForm));
  console.log("TODO: send", values);
  formMessage.textContent = "Thanks! We will be in touch soon.";
  projectForm.reset();
});
