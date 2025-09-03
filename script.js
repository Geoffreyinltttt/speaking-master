// 練習內容數據 - 從 Excel 載入
let vocabulary = [];
let idioms = [];
let passages = [];
let dataLoaded = false;

// 工具函數：清理回饋容器
function clearFeedbackContainer() {
    const feedbackContainer = document.getElementById('feedbackContainer');
    if (feedbackContainer) {
        feedbackContainer.innerHTML = '';
    }
}

// 瀏覽器相容性檢測
function checkBrowserCompatibility() {
    console.log('開始檢查瀏覽器相容性...');
    
    // 在頁面上顯示檢測狀態（用於手機調試）
    showDebugInfo('檢查瀏覽器相容性中...');
    
    // 檢測語音識別支援
    const hasSpeechRecognition = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    
    // 檢測瀏覽器類型
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');

    // 如果不是Edge，顯示Edge推薦提示
    if (hasSpeechRecognition && !isEdge) {
        setTimeout(() => {
            showEdgeRecommendation();
            hideDebugInfo();
        }, 2000);
        return true;
    }
    
    // 顯示檢測結果
    const debugInfo = `
        瀏覽器: ${isFirefox ? 'Firefox' : isChrome ? 'Chrome' : isEdge ? 'Edge' : isSafari ? 'Safari' : '未知'}
        語音支援: ${hasSpeechRecognition ? '是' : '否'}
        User Agent: ${userAgent.substring(0, 50)}...
    `;
    showDebugInfo(debugInfo);
    
    // 進一步測試語音識別功能是否真的可用
    if (hasSpeechRecognition) {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const testRecognition = new SpeechRecognition();
            
            // 如果能成功創建，但是 Firefox 用戶，顯示警告
            if (isFirefox) {
                showDebugInfo('Firefox 檢測到語音 API，但可能功能有限...');
                setTimeout(() => {
                    showFirefoxWarning();
                    hideDebugInfo();
                }, 2000);
                return true; // 讓 Firefox 繼續，但顯示警告
            }
            
            console.log('語音識別測試成功');
            showDebugInfo('瀏覽器相容性檢查通過！');
            setTimeout(hideDebugInfo, 2000);
            return true;
            
        } catch (error) {
            console.log('語音識別創建失敗:', error);
            showDebugInfo('語音識別創建失敗，顯示警告...');
            setTimeout(() => {
                showBrowserCompatibilityWarning();
                hideDebugInfo();
            }, 2000);
            return false;
        }
    } else {
        console.log('檢測到不支援語音識別的瀏覽器');
        showDebugInfo('不支援語音識別，顯示警告...');
        setTimeout(() => {
            showBrowserCompatibilityWarning();
            hideDebugInfo();
        }, 2000);
        return false;
    }
}

// Firefox 專用警告（功能可能有限）
function showFirefoxWarning() {
    console.log('顯示 Firefox 專用警告...');
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'firefoxWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    warningDiv.style.zIndex = '9999';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-orange-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">Firefox 語音功能提醒</h3>
            <p class="text-slate-300 mb-6 leading-relaxed">
                Firefox 的語音識別功能可能不穩定或功能有限。<br>
                如果遇到語音識別問題，建議使用：
            </p>
            
            <div class="text-left mb-6 space-y-2">
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Google Chrome（最佳體驗）</span>
                </div>
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Microsoft Edge</span>
                </div>
            </div>
            
            <div class="space-y-3">
                <button onclick="continueWithFirefox()" class="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300">
                    繼續使用 Firefox
                </button>
                <button onclick="dismissFirefoxWarning()" class="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl transition-all duration-300">
                    我知道了
                </button>
            </div>
            
            <p class="text-xs text-slate-400 mt-4">
                💡 如果語音識別無反應，請嘗試重新整理頁面或換瀏覽器
            </p>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    console.log('Firefox 警告已顯示');
}

function continueWithFirefox() {
    const warning = document.getElementById('firefoxWarning');
    if (warning) warning.remove();
}

function dismissFirefoxWarning() {
    const warning = document.getElementById('firefoxWarning');
    if (warning) warning.remove();
}

// 顯示Edge推薦提示
function showEdgeRecommendation() {
    console.log('顯示Edge推薦提示...');
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'edgeRecommendation';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    warningDiv.style.zIndex = '9999';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-blue-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">獲得最佳語音體驗</h3>
            <p class="text-slate-300 mb-6 leading-relaxed">
                為了提供更自然流暢的AI語音效果，<br>
                建議使用 <strong class="text-blue-400">Microsoft Edge</strong> 瀏覽器：
            </p>
            
            <div class="text-left mb-6 space-y-3">
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Microsoft Aria 高品質AI語音</span>
                </div>
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>更自然的發音和語調</span>
                </div>
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>最佳學習效果</span>
                </div>
            </div>
            
            <div class="space-y-3">
                <button onclick="continueWithCurrentBrowser()" class="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl transition-all duration-300">
                    繼續使用目前瀏覽器
                </button>
                <button onclick="dismissEdgeRecommendation()" class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300">
                    我知道了
                </button>
            </div>
            
            <p class="text-xs text-slate-400 mt-4">
                💡 Edge瀏覽器完全免費，可與現有瀏覽器並存使用
            </p>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
}

function continueWithCurrentBrowser() {
    const recommendation = document.getElementById('edgeRecommendation');
    if (recommendation) recommendation.remove();
}

function dismissEdgeRecommendation() {
    const recommendation = document.getElementById('edgeRecommendation');
    if (recommendation) recommendation.remove();
}

// 顯示調試資訊（手機可見）
function showDebugInfo(message) {
    let debugDiv = document.getElementById('debugInfo');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'debugInfo';
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 12px;
            line-height: 1.4;
            white-space: pre-line;
        `;
        document.body.appendChild(debugDiv);
    }
    debugDiv.textContent = message;
}

// 隱藏調試資訊
function hideDebugInfo() {
    const debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
        debugDiv.remove();
    }
}

function showBrowserCompatibilityWarning() {
    console.log('正在顯示瀏覽器相容性警告...');
    
    // 先移除現有的警告（如果有的話）
    const existingWarning = document.getElementById('browserWarning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'browserWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    warningDiv.style.zIndex = '9999'; // 確保在最上層
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-yellow-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">瀏覽器不支援語音識別</h3>
            <p class="text-slate-300 mb-6 leading-relaxed">
                您目前使用的瀏覽器不支援 Web Speech API。<br>
                建議您使用以下瀏覽器以獲得最佳體驗：
            </p>
            
            <div class="text-left mb-6 space-y-2">
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Google Chrome（推薦）</span>
                </div>
                <div class="flex items-center gap-3 text-green-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Microsoft Edge</span>
                </div>
                <div class="flex items-center gap-3 text-yellow-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Safari（有限支援）</span>
                </div>
                <div class="flex items-center gap-3 text-red-400">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Firefox（不支援）</span>
                </div>
            </div>
            
            <div class="space-y-3">
                <button onclick="proceedWithoutSpeech()" class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300">
                    仍要繼續使用（無語音功能）
                </button>
                <button onclick="dismissWarning()" class="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl transition-all duration-300">
                    我知道了
                </button>
            </div>
            
            <p class="text-xs text-slate-400 mt-4">
                💡 提示：您仍可以使用聆聽功能來學習正確發音
            </p>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    console.log('瀏覽器相容性警告已顯示');
    
    // 強制顯示（防止 CSS 問題）
    setTimeout(() => {
        warningDiv.style.display = 'flex';
    }, 100);
}

function proceedWithoutSpeech() {
    const warning = document.getElementById('browserWarning');
    if (warning) warning.remove();
    
    // 設定全域標記，表示無語音功能
    window.speechDisabled = true;
    
    // 禁用所有錄音按鈕
    disableRecordingFeatures();
}

function dismissWarning() {
    const warning = document.getElementById('browserWarning');
    if (warning) warning.remove();
}

function disableRecordingFeatures() {
    // 隱藏或禁用錄音按鈕的通用函數
    const style = document.createElement('style');
    style.textContent = `
        #recordBtn {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
        #recordBtn::after {
            content: '（不支援語音輸入）';
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            color: #ef4444;
            white-space: nowrap;
        }
        #transcriptArea {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
}

// 自動載入 Excel 數據
async function loadDataFromFile() {
    const loadingStatus = document.getElementById('loadingStatus');
    const loadError = document.getElementById('loadError');
    
    try {
        loadingStatus.textContent = '正在讀取 data.xlsx...';
        loadError.classList.add('hidden');
        
        // 使用 fetch 載入固定的 Excel 檔案
        const response = await fetch('data.xlsx');
        if (!response.ok) {
            throw new Error(`無法載入檔案: ${response.status} ${response.statusText}`);
        }
        
        loadingStatus.textContent = '正在解析 Excel 數據...';
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // 處理 words 分頁
        if (workbook.SheetNames.includes('words')) {
            loadingStatus.textContent = '正在處理單字數據...';
            const wordsSheet = workbook.Sheets['words'];
            const wordsData = XLSX.utils.sheet_to_json(wordsSheet, { header: 1 });
            vocabulary = processWordsSheet(wordsData);
        }
        
        // 處理 idioms 分頁
        if (workbook.SheetNames.includes('idioms')) {
            loadingStatus.textContent = '正在處理片語數據...';
            const idiomsSheet = workbook.Sheets['idioms'];
            const idiomsData = XLSX.utils.sheet_to_json(idiomsSheet, { header: 1 });
            idioms = processIdiomsSheet(idiomsData);
        }
        
        // 處理 text 分頁
        if (workbook.SheetNames.includes('text')) {
            loadingStatus.textContent = '正在處理課文數據...';
            const textSheet = workbook.Sheets['text'];
            const textData = XLSX.utils.sheet_to_json(textSheet, { header: 1 });
            passages = processTextSheet(textData);
        }
        
        dataLoaded = true;
        loadingStatus.textContent = '數據載入完成！';
        
        // 短暫延遲後跳轉到主選單
        setTimeout(() => {
            showScreen('modeSelection');
        }, 1000);
        
        console.log('數據載入完成:', {
            vocabulary: vocabulary.length,
            idioms: idioms.length,
            passages: passages.length
        });
        
    } catch (error) {
        console.error('載入 Excel 檔案時發生錯誤:', error);
        loadError.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = error.message;
    }
}

function processWordsSheet(data) {
    const words = [];
    // 跳過標題行，從第二行開始處理
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) { // 確保有 word 值
            const audioFile = row[3] ? `audio/${row[3]}` : '';
            console.log(`Word ${i}: ${row[1]}, Audio: ${audioFile}`); // 調試用
            words.push({
                id: `w${i}`,
                word: row[1], // B欄: word
                meaning: row[2] || '', // C欄: meaning (詞性和中文意思)
                example: row[1] || '', // B欄: word (用於練習文字)
                audio: audioFile // D欄: audio (加上路徑前綴)
            });
        }
    }
    console.log('Processed words:', words); // 調試用
    return words;
}

function processIdiomsSheet(data) {
    const idiomsList = [];
    // 跳過標題行，從第二行開始處理
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) { // 確保有 word 值
            idiomsList.push({
                id: `i${i}`,
                word: row[1], // B欄: word
                meaning: row[2] || '', // C欄: meaning (中文意思)
                example: row[1] || '', // B欄: word (用於練習文字)
                audio: row[3] ? `audio/${row[3]}` : '' // D欄: audio (加上路徑前綴)
            });
        }
    }
    return idiomsList;
}

function processTextSheet(data) {
    const sentences = [];
    // 跳過標題行，從第二行開始處理
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) { // 確保有 sentence 值
            // 生成更有意義的標題（取句子前40個字符）
            const sentence = row[1];
            const title = sentence.length > 40 ? sentence.substring(0, 40) + '...' : sentence;

            sentences.push({
                id: `t${i}`,
                title: title,
                sentences: [sentence], // B欄: sentence
                translation: row[2] || '', // C欄: translation
                audio: row[3] ? `audio/${row[3]}` : '' // D欄: audio (加上路徑前綴)
            });
        }
    }
    return sentences;
}

// 應用狀態
class AppState {
    constructor() {
    this.currentScreen = 'modeSelection';
    this.mode = null; // 'practice' | 'challenge'
    this.contentType = null; // 'vocabulary' | 'passage'
    this.currentIndex = 0;
    this.currentPartIndex = 0;
    this.from = 'list'; // 'list' | 'favorites'
    this.challengeQuestions = [];
    this.challengeAnswers = [];
    this.currentQuestionIndex = 0;
    
    // 新增的挑戰相關屬性
    this.challengeType = null; // 'vocabulary' | 'passage' | 'mixed'
    this.currentChallengeType = null; // 保存當前挑戰類型用於重新測驗
        
        // 語音識別相關
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        this.initSpeechRecognition();
    }
        
    initSpeechRecognition() {
        // 檢查瀏覽器相容性
        if (!checkBrowserCompatibility()) {
            console.error('瀏覽器不支持語音識別');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // 優化語音識別設定，讓反應更即時
        this.recognition.maxAlternatives = 1;
        
        // 對於 Chrome/Edge，設定更積極的即時結果
        if (this.recognition.webkitSpeechRecognition) {
            this.recognition.webkitContinuous = true;
            this.recognition.webkitInterimResults = true;
        }

        this.recognition.onstart = () => {
            console.log('語音識別已啟動');
            this.updateTranscriptDisplay(); // 立即更新顯示
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';
            
            console.log('語音識別結果事件觸發，結果數量:', event.results.length);
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i][0];
                console.log(`結果 ${i}: "${result.transcript}" (信心度: ${result.confidence}, 是否最終: ${event.results[i].isFinal})`);
                
                if (event.results[i].isFinal) {
                    if (result.confidence > 0.3) {
                        finalTranscript += result.transcript;
                    }
                } else {
                    interim += result.transcript;
                }
            }
            
            this.interimTranscript = interim;
            this.transcript += finalTranscript;
            
            console.log('當前轉錄狀態:', {
                final: this.transcript,
                interim: this.interimTranscript,
                isListening: this.isListening
            });
            
            // 即時更新文字顏色
            this.updateWordColors();
            
            // 即時更新轉錄顯示
            this.updateTranscriptDisplay();
        };

        this.recognition.onspeechstart = () => {
            console.log('檢測到語音開始');
        };

        this.recognition.onspeechend = () => {
            console.log('檢測到語音結束');
        };

        this.recognition.onaudiostart = () => {
            console.log('音頻捕獲開始');
        };

        this.recognition.onaudioend = () => {
            console.log('音頻捕獲結束');
        };

        
        this.recognition.onerror = (event) => {
            let errorMsg = '';
            switch(event.error) {
                case 'no-speech':
                    errorMsg = '未偵測到語音，請再試一次。';
                    break;
                case 'audio-capture':
                    errorMsg = '無法取用麥克風。請檢查權限設定。';
                    break;
                case 'not-allowed':
                    errorMsg = '麥克風權限被拒絕。';
                    break;
                default:
                    errorMsg = `發生錯誤: ${event.error}`;
            }
            console.error(errorMsg);
            this.stopListening();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.interimTranscript = '';
            this.updateRecordButton();
            if (this.transcript) {
                this.processTranscript();
            }
        };
    }
    
    startListening() {
        // 檢查是否被禁用
        if (window.speechDisabled) {
            alert('您的瀏覽器不支援語音識別功能，請嘗試使用 Chrome 或 Edge 瀏覽器。');
            return;
        }
        
        if (!this.recognition || this.isListening) return;
        
        // 確保所有音頻播放都已停止（加上條件檢查）
        if (document.readyState === 'complete') {
            this.ensureAudioStopped();
        }
        
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        this.resetWordColors();
        
        // 增加延遲確保音頻設備完全釋放
        setTimeout(() => {
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateRecordButton();
            } catch (e) {
                console.error('語音辨識無法啟動:', e);
                // 如果失敗，再試一次
                setTimeout(() => {
                    try {
                        this.recognition.start();
                        this.isListening = true;
                        this.updateRecordButton();
                    } catch (e2) {
                        console.error('語音辨識第二次嘗試也失敗:', e2);
                        alert('語音識別啟動失敗，請確認沒有其他應用程式正在使用麥克風，然後重新整理頁面再試。');
                    }
                }, 1000);
            }
        }, 200);
    }

    // 確保所有音頻播放停止
    ensureAudioStopped() {
        // 停止所有 HTML audio 元素
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        // 停止語音合成
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        console.log('All audio playback stopped');
    }
        
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        this.recognition.stop();
        this.isListening = false;
        this.updateRecordButton();
        
        // 立即更新轉錄顯示狀態
        this.updateTranscriptDisplay();
        
        // 最終更新顏色
        setTimeout(() => {
            this.updateWordColors();
        }, 100);
    }
    
    updateRecordButton() {
        const recordBtn = document.getElementById('recordBtn');
        if (!recordBtn) return;
        
        // 強制移除所有現有的樣式類別
        recordBtn.removeAttribute('class');
        recordBtn.removeAttribute('style');
        
        if (this.isListening) {
            recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                </svg>
                <span>停止錄音</span>
            `;
            recordBtn.setAttribute('class', 'inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-2xl shadow-xl transition-all duration-300');
        } else {
            recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 4a3 3 0 0 1 6 0v4a3 3 0 1 1-6 0V4zm4 10.93A7.001 7.001 0 0 0 17 8h-1a6 6 0 1 1-12 0H3a7.001 7.001 0 0 0 6 6.93V17H7a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07z" clip-rule="evenodd" />
                </svg>
                <span>開始錄音</span>
            `;
            recordBtn.setAttribute('class', 'inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105');
        }
    }
    
    updateTranscriptDisplay() {
        const transcriptArea = document.getElementById('transcriptArea');
        if (!transcriptArea) {
            console.log('找不到轉錄顯示區域');
            return;
        }
        
        console.log('更新轉錄顯示:', {
            isListening: this.isListening,
            transcript: this.transcript,
            interim: this.interimTranscript,
            hasComparison: !!this.comparisonResult
        });
        
        if (this.comparisonResult) {
            // 根據內容類型決定顯示方式
            const item = this.getCurrentItem();
            if ('sentences' in item) {
                // 句子練習：只顯示準確度
                transcriptArea.innerHTML = `
                    <div class="text-center">
                        <p class="text-sm text-slate-300 mb-2">識別結果：</p>
                        <p class="text-lg font-semibold text-white">${this.transcript}</p>
                        <p class="text-sm text-slate-400 mt-2">準確度: ${this.comparisonResult.score}%</p>
                    </div>
                `;
            } else {
                // 單字/片語：顯示比對結果
                transcriptArea.innerHTML = `
                    <div class="text-center">
                        <p class="text-sm text-slate-300 mb-2">識別結果：</p>
                        <div class="text-lg break-words">${this.comparisonResult.html}</div>
                        <p class="text-xs text-slate-400 mt-2">準確度: ${this.comparisonResult.score}%</p>
                    </div>
                `;
            }
        } else if (this.isListening) {
            // 錄音中的即時顯示
            let displayContent = '';
            
            // 顯示已確定的文字（白色）
            if (this.transcript) {
                displayContent += `<span class="text-white font-medium">${this.transcript}</span>`;
            }
            
            // 顯示正在識別的文字（淺藍色，表示暫時的）
            if (this.interimTranscript) {
                displayContent += `<span class="text-blue-300 italic ml-1">${this.interimTranscript}</span>`;
            }
            
            // 如果都沒有文字，顯示聆聽狀態
            if (!this.transcript && !this.interimTranscript) {
                displayContent = '<span class="text-yellow-400 italic">🎙️ 正在聆聽，請開始說話</span>';
            }
            
            // 加入閃爍的錄音指示器
            displayContent += '<span class="ml-2 inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>';
            
            transcriptArea.innerHTML = `<div class="text-center">${displayContent}</div>`;
        } else if (this.transcript) {
            // 錄音結束後顯示最終結果
            transcriptArea.innerHTML = `
                <div class="text-center">
                    <p class="text-sm text-slate-300 mb-2">錄音完成，您說的是：</p>
                    <p class="text-white font-medium text-lg">${this.transcript}</p>
                    <p class="text-xs text-slate-400 mt-2">正在分析中...</p>
                </div>
            `;
        } else {
            // 初始狀態
            transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "開始錄音" 開始語音輸入</p>';
        }
    }
    
    processTranscript() {
        const practiceText = this.getCurrentPracticeText();
        if (!practiceText || !this.transcript) return;
        
        this.comparisonResult = this.compareAndColorize(practiceText, this.transcript);
        this.updateTranscriptDisplay();

        // 根據內容類型決定是否顯示詳細回饋
        const item = this.getCurrentItem();
        const isChallenge = this.currentScreen === 'challengeScreen';
        
        if (isChallenge) {
            // 挑戰模式：根據題目類型決定回饋方式
            const currentQuestion = this.challengeQuestions[this.currentQuestionIndex];
            if (currentQuestion.type === 'vocabulary' || currentQuestion.type === 'idioms') {
                // 單字和片語：顯示整體回饋在下方
                this.showDetailedFeedback(this.comparisonResult.details);
            } else {
                // 句子：自動顯示簡化回饋在上方
                this.showSentenceFeedback(this.comparisonResult.details);
            }
        } else {
            // 練習模式：原有邏輯
            if (this.contentType === 'vocabulary' || this.contentType === 'idioms') {
                // 單字和片語：顯示整體回饋在下方
                this.showDetailedFeedback(this.comparisonResult.details);
            } else if ('sentences' in item) {
                // 句子：自動顯示簡化回饋在上方
                this.showSentenceFeedback(this.comparisonResult.details);
                console.log('句子練習完成，請點擊上方單字查看詳細回饋');
            }
        }
        
// 如果是挑戰模式，記錄答案並檢查是否完成
if (app.mode === 'challenge') {
    // 記錄當前答案
    app.challengeAnswers[app.currentQuestionIndex] = {
        question: app.challengeQuestions[app.currentQuestionIndex],
        userAnswer: this.transcript,
        score: this.comparisonResult.score,
        isCorrect: this.comparisonResult.isCorrect
    };
    
    // 檢查是否為最後一題
    if (app.currentQuestionIndex === app.challengeQuestions.length - 1) {
        // 延遲顯示結果，讓用戶看到回饋
        setTimeout(() => {
            showChallengeResults();
        }, 3000);
    }
}
    }

    // 顯示句子回饋（簡化版，自動顯示在上方）
    showSentenceFeedback(details) {
        // 移除舊的回饋
        document.getElementById('sentenceFeedback')?.remove();
        
        // 計算統計
        const correct = details.filter(d => d.type === 'correct').length;
        const close = details.filter(d => d.type === 'close').length;
        const incorrect = details.filter(d => d.type === 'incorrect').length;
        const missing = details.filter(d => d.type === 'missing').length;
        const extra = details.filter(d => d.type === 'extra').length;
        
        let summary = [];
        if (correct > 0) summary.push(`✅ ${correct}個正確`);
        if (close > 0) summary.push(`🟡 ${close}個接近`);
        if (incorrect > 0) summary.push(`❌ ${incorrect}個需改進`);
        if (missing > 0) summary.push(`➖ ${missing}個遺漏`);
        if (extra > 0) summary.push(`➕ ${extra}個多餘`);
        
        // 創建回饋區域
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'sentenceFeedback';
        feedbackDiv.className = 'mt-4 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl';
        feedbackDiv.innerHTML = `
            <div class="text-center space-y-2">
                <div class="text-sm text-slate-300">發音回饋</div>
                <div class="text-sm text-slate-200 flex flex-wrap justify-center gap-2">
                    ${summary.join(' · ')}
                </div>
            </div>
        `;
        
        // 插入到回饋容器中
        const feedbackContainer = document.getElementById('feedbackContainer');
        if (feedbackContainer) {
            feedbackContainer.appendChild(feedbackDiv);
        }
    }
    
    showDetailedFeedback(details) {
        // 移除舊的回饋區域
        document.getElementById('detailedFeedback')?.remove();
        clearFeedbackContainer();
        
        // 創建新的回饋區域
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'detailedFeedback';
        feedbackDiv.className = 'mt-6 p-4 glass-tertiary rounded-xl';
        
        let feedbackHTML = '<h4 class="text-lg font-semibold text-sky-400 mb-3">🔍 詳細回饋</h4>';
        
        details.forEach(detail => {
            const icon = {
                'correct': '✅',
                'close': '🟡',
                'incorrect': '❌',
                'extra': '➕',
                'missing': '➖'
            }[detail.type] || '•';
            
            feedbackHTML += `<div class="mb-3 p-3 rounded-lg bg-slate-800/50">`;
            feedbackHTML += `<p class="text-sm text-slate-200 mb-2">${icon} ${detail.message}</p>`;
            
            // 一般建議
            if (detail.suggestion) {
                feedbackHTML += `<p class="text-xs text-yellow-300 mt-2">💡 ${detail.suggestion}</p>`;
            }
            
            feedbackHTML += `</div>`;
        });
        
        feedbackDiv.innerHTML = feedbackHTML;
        
        // 將回饋插入到專門的回饋容器中
        const feedbackContainer = document.getElementById('feedbackContainer');
        if (feedbackContainer) {
            feedbackContainer.appendChild(feedbackDiv);
        }
    }

    getCurrentPracticeText() {
        if (this.currentScreen === 'practiceScreen') {
            const item = this.getCurrentItem();
            if (!item) return '';
            
            if ('sentences' in item) {
                return item.sentences[this.currentPartIndex] || '';
            }
            return item.example || '';
        } else if (this.currentScreen === 'challengeScreen') {
            const question = this.challengeQuestions[this.currentQuestionIndex];
            return question.practiceText || '';
        }
        return '';
    }

    getCurrentItem() {
        if (app.mode === 'challenge') {
            return app.challengeQuestions[app.currentQuestionIndex] || null;
        }
        
        const list = this.getCurrentList();
        return list[this.currentIndex] || null;
    }
        
    getCurrentList() {
        if (app.mode === 'challenge') {
            return app.challengeQuestions;
        }
        
        if (this.contentType === 'vocabulary') {
            // 合併單字和片語
            return [...vocabulary, ...idioms];
        } else {
            return passages;
        }
    }

    compareAndColorize(original, spoken) {
        const originalWords = this.getWords(original);
        const spokenWords = this.getWords(spoken);
        
        if (spokenWords.length === 0) {
            return { 
                html: '<span class="text-slate-400">請開始說話...</span>', 
                isCorrect: false, 
                score: 0,
                details: []
            };
        }
        
        let correctWordCount = 0;
        const resultNodes = [];
        const details = [];
        
        // 使用改進的對齊算法
        const alignment = this.alignWordsImproved(originalWords, spokenWords);
        
        for (let i = 0; i < alignment.length; i++) {
            const { original: originalWord, spoken: spokenWord, type } = alignment[i];
            
            if (type === 'match') {
                const similarity = this.calculateWordSimilarity(originalWord, spokenWord);
                
                if (similarity >= 0.8) {
                    correctWordCount++;
                    resultNodes.push(`<span class="correct-word clickable-word" data-word-index="${i}" data-feedback='${JSON.stringify({type:"correct",original:originalWord,spoken:spokenWord,similarity:similarity,message:`✓ "${spokenWord}" 發音正確`}).replace(/'/g, "&#39;")}' title="點擊查看詳細回饋">${spokenWord} </span>`);
                    details.push({
                        type: 'correct',
                        original: originalWord,
                        spoken: spokenWord,
                        similarity: similarity,
                        message: `✓ "${spokenWord}" 發音正確`
                    });
                } else if (similarity >= 0.5) {
                    correctWordCount += 0.7;
                    const suggestion = this.getPhoneticSuggestion(originalWord, spokenWord);
                    resultNodes.push(`<span class="close-word clickable-word" data-word-index="${i}" data-feedback='${JSON.stringify({type:"close",original:originalWord,spoken:spokenWord,similarity:similarity,message:`~ "${spokenWord}" 很接近了！標準發音：「${originalWord}」`,suggestion:suggestion}).replace(/'/g, "&#39;")}' title="點擊查看詳細回饋">${spokenWord} </span>`);
                    details.push({
                        type: 'close',
                        original: originalWord,
                        spoken: spokenWord,
                        similarity: similarity,
                        message: `~ "${spokenWord}" 很接近了！標準發音：「${originalWord}」`,
                        suggestion: suggestion
                    });
                } else {
                    const suggestion = this.getPhoneticSuggestion(originalWord, spokenWord);
                    resultNodes.push(`<span class="incorrect-word clickable-word" data-word-index="${i}" data-feedback='${JSON.stringify({type:"incorrect",original:originalWord,spoken:spokenWord,similarity:similarity,message:`✗ "${spokenWord}" 與「${originalWord}」差異較大`,suggestion:suggestion}).replace(/'/g, "&#39;")}' title="點擊查看詳細回饋">${spokenWord} </span>`);
                    details.push({
                        type: 'incorrect',
                        original: originalWord,
                        spoken: spokenWord,
                        similarity: similarity,
                        message: `✗ "${spokenWord}" 與「${originalWord}」差異較大`,
                        suggestion: suggestion
                    });
                }
            } else if (type === 'extra') {
                resultNodes.push(`<span class="extra-word clickable-word" data-word-index="${i}" data-feedback='${JSON.stringify({type:"extra",spoken:spokenWord,message:`? 多說了「${spokenWord}」`}).replace(/'/g, "&#39;")}' title="點擊查看詳細回饋">${spokenWord} </span>`);
                details.push({
                    type: 'extra',
                    spoken: spokenWord,
                    message: `? 多說了「${spokenWord}」`
                });
            } else if (type === 'missing') {
                resultNodes.push(`<span class="missing-word clickable-word" data-word-index="${i}" data-feedback='${JSON.stringify({type:"missing",original:originalWord,message:`! 遺漏了「${originalWord}」`}).replace(/'/g, "&#39;")}' title="點擊查看詳細回饋">(${originalWord}) </span>`);
                details.push({
                    type: 'missing',
                    original: originalWord,
                    message: `! 遺漏了「${originalWord}」`
                });
            }
        }
        
        const accuracy = originalWords.length > 0 ? (correctWordCount / originalWords.length) : 0;
        const isCorrect = accuracy >= 0.6;
        const score = Math.round(accuracy * 100);
        
        // 綁定點擊事件到可點擊的單字
        setTimeout(() => {
            this.bindWordClickEvents();
        }, 100);
        
        return { 
            html: resultNodes.join(''), 
            isCorrect, 
            score,
            details
        };
    }

    // 綁定單字點擊事件
    bindWordClickEvents() {
        document.querySelectorAll('.clickable-word').forEach(wordElement => {
            wordElement.addEventListener('click', (e) => {
                const feedbackData = e.target.getAttribute('data-feedback');
                if (feedbackData) {
                    try {
                        const feedback = JSON.parse(feedbackData);
                        this.showIndividualWordFeedback(feedback, e.target);
                    } catch (error) {
                        console.error('解析回饋資料失敗:', error);
                    }
                }
            });
        });
    }

    // 顯示個別單字回饋
    showIndividualWordFeedback(feedback, targetElement) {
        // 移除現有的彈出回饋
        document.getElementById('wordFeedbackPopup')?.remove();
        
        // 創建回饋彈出框
        const popup = document.createElement('div');
        popup.id = 'wordFeedbackPopup';
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        let iconColor, icon;
        switch (feedback.type) {
            case 'correct':
                iconColor = 'text-green-400';
                icon = '✅';
                break;
            case 'close':
                iconColor = 'text-yellow-400';
                icon = '🟡';
                break;
            case 'incorrect':
                iconColor = 'text-red-400';
                icon = '❌';
                break;
            case 'extra':
                iconColor = 'text-blue-400';
                icon = '➕';
                break;
            case 'missing':
                iconColor = 'text-orange-400';
                icon = '➖';
                break;
            default:
                iconColor = 'text-slate-400';
                icon = '•';
        }
        
        popup.innerHTML = `
            <div class="glass-primary rounded-2xl p-6 max-w-sm mx-4 text-center">
                <div class="${iconColor} text-4xl mb-3">${icon}</div>
                <h3 class="text-lg font-semibold text-white mb-3">發音回饋</h3>
                <p class="text-slate-300 mb-4">${feedback.message}</p>
                ${feedback.suggestion ? `<p class="text-yellow-300 text-sm mb-4">💡 ${feedback.suggestion}</p>` : ''}
                ${feedback.similarity ? `<p class="text-slate-400 text-xs mb-4">相似度: ${Math.round(feedback.similarity * 100)}%</p>` : ''}
                <button onclick="document.getElementById('wordFeedbackPopup').remove()" 
                        class="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors">
                    知道了
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 點擊背景關閉
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
    }
        
    // 改進的詞語對齊算法 - 更寬容的匹配
    alignWordsImproved(original, spoken) {
        const result = [];
        let originalIndex = 0;
        let spokenIndex = 0;
        
        while (originalIndex < original.length || spokenIndex < spoken.length) {
            // 如果都還有詞語，嘗試匹配
            if (originalIndex < original.length && spokenIndex < spoken.length) {
                const originalWord = original[originalIndex];
                const spokenWord = spoken[spokenIndex];
                const similarity = this.calculateWordSimilarity(originalWord, spokenWord);
                
                // 如果相似度夠高，視為匹配
                if (similarity >= 0.3) {
                    result.push({
                        original: originalWord,
                        spoken: spokenWord,
                        type: 'match'
                    });
                    originalIndex++;
                    spokenIndex++;
                }
                // 嘗試跳過原文中的詞（用戶可能沒說）
                else if (originalIndex + 1 < original.length) {
                    const nextOriginal = original[originalIndex + 1];
                    const nextSimilarity = this.calculateWordSimilarity(nextOriginal, spokenWord);
                    
                    if (nextSimilarity >= 0.3) {
                        // 標記當前原文詞為遺漏
                        result.push({
                            original: originalWord,
                            spoken: null,
                            type: 'missing'
                        });
                        originalIndex++;
                    } else {
                        // 標記當前說的詞為多餘
                        result.push({
                            original: null,
                            spoken: spokenWord,
                            type: 'extra'
                        });
                        spokenIndex++;
                    }
                }
                // 嘗試跳過說出的詞（可能是多餘的）
                else {
                    result.push({
                        original: null,
                        spoken: spokenWord,
                        type: 'extra'
                    });
                    spokenIndex++;
                }
            }
            // 只剩原文詞語（遺漏）
            else if (originalIndex < original.length) {
                result.push({
                    original: original[originalIndex],
                    spoken: null,
                    type: 'missing'
                });
                originalIndex++;
            }
            // 只剩說出的詞語（多餘）
            else {
                result.push({
                    original: null,
                    spoken: spoken[spokenIndex],
                    type: 'extra'
                });
                spokenIndex++;
            }
        }
        
        return result;
    }

    // 提供發音建議
    getPhoneticSuggestion(target, spoken) {
        const suggestions = [];
        
        // 常見發音問題檢測
        const commonIssues = [
            {
                pattern: /th/i,
                issue: 'th音',
                suggestion: 'th音要將舌頭輕觸上齒，透氣發音'
            },
            {
                pattern: /r/i,
                issue: 'r音',
                suggestion: 'r音要卷舌，舌尖不要碰到口腔頂部'
            },
            {
                pattern: /l/i,
                issue: 'l音',
                suggestion: 'l音舌尖要輕觸上齒齦'
            },
            {
                pattern: /v|f/i,
                issue: 'v/f音',
                suggestion: 'v音要震動聲帶，f音不震動'
            },
            {
                pattern: /ed$/i,
                issue: 'ed結尾',
                suggestion: 'ed結尾根據前一個音決定讀/t/、/d/或/ɪd/'
            }
        ];
        
        for (const issue of commonIssues) {
            if (issue.pattern.test(target)) {
                suggestions.push(issue.suggestion);
            }
        }
        
        // 長度差異提示
        if (Math.abs(target.length - spoken.length) > 2) {
            suggestions.push('注意單字的音節數量，可能有音節被省略或多加了');
        }
        
        return suggestions.length > 0 ? suggestions[0] : '建議重複聆聽標準發音';
    }

    // 計算兩個單字的相似度（Levenshtein 距離 + 語音相似度）
    calculateWordSimilarity(word1, word2) {
        const clean1 = word1.toLowerCase().replace(/[^\w]/g, '');
        const clean2 = word2.toLowerCase().replace(/[^\w]/g, '');
        
        if (clean1 === clean2) return 1.0;
        
        // 編輯距離相似度
        const editDistance = this.levenshteinDistance(clean1, clean2);
        const maxLength = Math.max(clean1.length, clean2.length);
        const editSimilarity = 1 - (editDistance / maxLength);
        
        // 語音相似度（權重提高）
        const phoneticSimilarity = this.getPhoneticSimilarity(clean1, clean2);
        
        // 首尾字母相似度
        const startEndSimilarity = this.getStartEndSimilarity(clean1, clean2);
        
        // 綜合相似度（對非母語人士更友善的權重分配）
        return (editSimilarity * 0.4) + (phoneticSimilarity * 0.5) + (startEndSimilarity * 0.1);
    }

    getStartEndSimilarity(word1, word2) {
        let similarity = 0;
        
        // 首字母相似
        if (word1[0] === word2[0]) similarity += 0.4;
        
        // 尾字母相似
        if (word1[word1.length - 1] === word2[word2.length - 1]) similarity += 0.4;
        
        // 前兩個字母相似
        if (word1.substring(0, 2) === word2.substring(0, 2)) similarity += 0.2;
        
        return Math.min(similarity, 1.0);
    }

    // Levenshtein 距離算法
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // 語音相似度檢測
    getPhoneticSimilarity(word1, word2) {
        // 常見的語音混淆模式
        const phoneticPatterns = [
            // 母音混淆
            ['a', 'e'], ['e', 'i'], ['i', 'o'], ['o', 'u'],
            // 子音混淆
            ['b', 'p'], ['d', 't'], ['g', 'k'], ['v', 'f'], ['z', 's'],
            ['th', 's'], ['th', 'f'], ['l', 'r'], ['n', 'm'],
            // 常見省略
            ['ed', 'd'], ['ing', 'in'], ['tion', 'shun']
        ];
        
        let similarity = 0;
        
        // 檢查是否有常見的語音替換
        for (const [sound1, sound2] of phoneticPatterns) {
            if ((word1.includes(sound1) && word2.includes(sound2)) ||
                (word1.includes(sound2) && word2.includes(sound1))) {
                similarity += 0.3;
            }
        }
        
        // 檢查首字母和尾字母
        if (word1[0] === word2[0]) similarity += 0.2;
        if (word1[word1.length - 1] === word2[word2.length - 1]) similarity += 0.2;
        
        // 檢查長度相似度
        const lengthSimilarity = 1 - Math.abs(word1.length - word2.length) / Math.max(word1.length, word2.length);
        similarity += lengthSimilarity * 0.3;
        
        return Math.min(similarity, 1.0);
    }
        
    getWords(text) {
        return text
            .toLowerCase()
            .replace(/[.,?!;:]/g, '')
            .split(/\s+/)
            .filter(Boolean);
    }

    // 即時更新單字顏色
    updateWordColors() {
        const practiceText = this.getCurrentPracticeText();
        if (!practiceText) return;
        
        const originalWords = this.getWords(practiceText);
        const spokenText = this.transcript + ' ' + this.interimTranscript;
        const spokenWords = this.getWords(spokenText.trim());
        
        // 重置所有單字為預設狀態
        document.querySelectorAll('[data-word-index]').forEach(span => {
            span.className = 'word-default';
        });
        
        // 根據內容類型決定更新策略
        if (this.contentType === 'vocabulary' || this.contentType === 'idioms') {
            // 單字和片語：整體比對
            this.updateSingleWordColor(originalWords, spokenWords);
        } else {
            // 句子：逐字比對
            this.updateSentenceWordColors(originalWords, spokenWords);
        }
    }

    // 更新單字/片語顏色（整體比對）
    updateSingleWordColor(originalWords, spokenWords) {
        const wordSpan = document.querySelector('[data-word-index="0"]');
        if (!wordSpan) return;
        
        if (this.isListening && spokenWords.length > 0) {
            wordSpan.className = 'word-speaking';
        }
        
        // 如果有最終結果，進行比對
        if (this.transcript) {
            const isCorrect = this.compareWords(originalWords, this.getWords(this.transcript));
            wordSpan.className = isCorrect ? 'word-correct' : 'word-incorrect';
        }
    }

    // 更新句子中各單字顏色（逐字比對）
    updateSentenceWordColors(originalWords, spokenWords) {
        originalWords.forEach((originalWord, index) => {
            const wordSpan = document.querySelector(`[data-word-index="${index}"]`);
            if (!wordSpan) return;
            
            if (index < spokenWords.length) {
                const spokenWord = spokenWords[index];
                
                if (this.isListening && index === spokenWords.length - 1) {
                    // 正在說的單字
                    wordSpan.className = 'word-speaking';
                } else {
                    // 已說完的單字進行比對
                    const similarity = this.calculateWordSimilarity(originalWord, spokenWord);
                    if (similarity >= 0.8) {
                        wordSpan.className = 'word-correct';
                    } else if (similarity >= 0.5) {
                        wordSpan.className = 'word-close';
                    } else {
                        wordSpan.className = 'word-incorrect';
                    }
                }
            } else if (this.isListening && index === spokenWords.length) {
                // 下一個要說的單字
                wordSpan.className = 'word-speaking';
            }
        });
    }

    // 比對兩組單字是否相同
    compareWords(originalWords, spokenWords) {
        if (originalWords.length !== spokenWords.length) return false;
        
        for (let i = 0; i < originalWords.length; i++) {
            const similarity = this.calculateWordSimilarity(originalWords[i], spokenWords[i]);
            if (similarity < 0.6) return false;
        }
        
        return true;
    }

    // 重置單字顏色
    resetWordColors() {
        document.querySelectorAll('[data-word-index]').forEach(span => {
            span.className = 'word-default';
        });
    }

    // 重置轉錄顯示區域
    resetTranscriptDisplay() {
        const transcriptArea = document.getElementById('transcriptArea');
        if (transcriptArea) {
            transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "開始錄音" 開始語音輸入</p>';
        }
    }

    // 重置所有狀態
    resetAllStates() {
        // 停止語音識別
        if (this.isListening) {
            this.stopListening();
        }
        
        // 重置語音相關狀態
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        // 重置索引
        this.currentIndex = 0;
        this.currentPartIndex = 0;
        
        // 清理 DOM 中的回饋
        document.getElementById('detailedFeedback')?.remove();
        clearFeedbackContainer();
        
        // 重置錄音按鈕
        this.updateRecordButton();
        
        // 重置單字顏色
        this.resetWordColors();
        
        // 重置轉錄顯示
        this.resetTranscriptDisplay();
    }

} // ← AppState 類別的結束括號

// 全域應用狀態
const app = new AppState();

// 螢幕管理
function showScreen(screenId) {
    // 清理所有回饋內容（不管切換到哪個螢幕）
    document.getElementById('detailedFeedback')?.remove();
    clearFeedbackContainer();
    
    // 如果要切換到非練習螢幕，停止語音識別
    if (screenId !== 'practiceScreen' && screenId !== 'challengeScreen' && app.isListening) {
        app.stopListening();
    }
    
    // 隱藏所有螢幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // 顯示目標螢幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // 更新首頁按鈕顯示
    const homeBtn = document.getElementById('homeBtn');
    if (screenId === 'modeSelection') {
        homeBtn.classList.add('hidden');
    } else {
        homeBtn.classList.remove('hidden');
    }
    
    app.currentScreen = screenId;
}

// 語音合成功能 - 優先使用Edge AI語音
function speakText(text, audioFile = null) {
    console.log('speakText called with:', { text, audioFile });
    
    // 如果正在錄音，先停止
    if (app.isListening) {
        app.stopListening();
        console.log('Stopped recording before playing audio');
    }
    
// 檢測瀏覽器並選擇最佳語音
const userAgent = navigator.userAgent.toLowerCase();
const isEdge = userAgent.includes('edg'); // 更精確的 Edge 檢測
const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');

console.log('瀏覽器檢測結果:', { userAgent: navigator.userAgent, isEdge, isChrome });
    
    if ('speechSynthesis' in window) {
        // 停止任何正在進行的語音合成
        window.speechSynthesis.cancel();
        
// 確保語音列表已載入
let voices = window.speechSynthesis.getVoices();

// 如果語音列表為空，等待載入
if (voices.length === 0) {
    console.log('語音列表為空，等待載入...');
    window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        console.log('語音列表載入完成，數量:', voices.length);
        proceedWithSpeech();
    };
    return;
}

proceedWithSpeech();

function proceedWithSpeech() {
    let selectedVoice = null;
        
    if (isEdge) {
        selectedVoice = selectBestEdgeVoice(voices);
        console.log('🎯 Edge瀏覽器：使用高品質AI語音', selectedVoice?.name);
    } else {
        selectedVoice = selectBestVoice(voices);
        console.log('📊 使用標準語音合成', selectedVoice?.name);
    }
    
    console.log('🔍 當前可用的所有語音:', voices.map(v => v.name));
        
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🔊 實際使用的語音: ${selectedVoice.name}`);
    } else {
        console.log('⚠️ 沒有選中任何特定語音，使用系統預設');
    }
    
    // 語音結束後確保設備釋放
    utterance.onend = function() {
        console.log('🎵 語音播放結束，音頻設備已釋放');
        setTimeout(() => {
            console.log('✅ 準備進行語音識別');
        }, 300);
    };
    
    utterance.onerror = function(event) {
        console.error('❌ 語音合成發生錯誤:', event.error);
    };
    
    utterance.onstart = function() {
        console.log('🎤 開始語音播放');
    };
    
    window.speechSynthesis.speak(utterance);
}
        
    } else {
        console.error('❌ 此瀏覽器不支援語音合成');
        alert('您的瀏覽器不支援語音播放功能');
    }
}

function selectBestEdgeVoice(voices) {
    console.log('=== 開始選擇 Edge 語音 ===');
    console.log('可用語音總數:', voices.length);
    console.log('所有可用語音:', voices.map(v => `${v.name} (${v.lang})`));
    
    // 強制優先順序：絕對優先 Aria
    const ariaVoices = voices.filter(v => 
        v.name.toLowerCase().includes('aria') && 
        v.lang.startsWith('en')
    );
    
    if (ariaVoices.length > 0) {
        // 優先選擇 Online Natural 版本的 Aria
        const ariaOnline = ariaVoices.find(v => v.name.includes('Online') && v.name.includes('Natural'));
        if (ariaOnline) {
            console.log(`🎯 找到最佳 Aria 語音: ${ariaOnline.name}`);
            return ariaOnline;
        }
        
        // 其次選擇任何 Aria 語音
        console.log(`🎯 使用 Aria 語音: ${ariaVoices[0].name}`);
        return ariaVoices[0];
    }
    
    // 如果沒有 Aria，按原本邏輯選擇
    const preferredVoices = [
        'Microsoft Jenny Online (Natural) - English (United States)', 
        'Microsoft Guy Online (Natural) - English (United States)',
        'Microsoft Sara Online (Natural) - English (United States)',
        'Microsoft Jenny - English (United States)',
        'Microsoft Zira - English (United States)'
    ];
    
    for (const preferredName of preferredVoices) {
        const voice = voices.find(v => v.name === preferredName);
        if (voice) {
            console.log(`🎯 找到備選語音: ${voice.name}`);
            return voice;
        }
    }
    
    // 最後降級
    console.log('⚠️ 沒有找到理想語音，使用標準選擇');
    return selectBestVoice(voices);
}

// 選擇最佳標準語音
function selectBestVoice(voices) {
    // 標準語音的優先順序
    const preferredVoices = [
        'Google US English',
        'Microsoft Zira - English (United States)',
        'Microsoft David - English (United States)',
        'Alex',
        'Samantha'
    ];
    
    // 首先嘗試找到首選語音
    for (const preferredName of preferredVoices) {
        const voice = voices.find(v => v.name === preferredName);
        if (voice) {
            console.log(`🔊 找到標準語音: ${voice.name}`);
            return voice;
        }
    }
    
    // 如果沒有首選，選擇任何英語語音
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
        console.log(`🔊 使用英語語音: ${englishVoice.name}`);
        return englishVoice;
    }
    
    // 最後選擇預設語音
    console.log('🔊 使用預設語音');
    return voices[0] || null;
}

// 列表渲染功能
function renderList() {
    // 清理之前的回饋內容
    document.getElementById('detailedFeedback')?.remove();
    clearFeedbackContainer();
    
    // 重置應用狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.currentIndex = 0;
    app.currentPartIndex = 0;
    
    const allItemsList = document.getElementById('allItemsList');
    const listTitle = document.getElementById('listTitle');

    
    // 更新標題
    const titleMap = {
        'vocabulary': '詞彙列表',
        'passage': '課文列表'
    };
    listTitle.textContent = titleMap[app.contentType] || '列表';

    // 取得資料
    let allItems = [];
    if (app.contentType === 'vocabulary') {
        // 合併單字和片語
        allItems = [...vocabulary, ...idioms];
    } else {
        allItems = passages;
    }
        
    // 渲染 iOS 風格列表
    allItemsList.innerHTML = allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        if ('word' in item) {
            // 單字項目 - 顯示單字和意思
            return `
    <button onclick="startPractice(${index}, 'list')" 
            class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="flex: 1; min-width: 0;">
            <p class="text-white text-body text-lg truncate font-semibold">${item.word}</p>
            ${item.meaning ? `<p class="text-slate-400 text-sm truncate mt-1">${item.meaning}</p>` : ''}
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </button>
    `;
        } else {
            // 課文項目 - 保持原有格式
            const displayText = item.title;
            return `
    <button onclick="startPractice(${index}, 'list')" 
            class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="flex: 1; min-width: 0;">
            <p class="text-white text-body text-lg truncate">${displayText}</p>
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </button>
    `;
        }
    }).join('');
}

// 開始練習
function startPractice(index, from = 'list') {
    // 清理之前的回饋內容
    document.getElementById('detailedFeedback')?.remove();
    clearFeedbackContainer();
    
    // 重置所有相關狀態
    app.currentIndex = index;
    app.currentPartIndex = 0;
    app.from = from;
    app.transcript = '';
    app.interimTranscript = '';
    app.comparisonResult = null;
    
    // 停止任何進行中的語音識別
    if (app.isListening) {
        app.stopListening();
    }
    
    showScreen('practiceScreen');
    updatePracticeScreen();
}

// 更新練習螢幕
function updatePracticeScreen() {
    // 清理之前的回饋內容
    document.getElementById('detailedFeedback')?.remove();
    document.getElementById('clickHint')?.remove();
    document.getElementById('wordFeedbackPopup')?.remove();
    document.getElementById('sentenceFeedback')?.remove();
    clearFeedbackContainer();
    
    const item = app.getCurrentItem();
    if (!item) return;
    
    const practiceTitle = document.getElementById('practiceTitle');
    const practiceSubtitle = document.getElementById('practiceSubtitle');
    const partNavigation = document.getElementById('partNavigation');
    
    // 更新標題 - 顯示練習內容
    if ('sentences' in item) {
        const sentence = item.sentences[app.currentPartIndex];
        const words = sentence.split(' ');
        const wordsHtml = words.map((word, index) => 
            `<span class="word-default clickable-word" data-word-index="${index}" style="cursor: pointer; padding: 2px 4px; margin: 1px; border-radius: 4px; display: inline-block;">${word}</span>`
        ).join(' ');
        
        if (item.translation) {
            practiceTitle.innerHTML = `
                ${wordsHtml}
                <div class="translation-text">${item.translation}</div>
            `;
        } else {
            practiceTitle.innerHTML = wordsHtml;
        }
    } else {
        // 單字或片語
        const meaningDisplay = item.meaning ? `<div class="translation-text">${item.meaning}</div>` : '';
        practiceTitle.innerHTML = `
            <span class="word-default clickable-word" data-word-index="0" style="cursor: pointer; padding: 2px 4px; margin: 1px; border-radius: 4px; display: inline-block;">${item.example}</span>
            ${meaningDisplay}
        `;
    }

    
    // 更新副標題（僅課文有多句）
    if ('sentences' in item && item.sentences.length > 1) {
        practiceSubtitle.textContent = `句子 ${app.currentPartIndex + 1} / ${item.sentences.length}`;
        practiceSubtitle.classList.remove('hidden');
        partNavigation.classList.remove('hidden');
    } else {
        practiceSubtitle.classList.add('hidden');
        partNavigation.classList.add('hidden');
    }
    

// 新增：挑戰模式進度顯示
const challengeProgressDisplay = document.getElementById('challengeProgressDisplay');
if (app.mode === 'challenge') {
    challengeProgressDisplay.textContent = `第 ${app.currentQuestionIndex + 1} 題 / 10 題`;
    challengeProgressDisplay.classList.remove('hidden');
} else {
    challengeProgressDisplay.classList.add('hidden');
}

    // 更新導航按鈕狀態
    updateNavigationButtons();
    
    // 重置語音相關狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.resetWordColors();
    app.updateRecordButton();
    app.resetTranscriptDisplay();
    
    // 重新綁定點擊事件
    setTimeout(() => {
        app.bindWordClickEvents();
    }, 100);
}

// 更新導航按鈕狀態
function updateNavigationButtons() {
    const list = app.getCurrentList();
    const item = app.getCurrentItem();
    
    const prevBtn = document.getElementById('prevBtn');
    const nextItemBtn = document.getElementById('nextItemBtn');
    const prevPartBtn = document.getElementById('prevPartBtn');
    const nextPartBtn = document.getElementById('nextPartBtn');
    
    if (app.mode === 'challenge') {
        // 挑戰模式：使用 currentQuestionIndex
        prevBtn.disabled = app.currentQuestionIndex === 0;
        nextItemBtn.disabled = app.currentQuestionIndex === list.length - 1;
    } else {
        // 練習模式：使用 currentIndex
        prevBtn.disabled = app.currentIndex === 0;
        nextItemBtn.disabled = app.currentIndex === list.length - 1;
    }
    
    // 句子導航（僅課文）
    if ('sentences' in item) {
        prevPartBtn.disabled = app.currentPartIndex === 0;
        nextPartBtn.disabled = app.currentPartIndex === item.sentences.length - 1;
    }
}

// 導航功能
function navigateItem(direction) {
    const list = app.getCurrentList();
    
    if (app.mode === 'challenge') {
        const newIndex = app.currentQuestionIndex + direction;
        if (newIndex >= 0 && newIndex < list.length) {
            app.currentQuestionIndex = newIndex;
            app.currentPartIndex = 0;
            updatePracticeScreen();
        }
    } else {
        const newIndex = app.currentIndex + direction;
        if (newIndex >= 0 && newIndex < list.length) {
            app.currentIndex = newIndex;
            app.currentPartIndex = 0;
            updatePracticeScreen();
        }
    }
}

function navigatePart(direction) {
    const item = app.getCurrentItem();
    if (!('sentences' in item)) return;
    
    const newPartIndex = app.currentPartIndex + direction;
    if (newPartIndex >= 0 && newPartIndex < item.sentences.length) {
        app.currentPartIndex = newPartIndex;
        updatePracticeScreen();
    }
}


// 顯示挑戰結果
function showChallengeResults() {
    const totalQuestions = app.challengeQuestions.length;
    const correctAnswers = app.challengeAnswers.filter(answer => answer.score >= 60).length;
    const averageScore = app.challengeAnswers.length > 0 
        ? Math.round(app.challengeAnswers.reduce((sum, answer) => sum + answer.score, 0) / app.challengeAnswers.length)
        : 0;
    
    // 更新基本信息
    document.getElementById('averageScore').innerHTML = `${averageScore} <span class="text-2xl text-slate-400">平均分</span>`;
    document.getElementById('correctCount').textContent = `您答對了 ${correctAnswers} / ${totalQuestions} 題。`;
    
    // 根據成績顯示不同的慶祝訊息和徽章
    const congratsMessage = document.getElementById('congratsMessage');
    const performanceBadge = document.getElementById('performanceBadge');
    
    if (averageScore >= 90) {
        congratsMessage.textContent = '太棒了！您的發音非常標準！';
        performanceBadge.className = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-500 text-yellow-900';
        performanceBadge.textContent = '🏆 完美表現';
    } else if (averageScore >= 80) {
        congratsMessage.textContent = '很好！繼續保持這個水準！';
        performanceBadge.className = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-500 text-green-900';
        performanceBadge.textContent = '⭐ 優秀表現';
    } else if (averageScore >= 70) {
        congratsMessage.textContent = '不錯的表現！再多練習會更好！';
        performanceBadge.className = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 text-blue-900';
        performanceBadge.textContent = '👍 良好表現';
    } else {
        congratsMessage.textContent = '繼續努力！多多練習一定會進步的！';
        performanceBadge.className = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-orange-500 text-orange-900';
        performanceBadge.textContent = '💪 加油努力';
    }
    
    // 顯示詳細結果
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = app.challengeAnswers.map((answer, index) => {
        const icon = answer.score >= 60 ? '✅' : '❌';
        const scoreColor = answer.score >= 80 ? 'text-green-400' : answer.score >= 60 ? 'text-yellow-400' : 'text-red-400';
        return `
            <li class="flex justify-between items-center p-2 bg-slate-800/30 rounded-lg">
                <span class="flex items-center gap-2">
                    <span>${icon}</span>
                    <span class="text-slate-300">第${index + 1}題</span>
                </span>
                <span class="${scoreColor} font-semibold">${answer.score}分</span>
            </li>
        `;
    }).join('');
    
    showScreen('challengeResult');
}


// 挑戰類型選擇
function selectChallengeType(type) {
    app.challengeType = type;
    app.currentChallengeType = type; // 保存用於重新測驗
    startChallengeWithType(type);
}

// 開始指定類型的挑戰
function startChallengeWithType(type) {
    app.mode = 'challenge';
    app.challengeType = type;
    
    let allItems = [];
    
    switch (type) {
        case 'vocabulary':
            // 只包含單字和片語
            vocabulary.forEach(item => {
                allItems.push({ ...item, type: 'vocabulary' });
            });
            idioms.forEach(item => {
                allItems.push({ ...item, type: 'idioms' });
            });
            break;
            
        case 'passage':
            // 只包含課文
            passages.forEach(passage => {
                allItems.push({ ...passage, type: 'passage' });
            });
            break;
            
        case 'mixed':
            // 混合所有類型
            vocabulary.forEach(item => {
                allItems.push({ ...item, type: 'vocabulary' });
            });
            idioms.forEach(item => {
                allItems.push({ ...item, type: 'idioms' });
            });
            passages.forEach(passage => {
                allItems.push({ ...passage, type: 'passage' });
            });
            break;
    }
    
    // 隨機打亂順序並選擇10題
    const shuffled = allItems.sort(() => 0.5 - Math.random());
    app.challengeQuestions = shuffled.slice(0, Math.min(10, shuffled.length));
    app.challengeAnswers = []; // 重置答案記錄
    app.currentQuestionIndex = 0;
    
    // 重置狀態
    app.currentIndex = 0;
    app.currentPartIndex = 0;
    app.resetAllStates();
    
    showScreen('practiceScreen');
    updatePracticeScreen();
}

// 重新當前類型的挑戰
function retryCurrentChallenge() {
    if (app.currentChallengeType) {
        startChallengeWithType(app.currentChallengeType);
    }
}

// 開始新的挑戰（返回類型選擇）
function startNewChallenge() {
    showScreen('challengeTypeSelection');
}

// 錄音控制
function toggleRecording() {
    if (app.isListening) {
        app.stopListening();
    } else {
        // 檢查是否有音頻正在播放
        const hasActiveAudio = document.querySelector('audio:not([paused])') || 
                             ('speechSynthesis' in window && window.speechSynthesis.speaking);
        
        if (hasActiveAudio) {
            // 如果有音頻在播放，先停止然後延遲開始錄音
            app.ensureAudioStopped();
            setTimeout(() => {
                app.startListening();
            }, 500);
        } else {
            app.startListening();
        }
    }
}

// 事件監聽器設定
document.addEventListener('DOMContentLoaded', function() {
    console.log('頁面載入完成，開始初始化...');
    
    // 首先檢查瀏覽器相容性（延遲一點確保 DOM 完全載入）
    setTimeout(() => {
        checkBrowserCompatibility();
    }, 500);
    
    // 自動載入數據
    loadDataFromFile();
    
// 模式選擇
document.getElementById('practiceMode').addEventListener('click', () => {
    if (!dataLoaded) {
        alert('數據尚未載入完成，請稍候');
        return;
    }
    app.mode = 'practice';
    document.getElementById('contentModeTitle').textContent = '練習模式';
    showScreen('contentTypeSelection');
});

document.getElementById('challengeMode').addEventListener('click', () => {
    if (!dataLoaded) {
        alert('數據尚未載入完成，請稍候');
        return;
    }
    showScreen('challengeTypeSelection');
});

// 挑戰類型選擇
document.getElementById('vocabChallengeBtn').addEventListener('click', () => selectChallengeType('vocabulary'));
document.getElementById('passageChallengeBtn').addEventListener('click', () => selectChallengeType('passage'));
document.getElementById('mixedChallengeBtn').addEventListener('click', () => selectChallengeType('mixed'));

// 返回按鈕
document.getElementById('backToChallengeMain').addEventListener('click', () => showScreen('modeSelection'));

// 內容類型選擇
document.getElementById('vocabularyType').addEventListener('click', () => {
    app.resetAllStates();
    app.contentType = 'vocabulary'; // 仍使用 vocabulary，但會包含單字和片語
    if (app.mode === 'practice') {
        showScreen('listView');
        renderList();
    } else {
        startChallenge(); // 挑戰模式不分類型
    }
});

document.getElementById('passageType').addEventListener('click', () => {
    app.resetAllStates();
    app.contentType = 'passage';
    if (app.mode === 'practice') {
        showScreen('listView');
        renderList();
    } else {
        startChallenge(); // 挑戰模式不分類型
    }
});

    
    // 導航按鈕
    document.getElementById('homeBtn').addEventListener('click', () => showScreen('modeSelection'));
    document.getElementById('backToMode').addEventListener('click', () => showScreen('modeSelection'));
    document.getElementById('backToContentType').addEventListener('click', () => showScreen('contentTypeSelection'));
    document.getElementById('backToList').addEventListener('click', () => {
        showScreen('listView');
        renderList();
    });
    
    // 練習頁面按鈕
    document.getElementById('speakBtn').addEventListener('click', () => {
        const item = app.getCurrentItem();
        const practiceText = app.getCurrentPracticeText();
        console.log('Debug - speakBtn clicked');
        console.log('Debug - item:', item);
        console.log('Debug - practiceText:', practiceText);
        console.log('Debug - audioFile:', item ? item.audio : 'no item');
        
        if (practiceText && item) {
            // 不再使用音檔，直接使用 TTS
            speakText(practiceText);
        }
    });

    document.getElementById('recordBtn').addEventListener('click', toggleRecording);
    
    // 練習導航
    document.getElementById('prevBtn').addEventListener('click', () => navigateItem(-1));
    document.getElementById('nextItemBtn').addEventListener('click', () => navigateItem(1));
    document.getElementById('prevPartBtn').addEventListener('click', () => navigatePart(-1));
    document.getElementById('nextPartBtn').addEventListener('click', () => navigatePart(1));
    
// 挑戰結果頁面按鈕
document.getElementById('retryCurrentChallengeBtn').addEventListener('click', retryCurrentChallenge);
document.getElementById('newChallengeBtn').addEventListener('click', startNewChallenge);
document.getElementById('backToMainBtn').addEventListener('click', () => showScreen('modeSelection'));
    
    // 初始化應用
    showScreen('loadingScreen');
});

// 全域函數（供 HTML onclick 使用）
window.startPractice = startPractice;
window.toggleRecording = toggleRecording;
window.speakText = speakText;
window.loadDataFromFile = loadDataFromFile;
window.proceedWithoutSpeech = proceedWithoutSpeech;
window.dismissWarning = dismissWarning;
window.continueWithFirefox = continueWithFirefox;
window.dismissFirefoxWarning = dismissFirefoxWarning;
window.continueWithCurrentBrowser = continueWithCurrentBrowser;
window.dismissEdgeRecommendation = dismissEdgeRecommendation;
window.selectChallengeType = selectChallengeType;
window.retryCurrentChallenge = retryCurrentChallenge;
window.startNewChallenge = startNewChallenge;
window.showChallengeResults = showChallengeResults;




