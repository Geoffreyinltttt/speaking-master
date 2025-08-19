

// 音標處理引擎
class PhoneticEngine {
    constructor() {
        this.dict = window.PHONETIC_DICT || {};
        this.features = window.PHONEME_FEATURES || {};
        this.confusionPairs = window.CHINESE_CONFUSION_PAIRS || [];
    }
    
    // 獲取單字音標
    getPhonemes(word) {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        return this.dict[cleanWord] ? this.dict[cleanWord].split(' ') : null;
    }
    
    // 計算音標相似度
    calculatePhoneticSimilarity(phonemes1, phonemes2) {
        if (!phonemes1 || !phonemes2) return 0;
        
        const maxLength = Math.max(phonemes1.length, phonemes2.length);
        if (maxLength === 0) return 1;
        
        let matches = 0;
        const minLength = Math.min(phonemes1.length, phonemes2.length);
        
        for (let i = 0; i < minLength; i++) {
            const phone1 = this.cleanPhoneme(phonemes1[i]);
            const phone2 = this.cleanPhoneme(phonemes2[i]);
            
            if (phone1 === phone2) {
                matches += 1;
            } else if (this.arePhonemesSimilar(phone1, phone2)) {
                matches += 0.7; // 相似音給部分分數
            } else if (this.isChineseConfusion(phone1, phone2)) {
                matches += 0.5; // 華語學習者常見混淆給更多容忍度
            }
        }
        
        return matches / maxLength;
    }
    
    // 清理音標（移除重音標記）
    cleanPhoneme(phoneme) {
        return phoneme.replace(/[0-9]/g, '');
    }
    
    // 判斷音標是否相似
    arePhonemesSimilar(phone1, phone2) {
        const features1 = this.features[phone1];
        const features2 = this.features[phone2];
        
        if (!features1 || !features2) return false;
        
        // 同類音（都是母音或都是子音）且有相似特征
        if (features1.type === features2.type) {
            if (features1.type === 'vowel') {
                return this.vowelSimilarity(features1, features2) > 0.6;
            } else {
                return this.consonantSimilarity(features1, features2) > 0.6;
            }
        }
        
        return false;
    }
    
    // 檢查是否為華語學習者常見混淆
    isChineseConfusion(phone1, phone2) {
        return this.confusionPairs.some(pair => 
            (pair[0] === phone1 && pair[1] === phone2) || 
            (pair[0] === phone2 && pair[1] === phone1)
        );
    }
    
    // 母音相似度計算
    vowelSimilarity(v1, v2) {
        let similarity = 0;
        if (v1.front === v2.front) similarity += 0.3;
        if (v1.back === v2.back) similarity += 0.3;
        if (v1.high === v2.high) similarity += 0.2;
        if (v1.mid === v2.mid) similarity += 0.2;
        return similarity;
    }
    
    // 子音相似度計算
    consonantSimilarity(c1, c2) {
        let similarity = 0;
        if (c1.place === c2.place) similarity += 0.4;
        if (c1.manner === c2.manner) similarity += 0.4;
        if (c1.voiced === c2.voiced) similarity += 0.2;
        return similarity;
    }
    
    // 生成發音建議
    generatePhoneticFeedback(targetWord, spokenWord) {
        const targetPhonemes = this.getPhonemes(targetWord);
        const spokenPhonemes = this.getPhonemes(spokenWord);
        
        if (!targetPhonemes) {
            return { message: `無法找到「${targetWord}」的音標資料` };
        }
        
        if (!spokenPhonemes) {
            return { message: `無法識別「${spokenWord}」的發音` };
        }
        
        const feedback = [];
        const similarity = this.calculatePhoneticSimilarity(targetPhonemes, spokenPhonemes);
        
        // 逐音標比較
        for (let i = 0; i < Math.max(targetPhonemes.length, spokenPhonemes.length); i++) {
            const target = targetPhonemes[i] ? this.cleanPhoneme(targetPhonemes[i]) : null;
            const spoken = spokenPhonemes[i] ? this.cleanPhoneme(spokenPhonemes[i]) : null;
            
            if (target && !spoken) {
                feedback.push(`音節 ${i + 1}: 缺少 /${target}/ 音`);
            } else if (!target && spoken) {
                feedback.push(`音節 ${i + 1}: 多了 /${spoken}/ 音`);
            } else if (target && spoken && target !== spoken) {
                if (this.isChineseConfusion(target, spoken)) {
                    feedback.push(`音節 ${i + 1}: /${spoken}/ → /${target}/ (華語學習者常見混淆)`);
                } else {
                    feedback.push(`音節 ${i + 1}: /${spoken}/ → /${target}/`);
                }
            }
        }
        
        return {
            similarity: similarity,
            targetPhonemes: targetPhonemes.join(' '),
            spokenPhonemes: spokenPhonemes.join(' '),
            feedback: feedback,
            message: similarity > 0.8 ? '發音很棒！' : similarity > 0.6 ? '發音不錯，再練習一下' : '需要多加練習'
        };
    }
}

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
        
		// 初始化音標引擎
this.phoneticEngine = new PhoneticEngine();

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
    
    // 即時更新文字顏色
    this.updateWordColors();
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
    this.resetWordColors();
    
    try {
        this.recognition.start();
        this.isListening = true;
        this.updateRecordButton();
    } catch (e) {
        console.error('語音辨識無法啟動:', e);
    }
}

stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    this.recognition.stop();
    this.isListening = false;
    this.updateRecordButton();
    
    // 最終更新顏色
    setTimeout(() => {
        this.updateWordColors();
    }, 100);
}
    
    updateRecordButton() {
    const recordBtn = document.getElementById('recordBtn');
    if (!recordBtn) return;
    
    if (this.isListening) {
    recordBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
        </svg>
        <span>停止</span>
    `;
    recordBtn.className = 'btn-record-stop';
} else {
    recordBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7 4a3 3 0 616 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
        </svg>
        <span>錄音</span>
    `;
    recordBtn.className = 'btn-record-start';
}
}
    
updateTranscriptDisplay() {
    const transcriptArea = document.getElementById('transcriptArea');
    if (!transcriptArea) {
        // 如果沒有找到轉錄區域，可能是在列表頁面，直接返回
        return;
    }
    
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
		
// 顯示詳細回饋
if (this.comparisonResult.details && this.comparisonResult.details.length > 0) {
    this.showDetailedFeedback(this.comparisonResult.details);
}
        
        // 如果是挑戰模式，顯示下一題按鈕
        if (this.currentScreen === 'challengeScreen') {
            document.getElementById('nextBtn').classList.remove('hidden');
        }
    }
    

showDetailedFeedback(details) {
    // 移除舊的回饋區域
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
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
            'missing': '➖',
            'phonetic': '🔊'
        }[detail.type] || '•';
        
        feedbackHTML += `<div class="mb-3 p-3 rounded-lg bg-slate-800/50">`;
        feedbackHTML += `<p class="text-sm text-slate-200 mb-2">${icon} ${detail.message}</p>`;
        
        // 顯示音標資訊（如果有的話）
        if (detail.targetPhonemes && detail.spokenPhonemes) {
            feedbackHTML += `
                <div class="text-xs text-slate-300 ml-4 space-y-1">
                    <p>🎯 標準音標: /${detail.targetPhonemes}/</p>
                    <p>🗣️ 您的發音: /${detail.spokenPhonemes}/</p>
                </div>
            `;
        }
        
        // 顯示音標層級的建議
        if (detail.phoneticFeedback && detail.phoneticFeedback.length > 0) {
            feedbackHTML += `<div class="text-xs text-yellow-300 mt-2 ml-4">`;
            feedbackHTML += `<p class="font-medium">🎵 音標分析：</p>`;
            detail.phoneticFeedback.forEach(feedback => {
                feedbackHTML += `<p class="ml-2">• ${feedback}</p>`;
            });
            feedbackHTML += `</div>`;
        }
        
        // 一般建議
        if (detail.suggestion) {
            feedbackHTML += `<p class="text-xs text-yellow-300 mt-2">💡 ${detail.suggestion}</p>`;
        }
        
        feedbackHTML += `</div>`;
    });
    
    feedbackDiv.innerHTML = feedbackHTML;
    
    // 將回饋插入到練習區域下方
    const practiceUnit = document.querySelector('.space-y-8') || document.querySelector('.challenge-practice-unit');
    if (practiceUnit) {
        practiceUnit.appendChild(feedbackDiv);
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
    
    // 如果是單字或片語（只有一個詞），使用音標分析
    if (originalWords.length === 1 && spokenWords.length === 1) {
        return this.compareWordsWithPhonetics(originalWords[0], spokenWords[0]);
    }
    
    // 多詞句子：結合文字比對和音標分析
    return this.compareSentenceWithPhonetics(originalWords, spokenWords);
}

// 新增：單字音標比對方法
compareWordsWithPhonetics(originalWord, spokenWord) {
    const phoneticAnalysis = this.phoneticEngine.generatePhoneticFeedback(originalWord, spokenWord);
    const textSimilarity = this.calculateWordSimilarity(originalWord, spokenWord);
    
    // 結合音標相似度和文字相似度
    const phoneticSimilarity = phoneticAnalysis.similarity || 0;
    const finalScore = Math.round((phoneticSimilarity * 0.7 + textSimilarity * 0.3) * 100);
    const isCorrect = finalScore >= 70;
    
    // 生成顏色標記的 HTML
    const className = isCorrect ? 'correct-word' : finalScore >= 50 ? 'close-word' : 'incorrect-word';
    const html = `<span class="${className}" title="音標分析: ${finalScore}%">${spokenWord}</span>`;
    
    // 生成詳細回饋
    const details = [{
        type: isCorrect ? 'correct' : 'phonetic',
        original: originalWord,
        spoken: spokenWord,
        similarity: phoneticSimilarity,
        textSimilarity: textSimilarity,
        message: phoneticAnalysis.message,
        phoneticFeedback: phoneticAnalysis.feedback,
        targetPhonemes: phoneticAnalysis.targetPhonemes,
        spokenPhonemes: phoneticAnalysis.spokenPhonemes
    }];
    
    return {
        html: html,
        isCorrect: isCorrect,
        score: finalScore,
        details: details,
        phoneticAnalysis: phoneticAnalysis
    };
}

// 新增：句子音標比對方法
compareSentenceWithPhonetics(originalWords, spokenWords) {
    let correctWordCount = 0;
    const resultNodes = [];
    const details = [];
    
    // 使用現有的對齊算法
    const alignment = this.alignWords(originalWords, spokenWords);
    
    for (let i = 0; i < alignment.length; i++) {
        const { original: originalWord, spoken: spokenWord, type } = alignment[i];
        
        if (type === 'match') {
            // 對每個匹配的詞進行音標分析
            const phoneticAnalysis = this.phoneticEngine.generatePhoneticFeedback(originalWord, spokenWord);
            const textSimilarity = this.calculateWordSimilarity(originalWord, spokenWord);
            const phoneticSimilarity = phoneticAnalysis.similarity || 0;
            
            // 結合兩種相似度
            const combinedSimilarity = (phoneticSimilarity * 0.6 + textSimilarity * 0.4);
            
            if (combinedSimilarity >= 0.7) {
                correctWordCount++;
                resultNodes.push(`<span class="correct-word" title="✓ 發音正確 (${Math.round(combinedSimilarity * 100)}%)">${spokenWord} </span>`);
                details.push({
                    type: 'correct',
                    original: originalWord,
                    spoken: spokenWord,
                    similarity: combinedSimilarity,
                    message: `✓ "${spokenWord}" 發音正確`,
                    phoneticSimilarity: phoneticSimilarity,
                    textSimilarity: textSimilarity
                });
            } else if (combinedSimilarity >= 0.5) {
                correctWordCount += 0.8;
                resultNodes.push(`<span class="close-word" title="~ 接近正確 (${Math.round(combinedSimilarity * 100)}%)">${spokenWord} </span>`);
                details.push({
                    type: 'close',
                    original: originalWord,
                    spoken: spokenWord,
                    similarity: combinedSimilarity,
                    message: `~ "${spokenWord}" 很接近了！標準發音：「${originalWord}」`,
                    suggestion: this.getEnhancedPhoneticSuggestion(originalWord, spokenWord, phoneticAnalysis),
                    phoneticFeedback: phoneticAnalysis.feedback
                });
            } else {
                resultNodes.push(`<span class="incorrect-word" title="✗ 需要改進 (${Math.round(combinedSimilarity * 100)}%)">${spokenWord} </span>`);
                details.push({
                    type: 'incorrect',
                    original: originalWord,
                    spoken: spokenWord,
                    similarity: combinedSimilarity,
                    message: `✗ "${spokenWord}" 與「${originalWord}」差異較大`,
                    suggestion: this.getEnhancedPhoneticSuggestion(originalWord, spokenWord, phoneticAnalysis),
                    phoneticFeedback: phoneticAnalysis.feedback
                });
            }
        } else if (type === 'extra') {
            resultNodes.push(`<span class="extra-word" title="多餘的單字">${spokenWord} </span>`);
            details.push({
                type: 'extra',
                spoken: spokenWord,
                message: `? 多說了「${spokenWord}」`
            });
        } else if (type === 'missing') {
            resultNodes.push(`<span class="missing-word" title="遺漏的單字">(${originalWord}) </span>`);
            details.push({
                type: 'missing',
                original: originalWord,
                message: `! 遺漏了「${originalWord}」`
            });
        }
    }
    
    const accuracy = originalWords.length > 0 ? (correctWordCount / originalWords.length) : 0;
    const isCorrect = accuracy >= 0.7;
    const score = Math.round(accuracy * 100);
    
    return { 
        html: resultNodes.join(''), 
        isCorrect, 
        score,
        details
    };
}

// 新增：增強版發音建議
getEnhancedPhoneticSuggestion(targetWord, spokenWord, phoneticAnalysis) {
    if (phoneticAnalysis && phoneticAnalysis.feedback && phoneticAnalysis.feedback.length > 0) {
        return phoneticAnalysis.feedback[0]; // 取第一個最重要的建議
    }
    
    // 回退到原有的建議系統
    return this.getPhoneticSuggestion(targetWord, spokenWord);
}

// 提供發音建議
getPhoneticSuggestion(target, spoken) {
    const suggestions = [];
    
    // 常見發音問題檢測
    const commonIssues = [
        {
            pattern: /th/i,
            issue: 'th音',
            suggestion: 'th音要將舌頭輕觸上齒，送氣發音'
        },
        {
            pattern: /r/i,
            issue: 'r音',
            suggestion: 'r音要捲舌，舌尖不要碰到口腔頂部'
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
                const isCorrect = originalWord === spokenWord;
                wordSpan.className = isCorrect ? 'word-correct' : 'word-incorrect';
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
        if (originalWords[i] !== spokenWords[i]) return false;
    }
    
    return true;
}

// 重置單字顏色
resetWordColors() {
    document.querySelectorAll('[data-word-index]').forEach(span => {
        span.className = 'word-default';
    });
}



// 重置單字顏色
resetWordColors() {
    document.querySelectorAll('[data-word-index]').forEach(span => {
        span.className = 'word-default';
    });
}

// 在這裡加入新的方法
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
    
    // 清理 DOM 中的反饋
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
    // 重置錄音按鈕
    this.updateRecordButton();
    
    // 重置單字顏色
    this.resetWordColors();
}

} // ← AppState 類別的結束括號

// 全域應用狀態
const app = new AppState();

// 螢幕管理
function showScreen(screenId) {
    // 清理所有反饋內容（不管切換到哪個螢幕）
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
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
    // 清理之前的反饋內容
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
    // 重置應用狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.currentIndex = 0;
    app.currentPartIndex = 0;
    
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
    // 清理之前的反饋內容
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
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
    // 清理之前的反饋內容
    const oldFeedback = document.getElementById('detailedFeedback');
    if (oldFeedback) oldFeedback.remove();
    
    const item = app.getCurrentItem();
    if (!item) return;
    
    const practiceTitle = document.getElementById('practiceTitle');
    const practiceSubtitle = document.getElementById('practiceSubtitle');
    const practiceText = document.getElementById('practiceText');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const partNavigation = document.getElementById('partNavigation');
    
// 更新標題 - 顯示練習內容
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
    // 單字或片語
    practiceTitle.innerHTML = `<span class="word-default" data-word-index="0">${item.example}</span>`;
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
app.resetWordColors();
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
function startChallenge() {
    app.mode = 'challenge';
    app.contentType = 'mixed'; // 混合模式
    
    // 收集所有內容並標記類型
    let allItems = [];
    
    // 加入單字
    vocabulary.forEach(item => {
        allItems.push({
            ...item,
            type: 'vocabulary',
            practiceText: item.example
        });
    });
    
    // 加入片語
    idioms.forEach(item => {
        allItems.push({
            ...item,
            type: 'idioms',
            practiceText: item.example
        });
    });
    
    // 加入句子
    passages.forEach(passage => {
        passage.sentences.forEach(sentence => {
            allItems.push({
                id: passage.id + '_sentence',
                type: 'passage',
                practiceText: sentence,
                translation: passage.translation,
                audio: passage.audio
            });
        });
    });
    
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
    const existingUnit = challengeScreen.querySelector('.challenge-practice-unit');
    if (existingUnit) {
        existingUnit.remove();
    }
    
    const currentQuestion = app.challengeQuestions[app.currentQuestionIndex];
    const practiceText = currentQuestion.practiceText;
    const audioFile = currentQuestion.audio || '';
    
    // 獲取題目類型的中文名稱
    const typeNames = {
        'vocabulary': '單字',
        'idioms': '片語',
        'passage': '句子'
    };
    const typeName = typeNames[currentQuestion.type] || '題目';
    
    // 創建挑戰練習單元
    const practiceUnit = document.createElement('div');
    practiceUnit.className = 'challenge-practice-unit space-y-8';
    practiceUnit.innerHTML = `
        <!-- 練習文字卡片 -->
        <div class="glass-secondary rounded-3xl p-8 border border-white/10">
            <div class="text-center space-y-6">
                <div class="text-sm text-sky-300 font-medium">${typeName}</div>
                <div id="challengeTitle" class="text-3xl sm:text-4xl font-bold mb-4 leading-relaxed">${practiceText}</div>
                ${currentQuestion.translation ? `<div class="translation-text">${currentQuestion.translation}</div>` : ''}
                <div class="flex justify-center items-center gap-4">
                    <button onclick="speakText('${practiceText.replace(/'/g, "\\'")}', '${audioFile}')" class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 hover:text-sky-300 transition-all duration-300 hover:scale-110" title="聆聽發音">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                    <button id="recordBtn" onclick="toggleRecording()" class="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 616 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clip-rule="evenodd" />
                        </svg>
                        開始錄音
                    </button>
                </div>
            </div>
        </div>
        
        <button id="nextBtn" onclick="nextChallenge()" class="hidden w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            下一題
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </button>
    `;
    
    challengeScreen.appendChild(practiceUnit);
    
    // 設置文字的 data-word-index 屬性，讓顏色變化系統能運作
    const challengeTitle = document.getElementById('challengeTitle');
    const words = practiceText.split(' ');
    if (currentQuestion.type === 'vocabulary' || currentQuestion.type === 'idioms') {
        // 單字和片語：一個整體
        challengeTitle.innerHTML = `<span class="word-default" data-word-index="0">${practiceText}</span>`;
    } else {
        // 句子：逐字分解
        const wordsHtml = words.map((word, index) => 
            `<span class="word-default" data-word-index="${index}">${word}</span>`
        ).join(' ');
        challengeTitle.innerHTML = wordsHtml + (currentQuestion.translation ? `<div class="translation-text">${currentQuestion.translation}</div>` : '');
    }
    
    // 重置狀態
    app.transcript = '';
    app.comparisonResult = null;
    app.resetWordColors();
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
    startChallenge(); // 直接開始挑戰，不需要選擇內容類型
});
    
// 內容類型選擇
document.getElementById('vocabularyType').addEventListener('click', () => {
    app.resetAllStates(); // ← 加入這一行
    app.contentType = 'vocabulary';
    if (app.mode === 'practice') {
        showScreen('listView');
        renderList();
    } else {
        startChallenge(); // 挑戰模式不分類型
    }
});

document.getElementById('idiomsType').addEventListener('click', () => {
    app.resetAllStates(); // ← 加入這一行
    app.contentType = 'idioms';
    if (app.mode === 'practice') {
        showScreen('listView');
        renderList();
    } else {
        startChallenge(); // 挑戰模式不分類型
    }
});

document.getElementById('passageType').addEventListener('click', () => {
    app.resetAllStates(); // ← 加入這一行
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
