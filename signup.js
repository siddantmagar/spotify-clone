/* signup.js — depends on auth.js being loaded first */

document.addEventListener("DOMContentLoaded", () => {
  // Navigation buttons
  document.querySelector(".logo-btn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.querySelector(".home-btn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // ── Sign-up form ──
  const form = document.getElementById("signupForm");
  form?.addEventListener("submit", e => {
    e.preventDefault();

    const name            = document.getElementById("name").value.trim();
    const email           = document.getElementById("email").value.trim();
    const password        = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Persist the registered account then go to login
    localStorage.setItem("registeredUser", JSON.stringify({ name, email, password }));
    window.location.href = "login.html";
  });

  // ── Continue as Guest ──
  document.getElementById("guestBtn")?.addEventListener("click", () => {
    Auth.setGuest();                    // write authMode = "guest"
    window.location.href = "index.html";
  });
});
