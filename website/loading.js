// Carter Arribas
// Loading screen management - ensures all elements are loaded before showing site

let loadingProgress = {
  images: false,
  video: false,
  loadingAnimation: false,
  threejs: false,
  gltfLoader: false,
  hoodieModel: false,
  hoodieTextures: false
};

let loadingScreen = null;
let loadingBar = null;
let loadingStartTime = null;
const MIN_LOADING_TIME = 6000; // 6 seconds minimum

// Initialize loading screen
function initLoadingScreen() {
  loadingStartTime = Date.now();
  loadingScreen = document.getElementById('loading-screen');
  loadingBar = document.querySelector('.loading-bar');
  
  if (!loadingScreen) {
    console.warn('Loading screen not found');
    return;
  }
  
  // Try to play the loading animation video
  const animationVideo = document.getElementById('loading-animation');
  if (animationVideo) {
    console.log('Loading animation video element found');
    
    // Set video properties to ensure it plays
    animationVideo.muted = true;
    animationVideo.loop = true;
    animationVideo.playsInline = true;
    animationVideo.setAttribute('playsinline', '');
    animationVideo.setAttribute('webkit-playsinline', '');
    
    // Ensure video stays in DOM and doesn't get removed
    animationVideo.setAttribute('data-keep-in-dom', 'true');
    
    // Try to play immediately
    const playPromise = animationVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Loading animation video started playing');
      }).catch(error => {
        console.warn('Auto-play prevented initially:', error);
        // Video will play once metadata loads
      });
    }
    
    // Listen for metadata to try playing again
    animationVideo.addEventListener('loadedmetadata', () => {
      console.log('Loading animation metadata loaded, attempting to play');
      animationVideo.play().then(() => {
        console.log('Loading animation video playing after metadata load');
      }).catch(err => {
        console.warn('Video play failed after metadata:', err);
      });
    }, { once: true });
    
    animationVideo.addEventListener('loadeddata', () => {
      console.log('Loading animation data loaded, attempting to play');
      if (animationVideo.paused) {
        animationVideo.play().then(() => {
          console.log('Loading animation video playing after data load');
        }).catch(err => {
          console.warn('Video play failed after data load:', err);
        });
      }
    }, { once: true });
    
    animationVideo.addEventListener('playing', () => {
      console.log('Loading animation video is now playing');
    }, { once: true });
    
    animationVideo.addEventListener('error', (e) => {
      const error = animationVideo.error;
      if (error) {
        console.error('Loading animation video error code:', error.code);
        console.error('Loading animation video error message:', error.message);
        if (error.code === 4) {
          console.error('MEDIA_ERR_SRC_NOT_SUPPORTED: The .mov format may not be supported by this browser. Consider converting to .mp4 for better compatibility.');
        }
      }
    });
  } else {
    console.warn('Loading animation video element not found');
  }
  
  // Start checking for loaded resources
  checkResources();
}

// Check if all resources are loaded
function checkResources() {
  // Check images
  checkImages();
  
  // Check video
  checkVideo();
  
  // Check loading animation video
  checkLoadingAnimation();
  
  // Check Three.js
  checkThreeJS();
  
  // Check GLTFLoader
  checkGLTFLoader();
  
  // Check hoodie model and textures (will be set by hoodie-3d.js)
  // These are checked via custom events
  
  // Update loading bar
  updateLoadingBar();
  
  // Check if everything is ready
  if (isEverythingLoaded()) {
    hideLoadingScreen();
  } else {
    // Check again after a short delay
    setTimeout(checkResources, 100);
  }
}

// Check if images are loaded
function checkImages() {
  const images = document.querySelectorAll('img');
  let allLoaded = true;
  
  images.forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      allLoaded = false;
      img.onload = () => {
        loadingProgress.images = true;
        checkResources();
      };
      img.onerror = () => {
        // Image failed to load, but continue anyway
        loadingProgress.images = true;
        checkResources();
      };
    }
  });
  
  if (images.length === 0 || allLoaded) {
    loadingProgress.images = true;
  }
}

// Check if video is loaded
function checkVideo() {
  const video = document.getElementById('background-video');
  if (!video) {
    loadingProgress.video = true;
    return;
  }
  
  if (video.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
    loadingProgress.video = true;
  } else {
    video.addEventListener('canplaythrough', () => {
      loadingProgress.video = true;
      checkResources();
    }, { once: true });
    
    video.addEventListener('error', () => {
      // Video failed, but continue anyway
      loadingProgress.video = true;
      checkResources();
    }, { once: true });
  }
}

// Check if loading animation video is loaded
function checkLoadingAnimation() {
  const animationVideo = document.getElementById('loading-animation');
  if (!animationVideo) {
    loadingProgress.loadingAnimation = true;
    return;
  }
  
  // Don't mark as loaded until video is actually playing
  // This ensures the video stays visible during loading
  if (animationVideo.readyState >= 2 && !animationVideo.paused && animationVideo.currentTime > 0) {
    // Video is loaded and playing
    loadingProgress.loadingAnimation = true;
  } else if (animationVideo.readyState >= 2) {
    // Video is loaded but not playing yet - try to play it
    const playPromise = animationVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video started playing successfully
        loadingProgress.loadingAnimation = true;
        checkResources();
      }).catch(err => {
        console.warn('Could not play loading animation:', err);
        // Still mark as loaded so loading can continue even if video doesn't play
        // (in case of browser compatibility issues)
        loadingProgress.loadingAnimation = true;
        checkResources();
      });
    }
  } else {
    // Wait for video to be ready
    const handleCanPlay = () => {
      // Try to play if paused
      if (animationVideo.paused) {
        const playPromise = animationVideo.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            loadingProgress.loadingAnimation = true;
            checkResources();
          }).catch(err => {
            console.warn('Could not play loading animation after canplay:', err);
            loadingProgress.loadingAnimation = true;
            checkResources();
          });
        } else {
          loadingProgress.loadingAnimation = true;
          checkResources();
        }
      } else {
        loadingProgress.loadingAnimation = true;
        checkResources();
      }
    };
    
    // Only add listeners if not already added
    if (!animationVideo.hasAttribute('data-listeners-added')) {
      animationVideo.setAttribute('data-listeners-added', 'true');
      animationVideo.addEventListener('canplay', handleCanPlay, { once: true });
      animationVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });
      animationVideo.addEventListener('loadeddata', () => {
        // Video has loaded enough data, try to play
        animationVideo.play().catch(err => {
          console.warn('Could not play loading animation after loadeddata:', err);
        });
      }, { once: true });
      
      animationVideo.addEventListener('playing', () => {
        // Video is now playing
        loadingProgress.loadingAnimation = true;
        checkResources();
      }, { once: true });
      
      animationVideo.addEventListener('error', (e) => {
        // Animation video failed, log error but continue anyway
        const error = animationVideo.error;
        if (error) {
          console.warn('Loading animation video error code:', error.code, error.message);
          if (error.code === 4) {
            console.warn('Video format may not be supported. Consider converting .mov to .mp4 for better browser compatibility.');
          }
        }
        // Mark as loaded so loading can continue even without video
        loadingProgress.loadingAnimation = true;
        checkResources();
      }, { once: true });
    }
  }
}

// Check if Three.js is loaded
function checkThreeJS() {
  if (typeof THREE !== 'undefined') {
    loadingProgress.threejs = true;
  }
}

// Check if GLTFLoader is loaded
function checkGLTFLoader() {
  if (window.GLTFLoader || (typeof THREE !== 'undefined' && THREE.GLTFLoader)) {
    loadingProgress.gltfLoader = true;
  }
}

// Update loading bar based on progress
function updateLoadingBar() {
  if (!loadingBar) return;
  
  const totalChecks = Object.keys(loadingProgress).length;
  const completedChecks = Object.values(loadingProgress).filter(Boolean).length;
  const progress = (completedChecks / totalChecks) * 100;
  
  loadingBar.style.width = progress + '%';
}

// Check if everything is loaded
function isEverythingLoaded() {
  return Object.values(loadingProgress).every(loaded => loaded === true);
}

// Hide loading screen
function hideLoadingScreen() {
  if (!loadingScreen) return;
  
  // Calculate how long we've been loading
  const elapsedTime = loadingStartTime ? Date.now() - loadingStartTime : 0;
  const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
  
  // Wait for minimum loading time (4 seconds) before hiding
  setTimeout(() => {
    // Stop the loading animation video before hiding
    const animationVideo = document.getElementById('loading-animation');
    if (animationVideo) {
      animationVideo.pause();
      animationVideo.currentTime = 0;
    }
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      document.body.classList.remove('loading');
      
      // Remove loading screen from DOM after animation
      setTimeout(() => {
        if (loadingScreen && loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500);
    }, 500); // Small delay to ensure everything is truly ready
  }, remainingTime);
}

// Listen for custom events from hoodie-3d.js
document.addEventListener('hoodieModelLoaded', () => {
  loadingProgress.hoodieModel = true;
  checkResources();
});

document.addEventListener('hoodieTexturesLoaded', () => {
  loadingProgress.hoodieTextures = true;
  checkResources();
});

// Also listen for texture loading errors - mark as loaded if they fail
document.addEventListener('hoodieTexturesError', () => {
  // Textures failed to load, but continue anyway
  loadingProgress.hoodieTextures = true;
  checkResources();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
  initLoadingScreen();
}

// Fallback: Hide loading screen after maximum wait time (10 seconds)
setTimeout(() => {
  if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
    console.warn('Loading timeout - showing site anyway');
    hideLoadingScreen();
  }
}, 10000);

