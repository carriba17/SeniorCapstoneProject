// Carter Arribas
// Candy Machine v3 Minting Functionality
// This file implements minting by building the instruction manually using web3.js
// (mpl-candy-machine-core doesn't work well in browsers, so we build it ourselves)

async function mintFromCandyMachine(provider, candyMachineId, network = 'devnet') {
  try {

    // Create connection
    // Use window.solanaWeb3 to avoid MetaMask's web3 override
    const solanaWeb3 = window.solanaWeb3;
    const solanaSplToken = window.solanaSplToken;
    
    if (!solanaWeb3) {
      throw new Error("Solana web3.js library not loaded. Make sure the script is loaded.");
    }
    
    if (!solanaSplToken) {
      throw new Error("Solana spl-token library not loaded. Make sure the script is loaded.");
    }
    
    const clusterUrl = network === 'devnet' 
                      ? 'https://api.devnet.solana.com' 
                      : 'https://api.mainnet-beta.solana.com';
    
    // Use Solana web3.js classes
    const Connection = solanaWeb3.Connection;
    const PublicKey = solanaWeb3.PublicKey;
    const Keypair = solanaWeb3.Keypair;
    const SystemProgram = solanaWeb3.SystemProgram;
    const Transaction = solanaWeb3.Transaction;
    
    if (!Connection || !PublicKey || !Keypair) {
      throw new Error("Connection, PublicKey, or Keypair not found in Solana web3.js");
    }
    
    const connection = new Connection(clusterUrl, 'confirmed');
    const payer = new PublicKey(provider.publicKey.toString());
    const candyMachinePubkey = new PublicKey(candyMachineId);

    // Verify Candy Machine exists
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
      payer
    );

    // Candy Machine v3 Program ID
    const CANDY_MACHINE_PROGRAM_ID = new PublicKey(
      "CndyV3LdqHUfDLmE5naZjVN8rBZDA4mDNUoUzQpKqJqF"
    );

    // Token Metadata Program ID
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // Collection mint (from cache.json)
    const collectionMint = new PublicKey("95hHrnvZAXjhfT1NbjW6D7t4YXtbctUMXnTxM4gjqgFe");

    // Helper function to convert string to Uint8Array (Browser-compatible Buffer alternative)
    function stringToBytes(str) {
      return new TextEncoder().encode(str);
    }

    // Derive PDAs (Program Derived Addresses)
    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [stringToBytes("candy_machine"), candyMachinePubkey.toBuffer()],
      CANDY_MACHINE_PROGRAM_ID
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        stringToBytes("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [masterEdition] = PublicKey.findProgramAddressSync(
      [
        stringToBytes("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        stringToBytes("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMetadata] = PublicKey.findProgramAddressSync(
      [
        stringToBytes("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMasterEdition] = PublicKey.findProgramAddressSync(
      [
        stringToBytes("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        stringToBytes("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Browser-based minting is complex. For now, provide helpful instructions.
    // In production, you should set up a backend API that handles minting.
    
    const explorerUrl = network === 'devnet'
      ? `https://explorer.solana.com/address/${candyMachineId}?cluster=devnet`
      : `https://explorer.solana.com/address/${candyMachineId}`;
    
    const message = 
      "Browser-based minting requires a backend service.\n\n" +
      "Options:\n" +
      "1. Use Sugar CLI from terminal:\n" +
      "   sugar mint --keypair ~/.config/solana/id.json --number 1\n\n" +
      "2. Set up a backend API endpoint (recommended for production)\n" +
      "   The backend should use @metaplex-foundation/js or Sugar CLI\n\n" +
      "Candy Machine: " + candyMachineId + "\n" +
      "View: " + explorerUrl;
    
    // Return helpful info instead of throwing error
    return {
      success: false,
      needsBackend: true,
      message: message,
      candyMachineId: candyMachineId,
      explorerUrl: explorerUrl,
      instructions: "To enable browser minting, set up a backend API endpoint that builds and sends the mint transaction."
    };
  } catch (error) {
    console.error("Mint error:", error);
    throw error;
  }
}

// Make function available globally
window.mintFromCandyMachine = mintFromCandyMachine;
