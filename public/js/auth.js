// public/js/auth.js
//
// Simple name + phone "login" — remembered on this device via
// localStorage. There is no verification code, no email, no cost.
// This is an honor-system identity: good enough for a small trusted
// student community. See README "Good to know" for the tradeoff.

document.getElementById("btn-continue").addEventListener("click", () => {
  const errorEl = document.getElementById("details-error");
  errorEl.textContent = "";

  const name = document.getElementById("input-name").value.trim();
  const phone = document.getElementById("input-phone").value.trim();

  if (!name) {
    errorEl.textContent = "Please enter your name.";
    return;
  }
  if (!/^\+?\d{10,15}$/.test(phone)) {
    errorEl.textContent = "Please enter a valid phone number.";
    return;
  }

  localStorage.setItem("laundry_name", name);
  localStorage.setItem("laundry_phone", phone);

  window.dispatchEvent(new CustomEvent("app:logged-in", { detail: { name, phone } }));
});
