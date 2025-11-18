// Carter Arribas
// Backend API for minting NFTs from Candy Machine v3
// This server handles the complex instruction building that can't be done in the browser

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration from environment variables or defaults
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const CANDY_MACHINE_ID = process.env.CANDY_MACHINE_ID || 'GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL';
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || path.join(process.env.HOME, '.config', 'solana', 'id.json');

// Initialize Solana connection
const connection = new Connection(
  SOLANA_NETWORK === 'devnet' 
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Load keypair (for signing transactions if needed)
let walletKeypair = null;
try {
  if (fs.existsSync(KEYPAIR_PATH)) {
    const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
    walletKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    console.log('✓ Wallet keypair loaded');
  } else {
    console.warn('⚠ Keypair not found at:', KEYPAIR_PATH);
    console.warn('  Transactions will need to be signed by the user wallet');
  }
} catch (error) {
  console.error('Error loading keypair:', error.message);
}

// Initialize Metaplex
const metaplex = Metaplex.make(connection);
if (walletKeypair) {
  metaplex.use(keypairIdentity(walletKeypair));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    network: SOLANA_NETWORK,
    candyMachine: CANDY_MACHINE_ID 
  });
});

// Handle Chrome DevTools connection attempt (silences CSP warning)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).send(); // No Content
});

// Handle favicon requests (prevents 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No Content
});

// Mint endpoint
// POST /api/mint
// Body: { walletAddress: string }
app.post('/api/mint', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'walletAddress is required' 
      });
    }

    console.log(`Minting request from wallet: ${walletAddress}`);

    // Validate wallet address
    let payerPublicKey;
    try {
      payerPublicKey = new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format' 
      });
    }

    // Get Candy Machine
    const candyMachinePublicKey = new PublicKey(CANDY_MACHINE_ID);
    
    // Fetch the Candy Machine account
    const candyMachine = await metaplex.candyMachines().findByAddress({
      address: candyMachinePublicKey,
    });

    if (!candyMachine) {
      return res.status(404).json({ 
        error: 'Candy Machine not found' 
      });
    }

    // Safely log Candy Machine info
    const cmAddress = candyMachine?.address ? candyMachine.address.toString() : 'unknown';
    const itemsAvailable = candyMachine?.itemsAvailable ? candyMachine.itemsAvailable.toNumber() : 0;
    const itemsMinted = candyMachine?.itemsMinted ? candyMachine.itemsMinted.toNumber() : 0;
    
    console.log(`Candy Machine found: ${cmAddress}`);
    console.log(`Items available: ${itemsAvailable}`);
    console.log(`Items minted: ${itemsMinted}`);

    // Check if there are items available (reuse values from above)
    // itemsMinted and itemsAvailable already calculated above
    
    if (itemsMinted >= itemsAvailable) {
      return res.status(400).json({ 
        error: 'Candy Machine is sold out' 
      });
    }

    // Build the mint instruction
    // Note: The user's wallet will need to sign this transaction
    // We'll return the transaction for the frontend to sign and send
    
    // Create a mint instruction builder
    // Note: For Candy Machine v3, the mint signer is typically a PDA that doesn't need a signature
    // but Metaplex still marks it as a signer in the transaction structure
    console.log('Creating mint builder...');
    let mintBuilder;
    try {
      mintBuilder = await metaplex.candyMachines().builders().mint({
        candyMachine,
        payer: payerPublicKey,
        // Try to let Metaplex handle signers automatically
        // The mint signer should be a PDA that doesn't need a real signature
      });
      console.log('Mint builder created');
      
      // Log the mint context to understand signers
      try {
        const context = mintBuilder.getContext();
        console.log('Mint context:', {
          mintSigner: context.mintSigner?.toString() || (context.mintSigner ? 'Object' : 'undefined'),
          mintAddress: context.mintAddress?.toString() || (context.mintAddress ? 'Object' : 'undefined'),
          payer: context.payer?.toString() || (context.payer ? 'Object' : 'undefined'),
          tokenAddress: context.tokenAddress?.toString() || (context.tokenAddress ? 'Object' : 'undefined'),
          allKeys: Object.keys(context || {})
        });
        
        // Try to get the mint signer public key
        if (context.mintSigner) {
          let mintSignerPubkey = null;
          if (context.mintSigner instanceof PublicKey) {
            mintSignerPubkey = context.mintSigner;
          } else if (context.mintSigner.publicKey) {
            mintSignerPubkey = context.mintSigner.publicKey;
          } else if (context.mintSigner.toString) {
            try {
              mintSignerPubkey = new PublicKey(context.mintSigner.toString());
            } catch (e) {
              console.warn('Could not convert mintSigner to PublicKey:', e.message);
            }
          }
          
          if (mintSignerPubkey) {
            console.log('Mint signer public key:', mintSignerPubkey.toString());
            console.log('Mint signer type:', context.mintSigner.constructor?.name || typeof context.mintSigner);
          }
        }
      } catch (e) {
        console.warn('Could not get mint context:', e.message);
      }
    } catch (builderError) {
      console.error('Error creating mint builder:', builderError);
      throw new Error(`Failed to create mint instruction: ${builderError.message}`);
    }

    // Instead of building a transaction manually, try using Metaplex's send method
    // with a custom signer that only uses the user's wallet
    // This should handle PDAs automatically
    console.log('Attempting to use Metaplex send with custom signer...');
    
    // Create a custom signer that only signs with the user's public key
    // This is a "no-op" signer - it doesn't actually sign, but tells Metaplex
    // that only the user's wallet needs to sign
    const userSigner = {
      publicKey: payerPublicKey,
      signMessage: async (message) => {
        // This won't be called - we're returning the transaction for frontend signing
        throw new Error('Signing should happen on frontend');
      },
      signTransaction: async (tx) => {
        // This won't be called - we're returning the transaction for frontend signing
        throw new Error('Signing should happen on frontend');
      },
      signAllTransactions: async (txs) => {
        // This won't be called - we're returning the transaction for frontend signing
        throw new Error('Signing should happen on frontend');
      }
    };
    
    // Get the mint signer from context - it may be a Keypair that needs signing
    // If it's a Keypair, we'll sign it on the backend; if it's a PDA, it uses empty signature
    let mintAddress = null;
    let mintSignerKeypair = null;
    try {
      const context = mintBuilder.getContext();
      if (context.mintSigner) {
        // Check if mintSigner is a Keypair (has secretKey property)
        if (context.mintSigner.secretKey) {
          // It's a Keypair - we need to sign with it
          mintSignerKeypair = context.mintSigner;
          mintAddress = context.mintSigner.publicKey;
          console.log('Mint signer is a Keypair - backend will sign it');
          console.log('Mint address (Keypair signer):', mintAddress.toString());
        } else if (context.mintSigner.publicKey) {
          // It might be a Keypair object but we can't access secretKey
          // Try to get it as a PublicKey
          mintAddress = context.mintSigner.publicKey instanceof PublicKey
            ? context.mintSigner.publicKey
            : new PublicKey(context.mintSigner.publicKey.toString());
          console.log('Mint address from mintSigner.publicKey:', mintAddress.toString());
          console.log('Note: If this is a Keypair, backend signing may be needed');
        } else if (context.mintAddress) {
          // Try mintAddress directly (might be a PDA)
          mintAddress = context.mintAddress instanceof PublicKey 
            ? context.mintAddress 
            : new PublicKey(context.mintAddress.toString());
          console.log('Mint address (PDA signer):', mintAddress.toString());
        }
      } else if (context.mintAddress) {
        mintAddress = context.mintAddress instanceof PublicKey 
          ? context.mintAddress 
          : new PublicKey(context.mintAddress.toString());
        console.log('Mint address (PDA signer):', mintAddress.toString());
      }
    } catch (e) {
      console.warn('Could not get mint address from context:', e.message);
    }
    
    // Get the transaction (unsigned, needs user signature)
    // We need to get recent blockhash first
    console.log('Getting recent blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log('Blockhash obtained:', blockhash);
    
    console.log('Building transaction...');
    let transaction;
    try {
      // Get instructions from the mint builder
      const instructions = mintBuilder.getInstructions();
      console.log(`Got ${instructions.length} instruction(s) from mint builder`);
      
      // Build a new transaction with only the user as fee payer
      transaction = new Transaction({
        feePayer: payerPublicKey,
        blockhash,
        lastValidBlockHeight,
      });
      
      // Add instructions, but modify signer flags
      // CRITICAL: Keep signer flags for:
      // 1. Payer (user's wallet) - needs real signature
      // 2. Mint address (PDA) - needs signer flag but uses empty signature
      // Remove signer flags from all other accounts
      for (const instruction of instructions) {
        // Modify account metas to keep payer and mint address as signers
        const modifiedKeys = instruction.keys.map((accountMeta) => {
          // Handle undefined pubkey
          if (!accountMeta || !accountMeta.pubkey) {
            console.warn('Found undefined accountMeta or pubkey, using payer as fallback');
            return {
              pubkey: payerPublicKey,
              isSigner: true, // Payer is always a signer
              isWritable: accountMeta?.isWritable || false
            };
          }
          
          const pubkey = accountMeta.pubkey;
          // Ensure pubkey has toString method
          let pubkeyString;
          try {
            pubkeyString = pubkey.toString();
          } catch (e) {
            console.warn('Could not convert pubkey to string, using payer as fallback:', e.message);
            return {
              pubkey: payerPublicKey,
              isSigner: true,
              isWritable: accountMeta.isWritable || false
            };
          }
          
          const isPayer = pubkeyString === payerPublicKey.toString();
          const isMintAddress = mintAddress && pubkeyString === mintAddress.toString();
          
          // Keep signer flag if it's the payer or mint address (PDA)
          // The mint address is a PDA that needs the signer flag but uses empty signature
          const shouldBeSigner = isPayer || isMintAddress;
          
          return {
            pubkey: pubkey,
            isSigner: shouldBeSigner, // Set to true for payer/mint, false for others
            isWritable: accountMeta.isWritable || false
          };
        });
        
        // Create new instruction with modified keys
        const modifiedInstruction = new TransactionInstruction({
          programId: instruction.programId,
          keys: modifiedKeys,
          data: instruction.data
        });
        
        transaction.add(modifiedInstruction);
      }
      
      // Ensure the transaction only has the fee payer in its signatures array
      transaction.signatures = [];
      
      // Verify the transaction structure
      let totalSigners = 0;
      let payerSignerCount = 0;
      for (const instruction of transaction.instructions) {
        for (const key of instruction.keys) {
          if (key.isSigner) {
            totalSigners++;
            if (key.pubkey.toString() === payerPublicKey.toString()) {
              payerSignerCount++;
            }
          }
        }
      }
      
      console.log('Transaction built with payer and mint address (PDA) as signers');
      console.log('Removed signer flags from other accounts');
      console.log('Fee payer:', payerPublicKey.toString());
      if (mintAddress) {
        console.log('Mint address (PDA):', mintAddress.toString());
      }
      console.log(`Total signers in instructions: ${totalSigners} (payer: ${payerSignerCount}, mint: ${totalSigners - payerSignerCount})`);
      
      // Compile the transaction to verify signature count
      try {
        const compiledMessage = transaction.compileMessage();
        const requiredSignatures = compiledMessage.header.numRequiredSignatures;
        console.log(`Transaction requires ${requiredSignatures} signature(s) at transaction level`);
        if (requiredSignatures !== 1) {
          console.warn(`⚠️ WARNING: Transaction requires ${requiredSignatures} signatures, but should only require 1 (payer)`);
        }
      } catch (e) {
        console.warn('Could not compile transaction to verify signature count:', e.message);
      }
      
    } catch (txError) {
      console.error('Error building transaction:', txError);
      throw new Error(`Failed to build transaction: ${txError.message}`);
    }

    // Fix undefined pubkeys and handle signers properly
    // For Candy Machine mints, some accounts are marked as signers but are actually PDAs
    // that don't need signatures. We need to identify and handle these correctly.
    if (transaction.instructions) {
      let fixedCount = 0;
      let signerCount = 0;
      
      // Get mint context to understand which signers are needed
      let mintContext = null;
      try {
        mintContext = mintBuilder.getContext();
        console.log('Mint context available, checking signers...');
      } catch (e) {
        console.warn('Could not get mint context:', e.message);
      }
      
      for (const instruction of transaction.instructions) {
        if (instruction.keys) {
          for (let i = 0; i < instruction.keys.length; i++) {
            const accountMeta = instruction.keys[i];
            
            // Fix undefined pubkeys
            if (!accountMeta || !accountMeta.pubkey) {
              console.warn(`Found undefined pubkey at index ${i} in instruction, replacing with payer address`);
              if (accountMeta) {
                accountMeta.pubkey = payerPublicKey;
              } else {
                instruction.keys[i] = {
                  pubkey: payerPublicKey,
                  isWritable: false,
                  isSigner: false
                };
              }
              fixedCount++;
            } else if (accountMeta.pubkey && typeof accountMeta.pubkey.toString !== 'function') {
              // Handle case where pubkey might be wrapped in an object
              console.warn(`Found pubkey that is not a PublicKey at index ${i}, attempting to extract`);
              if (accountMeta.pubkey.publicKey) {
                accountMeta.pubkey = accountMeta.pubkey.publicKey;
              } else if (accountMeta.pubkey.address) {
                accountMeta.pubkey = new PublicKey(accountMeta.pubkey.address);
              }
            }
            
            // Log signer accounts for debugging
            if (accountMeta && accountMeta.isSigner) {
              signerCount++;
              const pubkeyStr = accountMeta.pubkey?.toString() || 'unknown';
              console.log(`Signer ${signerCount} at instruction index ${i}: ${pubkeyStr}`);
              
              // If this signer is not the payer, it might be a PDA that doesn't need a signature
              // or it needs to be signed by the backend. For now, we'll leave it as is
              // and let the frontend handle it (it will use empty signatures for non-payer signers)
            }
          }
        }
      }
      
      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} undefined pubkey(s) in transaction`);
      }
      console.log(`Transaction has ${signerCount} signer account(s)`);
    }

    // Sign the transaction with the mint signer keypair if it's a Keypair (not a PDA)
    // NOTE: If mintSignerKeypair is available, it means Metaplex generated a dynamic keypair
    // for this specific mint. We should sign it locally since we have access to it.
    // The signing service is for fixed keypairs that are stored separately.
    
    if (mintSignerKeypair && mintAddress) {
      // We have the keypair directly from Metaplex - sign it locally
      // This is a dynamically generated keypair for this specific mint
      console.log('Signing transaction locally with mint signer keypair (dynamic keypair from Metaplex)...');
      transaction.partialSign(mintSignerKeypair);
      console.log('Transaction signed with mint signer keypair');
      console.log('Transaction now has', transaction.signatures.length, 'signature(s)');
      console.log('Mint signer public key:', mintAddress.toString());
    } else {
      console.log('Mint signer is a PDA or not available - no backend signing needed');
      console.log('PDAs are verified cryptographically by the program, not through signatures');
    }
    
    // NOTE: The transaction is now partially signed (with mint signer if it's a Keypair)
    // The user's wallet (Phantom) will add their signature for the fee payer
    // The transaction will be signed by:
    // 1. Mint signer keypair (if it's a Keypair) - signed by backend
    // 2. User's wallet (via Phantom) - for the fee payer
    // 3. PDAs (if any) - use empty signatures (handled by the program)
    
    console.log('Transaction prepared for frontend signing');
    console.log('Note: Transaction will be signed by user wallet via Phantom');
    if (mintSignerKeypair) {
      console.log('Note: Transaction is already partially signed with mint signer keypair');
    }

    // Serialize the transaction to base64 for the frontend
    console.log('Serializing transaction...');
    let serializedTransaction;
    try {
      serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      console.log('Transaction serialized, length:', serializedTransaction.length);
    } catch (serializeError) {
      console.error('Error serializing transaction:', serializeError);
      console.error('Transaction details:', {
        instructions: transaction.instructions?.length || 0,
        feePayer: transaction.feePayer?.toString() || 'undefined',
        recentBlockhash: transaction.recentBlockhash || 'undefined',
      });
      
      // Try to get more details about the transaction
      if (transaction.instructions) {
        transaction.instructions.forEach((ix, idx) => {
          console.error(`Instruction ${idx}:`, {
            programId: ix.programId?.toString() || 'undefined',
            keys: ix.keys?.length || 0,
            dataLength: ix.data?.length || 0,
          });
          if (ix.keys) {
            ix.keys.forEach((key, keyIdx) => {
              if (!key || !key.pubkey) {
                console.error(`  Invalid key at index ${keyIdx}:`, key);
              }
            });
          }
        });
      }
      
      throw new Error(`Failed to serialize transaction: ${serializeError.message}`);
    }

    // Get the mint address (the NFT that will be created)
    // Note: mintAddress was already determined earlier during transaction building
    console.log('Getting mint address for response...');
    
    // If mintAddress wasn't set earlier, try to get it now
    if (!mintAddress) {
      try {
        const mintContext = mintBuilder.getContext();
        console.log('Mint context keys:', Object.keys(mintContext || {}));
        
        // Try different ways to get the mint address
        if (mintContext) {
          // Try mintSigner.publicKey first
          if (mintContext.mintSigner?.publicKey) {
            mintAddress = mintContext.mintSigner.publicKey;
          }
          // Try mintAddress directly
          else if (mintContext.mintAddress) {
            mintAddress = mintContext.mintAddress instanceof PublicKey
              ? mintContext.mintAddress
              : new PublicKey(mintContext.mintAddress.toString());
          }
          // Try mintSigner as a PublicKey directly
          else if (mintContext.mintSigner instanceof PublicKey) {
            mintAddress = mintContext.mintSigner;
          }
        }
        
        if (mintAddress) {
          console.log('Mint address:', mintAddress.toString());
        } else {
          console.warn('⚠ Could not determine mint address from context. It will be null in response.');
          console.warn('   The transaction will still work, but the mint address will need to be determined after minting.');
        }
      } catch (mintAddressError) {
        console.warn('Could not extract mint address:', mintAddressError.message);
        // Continue without mint address - transaction will still work
      }
    } else {
      console.log('Mint address (from earlier):', mintAddress.toString());
    }

    // Convert Buffer to base64 string
    const transactionBase64 = Buffer.from(serializedTransaction).toString('base64');
    
    console.log('Sending response...');
    res.json({
      success: true,
      transaction: transactionBase64,
      mintAddress: mintAddress ? (typeof mintAddress === 'string' ? mintAddress : mintAddress.toString()) : null,
      candyMachine: CANDY_MACHINE_ID,
      network: SOLANA_NETWORK,
      message: 'Transaction created. Sign and send from frontend.'
    });
    console.log('Response sent successfully');

  } catch (error) {
    console.error('Mint error:', error);
    console.error('Error stack:', error.stack);
    
    // Safely extract error message
    let errorMessage = 'Unknown error occurred';
    if (error && typeof error === 'object') {
      errorMessage = error.message || error.toString() || 'Unknown error occurred';
    } else if (error) {
      errorMessage = String(error);
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error.stack || String(error)) : undefined
    });
  }
});

// Get Candy Machine info
app.get('/api/candy-machine', async (req, res) => {
  try {
    const candyMachinePublicKey = new PublicKey(CANDY_MACHINE_ID);
    
    const candyMachine = await metaplex.candyMachines().findByAddress({
      address: candyMachinePublicKey,
    });

    if (!candyMachine) {
      return res.status(404).json({ 
        error: 'Candy Machine not found' 
      });
    }

    const itemsAvailable = candyMachine.itemsAvailable?.toNumber() || 0;
    const itemsMinted = candyMachine.itemsMinted?.toNumber() || 0;
    
    res.json({
      address: candyMachine.address?.toString() || 'unknown',
      itemsAvailable: itemsAvailable,
      itemsMinted: itemsMinted,
      itemsRemaining: itemsAvailable - itemsMinted,
      price: candyMachine.candyGuard?.guards?.solPayment?.amount?.toNumber() || 0,
      network: SOLANA_NETWORK,
    });

  } catch (error) {
    console.error('Error fetching Candy Machine:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mint API server running on http://localhost:${PORT}`);
  console.log(`📡 Network: ${SOLANA_NETWORK}`);
  console.log(`🍬 Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /api/candy-machine - Get Candy Machine info`);
  console.log(`  POST /api/mint - Create mint transaction`);
});

