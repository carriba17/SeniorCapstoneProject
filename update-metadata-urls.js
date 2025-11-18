// Script to update all metadata JSON files with IPFS URLs after upload
// Usage: node update-metadata-urls.js YOUR_IPFS_CID

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node update-metadata-urls.js <IPFS_CID> [gateway]');
  console.error('Example: node update-metadata-urls.js QmXxx... pinata');
  console.error('Gateways: pinata, nftstorage, ipfs (default: pinata)');
  process.exit(1);
}

const ipfsCid = args[0];
const gateway = args[1] || 'pinata';

// Gateway URLs
const gateways = {
  pinata: 'https://gateway.pinata.cloud/ipfs',
  nftstorage: 'https://nftstorage.link/ipfs',
  ipfs: 'https://ipfs.io/ipfs'
};

const baseUrl = `${gateways[gateway]}/${ipfsCid}`;
const assetsDir = path.join(__dirname, 'assets');

console.log(`Updating metadata files with IPFS URL: ${baseUrl}`);
console.log(`Using gateway: ${gateway}\n`);

// Update all 30 JSON files
for (let i = 0; i < 30; i++) {
  const filePath = path.join(assetsDir, `${i}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${i}.json not found, skipping...`);
    continue;
  }

  const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Update image URL
  metadata.image = `${baseUrl}/hoodie0.png`;
  
  // Update files array
  metadata.properties.files = [
    {
      uri: `${baseUrl}/hoodie0.png`,
      type: "image/png"
    },
    {
      uri: `${baseUrl}/hoodie.glb`,
      type: "model/gltf-binary"
    }
  ];
  
  // Write updated metadata
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Updated ${i}.json`);
}

console.log(`\n✅ All 30 metadata files updated with IPFS URLs!`);
console.log(`Base URL: ${baseUrl}`);

