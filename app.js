import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAuRv4GF-iPz_lWTPD-n-XQ_TGHI8JQjA4",
    authDomain: "chattest-7c1ea.firebaseapp.com",
    projectId: "chattest-7c1ea",
    storageBucket: "chattest-7c1ea.appspot.com",
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
const logoutBtn = document.getElementById("logout-btn");
const userNameElement = document.getElementById("user-name");
const usersList = document.getElementById("users-list");
const typingIndicator = document.getElementById("typing-indicator");
const replyPreview = document.getElementById("reply-preview");
const replyMessage = document.getElementById("reply-message");
const cancelReplyBtn = document.getElementById("cancel-reply-btn");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

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
        await setDoc(userRef, { name: userName, online: true, typing: false }, { merge: true });

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
            await updateDoc(userRef, { online: false, typing: false });

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

// 🔹 Fungsi Kirim Pesan (Dengan Balasan)
if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
        const text = inputBox.value.trim();
        const user = auth.currentUser;

        if (text && user) {
            const messageData = {
                message: text,
                user: user.uid,
                userName: user.displayName || user.email,
                timestamp: new Date()
            };

            // Jika ada pesan yang dibalas, tambahkan ID pesan tersebut
            if (window.replyToMessageId) {
                messageData.replyTo = window.replyToMessageId;
            }

            await addDoc(chatCollection, messageData);
            inputBox.value = "";

            // Reset reply preview
            replyPreview.style.display = "none";
            window.replyToMessageId = null;
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
onSnapshot(chatQuery, async (snapshot) => {
    if (!chatBox) return;
    chatBox.innerHTML = "";

    for (const docSnapshot of snapshot.docs) {
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
        messageDiv.appendChild(timeText); // Tambahkan ini untuk menampilkan timestamp

        // 🔹 Tampilkan Pesan Teks
        const messageText = document.createElement("span");
        messageText.textContent = `: ${data.message}`;
        messageDiv.appendChild(messageText);

        // 🔹 Tampilkan Pesan Balasan
        if (data.replyTo) {
            const replyToMessage = await getDoc(doc(db, "chats", data.replyTo));
            if (replyToMessage.exists()) {
                const replyData = replyToMessage.data();
                const replyText = document.createElement("div");
                replyText.classList.add("reply-text");
                replyText.textContent = `Membalas: ${replyData.message}`;
                messageDiv.appendChild(replyText);
            }
        }

       // 🔹 Tambahkan Tombol Reply dengan SVG
    const replyBtn = document.createElement("div");
    replyBtn.innerHTML = `
    <svg class="reply-btn" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 9l-3 3 3 3"></path>
        <path d="M13 12h7"></path>
    </svg>
`;
messageDiv.appendChild(replyBtn);

        replyBtn.addEventListener("click", () => {
            // Tampilkan pesan yang dibalas di reply-preview
            replyMessage.textContent = data.message; // Pesan yang dibalas
            replyPreview.style.display = "block";

            // Simpan ID pesan yang dibalas di variabel global
            window.replyToMessageId = messageId;
        });

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
    }

    chatBox.scrollTop = chatBox.scrollHeight;
});

// 🔹 Fungsi untuk Membatalkan Balasan
if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener("click", () => {
        replyPreview.style.display = "none";
        window.replyToMessageId = null; // Reset ID pesan yang dibalas
    });
}

// 🔹 Typing Indicator Logic
const TYPING_TIMEOUT = 3000; // 3 detik

// 🔹 Deteksi Ketika Pengguna Mulai Mengetik
inputBox.addEventListener("input", async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { typing: true, lastTypingTime: new Date() });
    }
});

// 🔹 Deteksi Ketika Pengguna Berhenti Mengetik
inputBox.addEventListener("blur", async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { typing: false });
    }
});

// 🔹 Tampilkan Typing Indicator
onSnapshot(collection(db, "users"), (snapshot) => {
    const typingUsers = [];
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lastTypingTime = data.lastTypingTime?.toDate();
        const isTyping = data.typing && data.uid !== userId;

        // Cek apakah pengguna masih mengetik berdasarkan waktu terakhir
        if (isTyping && lastTypingTime && (new Date() - lastTypingTime) < TYPING_TIMEOUT) {
            typingUsers.push(data.name);
        }
    });

    if (typingIndicator) {
        if (typingUsers.length > 0) {
            typingIndicator.textContent = `${typingUsers.join(", ")} sedang mengetik...`;
        } else {
            typingIndicator.textContent = "";
        }
    }
});

// 🔹 Tambahkan Logika Emoji Picker
if (emojiBtn && emojiPicker) {
    emojiBtn.addEventListener("click", () => {
        emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
    });

    emojiPicker.addEventListener("emoji-click", (event) => {
        inputBox.value += event.detail.unicode;
        emojiPicker.style.display = "none";
    });

    document.addEventListener("click", (event) => {
        if (!emojiPicker.contains(event.target) && !emojiBtn.contains(event.target)) {
            emojiPicker.style.display = "none";
        }
    });
}

// 🔹 Kirim Pesan dengan Tombol Enter
inputBox.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) { // Pastikan Shift + Enter tidak mengirim pesan
        event.preventDefault(); // Mencegah perilaku default (seperti membuat baris baru)

        // Panggil fungsi yang sama seperti saat tombol Send diklik
        const text = inputBox.value.trim();
        const user = auth.currentUser;

        if (text && user) {
            const messageData = {
                message: text,
                user: user.uid,
                userName: user.displayName || user.email,
                timestamp: new Date()
            };

            // Jika ada pesan yang dibalas, tambahkan ID pesan tersebut
            if (window.replyToMessageId) {
                messageData.replyTo = window.replyToMessageId;
            }

            await addDoc(chatCollection, messageData);
            inputBox.value = "";

            // Reset reply preview
            replyPreview.style.display = "none";
            window.replyToMessageId = null;
        }
    }
});

inputBox.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Mencegah baris baru jika hanya Enter
        // Kode untuk mengirim pesan
    } else if (event.key === "Enter" && event.shiftKey) {
        // Biarkan pengguna membuat baris baru dengan Shift + Enter
        return;
    }
});

function addMessage(message, isReceived) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isReceived ? 'received' : 'sent');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll ke bawah
}
