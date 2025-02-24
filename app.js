// 🔥 Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const chatCollection = collection(db, "chats");

// 🔹 Ambil Elemen HTML
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("input-box");
const sendBtn = document.getElementById("send-btn");
const changeNameBtn = document.getElementById("change-name-btn");
const clearChatBtn = document.getElementById("clear-chat-btn");

let userId = null;
let userName = "Anonim";

// 🔹 Periksa Status Login Pengguna
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        userName = user.displayName || user.email;
        console.log("User login:", user.email);
    } else {
        alert("Silakan login terlebih dahulu!");
        window.location.href = "index.html";
    }
});

// 🔹 Fungsi Kirim Pesan
sendBtn.addEventListener("click", async () => {
    const text = inputBox.value.trim();
    const user = auth.currentUser;

    if (text && user) {
        await addDoc(chatCollection, {
            message: text,
            user: user.uid,
            userName: user.displayName || user.email,
            timestamp: new Date()
        });
        inputBox.value = "";
    }
});

// 🔹 Fungsi Ganti Nama
changeNameBtn.addEventListener("click", async () => {
    const newName = prompt("Masukkan nama baru:");
    const user = auth.currentUser;

    if (newName && user) {
        try {
            await updateProfile(user, { displayName: newName });
            await user.reload(); // 🔄 Perbarui data pengguna
            alert("Nama berhasil diubah! Silakan logout dan login kembali untuk melihat perubahan.");
        } catch (error) {
            console.error("Gagal mengubah nama:", error);
            alert("Terjadi kesalahan saat mengubah nama.");
        }
    }
});

// 🔹 Fungsi Hapus Semua Chat
clearChatBtn.addEventListener("click", async () => {
    const confirmClear = confirm("Apakah Anda yakin ingin menghapus semua chat?");
    if (confirmClear) {
        const snapshot = await getDocs(chatCollection);
        snapshot.forEach(async (docSnapshot) => {
            await deleteDoc(doc(db, "chats", docSnapshot.id));
        });
        alert("Semua chat telah dihapus!");
    }
});

// 🔹 Format Waktu (HH:MM)
function formatTime(timestamp) {
    const date = timestamp.toDate();
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 🔹 Ambil & Tampilkan Pesan dari Firestore
const chatQuery = query(chatCollection, orderBy("timestamp"));
onSnapshot(chatQuery, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const messageId = docSnapshot.id;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        if (data.user === userId) {
            messageDiv.classList.add("sent");
        } else {
            messageDiv.classList.add("received");
        }

        // 🔹 Tambahkan Nama Pengguna
        const userNameText = document.createElement("strong");
        userNameText.textContent = data.userName || "Anonim";
        messageDiv.appendChild(userNameText);

        // 🔹 Tambahkan Waktu Pengiriman
        const timeText = document.createElement("small");
        timeText.textContent = ` (${formatTime(data.timestamp)})`;
        timeText.classList.add("time-stamp");

        // 🔹 Tambahkan Pesan
        const messageText = document.createElement("span");
        messageText.textContent = `: ${data.message}`;
        messageDiv.appendChild(messageText);
        messageDiv.appendChild(timeText);

        // 🔥 Double Tap untuk Menghapus Pesan
        if (data.user === userId) {
            messageDiv.addEventListener("dblclick", async () => {
                const confirmDelete = confirm("Apakah Anda yakin ingin menghapus pesan ini?");
                if (confirmDelete) {
                    await deleteDoc(doc(db, "chats", messageId));
                }
            });
        }

        chatBox.appendChild(messageDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
});

