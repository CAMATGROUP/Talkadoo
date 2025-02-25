import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const logoutBtn = document.getElementById("logout-btn"); // Tambahkan tombol logout
const userNameElement = document.getElementById("user-name");
const usersList = document.getElementById("users-list");

let userId = null;
let userName = "Anonim";

// 🔹 Periksa Status Login Pengguna
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        userName = user.displayName || user.email;
        if (userNameElement) userNameElement.textContent = userName;

        // Simpan status online di Firestore
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { name: userName, online: true }, { merge: true });

        // Jika pengguna menutup tab, set offline dengan sendBeacon (agar async tetap berjalan)
        window.addEventListener("beforeunload", () => {
            navigator.sendBeacon(`/set-offline?uid=${userId}`);
        });

    } else {
        alert("Silakan login terlebih dahulu!");
        window.location.href = "index.html";
    }
});

// 🔹 Fungsi Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { online: false });

            await signOut(auth);
            window.location.href = "index.html";
        }
    });
}

// 🔹 Tampilkan Daftar Pengguna Online
onSnapshot(collection(db, "users"), (snapshot) => {
    if (!usersList) return;
    usersList.innerHTML = "";
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.online) {
            const listItem = document.createElement("li");
            listItem.textContent = data.name;
            usersList.appendChild(listItem);
        }
    });
});

// 🔹 Fungsi Kirim Pesan
if (sendBtn) {
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
}

// 🔹 Fungsi Ganti Nama
if (changeNameBtn) {
    changeNameBtn.addEventListener("click", async () => {
        const newName = prompt("Masukkan nama baru:");
        const user = auth.currentUser;

        if (newName && user) {
            try {
                await updateProfile(user, { displayName: newName });
                await setDoc(doc(db, "users", user.uid), { name: newName }, { merge: true });
                if (userNameElement) userNameElement.textContent = newName;
                alert("Nama berhasil diubah!");
            } catch (error) {
                console.error("Gagal mengubah nama:", error);
                alert("Terjadi kesalahan saat mengubah nama.");
            }
        }
    });
}

// 🔹 Fungsi Hapus Semua Chat
if (clearChatBtn) {
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
}

// 🔹 Format Waktu (HH:MM)
function formatTime(timestamp) {
    const date = timestamp.toDate();
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 🔹 Ambil & Tampilkan Pesan dari Firestore
const chatQuery = query(chatCollection, orderBy("timestamp"));
onSnapshot(chatQuery, (snapshot) => {
    if (!chatBox) return;
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
