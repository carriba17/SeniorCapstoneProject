// Carter Arribas
// Script to extract and save the mint signer keypair from Metaplex
// This keypair is needed for the signing service

import dotenv from 'dotenv';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const CANDY_MACHINE_ID = process.env.CANDY_MACHINE_ID || 'GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL';
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || path.join(process.env.HOME, '.config', 'solana', 'id.json');
const OUTPUT_PATH = process.env.MINT_SIGNER_KEYPAIR_PATH || path.join(__dirname, 'mint-signer-keypair.json');

// Initialize Solana connection
const connection = new Connection(
  SOLANA_NETWORK === 'devnet' 
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Load wallet keypair
let walletKeypair = null;
try {
  if (fs.existsSync(KEYPAIR_PATH)) {
    const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
    walletKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    console.log('✓ Wallet keypair loaded');
  } else {
    console.error('❌ Wallet keypair not found at:', KEYPAIR_PATH);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading wallet keypair:', error.message);
  process.exit(1);
}

// Initialize Metaplex
const metaplex = Metaplex.make(connection).use(keypairIdentity(walletKeypair));

async function extractMintSigner() {
  try {
    console.log('\n🔍 Extracting mint signer keypair...\n');
    
    const candyMachineAddress = new PublicKey(CANDY_MACHINE_ID);
    const candyMachine = await metaplex.candyMachines().findByAddress({
      address: candyMachineAddress,
    });
    
    console.log('✓ Candy Machine found:', candyMachineAddress.toString());
    
    // Create a mint builder to get the mint signer
    // We'll use a dummy payer public key to build the context
    const dummyPayer = walletKeypair.publicKey;
    
    console.log('Creating mint builder to extract mint signer...');
    const mintBuilder = await metaplex.candyMachines().builders().mint({
      candyMachine,
      payer: dummyPayer,
    });
    
    // Get the mint context
    const context = mintBuilder.getContext();
    console.log('\n📋 Mint context keys:', Object.keys(context || {}));
    
    let mintSignerKeypair = null;
    let mintAddress = null;
    
    if (context.mintSigner) {
      // Check if it's a Keypair
      if (context.mintSigner.secretKey) {
        mintSignerKeypair = context.mintSigner;
        mintAddress = context.mintSigner.publicKey;
        console.log('✓ Mint signer is a Keypair');
        console.log('  Public Key:', mintAddress.toString());
      } else if (context.mintSigner.publicKey) {
        mintAddress = context.mintSigner.publicKey instanceof PublicKey
          ? context.mintSigner.publicKey
          : new PublicKey(context.mintSigner.publicKey.toString());
        console.log('⚠️  Mint signer has public key but no secret key accessible');
        console.log('  Public Key:', mintAddress.toString());
        console.log('  This might be a PDA or the secret key is not accessible');
        console.log('  You may need to generate a new keypair or use a different approach');
        process.exit(1);
      }
    } else if (context.mintAddress) {
      mintAddress = context.mintAddress instanceof PublicKey
        ? context.mintAddress
        : new PublicKey(context.mintAddress.toString());
      console.log('⚠️  Only mint address found (no signer)');
      console.log('  Mint Address:', mintAddress.toString());
      console.log('  This is likely a PDA - no keypair needed');
      process.exit(0);
    }
    
    if (!mintSignerKeypair) {
      console.error('❌ Could not extract mint signer keypair');
      console.error('   The mint signer might be a PDA or not accessible');
      process.exit(1);
    }
    
    // Convert secret key to JSON format (array of numbers)
    const secretKeyArray = Array.from(mintSignerKeypair.secretKey);
    
    // Save to file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(secretKeyArray, null, 2));
    
    console.log('\n✅ Mint signer keypair extracted and saved!');
    console.log('  File:', OUTPUT_PATH);
    console.log('  Public Key:', mintAddress.toString());
    console.log('\n📝 Next steps:');
    console.log('  1. Add this to your .env file:');
    console.log(`     MINT_SIGNER_KEYPAIR_PATH=${OUTPUT_PATH}`);
    console.log('  2. Make sure this file is NOT committed to git (add to .gitignore)');
    console.log('  3. Restart your signing service');
    
  } catch (error) {
    console.error('❌ Error extracting mint signer:', error);
    process.exit(1);
  }
}

extractMintSigner();

