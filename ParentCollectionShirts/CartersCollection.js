//Carter Arribas
//Uploading Json and Minting

const { Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const { Metaplex, keypairIdentity } = require('@metaplex-foundation/js');
const fs = require('fs');
const path = require('path');

(async () => {

  // use the same keypair Sugar/solana CLI uses
  const kpPath = path.join(process.env.HOME, '.config', 'solana', 'id.json');
  const secret = JSON.parse(fs.readFileSync(kpPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));

  // switch to mainnet when ready
//   const connection = new Connection(clusterApiUrl('devnet')); 
//   const mx = Metaplex.make(connection).use(keypairIdentity(wallet));

  // Upload minimal collection metadata JSON to storage (Irys/Bundlr)
  const uri = await mx.storage().uploadJson({
    name: 'CRCP Showcase Shirts',
    symbol: 'CRCPSHRT',
    description: 'Parent collection for the Capstone Shirt NFTs.',
    seller_fee_basis_points: 500,
    image: '', // can update later
    properties: { category: 'image', files: [] }
  });

  // Mint the COLLECTION NFT
  const { nft } = await mx.nfts().create({
    name: 'CRCP Showcase Shirts',
    symbol: 'CRCPSHRT',
    uri,
    sellerFeeBasisPoints: 500,
    isCollection: true,          // <- critical flag
  });

  console.log('Collection mint:', nft.address.toBase58());
})();
