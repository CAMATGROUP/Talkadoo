// 🔥 Import Firebase Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAuRv4GF-iPz_lWTPD-n-XQ_TGHI8JQjA4",
    authDomain: "chattest-7c1ea.firebaseapp.com",
    projectId: "chattest-7c1ea",
    storageBucket: "chattest-7c1ea.firebasestorage.app",
    messagingSenderId: "709727858961",
    appId: "1:709727858961:web:cb6e3cd1f662c739551cb0"
};

// 🔥 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔹 Elemen HTML
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const logoutBtn = document.getElementById("logout-btn");

// 🔹 Fungsi Registrasi
registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Registrasi berhasil! Silakan login.");
            registerForm.reset();
        })
        .catch((error) => {
            alert(error.message);
        });
});

// 🔹 Fungsi Login
loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Login berhasil!");
            loginForm.reset();
            window.location.href = "chat.html"; // Arahkan ke halaman chat
        })
        .catch((error) => {
            alert(error.message);
        });
});

// 🔹 Fungsi Logout
logoutBtn?.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            alert("Anda telah logout.");
            window.location.href = "index.html"; // Arahkan ke halaman login
        })
        .catch((error) => {
            alert(error.message);
        });
});

// 🔹 Cek Status Login
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User login:", user.email);
    } else {
        console.log("User logout");
    }
});
