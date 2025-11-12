// Carter Arribas
// TouchDesigner Integration - Handles UI interactions and TouchDesigner integration

document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const tdLanding = document.getElementById('touchdesigner-landing');
  const tdStatus = document.getElementById('td-status');
  const tdStatusText = document.getElementById('td-status-text');
  const tdStatusIndicator = document.getElementById('td-status-indicator');
  const tdLoading = document.getElementById('td-loading');
  const tdStream = document.getElementById('td-stream');
  const tdCanvasContainer = document.getElementById('td-canvas-container');
  const tdCanvas = document.getElementById('td-canvas');
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');

  // Configuration
  const TD_HOST = 'localhost';
  const TD_PORT = 8080;
  const USE_IFRAME = true; // Set to false to use WebSocket canvas rendering
  const TD_DISPLAY_DURATION = 5000; // Show TD for 5 seconds before transitioning
  const AUTO_TRANSITION = true; // Automatically transition to main content

  // Initialize TouchDesigner integration
  function initTouchDesigner() {
    // Wait for tdClient to be available
    setTimeout(() => {
      if (typeof tdClient !== 'undefined' && tdClient) {
        setupTouchDesignerClient();
      } else {
        // Fallback: Try to show stream directly if client not available
        showTouchDesignerStream();
      }
    }, 1000);

    // Set up UI event listeners
    setupEventListeners();
  }

  // Set up TouchDesigner client event handlers
  function setupTouchDesignerClient() {
    // Listen for connection events
    document.addEventListener('tdConnected', () => {
      console.log('TouchDesigner connected via WebSocket');
      updateConnectionStatus(true);
      hideLoading();
      showTouchDesignerStream();
      
      // Send initial parameters if needed
      if (tdClient) {
        tdClient.sendParameter('enable', 1);
      }
    });

    document.addEventListener('tdDisconnected', () => {
      console.log('TouchDesigner disconnected');
      updateConnectionStatus(false);
    });

    document.addEventListener('tdMessage', (event) => {
      const data = event.detail;
      handleTouchDesignerMessage(data);
    });
  }

  // Update connection status UI
  function updateConnectionStatus(connected) {
    if (tdStatus) {
      if (connected) {
        tdStatus.classList.remove('disconnected');
        tdStatus.classList.add('connected');
        tdStatusText.textContent = 'Connected';
      } else {
        tdStatus.classList.remove('connected');
        tdStatus.classList.add('disconnected');
        tdStatusText.textContent = 'Disconnected';
      }
    }
  }

  // Show TouchDesigner stream
  function showTouchDesignerStream() {
    if (USE_IFRAME && tdStream) {
      tdStream.style.display = 'block';
      tdStream.src = `http://${TD_HOST}:${TD_PORT}`;
    } else if (tdCanvasContainer) {
      tdCanvasContainer.style.display = 'flex';
      // WebSocket canvas rendering would be set up here
    }

    if (tdLanding) {
      tdLanding.classList.remove('hidden');
    }

    hideLoading();

    // Auto-transition to main content after duration
    if (AUTO_TRANSITION) {
      setTimeout(() => {
        transitionToMainContent();
      }, TD_DISPLAY_DURATION);
    }
  }

  // Hide loading spinner
  function hideLoading() {
    if (tdLoading) {
      tdLoading.style.display = 'none';
    }
  }

  // Transition from TouchDesigner to main content
  function transitionToMainContent() {
    if (tdLanding) {
      tdLanding.classList.add('fade-out');
      
      setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.style.display = 'none';
        }
        if (tdLanding) {
          tdLanding.style.display = 'none';
        }
        if (mainContent) {
          mainContent.style.display = 'block';
        }
      }, 500);
    }
  }

  // Handle messages from TouchDesigner
  function handleTouchDesignerMessage(data) {
    console.log('Message from TouchDesigner:', data);
    
    // Example: Handle different message types
    if (data.type === 'event') {
      switch (data.name) {
        case 'walletConnected':
          // TouchDesigner knows wallet was connected
          break;
        case 'nftMinted':
          // TouchDesigner knows NFT was minted
          break;
        default:
          console.log('Unknown event:', data.name);
      }
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Wallet connection integration
    const connectButton = document.getElementById('connect-wallet');
    if (connectButton) {
      connectButton.addEventListener('click', () => {
        // Notify TouchDesigner of wallet connection attempt
        if (tdClient && tdClient.isConnected) {
          tdClient.triggerEvent('walletConnectAttempt');
        }
      });
    }

    // Mint button integration
    const mintButton = document.getElementById('mint-nft');
    if (mintButton) {
      mintButton.addEventListener('click', () => {
        // Notify TouchDesigner of mint attempt
        if (tdClient && tdClient.isConnected) {
          tdClient.triggerEvent('mintAttempt');
        }
      });
    }

    // Mouse movement - send to TouchDesigner for interactive visuals
    document.addEventListener('mousemove', (e) => {
      if (tdClient && tdClient.isConnected) {
        const normalizedX = e.clientX / window.innerWidth;
        const normalizedY = e.clientY / window.innerHeight;
        
        tdClient.sendParameter('mouseX', normalizedX);
        tdClient.sendParameter('mouseY', normalizedY);
      }
    });

    // Window resize - notify TouchDesigner
    window.addEventListener('resize', () => {
      if (tdClient && tdClient.isConnected) {
        tdClient.sendParameter('windowWidth', window.innerWidth);
        tdClient.sendParameter('windowHeight', window.innerHeight);
      }
    });

    // TouchDesigner controls
    const toggleStreamBtn = document.getElementById('td-toggle-stream');
    if (toggleStreamBtn) {
      toggleStreamBtn.addEventListener('click', () => {
        if (tdStream && tdStream.style.display === 'none') {
          showTouchDesignerStream();
        } else {
          tdStream.style.display = 'none';
        }
      });
    }

    const reconnectBtn = document.getElementById('td-reconnect');
    if (reconnectBtn) {
      reconnectBtn.addEventListener('click', () => {
        if (tdClient) {
          tdClient.disconnect();
          setTimeout(() => {
            tdClient.connectWebSocket();
          }, 1000);
        }
      });
    }
  }

  // Initialize on page load
  initTouchDesigner();

  // Fallback: Show stream after a delay even if WebSocket fails
  setTimeout(() => {
    if (tdLoading && tdLoading.style.display !== 'none') {
      console.log('WebSocket connection timeout, showing stream directly');
      showTouchDesignerStream();
    }
  }, 3000);
});

// Export functions for use in app.js
window.touchDesignerIntegration = {
  sendParameter: (name, value) => {
    if (typeof tdClient !== 'undefined' && tdClient) {
      tdClient.sendParameter(name, value);
    }
  },
  triggerEvent: (eventName, data) => {
    if (typeof tdClient !== 'undefined' && tdClient) {
      tdClient.triggerEvent(eventName, data);
    }
  },
  showStream: () => {
    const tdLanding = document.getElementById('touchdesigner-landing');
    if (tdLanding) {
      tdLanding.style.display = 'block';
      tdLanding.classList.remove('hidden');
    }
  },
  hideStream: () => {
    const tdLanding = document.getElementById('touchdesigner-landing');
    if (tdLanding) {
      tdLanding.style.display = 'none';
      tdLanding.classList.add('hidden');
    }
  }
};


