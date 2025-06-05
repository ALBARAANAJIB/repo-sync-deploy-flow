
// Enhanced AI video summarization with reliable language detection
const API_KEY = 'AIzaSyDxQpk6jmBsM5lsGdzRJKokQkwSVTk5sRg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Enhanced language detection
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

    // Strategy 2: Analyze video title and description
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string, h1 yt-formatted-string');
    const title = titleElement?.textContent || '';
    
    const descriptionElement = document.querySelector('#description-inline-expander .ytd-text-inline-expander, #description .content');
    const description = descriptionElement?.textContent?.substring(0, 300) || '';
    
    const channelElement = document.querySelector('#channel-name a, .ytd-channel-name a');
    const channelName = channelElement?.textContent || '';
    
    const combinedText = `${title} ${description} ${channelName}`.toLowerCase();
    
    // Enhanced language patterns
    const languagePatterns = {
      'German': {
        patterns: [
          /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|und|oder|aber|mit|von|zu|in|auf|für|ist|sind|war|waren|haben|hat|werden|wird|können|kann|sollen|soll|müssen|muss|wollen|will|machen|macht|gehen|geht|kommen|kommt|sehen|sieht|sagen|sagt|wie|was|wo|wann|warum|wer|welche|dieser|diese|dieses|alle|sehr|mehr|noch|auch|nur|schon|immer|nie|heute|morgen|hier|dort|jetzt|dann|wenn|dass|weil|obwohl|damit|bevor|nachdem|während|seit|bis|gegen|ohne|durch|über|unter|vor|hinter|neben|zwischen|deutsch|deutschland|video|videos|kanal|abonnieren|kommentar|kommentare)\b/g,
          /[äöüßÄÖÜ]/g,
          /\b\w+ung\b|\b\w+keit\b|\b\w+heit\b|\b\w+schaft\b/g
        ],
        weight: 4
      },
      'Arabic': {
        patterns: [
          /[\u0600-\u06ff]/g,
          /\b(في|من|إلى|على|عن|مع|هذا|هذه|ذلك|تلك|التي|الذي|كان|كانت|يكون|تكون|العربية|فيديو|قناة)\b/g
        ],
        weight: 4
      },
      'Spanish': {
        patterns: [
          /\b(el|la|los|las|de|del|y|o|en|con|por|para|como|que|se|le|lo|un|una|es|son|pero|si|no|muy|más|todo|todos|esta|este|están|fue|ser|estar|español|vídeo|canal)\b/g,
          /[ñáéíóú]/g
        ],
        weight: 3
      },
      'French': {
        patterns: [
          /\b(le|la|les|de|du|des|et|ou|en|avec|par|pour|comme|que|se|lui|ce|un|une|est|sont|mais|si|non|très|plus|tout|tous|cette|ces|était|être|avoir|français|vidéo|chaîne)\b/g,
          /[àâäéèêëïîôùûüÿç]/g
        ],
        weight: 3
      },
      'English': {
        patterns: [
          /\b(the|and|or|in|on|at|to|for|of|with|by|from|as|that|this|these|those|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|may|might|must|a|an|but|if|not|very|more|all|some|any|each|other|same|so|much|less|video|channel|subscribe)\b/g
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
      
      if (score > maxScore && score > 2) {
        maxScore = score;
        bestLanguage = lang;
        confidence = score > 8 ? 'high' : 'medium';
        sources.push('text-analysis');
      }
    }
    
    detectedLanguage = bestLanguage;
    
    console.log('Language detection result:', { 
      detectedLanguage, 
      confidence, 
      sources, 
      score: maxScore 
    });
    
  } catch (error) {
    console.error('Language detection error:', error);
  }
  
  return { detectedLanguage, confidence, sources };
}

// Create language-specific prompts
function createLanguagePrompt(detailLevel) {
  const languageResult = detectVideoLanguage();
  const targetLanguage = languageResult.detectedLanguage;
  const wordCount = detailLevel === 'quick' ? '200-300' : '500-700';
  
  const languagePrompts = {
    'German': `KRITISCHE SPRACHANWEISUNG: Sie MÜSSEN Ihre GESAMTE Antwort auf Deutsch schreiben.

Erkannte Sprache: Deutsch
Vertrauensniveau: ${languageResult.confidence}

STRENGE REGELN:
- Schreiben Sie ALLES auf Deutsch
- KEINE englischen Wörter oder Phrasen
- KEINE Einleitungen wie "Here you go" oder ähnliches
- Beginnen Sie direkt mit der deutschen Zusammenfassung

AUFGABE: Erstellen Sie eine ${detailLevel === 'quick' ? 'kurze Zusammenfassung (200-300 Wörter)' : 'detaillierte Zusammenfassung (500-700 Wörter)'} auf Deutsch.

STRUKTUR (alles auf Deutsch):
${detailLevel === 'quick' ? `
- Kurzer Überblick auf Deutsch
- Hauptpunkte (3-4 wichtige Punkte) auf Deutsch
- Klarer Schluss auf Deutsch
` : `
- Einführung und Kontext auf Deutsch
- Detaillierte Inhaltsanalyse auf Deutsch
- Wichtige Erkenntnisse und Schlussfolgerungen auf Deutsch
- Umfassende Schlussfolgerung auf Deutsch
`}

WICHTIG: Beginnen Sie SOFORT mit der deutschen Zusammenfassung ohne englische Einleitung.`,

    'Arabic': `تعليمات مهمة للغة: يجب أن تكتب إجابتك بالكامل باللغة العربية فقط.

اللغة المكتشفة: العربية
مستوى الثقة: ${languageResult.confidence}

قواعد صارمة:
- استخدم العربية فقط في كامل الإجابة
- ممنوع استخدام أي كلمات إنجليزية
- لا تبدأ بعبارات إنجليزية مثل "Here you go"
- ابدأ مباشرة بالملخص العربي

المهمة: اكتب ملخصاً ${detailLevel === 'quick' ? 'موجزاً (200-300 كلمة)' : 'مفصلاً (500-700 كلمة)'} بالعربية.

الهيكل (كله بالعربية):
${detailLevel === 'quick' ? `
- نظرة عامة موجزة بالعربية
- النقاط الرئيسية (3-4 عناصر) بالعربية  
- خاتمة واضحة بالعربية
` : `
- مقدمة والسياق بالعربية
- تحليل مفصل للمحتوى بالعربية
- الأفكار والاستنتاجات الرئيسية بالعربية
- خاتمة شاملة بالعربية
`}

مهم: ابدأ فوراً بالملخص العربي بدون مقدمة إنجليزية.`
  };

  return languagePrompts[targetLanguage] || `CRITICAL LANGUAGE INSTRUCTION: You MUST write your ENTIRE response in ${targetLanguage}.

STRICT RULES:
- Write EVERYTHING in ${targetLanguage}
- NO English words or phrases
- NO introductions like "Here you go" or similar
- Start directly with the ${targetLanguage} summary

TASK: Create a ${detailLevel} video summary (${wordCount} words) in ${targetLanguage}.

IMPORTANT: Start IMMEDIATELY with the ${targetLanguage} summary without English introduction.`;
}

// Main summarization function
export async function summarizeYouTubeVideo(videoUrl, detailLevel = 'detailed') {
  try {
    console.log(`Starting summarization for ${videoUrl} in ${detailLevel} mode`);
    
    const generationConfig = {
      temperature: 0.01,
      maxOutputTokens: detailLevel === 'quick' ? 600 : 1200,
      topP: 0.05,
      topK: 1
    };

    const requestBody = {
      contents: [
        {
          parts: [
            { text: createLanguagePrompt(detailLevel) },
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: "video/youtube"
              }
            }
          ]
        }
      ],
      generationConfig
    };

    console.log('Making API request...');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response received');
    
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const summary = data.candidates[0].content.parts[0].text.trim();
      
      if (summary && summary.length > 50) {
        console.log('Summary generated successfully, length:', summary.length);
        return summary;
      }
    }
    
    throw new Error('No valid summary content received');
    
  } catch (error) {
    console.error('Error in summarizeYouTubeVideo:', error);
    throw error;
  }
}
