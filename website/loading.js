// Carter Arribas
// Loading screen management - ensures all elements are loaded before showing site

let loadingProgress = {
  images: false,
  video: false,
  threejs: false,
  gltfLoader: false,
  hoodieModel: false,
  hoodieTextures: false
};

let loadingScreen = null;
let loadingBar = null;

// Initialize loading screen
function initLoadingScreen() {
  loadingScreen = document.getElementById('loading-screen');
  loadingBar = document.querySelector('.loading-bar');
  
  if (!loadingScreen) {
    console.warn('Loading screen not found');
    return;
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

