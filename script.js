// ==========================================
// 1. Firebase 設定
// ==========================================
// 這裡已填入你提供的專案設定
const firebaseConfig = {
    apiKey: "AIzaSyD2jSIbll7FynFeOUCdx6b7floGaGkR3bk",
    authDomain: "sheep-clicker-730a0.firebaseapp.com",
    projectId: "sheep-clicker-730a0",
    storageBucket: "sheep-clicker-730a0.firebasestorage.app",
    messagingSenderId: "945043257232",
    appId: "1:945043257232:web:89d8aebf79cd1ad1c2a515",
    measurementId: "G-S6TXPS3RDR"
};

// 初始化 Firebase
// 注意：我們不需要 import，因為 index.html 已經引入了 firebase SDK
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    console.log("Firebase 連線成功");
} catch (e) {
    console.error("Firebase 初始化失敗", e);
}

// ==========================================
// 2. 遊戲邏輯 (前端)
// ==========================================
let score = 0;
const scoreDisplay = document.getElementById('score');
const clickBtn = document.getElementById('click-btn');

// 讀取本地存檔
if (localStorage.getItem('sheep_score')) {
    score = parseInt(localStorage.getItem('sheep_score'));
    updateView();
}

// 點擊事件
clickBtn.addEventListener('click', () => {
    score++;
    updateView();
    localStorage.setItem('sheep_score', score);
});

function updateView() {
    // 簡單的保護，確保 scoreDisplay 存在才更新 (防止報錯)
    if(scoreDisplay) {
        scoreDisplay.innerText = score;
    }
}

// ==========================================
// 3. 排行榜邏輯 (後端)
// ==========================================
const nicknameInput = document.getElementById('nickname');
const uploadBtn = document.getElementById('upload-btn');
const refreshBtn = document.getElementById('refresh-btn');
const statusMsg = document.getElementById('status-msg');

// 取得 IP (使用 ipify 免費 API)
async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (err) {
        console.error("IP 取得失敗", err);
        return null;
    }
}

// 上傳功能
if (uploadBtn) { // 確保按鈕存在才加入監聽
    uploadBtn.addEventListener('click', async () => {
        const name = nicknameInput.value.trim();
        if (!name) {
            setStatus("請輸入 ID", "red");
            return;
        }

        uploadBtn.disabled = true;
        setStatus("連線中...", "#666");

        const ip = await getIP();
        if (!ip) {
            setStatus("無法辨識來源 IP (請關閉擋廣告外掛)", "red");
            uploadBtn.disabled = false;
            return;
        }

        // 邏輯：使用 IP_暱稱 作為唯一識別碼
        const docId = `${ip}_${name}`; 
        const docRef = db.collection('leaderboard').doc(docId);

        try {
            const doc = await docRef.get();
            if (doc.exists) {
                const oldScore = doc.data().score;
                if (score > oldScore) {
                    await docRef.update({
                        score: score,
                        // 使用 Compat 版本的 ServerTimestamp 寫法
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    setStatus("紀錄更新完成", "green");
                } else {
                    setStatus(`未超過您的最高紀錄 (${oldScore})`, "#d35400");
                }
            } else {
                await docRef.set({
                    nickname: name,
                    ip: ip,
                    score: score,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                setStatus("簽到成功", "green");
            }
            
            loadLeaderboard();

        } catch (e) {
            console.error(e);
            setStatus("連線錯誤 (請檢查 Firebase Rules)", "red");
        } finally {
            uploadBtn.disabled = false;
        }
    });
}

function setStatus(msg, color) {
    if(!statusMsg) return;
    statusMsg.innerText = msg;
    statusMsg.style.color = color;
    setTimeout(() => {
        if(statusMsg.innerText === msg) statusMsg.innerText = "";
    }, 3000);
}

// 讀取排行榜
async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if(!tbody) return; // 防止找不到元素報錯

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">載入中...</td></tr>';

    try {
        const q = await db.collection('leaderboard')
                          .orderBy('score', 'desc')
                          .limit(10)
                          .get();

        tbody.innerHTML = '';
        let rank = 1;
        
        if (q.empty) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">尚無紀錄</td></tr>';
            return;
        }

        q.forEach(doc => {
            const data = doc.data();
            // 簡單 XSS 防護
            const safeName = data.nickname ? data.nickname.replace(/</g, "&lt;") : "無名氏";
            tbody.innerHTML += `
                <tr>
                    <td>${rank++}</td>
                    <td>${safeName}</td>
                    <td>${data.score}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">讀取失敗 (請檢查 console)</td></tr>';
    }
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', loadLeaderboard);
}

// 啟動時自動載入
loadLeaderboard();