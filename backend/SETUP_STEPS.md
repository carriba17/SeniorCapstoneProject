# Setup Steps - Signing Service

Now that you have the `mint-signer-keypair.json` file, follow these steps:

## Step 1: Configure the Signing Service

Create or update `backend/.env` file with:

```bash
# Signing Service Configuration
MINT_SIGNER_KEYPAIR_PATH=./mint-signer-keypair.json
SIGNING_SERVICE_PORT=3002

# Optional: If you want to use an absolute path instead
# MINT_SIGNER_KEYPAIR_PATH=/Users/carterarribas/Desktop/SeniorYear/Fall2025/CapstoneShirt/backend/mint-signer-keypair.json
```

## Step 2: Configure the Main Backend

Add these lines to the same `backend/.env` file (or create it if it doesn't exist):

```bash
# Main Backend Configuration
PORT=3001
SOLANA_NETWORK=devnet
CANDY_MACHINE_ID=GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL

# Enable Signing Service
USE_SIGNING_SERVICE=true
SIGNING_SERVICE_URL=http://localhost:3002
```

## Step 3: Start Both Services

You need to run both services in separate terminals:

### Terminal 1 - Main Backend:
```bash
cd backend
npm start
```

You should see:
```
🚀 Mint API server running on http://localhost:3001
```

### Terminal 2 - Signing Service:
```bash
cd backend
npm run signing-service
```

You should see:
```
🔐 Signing service running on http://localhost:3002
```

## Step 4: Test the Setup

1. Open your frontend (mint.html)
2. Connect your wallet
3. Try to mint an NFT
4. Check the backend logs - you should see:
   - Main backend: "Using external signing service: http://localhost:3002"
   - Signing service: "Received signing request for mint signer: ..."
   - Signing service: "Transaction signed successfully"

## Troubleshooting

### Error: "Mint signer keypair not available"
- Check that `MINT_SIGNER_KEYPAIR_PATH` is correct in `.env`
- Verify the file exists at that path
- Check file permissions (should be readable)

### Error: "Signing service error"
- Make sure the signing service is running on port 3002
- Check that `SIGNING_SERVICE_URL` matches the signing service port
- Look at signing service logs for errors

### Transaction still fails
- Check both service logs for errors
- Verify the keypair matches the mint signer public key
- Make sure both services are on the same network (devnet/mainnet)

## Quick Test Commands

Test signing service health:
```bash
curl http://localhost:3002/health
```

Test main backend health:
```bash
curl http://localhost:3001/health
```

## What Happens Now?

1. **Main Backend** builds the transaction
2. **Main Backend** sends unsigned transaction to **Signing Service**
3. **Signing Service** loads keypair from file and signs it
4. **Signing Service** returns signed transaction to **Main Backend**
5. **Main Backend** sends partially signed transaction to **Frontend**
6. **Frontend** gets user's wallet signature (Phantom)
7. **Frontend** sends fully signed transaction to Solana network

The mint signer keypair signature is handled by the signing service, and the user only needs to sign with their wallet!

