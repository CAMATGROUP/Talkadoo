// 🔥 Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const chatCollection = collection(db, "chats");

// 🔹 Ambil Elemen HTML
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("input-box");
const sendBtn = document.getElementById("send-btn");
const changeNameBtn = document.getElementById("change-name-btn");
const clearChatBtn = document.getElementById("clear-chat-btn");

// 🔹 Minta Nama Pengguna Saat Pertama Kali Masuk
let userName = localStorage.getItem("chatUserName");
if (!userName) {
    userName = prompt("Masukkan nama Anda:");
    localStorage.setItem("chatUserName", userName);
}

// 🔹 Buat ID Unik untuk Pengguna
const userId = localStorage.getItem("chatUserId") || Math.random().toString(36).substring(2, 10);
localStorage.setItem("chatUserId", userId);

// 🔹 Fungsi Kirim Pesan
sendBtn.addEventListener("click", async () => {
    const text = inputBox.value.trim();
    if (text) {
        await addDoc(chatCollection, {
            message: text,
            user: userId,
            userName: userName,
            timestamp: new Date()
        });
        inputBox.value = ""; // Kosongkan input setelah dikirim
    }
});

// 🔹 Fungsi Ganti Nama
changeNameBtn.addEventListener("click", () => {
    const newName = prompt("Masukkan nama baru:");
    if (newName) {
        userName = newName;
        localStorage.setItem("chatUserName", userName);
        alert("Nama berhasil diubah!");
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
