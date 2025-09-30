//Carter Arribas
//Functions to connect the wallet and connect to the solana chain

const connectButton = document.getElementById("connect-wallet");
const mintButton = document.getElementById("mint-nft");
const burnButton = document.getElementById("burn-nft");

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
  } else {
    alert("Phantom wallet not found! Install it first.");
  }
}

connectButton.addEventListener("click", connectWallet);

// Placeholder functions for mint/burn
mintButton.addEventListener("click", () => {
  alert("Minting not yet wired to Candy Machine. This is the next step.");
});
burnButton.addEventListener("click", () => {
  alert("Burn function not yet implemented. Will integrate with program.");
});
