//Carter Arribas
//CRCP Capstone
//Track Race Movement Tracking and Animation



// --- Retro track runner ---
// Booleans for simple state control
let isReady = false;     // image loaded and drawn to canvas
let isRunning = false;   // set true after START is clicked
let isOffTrack = false;  // set true when user hits green

const stageEl  = document.getElementById('trackStage');
const canvas   = document.getElementById('trackCanvas');
const startBtn = document.getElementById('startRace');
const statusEl = document.getElementById('trackStatus');
const resetBtn = document.getElementById('resetTrack');
if (!canvas) { /* silently bail if section not present */ }

// Internal canvas size (intentionally small for pixelated upscale via CSS)
const W = canvas ? canvas.width  : 192;
const H = canvas ? canvas.height : 192;
const ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;

// Load the pixel track image and draw it scaled into the tiny canvas
const img = new Image();
img.src = './assets/Track.png';   // place file in website/assets/Track.png
img.onload = () => {
  if (!ctx) return;
  // Draw scaled into internal 192x192 canvas; this preserves chunky pixels when upscaled
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);

  // Fit the square image inside our square canvas
  ctx.drawImage(img, 0, 0, W, H);

  isReady = true;
  statusEl.textContent = 'Click START to race';
};

// Utils: mouse coordinates to canvas coords (internal pixel coords)
function getCanvasCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const x = Math.floor((evt.clientX - rect.left) * scaleX);
  const y = Math.floor((evt.clientY - rect.top) * scaleY);
  return { x, y };
}

// Simple green detection: treat "grass" as green if G channel dominates
function isGreenPixel(r, g, b) {
  // Tuned to pick the green from your image reliably
  return g > 100 && g > r + 20 && g > b + 20;
}

// Mouse move handler: only active when running
function onMove(evt) {
  if (!isRunning || !isReady || isOffTrack) return;
  const { x, y } = getCanvasCoords(evt);
  if (x < 0 || y < 0 || x >= W || y >= H) return;

  const data = ctx.getImageData(x, y, 1, 1).data;
  const r = data[0], g = data[1], b = data[2];

  if (isGreenPixel(r, g, b)) {
    isOffTrack = true;
    isRunning = false;
    stageEl.classList.add('offtrack');
    statusEl.textContent = 'Off track! Click Reset.';
    
    // Dispatch event to stop car icon tracking when going off track
    document.dispatchEvent(new CustomEvent('raceStopped'));
  }
}

// Start button: remove haze, start checking pixels
function startRace() {
  if (!isReady) return;
  isRunning = true;
  isOffTrack = false;
  statusEl.textContent = 'Go!';
  stageEl.classList.remove('prestart', 'offtrack');
  startBtn.style.display = 'none';
  window.addEventListener('mousemove', onMove, { passive: true });
  
  // Dispatch event to start car icon tracking
  document.dispatchEvent(new CustomEvent('raceStarted'));
}

// Reset: redraw the track image, re-apply haze, show START again
function resetRace() {
  if (!isReady) return;
  isRunning = false;
  isOffTrack = false;
  statusEl.textContent = 'Click START to race';
  stageEl.classList.remove('offtrack');
  stageEl.classList.add('prestart');
  startBtn.style.display = 'block';

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  window.removeEventListener('mousemove', onMove);
  
  // Dispatch event to stop car icon tracking
  document.dispatchEvent(new CustomEvent('raceStopped'));
}

if (startBtn) startBtn.addEventListener('click', startRace);
if (resetBtn) resetBtn.addEventListener('click', resetRace);
