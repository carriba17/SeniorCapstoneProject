//Carter Arribas
//Functions to connect the wallet and connect to the solana chain

const connectButton = document.getElementById("connect-wallet");
const mintButton = document.getElementById("mint-nft");
const exchangeButton = document.getElementById("exchange-nft");
// const CANDY_MACHINE_ID = new web3.PublicKey("YOUR_CANDY_MACHINE_ID_HERE");


let provider = null;

async function connectWallet() {
  if ("solana" in window) {
    try {
      const resp = await window.solana.connect();
      console.log("Connected wallet:", resp.publicKey.toString());
      provider = window.solana;
      mintButton.disabled = false;
      exchangeButton.disabled = false;
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  } 
  else {
    alert("Phantom wallet not found! Install it first.");
  }
}

// Car follows mouse - only when race is active
const carIcon = document.getElementById("car-icon");
let isCarTracking = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Function to handle car icon mouse tracking
function handleCarTracking(e) {
  if (carIcon && isCarTracking) {
    // Use clientX/clientY (viewport coordinates) instead of pageX/pageY to avoid scroll offset issues
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    carIcon.style.left = e.clientX + "px";
    carIcon.style.top = e.clientY + "px";
  }
}

// Track mouse position even when not tracking (to know where to position car when starting)
document.addEventListener("mousemove", (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// Start car icon tracking
function startCarTracking() {
  if (carIcon) {
    isCarTracking = true;
    carIcon.style.display = "block";
    // Immediately position car at current mouse location
    carIcon.style.left = lastMouseX + "px";
    carIcon.style.top = lastMouseY + "px";
    document.addEventListener("mousemove", handleCarTracking);
  }
}

// Stop car icon tracking
function stopCarTracking() {
  if (carIcon) {
    isCarTracking = false;
    carIcon.style.display = "none";
    document.removeEventListener("mousemove", handleCarTracking);
  }
}

// Initialize car icon as hidden
if (carIcon) {
  carIcon.style.display = "none";
}

// Listen for custom events from track.js
document.addEventListener("raceStarted", startCarTracking);
document.addEventListener("raceStopped", stopCarTracking);


// Connect wallet button event listener
if (connectButton) {
  connectButton.addEventListener("click", connectWallet);
}

// Placeholder functions for mint/exchange
if (mintButton) {
  mintButton.addEventListener("click", () => {
    alert("Minting not yet wired to Candy Machine. This is the next step.");
  });
}

if (exchangeButton) {
  exchangeButton.addEventListener("click", () => {
    alert("Exchange function not yet implemented. Will integrate with program.");
  });
}

// Navbar scroll animation
const navbar = document.getElementById('navbar-left');
const logo = document.getElementById('top-logo');
const scrollThreshold = 50; // Lower threshold - triggers earlier

let lastScrollY = window.scrollY;
let ticking = false;

function handleScroll() {
  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > lastScrollY;
  
  if (currentScrollY > scrollThreshold) {
    // Scrolled down - move nav to top and show logo
    navbar?.classList.add('scrolled');
    logo?.classList.add('visible');
  } else {
    // Scrolled back up - return nav to side and hide logo (slower animation)
    navbar?.classList.remove('scrolled');
    logo?.classList.remove('visible');
  }
  
  lastScrollY = currentScrollY;
  ticking = false;
}

function onScroll() {
  if (!ticking) {
    window.requestAnimationFrame(handleScroll);
    ticking = true;
  }
}

// Listen for scroll events
window.addEventListener('scroll', onScroll, { passive: true });

// Also handle touch events for mobile swipe
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  touchEndY = e.changedTouches[0].clientY;
  handleScroll();
}, { passive: true });

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  handleScroll();
});
