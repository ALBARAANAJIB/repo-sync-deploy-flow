
/**
 * Utility functions for working with Google's Gemini AI model
 */

// The API key and model name for the Gemini AI
const GEMINI_API_KEY = "AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY";
const GEMINI_MODEL = "models/gemini-2.5-flash-preview-05-20";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`;

/**
 * Generate a summary from a video transcript using Gemini AI
 * @param transcript The video transcript text
 * @param videoTitle The title of the video
 * @returns A summary of the video content
 */
export async function generateVideoSummary(transcript: string, videoTitle: string): Promise<string> {
  try {
    // Prepare the prompt for the AI
    const prompt = `
Please summarize this YouTube video titled "${videoTitle}".

Here is the transcript:
${transcript}

Create a clear, concise summary with 3-5 main bullet points highlighting the key takeaways.
Format your response in HTML with bullet points using <ul> and <li> tags. Make it easily scannable.
`;

    // Prepare the request body
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        topP: 0.8,
        topK: 40
      }
    };

    // Make the request to Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

/**
 * Extract video ID from a YouTube URL
 * @param url YouTube video URL
 * @returns The video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
  try {
    // Handle youtu.be format
    if (url.includes('youtu.be')) {
      const parts = url.split('/');
      return parts[parts.length - 1].split('?')[0];
    }
    
    // Handle standard youtube.com format
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    // Direct ID input
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

/**
 * Fetch video metadata from YouTube using video ID
 * This allows us to get the thumbnail URL and other metadata
 * @param videoId YouTube video ID
 * @returns Video metadata including thumbnail URL
 */
export async function fetchVideoMetadata(videoId: string): Promise<any> {
  try {
    // For production use, you would fetch this from YouTube API
    // This is a simple implementation that uses oEmbed to get basic metadata
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    // Return basic object with thumbnail URL constructed directly
    return {
      title: 'YouTube Video',
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}

/**
 * Modify the background.js script to improve transcript extraction
 * This function simulates what changes we need to make to background.js
 * Since we can't modify background.js directly in this context
 */
export function improveTranscriptExtraction() {
  // Ideally, this would modify background.js with better transcript extraction logic
  // Here are the key improvements needed:
  // 1. More robust transcript selector patterns
  // 2. Better error handling for transcript extraction
  // 3. Fallback mechanisms using caption tracks API
  
  console.log('Transcript extraction improvements are needed in background.js');
  
  // Implementation would be done directly in background.js
}
