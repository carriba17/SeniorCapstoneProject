//Carter Arribas
//Functions to connect the wallet and connect to the solana chain

const connectButton = document.getElementById("connect-wallet");
const mintButton = document.getElementById("mint-nft");
const exchangeButton = document.getElementById("exchange-nft");

// Candy Machine ID - Update this if you deploy to mainnet
const CANDY_MACHINE_ID = "GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL";

// Solana network - Change to 'mainnet-beta' for production
const SOLANA_NETWORK = "devnet"; // or "mainnet-beta"

// Backend API URL - Update this to your backend server URL
// For production, change this to your deployed backend URL
const BACKEND_API_URL = "http://localhost:3001";

let provider = null;
let walletPublicKey = null;

async function connectWallet() {
  if ("solana" in window) {
    try {
      const resp = await window.solana.connect();
      walletPublicKey = resp.publicKey.toString();
      console.log("Connected wallet:", walletPublicKey);
      provider = window.solana;
      
      // Check wallet network (Phantom may not support getNetwork, so we'll check balance instead)
      // The network is determined by which RPC endpoint we use, not the wallet
      console.log("App network:", SOLANA_NETWORK);
      console.log("⚠️ Make sure your Phantom wallet is set to", SOLANA_NETWORK, "in Settings → Developer Mode");
      
      // Check SOL balance
      const solanaWeb3 = window.solanaWeb3;
      if (solanaWeb3 && solanaWeb3.Connection && solanaWeb3.PublicKey) {
        const clusterUrl = SOLANA_NETWORK === 'devnet' 
          ? 'https://api.devnet.solana.com' 
          : 'https://api.mainnet-beta.solana.com';
        const connection = new solanaWeb3.Connection(clusterUrl, 'confirmed');
        const publicKey = new solanaWeb3.PublicKey(walletPublicKey);
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / 1e9; // Convert lamports to SOL
        
        console.log("SOL balance:", solBalance, "SOL");
        
        if (solBalance < 0.01) {
          const warning = SOLANA_NETWORK === 'devnet'
            ? "⚠️ Low devnet SOL balance! You need devnet SOL for transaction fees.\n\nGet free devnet SOL from:\nhttps://faucet.solana.com"
            : "⚠️ Low SOL balance! You may not have enough SOL for transaction fees.";
          console.warn(warning);
          
          if (solBalance === 0) {
            alert(
              "You have 0 SOL in your wallet!\n\n" +
              (SOLANA_NETWORK === 'devnet' 
                ? "Get free devnet SOL from: https://faucet.solana.com\n\n" +
                  "Make sure you're on devnet and request SOL to:\n" + walletPublicKey
                : "You need SOL to pay for transaction fees.")
            );
          }
        }
      }
      
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
    // Use window.solanaWeb3 to avoid MetaMask's web3 override
    const solanaWeb3 = window.solanaWeb3;
    const solanaSplToken = window.solanaSplToken;
    
    if (!solanaWeb3) {
      throw new Error("Solana web3.js library not loaded. Make sure the script is loaded before app.js");
    }
    
    if (!solanaSplToken) {
      throw new Error("Solana spl-token library not loaded. Make sure the script is loaded before app.js");
    }
    
    const clusterUrl = SOLANA_NETWORK === 'devnet' 
                      ? 'https://api.devnet.solana.com' 
                      : 'https://api.mainnet-beta.solana.com';
    
    // Use Solana web3.js classes
    // Try different access patterns since CDN exports may vary
    let Connection = solanaWeb3.Connection;
    let PublicKey = solanaWeb3.PublicKey;
    let Keypair = solanaWeb3.Keypair;
    let SystemProgram = solanaWeb3.SystemProgram;
    let Transaction = solanaWeb3.Transaction;
    
    // If classes aren't found, try accessing them directly (they might be exported at top level)
    if (!Connection || !PublicKey) {
      console.warn("Classes not found on solanaWeb3 object, trying alternative access...");
      console.log("solanaWeb3 structure:", Object.keys(solanaWeb3).slice(0, 30));
      
      // Try accessing from window if they were exported globally
      Connection = Connection || window.Connection || solanaWeb3.default?.Connection;
      PublicKey = PublicKey || window.PublicKey || solanaWeb3.default?.PublicKey;
      Keypair = Keypair || window.Keypair || solanaWeb3.default?.Keypair;
      SystemProgram = SystemProgram || window.SystemProgram || solanaWeb3.default?.SystemProgram;
      Transaction = Transaction || window.Transaction || solanaWeb3.default?.Transaction;
    }
    
    if (!Connection || !PublicKey) {
      const errorMsg = "Connection or PublicKey not found in Solana web3.js. " +
                      "Available keys: " + Object.keys(solanaWeb3).slice(0, 20).join(", ");
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const connection = new Connection(clusterUrl, 'confirmed');
    const publicKey = new PublicKey(walletPublicKey);
    const candyMachinePubkey = new PublicKey(CANDY_MACHINE_ID);

    // Check if Candy Machine exists
    const candyMachineAccount = await connection.getAccountInfo(candyMachinePubkey);
    if (!candyMachineAccount) {
      throw new Error("Candy Machine not found! Make sure you're on the correct network.");
    }

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Create mint keypair for the new NFT
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Get associated token account
    const associatedTokenAccount = await solanaSplToken.getAssociatedTokenAddress(
      mint,
      publicKey
    );

    // Build transaction (Transaction was already defined above)
    if (!Transaction) {
      throw new Error("Transaction class not found in web3.js");
    }
    
    const transaction = new Transaction({
      feePayer: publicKey,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    });

    // Try backend API first, then fallback to local function
    try {
      // Call backend API to create mint transaction
      const apiResponse = await fetch(`${BACKEND_API_URL}/api/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletPublicKey
        })
      });

      if (!apiResponse.ok) {
        let errorMessage = `API error: ${apiResponse.status}`;
        try {
          const errorData = await apiResponse.json();
          // Safely extract error message
          const errorText = errorData?.error || errorData?.message;
          if (errorText !== undefined && errorText !== null) {
            errorMessage = typeof errorText === 'string' ? errorText : String(errorText);
          }
          if (errorData?.details) {
            console.error('Backend error details:', errorData.details);
          }
        } catch (e) {
          // If response is not JSON, get text
          try {
            const text = await apiResponse.text();
            console.error('Backend error response:', text);
            if (text) {
              errorMessage = text;
            }
          } catch (textError) {
            console.error('Could not read error response:', textError);
          }
        }
        const finalErrorMessage = errorMessage || 'Unknown error from backend';
        throw new Error(finalErrorMessage);
      }

      const apiResult = await apiResponse.json();
      
      if (apiResult.success && apiResult.transaction) {
        // Deserialize the transaction
        const solanaWeb3 = window.solanaWeb3;
        if (!solanaWeb3 || !solanaWeb3.Transaction) {
          throw new Error("Solana web3.js not loaded");
        }

        const Transaction = solanaWeb3.Transaction;
        const Connection = solanaWeb3.Connection;
        
        // Create connection first (needed for getting blockhash if needed)
        const clusterUrl = SOLANA_NETWORK === 'devnet'
          ? 'https://api.devnet.solana.com'
          : 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(clusterUrl, 'confirmed');
        
        // Convert base64 to Uint8Array for Transaction.from
        const transactionBuffer = Uint8Array.from(atob(apiResult.transaction), c => c.charCodeAt(0));
        
        // Deserialize the transaction
        const transaction = Transaction.from(transactionBuffer);
        
        // Ensure transaction has all required fields for signing
        const PublicKey = solanaWeb3.PublicKey;
        const publicKey = new PublicKey(walletPublicKey);
        
        // ALWAYS set fee payer to user's wallet (critical for signing)
        // The backend might have set it incorrectly or it might be lost during serialization
        transaction.feePayer = publicKey;
        console.log('Fee payer set to user wallet:', publicKey.toString());
        
        // CRITICAL: Ensure transaction has ALL required fields BEFORE signing
        // Get fresh blockhash and lastValidBlockHeight to ensure they're valid
        console.log('Getting fresh blockhash and lastValidBlockHeight...');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        
        // Set all required fields BEFORE signing
        transaction.feePayer = publicKey; // Always set to user's wallet
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        
        console.log('Transaction prepared with:', {
          feePayer: transaction.feePayer.toString(),
          recentBlockhash: transaction.recentBlockhash,
          lastValidBlockHeight: transaction.lastValidBlockHeight,
          instructions: transaction.instructions.length
        });
        
        // Validate transaction before signing
        if (!transaction.feePayer) {
          throw new Error('Transaction missing fee payer');
        }
        if (transaction.feePayer.toString() !== walletPublicKey) {
          throw new Error('Fee payer mismatch! Expected: ' + walletPublicKey + ', Got: ' + transaction.feePayer.toString());
        }
          if (!transaction.recentBlockhash) {
          throw new Error('Transaction missing recent blockhash');
        }
        if (!transaction.lastValidBlockHeight) {
          throw new Error('Transaction missing lastValidBlockHeight - this is required for signature verification');
        }
        
        console.log('Transaction prepared for signing:', {
          feePayer: transaction.feePayer.toString(),
          instructions: transaction.instructions.length,
          recentBlockhash: transaction.recentBlockhash,
          lastValidBlockHeight: transaction.lastValidBlockHeight
        });

        // Sign the transaction with the user's wallet
        console.log('Requesting signature from wallet...');
        console.log('Transaction structure before signing:', {
          feePayer: transaction.feePayer?.toString(),
          instructions: transaction.instructions?.length,
          recentBlockhash: transaction.recentBlockhash,
          lastValidBlockHeight: transaction.lastValidBlockHeight,
          signatures: transaction.signatures?.length || 0,
          hasInstructions: !!transaction.instructions
        });
        
        // Validate transaction structure before sending to Phantom
        if (!transaction.feePayer) {
          throw new Error('Transaction missing fee payer');
        }
        if (transaction.feePayer.toString() !== walletPublicKey) {
          throw new Error(`Fee payer mismatch: expected ${walletPublicKey}, got ${transaction.feePayer.toString()}`);
        }
        if (!transaction.recentBlockhash) {
          throw new Error('Transaction missing recent blockhash');
        }
        if (!transaction.instructions || transaction.instructions.length === 0) {
          throw new Error('Transaction has no instructions');
        }
        
        let signedTransaction;
        try {
          // Phantom might reject transactions that are already partially signed
          // Make sure the transaction is completely unsigned
          if (transaction.signatures && transaction.signatures.length > 0) {
            console.warn('Transaction has existing signatures, clearing them...');
            transaction.signatures = [];
          }
          
          signedTransaction = await provider.signTransaction(transaction);
          console.log('Transaction signed successfully');
          
          // DO NOT modify the transaction after signing - it will break signature verification
          // Just log what we got from Phantom
          console.log('Signed transaction details from Phantom:', {
            feePayer: signedTransaction.feePayer?.toString(),
            signatures: signedTransaction.signatures?.length || 0,
            recentBlockhash: signedTransaction.recentBlockhash,
            lastValidBlockHeight: signedTransaction.lastValidBlockHeight,
            hasLastValidBlockHeight: signedTransaction.lastValidBlockHeight !== undefined
          });
          
          // Log signature details to understand the structure
          if (signedTransaction.signatures) {
            console.log('Signature details:', signedTransaction.signatures.map((sig, i) => ({
              index: i,
              publicKey: sig?.publicKey?.toString() || 'unknown',
              hasSignature: !!sig?.signature,
              signatureLength: sig?.signature?.length || 0
            })));
          }
          
          // Note: We cannot modify the transaction after signing without breaking signature verification
          // If lastValidBlockHeight is missing, we'll need to work around it during serialization
          if (signedTransaction.lastValidBlockHeight === undefined) {
            console.warn('⚠️ lastValidBlockHeight is undefined after signing');
            console.warn('This may cause serialization issues, but we cannot modify the transaction after signing');
          }
        } catch (signError) {
          console.error('Error signing transaction:', signError);
          console.error('Transaction details:', {
            feePayer: transaction.feePayer?.toString(),
            instructions: transaction.instructions?.length,
            recentBlockhash: transaction.recentBlockhash,
            lastValidBlockHeight: transaction.lastValidBlockHeight
          });
          
          // Try to get more details about the error
          if (signError.message) {
            throw new Error(`Wallet signing failed: ${signError.message}`);
          } else if (signError.toString) {
            throw new Error(`Wallet signing failed: ${signError.toString()}`);
          } else {
            throw new Error('Wallet signing failed: Unexpected error from Phantom wallet. The transaction may be too large or contain invalid accounts.');
          }
        }

        // Serialize the signed transaction
        // Note: Phantom has already signed it, so we just need to serialize it
        let serializedTx;
        try {
          // If lastValidBlockHeight is missing, try to set it before serialization
          // But only if it's truly missing (not part of signed message)
          if (signedTransaction.lastValidBlockHeight === undefined) {
            console.log('Attempting to set lastValidBlockHeight before serialization...');
            // Try setting it on a copy or directly - this is risky but necessary
            const txForSerialization = signedTransaction;
            // Use Object.assign to create a shallow copy with the property
            txForSerialization.lastValidBlockHeight = lastValidBlockHeight;
          }
          
          // Try to serialize - this will verify signatures by default
          serializedTx = signedTransaction.serialize();
          console.log('Transaction serialized successfully, length:', serializedTx.length);
        } catch (serializeError) {
          console.error('Error serializing transaction:', serializeError);
          console.error('Signed transaction details:', {
            signatures: signedTransaction.signatures?.length || 0,
            feePayer: signedTransaction.feePayer?.toString(),
            instructions: signedTransaction.instructions?.length || 0,
            recentBlockhash: signedTransaction.recentBlockhash,
            lastValidBlockHeight: signedTransaction.lastValidBlockHeight
          });
          
          // Check if the issue is signature verification
          if (serializeError.message && (serializeError.message.includes('verification') || serializeError.message.includes('signature'))) {
            console.error('Signature verification failed. Attempting workaround...');
            console.error('Details:', {
              feePayerMatch: signedTransaction.feePayer?.toString() === walletPublicKey,
              hasSignatures: signedTransaction.signatures?.length > 0
            });
            
            // Workaround: Try to serialize without verification by using internal methods
            // This is a workaround for Phantom not preserving lastValidBlockHeight
            try {
              console.log('Attempting manual serialization workaround...');
              
              // Get the message bytes (this doesn't verify signatures)
              const message = signedTransaction.compileMessage();
              const messageBytes = message.serialize();
              
              // Get signatures - Phantom returns them in various formats
              // IMPORTANT: The signatures array should match the signers in the transaction
              // Only the fee payer needs a real signature; PDAs use empty signatures (all zeros)
              const signatures = signedTransaction.signatures || [];
              
              // The transaction should have signatures for all signers in the instructions
              // But only the fee payer (first signer) will have a real signature
              // Count the actual signers from the compiled message
              const actualSignerCount = message.header.numRequiredSignatures;
              const signatureCount = Math.max(signatures.length, actualSignerCount);
              console.log(`Transaction requires ${actualSignerCount} signature(s), ${signatures.length} provided`);
              
              // Log full signature details to understand the structure
              console.log('Signature details:', signatures.map((sig, i) => {
                const details = {
                  index: i,
                  type: typeof sig,
                  isArray: Array.isArray(sig),
                  isUint8Array: sig instanceof Uint8Array,
                  keys: typeof sig === 'object' && sig !== null ? Object.keys(sig) : [],
                  hasSignature: !!sig?.signature,
                  hasPublicKey: !!sig?.publicKey,
                  length: sig?.length || sig?.signature?.length
                };
                // Log the actual signature object structure
                console.log(`Signature ${i} full object:`, sig);
                return details;
              }));
              
              // Build the serialized transaction: [signature_count (u8)] + [signatures (64 bytes each)] + [message]
              const signatureBytes = new Uint8Array(64 * signatureCount);
              for (let i = 0; i < signatureCount; i++) {
                const sig = signatures[i];
                let sigBytes = null;
                
                if (!sig) {
                  // Empty signature (all zeros for unsigned accounts)
                  sigBytes = new Uint8Array(64);
                } else if (sig instanceof Uint8Array && sig.length === 64) {
                  // Raw Uint8Array signature
                  sigBytes = sig;
                } else if (sig.signature) {
                  // Object with signature property - could be Uint8Array or array
                  if (sig.signature instanceof Uint8Array && sig.signature.length === 64) {
                    sigBytes = sig.signature;
                  } else if (Array.isArray(sig.signature) && sig.signature.length === 64) {
                    sigBytes = new Uint8Array(sig.signature);
                  } else if (typeof sig.signature === 'string') {
                    // Base58 encoded signature - decode it
                    const PublicKey = solanaWeb3.PublicKey;
                    try {
                      sigBytes = PublicKey.decode(sig.signature);
                    } catch (e) {
                      // Try as base64
                      sigBytes = Uint8Array.from(atob(sig.signature), c => c.charCodeAt(0));
                    }
                  }
                } else if (Array.isArray(sig) && sig.length === 64) {
                  // Array of numbers
                  sigBytes = new Uint8Array(sig);
                } else if (typeof sig === 'object' && sig.data) {
                  // Alternative format with data property
                  if (sig.data instanceof Uint8Array && sig.data.length === 64) {
                    sigBytes = sig.data;
                  } else if (Array.isArray(sig.data) && sig.data.length === 64) {
                    sigBytes = new Uint8Array(sig.data);
                  }
                } else if (typeof sig === 'object') {
                  // Try to find the signature bytes in the object
                  // Check common property names
                  const possibleProps = ['bytes', 'data', 'value', 'sig', 'signatureBytes'];
                  for (const prop of possibleProps) {
                    if (sig[prop]) {
                      if (sig[prop] instanceof Uint8Array && sig[prop].length === 64) {
                        sigBytes = sig[prop];
                        break;
                      } else if (Array.isArray(sig[prop]) && sig[prop].length === 64) {
                        sigBytes = new Uint8Array(sig[prop]);
                        break;
                      }
                    }
                  }
                  
                  // If still not found, try to extract from object values
                  if (!sigBytes) {
                    const values = Object.values(sig);
                    for (const val of values) {
                      if (val instanceof Uint8Array && val.length === 64) {
                        sigBytes = val;
                        break;
                      } else if (Array.isArray(val) && val.length === 64) {
                        sigBytes = new Uint8Array(val);
                        break;
                      }
                    }
                  }
                }
                
                if (sigBytes && sigBytes.length === 64) {
                  signatureBytes.set(sigBytes, i * 64);
                  console.log(`✓ Extracted signature ${i} successfully`);
                } else {
                  // If signature is null, this account is marked as a signer but doesn't have a signature
                  // This can happen for:
                  // 1. Program-derived addresses (PDAs) that don't need signatures
                  // 2. Accounts that should be signed by the backend but weren't
                  // 3. Accounts that are incorrectly marked as signers
                  // Use empty signature (all zeros) - the transaction will fail if the account actually needs a signature
                  console.warn(`⚠️ Signature ${i} is null for publicKey: ${sig?.publicKey?.toString() || 'unknown'}`);
                  console.warn(`Using empty signature (all zeros) - this may cause transaction to fail if signature is required`);
                  signatureBytes.set(new Uint8Array(64), i * 64);
                }
              }
              
              // Combine: signature_count + signatures + message
              serializedTx = new Uint8Array(1 + signatureBytes.length + messageBytes.length);
              serializedTx[0] = signatureCount;
              serializedTx.set(signatureBytes, 1);
              serializedTx.set(messageBytes, 1 + signatureBytes.length);
              
              console.log('Manual serialization successful, length:', serializedTx.length);
            } catch (manualError) {
              console.error('Manual serialization also failed:', manualError);
              console.error('Full error:', manualError);
              throw new Error(
                'Signature verification failed and manual serialization workaround also failed.\n\n' +
                'This is likely due to Phantom wallet compatibility issues.\n\n' +
                'Please try:\n' +
                '1. Update Phantom wallet to the latest version\n' +
                '2. Try minting again\n' +
                '3. If the issue persists, contact support\n\n' +
                'Original error: ' + serializeError.message + '\n' +
                'Manual serialization error: ' + manualError.message
              );
            }
          } else {
            throw new Error(`Failed to serialize signed transaction: ${serializeError.message}`);
          }
        }

        let signature;
        try {
          signature = await connection.sendRawTransaction(
            serializedTx,
            {
              skipPreflight: false,
              maxRetries: 3
            }
          );
        } catch (sendError) {
          console.error('Error sending transaction:', sendError);
          
          // Try to get more details from the error
          if (sendError.logs) {
            console.error('Transaction logs:', sendError.logs);
          }
          if (sendError.getLogs) {
            try {
              const logs = await sendError.getLogs();
              console.error('Transaction logs:', logs);
            } catch (logError) {
              console.error('Could not get logs:', logError);
            }
          }
          
          // If it's a signature verification failure, the issue is with the signatures
          if (sendError.message && sendError.message.includes('signature')) {
            const errorMsg = 
              'Transaction signature verification failed on-chain.\n\n' +
              'The transaction requires 3 signatures:\n' +
              '1. Your wallet (✓ signed)\n' +
              '2. ' + (signedTransaction.signatures?.[1]?.publicKey?.toString() || 'Unknown') + ' (✗ null signature)\n' +
              '3. ' + (signedTransaction.signatures?.[2]?.publicKey?.toString() || 'Unknown') + ' (✗ null signature)\n\n' +
              'These accounts need real signatures, not empty ones.\n' +
              'The backend needs to sign these accounts before sending the transaction.\n\n' +
              'Error: ' + sendError.message;
            
            console.error('Full error details:', {
              error: sendError,
              signatures: signedTransaction.signatures?.map((sig, i) => ({
                index: i,
                publicKey: sig?.publicKey?.toString(),
                hasSignature: !!sig?.signature
              }))
            });
            
            throw new Error(errorMsg);
          }
          
          throw sendError;
        }

        console.log("Transaction sent:", signature);

        // Confirm transaction
        await connection.confirmTransaction(signature, 'confirmed');

        const explorerUrl = SOLANA_NETWORK === 'devnet'
          ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
          : `https://explorer.solana.com/tx/${signature}`;

        const mintAddressText = apiResult.mintAddress 
          ? `Mint Address: ${apiResult.mintAddress}\n` 
          : "Mint Address: (Check transaction details)\n";
        
        alert("✅ Mint successful!\n\n" + mintAddressText + "Transaction: " + signature + "\n\nView on Explorer:\n" + explorerUrl);
        mintButton.disabled = false;
        mintButton.textContent = "Mint NFT";

        // Update minted count if element exists
        const mintedElement = document.querySelector('[style*="Minted"]')?.parentElement?.querySelector('div:last-child');
        if (mintedElement) {
          // Fetch updated count from API
          try {
            const cmResponse = await fetch(`${BACKEND_API_URL}/api/candy-machine`);
            if (cmResponse.ok) {
              const cmData = await cmResponse.json();
              mintedElement.textContent = `${cmData.itemsMinted} / ${cmData.itemsAvailable}`;
            }
          } catch (err) {
            console.error("Error updating minted count:", err);
          }
        }

        return;
      } else {
        throw new Error(apiResult.error || "Unknown error from API");
      }
    } catch (apiError) {
      console.error("Backend API error:", apiError);
      
      // Fallback to local function if backend is not available
      if (typeof window.mintFromCandyMachine === 'function') {
        try {
          const result = await window.mintFromCandyMachine(provider, CANDY_MACHINE_ID, SOLANA_NETWORK);
          
          if (result.success) {
            alert("✅ Mint successful!\n\nMint Address: " + result.mint + "\nTransaction: " + result.signature + "\n\nView on Explorer:\n" + result.explorerUrl);
            mintButton.disabled = false;
            mintButton.textContent = "Mint NFT";
            return;
          } else {
            // Show helpful message about needing backend
            alert(result.message + "\n\n" + result.instructions);
            mintButton.disabled = false;
            mintButton.textContent = "Mint NFT";
            return;
          }
        } catch (err) {
          console.error("Mint function error:", err);
        }
      }
      
      // If both fail, show error
      throw new Error("Minting failed: " + apiError.message + "\n\nMake sure the backend server is running at " + BACKEND_API_URL);
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
