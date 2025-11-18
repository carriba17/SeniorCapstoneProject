// Carter Arribas
// Separate signing service for mint signer keypair
// This service handles signing transactions with the mint signer keypair
// Run on a different port (e.g., 3002) for separation of concerns

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Transaction, Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SIGNING_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large transaction payloads

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'signing-service' });
});

// Sign transaction endpoint
// Expects: { transaction: base64_serialized_transaction, mintSignerPublicKey: string }
// Returns: { transaction: base64_serialized_transaction (signed) }
app.post('/api/sign', async (req, res) => {
  try {
    const { transaction: transactionBase64, mintSignerPublicKey } = req.body;

    if (!transactionBase64) {
      return res.status(400).json({ error: 'Transaction is required' });
    }

    if (!mintSignerPublicKey) {
      return res.status(400).json({ error: 'Mint signer public key is required' });
    }

    console.log('Received signing request for mint signer:', mintSignerPublicKey);

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(transactionBase64, 'base64');
    const transaction = Transaction.from(transactionBuffer);

    // Get the mint signer keypair
    // Option 1: From environment variable (for development/testing)
    // Option 2: From secure key management service (for production)
    // Option 3: From a keypair file (similar to main backend)
    
    let mintSignerKeypair = null;
    
    // Try to get keypair from environment variable (base64 encoded secret key)
    if (process.env.MINT_SIGNER_SECRET_KEY) {
      try {
        const secretKeyArray = JSON.parse(process.env.MINT_SIGNER_SECRET_KEY);
        mintSignerKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        console.log('Loaded mint signer keypair from environment variable');
      } catch (e) {
        console.error('Failed to load keypair from environment variable:', e.message);
      }
    }
    
    // Try to get keypair from file path
    if (!mintSignerKeypair && process.env.MINT_SIGNER_KEYPAIR_PATH) {
      try {
        const keypairPath = process.env.MINT_SIGNER_KEYPAIR_PATH;
        if (fs.existsSync(keypairPath)) {
          const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
          mintSignerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
          console.log('Loaded mint signer keypair from file:', keypairPath);
        }
      } catch (e) {
        console.error('Failed to load keypair from file:', e.message);
      }
    }
    
    // Check if the keypair is actually a signer in the transaction
    if (!mintSignerKeypair) {
      return res.status(500).json({
        error: 'Mint signer keypair not available',
        message: 'Configure MINT_SIGNER_SECRET_KEY or MINT_SIGNER_KEYPAIR_PATH environment variable'
      });
    }
    
    const keypairPublicKey = mintSignerKeypair.publicKey.toString();
    
    // Check if this keypair is actually a signer in the transaction
    // The transaction might have different signers than expected
    const compiledMessage = transaction.compileMessage();
    const signerPubkeys = compiledMessage.accountKeys
      .slice(0, compiledMessage.header.numRequiredSignatures)
      .map(key => key.toString());
    
    console.log('Transaction signers:', signerPubkeys);
    console.log('Keypair public key:', keypairPublicKey);
    console.log('Requested mint signer:', mintSignerPublicKey);
    
    // Check if our keypair is in the signer list
    const isSigner = signerPubkeys.includes(keypairPublicKey);
    
    if (!isSigner) {
      // The keypair we have doesn't match any signer in the transaction
      // This could mean:
      // 1. The mint signer is a PDA (doesn't need our signature)
      // 2. The mint signer is different for each mint
      // 3. We have the wrong keypair
      
      console.warn(`⚠️ Keypair (${keypairPublicKey}) is not a signer in this transaction`);
      console.warn(`   Transaction signers: ${signerPubkeys.join(', ')}`);
      console.warn(`   Requested mint signer: ${mintSignerPublicKey}`);
      
      // Check if the requested mint signer is in the transaction
      if (signerPubkeys.includes(mintSignerPublicKey)) {
        return res.status(400).json({
          error: 'Keypair mismatch',
          message: `The keypair in the file (${keypairPublicKey}) doesn't match the required signer (${mintSignerPublicKey}). You may need to extract a new keypair for this specific mint.`,
          requiredSigner: mintSignerPublicKey,
          providedKeypair: keypairPublicKey,
          transactionSigners: signerPubkeys
        });
      } else {
        // The requested signer isn't even in the transaction - might be a PDA
        return res.status(400).json({
          error: 'Signer not found in transaction',
          message: `The requested mint signer (${mintSignerPublicKey}) is not a signer in this transaction. It might be a PDA that doesn't need a signature.`,
          transactionSigners: signerPubkeys
        });
      }
    }
    
    // Verify the keypair matches the requested public key
    if (keypairPublicKey !== mintSignerPublicKey) {
      console.warn(`⚠️ Keypair public key (${keypairPublicKey}) doesn't match requested (${mintSignerPublicKey})`);
      console.warn('   But it is a signer in the transaction, proceeding...');
    }
    
    // Sign the transaction
    console.log('Signing transaction with mint signer keypair...');
    transaction.partialSign(mintSignerKeypair);
    
    // Serialize the signed transaction
    const signedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const signedTxBase64 = Buffer.from(signedTx).toString('base64');
    
    console.log('Transaction signed successfully');
    console.log('Transaction has', transaction.signatures.length, 'signature(s)');
    
    res.json({
      success: true,
      transaction: signedTxBase64
    });

  } catch (error) {
    console.error('Error in signing service:', error);
    res.status(500).json({ 
      error: 'Failed to sign transaction',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 Signing service running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/sign - Sign transaction with mint signer');
});

