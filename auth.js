/* ============================================================
   auth.js  —  Musicify shared auth state module
   Load this script FIRST on every page (before login.js / script.js).

   Auth modes (stored in localStorage key "authMode"):
     "logged_out"  →  no session active
     "guest"       →  browsing + playback only; no playlist access
     "logged_in"   →  full access; user object stored in "authUser"

   window.Auth API:
     Auth.mode           → current mode string
     Auth.user           → user object (logged_in only) or null
     Auth.isLoggedIn     → boolean, true only for "logged_in"
     Auth.isGuest        → boolean, true only for "guest"
     Auth.setGuest()     → write authMode = "guest"
     Auth.setLoggedIn(u) → write authMode = "logged_in" + store user
     Auth.logout()       → write authMode = "logged_out", redirect login
     Auth.require()      → redirect to login only if truly logged_out
     Auth.playlistKey()  → namespaced localStorage key for playlists
   ============================================================ */

(function () {
  const MODE_KEY = "authMode";
  const USER_KEY = "authUser";

  function readMode() {
    // Treat missing/null/empty as "logged_out"
    return localStorage.getItem(MODE_KEY) || "logged_out";
  }

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (_) {
      return null;
    }
  }

  const Auth = {
    get mode()       { return readMode(); },
    get user()       { return readMode() === "logged_in" ? readUser() : null; },
    get isLoggedIn() { return readMode() === "logged_in"; },
    get isGuest()    { return readMode() === "guest"; },

    setGuest() {
      localStorage.setItem(MODE_KEY, "guest");
      localStorage.removeItem(USER_KEY);
    },

    setLoggedIn(userObj) {
      localStorage.setItem(MODE_KEY, "logged_in");
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    },

    logout() {
      localStorage.setItem(MODE_KEY, "logged_out");
      localStorage.removeItem(USER_KEY);
      window.location.href = "login.html";
    },

    /**
     * Use on pages that require at least guest access (e.g. index.html).
     * Only redirects if mode is strictly "logged_out".
     * Does NOT redirect guests — guests are allowed to browse and play.
     */
    require() {
      if (readMode() === "logged_out") {
        window.location.href = "login.html";
      }
    },

    playlistKey() {
      const u = this.user;
      return u ? `playlists_${u.email}` : "playlists_guest";
    },
  };

  window.Auth = Auth;

  // ── One-time migration from old dual-key scheme ─────────────────────────
  // Converts legacy loggedInUser / guestUser keys to new authMode / authUser.
  // Runs only when authMode is absent (first load after upgrade).
  if (!localStorage.getItem(MODE_KEY)) {
    const oldUser  = localStorage.getItem("loggedInUser");
    const oldGuest = localStorage.getItem("guestUser");

    if (oldUser) {
      try {
        const u = JSON.parse(oldUser);
        if (u && u.email) {
          Auth.setLoggedIn(u);
        }
      } catch (_) { /* corrupt data — leave as logged_out */ }
    } else if (oldGuest === "true") {
      Auth.setGuest();
    }
    // Always remove old keys to prevent confusion on future loads
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("guestUser");
  }

}());