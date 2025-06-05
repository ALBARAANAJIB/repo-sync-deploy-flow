
// Ultra-reliable language detection with enhanced accuracy
export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

// Enhanced language detection with better patterns and priority
export function detectLanguageFromVideoContent(): LanguageDetectionResult {
  console.log('Starting enhanced language detection...');
  
  let detectedLanguage = 'English';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  const sources: string[] = [];

  try {
    // Get all text content from the page
    const title = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string, h1[class*="title"]')?.textContent || '';
    const description = document.querySelector('#description-inline-expander .ytd-text-inline-expander, #description .content, [id*="description"]')?.textContent?.substring(0, 1000) || '';
    const channel = document.querySelector('#channel-name a, .ytd-channel-name a, [class*="channel-name"]')?.textContent || '';
    const comments = Array.from(document.querySelectorAll('#content-text, [class*="comment"]')).map(el => el.textContent).join(' ').substring(0, 500);
    
    // Check URL parameters for language hints
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguage = urlParams.get('hl') || document.documentElement.lang || '';
    
    // PRIORITY 1: Check for non-Latin scripts first (most reliable)
    const scriptResult = detectFromCharacterScript(title, description, channel);
    if (scriptResult.language) {
      console.log('Language detected from script:', scriptResult.language);
      return {
        detectedLanguage: scriptResult.language,
        confidence: 'high',
        sources: ['character-script']
      };
    }

    // PRIORITY 2: Enhanced German detection with more patterns
    const germanResult = detectGermanContentEnhanced(title, description, channel, comments, urlLanguage);
    if (germanResult.isGerman) {
      console.log('German detected with enhanced patterns');
      return {
        detectedLanguage: 'German',
        confidence: 'high',
        sources: ['enhanced-german-detection']
      };
    }

    // PRIORITY 3: Check video captions/subtitles
    const captionResult = detectFromCaptions();
    if (captionResult.language) {
      console.log('Language detected from captions:', captionResult.language);
      return {
        detectedLanguage: captionResult.language,
        confidence: 'high',
        sources: ['video-captions']
      };
    }

    // PRIORITY 4: Enhanced text pattern analysis
    const textResult = detectFromEnhancedTextAnalysis(title, description, channel, comments);
    if (textResult.language && textResult.confidence > 3) {
      console.log('Language detected from enhanced text analysis:', textResult.language);
      return {
        detectedLanguage: textResult.language,
        confidence: textResult.confidence > 8 ? 'high' : 'medium',
        sources: ['enhanced-text-analysis']
      };
    }

    // PRIORITY 5: URL and browser language hints
    if (urlLanguage) {
      const langFromUrl = mapLanguageCode(urlLanguage);
      if (langFromUrl !== 'English') {
        console.log('Language detected from URL/browser:', langFromUrl);
        return {
          detectedLanguage: langFromUrl,
          confidence: 'medium',
          sources: ['url-browser-hints']
        };
      }
    }

  } catch (error) {
    console.error('Language detection error:', error);
  }

  console.log('Final detection result (fallback):', { detectedLanguage, confidence, sources });
  return { detectedLanguage, confidence, sources };
}

// Enhanced script detection with better coverage
function detectFromCharacterScript(title: string, description: string, channel: string) {
  const combinedText = `${title} ${description} ${channel}`;

  // Arabic script detection (enhanced)
  if (/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/g.test(combinedText)) {
    return { language: 'Arabic', confidence: 10 };
  }
  
  // Russian/Cyrillic script
  if (/[\u0400-\u04ff]/g.test(combinedText)) {
    return { language: 'Russian', confidence: 10 };
  }
  
  // Chinese script
  if (/[\u4e00-\u9fff]/g.test(combinedText)) {
    return { language: 'Chinese', confidence: 10 };
  }
  
  // Japanese script
  if (/[\u3040-\u309f\u30a0-\u30ff]/g.test(combinedText)) {
    return { language: 'Japanese', confidence: 10 };
  }
  
  // Korean script
  if (/[\uac00-\ud7af]/g.test(combinedText)) {
    return { language: 'Korean', confidence: 10 };
  }
  
  // Hebrew script
  if (/[\u0590-\u05ff]/g.test(combinedText)) {
    return { language: 'Hebrew', confidence: 10 };
  }
  
  // Thai script
  if (/[\u0e00-\u0e7f]/g.test(combinedText)) {
    return { language: 'Thai', confidence: 10 };
  }

  return { language: null, confidence: 0 };
}

// Super enhanced German detection
function detectGermanContentEnhanced(title: string, description: string, channel: string, comments: string, urlLang: string) {
  const allText = `${title} ${description} ${channel} ${comments}`.toLowerCase();
  let germanScore = 0;

  // Check URL language parameter
  if (urlLang.includes('de') || urlLang.includes('DE')) {
    germanScore += 15;
  }

  // German umlauts and ß (very strong indicator)
  const umlauts = allText.match(/[äöüßÄÖÜ]/g);
  if (umlauts) {
    germanScore += umlauts.length * 5;
  }

  // Common German words (comprehensive list)
  const germanWords = [
    // Articles and pronouns
    'der', 'die', 'das', 'den', 'dem', 'des', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich',
    // Common verbs
    'ist', 'sind', 'war', 'waren', 'haben', 'hat', 'hatte', 'hatten', 'werden', 'wird', 'wurde', 'wurden',
    'können', 'kann', 'konnte', 'sollen', 'soll', 'sollte', 'müssen', 'muss', 'musste', 'dürfen', 'darf', 'durfte',
    'mögen', 'mag', 'mochte', 'wollen', 'will', 'wollte', 'machen', 'macht', 'machte', 'gehen', 'geht', 'ging',
    // Prepositions and conjunctions
    'und', 'oder', 'aber', 'denn', 'sondern', 'wenn', 'dass', 'weil', 'obwohl', 'damit', 'falls', 'bevor', 'nachdem',
    'mit', 'von', 'zu', 'auf', 'in', 'an', 'für', 'über', 'durch', 'nach', 'vor', 'bei', 'um', 'ohne', 'gegen',
    // Common adjectives and adverbs
    'gut', 'besser', 'beste', 'schlecht', 'schlechter', 'große', 'größer', 'größte', 'klein', 'kleiner', 'kleinste',
    'viel', 'mehr', 'meist', 'wenig', 'weniger', 'wenigste', 'sehr', 'ziemlich', 'ganz', 'völlig', 'fast',
    // Time and place
    'heute', 'gestern', 'morgen', 'jetzt', 'dann', 'immer', 'nie', 'manchmal', 'oft', 'selten',
    'hier', 'dort', 'da', 'wo', 'wohin', 'woher', 'überall', 'nirgendwo',
    // German-specific words
    'deutschland', 'deutsch', 'deutsche', 'deutscher', 'deutschen', 'video', 'kanal', 'abonnieren', 'kommentar',
    // Question words
    'was', 'wer', 'wie', 'wo', 'wann', 'warum', 'welche', 'welcher', 'welches'
  ];

  germanWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) {
      germanScore += matches.length * 2;
    }
  });

  // German compound words pattern
  const compoundPattern = /\b\w{10,}\b/g;
  const compounds = allText.match(compoundPattern);
  if (compounds) {
    compounds.forEach(compound => {
      if (/[äöüß]/.test(compound) || 
          /ung$|keit$|heit$|schaft$|tion$/.test(compound) ||
          /^ver|^be|^ge|^er|^ent|^zer/.test(compound)) {
        germanScore += 3;
      }
    });
  }

  // Channel name analysis
  if (channel.toLowerCase().includes('deutsch') || 
      channel.toLowerCase().includes('german') || 
      channel.toLowerCase().includes('deutschland')) {
    germanScore += 20;
  }

  console.log(`Enhanced German detection score: ${germanScore}`);
  return { isGerman: germanScore >= 8 }; // Lower threshold but more accurate patterns
}

// Enhanced caption detection
function detectFromCaptions() {
  const captionElements = document.querySelectorAll('.ytp-menuitem, .captions-text, [class*="caption"], [class*="subtitle"]');
  
  for (const element of captionElements) {
    const text = element.textContent?.toLowerCase() || '';
    
    // Enhanced language detection from captions
    if (text.includes('العربية') || text.includes('arabic')) {
      return { language: 'Arabic', confidence: 10 };
    }
    if (text.includes('deutsch') || text.includes('german') || text.includes('alemán')) {
      return { language: 'German', confidence: 10 };
    }
    if (text.includes('русский') || text.includes('russian')) {
      return { language: 'Russian', confidence: 10 };
    }
    if (text.includes('español') || text.includes('spanish')) {
      return { language: 'Spanish', confidence: 10 };
    }
    if (text.includes('français') || text.includes('french')) {
      return { language: 'French', confidence: 10 };
    }
    if (text.includes('italiano') || text.includes('italian')) {
      return { language: 'Italian', confidence: 10 };
    }
    if (text.includes('português') || text.includes('portuguese')) {
      return { language: 'Portuguese', confidence: 10 };
    }
  }
  
  return { language: null, confidence: 0 };
}

// Enhanced text analysis with better patterns
function detectFromEnhancedTextAnalysis(title: string, description: string, channel: string, comments: string) {
  const combinedText = `${title} ${description} ${channel} ${comments}`.toLowerCase();
  
  const languagePatterns = {
    'Arabic': {
      patterns: [
        /\b(في|من|إلى|على|عن|مع|هذا|هذه|ذلك|تلك|التي|الذي|التي|اللذان|اللتان|اللذين|اللتين|اللواتي|كان|كانت|يكون|تكون|كيف|ماذا|متى|أين|لماذا|مَن|أي|كل|بعض|جميع|كثير|قليل|جداً|أيضاً|لكن|أو|إذا|عندما|بينما|حتى|منذ|خلال|بعد|قبل|أثناء|رغم|بالرغم|مقابل|ضد|نحو|حول|بدون|سوى|عدا|ما عدا|إلا|فقط|ولكن|غير|عبر|داخل|خارج|تحت|فوق|بين|أمام|خلف|يمين|يسار|شمال|وسط|طول|عرض|ارتفاع|عمق|سرعة|بطء|صباح|مساء|ليل|نهار|يوم|أسبوع|شهر|سنة|أمس|اليوم|غداً|الآن|بعدين|قريباً|بعيداً|هنا|هناك|هنالك|حيث|أينما|كلما|مهما|أياً|أجل|نعم|لا|ربما|ممكن|مستحيل|صحيح|خطأ|جيد|سيء|كبير|صغير|طويل|قصير|واسع|ضيق|سميك|رفيع|ثقيل|خفيف|قوي|ضعيف|سريع|بطيء|ساخن|بارد|دافئ|مبرد|جاف|رطب|نظيف|قذر|جديد|قديم|حديث|قديم|مبكر|متأخر|أول|آخر|أعلى|أسفل|داخلي|خارجي|محلي|أجنبي|عام|خاص|رسمي|غير رسمي|مجاني|مدفوع|مفتوح|مغلق|متاح|غير متاح|موجود|غير موجود|حاضر|غائب|مشغول|فارغ|ممتلئ|فارغ|كامل|ناقص|صحيح|غير صحيح|مؤكد|غير مؤكد|واضح|غير واضح|مفهوم|غير مفهوم|معروف|غير معروف|مشهور|غير مشهور|شائع|نادر|عادي|غريب|طبيعي|غير طبيعي|ممكن|مستحيل|سهل|صعب|بسيط|معقد|رخيص|غالي|مكلف|رخيص|مجاني|مدفوع|مربح|خاسر|ناجح|فاشل|فائز|خاسر|قوي|ضعيف|صلب|طري|ناعم|خشن|أملس|محبب|لامع|باهت|مضيء|مظلم|ملون|أبيض|أسود|أحمر|أزرق|أخضر|أصفر|برتقالي|بنفسجي|وردي|بني|رمادي|فضي|ذهبي)\b/g,
        /\b(والله|إن شاء الله|ما شاء الله|بإذن الله|الحمد لله|سبحان الله|أستغفر الله|لا إله إلا الله|الله أكبر|بسم الله|توكلت على الله|حسبي الله|لا حول ولا قوة إلا بالله)\b/g
      ],
      weight: 4
    },
    'German': {
      patterns: [
        /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|ich|du|er|sie|es|wir|ihr|sie|mich|dich|sich|uns|euch|mir|dir|ihm|ihr|ihnen|und|oder|aber|denn|sondern|wenn|dass|weil|obwohl|damit|falls|bevor|nachdem|während|seit|bis|statt|außer|innerhalb|außerhalb|mit|von|zu|auf|in|an|für|über|durch|nach|vor|bei|um|ohne|gegen|trotz|während|seit|bis|statt|außer|innerhalb|außerhalb|ist|sind|war|waren|bin|bist|haben|hat|hatte|hatten|werden|wird|wurde|wurden|können|kann|konnte|konnten|sollen|soll|sollte|sollten|müssen|muss|musste|mussten|dürfen|darf|durfte|durften|mögen|mag|mochte|mochten|wollen|will|wollte|wollten|machen|macht|machte|machten|gehen|geht|ging|gingen|kommen|kommt|kam|kamen|sehen|sieht|sah|sahen|sagen|sagt|sagte|sagten|denken|denkt|dachte|dachten|glauben|glaubt|glaubte|glaubten|wissen|weiß|wusste|wussten|verstehen|versteht|verstand|verstanden|sprechen|spricht|sprach|sprachen|hören|hört|hörte|hörten|lesen|liest|las|lasen|schreiben|schreibt|schrieb|schrieben|arbeiten|arbeitet|arbeitete|arbeiteten|leben|lebt|lebte|lebten|spielen|spielt|spielte|spielten|lernen|lernt|lernte|lernten|fahren|fährt|fuhr|fuhren|fliegen|fliegt|flog|flogen|kaufen|kauft|kaufte|kauften|verkaufen|verkauft|verkaufte|verkauften|essen|isst|aß|aßen|trinken|trinkt|trank|tranken|schlafen|schläft|schlief|schliefen|aufstehen|steht|auf|stand|auf|standen|auf|wie|was|wo|wann|warum|wer|welche|welcher|welches|diese|dieser|dieses|jede|jeder|jedes|alle|alles|noch|schon|immer|nie|heute|gestern|morgen|hier|dort|jetzt|dann|also|sehr|mehr|weniger|gut|besser|schlecht|schlechter|groß|größer|klein|kleiner|deutsch|deutschland|video|kanal|abonnieren|kommentar)\b/g,
        /[äöüßÄÖÜ]/g,
        /\b\w+ung\b|\b\w+keit\b|\b\w+heit\b|\b\w+schaft\b/g
      ],
      weight: 3
    },
    'Spanish': {
      patterns: [
        /\b(el|la|los|las|de|del|y|o|en|con|por|para|como|que|se|le|lo|un|una|es|son|pero|si|no|muy|más|todo|todos|esta|este|están|fue|ser|estar|ter|fazer|ir|ver|dar|saber|querer|poder|dizer|cada|outro|mismo|tanto|menos|algo|español|spain|méxico|argentina|colombia)\b/g,
        /[ñáéíóúü]/g
      ],
      weight: 2
    },
    'French': {
      patterns: [
        /\b(le|la|les|de|du|des|et|ou|en|avec|par|pour|comme|que|se|lui|ce|un|une|est|sont|mais|si|non|très|plus|tout|tous|cette|ces|était|être|avoir|faire|aller|voir|donner|savoir|vouloir|pouvoir|dire|chaque|autre|même|tant|moins|quelque|français|france)\b/g,
        /[àâäéèêëïîôùûüÿç]/g
      ],
      weight: 2
    },
    'Russian': {
      patterns: [
        /\b(и|в|на|с|не|это|что|как|он|она|они|мы|вы|я|был|была|были|быть|иметь|делать|сказать|мочь|хотеть|знать|видеть|идти|дать|работать|стать|есть|жить|говорить|нет|да|очень|еще|уже|только|может|должен|сейчас|здесь|потом|всего|него|всех|даже|лучше|россия|русский)\b/g
      ],
      weight: 2
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
  
  return { language: bestLanguage, confidence: maxScore };
}

// Map language codes to language names
function mapLanguageCode(code: string): string {
  const langMap: { [key: string]: string } = {
    'ar': 'Arabic', 'ar-SA': 'Arabic', 'ar-EG': 'Arabic', 'ar-AE': 'Arabic',
    'de': 'German', 'de-DE': 'German', 'de-AT': 'German', 'de-CH': 'German',
    'es': 'Spanish', 'es-ES': 'Spanish', 'es-MX': 'Spanish', 'es-AR': 'Spanish',
    'fr': 'French', 'fr-FR': 'French', 'fr-CA': 'French', 'fr-BE': 'French',
    'it': 'Italian', 'it-IT': 'Italian',
    'pt': 'Portuguese', 'pt-BR': 'Portuguese', 'pt-PT': 'Portuguese',
    'ru': 'Russian', 'ru-RU': 'Russian',
    'ja': 'Japanese', 'ja-JP': 'Japanese',
    'ko': 'Korean', 'ko-KR': 'Korean',
    'zh': 'Chinese', 'zh-CN': 'Chinese', 'zh-TW': 'Chinese', 'zh-HK': 'Chinese',
    'hi': 'Hindi', 'hi-IN': 'Hindi',
    'th': 'Thai', 'th-TH': 'Thai',
    'vi': 'Vietnamese', 'vi-VN': 'Vietnamese',
    'tr': 'Turkish', 'tr-TR': 'Turkish',
    'pl': 'Polish', 'pl-PL': 'Polish',
    'nl': 'Dutch', 'nl-NL': 'Dutch',
    'he': 'Hebrew', 'he-IL': 'Hebrew',
    'en': 'English', 'en-US': 'English', 'en-GB': 'English', 'en-CA': 'English'
  };
  
  return langMap[code] || 'English';
}
