//Carter Arribas
//Functions to connect the wallet and connect to the solana chain

const connectButton = document.getElementById("connect-wallet");
const mintButton = document.getElementById("mint-nft");
const exchangeButton = document.getElementById("exchange-nft");

// Candy Machine ID - Update this if you deploy to mainnet
const CANDY_MACHINE_ID = "GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL";

// Solana network - Change to 'mainnet-beta' for production
const SOLANA_NETWORK = "devnet"; // or "mainnet-beta"

let provider = null;
let walletPublicKey = null;

async function connectWallet() {
  if ("solana" in window) {
    try {
      const resp = await window.solana.connect();
      walletPublicKey = resp.publicKey.toString();
      console.log("Connected wallet:", walletPublicKey);
      provider = window.solana;
      if (mintButton) mintButton.disabled = false;
      if (exchangeButton) exchangeButton.disabled = false;
      
      // Update UI to show connected wallet
      if (connectButton) {
        connectButton.textContent = "Connected: " + walletPublicKey.slice(0, 4) + "..." + walletPublicKey.slice(-4);
        connectButton.disabled = true;
      }
    } catch (err) {
      console.error("Wallet connection failed", err);
      alert("Failed to connect wallet: " + err.message);
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

// Mint NFT function using Candy Machine v3
async function mintNFT() {
  if (!provider || !walletPublicKey) {
    alert("Please connect your wallet first!");
    return;
  }

  if (!mintButton) return;

  try {
    mintButton.disabled = true;
    mintButton.textContent = "Minting...";

    // Create connection to Solana network
    const connection = new web3.Connection(
      web3.clusterApiUrl(SOLANA_NETWORK),
      'confirmed'
    );

    const publicKey = new web3.PublicKey(walletPublicKey);
    const candyMachinePubkey = new web3.PublicKey(CANDY_MACHINE_ID);

    // Check if Candy Machine exists
    const candyMachineAccount = await connection.getAccountInfo(candyMachinePubkey);
    if (!candyMachineAccount) {
      throw new Error("Candy Machine not found! Make sure you're on the correct network.");
    }

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Create mint keypair for the new NFT
    const mintKeypair = web3.Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Get associated token account
    const associatedTokenAccount = await splToken.getAssociatedTokenAddress(
      mint,
      publicKey
    );

    // Build transaction
    const transaction = new web3.Transaction({
      feePayer: publicKey,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    });

    // Try to use mpl-candy-machine-core if available
    if (typeof window.mintFromCandyMachine === 'function') {
      try {
        const result = await window.mintFromCandyMachine(provider, CANDY_MACHINE_ID, SOLANA_NETWORK);
        alert("✅ Mint successful!\n\nMint Address: " + result.mint + "\nTransaction: " + result.signature + "\n\nView on Explorer:\n" + result.explorerUrl);
        mintButton.disabled = false;
        mintButton.textContent = "Mint NFT";
        
        // Update minted count if element exists
        const mintedElement = document.querySelector('[style*="Minted"]')?.parentElement?.querySelector('div:last-child');
        if (mintedElement) {
          // This would need to fetch the actual count from the Candy Machine
          console.log("Mint successful! Update the minted count display.");
        }
        
        return;
      } catch (err) {
        console.error("Mint function error:", err);
        // Show the error but don't fall through to the generic message
        throw err;
      }
    }

    // Fallback: Show instructions for setting up full minting
    const explorerUrl = SOLANA_NETWORK === 'devnet' 
      ? `https://explorer.solana.com/address/${CANDY_MACHINE_ID}?cluster=devnet`
      : `https://explorer.solana.com/address/${CANDY_MACHINE_ID}`;
    
    alert("To enable full minting functionality:\n\n" +
          "1. Add mpl-candy-machine-core library to mint.html\n" +
          "2. Or use 'sugar mint' command in terminal\n\n" +
          "Candy Machine ID: " + CANDY_MACHINE_ID + "\n" +
          "View on Explorer: " + explorerUrl);

    mintButton.disabled = false;
    mintButton.textContent = "Mint NFT";
  } catch (err) {
    console.error("Minting failed:", err);
    alert("Minting failed: " + err.message + "\n\nMake sure:\n- You're on the correct network\n- You have enough SOL\n- Candy Machine is deployed");
    if (mintButton) {
      mintButton.disabled = false;
      mintButton.textContent = "Mint NFT";
    }
  }
}

// Mint button event listener
if (mintButton) {
  mintButton.addEventListener("click", mintNFT);
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
  
  // Handle hoodie click to navigate to mint page
  const hoodieWrapper = document.getElementById('hoodie-click-wrapper');
  if (hoodieWrapper) {
    let mouseDownX = 0;
    let mouseDownY = 0;
    let hasMoved = false;
    
    hoodieWrapper.addEventListener('mousedown', (e) => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
      hasMoved = false;
    });
    
    hoodieWrapper.addEventListener('mousemove', (e) => {
      if (mouseDownX !== 0 || mouseDownY !== 0) {
        const deltaX = Math.abs(e.clientX - mouseDownX);
        const deltaY = Math.abs(e.clientY - mouseDownY);
        // If mouse moved more than 5 pixels, consider it a drag
        if (deltaX > 5 || deltaY > 5) {
          hasMoved = true;
        }
      }
    });
    
    hoodieWrapper.addEventListener('mouseup', (e) => {
      if (!hasMoved && (mouseDownX !== 0 || mouseDownY !== 0)) {
        // It was a click, not a drag - navigate to mint page
        window.location.href = 'mint.html';
      }
      mouseDownX = 0;
      mouseDownY = 0;
      hasMoved = false;
    });
    
    // Also handle touch events for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    
    hoodieWrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    });
    
    hoodieWrapper.addEventListener('touchmove', (e) => {
      if (touchStartX !== 0 || touchStartY !== 0) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (deltaX > 5 || deltaY > 5) {
          touchMoved = true;
        }
      }
    });
    
    hoodieWrapper.addEventListener('touchend', (e) => {
      if (!touchMoved && (touchStartX !== 0 || touchStartY !== 0)) {
        // It was a tap, not a swipe - navigate to mint page
        window.location.href = 'mint.html';
      }
      touchStartX = 0;
      touchStartY = 0;
      touchMoved = false;
    });
  }
});
