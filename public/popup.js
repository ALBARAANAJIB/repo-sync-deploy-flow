
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login-button');
  const loginContainer = document.getElementById('login-container');
  const featuresContainer = document.getElementById('features-container');
  const fetchVideosButton = document.getElementById('fetch-videos');
  const openDashboardButton = document.getElementById('open-dashboard');
  const exportDataButton = document.getElementById('export-data');
  const aiSummaryButton = document.getElementById('ai-summary');
  const signOutButton = document.getElementById('sign-out');
  const userEmail = document.getElementById('user-email');
  const userInitial = document.getElementById('user-initial');

  // YouTube API configuration
  const YOUTUBE_API_KEY = 'AIzaSyCkxngJEfNG2IRp7bsUFjrWUQc4ZsOTOkY'; // Your hardcoded API key
  const CLIENT_ID = 'YOUR_CLIENT_ID'; // You mentioned you implemented proper client ID

  // Enhanced authentication check with real Google OAuth
  function checkAuthStatus() {
    try {
      chrome.storage.local.get(['userToken', 'userInfo'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage access error:', chrome.runtime.lastError);
          showLoginUI();
          return;
        }
        
        if (result.userToken && result.userInfo) {
          console.log('User appears to be authenticated');
          showFeaturesUI(result.userInfo);
        } else {
          console.log('No stored authentication found');
          showLoginUI();
        }
      });
    } catch (error) {
      console.error('Error in checkAuthStatus:', error);
      showLoginUI();
    }
  }

  function showLoginUI() {
    loginContainer.style.display = 'block';
    featuresContainer.style.display = 'none';
    document.querySelectorAll('.error-message').forEach(el => el.remove());
  }

  function showFeaturesUI(userInfo) {
    loginContainer.style.display = 'none';
    featuresContainer.style.display = 'block';
    
    if (userInfo) {
      const displayName = userInfo.email || userInfo.name || 'User';
      const initial = displayName.charAt(0).toUpperCase();
      
      if (userEmail) userEmail.textContent = displayName;
      if (userInitial) userInitial.textContent = initial;
    }
  }

  function showError(message) {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
      font-size: 12px;
    `;
    errorDiv.textContent = message;
    
    const container = loginContainer.style.display !== 'none' ? loginContainer : featuresContainer;
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }

  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      color: #059669;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
      font-size: 12px;
    `;
    successDiv.textContent = message;
    
    featuresContainer.insertBefore(successDiv, featuresContainer.firstChild);
    setTimeout(() => successDiv.remove(), 3000);
  }

  // Real YouTube OAuth authentication
  async function authenticateWithYouTube() {
    try {
      console.log('Starting YouTube OAuth...');
      
      // Use chrome.identity for OAuth
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${chrome.identity.getRedirectURL()}&` +
        `response_type=token&` +
        `scope=https://www.googleapis.com/auth/youtube.readonly`;

      return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true
        }, (redirectUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (redirectUrl) {
            // Extract access token from redirect URL
            const urlParams = new URLSearchParams(redirectUrl.split('#')[1]);
            const accessToken = urlParams.get('access_token');
            
            if (accessToken) {
              // Get user info from Google API
              fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
                .then(response => response.json())
                .then(userInfo => {
                  // Store the token and user info
                  chrome.storage.local.set({
                    userToken: accessToken,
                    userInfo: userInfo
                  }, () => {
                    resolve({ token: accessToken, userInfo });
                  });
                })
                .catch(reject);
            } else {
              reject(new Error('No access token received'));
            }
          } else {
            reject(new Error('Authentication cancelled'));
          }
        });
      });
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Fetch liked videos using YouTube API
  async function fetchLikedVideos() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['userToken'], resolve);
      });

      if (!result.userToken) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching liked videos from YouTube API...');
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&myRating=like&maxResults=50&key=${YOUTUBE_API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${result.userToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Store the videos
      chrome.storage.local.set({ likedVideos: data.items }, () => {
        showSuccess(`Successfully fetched ${data.items.length} liked videos!`);
      });

      return data.items;
    } catch (error) {
      console.error('Error fetching videos:', error);
      showError(`Failed to fetch videos: ${error.message}`);
      throw error;
    }
  }

  // Check authentication status on load
  checkAuthStatus();

  // Real login handler with YouTube OAuth
  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      console.log('Login button clicked');
      loginButton.disabled = true;
      loginButton.textContent = 'Signing in...';
      
      document.querySelectorAll('.error-message').forEach(el => el.remove());
      
      try {
        const authResult = await authenticateWithYouTube();
        showFeaturesUI(authResult.userInfo);
        showSuccess('Successfully authenticated with YouTube!');
      } catch (error) {
        console.error('Authentication failed:', error);
        showError(`Authentication failed: ${error.message}`);
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Sign in with YouTube';
      }
    });
  }

  // Real fetch liked videos
  fetchVideosButton && fetchVideosButton.addEventListener('click', async () => {
    fetchVideosButton.disabled = true;
    fetchVideosButton.textContent = 'Fetching...';
    
    try {
      await fetchLikedVideos();
    } catch (error) {
      // Error already handled in fetchLikedVideos
    } finally {
      fetchVideosButton.disabled = false;
      fetchVideosButton.textContent = 'Fetch Now';
    }
  });

  // Open dashboard
  openDashboardButton && openDashboardButton.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });

  // Export data - now exports real data
  exportDataButton && exportDataButton.addEventListener('click', () => {
    chrome.storage.local.get(['likedVideos'], (result) => {
      if (result.likedVideos && result.likedVideos.length > 0) {
        const dataStr = JSON.stringify(result.likedVideos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        chrome.downloads.download({
          url: url,
          filename: 'youtube_liked_videos.json'
        });
        
        showSuccess('Data exported successfully!');
      } else {
        showError('No videos to export. Fetch videos first.');
      }
    });
  });

  // AI Summary
  aiSummaryButton && aiSummaryButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.url && currentTab.url.includes('youtube.com/watch')) {
        showSuccess("AI Summarization panel is now available on the video page!");
        window.close();
      } else {
        chrome.tabs.create({ 
          url: chrome.runtime.getURL('dashboard.html?tab=ai') 
        });
      }
    });
  });

  // Enhanced sign out
  if (signOutButton) {
    signOutButton.addEventListener('click', () => {
      console.log('Signing out...');
      chrome.storage.local.remove(['userToken', 'userInfo', 'likedVideos'], () => {
        console.log('Signed out successfully');
        showLoginUI();
      });
    });
  }
});
