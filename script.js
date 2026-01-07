// ==========================================
// 1. Firebase 設定
// ==========================================
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
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    console.log("Firebase 連線成功");
} catch (e) {
    console.error("Firebase 初始化失敗", e);
}

// ==========================================
// 2. 遊戲邏輯 (前端 + 對話框)
// ==========================================
let score = 0;
const scoreDisplay = document.getElementById('score');
const clickBtn = document.getElementById('click-btn');
const toast = document.getElementById('message-toast');
const toastText = document.getElementById('toast-text');

// 讀取本地存檔
if (localStorage.getItem('sheep_score')) {
    score = parseInt(localStorage.getItem('sheep_score'));
    updateView();
}

// 趣味對話設定
const messages = [
    { threshold: 10, text: "剛開始熱身而已！" },
    { threshold: 50, text: "手速不錯喔！" },
    { threshold: 100, text: "羊毛要被薅光了！" },
    { threshold: 200, text: "手不痠嗎？" },
    { threshold: 500, text: "你已經是專業牧羊人了！" },
    { threshold: 1000, text: "太瘋狂了！休息一下吧？" },
    { threshold: 5000, text: "神一般的指法！" },
    { threshold: 10000, text: "這已經不是人類的速度了..." }
];

function showToast(msg) {
    if (!toast || !toastText) return;
    toastText.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function checkMessages(currentScore) {
    const match = messages.find(m => m.threshold === currentScore);
    if (match) {
        showToast(match.text);
    }
}

// 點擊事件
if (clickBtn) {
    clickBtn.addEventListener('click', (e) => { // 注意這裡多了 (e) 參數
        score++;
        updateView();
        checkMessages(score);
        localStorage.setItem('sheep_score', score);
        
        // ★★★ 新增：觸發點擊動畫特效 ★★★
        spawnPlusOne(e);
    });
}

function updateView() {
    if(scoreDisplay) {
        scoreDisplay.innerText = score;
    }
}

// ★★★ 新增：歸零功能 (防止洗版用) ★★★
function resetGame() {
    score = 0;
    updateView();
    localStorage.setItem('sheep_score', 0);
    // 也可以顯示一個提示告訴玩家羊已經送出了
    showToast("羊群已送達牧場，計數歸零！");
}

// ★★★ 新增：產生 +1 動畫粒子的函式 ★★★
function spawnPlusOne(event) {
    // 建立一個新的 span 元素
    const particle = document.createElement('span');
    particle.classList.add('plus-one-particle');
    particle.innerText = '+1';
    
    // 計算點擊位置相對於按鈕左上角的座標
    // 這樣 +1 就會從你滑鼠點擊的那個點冒出來
    const rect = clickBtn.getBoundingClientRect();
    
    // 如果是滑鼠點擊，使用滑鼠座標；如果是鍵盤觸發，則使用按鈕中心點
    let x, y;
    if (event.clientX && event.clientY) {
         x = event.clientX - rect.left;
         y = event.clientY - rect.top;
    } else {
         x = rect.width / 2;
         y = rect.height / 2;
    }

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // 將粒子加到按鈕裡面
    clickBtn.appendChild(particle);
    
    // 監聽動畫結束事件，動畫一結束就移除這個元素，保持 DOM 整潔
    particle.addEventListener('animationend', () => {
        particle.remove();
    });
}

// ==========================================
// 3. 排行榜 & 全域統計 (後端)
// ==========================================
const nicknameInput = document.getElementById('nickname');
const uploadBtn = document.getElementById('upload-btn');
const refreshBtn = document.getElementById('refresh-btn');
const statusMsg = document.getElementById('status-msg');

// 全域統計 DOM
const globalSheepDisplay = document.getElementById('global-sheep');
const globalVisitorsDisplay = document.getElementById('global-visitors');

// 取得 IP
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

// 監聽全域統計
function listenToGlobalStats() {
    if (!globalSheepDisplay || !globalVisitorsDisplay) return;

    db.doc('app/stats').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            globalSheepDisplay.innerText = (data.totalSheep || 0).toLocaleString();
            globalVisitorsDisplay.innerText = (data.visitorCount || 0).toLocaleString();
        } else {
            globalSheepDisplay.innerText = "0";
            globalVisitorsDisplay.innerText = "0";
        }
    }, (error) => {
        console.error("無法讀取全域統計", error);
    });
}

// 上傳功能
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const name = nicknameInput.value.trim();
        
        // 基本阻擋
        if (!name) return setStatus("請輸入 ID", "red");
        if (score === 0) return setStatus("0 隻羊不用紀錄啦", "#666");

        uploadBtn.disabled = true;
        setStatus("連線中...", "#666");

        const ip = await getIP();
        if (!ip) {
            setStatus("無法辨識來源 IP (請關閉擋廣告外掛)", "red");
            uploadBtn.disabled = false;
            return;
        }

        const docId = `${ip}_${name}`; 
        const userRef = db.collection('leaderboard').doc(docId);
        const statsRef = db.collection('app').doc('stats');

        try {
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const statsDoc = await transaction.get(statsRef);
                
                let scoreDelta = 0; 
                let isNewUser = false;
                let updateNeeded = false; // 標記是否真的有更新資料

                if (!userDoc.exists) {
                    // 全新使用者 (或新名字)
                    isNewUser = true;
                    scoreDelta = score;
                    updateNeeded = true;
                    
                    transaction.set(userRef, {
                        nickname: name,
                        ip: ip,
                        score: score,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // 舊使用者，只更新差額
                    const oldScore = userDoc.data().score || 0;
                    if (score > oldScore) {
                        scoreDelta = score - oldScore;
                        updateNeeded = true;
                        transaction.update(userRef, {
                            score: score,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // 未破紀錄，不寫入
                        return "no_update";
                    }
                }

                // 更新全域統計
                if (!statsDoc.exists) {
                    transaction.set(statsRef, {
                        totalSheep: score,
                        visitorCount: 1
                    });
                } else {
                    if (scoreDelta > 0) {
                        transaction.update(statsRef, {
                            totalSheep: firebase.firestore.FieldValue.increment(scoreDelta)
                        });
                    }
                    if (isNewUser) {
                        transaction.update(statsRef, {
                            visitorCount: firebase.firestore.FieldValue.increment(1)
                        });
                    }
                }
                
                return "success";
            });

            // 成功後的處理
            setStatus("紀錄同步完成！", "green");
            
            // ★★★ 關鍵修改：上傳成功後，清空手上的羊 ★★★
            resetGame(); 
            
            loadLeaderboard();

        } catch (e) {
            console.error(e);
            if (e.message && e.message.includes("no_update")) {
                 setStatus("未超過您的最高紀錄 (請繼續累積)", "#d35400");
                 // 注意：如果沒破紀錄，這裡不呼叫 resetGame()，讓玩家繼續點
            } else {
                 setStatus("連線錯誤 (請檢查 Log)", "red");
            }
        } finally {
            uploadBtn.disabled = false;
        }
    });
}

function setStatus(msg, color) {
    if(!statusMsg) return;
    statusMsg.innerText = msg;
    statusMsg.style.color = color;
    // 防止 timer 衝突
    if(statusMsg.timer) clearTimeout(statusMsg.timer);
    statusMsg.timer = setTimeout(() => {
        if(statusMsg.innerText === msg) statusMsg.innerText = "";
    }, 4000);
}

// 讀取排行榜
async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if(!tbody) return;

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
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">讀取失敗</td></tr>';
    }
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', loadLeaderboard);
}

// 啟動時執行
loadLeaderboard();
listenToGlobalStats();