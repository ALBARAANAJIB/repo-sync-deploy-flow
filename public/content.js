
// YouTube Enhancer Content Script
console.log('🚀 YouTube Enhancer content script loaded at:', new Date().toISOString());

// Simple API key - for testing only
const GEMINI_API_KEY = 'AIzaSyA4nBJEPl7rHiTbGLjN-qGHlPLQdTUW7vA';

function injectSummarizationPanel() {
  console.log('🎯 Starting panel injection...');
  
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    console.log('❌ Not on a YouTube video page:', window.location.href);
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
  const maxRetries = 10;
  
  function attemptInjection() {
    console.log(`🔄 Attempting injection... retry ${retryCount + 1}/${maxRetries}`);
    
    try {
      // Simple selector approach
      const selectors = [
        '#secondary #secondary-inner',
        '#secondary',
        'ytd-watch-flexy #secondary',
        '[id="secondary"]'
      ];
      
      let secondaryColumn = null;
      for (const selector of selectors) {
        secondaryColumn = document.querySelector(selector);
        if (secondaryColumn) {
          console.log(`✅ Found secondary column with selector: ${selector}`, secondaryColumn);
          break;
        }
      }
      
      if (!secondaryColumn) {
        console.log('❌ Secondary column not found, available elements:', 
          document.querySelectorAll('[id*="secondary"]').length,
          document.querySelectorAll('ytd-watch-flexy').length
        );
        throw new Error('Secondary column not found');
      }

      // Create simple panel
      const panel = document.createElement('div');
      panel.id = 'youtube-enhancer-panel';
      panel.style.cssText = `
        margin-bottom: 16px;
        padding: 16px;
        background: #f0f0f0;
        border: 2px solid #065fd4;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        z-index: 9999;
        position: relative;
      `;
      
      panel.innerHTML = `
        <h3 style="margin: 0 0 12px 0; color: #065fd4;">🤖 AI Video Summary</h3>
        <button id="summarize-video-btn" style="
          background: #065fd4;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Generate Summary</button>
        <div id="summary-content" style="margin-top: 12px; display: none;"></div>
      `;

      // Insert panel
      if (secondaryColumn.firstElementChild) {
        secondaryColumn.insertBefore(panel, secondaryColumn.firstElementChild);
      } else {
        secondaryColumn.appendChild(panel);
      }

      console.log('🎉 Panel inserted successfully!');

      // Add click handler
      const btn = document.getElementById('summarize-video-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          console.log('📝 Summary button clicked!');
          const contentDiv = document.getElementById('summary-content');
          if (contentDiv) {
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = '<p style="color: #065fd4;">Summary feature working! 🎉</p>';
          }
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Panel injection failed:', error.message);
      retryCount++;
      if (retryCount < maxRetries) {
        const delay = 1000 + (retryCount * 500);
        console.log(`⏰ Retrying in ${delay}ms...`);
        setTimeout(attemptInjection, delay);
      } else {
        console.error('🚫 Max retries reached, injection failed permanently');
      }
      return false;
    }
  }
  
  // Start injection
  setTimeout(attemptInjection, 2000);
}

// Initialize
function initialize() {
  console.log('🚀 Initializing extension for URL:', window.location.href);
  
  if (window.location.href.includes('youtube.com/watch')) {
    console.log('🎬 Video page detected, injecting panel...');
    injectSummarizationPanel();
  } else {
    console.log('📺 Not on video page, waiting...');
  }
}

// Wait for page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Handle navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    console.log('🔄 Navigation detected:', lastUrl, '->', window.location.href);
    lastUrl = window.location.href;
    
    // Clean up
    const existingPanel = document.getElementById('youtube-enhancer-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Re-initialize
    setTimeout(initialize, 2000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('📋 Content script setup complete');
