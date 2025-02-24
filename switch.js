document.addEventListener("DOMContentLoaded", function () {
    const loginBox = document.getElementById("login-box");
    const registerBox = document.getElementById("register-box");
    const showLoginBtn = document.getElementById("show-login");
    const showRegisterBtn = document.getElementById("show-register");

    // Sembunyikan registerBox saat awal
    registerBox.style.display = "none";

    // Event listener untuk tombol "Daftar"
    showRegisterBtn.addEventListener("click", function () {
        loginBox.style.display = "none";  // Hilangkan login box
        registerBox.style.display = "block"; // Tampilkan register box tanpa animasi atau perubahan warna
    });

    // Event listener untuk tombol "Login"
    showLoginBtn.addEventListener("click", function () {
        registerBox.style.display = "none"; // Hilangkan register box
        loginBox.style.display = "block";  // Tampilkan login box tanpa animasi atau perubahan warna
    });
});
