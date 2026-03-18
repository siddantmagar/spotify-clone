/* ============================================================
   script.js  —  Musicify main application
   Requires: auth.js, songs.js (loaded before this file)

   Auth modes respected throughout:
     "logged_out" → Auth.require() redirects to login immediately
     "guest"      → browse + play only; all playlist actions blocked
     "logged_in"  → full access including playlist CRUD
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Guard: redirect logged-out visitors to login ── */
  Auth.require();

  /* ══════════════════════════════════════════════════════════
     UTILITIES
  ══════════════════════════════════════════════════════════ */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Convenience aliases — read from Auth module (the single source of truth) */
  const isLoggedIn = Auth.isLoggedIn;   // true only for "logged_in" mode
  const isGuest    = Auth.isGuest;      // true only for "guest" mode
  const user       = Auth.user;         // user object or null

  /* ══════════════════════════════════════════════════════════
     AUTH AREA  (top-right navbar)
     Renders different UI for each of the three modes.
  ══════════════════════════════════════════════════════════ */
  const authArea = document.getElementById("auth-area");

  function renderAuthArea() {
    if (!authArea) return;

    if (isLoggedIn) {
      /* ── LOGGED IN: user chip with dropdown ── */
      authArea.innerHTML = `
        <button class="nav-btn btn-ghost">Premium</button>
        <button class="nav-btn btn-ghost">Support</button>
        <div class="nav-divider"></div>
        <button class="user-chip" id="user-menu-btn"
                aria-haspopup="true" aria-expanded="false" title="Account menu">
          <div class="user-avatar">${escapeHTML(user.name.charAt(0).toUpperCase())}</div>
          <span class="user-chip-name">${escapeHTML(user.name)}</span>
          <svg style="width:14px;height:14px;fill:var(--text);margin-left:4px;flex-shrink:0"
               viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <div class="user-dropdown" id="user-dropdown" hidden>
          <button class="dropdown-item" id="logout-btn">
            <svg viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5z
                       M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Log out
          </button>
        </div>`;

      const menuBtn  = document.getElementById("user-menu-btn");
      const dropdown = document.getElementById("user-dropdown");

      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        const isOpen = !dropdown.hidden;
        dropdown.hidden = isOpen;
        menuBtn.setAttribute("aria-expanded", String(!isOpen));
      });

      // Close dropdown when clicking anywhere else
      document.addEventListener("click", () => { dropdown.hidden = true; });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape") dropdown.hidden = true;
      });

      document.getElementById("logout-btn").addEventListener("click", () => {
        Auth.logout();   // clears authMode + authUser, redirects to login
      });

    } else if (isGuest) {
      /* ── GUEST: show label + option to log in ── */
      authArea.innerHTML = `
        <button class="nav-btn btn-ghost">Premium</button>
        <button class="nav-btn btn-ghost">Support</button>
        <div class="nav-divider"></div>
        <div class="user-chip" style="cursor:default" title="Browsing as guest">
          <div class="user-avatar" style="background:var(--text)">G</div>
          <span class="user-chip-name" style="color:var(--text)">Guest</span>
        </div>
        <button class="nav-btn btn-outline" onclick="window.location.href='signup.html'">
          Sign up
        </button>
        <button class="nav-btn btn-solid" onclick="window.location.href='login.html'">
          Log in
        </button>`;

    } else {
      /* ── LOGGED OUT (should not reach here due to Auth.require(), but defensive) ── */
      authArea.innerHTML = `
        <div class="nav-divider"></div>
        <button class="nav-btn btn-ghost" id="nav-guest-btn">Continue as Guest</button>
        <button class="nav-btn btn-outline" onclick="window.location.href='signup.html'">Sign up</button>
        <button class="nav-btn btn-solid"   onclick="window.location.href='login.html'">Log in</button>`;

      document.getElementById("nav-guest-btn")?.addEventListener("click", () => {
        Auth.setGuest();
        window.location.reload();
      });
    }
  }

  renderAuthArea();

  /* ══════════════════════════════════════════════════════════
     PLAYER BAR  — hidden until a song starts playing
  ══════════════════════════════════════════════════════════ */
  const playerBar = document.querySelector(".player-bar");

  function showPlayerBar() {
    playerBar?.classList.add("player-bar--visible");
  }

  /* ══════════════════════════════════════════════════════════
     SEARCH
  ══════════════════════════════════════════════════════════ */
  const searchInput = document.getElementById("searchInput");
  const cards       = document.querySelectorAll(".card");

  searchInput?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    cards.forEach(card => {
      const title = (card.querySelector(".card-title")?.textContent || "").toLowerCase();
      const sub   = (card.querySelector(".card-sub")?.textContent   || "").toLowerCase();
      card.style.display = (!q || title.includes(q) || sub.includes(q)) ? "" : "none";
    });
  });

  /* ══════════════════════════════════════════════════════════
     CARD HOVER TOOLTIP
     Each card reads its own .card-title on mouseenter.
     No shared state, no overlap between cards.
  ══════════════════════════════════════════════════════════ */
  const tooltip = document.getElementById("tooltip");

  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      if (!tooltip) return;
      tooltip.textContent  = card.querySelector(".card-title")?.textContent || "Play";
      tooltip.style.opacity = "1";
    });
    card.addEventListener("mouseleave", () => {
      if (tooltip) tooltip.style.opacity = "0";
    });
    card.addEventListener("mousemove", e => {
      if (!tooltip) return;
      tooltip.style.left = (e.clientX + 14) + "px";
      tooltip.style.top  = (e.clientY + 14) + "px";
    });
  });

  /* ══════════════════════════════════════════════════════════
     PLAYLIST STORAGE HELPERS
     All helpers are no-ops / return early if not logged in.
     Guest users physically cannot call these successfully
     because the UI never surfaces playlist controls to them.
  ══════════════════════════════════════════════════════════ */
  function requireLogin(action) {
    /* Central permission check.
       Returns true if action is allowed, false + shows message if not. */
    if (isLoggedIn) return true;
    if (isGuest) {
      alert(`Sign up or log in to ${action}.`);
    }
    return false;
  }

  function getPlaylists() {
    if (!isLoggedIn) return {};
    try { return JSON.parse(localStorage.getItem(Auth.playlistKey())) || {}; }
    catch { return {}; }
  }
  function savePlaylists(pl) {
    if (!isLoggedIn) return;
    localStorage.setItem(Auth.playlistKey(), JSON.stringify(pl));
  }
  function createPlaylist(name) {
    const pl = getPlaylists();
    if (!pl[name]) { pl[name] = []; savePlaylists(pl); }
  }
  function renamePlaylist(oldName, newName) {
    if (!newName || newName === oldName) return false;
    const pl = getPlaylists();
    if (pl[newName]) return false;
    pl[newName] = pl[oldName];
    delete pl[oldName];
    savePlaylists(pl);
    return true;
  }
  function deletePlaylist(name) {
    const pl = getPlaylists();
    delete pl[name];
    savePlaylists(pl);
  }
  function addSongToPlaylist(name, songId) {
    const pl = getPlaylists();
    if (!pl[name]) return;
    if (!pl[name].includes(songId)) { pl[name].push(songId); savePlaylists(pl); }
  }
  function removeSongFromPlaylist(name, songId) {
    const pl = getPlaylists();
    if (!pl[name]) return;
    pl[name] = pl[name].filter(id => id !== songId);
    savePlaylists(pl);
  }

  /* ══════════════════════════════════════════════════════════
     PLAYLIST DETAIL MODAL
  ══════════════════════════════════════════════════════════ */
  function openPlaylistModal(name) {
    if (!requireLogin("manage playlists")) return;

    document.getElementById("pl-modal")?.remove();

    const pl    = getPlaylists();
    const songs = pl[name] || [];

    const songRows = songs.map(id => {
      const s = songsDB.find(s => s.id === id);
      if (!s) return "";
      return `
        <div class="pm-song-row" data-id="${s.id}">
          <img class="pm-song-thumb" src="${escapeHTML(s.cover)}" alt="${escapeHTML(s.title)}" />
          <div class="pm-song-info">
            <div class="pm-song-title">${escapeHTML(s.title)}</div>
            <div class="pm-song-artist">${escapeHTML(s.artist)}</div>
          </div>
          <button class="pm-remove-song" data-id="${s.id}"
                  title="Remove from playlist" aria-label="Remove ${escapeHTML(s.title)}">
            <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          </button>
        </div>`;
    }).join("");

    const canAddCurrent = currentIndex >= 0 &&
                          !songs.includes(songsDB[currentIndex]?.id);

    const modal = document.createElement("div");
    modal.id = "pl-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `Playlist: ${name}`);
    modal.innerHTML = `
      <div class="pm-backdrop"></div>
      <div class="pm-panel">
        <header class="pm-header">
          <div class="pm-header-left">
            <div class="pm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
            </div>
            <div>
              <h2 class="pm-title">${escapeHTML(name)}</h2>
              <p class="pm-meta">${songs.length} song${songs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div class="pm-header-actions">
            <button class="pm-btn pm-btn-ghost" id="pm-rename-btn">
              <svg viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z
                         M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0
                         0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Rename
            </button>
            <button class="pm-btn pm-btn-danger" id="pm-delete-btn">
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z
                         M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
            <button class="pm-close" id="pm-close-btn" aria-label="Close modal">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12
                         5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="pm-add-current" id="pm-add-current"
             style="display:${canAddCurrent ? "flex" : "none"}">
          <svg viewBox="0 0 24 24">
            <path d="M12 4v16M4 12h16" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
          Add currently playing song
        </div>

        <div class="pm-song-list" id="pm-song-list">
          ${songRows || `<p class="pm-empty">This playlist is empty.</p>`}
        </div>
      </div>`;

    document.body.appendChild(modal);

    function closeModal() { modal.remove(); }

    modal.querySelector(".pm-backdrop").addEventListener("click", closeModal);
    document.getElementById("pm-close-btn").addEventListener("click", closeModal);

    const escClose = e => {
      if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", escClose); }
    };
    document.addEventListener("keydown", escClose);

    document.getElementById("pm-rename-btn").addEventListener("click", () => {
      const newName = prompt("New playlist name:", name)?.trim();
      if (!newName) return;
      if (renamePlaylist(name, newName)) {
        renderPlaylists();
        closeModal();
        openPlaylistModal(newName);
      } else {
        alert(`"${newName}" already exists or is invalid.`);
      }
    });

    document.getElementById("pm-delete-btn").addEventListener("click", () => {
      if (!confirm(`Delete playlist "${name}"? This cannot be undone.`)) return;
      deletePlaylist(name);
      renderPlaylists();
      closeModal();
    });

    document.getElementById("pm-add-current")?.addEventListener("click", () => {
      if (currentIndex < 0) return;
      addSongToPlaylist(name, songsDB[currentIndex].id);
      renderPlaylists();
      closeModal();
      openPlaylistModal(name);
    });

    document.getElementById("pm-song-list").addEventListener("click", e => {
      const btn = e.target.closest(".pm-remove-song");
      if (!btn) return;
      removeSongFromPlaylist(name, Number(btn.dataset.id));
      renderPlaylists();
      closeModal();
      openPlaylistModal(name);
    });
  }

  /* ══════════════════════════════════════════════════════════
     LIBRARY SIDEBAR
  ══════════════════════════════════════════════════════════ */
  const playlistList = document.getElementById("playlist-list");
  const libraryEmpty = document.getElementById("library-empty");

  function renderPlaylists() {
    if (!playlistList) return;

    /* Guest users see a prompt to sign up instead of playlists */
    if (!isLoggedIn) {
      playlistList.innerHTML = "";
      if (libraryEmpty) {
        libraryEmpty.style.display = "";
        libraryEmpty.querySelector("h4").textContent = "Log in to see playlists";
        libraryEmpty.querySelector("p").textContent  = "Create and manage your music library.";
        const btn = libraryEmpty.querySelector(".create-btn");
        if (btn) {
          btn.textContent = "Log in";
          btn.onclick = () => window.location.href = "login.html";
        }
      }
      return;
    }

    const pl    = getPlaylists();
    const names = Object.keys(pl);
    playlistList.innerHTML = "";

    if (names.length === 0) {
      if (libraryEmpty) libraryEmpty.style.display = "";
      return;
    }
    if (libraryEmpty) libraryEmpty.style.display = "none";

    names.forEach(name => {
      const count = pl[name].length;
      const li = document.createElement("li");
      li.className = "pl-item";
      li.setAttribute("role", "listitem");
      li.innerHTML = `
        <div class="pl-thumb" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
        </div>
        <div class="pl-info">
          <div class="pl-name">${escapeHTML(name)}</div>
          <div class="pl-meta">Playlist · ${count} song${count !== 1 ? "s" : ""}</div>
        </div>`;
      li.addEventListener("click", () => openPlaylistModal(name));
      playlistList.appendChild(li);
    });
  }

  /* ── "+" Create playlist button ── */
  document.getElementById("create-playlist-btn")?.addEventListener("click", () => {
    if (!requireLogin("create playlists")) return;
    if (currentIndex < 0) {
      alert("Play a song first, then press + to save it to a playlist.");
      return;
    }
    const name = prompt("Playlist name:")?.trim();
    if (!name) return;
    const pl = getPlaylists();
    if (pl[name]) {
      alert(`A playlist named "${name}" already exists.`);
      return;
    }
    createPlaylist(name);
    addSongToPlaylist(name, songsDB[currentIndex].id);
    renderPlaylists();
  });

  /* ══════════════════════════════════════════════════════════
     MUSIC PLAYER
     Available to all modes (logged_out redirects before here).
  ══════════════════════════════════════════════════════════ */
  const audio         = document.getElementById("audioPlayer");
  const playPauseBtn  = document.getElementById("playPauseBtn");
  const playIcon      = document.getElementById("playIcon");
  const pauseIcon     = document.getElementById("pauseIcon");
  const prevBtn       = document.getElementById("prevBtn");
  const nextBtn       = document.getElementById("nextBtn");
  const progressBar   = document.getElementById("progressBar");
  const progFill      = document.getElementById("prog-fill");
  const progThumb     = document.getElementById("prog-thumb");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl    = document.getElementById("duration");
  const playerTitle   = document.getElementById("player-title");
  const playerArtist  = document.getElementById("player-artist");
  const playerCover   = document.getElementById("player-cover");

  let currentIndex = -1;

  function fmt(t) {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  }

  function setPlayState(playing) {
    if (playIcon)  playIcon.style.display  = playing ? "none" : "";
    if (pauseIcon) pauseIcon.style.display = playing ? ""     : "none";
    playPauseBtn?.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function playSong(index) {
    const song = songsDB[index];
    if (!song) return;
    currentIndex = index;
    audio.src    = song.src;
    if (playerTitle)  playerTitle.textContent  = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    if (playerCover)  { playerCover.src = song.cover; playerCover.alt = song.title; }
    audio.play().catch(() => { showPlayerBar(); setPlayState(false); });
    cards.forEach((c, i) => c.classList.toggle("now-playing", i === index));
  }

  audio.addEventListener("play",  () => { showPlayerBar(); setPlayState(true); });
  audio.addEventListener("pause", () => { setPlayState(false); });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.value    = pct;
    if (progFill)    progFill.style.width = pct + "%";
    if (progThumb)   progThumb.style.left = pct + "%";
    if (currentTimeEl) currentTimeEl.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationEl) durationEl.textContent = fmt(audio.duration);
  });

  audio.addEventListener("ended", () => {
    playSong((currentIndex + 1) % songsDB.length);
  });

  cards.forEach((card, index) => {
    function handlePlay(e) {
      e.stopPropagation();
      if (currentIndex === index && !audio.paused) audio.pause();
      else playSong(index);
    }
    card.addEventListener("click", handlePlay);
    card.querySelector(".card-play")?.addEventListener("click", handlePlay);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePlay(e); }
    });
  });

  playPauseBtn?.addEventListener("click", () => {
    if (currentIndex < 0) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  prevBtn?.addEventListener("click", () =>
    playSong((currentIndex - 1 + songsDB.length) % songsDB.length)
  );
  nextBtn?.addEventListener("click", () =>
    playSong((currentIndex + 1) % songsDB.length)
  );

  progressBar?.addEventListener("input", () => {
    if (!audio.duration) return;
    const pct = Number(progressBar.value);
    audio.currentTime    = (pct / 100) * audio.duration;
    if (progFill)  progFill.style.width = pct + "%";
    if (progThumb) progThumb.style.left = pct + "%";
  });

  /* ══════════════════════════════════════════════════════════
     INITIAL RENDER
  ══════════════════════════════════════════════════════════ */
  renderPlaylists();

});
