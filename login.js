// const form = document.getElementById("loginForm");

// form.addEventListener("submit", e => {
//     e.preventDefault();

//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;

//     if (email === "test@gmail.com" && password === "123456") {
//         alert("Login successful");
//         window.location.href = "index.html";
//     } else {
//         alert("Invalid credentials");
//     }
// });

// const form = document.getElementById("loginForm");

// form.addEventListener("submit", e => {
//     e.preventDefault();

//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;

//     const savedUser = JSON.parse(localStorage.getItem("user"));

//     if (savedUser && email === savedUser.email && password === savedUser.password) {
//         alert("Login successful");
//         window.location.href = "index.html";
//     } else {
//         alert("Invalid credentials");
//     }
// });

// document.querySelector(".logo-btn").addEventListener("click", () => {
//     window.location.href = "index.html";
// });

// document.querySelector(".home-btn").addEventListener("click", () => {
//     window.location.href = "index.html";
// });
const form = document.getElementById("loginForm");

form.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const savedUser = JSON.parse(localStorage.getItem("registeredUser"));

    if (savedUser && email === savedUser.email && password === savedUser.password) {
        localStorage.setItem("loggedInUser", JSON.stringify(savedUser));
        window.location.href = "index.html";
    } else {
        alert("Invalid credentials");
    }
});
