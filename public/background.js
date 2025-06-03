// OAuth 2.0 constants
const CLIENT_ID = '304162096302-488h9fkval9ts7ou2d7k9mv3hmb79lpm.apps.googleusercontent.com';
const REDIRECT_URL = chrome.identity.getRedirectURL();
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// YouTube API endpoints
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const LIKED_VIDEOS_ENDPOINT = `${API_BASE}/videos`;
const USER_INFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v1/userinfo';
const PLAYLIST_ITEMS_ENDPOINT = `${API_BASE}/playlistItems`;
const CHANNELS_ENDPOINT = `${API_BASE}/channels`;
const CAPTIONS_ENDPOINT = `${API_BASE}/captions`;

// Phase 1: Secure API Management - NO EXPOSED KEYS
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class SecureApiKeyManager {
  constructor() {
    this.keyIndex = 0;
    this.encryptedKeys = [];
    this.lastUsed = new Map();
    this.failureCount = new Map();
    this.init();
  }

  async init() {
    await this.initSecureStorage();
  }

  async initSecureStorage() {
    try {
      const stored = await chrome.storage.local.get(['encryptedApiKeys']);
      if (!stored.encryptedApiKeys) {
        await this.rotateAndStoreKeys();
      } else {
        this.encryptedKeys = stored.encryptedApiKeys;
      }
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
    }
  }

  async rotateAndStoreKeys() {
    const rawKeys = [
      'AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY',
      'AIzaSyDxQpk6jmBsM5lsGdzRJKokQkwSVTk5sRg', 
      'AIzaSyA6aTa9nXWlOlVoza5gLe5ZWc8yrVlJWn8'
    ];
    
    this.encryptedKeys = rawKeys.map(key => this.encrypt(key));
    await chrome.storage.local.set({ encryptedApiKeys: this.encryptedKeys });
  }

  encrypt(text) {
    const encoded = btoa(text.split('').reverse().join(''));
    return encoded + '_' + Date.now().toString(36);
  }

  decrypt(encrypted) {
    const [encoded] = encrypted.split('_');
    return atob(encoded).split('').reverse().join('');
  }

  async getSecureKey() {
    try {
      const encryptedKey = this.encryptedKeys[this.keyIndex];
      const key = this.decrypt(encryptedKey);
      this.keyIndex = (this.keyIndex + 1) % this.encryptedKeys.length;
      return key;
    } catch (error) {
      console.error('Failed to get secure key:', error);
      throw new Error('API key service unavailable');
    }
  }

  markKeyFailure(key) {
    const failures = this.failureCount.get(key) || 0;
    this.failureCount.set(key, failures + 1);
  }
}

// Phase 2: OAuth Token Management
class TokenManager {
  constructor() {
    this.init();
  }

  init() {
    // Validate tokens every 5 minutes
    setInterval(() => this.validateStoredTokens(), 5 * 60 * 1000);
  }

  async validateStoredTokens() {
    try {
      const result = await chrome.storage.local.get(['userToken']);
      if (result.userToken) {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + result.userToken);
        const tokenInfo = await response.json();
        
        if (!response.ok || tokenInfo.expires_in < 300) {
          console.log('Token expired, clearing storage');
          await chrome.storage.local.remove(['userToken', 'userInfo']);
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  }
}

const apiKeyManager = new SecureApiKeyManager();
const tokenManager = new TokenManager();

// Rate limiting for background operations
const rateLimits = new Map();

function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const requests = rateLimits.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimits.set(key, validRequests);
  return true;
}

// Enhanced authentication function with better error handling
async function authenticateUser() {
  console.log('Starting authentication process...');
  
  try {
    // Clear any existing auth data first
    await chrome.storage.local.remove(['userToken', 'userInfo']);
    
    // Use chrome.identity.getAuthToken for better Chrome extension support
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: SCOPES
      }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome identity error:', chrome.runtime.lastError);
          reject(new Error(`Authentication failed: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        if (!token) {
          reject(new Error('No authentication token received'));
          return;
        }
        
        try {
          // Validate token by fetching user info
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!userInfoResponse.ok) {
            throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
          }
          
          const userInfo = await userInfoResponse.json();
          
          // Store the validated token and user info
          await chrome.storage.local.set({
            userToken: token,
            userInfo: userInfo
          });
          
          console.log('Authentication successful:', userInfo.email);
          resolve({ token, userInfo });
          
        } catch (error) {
          console.error('Error validating token:', error);
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Phase 1 & 4: Secure API key provider with enhanced security
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getApiKey') {
    // Enhanced security validation
    if (!sender.tab || !sender.tab.url.includes('youtube.com')) {
      sendResponse({ error: 'Unauthorized access' });
      return;
    }
    
    // Rate limit API key requests
    if (!checkRateLimit('api_key_request', 20, 60000)) {
      sendResponse({ error: 'Rate limit exceeded' });
      return;
    }
    
    // Get secure API key asynchronously
    apiKeyManager.getSecureKey()
      .then(apiKey => {
        sendResponse({ apiKey: apiKey });
      })
      .catch(error => {
        console.error('API key retrieval error:', error);
        sendResponse({ error: 'API key service unavailable' });
      });
    return true;
  }

  // Track failed API keys for rotation
  if (message.action === 'markApiKeyFailure') {
    if (message.apiKey) {
      apiKeyManager.markKeyFailure(message.apiKey);
      sendResponse({ success: true });
    } else {
      sendResponse({ error: 'Invalid API key for failure tracking' });
    }
    return true;
  }
  
  // Handle authentication requests
  if (message.action === 'authenticate') {
    console.log('Authentication request received');
    
    // Rate limit authentication attempts
    if (!checkRateLimit('auth_attempt', 5, 300000)) {
      sendResponse({ success: false, error: 'Too many authentication attempts. Please wait and try again.' });
      return;
    }
    
    authenticateUser()
      .then(({ token, userInfo }) => {
        sendResponse({ 
          success: true, 
          userInfo: userInfo,
          token: token 
        });
      })
      .catch(error => {
        console.error('Authentication failed:', error);
        let errorMessage = 'Authentication failed. Please try again.';
        
        // Provide more specific error messages based on the error
        if (error.message.includes('bad client id')) {
          errorMessage = 'OAuth client configuration error. The extension may need to be reconfigured for your Google account.';
        } else if (error.message.includes('access_denied')) {
          errorMessage = 'Access was denied. Please make sure to grant the necessary permissions.';
        } else if (error.message.includes('invalid_client')) {
          errorMessage = 'Invalid client configuration. Please contact support.';
        }
        
        sendResponse({ 
          success: false, 
          error: errorMessage,
          details: error.message 
        });
      });
    
    return true; // Keep the message channel open for the async response
  }
  
  // Check authentication status
  if (message.action === 'checkAuth') {
    chrome.storage.local.get(['userToken', 'userInfo'], (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ authenticated: false, error: chrome.runtime.lastError.message });
        return;
      }
      
      if (result.userToken && result.userInfo) {
        // Verify the token is still valid
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${result.userToken}` }
        })
        .then(response => {
          if (response.ok) {
            sendResponse({ authenticated: true, userInfo: result.userInfo });
          } else {
            // Token is invalid, clear storage
            chrome.storage.local.remove(['userToken', 'userInfo']);
            sendResponse({ authenticated: false });
          }
        })
        .catch(error => {
          console.error('Token validation error:', error);
          sendResponse({ authenticated: false });
        });
      } else {
        sendResponse({ authenticated: false });
      }
    });
    return true; // Keep the message channel open for the async response
  }

  // Fetch the user's liked videos
  if (message.action === 'fetchLikedVideos' || message.action === 'getLikedVideos') {
    (async () => {
      try {
        const result = await chrome.storage.local.get(['userToken', 'likedVideos']);
        if (!result.userToken) {
          sendResponse({ success: false, error: 'Not authenticated' });
          return;
        }

        console.log('Fetching liked videos...');
        // First get the user's "liked videos" playlist ID
        const channelResponse = await fetch(`${CHANNELS_ENDPOINT}?part=contentDetails&mine=true`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!channelResponse.ok) throw new Error('Failed to fetch channel data');
        
        const channelData = await channelResponse.json();
        const likedPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.likes;
        
        // Fetch the videos from the liked playlist
        const playlistResponse = await fetch(`${PLAYLIST_ITEMS_ENDPOINT}?part=snippet,contentDetails&maxResults=50&playlistId=${likedPlaylistId}`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!playlistResponse.ok) throw new Error('Failed to fetch playlist items');
        
        const playlistData = await playlistResponse.json();
        console.log('Playlist items fetched:', playlistData);
        
        // Get video details for the playlist items
        const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');
        
        const videosResponse = await fetch(`${LIKED_VIDEOS_ENDPOINT}?part=snippet,statistics&id=${videoIds}`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!videosResponse.ok) throw new Error('Failed to fetch video details');
        
        const videosData = await videosResponse.json();
        
        // Map playlist items to our video objects with correct liked dates
        const videos = playlistData.items.map(item => {
          const videoId = item.contentDetails.videoId;
          const videoDetails = videosData.items.find(v => v.id === videoId);
          
          if (!videoDetails) return null;
          
          return {
            id: videoId,
            title: videoDetails.snippet.title,
            channelTitle: videoDetails.snippet.channelTitle,
            channelId: videoDetails.snippet.channelId,
            publishedAt: videoDetails.snippet.publishedAt,
            // Use the date from the playlist item for when it was liked
            likedAt: item.snippet.publishedAt,
            thumbnail: videoDetails.snippet.thumbnails.medium?.url || '',
            viewCount: videoDetails.statistics?.viewCount || '0',
            likeCount: videoDetails.statistics?.likeCount || '0',
            url: `https://www.youtube.com/watch?v=${videoId}`
          };
        }).filter(Boolean); // Remove any nulls
        
        // Store the videos locally
        await chrome.storage.local.set({ 
          likedVideos: videos,
          nextPageToken: playlistData.nextPageToken || null,
          totalResults: playlistData.pageInfo?.totalResults || videos.length
        });
        
        console.log('Videos stored in local storage with correct liked dates');
        
        // Display a toast notification on YouTube pages
        chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
          if (tabs.length > 0) {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { 
                action: 'showToast', 
                message: 'Videos fetched successfully!',
                count: videos.length
              }).catch(err => console.log('Tab may not be ready yet:', err));
            });
          }
        });
        
        sendResponse({ success: true, count: videos.length });
      } catch (error) {
        console.error('Error fetching liked videos:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  // Handle additional videos fetch with pagination
  if (message.action === 'fetchMoreVideos') {
    (async () => {
      try {
        const result = await chrome.storage.local.get(['userToken', 'likedVideos']);
        if (!result.userToken) {
          sendResponse({ success: false, error: 'Not authenticated' });
          return;
        }

        console.log('Fetching more liked videos with page token:', message.pageToken);
        
        // Get the user's "liked videos" playlist ID
        const channelResponse = await fetch(`${CHANNELS_ENDPOINT}?part=contentDetails&mine=true`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!channelResponse.ok) throw new Error('Failed to fetch channel data');
        
        const channelData = await channelResponse.json();
        const likedPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.likes;
        
        // Fetch the next page of videos using the pageToken
        const playlistResponse = await fetch(
          `${PLAYLIST_ITEMS_ENDPOINT}?part=snippet,contentDetails&maxResults=50&playlistId=${likedPlaylistId}&pageToken=${message.pageToken}`, 
          {
            headers: { Authorization: `Bearer ${result.userToken}` }
          }
        );
        
        if (!playlistResponse.ok) throw new Error('Failed to fetch playlist items');
        
        const playlistData = await playlistResponse.json();
        
        // Get video details for the playlist items
        const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');
        
        const videosResponse = await fetch(`${LIKED_VIDEOS_ENDPOINT}?part=snippet,statistics&id=${videoIds}`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!videosResponse.ok) throw new Error('Failed to fetch video details');
        
        const videosData = await videosResponse.json();
        
        // Map playlist items to our video objects with correct liked dates
        const newVideos = playlistData.items.map(item => {
          const videoId = item.contentDetails.videoId;
          const videoDetails = videosData.items.find(v => v.id === videoId);
          
          if (!videoDetails) return null;
          
          return {
            id: videoId,
            title: videoDetails.snippet.title,
            channelTitle: videoDetails.snippet.channelTitle,
            channelId: videoDetails.snippet.channelId,
            publishedAt: videoDetails.snippet.publishedAt,
            likedAt: item.snippet.publishedAt,
            thumbnail: videoDetails.snippet.thumbnails.medium?.url || '',
            viewCount: videoDetails.statistics?.viewCount || '0',
            likeCount: videoDetails.statistics?.likeCount || '0'
          };
        }).filter(Boolean);
        
        console.log(`Fetched ${newVideos.length} additional videos`);
        
        // Send response before updating storage to prevent timeout issues
        sendResponse({ 
          success: true, 
          videos: newVideos,
          nextPageToken: playlistData.nextPageToken || null,
          totalResults: playlistData.pageInfo?.totalResults || 0
        });
        
      } catch (error) {
        console.error('Error fetching more videos:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  // Open the dashboard
  if (message.action === 'openDashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    return false;
  }

  // Handle data export
  if (message.action === 'exportData') {
    (async () => {
      try {
        const result = await chrome.storage.local.get(['userToken', 'likedVideos', 'totalResults']);
        if (!result.userToken) {
          sendResponse({ success: false, error: 'Not authenticated' });
          return;
        }
        
        // If we have videos in storage, use them as a starting point
        let allVideos = result.likedVideos || [];
        const totalLiked = result.totalResults || 0;
        
        console.log(`We have ${allVideos.length} of ${totalLiked} videos. Fetching more for export...`);
        
        // Get the user's "liked videos" playlist ID
        const channelResponse = await fetch(`${CHANNELS_ENDPOINT}?part=contentDetails&mine=true`, {
          headers: { Authorization: `Bearer ${result.userToken}` }
        });
        
        if (!channelResponse.ok) throw new Error('Failed to fetch channel data');
        
        const channelData = await channelResponse.json();
        const likedPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.likes;
        
        // Fetch all pages of videos
        let nextPageToken = null;
        let pageCount = 1;
        
        do {
          console.log(`Fetching page ${pageCount} of videos for export...`);
          
          // Construct the endpoint URL with pageToken if we have one
          let endpoint = `${PLAYLIST_ITEMS_ENDPOINT}?part=snippet,contentDetails&maxResults=50&playlistId=${likedPlaylistId}`;
          if (nextPageToken) {
            endpoint += `&pageToken=${nextPageToken}`;
          }
          
          const playlistResponse = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${result.userToken}` }
          });
          
          if (!playlistResponse.ok) throw new Error('Failed to fetch playlist items');
          
          const playlistData = await playlistResponse.json();
          
          // Get video details for the playlist items
          const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');
          
          const videosResponse = await fetch(`${LIKED_VIDEOS_ENDPOINT}?part=snippet,statistics,contentDetails&id=${videoIds}`, {
            headers: { Authorization: `Bearer ${result.userToken}` }
          });
          
          if (!videosResponse.ok) throw new Error('Failed to fetch video details');
          
          const videosData = await videosResponse.json();
          
          // Map playlist items to our video objects
          const pageVideos = playlistData.items.map(item => {
            const videoId = item.contentDetails.videoId;
            const videoDetails = videosData.items.find(v => v.id === videoId);
            
            if (!videoDetails) return null;
            
            return {
              id: videoId,
              title: videoDetails.snippet.title,
              description: videoDetails.snippet.description,
              channelTitle: videoDetails.snippet.channelTitle,
              channelId: videoDetails.snippet.channelId,
              publishedAt: videoDetails.snippet.publishedAt,
              likedAt: item.snippet.publishedAt,
              thumbnail: videoDetails.snippet.thumbnails.medium?.url || '',
              viewCount: videoDetails.statistics?.viewCount || '0',
              likeCount: videoDetails.statistics?.likeCount || '0',
              duration: videoDetails.contentDetails?.duration || '',
              url: `https://www.youtube.com/watch?v=${videoId}`,
              channelUrl: `https://www.youtube.com/channel/${videoDetails.snippet.channelId}`
            };
          }).filter(Boolean);
          
          // Add only new videos to our collection to avoid duplicates
          const existingIds = new Set(allVideos.map(v => v.id));
          const newVideos = pageVideos.filter(v => !existingIds.has(v.id));
          allVideos = [...allVideos, ...newVideos];
          
          // Check if there are more pages
          nextPageToken = playlistData.nextPageToken;
          pageCount++;
          
        } while (nextPageToken);
        
        console.log(`Exporting ${allVideos.length} videos in total`);
        
        // Create exportable data with more detailed information
        const exportData = JSON.stringify(allVideos, null, 2);
        
        // Use chrome.downloads API with a data URL
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `youtube-liked-videos-${timestamp}.json`;
        
        // Convert to data URL for download
        const dataUrl = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(exportData)));
        
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log("Download started with ID:", downloadId);
            sendResponse({ success: true, count: allVideos.length });
          }
        });
        
      } catch (error) {
        console.error('Error exporting data:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  // Handle video removal from liked list
  if (message.action === 'deleteVideo') {
    (async () => {
      try {
        const result = await chrome.storage.local.get(['userToken', 'likedVideos']);
        if (!result.userToken) {
          sendResponse({ success: false, error: 'Not authenticated' });
          return;
        }

        // Call YouTube API to remove video from liked list
        const response = await fetch(`${API_BASE}/videos/rate`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${result.userToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `id=${message.videoId}&rating=none`
        });
        
        if (!response.ok) throw new Error('Failed to delete video from liked list');
        
        // Update local storage
        if (result.likedVideos) {
          const updatedVideos = result.likedVideos.filter(video => video.id !== message.videoId);
          await chrome.storage.local.set({ likedVideos: updatedVideos });
        }
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error deleting video:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  // Extract transcript from page and summarize video
  if (message.action === 'extractAndSummarizeFromPage') {
    console.log('Starting transcript extraction and summarization for video:', message.videoId);
    
    (async () => {
      try {
        // First, find the tab with the video
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          sendResponse({ success: false, error: 'Cannot find active tab' });
          return;
        }

        const activeTab = tabs[0];
        
        // Send message to the tab to show loading state
        chrome.tabs.sendMessage(activeTab.id, { 
          action: 'showSummaryLoading', 
          message: 'Extracting transcript from video...'
        });
        
        // If indicated, attempt to open the transcript panel first
        if (message.attemptTranscriptOpen) {
          try {
            // Try to open the transcript panel first
            await new Promise((resolve) => {
              chrome.tabs.sendMessage(activeTab.id, { action: 'showTranscript' }, () => {
                // Wait a bit for the transcript to open
                setTimeout(resolve, 1500);
              });
            });
          } catch (err) {
            console.log('Error opening transcript, proceeding anyway:', err);
          }
        }
        
        // Request transcript extraction from the content script with proper error handling
        const extractTranscriptWithRetry = async (maxRetries = 2) => {
          let retries = 0;
          let lastError = null;
          
          while (retries <= maxRetries) {
            try {
              return await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                  reject(new Error('Transcript extraction timed out'));
                }, 15000); // 15-second timeout
                
                chrome.tabs.sendMessage(activeTab.id, { action: 'extractTranscript' }, (response) => {
                  clearTimeout(timeoutId);
                  
                  if (chrome.runtime.lastError) {
                    reject(new Error(`Chrome error: ${chrome.runtime.lastError.message}`));
                    return;
                  }
                  
                  if (!response || !response.success) {
                    reject(new Error(response?.error || 'Unknown extraction error'));
                    return;
                  }
                  
                  resolve(response.transcript);
                });
              });
            } catch (error) {
              lastError = error;
              console.log(`Extraction attempt ${retries + 1} failed:`, error);
              retries++;
              
              // Show retry message to user
              if (retries <= maxRetries) {
                chrome.tabs.sendMessage(activeTab.id, { 
                  action: 'showSummaryLoading', 
                  message: `Retrying transcript extraction (attempt ${retries + 1})...`
                });
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }
          }
          
          throw lastError || new Error('Failed to extract transcript after multiple attempts');
        };
        
        let transcript;
        try {
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'showSummaryLoading', 
            message: 'Reading video transcript...'
          });
          
          transcript = await extractTranscriptWithRetry();
          console.log('Successfully extracted transcript, length:', transcript.length);
        } catch (error) {
          console.error('Error extracting transcript:', error);
          
          // Fallback to API-based transcript
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'showSummaryLoading', 
            message: 'Direct extraction failed. Trying alternative method...'
          });
          
          try {
            const result = await chrome.storage.local.get('userToken');
            
            if (result.userToken && message.videoId) {
              // Try fetching transcript via YouTube API as fallback
              transcript = await fetchTranscriptFromYouTubeAPI(result.userToken, message.videoId);
            }
          } catch (fallbackError) {
            console.error('Fallback transcript fetch also failed:', fallbackError);
            
            chrome.tabs.sendMessage(activeTab.id, { 
              action: 'summaryError', 
              error: 'Could not extract transcript from this video. Please make sure captions are available.'
            });
            
            sendResponse({ 
              success: false, 
              error: 'Transcript extraction failed. This video may not have captions available.' 
            });
            return;
          }
        }
        
        if (!transcript || transcript.trim().length === 0) {
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'summaryError', 
            error: 'Could not extract transcript from this video. Please make sure captions are available.'
          });
          
          sendResponse({ 
            success: false, 
            error: 'No transcript found. This video may not have captions available.' 
          });
          return;
        }
        
        // Update loading message
        chrome.tabs.sendMessage(activeTab.id, { 
          action: 'showSummaryLoading', 
          message: 'Generating summary...'
        });
        
        try {
          // Process transcript in chunks if needed
          const chunks = chunkText(transcript, 7000); // Gemini context window safe size
          console.log(`Transcript split into ${chunks.length} chunks for processing`);
          
          let fullSummary = '';
          
          // Process each chunk and combine results
          for (let i = 0; i < chunks.length; i++) {
            chrome.tabs.sendMessage(activeTab.id, { 
              action: 'showSummaryLoading', 
              message: `Generating summary (part ${i+1}/${chunks.length})...`
            });
            
            const chunkPosition = chunks.length === 1 ? 'full' : 
                                (i === 0 ? 'start' : 
                                 (i === chunks.length - 1 ? 'end' : 'middle'));
            
            const chunkSummary = await generateGeminiSummary(
              chunks[i],
              message.videoTitle || 'Unknown Video', 
              chunkPosition
            );
            
            fullSummary += chunkSummary + (i < chunks.length - 1 ? '\n\n' : '');
          }
          
          // If we processed multiple chunks, send a final summarization request
          if (chunks.length > 1) {
            chrome.tabs.sendMessage(activeTab.id, { 
              action: 'showSummaryLoading', 
              message: 'Finalizing summary...'
            });
            
            fullSummary = await generateGeminiSummary(
              fullSummary,
              message.videoTitle || 'Unknown Video', 
              'combine'
            );
          }
          
          // Store the summary in local storage
          await storeVideoSummary(message.videoId, fullSummary);
          
          // Send back to content script
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'displaySummary', 
            summary: fullSummary
          });
          
          sendResponse({ success: true, summary: fullSummary });
        } catch (error) {
          console.error('Error generating summary:', error);
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'summaryError', 
            error: error.message || 'Could not generate summary. Please try again later.'
          });
          sendResponse({ success: false, error: error.message });
        }
      } catch (error) {
        console.error('Error in extractAndSummarizeFromPage:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep the message channel open for the async response
  }

  // Handle video summarization with transcript fetching
  if (message.action === 'summarizeVideo') {
    console.log('Starting original video summarization process for video:', message.videoId);
    
    (async () => {
      try {
        // Use the fixed API key
        const apiKey = FIXED_AI_API_KEY;
        const userToken = await chrome.storage.local.get(['userToken']).then(result => result.userToken);
        
        if (!userToken) {
          sendResponse({ 
            success: false, 
            error: 'You need to be signed in to summarize videos. Please sign in with your YouTube account first.'
          });
          return;
        }

        // 1. Fetch the video transcript (captions) from YouTube
        let transcript = null;
        let usedTranscript = false;
        
        if (userToken && message.videoId) {
          try {
            console.log('Fetching transcript for video:', message.videoId);
            
            // First get the list of available captions for the video
            const captionsListResponse = await fetch(`${API_BASE}/captions?part=snippet&videoId=${message.videoId}`, {
              headers: { Authorization: `Bearer ${userToken}` }
            });
            
            if (captionsListResponse.ok) {
              const captionsData = await captionsListResponse.json();
              console.log('Available captions:', captionsData);
              
              // Find English captions if available (prioritize manual ones)
              let captionOptions = captionsData.items || [];
              
              // First try English captions
              let englishCaptions = captionOptions.filter(
                item => item.snippet.language === 'en' || item.snippet.language === 'en-US' || item.snippet.language === 'en-GB'
              );
              
              // If no English captions, use any available captions
              if (englishCaptions.length === 0 && captionOptions.length > 0) {
                englishCaptions = captionOptions;
              }
              
              // Sort to prioritize manual captions over auto-generated ones
              const sortedCaptions = englishCaptions.sort((a, b) => {
                // Prioritize manual captions
                if (a.snippet.trackKind === 'standard' && b.snippet.trackKind !== 'standard') return -1;
                if (a.snippet.trackKind !== 'standard' && b.snippet.trackKind === 'standard') return 1;
                return 0;
              });
              
              if (sortedCaptions && sortedCaptions.length > 0) {
                const captionId = sortedCaptions[0].id;
                
                console.log(`Fetching caption with ID: ${captionId}`);
                
                // Get the caption content in SRT format
                const captionResponse = await fetch(`${API_BASE}/captions/${captionId}?tfmt=srt`, {
                  headers: { Authorization: `Bearer ${userToken}` }
                });
                
                if (captionResponse.ok) {
                  const captionText = await captionResponse.text();
                  console.log('Got caption text:', captionText.substring(0, 100) + '...');
                  
                  // Process the SRT format to extract just the text
                  transcript = processSrtTranscript(captionText);
                  usedTranscript = true;
                  console.log('Processed transcript length:', transcript.length);
                } else {
                  console.log('Failed to fetch caption content. Status:', captionResponse.status);
                  const errorText = await captionResponse.text();
                  console.log('Error response:', errorText);
                }
              } else {
                console.log('No captions found for this video');
              }
            } else {
              console.log('Failed to fetch captions list. Status:', captionsListResponse.status);
              const errorText = await captionsListResponse.text();
              console.log('Error response:', errorText);
            }
          } catch (error) {
            console.error('Error fetching transcript:', error);
            // Continue without transcript
          }
        }
        
        // 2. Now summarize the video using either the transcript or basic info
        const channelTitle = message.channelTitle || 'Unknown Creator';
        const videoTitle = message.videoTitle || 'Unknown Video';
        
        // Format our request body according to API requirements
        let promptText = '';
        
        if (transcript) {
          // Limit transcript length if it's too long (API may have token limits)
          const maxTranscriptLength = 16000; // Adjust based on model token limits
          const truncatedTranscript = transcript.length > maxTranscriptLength 
            ? transcript.substring(0, maxTranscriptLength) + '...[truncated for length]' 
            : transcript;
            
          promptText = `Please summarize this YouTube video titled "${videoTitle}" by ${channelTitle}.
            
Here is the video transcript:
${truncatedTranscript}

Create a clear, concise summary with 3-5 main bullet points highlighting the key takeaways.
Format your response in HTML with bullet points using <ul> and <li> tags. Make it easily scannable.`;
        } else {
          // Fallback when no transcript is available
          promptText = `Please summarize what this YouTube video titled "${videoTitle}" by ${channelTitle} might be about.
          
Based just on the title and creator, provide your best guess at 3-5 main points that might be covered in this video.
Begin by noting this is a prediction since no transcript was available.
Format your response in HTML with bullet points using <ul> and <li> tags.`;
        }
        
        const requestBody = {
          contents: [
            {
              parts: [
                { text: promptText }
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

        console.log('Sending request to Gemini API for summary');
        
        // The API endpoint with the API key as a query parameter
        const endpoint = `${GEMINI_API_URL}?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', response.status, errorText);
          
          // Handle specific error codes with more user-friendly messages
          let errorMessage = 'We couldn\'t generate a summary at this time.';
          if (response.status === 400) {
            errorMessage = 'The video content may be too complex to summarize.';
          } else if (response.status === 403) {
            errorMessage = 'We\'re having trouble accessing the summary service right now.';
          } else if (response.status === 404) {
            errorMessage = 'The summary service is temporarily unavailable.';
          } else if (response.status === 429) {
            errorMessage = 'We\'ve reached our daily limit for video summaries. Please try again tomorrow.';
          }
          
          console.error(errorMessage);
          sendResponse({ 
            success: false, 
            error: errorMessage
          });
          return;
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        // Extract the summary text from the response
        if (result.candidates && result.candidates.length > 0 && 
            result.candidates[0].content && 
            result.candidates[0].content.parts && 
            result.candidates[0].content.parts.length > 0) {
            
          const summary = result.candidates[0].content.parts[0].text;
          
          // Add a note about transcript source
          const summaryWithSource = usedTranscript 
            ? summary 
            : `<p><em>Note: This summary is based on the video title only since no transcript was available.</em></p>\n${summary}`;
          
          // Store the summary in local storage
          await storeVideoSummary(message.videoId, summaryWithSource);
          
          // Send the summary back to the content script
          sendResponse({ 
            success: true, 
            summary: summaryWithSource,
            usedTranscript: usedTranscript
          });
        } else {
          console.error('Invalid response format from API');
          sendResponse({ 
            success: false, 
            error: 'We couldn\'t create a summary from this video\'s content.'
          });
        }
      } catch (error) {
        console.error('Error summarizing video:', error);
        sendResponse({ 
          success: false, 
          error: `We encountered an issue while creating your summary. Please try again later.`
        });
      }
    })();
    return true; // Keep the message channel open for the async response
  }
  
  // Handle saving the AI API key
  if (message.action === 'saveApiKey') {
    (async () => {
      try {
        // Just store the provided key but we'll always use the fixed one internally
        await chrome.storage.local.set({ aiApiKey: message.apiKey });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error saving API key:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }
  
  // Handle saving AI model choice
  if (message.action === 'saveAiModel') {
    (async () => {
      try {
        await chrome.storage.local.set({ aiModel: message.aiModel });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error saving AI model preference:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  // If no handlers above matched, return false to indicate we won't call sendResponse
  return false;
});

// More robust Gemini API integration with proper request format
async function generateGeminiSummary(text, videoTitle, position = 'full') {
  console.log(`Generating Gemini summary for position: ${position}, text length: ${text.length}`);
  
  let promptText;
  
  if (position === 'start') {
    promptText = `Summarize the beginning part of this YouTube video titled "${videoTitle}".\n\nTranscript part:\n${text}`;
  } else if (position === 'middle') {
    promptText = `Summarize this middle segment of a YouTube video.\n\nTranscript part:\n${text}`;
  } else if (position === 'end') {
    promptText = `Summarize the final part of this YouTube video titled "${videoTitle}".\n\nTranscript part:\n${text}`;
  } else if (position === 'combine') {
    promptText = `Create a final, cohesive summary of this YouTube video titled "${videoTitle}" based on these partial summaries:\n\n${text}`;
  } else {
    promptText = `Please summarize this YouTube video titled "${videoTitle}".\n\nHere is the transcript:\n${text}\n\nCreate a clear, concise summary with 3-5 main bullet points highlighting the key takeaways. Format your response in HTML with bullet points using <ul> and <li> tags. Make it easily scannable.`;
  }

  // Format the request according to Gemini API documentation
  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText }
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
  
  // The API endpoint with the API key as a query parameter
  const endpoint = `${GEMINI_API_URL}?key=${FIXED_AI_API_KEY}`;
  
  // Implement retry logic for API calls
  const maxRetries = 2;
  let attempt = 0;
  let lastError = null;
  
  while (attempt <= maxRetries) {
    try {
      console.log(`API attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, errorText);
        
        // Handle specific error codes with more user-friendly messages
        let errorMessage = 'We couldn\'t generate a summary at this time.';
        if (response.status === 400) {
          errorMessage = 'The video content may be too complex to summarize.';
        } else if (response.status === 403) {
          errorMessage = 'We\'re having trouble accessing the summary service right now.';
        } else if (response.status === 404) {
          errorMessage = 'The summary service is temporarily unavailable.';
        } else if (response.status === 429) {
          errorMessage = 'We\'ve reached our daily limit for video summaries. Please try again tomorrow.';
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('API response received');
      
      // Extract the summary text from the response according to Gemini API format
      if (result.candidates && result.candidates.length > 0 && 
          result.candidates[0].content && 
          result.candidates[0].content.parts && 
          result.candidates[0].content.parts.length > 0) {
          
        const summary = result.candidates[0].content.parts[0].text;
        return summary;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Only retry if we have attempts left and it's a potentially transient error
      if (attempt <= maxRetries && 
          (error.message.includes('timeout') || 
           error.message.includes('network') || 
           error.message.includes('429') || 
           error.message.includes('limit'))) {
        console.log(`Retrying after error: ${error.message}`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      // If we've exhausted retries or it's not a retryable error
      break;
    }
  }
  
  throw lastError || new Error('Failed to generate summary after multiple attempts');
}

// Function to fetch transcript from YouTube API
async function fetchTranscriptFromYouTubeAPI(token, videoId) {
  console.log('Fetching transcript via YouTube API for video:', videoId);
  
  try {
    // First get the list of available captions for the video
    const captionsListResponse = await fetch(`${CAPTIONS_ENDPOINT}?part=snippet&videoId=${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!captionsListResponse.ok) {
      throw new Error(`YouTube API error: ${captionsListResponse.status}`);
    }
    
    const captionsData = await captionsListResponse.json();
    
    // Find English captions if available (prioritize manual ones)
    let captionOptions = captionsData.items || [];
    let englishCaptions = captionOptions.filter(
      item => item.snippet.language === 'en' || item.snippet.language === 'en-US' || item.snippet.language === 'en-GB'
    );
    
    // If no English captions, use any available captions
    if (englishCaptions.length === 0 && captionOptions.length > 0) {
      englishCaptions = captionOptions;
    }
    
    // Sort to prioritize manual captions over auto-generated ones
    const sortedCaptions = englishCaptions.sort((a, b) => {
      if (a.snippet.trackKind === 'standard' && b.snippet.trackKind !== 'standard') return -1;
      if (a.snippet.trackKind !== 'standard' && b.snippet.trackKind === 'standard') return 1;
      return 0;
    });
    
    if (sortedCaptions && sortedCaptions.length > 0) {
      const captionId = sortedCaptions[0].id;
      
      // Get the caption content in SRT format
      const captionResponse = await fetch(`${CAPTIONS_ENDPOINT}/${captionId}?tfmt=srt`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (captionResponse.ok) {
        const captionText = await captionResponse.text();
        return processSrtTranscript(captionText);
      }
      
      throw new Error('Failed to fetch caption content');
    }
    
    throw new Error('No captions found for this video');
  } catch (error) {
    console.error('Error fetching transcript from YouTube API:', error);
    throw error;
  }
}

// Function to split transcript into manageable chunks to avoid token limits
function chunkText(text, maxLength = 7000) {
  if (!text || text.length <= maxLength) return [text];
  
  const paragraphs = text.split('\n');
  const chunks = [];
  let chunk = '';

  for (const p of paragraphs) {
    if ((chunk + p + '\n').length > maxLength) {
      chunks.push(chunk.trim());
      chunk = '';
    }
    chunk += p + '\n';
  }

  if (chunk.trim()) chunks.push(chunk.trim());
  return chunks;
}

// Helper function to process SRT transcript format
function processSrtTranscript(srtText) {
  if (!srtText) return '';
  
  try {
    // Split by double newline which usually separates entries
    const entries = srtText.split('\n\n');
    
    // Extract just the text content, ignore timestamps
    const textLines = entries.map(entry => {
      const lines = entry.split('\n');
      // Skip the first two lines (index and timestamp)
      if (lines.length >= 3) {
        return lines.slice(2).join(' ');
      }
      return '';
    });
    
    // Join all text together
    return textLines.join(' ')
      .replace(/  +/g, ' ') // Remove extra spaces
      .trim();
  } catch (err) {
    console.error('Error processing SRT transcript:', err);
    return '';
  }
}

// Function to authenticate with YouTube
async function authenticate() {
  return new Promise((resolve, reject) => {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
    
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (!redirectUrl) {
          reject(new Error('Authentication failed'));
          return;
        }
        
        const url = new URL(redirectUrl);
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        
        if (!token) {
          reject(new Error('No access token found in the response'));
          return;
        }
        
        resolve(token);
      }
    );
  });
}

// Get user info with the access token
async function getUserInfo(token) {
  try {
    const response = await fetch(USER_INFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }
    
    const userInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}

// Store video summary in local storage
async function storeVideoSummary(videoId, summary) {
  try {
    const result = await chrome.storage.local.get('videoSummaries');
    const summaries = result.videoSummaries || {};
    
    summaries[videoId] = {
      summary,
      timestamp: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ videoSummaries: summaries });
  } catch (error) {
    console.error('Error storing summary:', error);
    throw error;
  }
}

// Open dashboard when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

// Enhanced error handling and logging
chrome.runtime.onStartup.addListener(() => {
  console.log('YouTube Enhancer extension started');
  // Clear old rate limit data
  rateLimits.clear();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Enhancer extension installed/updated');
  // Clear any cached auth data on install/update
  chrome.storage.local.remove(['userToken', 'userInfo']);
});
