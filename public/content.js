
// YouTube Enhancer Content Script
console.log('🚀 YouTube Enhancer content script loaded');

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
      <button id="summarize-video-btn" style="
        background: #ff0000;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">Generate Summary</button>
      <div id="summary-content" style="
        margin-top: 12px; 
        display: none;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border: 1px solid #ddd;
      "></div>
    `;

    // Insert at the top of secondary column
    secondary.insertBefore(panel, secondary.firstChild);

    // Add click handler
    const btn = document.getElementById('summarize-video-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        console.log('📝 Summary button clicked!');
        const contentDiv = document.getElementById('summary-content');
        if (contentDiv) {
          contentDiv.style.display = 'block';
          contentDiv.innerHTML = `
            <h4 style="margin: 0 0 8px 0; color: #333;">Video Summary:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>This is a demonstration of the AI summary feature</li>
              <li>The panel has been successfully injected into the page</li>
              <li>Real summarization would use the Gemini API</li>
            </ul>
          `;
        }
      });
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
