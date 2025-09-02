// 手機調試顯示函數
let debugMessages = [];
function mobileDebug(message) {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    debugMessages.push(debugMessage);
    
    if (debugMessages.length > 20) {
        debugMessages.shift();
    }
    
    let debugWindow = document.getElementById('mobileDebugWindow');
    if (!debugWindow) {
        debugWindow = document.createElement('div');
        debugWindow.id = 'mobileDebugWindow';
        debugWindow.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 10px;
            padding: 8px;
            border-radius: 8px;
            z-index: 10000;
            overflow-y: auto;
            border: 1px solid #333;
        `;
        document.body.appendChild(debugWindow);
        
        debugWindow.addEventListener('dblclick', () => {
            debugWindow.style.display = debugWindow.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    debugWindow.innerHTML = debugMessages.join('<br>');
    debugWindow.scrollTop = debugWindow.scrollHeight;
    console.log(debugMessage);
}

// 練習內容數據
let vocabulary = [];
let idioms = [];
let passages = [];
let dataLoaded = false;

// 瀏覽器相容性檢測
function checkBrowserCompatibility() {
    mobileDebug('檢查瀏覽器相容性...');
    
    const hasSpeechRecognition = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    
    if (!hasSpeechRecognition) {
        setTimeout(() => showBrowserCompatibilityWarning(), 1000);
        return false;
    }
    
    if (isFirefox) {
        setTimeout(() => showFirefoxWarning(), 1000);
    }
    
    mobileDebug('瀏覽器相容性檢查通過');
    return true;
}

function showBrowserCompatibilityWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'browserWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-yellow-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">瀏覽器不支援語音識別</h3>
            <p class="text-slate-300 mb-6">建議使用 Chrome 或 Edge 瀏覽器以獲得最佳體驗</p>
            <button onclick="proceedWithoutSpeech()" class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl">
                仍要繼續使用（無語音功能）
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
}

function showFirefoxWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'firefoxWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);">
            <h3 class="text-2xl font-bold text-white mb-4">Firefox 語音功能提醒</h3>
            <p class="text-slate-300 mb-6">Firefox 的語音識別可能不穩定，建議使用 Chrome 或 Edge</p>
            <button onclick="dismissFirefoxWarning()" class="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl">
                繼續使用
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
}

function proceedWithoutSpeech() {
    document.getElementById('browserWarning')?.remove();
    window.speechDisabled = true;
    disableRecordingFeatures();
}

function dismissFirefoxWarning() {
    document.getElementById('firefoxWarning')?.remove();
}

function disableRecordingFeatures() {
    const style = document.createElement('style');
    style.textContent = `
        #recordBtn, #challengeRecordBtn {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Excel 數據載入
async function loadDataFromFile() {
    const loadingStatus = document.getElementById('loadingStatus');
    const loadError = document.getElementById('loadError');
    
    try {
        loadingStatus.textContent = '正在讀取 data.xlsx...';
        loadError.classList.add('hidden');
        
        const response = await fetch('data.xlsx');
        if (!response.ok) {
            throw new Error(`無法載入檔案: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (workbook.SheetNames.includes('words')) {
            const wordsSheet = workbook.Sheets['words'];
            const wordsData = XLSX.utils.sheet_to_json(wordsSheet, { header: 1 });
            vocabulary = processWordsSheet(wordsData);
        }
        
        if (workbook.SheetNames.includes('idioms')) {
            const idiomsSheet = workbook.Sheets['idioms'];
            const idiomsData = XLSX.utils.sheet_to_json(idiomsSheet, { header: 1 });
            idioms = processIdiomsSheet(idiomsData);
        }
        
        if (workbook.SheetNames.includes('text')) {
            const textSheet = workbook.Sheets['text'];
            const textData = XLSX.utils.sheet_to_json(textSheet, { header: 1 });
            passages = processTextSheet(textData);
        }
        
        dataLoaded = true;
        loadingStatus.textContent = '數據載入完成！';
        setTimeout(() => showScreen('modeSelection'), 1000);
        
    } catch (error) {
        console.error('載入 Excel 檔案時發生錯誤:', error);
        loadError.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = error.message;
    }
}

function processWordsSheet(data) {
    const words = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) {
            words.push({
                id: `w${i}`,
                word: row[1],
                meaning: row[2] || '',
                example: row[1] || '',
                audio: row[3] ? `audio/${row[3]}` : ''
            });
        }
    }
    return words;
}

function processIdiomsSheet(data) {
    const idiomsList = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) {
            idiomsList.push({
                id: `i${i}`,
                word: row[1],
                meaning: row[2] || '',
                example: row[1] || '',
                audio: row[3] ? `audio/${row[3]}` : ''
            });
        }
    }
    return idiomsList;
}

function processTextSheet(data) {
    const sentences = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) {
            const sentence = row[1];
            const title = sentence.length > 40 ? sentence.substring(0, 40) + '...' : sentence;
            sentences.push({
                id: `t${i}`,
                title: title,
                sentences: [sentence],
                translation: row[2] || '',
                audio: row[3] ? `audio/${row[3]}` : ''
            });
        }
    }
    return sentences;
}

// 音頻管理器
class AudioManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
    }
    
    stopAll() {
        mobileDebug('停止所有音頻');
        
        // 停止當前音頻
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // 停止所有 audio 元素
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.remove();
        });
        
        this.isPlaying = false;
        mobileDebug('所有音頻已停止');
    }
    
    play(audioFile, onEnded) {
        mobileDebug('開始播放音頻: ' + audioFile);
        
        this.stopAll();
        
        if (!audioFile || !audioFile.trim()) {
            mobileDebug('沒有音頻檔案');
            alert('此項目沒有對應的音檔');
            return;
        }
        
        this.isPlaying = true;
        disableRecordingButtons();
        
        this.currentAudio = new Audio(audioFile);
        this.currentAudio.preload = 'auto';
        
        this.currentAudio.onended = () => {
            mobileDebug('音頻播放結束');
            this.isPlaying = false;
            this.currentAudio = null;
            
            setTimeout(() => {
                enableRecordingButtons();
                if (onEnded) onEnded();
            }, 1000); // 1秒延遲確保資源釋放
        };
        
        this.currentAudio.onerror = (e) => {
            mobileDebug('音頻播放錯誤: ' + e.message);
            this.isPlaying = false;
            this.currentAudio = null;
            enableRecordingButtons();
            alert('音檔播放失敗');
        };
        
        // 延遲播放確保前一個音頻完全停止
        setTimeout(() => {
            if (this.currentAudio) {
                this.currentAudio.play().catch(error => {
                    mobileDebug('播放失敗: ' + error.message);
                    this.isPlaying = false;
                    enableRecordingButtons();
                });
            }
        }, 200);
    }
}

// 語音識別管理器
class SpeechManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        this.initSpeechRecognition();
    }
    
    initSpeechRecognition() {
        if (window.speechDisabled) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        this.createRecognition();
    }
    
    createRecognition() {
        mobileDebug('創建語音識別實例');
        
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (e) {}
            this.recognition = null;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            mobileDebug('語音識別啟動');
            this.updateRecordButton();
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i][0];
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
            
            this.updateTranscriptDisplay();
            this.updateWordColors();
        };
        
        this.recognition.onerror = (event) => {
            mobileDebug('語音識別錯誤: ' + event.error);
            
            if (event.error === 'aborted') {
                // 被中止時重新創建
                this.isListening = false;
                this.updateRecordButton();
                setTimeout(() => this.createRecognition(), 500);
                return;
            }
            
            this.stopListening();
            
            let errorMsg = '';
            switch(event.error) {
                case 'no-speech':
                    errorMsg = '未偵測到語音，請再試一次';
                    break;
                case 'audio-capture':
                    errorMsg = '無法取用麥克風，請檢查權限設定';
                    break;
                case 'not-allowed':
                    errorMsg = '麥克風權限被拒絕';
                    break;
                default:
                    errorMsg = `語音識別錯誤: ${event.error}`;
            }
            
            if (errorMsg) alert(errorMsg);
        };
        
        this.recognition.onend = () => {
            mobileDebug('語音識別結束');
            this.isListening = false;
            this.interimTranscript = '';
            this.updateRecordButton();
            
            if (this.transcript) {
                this.processTranscript();
            }
        };
    }
    
    startListening() {
        mobileDebug('開始語音識別');
        
        if (window.speechDisabled) {
            alert('您的瀏覽器不支援語音識別功能');
            return;
        }
        
        if (this.isListening) return;
        
        // 確保音頻停止
        audioManager.stopAll();
        
        // 重新創建實例避免衝突
        this.createRecognition();
        
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        this.resetWordColors();
        
        // 延遲啟動確保音頻資源釋放
        setTimeout(() => {
            if (this.recognition) {
                try {
                    this.recognition.start();
                    this.isListening = true;
                    this.updateRecordButton();
                } catch (e) {
                    mobileDebug('啟動失敗: ' + e.message);
                    setTimeout(() => {
                        try {
                            this.createRecognition();
                            this.recognition.start();
                            this.isListening = true;
                            this.updateRecordButton();
                        } catch (e2) {
                            alert('語音識別啟動失敗，請重新整理頁面');
                        }
                    }, 1000);
                }
            }
        }, audioManager.isPlaying ? 2000 : 500);
    }
    
    stopListening() {
        mobileDebug('停止語音識別');
        
        if (!this.isListening) return;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                mobileDebug('停止失敗: ' + e.message);
            }
        }
        
        this.isListening = false;
        this.updateRecordButton();
        
        setTimeout(() => this.updateWordColors(), 100);
    }
    
    updateRecordButton() {
        const recordBtn = document.getElementById('recordBtn');
        const challengeRecordBtn = document.getElementById('challengeRecordBtn');
        
        [recordBtn, challengeRecordBtn].forEach(btn => {
            if (!btn) return;
            
            if (this.isListening) {
                btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                    </svg>
                    <span>停止錄音</span>
                `;
                btn.className = 'inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-2xl shadow-xl transition-all duration-300';
            } else {
                btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7 4a3 3 0 616 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
                    </svg>
                    <span>開始錄音</span>
                `;
                btn.className = 'inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105';
            }
        });
    }
    
    updateTranscriptDisplay() {
        let transcriptArea;
        if (app.currentScreen === 'challengeScreen') {
            transcriptArea = document.getElementById('challengeTranscriptArea');
        } else {
            transcriptArea = document.getElementById('transcriptArea');
        }
        
        if (!transcriptArea) return;
        
        if (this.comparisonResult) {
            const item = app.getCurrentItem();
            if ('sentences' in item) {
                transcriptArea.innerHTML = `
                    <div class="text-center">
                        <p class="text-sm text-slate-300 mb-2">識別結果：</p>
                        <p class="text-lg font-semibold text-white">${this.transcript}</p>
                        <p class="text-sm text-slate-400 mt-2">準確度: ${this.comparisonResult.score}%</p>
                    </div>
                `;
            } else {
                transcriptArea.innerHTML = `
                    <div class="text-center">
                        <p class="text-sm text-slate-300 mb-2">識別結果：</p>
                        <div class="text-lg break-words">${this.comparisonResult.html}</div>
                        <p class="text-xs text-slate-400 mt-2">準確度: ${this.comparisonResult.score}%</p>
                    </div>
                `;
            }
        } else if (this.isListening) {
            let displayContent = '';
            
            if (this.transcript) {
                displayContent += `<span class="text-white font-medium">${this.transcript}</span>`;
            }
            
            if (this.interimTranscript) {
                displayContent += `<span class="text-blue-300 italic ml-1">${this.interimTranscript}</span>`;
            }
            
            if (!this.transcript && !this.interimTranscript) {
                displayContent = '<span class="text-yellow-400 italic">🎙️ 正在聆聽，請開始說話</span>';
            }
            
            displayContent += '<span class="ml-2 inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>';
            
            transcriptArea.innerHTML = `<div class="text-center">${displayContent}</div>`;
        } else if (this.transcript) {
            transcriptArea.innerHTML = `
                <div class="text-center">
                    <p class="text-sm text-slate-300 mb-2">錄音完成，您說的是：</p>
                    <p class="text-white font-medium text-lg">${this.transcript}</p>
                    <p class="text-xs text-slate-400 mt-2">正在分析中...</p>
                </div>
            `;
        } else {
            transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "錄音" 開始語音輸入</p>';
        }
    }
    
    processTranscript() {
        const practiceText = app.getCurrentPracticeText();
        if (!practiceText || !this.transcript) return;
        
        this.comparisonResult = this.compareAndColorize(practiceText, this.transcript);
        this.updateTranscriptDisplay();
        
        const item = app.getCurrentItem();
        const isChallenge = app.currentScreen === 'challengeScreen';
        
        if (isChallenge) {
            document.getElementById('nextQuestionBtn').classList.remove('hidden');
            
            const currentQuestion = app.challengeQuestions[app.currentQuestionIndex];
            app.challengeAnswers[app.currentQuestionIndex] = {
                question: currentQuestion.practiceText,
                userAnswer: this.transcript,
                score: this.comparisonResult ? this.comparisonResult.score : 0
            };
            
            app.currentScore = Math.round(app.challengeAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / app.challengeAnswers.length);
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
        
        const alignment = this.alignWords(originalWords, spokenWords);
        
        alignment.forEach((item, index) => {
            const { original: originalWord, spoken: spokenWord, type } = item;
            
            if (type === 'match') {
                const similarity = this.calculateWordSimilarity(originalWord, spokenWord);
                
                if (similarity >= 0.8) {
                    correctWordCount++;
                    resultNodes.push(`<span class="correct-word">${spokenWord} </span>`);
                    details.push({
                        type: 'correct',
                        message: `✓ "${spokenWord}" 發音正確`
                    });
                } else if (similarity >= 0.5) {
                    correctWordCount += 0.7;
                    resultNodes.push(`<span class="close-word">${spokenWord} </span>`);
                    details.push({
                        type: 'close',
                        message: `~ "${spokenWord}" 很接近，標準發音：「${originalWord}」`
                    });
                } else {
                    resultNodes.push(`<span class="incorrect-word">${spokenWord} </span>`);
                    details.push({
                        type: 'incorrect',
                        message: `✗ "${spokenWord}" 與「${originalWord}」差異較大`
                    });
                }
            } else if (type === 'extra') {
                resultNodes.push(`<span class="extra-word">${spokenWord} </span>`);
                details.push({
                    type: 'extra',
                    message: `? 多說了「${spokenWord}」`
                });
            } else if (type === 'missing') {
                resultNodes.push(`<span class="missing-word">(${originalWord}) </span>`);
                details.push({
                    type: 'missing',
                    message: `! 遺漏了「${originalWord}」`
                });
            }
        });
        
        const accuracy = originalWords.length > 0 ? (correctWordCount / originalWords.length) : 0;
        const score = Math.round(accuracy * 100);
        
        return { 
            html: resultNodes.join(''), 
            isCorrect: accuracy >= 0.6, 
            score,
            details
        };
    }
    
    alignWords(original, spoken) {
        const result = [];
        let originalIndex = 0;
        let spokenIndex = 0;
        
        while (originalIndex < original.length || spokenIndex < spoken.length) {
            if (originalIndex < original.length && spokenIndex < spoken.length) {
                const originalWord = original[originalIndex];
                const spokenWord = spoken[spokenIndex];
                const similarity = this.calculateWordSimilarity(originalWord, spokenWord);
                
                if (similarity >= 0.3) {
                    result.push({
                        original: originalWord,
                        spoken: spokenWord,
                        type: 'match'
                    });
                    originalIndex++;
                    spokenIndex++;
                } else {
                    result.push({
                        original: null,
                        spoken: spokenWord,
                        type: 'extra'
                    });
                    spokenIndex++;
                }
            } else if (originalIndex < original.length) {
                result.push({
                    original: original[originalIndex],
                    spoken: null,
                    type: 'missing'
                });
                originalIndex++;
            } else {
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
    
    calculateWordSimilarity(word1, word2) {
        const clean1 = word1.toLowerCase().replace(/[^\w]/g, '');
        const clean2 = word2.toLowerCase().replace(/[^\w]/g, '');
        
        if (clean1 === clean2) return 1.0;
        
        const editDistance = this.levenshteinDistance(clean1, clean2);
        const maxLength = Math.max(clean1.length, clean2.length);
        const editSimilarity = 1 - (editDistance / maxLength);
        
        const phoneticSimilarity = this.getPhoneticSimilarity(clean1, clean2);
        
        return (editSimilarity * 0.6) + (phoneticSimilarity * 0.4);
    }
    
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
    
    getPhoneticSimilarity(word1, word2) {
        const phoneticPatterns = [
            ['a', 'e'], ['e', 'i'], ['i', 'o'], ['o', 'u'],
            ['b', 'p'], ['d', 't'], ['g', 'k'], ['v', 'f'], ['z', 's'],
            ['th', 's'], ['th', 'f'], ['l', 'r'], ['n', 'm']
        ];
        
        let similarity = 0;
        
        for (const [sound1, sound2] of phoneticPatterns) {
            if ((word1.includes(sound1) && word2.includes(sound2)) ||
                (word1.includes(sound2) && word2.includes(sound1))) {
                similarity += 0.3;
            }
        }
        
        if (word1[0] === word2[0]) similarity += 0.2;
        if (word1[word1.length - 1] === word2[word2.length - 1]) similarity += 0.2;
        
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
    
    resetWordColors() {
        document.querySelectorAll('[data-word-index]').forEach(span => {
            span.className = 'word-default';
        });
    }
    
    updateWordColors() {
        // 簡化的即時顏色更新
        if (this.isListening && this.interimTranscript) {
            document.querySelectorAll('[data-word-index]').forEach((span, index) => {
                if (index === 0) {
                    span.className = 'word-speaking';
                }
            });
        }
    }
   resetTranscriptDisplay() {
    let transcriptArea;
    if (app.currentScreen === 'challengeScreen') {
        transcriptArea = document.getElementById('challengeTranscriptArea');
    } else {
        transcriptArea = document.getElementById('transcriptArea');
    }
    
    if (transcriptArea) {
        transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "錄音" 開始語音輸入</p>';
    }
} 
}

// 應用狀態管理
class AppState {
    constructor() {
        this.currentScreen = 'modeSelection';
        this.mode = null;
        this.contentType = null;
        this.currentIndex = 0;
        this.currentPartIndex = 0;
        this.from = 'list';
        this.challengeQuestions = [];
        this.challengeAnswers = [];
        this.currentQuestionIndex = 0;
        this.challengeType = null;
        this.currentScore = 0;
    }
    
    getCurrentItem() {
        if (this.mode === 'challenge') {
            return this.challengeQuestions[this.currentQuestionIndex] || null;
        }
        
        const list = this.getCurrentList();
        return list[this.currentIndex] || null;
    }
    
    getCurrentList() {
        if (this.mode === 'challenge') {
            return this.challengeQuestions;
        }
        
        if (this.contentType === 'vocabulary') {
            return [...vocabulary, ...idioms];
        } else {
            return passages;
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
    
resetAllStates() {
    // 停止語音識別
    speechManager.stopListening();
    
    // 清除語音相關狀態
    speechManager.transcript = '';
    speechManager.interimTranscript = '';
    speechManager.comparisonResult = null;
    
    // 重置索引
    this.currentIndex = 0;
    this.currentPartIndex = 0;
    
    // 清理 DOM 中的回饋
    document.getElementById('detailedFeedback')?.remove();
    document.getElementById('sentenceFeedback')?.remove();
    document.getElementById('wordFeedbackPopup')?.remove();
    document.getElementById('clickHint')?.remove();
    
    // 重置按鈕和顯示
    speechManager.updateRecordButton();
    speechManager.resetWordColors();
    speechManager.resetTranscriptDisplay();
}
}

// 全域實例
const audioManager = new AudioManager();
const speechManager = new SpeechManager();
const app = new AppState();

// 螢幕管理
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    const homeBtn = document.getElementById('homeBtn');
    if (screenId === 'modeSelection') {
        homeBtn.classList.add('hidden');
    } else {
        homeBtn.classList.remove('hidden');
    }
    
    app.currentScreen = screenId;
}

// 音頻播放
function speakText(text, audioFile = null) {
    speechManager.stopListening();
    audioManager.play(audioFile);
}

// 錄音控制
function toggleRecording() {
    if (speechManager.isListening) {
        speechManager.stopListening();
    } else {
        speechManager.startListening();
    }
}

function toggleChallengeRecording() {
    toggleRecording();
}

// 按鈕控制
function disableRecordingButtons() {
    [document.getElementById('recordBtn'), document.getElementById('challengeRecordBtn')].forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 4a3 3 0 616 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
                </svg>
                <span>音檔播放中...</span>
            `;
        }
    });
}

function enableRecordingButtons() {
    mobileDebug('啟用錄音按鈕');
    [document.getElementById('recordBtn'), document.getElementById('challengeRecordBtn')].forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });
    speechManager.updateRecordButton();
}

// 列表渲染
function renderList() {
    app.resetAllStates();
    
    const allItemsList = document.getElementById('allItemsList');
    const listTitle = document.getElementById('listTitle');
    
    const titleMap = {
        'vocabulary': '詞彙列表',
        'passage': '課文列表'
    };
    listTitle.textContent = titleMap[app.contentType] || '列表';
    
    let allItems = [];
    if (app.contentType === 'vocabulary') {
        allItems = [...vocabulary, ...idioms];
    } else {
        allItems = passages;
    }
    
    allItemsList.innerHTML = allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        if ('word' in item) {
            return `
                <button onclick="startPractice(${index}, 'list')" 
                        class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="flex: 1; min-width: 0;">
                        <p class="text-white text-body text-lg truncate font-semibold">${item.word}</p>
                        ${item.meaning ? `<p class="text-slate-400 text-sm truncate mt-1">${item.meaning}</p>` : ''}
                    </div>
                    <div style="flex-shrink: 0; margin-left: 16px;">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            `;
        } else {
            const displayText = item.title;
            return `
                <button onclick="startPractice(${index}, 'list')" 
                        class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="flex: 1; min-width: 0;">
                        <p class="text-white text-body text-lg truncate">${displayText}</p>
                    </div>
                    <div style="flex-shrink: 0; margin-left: 16px;">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            `;
        }
    }).join('');
}

// 練習功能
function startPractice(index, from = 'list') {
    app.currentIndex = index;
    app.currentPartIndex = 0;
    app.from = from;
    app.resetAllStates();
    
    showScreen('practiceScreen');
    updatePracticeScreen();
}

function updatePracticeScreen() {
    const item = app.getCurrentItem();
    if (!item) return;

    // 清除上一個單字的識別結果
speechManager.transcript = '';
speechManager.interimTranscript = '';
speechManager.comparisonResult = null;
speechManager.resetWordColors();

// 清除任何顯示的回饋內容
document.getElementById('detailedFeedback')?.remove();
document.getElementById('sentenceFeedback')?.remove();
document.getElementById('wordFeedbackPopup')?.remove();
document.getElementById('clickHint')?.remove();
    
    const practiceTitle = document.getElementById('practiceTitle');
    const practiceSubtitle = document.getElementById('practiceSubtitle');
    const partNavigation = document.getElementById('partNavigation');
    
    if ('sentences' in item) {
        const sentence = item.sentences[app.currentPartIndex];
        const words = sentence.split(' ');
        const wordsHtml = words.map((word, index) => 
            `<span class="word-default" data-word-index="${index}">${word}</span>`
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
        const meaningDisplay = item.meaning ? `<div class="translation-text">${item.meaning}</div>` : '';
        practiceTitle.innerHTML = `
            <span class="word-default" data-word-index="0">${item.example}</span>
            ${meaningDisplay}
        `;
    }
    
    if ('sentences' in item && item.sentences.length > 1) {
        practiceSubtitle.textContent = `句子 ${app.currentPartIndex + 1} / ${item.sentences.length}`;
        practiceSubtitle.classList.remove('hidden');
        partNavigation.classList.remove('hidden');
    } else {
        practiceSubtitle.classList.add('hidden');
        partNavigation.classList.add('hidden');
    }
    
    updateNavigationButtons();
    speechManager.updateRecordButton();
    // 重置轉錄顯示區域
speechManager.updateTranscriptDisplay();
}

function updateNavigationButtons() {
    const list = app.getCurrentList();
    const item = app.getCurrentItem();
    
    const prevBtn = document.getElementById('prevBtn');
    const nextItemBtn = document.getElementById('nextItemBtn');
    const prevPartBtn = document.getElementById('prevPartBtn');
    const nextPartBtn = document.getElementById('nextPartBtn');
    
    if (app.mode === 'challenge') {
        prevBtn.disabled = app.currentQuestionIndex === 0;
        nextItemBtn.disabled = app.currentQuestionIndex === list.length - 1;
    } else {
        prevBtn.disabled = app.currentIndex === 0;
        nextItemBtn.disabled = app.currentIndex === list.length - 1;
    }
    
    if ('sentences' in item) {
        prevPartBtn.disabled = app.currentPartIndex === 0;
        nextPartBtn.disabled = app.currentPartIndex === item.sentences.length - 1;
    }
}

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

// 挑戰模式
function startChallenge(challengeType = 'mixed') {
    app.mode = 'challenge';
    app.challengeType = challengeType;
    app.challengeAnswers = [];
    app.currentScore = 0;
    
    let allItems = [];
    
    switch(challengeType) {
        case 'vocabulary':
            vocabulary.forEach(item => {
                allItems.push({
                    ...item,
                    type: 'vocabulary',
                    practiceText: item.example || item.word
                });
            });
            idioms.forEach(item => {
                allItems.push({
                    ...item,
                    type: 'idioms',
                    practiceText: item.example || item.word
                });
            });
            break;
            
        case 'passage':
            passages.forEach(passage => {
                allItems.push({
                    ...passage,
                    type: 'passage',
                    practiceText: passage.sentences[0]
                });
            });
            break;
            
        case 'mixed':
        default:
            vocabulary.forEach(item => {
                allItems.push({
                    ...item,
                    type: 'vocabulary',
                    practiceText: item.example || item.word
                });
            });
            idioms.forEach(item => {
                allItems.push({
                    ...item,
                    type: 'idioms',
                    practiceText: item.example || item.word
                });
            });
            passages.forEach(passage => {
                allItems.push({
                    ...passage,
                    type: 'passage',
                    practiceText: passage.sentences[0]
                });
            });
            break;
    }
    
    const shuffled = allItems.sort(() => 0.5 - Math.random());
    app.challengeQuestions = shuffled.slice(0, 10);
    app.currentQuestionIndex = 0;
    
    app.resetAllStates();
    
    showScreen('challengeScreen');
    updateChallengeScreen();
}

function updateChallengeScreen() {
    const question = app.challengeQuestions[app.currentQuestionIndex];
    if (!question) return;
    
    document.getElementById('challengeProgress').textContent = 
        `題目 ${app.currentQuestionIndex + 1} / ${app.challengeQuestions.length}`;

    // 清除上一題的識別結果
speechManager.transcript = '';
speechManager.interimTranscript = '';
speechManager.comparisonResult = null;
speechManager.resetWordColors();

// 清除任何顯示的回饋內容
document.getElementById('detailedFeedback')?.remove();
document.getElementById('sentenceFeedback')?.remove();
document.getElementById('wordFeedbackPopup')?.remove();
document.getElementById('clickHint')?.remove();
    
    document.getElementById('challengeScore').textContent = app.currentScore || 0;
    
    const practiceTitle = document.getElementById('challengePracticeTitle');
    
    if (question.type === 'passage') {
        const sentence = question.practiceText;
        const words = sentence.split(' ');
        const wordsHtml = words.map((word, index) => 
            `<span class="word-default" data-word-index="${index}">${word}</span>`
        ).join(' ');
        
        if (question.translation) {
            practiceTitle.innerHTML = `
                ${wordsHtml}
                <div class="translation-text">${question.translation}</div>
            `;
        } else {
            practiceTitle.innerHTML = wordsHtml;
        }
    } else {
        const meaningDisplay = question.meaning ? `<div class="translation-text">${question.meaning}</div>` : '';
        practiceTitle.innerHTML = `
            <span class="word-default" data-word-index="0">${question.practiceText}</span>
            ${meaningDisplay}
        `;
    }
    
    speechManager.resetWordColors();
    speechManager.updateRecordButton();
    // 重置轉錄顯示區域
speechManager.updateTranscriptDisplay();
    
    
    document.getElementById('nextQuestionBtn').classList.add('hidden');
}

function nextChallengeQuestion() {
    if (app.currentQuestionIndex < app.challengeQuestions.length - 1) {
        app.currentQuestionIndex++;
        app.resetAllStates();
        updateChallengeScreen();
    } else {
        showChallengeResult();
    }
}

function showChallengeResult() {
    const totalQuestions = app.challengeQuestions.length;
    const totalScore = app.challengeAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const averageScore = Math.round(totalScore / totalQuestions);
    const correctCount = app.challengeAnswers.filter(answer => (answer.score || 0) >= 60).length;
    
    document.getElementById('averageScore').innerHTML = 
        `${averageScore} <span class="text-2xl text-slate-400">平均分</span>`;
    document.getElementById('correctCount').textContent = 
        `您答對了 ${correctCount} / ${totalQuestions} 題`;
    
    const performanceLevel = document.getElementById('performanceLevel');
    const congratsMessage = document.getElementById('congratsMessage');
    
    if (averageScore >= 90) {
        performanceLevel.textContent = '🏆 完美表現！';
        congratsMessage.textContent = '哇！你的發音太棒了！';
        performanceLevel.className = 'text-lg font-semibold text-yellow-400';
    } else if (averageScore >= 80) {
        performanceLevel.textContent = '🥈 優秀表現！';
        congratsMessage.textContent = '很棒！繼續保持！';
        performanceLevel.className = 'text-lg font-semibold text-emerald-400';
    } else if (averageScore >= 60) {
        performanceLevel.textContent = '🥉 良好表現！';
        congratsMessage.textContent = '不錯！再練習會更好！';
        performanceLevel.className = 'text-lg font-semibold text-blue-400';
    } else {
        performanceLevel.textContent = '💪 繼續努力！';
        congratsMessage.textContent = '加油！多練習一定會進步！';
        performanceLevel.className = 'text-lg font-semibold text-orange-400';
    }
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = app.challengeAnswers.map((answer, index) => {
        const icon = (answer.score || 0) >= 60 ? '✅' : '❌';
        const scoreColor = (answer.score || 0) >= 60 ? 'text-green-400' : 'text-red-400';
        return `
            <li class="flex justify-between items-center py-2 border-b border-slate-700">
                <span class="text-slate-300">
                    ${icon} 第${index + 1}題: ${answer.question}
                </span>
                <span class="${scoreColor} font-bold">${answer.score || 0}分</span>
            </li>
        `;
    }).join('');
    
    showScreen('challengeResult');
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    mobileDebug('頁面載入完成，開始初始化');
    
    setTimeout(() => checkBrowserCompatibility(), 500);
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
    document.getElementById('vocabularyChallengeType').addEventListener('click', () => {
        startChallenge('vocabulary');
    });

    document.getElementById('passageChallengeType').addEventListener('click', () => {
        startChallenge('passage');
    });

    document.getElementById('mixedChallengeType').addEventListener('click', () => {
        startChallenge('mixed');
    });

    // 挑戰模式按鈕
    document.getElementById('challengeSpeakBtn').addEventListener('click', () => {
        const question = app.challengeQuestions[app.currentQuestionIndex];
        if (question && question.practiceText) {
            const audioFile = question.audio || '';
            speakText(question.practiceText, audioFile);
        }
    });

    document.getElementById('challengeRecordBtn').addEventListener('click', toggleChallengeRecording);
    document.getElementById('nextQuestionBtn').addEventListener('click', nextChallengeQuestion);

    // 導航按鈕
    document.getElementById('backToModeFromChallenge').addEventListener('click', () => showScreen('modeSelection'));
    document.getElementById('backToListFromChallenge').addEventListener('click', () => showScreen('challengeTypeSelection'));

    // 結果頁面按鈕
    document.getElementById('retryCurrentChallengeBtn').addEventListener('click', () => {
        startChallenge(app.challengeType);
    });

    document.getElementById('newChallengeBtn').addEventListener('click', () => {
        showScreen('challengeTypeSelection');
    });
    
    // 內容類型選擇
    document.getElementById('vocabularyType').addEventListener('click', () => {
        app.resetAllStates();
        app.contentType = 'vocabulary';
        if (app.mode === 'practice') {
            showScreen('listView');
            renderList();
        }
    });

    document.getElementById('passageType').addEventListener('click', () => {
        app.resetAllStates();
        app.contentType = 'passage';
        if (app.mode === 'practice') {
            showScreen('listView');
            renderList();
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
        
        if (practiceText && item) {
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
    
    showScreen('loadingScreen');
});

// 全域函數
window.startPractice = startPractice;
window.toggleRecording = toggleRecording;
window.speakText = speakText;
window.loadDataFromFile = loadDataFromFile;
window.proceedWithoutSpeech = proceedWithoutSpeech;
window.dismissFirefoxWarning = dismissFirefoxWarning;
