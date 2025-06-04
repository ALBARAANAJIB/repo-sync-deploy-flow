
// YouTube Enhancer Content Script
console.log('🚀 YouTube Enhancer content script loaded');

// Import our Gemini utilities (this will be bundled)
let generateVideoSummary, extractVideoId;

// Load the utilities dynamically
try {
  // In a real extension, these would be imported properly
  // For now, we'll implement basic versions here
  generateVideoSummary = async (options = {}) => {
    // This is a placeholder - the actual implementation would use the Gemini API
    console.log('🤖 Generating summary...', options);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (options.summaryType === 'detailed') {
      return `
        <h4 style="margin: 0 0 8px 0; color: #333;">Detailed Video Analysis:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>This is a comprehensive analysis of the video content</li>
          <li>Detailed examination of key topics and themes</li>
          <li>In-depth discussion of main arguments presented</li>
          <li>Analysis of supporting evidence and examples</li>
          <li>Evaluation of conclusions and implications</li>
          <li>Assessment of target audience and practical applications</li>
          <li>Summary of actionable takeaways and recommendations</li>
        </ul>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #888;">Generated with Gemini AI • Detailed Analysis</p>
      `;
    } else {
      return `
        <h4 style="margin: 0 0 8px 0; color: #333;">Quick Summary:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>This is a demonstration of the AI summary feature</li>
          <li>The panel has been successfully injected into the page</li>
          <li>Quick summary provides key takeaways efficiently</li>
          <li>Real summarization powered by Gemini AI</li>
        </ul>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #888;">Generated with Gemini AI • Quick Summary</p>
      `;
    }
  };
  
  extractVideoId = (url) => {
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
    return null;
  };
} catch (error) {
  console.warn('Could not load Gemini utilities:', error);
}

// Simple, reliable injection function
function injectSummarizationPanel() {
  console.log('🎯 Starting panel injection...');
  
  // Remove existing panel first
  const existingPanel = document.getElementById('youtube-enhancer-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  // Wait for page to be ready and find the right spot
  function attemptInjection() {
    console.log('🔄 Attempting to inject panel...');
    
    // Look for the secondary column (sidebar)
    const secondary = document.querySelector('#secondary #secondary-inner') || 
                     document.querySelector('#secondary') ||
                     document.querySelector('ytd-watch-flexy #secondary');
    
    if (!secondary) {
      console.log('❌ Secondary column not found, retrying in 2s...');
      setTimeout(attemptInjection, 2000);
      return;
    }

    console.log('✅ Found secondary column, injecting panel...');

    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'youtube-enhancer-panel';
    panel.style.cssText = `
      margin-bottom: 16px;
      padding: 16px;
      background: #f9f9f9;
      border: 2px solid #ff0000;
      border-radius: 8px;
      font-family: 'Roboto', Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #ff0000; font-size: 16px; font-weight: 500;">
        🤖 AI Video Summary
      </h3>
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button id="quick-summary-btn" style="
          background: #ff0000;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          flex: 1;
        ">Quick Summary</button>
        <button id="detailed-summary-btn" style="
          background: #666;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          flex: 1;
        ">Detailed Analysis</button>
      </div>
      <div id="summary-content" style="
        margin-top: 12px; 
        display: none;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border: 1px solid #ddd;
        min-height: 60px;
      "></div>
      <div id="loading-indicator" style="
        display: none;
        text-align: center;
        padding: 20px;
        color: #666;
      ">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #ff0000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Generating summary...</p>
      </div>
    `;

    // Add CSS animation for loading spinner
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Insert at the top of secondary column
    secondary.insertBefore(panel, secondary.firstChild);

    // Add click handlers for both buttons
    const quickBtn = document.getElementById('quick-summary-btn');
    const detailedBtn = document.getElementById('detailed-summary-btn');
    const contentDiv = document.getElementById('summary-content');
    const loadingDiv = document.getElementById('loading-indicator');

    async function handleSummaryRequest(summaryType) {
      console.log(`📝 ${summaryType} summary button clicked!`);
      
      // Show loading state
      contentDiv.style.display = 'none';
      loadingDiv.style.display = 'block';
      
      // Update button states
      quickBtn.style.background = summaryType === 'quick' ? '#ff0000' : '#666';
      detailedBtn.style.background = summaryType === 'detailed' ? '#ff0000' : '#666';
      
      try {
        // Get current video info
        const videoId = extractVideoId(window.location.href);
        const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent || 
                     document.querySelector('h1 yt-formatted-string')?.textContent || '';
        const channel = document.querySelector('ytd-channel-name a')?.textContent || 
                       document.querySelector('#owner-name a')?.textContent || '';
        
        console.log('🎬 Video info:', { videoId, title, channel });
        
        // Generate summary
        const summary = await generateVideoSummary({
          videoId,
          videoTitle: title,
          channelTitle: channel,
          summaryType
        });
        
        // Hide loading and show content
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        contentDiv.innerHTML = summary;
        
      } catch (error) {
        console.error('❌ Error generating summary:', error);
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        contentDiv.innerHTML = `
          <p style="color: #ff6b6b;">❌ Failed to generate summary. Please try again.</p>
          <p style="font-size: 12px; color: #666;">Error: ${error.message}</p>
        `;
      }
    }

    if (quickBtn) {
      quickBtn.addEventListener('click', () => handleSummaryRequest('quick'));
    }
    
    if (detailedBtn) {
      detailedBtn.addEventListener('click', () => handleSummaryRequest('detailed'));
    }

    console.log('🎉 Panel injection successful!');
  }

  // Start injection attempt
  setTimeout(attemptInjection, 1000);
}

// Initialize on video pages
function init() {
  if (window.location.href.includes('youtube.com/watch')) {
    console.log('🎬 Video page detected, injecting panel...');
    injectSummarizationPanel();
  }
}

// Wait for page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle navigation changes
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    console.log('🔄 Navigation detected');
    lastUrl = window.location.href;
    setTimeout(init, 1000);
  }
}).observe(document.body, { childList: true, subtree: true });

console.log('📋 Content script setup complete');
