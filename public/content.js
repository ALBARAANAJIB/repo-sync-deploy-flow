function injectSummarizationPanel() {
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    return;
  }

  // Remove existing panel if it exists
  const existingPanel = document.getElementById('youtube-enhancer-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  // Wait for YouTube's secondary column to load
  const secondaryColumn = document.querySelector('#secondary');
  if (!secondaryColumn) {
    setTimeout(injectSummarizationPanel, 1000);
    return;
  }

  // Create the professional summarization panel
  const panel = document.createElement('div');
  panel.id = 'youtube-enhancer-panel';
  panel.innerHTML = `
    <div style="
      background: #ffffff;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', system-ui, sans-serif;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    ">
      <!-- Professional Header -->
      <div style="
        background: #f9fafb;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <div style="
          width: 20px;
          height: 20px;
          background: #f3f4f6;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #374151;
          font-weight: 600;
          border: 1px solid #d1d5db;
        ">AI</div>
        <h3 style="
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.025em;
        ">Video Summary</h3>
      </div>
      
      <!-- Content -->
      <div style="padding: 20px;">
        <!-- Mode Selector -->
        <div style="margin-bottom: 16px;">
          <select id="detail-level" style="
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 13px;
            background: #ffffff;
            color: #111827;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            appearance: none;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 10 10\"><path d=\"M8 3L5 6 2 3\" stroke=\"%23666\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>');
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 36px;
          ">
            <option value="quick">Quick Summary</option>
            <option value="detailed" selected>Detailed Summary</option>
          </select>
        </div>
        
        <button id="summarize-video-btn" style="
          width: 100%;
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          font-family: inherit;
          letter-spacing: -0.025em;
        " onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#9ca3af'" 
           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#d1d5db'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Generate Summary</span>
        </button>
        
        <div id="summary-loading" style="
          display: none;
          text-align: center;
          padding: 24px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
        ">
          <div style="
            width: 16px;
            height: 16px;
            border: 2px solid #f3f4f6;
            border-top: 2px solid #6b7280;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
          "></div>
          <div style="
            font-size: 12px; 
            color: #6b7280;
            font-weight: 400;
          " id="loading-message">Analyzing video content...</div>
        </div>
        
        <div id="summary-content" style="
          display: none;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
          overflow: hidden;
        "></div>
      </div>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      #detail-level:focus {
        outline: none;
        border-color: #6b7280;
        box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
      }
    </style>
  `;

  // Insert the panel at the top of the secondary column
  secondaryColumn.insertBefore(panel, secondaryColumn.firstChild);

  // Add event listeners
  const summarizeBtn = document.getElementById('summarize-video-btn');
  const loadingDiv = document.getElementById('summary-loading');
  const contentDiv = document.getElementById('summary-content');
  const loadingMessage = document.getElementById('loading-message');
  const detailLevelSelect = document.getElementById('detail-level');

  summarizeBtn?.addEventListener('click', async () => {
    const currentUrl = window.location.href;
    const detailLevel = detailLevelSelect.value;
    
    // Show loading
    summarizeBtn.style.display = 'none';
    loadingDiv.style.display = 'block';
    contentDiv.style.display = 'none';

    try {
      await summarizeVideo(currentUrl, detailLevel, loadingMessage, contentDiv, loadingDiv, summarizeBtn);
    } catch (error) {
      console.error('Error:', error);
      showError(contentDiv, loadingDiv, summarizeBtn, error.message);
    }
  });
}

// Enhanced language detection with multiple strategies
function detectVideoLanguage() {
  const sources = [];
  let detectedLanguage = 'English';
  let confidence = 'low';

  try {
    // Strategy 1: Check HTML lang attribute
    const htmlLang = document.documentElement.lang;
    const languageMap = {
      'en': 'English', 'en-US': 'English', 'en-GB': 'English',
      'de': 'German', 'de-DE': 'German',
      'es': 'Spanish', 'es-ES': 'Spanish', 'es-MX': 'Spanish',
      'fr': 'French', 'fr-FR': 'French', 'fr-CA': 'French',
      'it': 'Italian', 'it-IT': 'Italian',
      'pt': 'Portuguese', 'pt-BR': 'Portuguese', 'pt-PT': 'Portuguese',
      'ja': 'Japanese', 'ja-JP': 'Japanese',
      'ko': 'Korean', 'ko-KR': 'Korean',
      'zh': 'Chinese', 'zh-CN': 'Chinese', 'zh-TW': 'Chinese', 'zh-HK': 'Chinese',
      'ar': 'Arabic', 'ar-SA': 'Arabic',
      'ru': 'Russian', 'ru-RU': 'Russian',
      'hi': 'Hindi', 'hi-IN': 'Hindi',
      'th': 'Thai', 'th-TH': 'Thai',
      'vi': 'Vietnamese', 'vi-VN': 'Vietnamese',
      'tr': 'Turkish', 'tr-TR': 'Turkish',
      'pl': 'Polish', 'pl-PL': 'Polish',
      'nl': 'Dutch', 'nl-NL': 'Dutch'
    };
    
    if (htmlLang && languageMap[htmlLang]) {
      detectedLanguage = languageMap[htmlLang];
      sources.push('html-lang');
      confidence = 'medium';
    }

    // Strategy 2: Analyze video title
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string, h1 yt-formatted-string');
    const title = titleElement?.textContent || '';
    
    // Strategy 3: Check video description
    const descriptionElement = document.querySelector('#description-inline-expander .ytd-text-inline-expander, #description .content');
    const description = descriptionElement?.textContent?.substring(0, 300) || '';
    
    // Strategy 4: Analyze channel information
    const channelElement = document.querySelector('#channel-name a, .ytd-channel-name a');
    const channelName = channelElement?.textContent || '';
    
    // Strategy 5: Check video captions/subtitles if available
    const captionButtons = document.querySelectorAll('.ytp-menuitem[role="menuitemcheckbox"]');
    let captionLanguages = [];
    captionButtons.forEach(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('chinese') || text.includes('中文')) captionLanguages.push('Chinese');
      if (text.includes('japanese') || text.includes('日本語')) captionLanguages.push('Japanese');
      if (text.includes('korean') || text.includes('한국어')) captionLanguages.push('Korean');
      if (text.includes('spanish') || text.includes('español')) captionLanguages.push('Spanish');
      if (text.includes('french') || text.includes('français')) captionLanguages.push('French');
      if (text.includes('german') || text.includes('deutsch')) captionLanguages.push('German');
    });

    if (captionLanguages.length > 0) {
      detectedLanguage = captionLanguages[0];
      sources.push('captions');
      confidence = 'high';
    }

    // Strategy 6: Enhanced text analysis with better Unicode support
    const combinedText = `${title} ${description} ${channelName}`.toLowerCase();
    
    const languagePatterns = {
      'Chinese': {
        patterns: [
          /[\u4e00-\u9fff]/g, // Chinese characters
          /[\u3400-\u4dbf]/g, // CJK Extension A
          /\b(的|和|在|是|有|了|我|你|他|她|它|们|这|那|一个|可以|会|要|不|也|都|很|更|最)\b/g
        ],
        weight: 3
      },
      'Japanese': {
        patterns: [
          /[\u3040-\u309f]/g, // Hiragana
          /[\u30a0-\u30ff]/g, // Katakana
          /[\u4e00-\u9faf]/g, // Kanji (subset)
          /\b(の|に|は|を|が|で|と|から|まで|より|て|だ|です|である|する|した|している)\b/g
        ],
        weight: 3
      },
      'Korean': {
        patterns: [
          /[\uac00-\ud7af]/g, // Hangul syllables
          /[\u1100-\u11ff]/g, // Hangul Jamo
          /\b(의|이|가|를|에|와|과|은|는|로|으로|에서|부터|까지|하고|그리고|하지만|그러나)\b/g
        ],
        weight: 3
      },
      'Arabic': {
        patterns: [
          /[\u0600-\u06ff]/g, // Arabic script
          /\b(في|من|إلى|على|عن|مع|هذا|هذه|ذلك|تلك|التي|الذي|كان|كانت|يكون|تكون)\b/g
        ],
        weight: 3
      },
      'Russian': {
        patterns: [
          /[\u0400-\u04ff]/g, // Cyrillic script
          /\b(и|в|на|с|не|это|что|как|он|она|они|мы|вы|я|был|была|были|быть|иметь)\b/g
        ],
        weight: 3
      },
      'Spanish': {
        patterns: [
          /\b(el|la|los|las|de|del|y|o|en|con|por|para|como|que|se|le|lo|un|una|es|son|pero|si|no|muy|más|todo|todos|esta|este|están|fue|ser|estar|ter|fazer|ir|ver|dar|saber|querer|poder|dizer|cada|outro|mismo|tanto|menos|algo)\b/g,
          /[ñáéíóú]/g
        ],
        weight: 2
      },
      'French': {
        patterns: [
          /\b(le|la|les|de|du|des|et|ou|en|avec|par|pour|comme|que|se|lui|ce|un|une|est|sont|mais|si|non|très|plus|tout|tous|cette|ces|était|être|avoir|faire|aller|voir|donner|savoir|vouloir|pouvoir|dire|chaque|autre|même|tant|moins|quelque)\b/g,
          /[àâäéèêëïîôùûüÿç]/g
        ],
        weight: 2
      },
      'German': {
        patterns: [
          /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|ich|du|er|sie|es|wir|ihr|sie|mich|dich|sich|uns|euch|mir|dir|ihm|ihr|ihnen|und|oder|aber|denn|sondern|wenn|dass|weil|obwohl|damit|falls|bevor|nachdem|während|seit|bis|statt|außer|innerhalb|außerhalb|ist|sind|war|waren|bin|bist|haben|hat|hatte|hatten|werden|wird|wurde|wurden|können|kann|konnte|konnten|sollen|soll|sollte|sollten|müssen|muss|musste|mussten|dürfen|darf|durfte|durften|mögen|mag|mochte|mochten|wollen|will|wollte|wollten|machen|macht|machte|machten|gehen|geht|ging|gingen|kommen|kommt|kam|kamen|sehen|sieht|sah|sahen|sagen|sagt|sagte|sagten|denken|denkt|dachte|dachten|glauben|glaubt|glaubte|glaubten|wissen|weiß|wusste|wussten|verstehen|versteht|verstand|verstanden|sprechen|spricht|sprach|sprachen|hören|hört|hörte|hörten|lesen|liest|las|lasen|schreiben|schreibt|schrieb|schrieben|arbeiten|arbeitet|arbeitete|arbeiteten|leben|lebt|lebte|lebten|spielen|spielt|spielte|spielten|lernen|lernt|lernte|lernten|fahren|fährt|fuhr|fuhren|fliegen|fliegt|flog|flogen|kaufen|kauft|kaufte|kauften|verkaufen|verkauft|verkaufte|verkauften|essen|isst|aß|aßen|trinken|trinkt|trank|tranken|schlafen|schläft|schlief|schliefen|aufstehen|steht|auf|stand|auf|standen|auf|wie|was|wo|wann|warum|wer|welche|welcher|welches|diese|dieser|dieses|jede|jeder|jedes|alle|alles|noch|schon|immer|nie|heute|gestern|morgen|hier|dort|jetzt|dann|also|sehr|mehr|weniger|gut|besser|schlecht|schlechter|groß|größer|klein|kleiner|deutsch|deutschland|video|kanal|abonnieren|kommentar)\b/g,
          /[äöüßÄÖÜ]/g,
          /\b\w+ung\b|\b\w+keit\b|\b\w+heit\b|\b\w+schaft\b/g
        ],
        weight: 3
      },
      'English': {
        patterns: [
          /\b(the|and|or|in|on|at|to|for|of|with|by|from|as|that|this|these|those|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|may|might|must|a|an|but|if|not|very|more|all|some|any|each|other|same|so|much|less|something)\b/g
        ],
        weight: 1
      }
    };
    
    let maxScore = 0;
    let bestLanguage = 'English';
    
    for (const [lang, config] of Object.entries(languagePatterns)) {
      let score = 0;
      config.patterns.forEach(pattern => {
        const matches = combinedText.match(pattern);
        if (matches) {
          score += matches.length * config.weight;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestLanguage = lang;
      }
    }
    
    if (maxScore > 2) {
      detectedLanguage = bestLanguage;
      sources.push('text-analysis');
      confidence = maxScore > 8 ? 'high' : 'medium';
    }
    
    console.log('Enhanced language detection:', { 
      detectedLanguage, 
      confidence, 
      sources, 
      score: maxScore,
      captionLanguages,
      htmlLang 
    });
    
  } catch (error) {
    console.error('Language detection error:', error);
  }
  
  return { detectedLanguage, confidence, sources };
}

// Enhanced video summarization function
async function summarizeVideo(videoUrl, detailLevel, loadingMessage, contentDiv, loadingDiv, summarizeBtn) {
  const loadingMessages = [
    'Analyzing video content...',
    'Processing with AI...',
    'Generating summary...',
    'Almost ready...'
  ];
  
  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    if (loadingMessage) {
      loadingMessage.textContent = loadingMessages[messageIndex % loadingMessages.length];
      messageIndex++;
    }
  }, 2000);

  try {
    console.log('Starting video summarization for:', videoUrl);
    
    // Import the Gemini utility
    const { summarizeYouTubeVideo } = await import(chrome.runtime.getURL('src/utils/geminiUtils.js'));
    
    console.log('Calling Gemini API...');
    const summary = await summarizeYouTubeVideo(videoUrl, detailLevel);
    
    clearInterval(messageInterval);
    
    if (summary && summary.length > 10) {
      console.log('Summary generated successfully');
      
      // Display the summary
      contentDiv.innerHTML = `
        <div style="padding: 16px; line-height: 1.6; color: #374151;">
          <div style="white-space: pre-wrap; font-size: 13px;">${summary}</div>
        </div>
      `;
      
      loadingDiv.style.display = 'none';
      contentDiv.style.display = 'block';
    } else {
      throw new Error('Summary generation failed - no content received');
    }
    
  } catch (error) {
    clearInterval(messageInterval);
    console.error('Summarization error:', error);
    
    const errorMessage = error.message || 'Failed to generate summary';
    
    contentDiv.innerHTML = `
      <div style="padding: 16px; text-align: center;">
        <div style="color: #dc2626; font-size: 13px; margin-bottom: 12px;">
          ⚠️ ${errorMessage}
        </div>
        <button onclick="location.reload()" style="
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 12px;
          cursor: pointer;
        ">Try Again</button>
      </div>
    `;
    
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    summarizeBtn.style.display = 'block';
  }
}

// Initialize based on page type
function initializeExtension() {
  if (window.location.href.includes('youtube.com/watch')) {
    injectSummarizationPanel();
  } else if (window.location.href.includes('youtube.com/playlist?list=LL')) {
    injectLikedVideosButtons();
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeExtension, 2000);
  });
} else {
  setTimeout(initializeExtension, 2000);
}

// Handle navigation changes
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(initializeExtension, 2000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showToast') {
      // Handle any toast messages if needed
    }
    return true;
  });
}
