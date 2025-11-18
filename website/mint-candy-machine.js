// Carter Arribas
// Candy Machine v3 Minting Functionality
// This file implements minting using the mpl-candy-machine-core library

async function mintFromCandyMachine(provider, candyMachineId, network = 'devnet') {
  try {
    // Check if library is loaded - it might be available as a global or module
    let mplCore;
    if (typeof mplCandyMachineCore !== 'undefined') {
      mplCore = mplCandyMachineCore;
    } else if (typeof window.mplCandyMachineCore !== 'undefined') {
      mplCore = window.mplCandyMachineCore;
    } else {
      // Try to access via common export names
      mplCore = window.mplCandyMachineCore || window.mplCandyMachine || window.CandyMachine;
      if (!mplCore) {
        throw new Error("mpl-candy-machine-core library not found. Please check the script tag in mint.html");
      }
    }

    // Create connection
    const connection = new web3.Connection(
      web3.clusterApiUrl(network),
      'confirmed'
    );

    const payer = new web3.PublicKey(provider.publicKey.toString());
    const candyMachinePubkey = new web3.PublicKey(candyMachineId);

    // Verify Candy Machine exists
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
      payer
    );

    // Candy Machine v3 Program ID
    const CANDY_MACHINE_PROGRAM_ID = new web3.PublicKey(
      "CndyV3LdqHUfDLmE5naZjVN8rBZDA4mDNUoUzQpKqJqF"
    );

    // Token Metadata Program ID
    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // Collection mint (from cache.json)
    const collectionMint = new web3.PublicKey("95hHrnvZAXjhfT1NbjW6D7t4YXtbctUMXnTxM4gjqgFe");

    // Derive PDAs (Program Derived Addresses)
    const [mintAuthority] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candy_machine"), candyMachinePubkey.toBuffer()],
      CANDY_MACHINE_PROGRAM_ID
    );

    const [metadata] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [masterEdition] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMetadata] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMasterEdition] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Try to create the mint instruction
    // The API might vary, so we'll try different approaches
    let mintInstruction;
    
    try {
      // Try the createMintV3Instruction function (most common)
      if (typeof mplCore.createMintV3Instruction === 'function') {
        mintInstruction = mplCore.createMintV3Instruction({
          candyMachine: candyMachinePubkey,
          payer: payer,
          nftMint: mint,
          nftMintAuthority: mintAuthority,
          nftMetadata: metadata,
          nftMasterEdition: masterEdition,
          collectionMint: collectionMint,
          collectionUpdateAuthority: payer,
          collectionMetadata: collectionMetadata,
          collectionMasterEdition: collectionMasterEdition,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        });
      } else if (typeof mplCore.mintV3 === 'function') {
        // Alternative API
        mintInstruction = mplCore.mintV3({
          candyMachine: candyMachinePubkey,
          payer: payer,
          mint: mint,
          mintAuthority: mintAuthority,
          metadata: metadata,
          masterEdition: masterEdition,
          collectionMint: collectionMint,
          collectionMetadata: collectionMetadata,
          collectionMasterEdition: collectionMasterEdition,
        });
      } else {
        // Log available functions for debugging
        console.log("Available mplCore functions:", Object.keys(mplCore));
        throw new Error("Could not find mint instruction function in mpl-candy-machine-core. Available functions: " + Object.keys(mplCore).join(", "));
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      throw new Error("Failed to create mint instruction: " + apiError.message);
    }

    // Build transaction
    const transaction = new web3.Transaction({
      feePayer: payer,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    });

    // Add the mint instruction
    transaction.add(mintInstruction);

    // Sign transaction with wallet
    // Note: The mint keypair signing is handled by the Candy Machine program in v3
    const signedTransaction = await provider.signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3
      }
    );

    console.log("Transaction sent:", signature);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature: signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err));
    }

    return {
      success: true,
      mint: mint.toString(),
      signature: signature,
      explorerUrl: network === 'devnet' 
        ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        : `https://explorer.solana.com/tx/${signature}`
    };
  } catch (error) {
    console.error("Mint error:", error);
    throw error;
  }
}

// Make function available globally
window.mintFromCandyMachine = mintFromCandyMachine;
