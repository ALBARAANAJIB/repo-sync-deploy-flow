
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// Constants
const MODEL_NAME = "gemini-2.0-flash-exp";

// Types for the video summary functionality
export interface VideoSummaryOptions {
  videoId?: string;
  videoUrl?: string;
  videoTitle?: string;
  channelTitle?: string;
  transcript?: string;
  summaryType?: 'quick' | 'detailed';
}

// Simple cache for API responses
const cache = new Map<string, any>();
const rateLimitTracker = new Map<string, number[]>();

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*v=)([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it looks like it might already be a video ID
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
}

/**
 * Simple rate limiting check
 */
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const requests = rateLimitTracker.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitTracker.set(key, validRequests);
  return true;
}

/**
 * Get current video info from YouTube page
 */
function getCurrentVideoInfo(): { videoId: string | null, title: string, channel: string } {
  const videoId = extractVideoId(window.location.href);
  const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent || 
                document.querySelector('h1 yt-formatted-string')?.textContent || '';
  const channel = document.querySelector('ytd-channel-name a')?.textContent || 
                  document.querySelector('#owner-name a')?.textContent || '';
  
  return { videoId, title, channel };
}

/**
 * Create a properly formatted HTML summary from Gemini's response
 */
function formatSummaryAsHtml(text: string): string {
  if (!text) return '<p>No summary available.</p>';
  
  // If the text already contains HTML, return it as is
  if (text.includes('<ul>') || text.includes('<ol>') || text.includes('<p>')) {
    return text;
  }
  
  // Convert bullet points to HTML list
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  let formattedHtml = '';
  let inList = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a bullet point (starts with -, *, •, or number.)
    if (trimmedLine.match(/^(\-|\*|•|\d+\.)\s+/)) {
      if (!inList) {
        formattedHtml += '<ul style="margin: 8px 0; padding-left: 20px;">\n';
        inList = true;
      }
      formattedHtml += `  <li style="margin: 4px 0;">${trimmedLine.replace(/^(\-|\*|•|\d+\.)\s+/, '')}</li>\n`;
    } else {
      if (inList) {
        formattedHtml += '</ul>\n';
        inList = false;
      }
      formattedHtml += `<p style="margin: 8px 0;">${trimmedLine}</p>\n`;
    }
  }
  
  if (inList) {
    formattedHtml += '</ul>\n';
  }
  
  return formattedHtml;
}

/**
 * Get API key securely from background script or fallback
 */
async function getSecureApiKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (response && response.apiKey) {
          resolve(response.apiKey);
        } else {
          // Fallback API key for development
          resolve("AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY");
        }
      });
    } else {
      // Fallback for development
      resolve("AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY");
    }
  });
}

/**
 * Main function to generate a summary of a YouTube video
 */
export async function generateVideoSummary(options: VideoSummaryOptions = {}): Promise<string> {
  try {
    // Rate limiting check
    if (!checkRateLimit('video_summary', 5, 60000)) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    
    // Get current video info if not provided
    const currentVideo = getCurrentVideoInfo();
    const videoId = options.videoId || currentVideo.videoId;
    const title = options.videoTitle || currentVideo.title;
    const channelTitle = options.channelTitle || currentVideo.channel;
    const summaryType = options.summaryType || 'quick';
    
    if (!videoId && !options.transcript) {
      throw new Error("No valid video found or transcript provided");
    }
    
    // Check cache first
    const cacheKey = `summary_${videoId}_${summaryType}_${options.transcript ? 'transcript' : 'metadata'}`;
    const cachedSummary = cache.get(cacheKey);
    if (cachedSummary) {
      return cachedSummary;
    }
    
    const apiKey = await getSecureApiKey();
    
    // Create the Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Prepare the prompt based on summary type and available information
    let promptText = "";
    const transcriptText = options.transcript || '';
    
    if (summaryType === 'detailed') {
      promptText = `Create a comprehensive, detailed summary of this YouTube video${title ? ' titled "' + title + '"' : ''}${channelTitle ? ' by ' + channelTitle : ''}.\n\n`;
      
      if (transcriptText) {
        promptText += `Here is the transcript:\n\n${transcriptText}\n\n`;
        promptText += `Provide a detailed analysis with:
- Main topic and purpose of the video
- 7-10 key points and takeaways
- Important details, examples, or data mentioned
- Conclusions or recommendations
- Target audience and practical applications

Format your response in HTML using <h4> for section headers, <ul> and <li> tags for bullet points, and <p> for paragraphs. Make it comprehensive and well-structured.`;
      } else {
        promptText += `Based on the title and creator information, provide a detailed prediction of what this video likely covers, including potential key topics, target audience, and typical content structure for this type of video. Format your response in HTML and note that this is a prediction since no transcript was available.`;
      }
    } else {
      // Quick summary
      promptText = `Create a concise, quick summary of this YouTube video${title ? ' titled "' + title + '"' : ''}${channelTitle ? ' by ' + channelTitle : ''}.\n\n`;
      
      if (transcriptText) {
        promptText += `Here is the transcript:\n\n${transcriptText}\n\n`;
        promptText += `Provide 3-5 key bullet points covering the main takeaways. Keep it concise and easy to scan. Format your response in HTML using <ul> and <li> tags for the bullet points.`;
      } else {
        promptText += `Based on the title and creator information, provide your best guess at what this video might cover in 3-4 bullet points. Format your response in HTML with bullet points using <ul> and <li> tags, and note at the beginning that this is a prediction since no transcript was available.`;
      }
    }
    
    // Generate content using the Gemini model with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    console.log('🤖 Generating summary with Gemini...');
    const result = await model.generateContent(promptText);
    clearTimeout(timeoutId);
    
    const response = await result.response;
    const text = response.text();
    
    // Format the response as HTML
    const formattedSummary = formatSummaryAsHtml(text);
    
    // Cache the result for 5 minutes
    cache.set(cacheKey, formattedSummary);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
    
    console.log('✅ Summary generated successfully');
    return formattedSummary;
  } catch (error) {
    console.error("Error generating video summary:", error);
    
    if (error.message?.includes('Rate limit')) {
      return `<p style="color: #ff6b6b;">⏱️ Rate limit exceeded. Please wait a moment before trying again.</p>`;
    } else if (error.message?.includes('API key')) {
      return `<p style="color: #ff6b6b;">🔑 API key issue. Please check your configuration.</p>`;
    } else {
      return `<p style="color: #ff6b6b;">❌ Sorry, we couldn't generate a summary for this video. Please try again later.</p><p style="font-size: 12px; color: #666;">Error: ${error.message}</p>`;
    }
  }
}

/**
 * Simplified function to check if the model is available
 */
export async function checkGeminiAccess(): Promise<boolean> {
  try {
    const apiKey = await getSecureApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Simple test prompt to check if we can access the model
    const result = await model.generateContent("Hello");
    return !!result;
  } catch (error) {
    console.error("Error checking Gemini access:", error);
    return false;
  }
}
