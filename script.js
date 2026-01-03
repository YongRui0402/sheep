// 1. 初始化：從瀏覽器 LocalStorage 讀取數字，如果沒有則為 0
let myCount = localStorage.getItem('sheepCount') ? parseInt(localStorage.getItem('sheepCount')) : 0;

// 綁定 DOM 元素
const counterElement = document.getElementById('counter');
const rankElement = document.getElementById('rank');
const btn = document.getElementById('countBtn');
const resetBtn = document.getElementById('resetBtn');
const stage = document.getElementById('sheepStage');

// 2. 定義稱號系統 (您可以自由修改文字)
const titles = [
    { count: 0, title: "路過的旅人" },
    { count: 10, title: "失眠的新手" },
    { count: 50, title: "數羊愛好者" },
    { count: 100, title: "初級牧羊人" },
    { count: 300, title: "很有耐心" },
    { count: 500, title: "浪費時間的天才" },
    { count: 1000, title: "手指健身教練" },
    { count: 2000, title: "無聊也是一種才華" },
    { count: 5000, title: "羊群之主" },
    { count: 10000, title: "傳說中的牧神" },
    { count: 99999, title: "你滑鼠還好嗎？" }
];

// 3. 更新畫面函式
function updateDisplay() {
    // 更新數字 (加上千分位逗號)
    counterElement.innerText = myCount.toLocaleString();
    
    // 計算稱號
    let currentTitle = titles[0].title;
    for (let i = 0; i < titles.length; i++) {
        if (myCount >= titles[i].count) {
            currentTitle = titles[i].title;
        } else {
            break;
        }
    }
    rankElement.innerText = currentTitle;
    
    // 儲存進瀏覽器 (關鍵步驟)
    localStorage.setItem('sheepCount', myCount);
}

// 4. 產生羊動畫
function createSheep() {
    const sheep = document.createElement('div');
    sheep.innerText = '🐑'; // 這裡是 emoji，也可以換成圖片
    sheep.classList.add('floating-sheep');
    
    // 讓羊出現的位置稍微左右隨機偏移，比較自然
    const randomOffset = Math.floor(Math.random() * 80) - 40; 
    sheep.style.marginLeft = randomOffset + 'px';

    stage.appendChild(sheep);

    // 動畫結束後從 DOM 移除，避免佔用記憶體
    setTimeout(() => {
        sheep.remove();
    }, 600);
}

// 5. 監聽點擊事件
btn.addEventListener('click', (e) => {
    myCount++;
    updateDisplay();
    createSheep();
    
    // 點擊特效：按鈕輕微震動 (可選)
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5);
    }
});

// 6. 監聽重置事件
resetBtn.addEventListener('click', () => {
    if (confirm('確定要殺光所有的羊，重新開始你的人生嗎？(紀錄將無法復原)')) {
        myCount = 0;
        updateDisplay();
    }
});

// 程式啟動時先執行一次
updateDisplay();