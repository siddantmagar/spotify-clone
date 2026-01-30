document.addEventListener("DOMContentLoaded", () => {

    /* ===================== AUTH GUARD ===================== */
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const isGuest = localStorage.getItem("guestUser");

    if (!user && !isGuest) {
        window.location.href = "login.html";
        return;
    }

    /* ===================== SEARCH BAR ===================== */
    const searchBar = document.querySelector(".searchbar");
    const cards = document.querySelectorAll(".cards");

    if (searchBar) {
        searchBar.addEventListener("click", () => {
            if (!searchBar.querySelector("input")) {
                searchBar.innerHTML = `
                    <input type="text" placeholder="What do you want to hear?"
                    style="width:90%; background:transparent; border:none; color:white; outline:none;">
                `;
                searchBar.querySelector("input").focus();
            }
        });

        searchBar.addEventListener("input", e => {
            const query = e.target.value.toLowerCase();
            cards.forEach(card => {
                const title = card.dataset.title.toLowerCase();
                card.style.display = title.includes(query) ? "block" : "none";
            });
        });
    }

    /* ===================== TOOLTIP ===================== */
    const tooltip = document.createElement("div");
    tooltip.className = "play-tooltip";
    tooltip.innerText = "Play";
    document.body.appendChild(tooltip);

    cards.forEach(card => {
        card.addEventListener("mouseenter", () => tooltip.style.opacity = "1");
        card.addEventListener("mouseleave", () => tooltip.style.opacity = "0");
        card.addEventListener("mousemove", e => {
            tooltip.style.left = e.clientX + 12 + "px";
            tooltip.style.top = e.clientY + 12 + "px";
        });
    });

    /*  PLAYLIST HELPERS == */
    function getPlaylists() {
        return JSON.parse(localStorage.getItem("playlists")) || {};
    }

    function savePlaylists(playlists) {
        localStorage.setItem("playlists", JSON.stringify(playlists));
    }

    function createPlaylist(name) {
        const playlists = getPlaylists();
        if (!playlists[name]) {
            playlists[name] = [];
            savePlaylists(playlists);
        }
    }

    function addSongToPlaylist(playlistName, songId) {
        const playlists = getPlaylists();
        if (!playlists[playlistName]) return;

        if (!playlists[playlistName].includes(songId)) {
            playlists[playlistName].push(songId);
            savePlaylists(playlists);
        }  
    }

    /* == LIBRARY PLAYLIST UI  */
    const playlistList = document.getElementById("playlist-list");
    const playlistSongs = document.getElementById("playlist-songs");

    function renderPlaylists() {
        if (!playlistList || isGuest) return;

        const playlists = getPlaylists();
        playlistList.innerHTML = "";

        Object.keys(playlists).forEach(name => {
            const li = document.createElement("li");
            li.className = "nav-btn";
            li.innerText = name;

            li.addEventListener("click", () => {
                renderPlaylistSongs(name, playlists[name]);
            });

            playlistList.appendChild(li);
        });
    }

    function renderPlaylistSongs(playlistName, songIds) {
        if (!playlistSongs) return;

        playlistSongs.innerHTML = `<h3>${playlistName}</h3>`;

        songIds.forEach(id => {
            const song = songsDB.find(s => s.id === id);
            if (!song) return;

            const div = document.createElement("div");
            div.className = "playlist-song";
            div.innerText = song.title;

            div.addEventListener("click", () => {
                const index = songsDB.findIndex(s => s.id === id);
                playSong(index);
            });

            playlistSongs.appendChild(div);
        });
    }

    /* ===================== LIBRARY (+) BUTTON ===================== */
    const libraryPlus = document.querySelector(".addlogo");

    if (libraryPlus) {
        libraryPlus.addEventListener("click", () => {
            if (isGuest) {
                alert("Login to create playlists 🎧");
                return;
            }

            if (currentIndex === -1) {
                alert("Play a song first");
                return;
            }

            const playlistName = prompt("Enter playlist name");
            if (!playlistName) return;

            createPlaylist(playlistName);
            addSongToPlaylist(playlistName, songsDB[currentIndex].id);
            renderPlaylists();

            alert(`Song added to playlist "${playlistName}"`);
        });
    }

    /* ===================== AUTH AREA ===================== */
    const authArea = document.getElementById("auth-area");

    if (authArea) {
        if (user) {
            authArea.innerHTML = `
                <li class="nav-btn username">${user.name}</li>
                <li class="nav-btn" id="logout">Logout</li>
            `;
            document.getElementById("logout").onclick = () => {
                localStorage.removeItem("loggedInUser");
                window.location.href = "login.html";
            };
        } else {
            authArea.innerHTML = `
                <li class="nav-btn username">Guest</li>
                <li class="nav-btn" id="login-btn">Log In</li>
            `;
            document.getElementById("login-btn").onclick = () => {
                localStorage.removeItem("guestUser");
                window.location.href = "login.html";
            };
        }
    }

    /* ===================== MUSIC PLAYER ===================== */
    const audioPlayer = document.getElementById("audioPlayer");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const progressBar = document.getElementById("progressBar");
    const currentTimeEl = document.getElementById("currentTime");
    const durationEl = document.getElementById("duration");
    const playerTitle = document.getElementById("player-title");
    const playerArtist = document.getElementById("player-artist");
    const playerCover = document.getElementById("player-cover");

    let currentIndex = -1;

    function formatTime(time) {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60).toString().padStart(2, "0");
        return `${min}:${sec}`;
    }

    function playSong(index) {
        const song = songsDB[index];
        if (!song) return;

        currentIndex = index;
        audioPlayer.src = song.src;
        audioPlayer.play();

        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        playerCover.src = song.cover;
        playPauseBtn.textContent = "⏸";

        cards.forEach(c => c.classList.remove("active"));
        cards[index].classList.add("active");
    }

    cards.forEach((card, index) => {
        card.addEventListener("click", () => {
            if (currentIndex === index && !audioPlayer.paused) {
                audioPlayer.pause();
                playPauseBtn.textContent = "▶";
            } else {
                playSong(index);
            }
        });
    });

    playPauseBtn.onclick = () => {
        if (!audioPlayer.src) return;
        audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
        playPauseBtn.textContent = audioPlayer.paused ? "▶" : "⏸";
    };

    nextBtn.onclick = () => playSong((currentIndex + 1) % songsDB.length);
    prevBtn.onclick = () => playSong((currentIndex - 1 + songsDB.length) % songsDB.length);

    audioPlayer.addEventListener("timeupdate", () => {
        progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    audioPlayer.addEventListener("loadedmetadata", () => {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });

    progressBar.oninput = () => {
        audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
    };

    audioPlayer.onended = () => {
        playPauseBtn.textContent = "▶";
        cards.forEach(c => c.classList.remove("active"));
    };

    /* ===================== INITIAL LOAD ===================== */
    // if (user) {
    //     renderPlaylists();
    // }
    if (!isGuest) {
        renderPlaylists();
    }


});
