document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------
    // DOM 元素獲取
    // --------------------------------------------------
    const screenHome = document.getElementById("screen-home");
    const screenResult = document.getElementById("screen-result");
    
    const drawBtn = document.getElementById("draw-btn");
    
    const drawVideo = document.getElementById("draw-video");
    const resultBgVideo = document.getElementById("result-bg-video");
    
    const blockContent1 = document.getElementById("block-content-1");
    const blockContent2 = document.getElementById("block-content-2");
    const blockContent3 = document.getElementById("block-content-3");
    
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

    // 1~2 區塊的資料庫 (定義於此，避免 file:// CORS 跨網域存取限制)
    const JIN_BAO_WORDS = ["信", "願", "行"];
    const ZHAO_CAI_WORDS = ["布施", "持戒", "忍辱", "精進", "禪定", "般若"];

    // 將字串中的 Markdown 粗體 **文字** 轉換為 HTML 的 <strong>文字</strong> 標籤 (防 XSS 設計)
    function formatMarkdownBold(text) {
        if (!text) return "";
        const safeText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        return safeText.replace(/\*\*(.*?)\*\*/g, "$1");
    }

    // 執行隨機抽取法語與招財、淨寶字組
    function performDraw() {
        if (typeof BLESSINGS === "undefined" || BLESSINGS.length === 0) {
            console.error("無法載入祝福語資料庫！");
            return;
        }
        
        // 1. 區塊 1 隨機抽取 (淨寶：信、願、行 隨機一個字)
        const randomJinBao = JIN_BAO_WORDS[Math.floor(Math.random() * JIN_BAO_WORDS.length)];
        if (blockContent1) blockContent1.textContent = randomJinBao;

        // 2. 區塊 2 隨機抽取 (招財：布施、持戒、忍辱、精進、禪定、般若 隨機一個詞)
        const randomZhaoCai = ZHAO_CAI_WORDS[Math.floor(Math.random() * ZHAO_CAI_WORDS.length)];
        if (blockContent2) blockContent2.textContent = randomZhaoCai;

        // 3. 區塊 3 隨機抽取 (舊有 blessings.js 祝福語)
        const randomIndex = Math.floor(Math.random() * BLESSINGS.length);
        currentBlessing = BLESSINGS[randomIndex];
        
        if (blockContent3) {
            // 使用 innerHTML 寫入格式化後的粗體 HTML，而非 textContent，解決 markdown 星號字元顯示問題
            blockContent3.innerHTML = formatMarkdownBold(currentBlessing);
            
            // 清除先前的字數調節 class
            blockContent3.classList.remove("long-text", "extra-long-text", "extra-extra-long-text");
            
            // 根據字數長短，自動調節字級大小以防破版 (無按鈕新版：大幅度提升高度至 54.0% 後的極致大氣四層級判定)
            if (currentBlessing.length > 65) {
                blockContent3.classList.add("extra-extra-long-text");
            } else if (currentBlessing.length > 48) {
                blockContent3.classList.add("extra-long-text");
            } else if (currentBlessing.length > 35) {
                blockContent3.classList.add("long-text");
            }
        }
    }

    // 開始求籤互動
    function startDraw() {
        resultShown = false;

        // 1. 預先計算本次隨機法語結果 (背景默默進行)
        performDraw();

        // 2. 原地播放搖籤動畫影片：
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

    // --------------------------------------------------
    // 事件監聽繫結
    // --------------------------------------------------
    drawBtn.addEventListener("click", startDraw);
    
    // --------------------------------------------------
    // 基本防護：阻斷右鍵選單、複製事件與圖片拖曳
    // --------------------------------------------------
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("copy", e => e.preventDefault());
    document.addEventListener("dragstart", e => e.preventDefault());

    // 手機觸控反饋優化 (解決 active 狀態延遲)
    document.addEventListener("touchstart", function() {}, true);
});
