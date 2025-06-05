
// Enhanced AI video summarization with reliable language detection
const API_KEY = 'AIzaSyDxQpk6jmBsM5lsGdzRJKokQkwSVTk5sRg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

import { detectLanguageFromVideoContent } from './languageDetection';

// Create a language-consistent prompt without English phrases
function createLanguageConsistentPrompt(detailLevel: string) {
  const languageResult = detectLanguageFromVideoContent();
  const targetLanguage = languageResult.detectedLanguage;
  const wordCount = detailLevel === 'quick' ? '200-300' : '500-700';
  
  console.log('Creating enhanced prompt for language:', targetLanguage, 'with confidence:', languageResult.confidence);
  
  // Language-specific instruction templates
  const languageInstructions = {
    'Arabic': `تعليمات مهمة للغة: يجب أن تكتب إجابتك بالكامل باللغة العربية فقط.

اللغة المكتشفة: العربية
مستوى الثقة: ${languageResult.confidence}
المصادر: ${languageResult.sources.join(', ')}

قواعد صارمة:
- استخدم العربية فقط في كامل الإجابة
- جميع العناوين والمحتوى والخلاصة يجب أن تكون بالعربية
- ممنوع استخدام أي كلمات إنجليزية
- أكمل الملخص بخاتمة واضحة بالعربية

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

التحقق النهائي: تأكد أن كل كلمة باللغة العربية.`,

    'German': `KRITISCHE SPRACHANWEISUNG: Sie MÜSSEN Ihre GESAMTE Antwort auf Deutsch schreiben.

Erkannte Sprache: Deutsch
Vertrauensniveau: ${languageResult.confidence}
Quellen: ${languageResult.sources.join(', ')}

STRENGE REGELN:
- Zielsprache: Deutsch
- KEINE Toleranz für Sprachmischung
- ALLE Inhalte einschließlich Überschriften, Text und Schlussfolgerung müssen auf Deutsch sein

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

ABSCHLUSSPRÜFUNG: Überprüfen Sie vor der Übermittlung, dass JEDES Wort auf Deutsch ist.`,

    'Spanish': `INSTRUCCIÓN CRÍTICA DE IDIOMA: DEBE escribir TODA su respuesta en español.

Idioma detectado: Español
Nivel de confianza: ${languageResult.confidence}
Fuentes: ${languageResult.sources.join(', ')}

REGLAS ESTRICTAS:
- Idioma objetivo: Español
- CERO tolerancia para mezclar idiomas
- TODO el contenido incluyendo encabezados, cuerpo y conclusión debe estar en español

TAREA: Crear un resumen ${detailLevel === 'quick' ? 'rápido (200-300 palabras)' : 'detallado (500-700 palabras)'} en español.

ESTRUCTURA (todo en español):
${detailLevel === 'quick' ? `
- Resumen breve en español
- Puntos principales (3-4 elementos clave) en español
- Conclusión clara en español
` : `
- Introducción y contexto en español
- Análisis detallado del contenido en español
- Perspectivas y conclusiones clave en español
- Conclusión integral en español
`}

VERIFICACIÓN FINAL: Antes de enviar, verifique que CADA palabra esté en español.`,

    'French': `INSTRUCTION LINGUISTIQUE CRITIQUE : Vous DEVEZ écrire TOUTE votre réponse en français.

Langue détectée : Français
Niveau de confiance : ${languageResult.confidence}
Sources : ${languageResult.sources.join(', ')}

RÈGLES STRICTES :
- Langue cible : Français
- ZÉRO tolérance pour le mélange de langues
- TOUT le contenu y compris les en-têtes, le corps et la conclusion doit être en français

TÂCHE : Créer un résumé ${detailLevel === 'quick' ? 'rapide (200-300 mots)' : 'détaillé (500-700 mots)'} en français.

STRUCTURE (tout en français) :
${detailLevel === 'quick' ? `
- Aperçu bref en français
- Points principaux (3-4 éléments clés) en français
- Conclusion claire en français
` : `
- Introduction et contexte en français
- Analyse détaillée du contenu en français
- Perspectives et conclusions clés en français
- Conclusion complète en français
`}

VÉRIFICATION FINALE : Avant de soumettre, vérifiez que CHAQUE mot est en français.`,

    'Russian': `КРИТИЧЕСКАЯ ЯЗЫКОВАЯ ИНСТРУКЦИЯ: Вы ДОЛЖНЫ написать ВЕСЬ ваш ответ на русском языке.

Обнаруженный язык: Русский
Уровень достоверности: ${languageResult.confidence}
Источники: ${languageResult.sources.join(', ')}

СТРОГИЕ ПРАВИЛА:
- Целевой язык: Русский
- НУЛЕВАЯ терпимость к смешению языков
- ВСЁ содержание включая заголовки, основной текст и заключение должно быть на русском языке

ЗАДАЧА: Создать ${detailLevel === 'quick' ? 'краткое резюме (200-300 слов)' : 'подробное резюме (500-700 слов)'} на русском языке.

СТРУКТУРА (всё на русском языке):
${detailLevel === 'quick' ? `
- Краткий обзор на русском языке
- Основные моменты (3-4 ключевых элемента) на русском языке
- Чёткое заключение на русском языке
` : `
- Введение и контекст на русском языке
- Подробный анализ содержания на русском языке
- Ключевые выводы и заключения на русском языке
- Исчерпывающее заключение на русском языке
`}

ФИНАЛЬНАЯ ПРОВЕРКА: Перед отправкой убедитесь, что КАЖДОЕ слово на русском языке.`
  };

  // Get language-specific prompt or default to English
  const specificPrompt = languageInstructions[targetLanguage as keyof typeof languageInstructions];
  
  if (specificPrompt) {
    return specificPrompt;
  }

  // Default English prompt (fallback)
  return `CRITICAL LANGUAGE INSTRUCTION: You MUST write your ENTIRE response in ${targetLanguage}.

ENHANCED LANGUAGE DETECTION:
- Detected language: ${targetLanguage}
- Detection confidence: ${languageResult.confidence}
- Sources: ${languageResult.sources.join(', ')}
- ABSOLUTE REQUIREMENT: Write EVERYTHING in ${targetLanguage}
- NO mixed languages allowed - complete consistency required
- ALL headers, content, and conclusions must be in ${targetLanguage}

TASK: Create a ${detailLevel} video summary (${wordCount} words) in ${targetLanguage}.

STRUCTURE (all in ${targetLanguage}):
${detailLevel === 'quick' ? `
- Brief overview in ${targetLanguage}
- Main points (3-4 key items) in ${targetLanguage}
- Clear conclusion in ${targetLanguage}
` : `
- Introduction and context in ${targetLanguage}
- Detailed content analysis in ${targetLanguage}
- Key insights and takeaways in ${targetLanguage}
- Comprehensive conclusion in ${targetLanguage}
`}

COMPLETION REQUIREMENTS:
- Must end with proper conclusion in ${targetLanguage}
- No abrupt endings or incomplete thoughts
- Full coherent summary from start to finish in ${targetLanguage}

FINAL CHECK: Before submitting, verify EVERY word is in ${targetLanguage}.`;
}

export async function summarizeYouTubeVideo(videoUrl: string, detailLevel: 'quick' | 'detailed' = 'detailed'): Promise<string> {
  try {
    console.log(`Starting enhanced summarization for ${videoUrl} in ${detailLevel} mode`);
    
    const generationConfig = {
      temperature: 0.01, // Ultra-low for consistency
      maxOutputTokens: detailLevel === 'quick' ? 600 : 1200,
      topP: 0.05,
      topK: 1,
      candidateCount: 1,
      stopSequences: [],
      responseMimeType: "text/plain"
    };

    const requestBody = {
      contents: [
        {
          parts: [
            { text: createLanguageConsistentPrompt(detailLevel) },
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: "video/youtube"
              }
            }
          ]
        }
      ],
      generationConfig,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    console.log('Making API request with enhanced language detection...');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      
      // Get user's language for error messages
      const languageResult = detectLanguageFromVideoContent();
      const errorMessages = getLocalizedErrorMessages(languageResult.detectedLanguage);
      
      if (response.status === 429) {
        throw new Error(errorMessages.highDemand);
      }
      if (response.status === 400 && errorText.includes('Video too long')) {
        throw new Error(errorMessages.videoTooLong);
      }
      if (response.status >= 500) {
        throw new Error(errorMessages.serverBusy);
      }
      
      throw new Error(errorMessages.serviceBusy);
    }

    const data = await response.json();
    console.log('API Response received');
    
    let summary = '';
    
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      summary = data.candidates[0].content.parts[0].text.trim();
      
      // Check if truncated and try to complete
      if (data.candidates[0].finishReason === 'MAX_TOKENS') {
        console.log('Response truncated, attempting completion...');
        try {
          const completed = await completeTruncatedSummary(summary);
          if (completed) summary = completed;
        } catch (e) {
          console.log('Could not complete, using partial content');
        }
      }
      
      if (summary && summary.length > 50) {
        console.log('Summary generated successfully, length:', summary.length);
        return summary;
      }
    }
    
    // Handle specific finish reasons
    if (data?.candidates?.[0]?.finishReason) {
      const reason = data.candidates[0].finishReason;
      const languageResult = detectLanguageFromVideoContent();
      const errorMessages = getLocalizedErrorMessages(languageResult.detectedLanguage);
      
      if (reason === 'SAFETY') {
        throw new Error(errorMessages.contentSafety);
      } else if (reason === 'RECITATION') {
        throw new Error(errorMessages.copyright);
      }
    }
    
    const languageResult = detectLanguageFromVideoContent();
    const errorMessages = getLocalizedErrorMessages(languageResult.detectedLanguage);
    throw new Error(errorMessages.processingIncomplete);
    
  } catch (error) {
    console.error('Error in summarizeYouTubeVideo:', error);
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      const languageResult = detectLanguageFromVideoContent();
      const errorMessages = getLocalizedErrorMessages(languageResult.detectedLanguage);
      throw new Error(errorMessages.connectionIssue);
    }
    
    throw error;
  }
}

// Get localized error messages
function getLocalizedErrorMessages(language: string) {
  const messages = {
    'Arabic': {
      highDemand: 'طلب كثيف تم اكتشافه 🌟 يرجى المحاولة مرة أخرى خلال دقائق قليلة',
      videoTooLong: 'الفيديو طويل جداً 📹 جرب الوضع السريع أو فيديو أقصر',
      serverBusy: 'الخادم في استراحة ☕ يرجى المحاولة مرة أخرى قريباً',
      serviceBusy: 'الخدمة مشغولة 🌸 يرجى المحاولة مرة أخرى خلال لحظة',
      contentSafety: 'المحتوى يحتاج معالجة خاصة 🛡️ جرب فيديو مختلف',
      copyright: 'تم اكتشاف اعتبارات حقوق النشر 📄 جرب فيديو مختلف',
      processingIncomplete: 'المعالجة غير مكتملة 🤔 يرجى المحاولة مرة أخرى',
      connectionIssue: 'مشكلة في الاتصال 🌐 يرجى فحص الإنترنت والمحاولة مرة أخرى'
    },
    'German': {
      highDemand: 'Hohe Nachfrage erkannt 🌟 Bitte versuchen Sie es in wenigen Minuten erneut',
      videoTooLong: 'Video ist ziemlich lang 📹 Versuchen Sie den Schnellmodus oder ein kürzeres Video',
      serverBusy: 'Server macht eine Pause ☕ Bitte versuchen Sie es in Kürze erneut',
      serviceBusy: 'Service beschäftigt 🌸 Bitte versuchen Sie es in einem Moment erneut',
      contentSafety: 'Inhalt benötigt spezielle Behandlung 🛡️ Versuchen Sie ein anderes Video',
      copyright: 'Urheberrechtserwägungen erkannt 📄 Versuchen Sie ein anderes Video',
      processingIncomplete: 'Verarbeitung unvollständig 🤔 Bitte versuchen Sie es erneut',
      connectionIssue: 'Verbindungsproblem 🌐 Bitte überprüfen Sie das Internet und versuchen Sie es erneut'
    },
    'Spanish': {
      highDemand: 'Alta demanda detectada 🌟 Por favor, inténtelo de nuevo en unos minutos',
      videoTooLong: 'El video es bastante largo 📹 Pruebe el modo rápido o un video más corto',
      serverBusy: 'Servidores tomando un descanso ☕ Por favor, inténtelo de nuevo en breve',
      serviceBusy: 'Servicio ocupado 🌸 Por favor, inténtelo de nuevo en un momento',
      contentSafety: 'El contenido necesita manejo especial 🛡️ Pruebe un video diferente',
      copyright: 'Consideraciones de derechos de autor detectadas 📄 Pruebe un video diferente',
      processingIncomplete: 'Procesamiento incompleto 🤔 Por favor, inténtelo de nuevo',
      connectionIssue: 'Problema de conexión 🌐 Por favor, verifique internet e inténtelo de nuevo'
    },
    'French': {
      highDemand: 'Forte demande détectée 🌟 Veuillez réessayer dans quelques minutes',
      videoTooLong: 'La vidéo est assez longue 📹 Essayez le mode rapide ou une vidéo plus courte',
      serverBusy: 'Serveurs en pause ☕ Veuillez réessayer sous peu',
      serviceBusy: 'Service occupé 🌸 Veuillez réessayer dans un moment',
      contentSafety: 'Le contenu nécessite un traitement spécial 🛡️ Essayez une vidéo différente',
      copyright: 'Considérations de droits d\'auteur détectées 📄 Essayez une vidéo différente',
      processingIncomplete: 'Traitement incomplet 🤔 Veuillez réessayer',
      connectionIssue: 'Problème de connexion 🌐 Veuillez vérifier internet et réessayer'
    },
    'Russian': {
      highDemand: 'Обнаружен высокий спрос 🌟 Пожалуйста, попробуйте снова через несколько минут',
      videoTooLong: 'Видео довольно длинное 📹 Попробуйте быстрый режим или более короткое видео',
      serverBusy: 'Серверы делают перерыв ☕ Пожалуйста, попробуйте снова вскоре',
      serviceBusy: 'Сервис занят 🌸 Пожалуйста, попробуйте снова через момент',
      contentSafety: 'Контент требует специальной обработки 🛡️ Попробуйте другое видео',
      copyright: 'Обнаружены соображения авторского права 📄 Попробуйте другое видео',
      processingIncomplete: 'Обработка неполная 🤔 Пожалуйста, попробуйте снова',
      connectionIssue: 'Проблема соединения 🌐 Пожалуйста, проверьте интернет и попробуйте снова'
    }
  };

  return messages[language as keyof typeof messages] || {
    highDemand: 'High demand detected 🌟 Please try again in a few minutes',
    videoTooLong: 'Video is quite lengthy 📹 Try Quick mode for better results',
    serverBusy: 'Servers taking a break ☕ Please try again shortly',
    serviceBusy: 'Service busy 🌸 Please try again in a moment',
    contentSafety: 'Content needs special handling 🛡️ Try a different video',
    copyright: 'Copyright considerations detected 📄 Try a different video',
    processingIncomplete: 'Processing incomplete 🤔 Please try again',
    connectionIssue: 'Connection issue 🌐 Please check internet and try again'
  };
}

// Enhanced completion for truncated summaries
async function completeTruncatedSummary(incompleteSummary: string): Promise<string | null> {
  const languageResult = detectLanguageFromVideoContent();
  const targetLang = languageResult.detectedLanguage;
  
  const completionPrompts = {
    'Arabic': `أكمل هذا الملخص العربي بخاتمة مناسبة.

نهاية الملخص غير المكتمل: "${incompleteSummary.slice(-200)}"

قدم فقط الخاتمة المفقودة بالعربية:
- ملخص موجز للنقاط الرئيسية
- بيان نهائي واضح
- حد أقصى 60 كلمة
- استخدم العربية فقط`,

    'German': `Vervollständigen Sie diese deutsche Zusammenfassung mit einem angemessenen Schluss.

Unvollständiges Zusammenfassungsende: "${incompleteSummary.slice(-200)}"

Geben Sie NUR den fehlenden Schluss auf Deutsch an:
- Kurze Zusammenfassung der Hauptpunkte
- Klare Abschlusserklärung
- Maximal 60 Wörter
- Nur Deutsch verwenden`,

    'Spanish': `Complete este resumen en español con una conclusión adecuada.

Final del resumen incompleto: "${incompleteSummary.slice(-200)}"

Proporcione SOLO la conclusión faltante en español:
- Resumen breve de los puntos principales
- Declaración final clara
- Máximo 60 palabras
- Use SOLO español`,

    'French': `Complétez ce résumé français avec une conclusion appropriée.

Fin du résumé incomplet : "${incompleteSummary.slice(-200)}"

Fournissez SEULEMENT la conclusion manquante en français :
- Récapitulatif bref des points principaux
- Déclaration finale claire
- Maximum 60 mots
- Utilisez SEULEMENT le français`,

    'Russian': `Завершите это русское резюме подходящим заключением.

Окончание неполного резюме: "${incompleteSummary.slice(-200)}"

Предоставьте ТОЛЬКО недостающее заключение на русском языке:
- Краткое резюме основных моментов
- Четкое заключительное заявление
- Максимум 60 слов
- Используйте ТОЛЬКО русский язык`
  };

  const completionPrompt = completionPrompts[targetLang as keyof typeof completionPrompts] || 
    `Complete this ${targetLang} summary with a proper conclusion.

Incomplete summary ending: "${incompleteSummary.slice(-200)}"

Provide ONLY the missing conclusion in ${targetLang}:
- Brief wrap-up of main points
- Clear final statement
- Maximum 60 words
- Use ONLY ${targetLang}`;

  try {
    const completionRequest = {
      contents: [{ parts: [{ text: completionPrompt }] }],
      generationConfig: {
        temperature: 0.01,
        maxOutputTokens: 150,
        topP: 0.05
      }
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completionRequest)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const completion = data.candidates[0].content.parts[0].text.trim();
        return incompleteSummary + (incompleteSummary.endsWith('.') ? ' ' : '. ') + completion;
      }
    }
  } catch (error) {
    console.error('Completion failed:', error);
  }
  
  return null;
}

export { summarizeYouTubeVideo as default };
