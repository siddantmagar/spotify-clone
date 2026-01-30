const form = document.getElementById("signupForm");

form.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const user = { name, email, password };

    localStorage.setItem("registeredUser", JSON.stringify(user));
    window.location.href = "login.html";
});

document.querySelector(".logo-btn").addEventListener("click", () => {
    window.location.href = "index.html";
});

document.querySelector(".home-btn").addEventListener("click", () => {
    window.location.href = "index.html";
});
const guestBtn = document.getElementById("guestBtn");

if (guestBtn) {
    guestBtn.addEventListener("click", () => {
        localStorage.setItem("guestUser", "true");
        window.location.href = "index.html";
    });
}
