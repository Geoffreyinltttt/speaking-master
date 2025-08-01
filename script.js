// 練習內容數據 - 從 Excel 載入
let vocabulary = [];
let idioms = [];
let passages = [];
let dataLoaded = false;

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
        
        // 語音識別相關
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        this.initSpeechRecognition();
    }
        
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('瀏覽器不支援語音識別');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
this.recognition = new SpeechRecognition();
this.recognition.continuous = true;
this.recognition.interimResults = true;
this.recognition.lang = 'en-US';

// 嘗試減少自動校正和文字處理
this.recognition.maxAlternatives = 1; // 只要第一個識別結果
this.recognition.serviceURI = null; // 不使用雲端服務（如果支援）

// 對於 Chrome/Edge，嘗試使用更直接的語音識別設定
if (this.recognition.webkitSpeechRecognition) {
    // 設定較短的無聲間隔來減少處理時間
    this.recognition.webkitContinuous = true;
    this.recognition.webkitInterimResults = true;
}

        
        this.recognition.onresult = (event) => {
    let finalTranscript = '';
    let interim = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            const result = event.results[i][0];
            console.log('Speech recognition confidence:', result.confidence);
            console.log('Raw transcript:', result.transcript);
            
            if (result.confidence > 0.3) {
                finalTranscript += result.transcript;
            }
        } else {
            interim += event.results[i][0].transcript;
        }
    }
    
    this.interimTranscript = interim;
    this.transcript += finalTranscript;
    
    // 即時更新顯示
    this.updateTranscriptDisplay();
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
        if (!this.recognition || this.isListening) return;
        
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        try {
            this.recognition.start();
            this.isListening = true;
            this.updateRecordButton();
            this.updateTranscriptDisplay();
        } catch (e) {
            console.error('語音辨識無法啟動:', e);
        }
    }
    
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        this.recognition.stop();
        this.isListening = false;
        this.updateRecordButton();
    }
    
    updateRecordButton() {
        const recordBtn = document.getElementById('recordBtn');
        if (!recordBtn) return;
        
        if (this.isListening) {
            recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                </svg>
                停止錄音
            `;
            recordBtn.className = 'w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 btn-record recording rounded-lg text-white font-bold';
        } else {
            recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
                </svg>
                開始錄音
            `;
            recordBtn.className = 'w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 btn-record rounded-lg text-white font-bold';
        }
    }
    
updateTranscriptDisplay() {
    const transcriptArea = document.getElementById('transcriptArea');
    if (!transcriptArea) return;
    
    if (this.comparisonResult) {
        transcriptArea.innerHTML = this.comparisonResult.html;
    } else if (this.isListening) {
        // 即時顯示語音識別結果
        let displayContent = '';
        
        // 顯示已確定的文字（白色）
        if (this.transcript) {
            displayContent += `<span class="text-white font-medium">${this.transcript}</span>`;
        }
        
        // 顯示正在識別的文字（灰色，表示尚未確定）
        if (this.interimTranscript) {
            displayContent += `<span class="text-slate-400 italic">${this.interimTranscript}</span>`;
        } else if (!this.transcript) {
            displayContent = '<span class="text-slate-500 italic">正在聆聽...</span>';
        }
        
        // 加入閃爍的錄音指示器
        displayContent += '<span class="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>';
        
        transcriptArea.innerHTML = `<p class="text-center">${displayContent}</p>`;
    } else if (this.transcript) {
        transcriptArea.innerHTML = `<p class="text-slate-200 text-center">${this.transcript}</p>`;
    } else {
        transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "開始錄音" 後開始說話...</p>';
    }
}
    
    processTranscript() {
        const practiceText = this.getCurrentPracticeText();
        if (!practiceText || !this.transcript) return;
        
        this.comparisonResult = this.compareAndColorize(practiceText, this.transcript);
        this.updateTranscriptDisplay();
        
        // 如果是挑戰模式，顯示下一題按鈕
        if (this.currentScreen === 'challengeScreen') {
            document.getElementById('nextBtn').classList.remove('hidden');
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
            return typeof question === 'string' ? question : question.example;
        }
        return '';
    }
    
    getCurrentItem() {
        const list = this.getCurrentList();
        return list[this.currentIndex] || null;
    }
    
getCurrentList() {
    if (this.contentType === 'vocabulary') {
        return vocabulary;
    } else if (this.contentType === 'idioms') {
        return idioms;
    } else {
        return passages;
    }
}

    
    // 文字比對和著色功能
    compareAndColorize(original, spoken) {
        const originalWords = this.getWords(original);
        const spokenWords = this.getWords(spoken);
        
        if (spokenWords.length === 0) {
            return { 
                html: '<span class="text-slate-400">請開始說話...</span>', 
                isCorrect: false, 
                score: 0 
            };
        }
        
        let correctWordCount = 0;
        const resultNodes = [];
        const maxLength = Math.max(originalWords.length, spokenWords.length);
        
        for (let i = 0; i < maxLength; i++) {
            const originalWord = originalWords[i];
            const spokenWord = spokenWords[i];
            
            if (originalWord && spokenWord) {
                if (originalWord === spokenWord) {
                    correctWordCount++;
                    resultNodes.push(`<span class="correct-word">${spokenWord} </span>`);
                } else {
                    resultNodes.push(`<span class="incorrect-word">${spokenWord}</span>`);
                    resultNodes.push(`<span class="correct-word"> (${originalWord}) </span>`);
                }
            } else if (spokenWord) {
                resultNodes.push(`<span class="incorrect-word">${spokenWord} </span>`);
            } else if (originalWord) {
                resultNodes.push(`<span class="missing-word">(${originalWord}) </span>`);
            }
        }
        
        const isCorrect = originalWords.length > 0 && 
                         originalWords.length === spokenWords.length && 
                         correctWordCount === originalWords.length;
        
        const score = originalWords.length > 0 ? 
                     Math.round((correctWordCount / originalWords.length) * 100) : 0;
        
        return { 
            html: resultNodes.join(''), 
            isCorrect, 
            score 
        };
    }
    
    getWords(text) {
        return text
            .toLowerCase()
            .replace(/[.,?!;:]/g, '')
            .split(/\s+/)
            .filter(Boolean);
    }
}

// 全域應用狀態
const app = new AppState();

// 螢幕管理
function showScreen(screenId) {
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

// 語音合成功能 - 支援音檔和 TTS
function speakText(text, audioFile = null) {
    console.log('speakText called with:', { text, audioFile }); // 調試用
    
    // 如果有音檔，優先播放音檔
    if (audioFile && audioFile.trim()) {
        console.log('Attempting to play audio file:', audioFile); // 調試用
        const audio = new Audio(audioFile);
        
        audio.onloadstart = function() {
            console.log('Audio loading started');
        };
        
        audio.oncanplaythrough = function() {
            console.log('Audio can play through');
        };
        
        audio.onerror = function(e) {
            console.warn(`音檔載入失敗: ${audioFile}`, e);
            console.log('Falling back to TTS');
            // 音檔載入失敗時，使用 TTS
            speakWithTTS(text);
        };
        
        audio.onended = function() {
            console.log('Audio playback ended');
        };
        
        // 嘗試播放音檔
        audio.play().then(() => {
            console.log('Audio playing successfully');
        }).catch(error => {
            console.warn(`音檔播放失敗: ${audioFile}`, error);
            console.log('Falling back to TTS');
            speakWithTTS(text);
        });
    } else {
        console.log('No audio file provided, using TTS');
        // 沒有音檔時使用 TTS
        speakWithTTS(text);
    }
}

function speakWithTTS(text) {
    console.log('Using TTS for:', text); // 調試用
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// 列表渲染功能
function renderList() {
    const allItemsList = document.getElementById('allItemsList');
    const listTitle = document.getElementById('listTitle');
    
    // 更新標題
    const titleMap = {
        'vocabulary': '單字列表',
        'idioms': '片語列表',
        'passage': '課文列表'
    };
    listTitle.textContent = titleMap[app.contentType] || '列表';
    
    // 取得資料
    let allItems = [];
    if (app.contentType === 'vocabulary') {
        allItems = vocabulary;
    } else if (app.contentType === 'idioms') {
        allItems = idioms;
    } else {
        allItems = passages;
    }
    
    // 渲染 iOS 風格列表
allItemsList.innerHTML = allItems.map((item, index) => {
    const displayText = 'word' in item ? item.word : item.title;
    const isLast = index === allItems.length - 1;
    
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

}).join('');
}

// 開始練習
function startPractice(index, from = 'list') {
    app.currentIndex = index;
    app.currentPartIndex = 0;
    app.from = from;
    app.transcript = '';
    app.comparisonResult = null;
    
    showScreen('practiceScreen');
    updatePracticeScreen();
}


// 更新練習螢幕
function updatePracticeScreen() {
    const item = app.getCurrentItem();
    if (!item) return;
    
    const practiceTitle = document.getElementById('practiceTitle');
    const practiceSubtitle = document.getElementById('practiceSubtitle');
    const practiceText = document.getElementById('practiceText');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const partNavigation = document.getElementById('partNavigation');
    
// 更新標題 - 顯示練習內容
if ('sentences' in item) {
    if (item.translation) {
        practiceTitle.innerHTML = `
            ${item.sentences[app.currentPartIndex]}
            <div class="text-slate-300 text-xl mt-3 font-normal">${item.translation}</div>
        `;
    } else {
        practiceTitle.textContent = item.sentences[app.currentPartIndex];
    }
} else {
    practiceTitle.textContent = item.example;
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
    

    
    
    // 更新導航按鈕狀態
    updateNavigationButtons();
    
    // 重置語音相關狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.updateTranscriptDisplay();
    app.updateRecordButton();
}

// 更新導航按鈕狀態
function updateNavigationButtons() {
    const list = app.getCurrentList();
    const item = app.getCurrentItem();
    
    const prevBtn = document.getElementById('prevBtn');
    const nextItemBtn = document.getElementById('nextItemBtn');
    const prevPartBtn = document.getElementById('prevPartBtn');
    const nextPartBtn = document.getElementById('nextPartBtn');
    
    // 項目導航
    prevBtn.disabled = app.currentIndex === 0;
    nextItemBtn.disabled = app.currentIndex === list.length - 1;
    
    // 句子導航（僅課文）
    if ('sentences' in item) {
        prevPartBtn.disabled = app.currentPartIndex === 0;
        nextPartBtn.disabled = app.currentPartIndex === item.sentences.length - 1;
    }
}

// 導航功能
function navigateItem(direction) {
    const list = app.getCurrentList();
    const newIndex = app.currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < list.length) {
        app.currentIndex = newIndex;
        app.currentPartIndex = 0;
        updatePracticeScreen();
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

// 挑戰模式功能
function startChallenge(contentType) {
    app.mode = 'challenge';
    app.contentType = contentType;
    
    let allItems = [];
    if (contentType === 'vocabulary') {
        allItems = vocabulary;
    } else if (contentType === 'idioms') {
        allItems = idioms;
    } else {
        allItems = passages.flatMap(p => p.sentences);
    }
    
    // 隨機選擇10個題目
    const shuffled = allItems.sort(() => 0.5 - Math.random());
    app.challengeQuestions = shuffled.slice(0, 10);
    app.challengeAnswers = [];
    app.currentQuestionIndex = 0;
    
    showScreen('challengeScreen');
    updateChallengeScreen();
}

function updateChallengeScreen() {
    const challengeProgress = document.getElementById('challengeProgress');
    challengeProgress.textContent = `問題 ${app.currentQuestionIndex + 1} / ${app.challengeQuestions.length}`;
    
    // 清理並重新創建練習單元
    const challengeScreen = document.getElementById('challengeScreen');
    const existingUnit = challengeScreen.querySelector('.bg-slate-700\\/50');
    if (existingUnit) {
        existingUnit.remove();
    }
    
    const currentQuestion = app.challengeQuestions[app.currentQuestionIndex];
    const practiceText = app.getCurrentPracticeText();
    const audioFile = (typeof currentQuestion === 'object' && currentQuestion.audio) ? currentQuestion.audio : '';
    
    // 創建挑戰練習單元
    const practiceUnit = document.createElement('div');
    practiceUnit.className = 'bg-slate-700/50 p-6 rounded-lg border border-slate-600 space-y-4';
    practiceUnit.innerHTML = `
        <div>
            <h3 class="text-lg font-semibold text-sky-300 mb-2">請朗讀以下內容：</h3>
            <div class="flex items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-md">
                <div id="challengeText" class="text-2xl text-white font-medium flex-grow">
    ${practiceText}
    ${(typeof currentQuestion === 'object' && currentQuestion.translation) ? 
        `<div class="text-slate-400 text-lg mt-2 font-normal">${currentQuestion.translation}</div>` : ''}
</div>

                <button onclick="speakText('${practiceText.replace(/'/g, "\\'")}', '${audioFile}')" class="p-2 rounded-full text-sky-300 hover:text-sky-200 hover:bg-slate-700 transition-colors flex-shrink-0" title="聆聽發音">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 class="text-lg font-semibold text-sky-300">你的回答：</h3>
            <button id="recordBtn" onclick="toggleRecording()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
                </svg>
                開始錄音
            </button>
        </div>
        
        <div id="transcriptArea" class="min-h-[100px] bg-slate-900/70 p-4 rounded-md border border-slate-600 text-slate-200 text-xl">
            <p class="italic text-slate-400">點擊 "開始錄音" 後開始說話...</p>
        </div>
        
        <button id="nextBtn" onclick="nextChallenge()" class="hidden w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg shadow-lg transition-all duration-300">
            下一題
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </button>
    `;
    
    challengeScreen.appendChild(practiceUnit);
    
    // 重置狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.updateTranscriptDisplay();
    app.updateRecordButton();
}

function nextChallenge() {
    // 記錄答案
    const result = app.comparisonResult || { isCorrect: false, score: 0 };
    app.challengeAnswers.push({
        correct: result.isCorrect,
        score: result.score
    });
    
    if (app.currentQuestionIndex < app.challengeQuestions.length - 1) {
        app.currentQuestionIndex++;
        updateChallengeScreen();
    } else {
        showChallengeResults();
    }
}

function showChallengeResults() {
    const results = app.challengeQuestions.map((q, i) => ({
        question: typeof q === 'string' ? q : q.example,
        correct: app.challengeAnswers[i].correct,
        score: app.challengeAnswers[i].score
    }));
    
    const correctCount = results.filter(r => r.correct).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    
    // 更新結果顯示
    document.getElementById('averageScore').innerHTML = `${averageScore} <span class="text-2xl text-slate-400">平均分</span>`;
    document.getElementById('correctCount').textContent = `您答對了 ${correctCount} / ${results.length} 題。`;
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = results.map((item, index) => `
        <li class="flex justify-between items-center p-2 rounded-md bg-slate-800/70">
            <span class="text-slate-300 italic flex-1 mr-4 truncate" title="${item.question}">${item.question}</span>
            <span class="font-bold text-lg whitespace-nowrap ${item.score >= 80 ? 'text-green-400' : item.score >= 60 ? 'text-yellow-400' : 'text-red-400'}">
                ${item.score} 分
            </span>
        </li>
    `).join('');
    
    showScreen('challengeResult');
}

// 錄音控制
function toggleRecording() {
    if (app.isListening) {
        app.stopListening();
    } else {
        app.startListening();
    }
}

// 事件監聽器設定
document.addEventListener('DOMContentLoaded', function() {
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
        app.mode = 'challenge';
        document.getElementById('contentModeTitle').textContent = '挑戰模式';
        showScreen('contentTypeSelection');
    });
    
    // 內容類型選擇
    document.getElementById('vocabularyType').addEventListener('click', () => {
        app.contentType = 'vocabulary';
        if (app.mode === 'practice') {
            showScreen('listView');
            renderList();
        } else {
            startChallenge('vocabulary');
        }
    });
    
    document.getElementById('idiomsType').addEventListener('click', () => {
        app.contentType = 'idioms';
        if (app.mode === 'practice') {
            showScreen('listView');
            renderList();
        } else {
            startChallenge('idioms');
        }
    });
    
    document.getElementById('passageType').addEventListener('click', () => {
        app.contentType = 'passage';
        if (app.mode === 'practice') {
            showScreen('listView');
            renderList();
        } else {
            startChallenge('passage');
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
        // 獲取音檔路徑
        const audioFile = item.audio || '';
        speakText(practiceText, audioFile);
    }
});

    
    document.getElementById('recordBtn').addEventListener('click', toggleRecording);
    
    // 練習導航
    document.getElementById('prevBtn').addEventListener('click', () => navigateItem(-1));
    document.getElementById('nextItemBtn').addEventListener('click', () => navigateItem(1));
    document.getElementById('prevPartBtn').addEventListener('click', () => navigatePart(-1));
    document.getElementById('nextPartBtn').addEventListener('click', () => navigatePart(1));
    
    // 挑戰結果頁面按鈕
    document.getElementById('backToMainBtn').addEventListener('click', () => showScreen('modeSelection'));
    document.getElementById('retryChallengeBtn').addEventListener('click', () => {
        if (app.contentType) {
            startChallenge(app.contentType);
        }
    });
    
    // 初始化應用
    showScreen('loadingScreen');
});

// 全域函數（供 HTML onclick 使用）
window.startPractice = startPractice;
window.toggleRecording = toggleRecording;
window.speakText = speakText;
window.nextChallenge = nextChallenge;
window.loadDataFromFile = loadDataFromFile;