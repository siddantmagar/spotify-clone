/* login.js — requires auth.js to be loaded first */

document.addEventListener("DOMContentLoaded", () => {

  /* ── BUG FIX: only skip the login page if the user is ALREADY LOGGED IN.
     Previously this checked Auth.mode !== "logged_out", which also caught
     "guest" mode — meaning a guest clicking "Log in" was immediately bounced
     back to index.html and could NEVER see the login form.
     
     Correct behaviour:
       "logged_in"  → already authenticated, skip straight to index.html
       "guest"      → wants to upgrade to a real account; show the form
       "logged_out" → normal new login; show the form ── */
  if (Auth.isLoggedIn) {
    window.location.href = "index.html";
    return;
  }

  const form    = document.getElementById("loginForm");
  const errorEl = document.getElementById("error-msg");

  /* Always show errors inside the inline error element.
     Never rely on window.alert for auth errors — it can be overridden
     or blocked, and inline errors are better UX anyway. */
  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
    }
  }
  function clearError() {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "";
    }
  }

  if (!form) return;   // safety: form element must exist

  form.addEventListener("submit", e => {
    e.preventDefault();      // prevent any page reload
    clearError();

    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    // Load the account that was registered via signup.html
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("registeredUser"));
    } catch (_) {
      saved = null;
    }

    if (saved && email === saved.email.toLowerCase() && password === saved.password) {
      // ── Credentials match ──
      // Write auth state BEFORE redirecting so index.html reads it correctly
      Auth.setLoggedIn(saved);
      window.location.href = "index.html";
    } else {
      showError("Incorrect email or password. Please try again.");
    }
  });

});