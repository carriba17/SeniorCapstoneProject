# Candy Machine Upload - Step by Step

## ✅ Prerequisites Check:
- ✅ Sugar CLI installed
- ✅ 30 metadata JSON files ready
- ✅ config.json configured (price: 1 SOL, number: 30)

## 🚀 Step-by-Step Process:

### Step 1: Update Your Wallet Address

**IMPORTANT:** Before you start, update `config.json` with your Solana wallet address.

1. Open Phantom wallet
2. Copy your wallet address
3. Edit `config.json` and replace `"YOUR_WALLET_ADDRESS_HERE"` with your actual address

### Step 2: Prepare Your Assets Folder

Make sure your `assets/` folder contains:
- ✅ `hoodie0.png` (the NFT image)
- ✅ `0.json` through `29.json` (all 30 metadata files)
- ✅ `hoodie.glb` (optional - 3D model)

**Check your assets:**
```bash
cd /Users/carterarribas/Desktop/SeniorYear/Fall2025/CapstoneShirt
ls -la assets/ | grep -E "\.json|\.png|\.glb"
```

### Step 3: Set Up Solana CLI (if not already done)

**Check your current Solana config:**
```bash
solana config get
```

**For Devnet (testing):**
```bash
solana config set --url devnet
```

**Get free Devnet SOL:**
```bash
solana airdrop 2
```

**Verify your wallet has SOL:**
```bash
solana balance
```

### Step 4: Initialize Sugar Project

**Navigate to your project directory:**
```bash
cd /Users/carterarribas/Desktop/SeniorYear/Fall2025/CapstoneShirt
```

**Run Sugar launch (this will guide you through setup):**
```bash
sugar launch
```

This command will:
1. Ask you to confirm your config
2. Upload all assets to IPFS/Arweave automatically
3. Create the Candy Machine
4. Deploy it to the blockchain
5. Give you a **Candy Machine ID** - **SAVE THIS!**

### Step 5: Verify Upload

After `sugar launch` completes, verify everything:

```bash
sugar verify
```

This checks that:
- All assets uploaded correctly
- Metadata is valid
- Candy Machine is deployed

### Step 6: Get Your Candy Machine ID

After deployment, Sugar will display your Candy Machine ID. It looks like:
```
Candy Machine ID: ABC123xyz...
```

**Save this ID!** You'll need it for your website.

### Step 7: Test Mint (Optional)

You can test minting directly:
```bash
sugar mint
```

This will mint one NFT to your wallet for testing.

---

## 📝 Important Notes:

### For Devnet (Testing):
- Use `solana config set --url devnet`
- Get free SOL: `solana airdrop 2`
- Test everything before mainnet

### For Mainnet (Production):
- Use `solana config set --url mainnet-beta`
- Make sure you have real SOL for fees
- Double-check your config before deploying

### Upload Methods in config.json:
- `"bundlr"` - Uses Bundlr network (recommended)
- `"nft-storage"` - Uses NFT.Storage (requires API token)
- `"shdw"` - Uses Shadow Drive

### What Sugar Does Automatically:
- ✅ Uploads all images to IPFS/Arweave
- ✅ Uploads all metadata JSON files
- ✅ Updates metadata with IPFS URLs
- ✅ Creates Candy Machine on Solana
- ✅ Configures all settings from config.json

---

## 🔧 Troubleshooting:

### "Insufficient funds"
- Make sure you have SOL in your wallet
- For devnet: `solana airdrop 2`

### "Upload failed"
- Check your internet connection
- Try a different upload method in config.json
- Make sure all files are in the assets/ folder

### "Candy Machine creation failed"
- Verify your wallet address in config.json
- Check you have enough SOL for transaction fees
- Make sure you're on the correct network (devnet/mainnet)

---

## 🎯 Next Steps After Upload:

1. **Save your Candy Machine ID**
2. **Update your website** (`website/app.js`) with the Candy Machine ID
3. **Test minting** on your website
4. **Deploy to mainnet** when ready

---

## 📚 Sugar Commands Reference:

```bash
sugar launch          # Full setup and deployment
sugar upload          # Upload assets only
sugar deploy          # Deploy Candy Machine only
sugar verify          # Verify upload
sugar mint            # Mint one NFT
sugar withdraw        # Withdraw funds from Candy Machine
sugar show            # Show Candy Machine info
```

---

## ⚠️ Before Mainnet:

- [ ] Test everything on Devnet first
- [ ] Verify all 30 NFTs uploaded correctly
- [ ] Test minting works
- [ ] Double-check price (1 SOL)
- [ ] Verify wallet address in config.json
- [ ] Make sure you have enough SOL for fees

