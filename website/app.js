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

// Car follows mouse
const carIcon = document.getElementById("car-icon");
document.addEventListener("mousemove", (e) => {
  if (carIcon) {
    carIcon.style.left = e.pageX + "px";
    carIcon.style.top = e.pageY + "px";
  }
});


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
