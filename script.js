// 練習內容數據 - 從 Excel 載入
let vocabulary = [];
let idioms = [];
let passages = [];
let dataLoaded = false;

// 全域音頻管理器 - 統一管理所有音頻
const AudioManager = {
    currentAudio: null,
    baseVolume: 0.3,
    
    play(audioFile) {
        // 先停止並清理任何現有音頻
        this.stop();
        
        if (!audioFile || !audioFile.trim()) {
            return Promise.reject('No audio file');
        }
        
        return new Promise((resolve, reject) => {
            this.currentAudio = new Audio(audioFile);
            this.currentAudio.volume = this.baseVolume;
            
            this.currentAudio.onended = () => {
                this.cleanup();
                resolve();
            };
            
            this.currentAudio.onerror = () => {
                this.cleanup();
                reject('Audio playback error');
            };
            
            // 標記播放狀態
            window.isPlayingAudio = true;
            if (app) app.updateRecordButton();
            
            this.currentAudio.play().catch(err => {
                this.cleanup();
                reject(err);
            });
        });
    },
    
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.cleanup();
    },
    
    cleanup() {
        // 清理所有遺留的音頻元素
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.remove();
        });
        
        window.isPlayingAudio = false;
        if (app) app.updateRecordButton();
    }
};

// 瀏覽器相容性檢測
function checkBrowserCompatibility() {
    console.log('開始檢查瀏覽器相容性...');
    
    const hasSpeechRecognition = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    if (hasSpeechRecognition) {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const testRecognition = new SpeechRecognition();
            
            if (isFirefox) {
                setTimeout(() => {
                    showFirefoxWarning();
                }, 2000);
                return true;
            }
            
            console.log('語音識別測試成功');
            return true;
            
        } catch (error) {
            console.log('語音識別創建失敗:', error);
            setTimeout(() => {
                showBrowserCompatibilityWarning();
            }, 2000);
            return false;
        }
    } else {
        console.log('檢測到不支援語音識別的瀏覽器');
        setTimeout(() => {
            showBrowserCompatibilityWarning();
        }, 2000);
        return false;
    }
}

// Firefox 專用警告
function showFirefoxWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'firefoxWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center">
            <div class="text-orange-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">Firefox 語音功能提醒</h3>
            <p class="text-slate-300 mb-6">Firefox 的語音識別功能可能不穩定</p>
            <button onclick="dismissFirefoxWarning()" class="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl">
                我知道了
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
}

function dismissFirefoxWarning() {
    const warning = document.getElementById('firefoxWarning');
    if (warning) warning.remove();
}

// 瀏覽器不支援警告
function showBrowserCompatibilityWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'browserWarning';
    warningDiv.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    warningDiv.innerHTML = `
        <div class="glass-primary rounded-3xl p-8 max-w-md mx-4 text-center">
            <div class="text-yellow-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">瀏覽器不支援語音識別</h3>
            <p class="text-slate-300 mb-6">建議使用 Chrome 或 Edge 瀏覽器</p>
            <button onclick="dismissWarning()" class="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl">
                我知道了
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
}

function dismissWarning() {
    const warning = document.getElementById('browserWarning');
    if (warning) warning.remove();
}

// Excel 數據處理函數
async function loadDataFromFile() {
    const loadingStatus = document.getElementById('loadingStatus');
    const loadError = document.getElementById('loadError');
    
    try {
        loadingStatus.textContent = '正在讀取 data.xlsx...';
        loadError.classList.add('hidden');
        
        const response = await fetch('data.xlsx');
        if (!response.ok) {
            throw new Error(`無法載入檔案: ${response.status}`);
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
        
        setTimeout(() => {
            showScreen('modeSelection');
        }, 1000);
        
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
                example: row[1],
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
                example: row[1],
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

// 應用狀態管理
class AppState {
    constructor() {
        this.currentScreen = 'modeSelection';
        this.mode = null;
        this.contentType = null;
        this.currentIndex = 0;
        this.currentPartIndex = 0;
        this.from = 'list';
        
        // 語音識別相關
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        
        // 延遲初始化語音識別
        setTimeout(() => {
            this.initSpeechRecognition();
        }, 100);
    }
    
    initSpeechRecognition() {
        // 清理舊的識別器
        if (this.recognition) {
            try {
                this.recognition.stop();
                this.recognition = null;
            } catch (e) {}
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('瀏覽器不支持語音識別');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            console.log('語音識別已啟動');
            this.updateTranscriptDisplay();
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
            
            this.updateWordColors();
            this.updateTranscriptDisplay();
        };
        
        this.recognition.onerror = (event) => {
            console.error('語音識別錯誤:', event.error);
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
    
    async startListening() {
        // 確保音頻完全停止
        AudioManager.stop();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (this.isListening) return;
        
        // 重新初始化識別器
        this.initSpeechRecognition();
        
        // 清空轉錄文字
        this.transcript = '';
        this.interimTranscript = '';
        this.updateTranscriptDisplay();
        
        // 延遲啟動
        setTimeout(() => {
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateRecordButton();
            } catch (e) {
                console.error('啟動語音識別失敗:', e);
                alert('語音識別啟動失敗，請再試一次');
            }
        }, 200);
    }
    
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        this.recognition.stop();
        this.isListening = false;
        this.updateRecordButton();
        this.updateTranscriptDisplay();
    }
    
    updateRecordButton() {
        const button = document.getElementById('recordButton');
        if (!button) return;
        
        const text = button.querySelector('span');
        
        if (window.isPlayingAudio) {
            button.className = 'record-button bg-gray-400';
            button.disabled = true;
            text.textContent = '播放中...';
        } else if (this.isListening) {
            button.className = 'record-button recording';
            button.disabled = false;
            text.textContent = '停止錄音';
        } else {
            button.className = 'record-button';
            button.disabled = false;
            text.textContent = '開始錄音';
        }
    }
    
    updateTranscriptDisplay() {
        const transcriptArea = document.getElementById('transcriptArea');
        if (!transcriptArea) return;
        
        if (this.comparisonResult) {
            transcriptArea.innerHTML = `
                <div class="text-center">
                    <p class="text-sm text-slate-300 mb-2">識別結果：</p>
                    <div class="text-lg break-words">${this.comparisonResult.html}</div>
                    <p class="text-xs text-slate-400 mt-2">準確度: ${this.comparisonResult.score}%</p>
                </div>
            `;
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
                    <p class="text-sm text-slate-300 mb-2">錄音完成：</p>
                    <p class="text-white font-medium text-lg">${this.transcript}</p>
                </div>
            `;
        } else {
            transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "開始錄音" 開始語音輸入</p>';
        }
    }
    
    processTranscript() {
        const practiceText = this.getCurrentPracticeText();
        if (!practiceText || !this.transcript) return;
        
        this.comparisonResult = this.compareAndColorize(practiceText, this.transcript);
        this.updateTranscriptDisplay();
        this.showDetailedFeedback(this.comparisonResult.details);
    }
    
    showDetailedFeedback(details) {
        document.getElementById('detailedFeedback')?.remove();
        
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
            
            feedbackHTML += `
                <div class="mb-3 p-3 rounded-lg bg-slate-800/50">
                    <p class="text-sm text-slate-200">${icon} ${detail.message}</p>
                    ${detail.suggestion ? `<p class="text-xs text-yellow-300 mt-2">💡 ${detail.suggestion}</p>` : ''}
                </div>
            `;
        });
        
        feedbackDiv.innerHTML = feedbackHTML;
        
        const practiceUnit = document.querySelector('.space-y-8');
        if (practiceUnit) {
            practiceUnit.appendChild(feedbackDiv);
        }
    }
    
    getCurrentPracticeText() {
        const item = this.getCurrentItem();
        if (!item) return '';
        
        if ('sentences' in item) {
            return item.sentences[this.currentPartIndex] || '';
        }
        return item.example || '';
    }
    
    getCurrentItem() {
        const list = this.getCurrentList();
        return list[this.currentIndex] || null;
    }
    
    getCurrentList() {
        if (this.contentType === 'vocabulary') {
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
                score: 0,
                details: []
            };
        }
        
        let correctCount = 0;
        const resultNodes = [];
        const details = [];
        
        for (let i = 0; i < originalWords.length; i++) {
            if (i < spokenWords.length) {
                const similarity = this.calculateSimilarity(originalWords[i], spokenWords[i]);
                
                if (similarity >= 0.8) {
                    correctCount++;
                    resultNodes.push(`<span class="correct-word">${spokenWords[i]}</span>`);
                    details.push({
                        type: 'correct',
                        message: `✓ "${spokenWords[i]}" 發音正確`
                    });
                } else if (similarity >= 0.5) {
                    correctCount += 0.7;
                    resultNodes.push(`<span class="close-word">${spokenWords[i]}</span>`);
                    details.push({
                        type: 'close',
                        message: `~ "${spokenWords[i]}" 接近正確發音`,
                        suggestion: '請再聽一次標準發音'
                    });
                } else {
                    resultNodes.push(`<span class="incorrect-word">${spokenWords[i]}</span>`);
                    details.push({
                        type: 'incorrect',
                        message: `✗ "${spokenWords[i]}" 需要改進`,
                        suggestion: '建議重複練習'
                    });
                }
            } else {
                details.push({
                    type: 'missing',
                    message: `! 遺漏了 "${originalWords[i]}"`
                });
            }
        }
        
        for (let i = originalWords.length; i < spokenWords.length; i++) {
            resultNodes.push(`<span class="extra-word">${spokenWords[i]}</span>`);
            details.push({
                type: 'extra',
                message: `? 多說了 "${spokenWords[i]}"`
            });
        }
        
        const score = Math.round((correctCount / originalWords.length) * 100);
        
        return { 
            html: resultNodes.join(' '), 
            score,
            details
        };
    }
    
    calculateSimilarity(word1, word2) {
        const clean1 = word1.toLowerCase().replace(/[^\w]/g, '');
        const clean2 = word2.toLowerCase().replace(/[^\w]/g, '');
        
        if (clean1 === clean2) return 1.0;
        
        // 簡單的相似度計算
        const maxLen = Math.max(clean1.length, clean2.length);
        let matches = 0;
        
        for (let i = 0; i < Math.min(clean1.length, clean2.length); i++) {
            if (clean1[i] === clean2[i]) matches++;
        }
        
        return matches / maxLen;
    }
    
    getWords(text) {
        return text
            .toLowerCase()
            .replace(/[.,?!;:]/g, '')
            .split(/\s+/)
            .filter(Boolean);
    }
    
    updateWordColors() {
        // 簡化的顏色更新邏輯
        document.querySelectorAll('[data-word-index]').forEach(span => {
            span.className = 'word-default';
        });
    }
    
    resetWordColors() {
        document.querySelectorAll('[data-word-index]').forEach(span => {
            span.className = 'word-default';
        });
    }
    
    resetTranscriptDisplay() {
        const transcriptArea = document.getElementById('transcriptArea');
        if (transcriptArea) {
            transcriptArea.innerHTML = '<p class="italic text-slate-400 text-center">點擊 "開始錄音" 開始語音輸入</p>';
        }
    }
    
    resetAllStates() {
        if (this.isListening) {
            this.stopListening();
        }
        
        this.transcript = '';
        this.interimTranscript = '';
        this.comparisonResult = null;
        this.currentIndex = 0;
        this.currentPartIndex = 0;
        
        document.getElementById('detailedFeedback')?.remove();
        this.updateRecordButton();
        this.resetWordColors();
        this.resetTranscriptDisplay();
    }
}

// 全域應用狀態
const app = new AppState();

// 螢幕管理
function showScreen(screenId) {
    document.getElementById('detailedFeedback')?.remove();
    
    if (screenId !== 'practiceScreen' && app.isListening) {
        app.stopListening();
    }
    
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

// 播放音頻
function speakText(text, audioFile = null) {
    if (app.isListening) {
        app.stopListening();
    }
    
    if (audioFile) {
        AudioManager.play(audioFile).catch(() => {
            alert('音檔無法播放');
        });
    }
}

// 列表渲染
function renderList() {
    document.getElementById('detailedFeedback')?.remove();
    
    app.transcript = '';
    app.comparisonResult = null;
    app.currentIndex = 0;
    app.currentPartIndex = 0;
    
    const allItemsList = document.getElementById('allItemsList');
    const listTitle = document.getElementById('listTitle');
    
    listTitle.textContent = app.contentType === 'vocabulary' ? '詞彙列表' : '課文列表';
    
    let allItems = app.contentType === 'vocabulary' ? [...vocabulary, ...idioms] : passages;
    
    allItemsList.innerHTML = allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        if ('word' in item) {
            return `
                <button onclick="startPractice(${index}, 'list')" 
                        class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" 
                        style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
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
            return `
                <button onclick="startPractice(${index}, 'list')" 
                        class="list-item p-5 ${!isLast ? 'border-b border-slate-700/20' : ''}" 
                        style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="flex: 1; min-width: 0;">
                        <p class="text-white text-body text-lg truncate">${item.title}</p>
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

// 開始練習
function startPractice(index, from = 'list') {
    document.getElementById('detailedFeedback')?.remove();
    
    app.currentIndex = index;
    app.currentPartIndex = 0;
    app.from = from;
    app.transcript = '';
    app.interimTranscript = '';
    app.comparisonResult = null;
    
    if (app.isListening) {
        app.stopListening();
    }
    
    showScreen('practiceScreen');
    updatePracticeScreen();
}

// 更新練習螢幕
function updatePracticeScreen() {
    AudioManager.stop();
    
    if (app.isListening) {
        app.stopListening();
    }
    
    document.getElementById('detailedFeedback')?.remove();
    
    const item = app.getCurrentItem();
    if (!item) return;
    
    const practiceTitle = document.getElementById('practiceTitle');
    const practiceSubtitle = document.getElementById('practiceSubtitle');
    const partNavigation = document.getElementById('partNavigation');
    
    if ('sentences' in item) {
        const sentence = item.sentences[app.currentPartIndex];
        const words = sentence.split(' ');
        const wordsHtml = words.map((word, index) => 
            `<span class="word-default" data-word-index="${index}">${word}</span>`
        ).join(' ');
        
        practiceTitle.innerHTML = wordsHtml;
        if (item.translation) {
            practiceTitle.innerHTML += `<div class="translation-text">${item.translation}</div>`;
        }
    } else {
        practiceTitle.innerHTML = `
            <span class="word-default" data-word-index="0">${item.example}</span>
            ${item.meaning ? `<div class="translation-text">${item.meaning}</div>` : ''}
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
    
    app.transcript = '';
    app.comparisonResult = null;
    app.resetWordColors();
    app.updateRecordButton();
    app.resetTranscriptDisplay();
}

// 更新導航按鈕
function updateNavigationButtons() {
    const list = app.getCurrentList();
    const item = app.getCurrentItem();
    
    const prevBtn = document.getElementById('prevBtn');
    const nextItemBtn = document.getElementById('nextItemBtn');
    const prevPartBtn = document.getElementById('prevPartBtn');
    const nextPartBtn = document.getElementById('nextPartBtn');
    
    prevBtn.disabled = app.currentIndex === 0;
    nextItemBtn.disabled = app.currentIndex === list.length - 1;
    
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

// 錄音控制
function toggleRecording() {
    if (app.isListening) {
        app.stopListening();
    } else {
        app.startListening();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('頁面載入完成，開始初始化...');
    
    setTimeout(() => {
        checkBrowserCompatibility();
    }, 500);
    
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
        alert('挑戰模式開發中...');
    });
    
    // 內容類型選擇
    document.getElementById('vocabularyType').addEventListener('click', () => {
        app.resetAllStates();
        app.contentType = 'vocabulary';
        showScreen('listView');
        renderList();
    });
    
    document.getElementById('passageType').addEventListener('click', () => {
        app.resetAllStates();
        app.contentType = 'passage';
        showScreen('listView');
        renderList();
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
    
    showScreen('loadingScreen');
});

// 全域函數
window.startPractice = startPractice;
window.toggleRecording = toggleRecording;
window.speakText = speakText;
window.dismissWarning = dismissWarning;
window.dismissFirefoxWarning = dismissFirefoxWarning;
