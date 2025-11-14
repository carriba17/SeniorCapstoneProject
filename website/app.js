//Carter Arribas
//Functions to connect the wallet and connect to the solana chain

const connectButton = document.getElementById("connect-wallet");
const mintButton = document.getElementById("mint-nft");
const burnButton = document.getElementById("burn-nft");
// const CANDY_MACHINE_ID = new web3.PublicKey("YOUR_CANDY_MACHINE_ID_HERE");


let provider = null;

async function connectWallet() {
  if ("solana" in window) {
    try {
      const resp = await window.solana.connect();
      console.log("Connected wallet:", resp.publicKey.toString());
      provider = window.solana;
      mintButton.disabled = false;
      burnButton.disabled = false;
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

// Placeholder functions for mint/burn
if (mintButton) {
  mintButton.addEventListener("click", () => {
    alert("Minting not yet wired to Candy Machine. This is the next step.");
  });
}

if (burnButton) {
  burnButton.addEventListener("click", () => {
    alert("Burn function not yet implemented. Will integrate with program.");
  });
}
