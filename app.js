document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------
    // DOM 元素獲取
    // --------------------------------------------------
    const screenHome = document.getElementById("screen-home");
    const screenResult = document.getElementById("screen-result");
    
    const drawBtn = document.getElementById("draw-btn");
    const restartBtn = document.getElementById("restart-btn");
    
    const drawVideo = document.getElementById("draw-video");
    const resultBgVideo = document.getElementById("result-bg-video");
    
    const blessingTextContent = document.getElementById("blessing-text-content");
    
    // --------------------------------------------------
    // 音效與狀態變數 (ENABLE_AUDIO 暫不啟用，保留高擴充性結構)
    // --------------------------------------------------
    const ENABLE_AUDIO = false;
    let isMuted = true;

    // --------------------------------------------------
    // 求籤主要邏輯
    // --------------------------------------------------
    let drawTimeout = null;
    let currentBlessing = "";
    let resultShown = false;

    // 執行隨機抽取法語
    function performDraw() {
        if (typeof BLESSINGS === "undefined" || BLESSINGS.length === 0) {
            console.error("無法載入祝福語資料庫！");
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * BLESSINGS.length);
        currentBlessing = BLESSINGS[randomIndex];
        
        // 直接渲染直書祝福語本文
        blessingTextContent.textContent = currentBlessing;
        
        // 清除先前的字數調節 class
        blessingTextContent.classList.remove("long-text", "extra-long-text");
        
        // 根據字數長短，自動調節字級大小以防破版
        if (currentBlessing.length > 55) {
            blessingTextContent.classList.add("extra-long-text");
        } else if (currentBlessing.length > 35) {
            blessingTextContent.classList.add("long-text");
        }
    }

    // 開始求籤互動
    function startDraw() {
        resultShown = false;

        // 1. 預先計算本次隨機法語結果 (背景默默進行)
        performDraw();

        // 2. 原地播放搖籤動畫影片：
        // 將 .animation-video 加上 .active 類別，在 CSS 中使其 opacity 0 -> 1 原地淡入。
        // 因為影片已在 DOM 中預載 (preload)，所以 currentTime 與 play() 會原地零延遲無縫流暢播放！
        drawVideo.classList.add("active");
        drawVideo.currentTime = 0;
        drawVideo.muted = isMuted;
        
        const playPromise = drawVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("影片自動播放受阻", error);
            });
        }

        // 3. 雙重保險強制計時：鎖定播放大約 3 秒，不可略過，3 秒後自動切換至結果頁
        if (drawTimeout) clearTimeout(drawTimeout);
        drawTimeout = setTimeout(() => {
            showResult();
        }, 3000);
    }

    // 搖籤影片正常播放完畢 (若 3 秒 timer 還沒觸發)
    drawVideo.addEventListener("ended", () => {
        showResult();
    });

    // 揭曉結果頁
    function showResult() {
        if (resultShown) return; // 避免 Timeout 與 Ended 事件重複觸發
        resultShown = true;

        if (drawTimeout) clearTimeout(drawTimeout);

        // 1. 停止求籤影片播放，並將其隱藏 (Opacity 設為 0)
        drawVideo.pause();
        drawVideo.classList.remove("active");
        
        // 2. 畫面切換：首頁 -> 結果頁
        screenHome.classList.remove("active");
        screenResult.classList.add("active");
        
        // 3. 啟動結果頁的動態背景影片播放 (循環且靜音)
        if (resultBgVideo) {
            resultBgVideo.currentTime = 0;
            resultBgVideo.muted = isMuted;
            const playPromise = resultBgVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("動態背景自動播放受限", error);
                });
            }
        }
    }

    // 重設狀態，回到首頁
    function resetToHome() {
        if (drawTimeout) clearTimeout(drawTimeout);
        resultShown = false;

        // 隱藏與停止影片播放
        drawVideo.pause();
        drawVideo.currentTime = 0;
        drawVideo.classList.remove("active");
        
        if (resultBgVideo) {
            resultBgVideo.pause();
            resultBgVideo.currentTime = 0;
        }

        // 切換畫面：結果頁 -> 首頁
        screenResult.classList.remove("active");
        screenHome.classList.add("active");
    }

    // --------------------------------------------------
    // 事件監聽繫結
    // --------------------------------------------------
    drawBtn.addEventListener("click", startDraw);
    restartBtn.addEventListener("click", resetToHome);
    
    // --------------------------------------------------
    // 基本防護：阻斷右鍵選單、複製事件與圖片拖曳
    // --------------------------------------------------
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("copy", e => e.preventDefault());
    document.addEventListener("dragstart", e => e.preventDefault());

    // 手機觸控反饋優化 (解決 active 狀態延遲)
    document.addEventListener("touchstart", function() {}, true);
});
