// 1. 初始化一個假的起始數字 (讓它看起來已經運作很久了)
// 這裡設定從 849萬 開始，每次重新整理都會隨機加一點
let currentCount = 8492030 + Math.floor(Math.random() * 5000);

const counterElement = document.getElementById('counter');
const btn = document.getElementById('countBtn');
const stage = document.getElementById('sheepStage');
const pingElement = document.getElementById('ping');

// 2. 更新畫面數字的函式 (加上千分位逗號)
function updateDisplay() {
    counterElement.innerText = currentCount.toLocaleString();
}

// 3. 模擬「全球流量」自動增加
// 每 0.5 到 2 秒之間，自動增加 1~5 隻羊 (假裝別人在點)
function fakeGlobalTraffic() {
    const randomTime = Math.random() * 1500 + 500; 
    const randomIncrement = Math.floor(Math.random() * 5) + 1;
    
    setTimeout(() => {
        currentCount += randomIncrement;
        updateDisplay();
        
        // 隨機跳動 Ping 值，增加駭客感
        pingElement.innerText = Math.floor(Math.random() * 30) + 10;
        
        fakeGlobalTraffic(); // 遞迴呼叫，讓它永遠跑下去
    }, randomTime);
}

// 4. 使用者點擊按鈕的行為
btn.addEventListener('click', () => {
    // 數字 +1
    currentCount++;
    updateDisplay();
    
    // 產生一隻羊的動畫 DOM
    createSheep();
    
    // 如果你有聲音檔，可以在這裡播放
    // let audio = new Audio('baa.mp3');
    // audio.play();
});

// 產生羊動畫的函式
function createSheep() {
    const sheep = document.createElement('div');
    sheep.innerText = '🐑';
    sheep.classList.add('floating-sheep');
    
    // 讓羊隨機稍微往左或往右偏一點，比較自然
    const randomOffset = Math.floor(Math.random() * 100) - 50; 
    sheep.style.marginLeft = randomOffset + 'px';

    stage.appendChild(sheep);

    // 動畫結束後 (1秒) 把 DOM 刪除，避免記憶體爆炸
    setTimeout(() => {
        sheep.remove();
    }, 1000);
}

// 啟動！
updateDisplay();
fakeGlobalTraffic();