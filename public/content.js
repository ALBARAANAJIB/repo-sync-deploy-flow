
// YouTube Enhancer Content Script
console.log('🚀 YouTube Enhancer content script loaded');

// Enhanced injection with better selectors
function injectSummarizationPanel() {
  console.log('🎯 Starting panel injection...');
  
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    console.log('❌ Not on a YouTube video page');
    return;
  }

  console.log('✅ On YouTube video page, proceeding with injection...');

  // Remove existing panel to prevent duplicates
  const existingPanel = document.getElementById('youtube-enhancer-panel');
  if (existingPanel) {
    console.log('⚠️ Panel already exists, removing old one...');
    existingPanel.remove();
  }

  let retryCount = 0;
  const maxRetries = 8;
  
  function attemptInjection() {
    try {
      console.log(`🔄 Attempting injection... retry ${retryCount + 1}/${maxRetries}`);
      
      // Wait for YouTube's UI to be ready with multiple selectors
      const selectors = [
        'ytd-watch-flexy #secondary #secondary-inner',
        'ytd-watch-flexy #secondary',
        '#secondary #secondary-inner',
        '#secondary',
        'ytd-secondary-column-video-list-renderer',
        '[data-content="secondary"]',
        'ytd-watch-flexy[flexy] #secondary'
      ];
      
      let secondaryColumn = null;
      for (const selector of selectors) {
        secondaryColumn = document.querySelector(selector);
        if (secondaryColumn) {
          console.log(`✅ Found secondary column with selector: ${selector}`);
          break;
        }
      }
      
      if (!secondaryColumn) {
        throw new Error('Secondary column not found');
      }

      // Create the AI summary panel
      const panel = document.createElement('div');
      panel.id = 'youtube-enhancer-panel';
      panel.style.cssText = `
        margin-bottom: 16px;
        position: relative;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease-out;
      `;
      
      panel.innerHTML = `
        <div style="
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          font-family: 'Roboto', Arial, sans-serif;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        ">
          <!-- Header -->
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
              background: #065fd4;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: 600;
            ">AI</div>
            <h3 style="
              margin: 0;
              font-size: 14px;
              font-weight: 500;
              color: #0f0f0f;
            ">Video Summary</h3>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <button id="summarize-video-btn" style="
              width: 100%;
              background: #065fd4;
              color: white;
              border: none;
              border-radius: 18px;
              padding: 10px 16px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 16px;
              font-family: inherit;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
                border-top: 2px solid #065fd4;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 12px;
              "></div>
              <div style="font-size: 12px; color: #606060;">Analyzing video content...</div>
            </div>
            
            <div id="summary-content" style="display: none;"></div>
          </div>
        </div>
        
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // Insert the panel at the top of the secondary column
      if (secondaryColumn.firstElementChild) {
        secondaryColumn.insertBefore(panel, secondaryColumn.firstElementChild);
      } else {
        secondaryColumn.appendChild(panel);
      }

      // Animate in
      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });

      // Add event listener
      const summarizeBtn = document.getElementById('summarize-video-btn');
      const loadingDiv = document.getElementById('summary-loading');
      const contentDiv = document.getElementById('summary-content');

      summarizeBtn?.addEventListener('click', async () => {
        const currentUrl = window.location.href;
        
        // Show loading
        summarizeBtn.style.display = 'none';
        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';

        try {
          await summarizeVideo(currentUrl, loadingDiv, contentDiv, summarizeBtn);
        } catch (error) {
          console.error('Summarization error:', error);
          showError(contentDiv, loadingDiv, summarizeBtn, error.message);
        }
      });
      
      console.log('🎉 YouTube enhancer panel injected successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Panel injection failed:', error.message);
      retryCount++;
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
        console.log(`⏰ Retrying in ${delay}ms...`);
        setTimeout(attemptInjection, delay);
      } else {
        console.error('🚫 Max retries reached, injection failed permanently');
      }
      return false;
    }
  }
  
  // Start injection with initial delay
  setTimeout(attemptInjection, 1000);
}

// Simplified summarization function
async function summarizeVideo(videoUrl, loadingDiv, contentDiv, summarizeBtn) {
  // Get API key from background script
  const apiKeyResponse = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getApiKey' }, resolve);
  });
  
  if (!apiKeyResponse?.apiKey) {
    throw new Error('Unable to obtain API key - service unavailable');
  }
  
  const API_KEY = apiKeyResponse.apiKey;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: "Analyze this YouTube video and provide a concise summary with key points. Focus on the main topics and important information." },
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: "video/youtube"
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 10
      }
    };

    console.log('Making API request...');

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      if (response.status === 429) {
        throw new Error('High demand detected 🌟 Please try again in a few minutes');
      }
      if (response.status === 400) {
        throw new Error('Video processing issue 🎬 Please try a different video');
      }
      if (response.status >= 500) {
        throw new Error('Server taking a break ☕ Please try again shortly');
      }
      throw new Error('Service busy 🌸 Please try again in a moment');
    }

    const data = await response.json();
    console.log('API Response received:', data);
    
    let summary = '';
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      summary = data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Processing incomplete 🤔 Please try again');
    }

    if (summary && summary.length > 50) {
      showSuccess(contentDiv, loadingDiv, summarizeBtn, summary);
    } else {
      throw new Error('Summary too brief 📝 Please try again');
    }
  } catch (error) {
    console.error('Error in summarizeVideo:', error);
    throw error;
  }
}

function showSuccess(contentDiv, loadingDiv, summarizeBtn, summary) {
  loadingDiv.style.display = 'none';
  
  contentDiv.innerHTML = `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
    ">
      <strong style="color: #111827; font-size: 13px; font-weight: 600;">Summary</strong>
      <button id="copy-summary" style="
        background: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 5px;
        padding: 5px 10px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
      ">Copy</button>
    </div>
    <div style="
      padding: 16px;
      line-height: 1.7;
      font-size: 14px;
      color: #111827;
      max-height: 400px;
      overflow-y: auto;
      word-wrap: break-word;
      white-space: pre-wrap;
    ">${summary}</div>
  `;
  
  // Add copy functionality
  const copyBtn = document.getElementById('copy-summary');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summary);
      copyBtn.textContent = 'Copied!';
      copyBtn.style.color = '#059669';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.style.color = '#374151';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  });
  
  contentDiv.style.display = 'block';
  summarizeBtn.style.display = 'block';
}

function showError(contentDiv, loadingDiv, summarizeBtn, errorMessage) {
  loadingDiv.style.display = 'none';
  
  contentDiv.innerHTML = `
    <div style="
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    ">
      <div style="font-size: 16px; margin-bottom: 8px;">😔</div>
      <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #dc2626;">Something went wrong</div>
      <div style="font-size: 12px; line-height: 1.4; color: #991b1b; margin-bottom: 12px;">${errorMessage}</div>
      <button onclick="document.getElementById('summarize-video-btn').click()" style="
        background: #f9fafb;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
      ">🔄 Try Again</button>
    </div>
  `;
  
  contentDiv.style.display = 'block';
  summarizeBtn.style.display = 'block';
}

// Initialize extension
function initializeExtension() {
  const currentUrl = window.location.href;
  console.log('🚀 Initializing extension for URL:', currentUrl);
  
  if (currentUrl.includes('youtube.com/watch')) {
    console.log('🎬 Detected video page, injecting panel...');
    injectSummarizationPanel();
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeExtension, 1000);
  });
} else {
  setTimeout(initializeExtension, 1000);
}

// Handle navigation changes
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    console.log('🔄 Navigation detected:', currentUrl, '->', window.location.href);
    currentUrl = window.location.href;
    
    // Remove existing panel
    const existingPanel = document.getElementById('youtube-enhancer-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Re-initialize after delay
    setTimeout(initializeExtension, 1500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
