
import { GoogleGenerativeAI } from '@google/genai';

const API_KEY = 'AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates a summary of a YouTube video transcript using Google's Gemini model
 * @param transcript - The transcript text to summarize
 * @param videoTitle - Optional video title for context
 * @returns A promise resolving to the generated summary
 */
export async function generateVideoSummary(transcript: string, videoTitle?: string): Promise<string> {
  try {
    console.log('Generating summary for video:', videoTitle);
    console.log('Transcript length:', transcript.length, 'characters');
    
    // Trim transcript if it's too long (Gemini has token limits)
    const maxLength = 100000; // Safe limit for model
    const trimmedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + "..." 
      : transcript;
    
    // Use the specified model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        responseMimeType: 'text/plain',
      }
    });

    // Create a summarization prompt with the transcript
    const prompt = `Generate a concise, helpful summary of this YouTube video transcript in friendly bullet point format with emojis.
Title: ${videoTitle || 'YouTube Video'}

Transcript:
${trimmedTranscript}

Format your response as:
- Include 5-7 main points with emoji bullets
- Start with a one-sentence overview
- End with a brief conclusion
- Keep the entire summary clear and easy to understand`;

    // Generate the summary
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    console.log('Summary generated successfully');
    
    return summary;
  } catch (error) {
    console.error('Error generating video summary:', error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}
