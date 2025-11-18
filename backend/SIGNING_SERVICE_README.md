# Signing Service

A separate microservice for signing transactions with the mint signer keypair. This provides better security and separation of concerns.

## Setup

### 1. Configure the Mint Signer Keypair

You need to provide the mint signer keypair to the signing service. Choose one of these methods:

#### Option A: Environment Variable (Development)
```bash
# In your .env file or environment
MINT_SIGNER_SECRET_KEY='[1,2,3,...]'  # JSON array of secret key bytes
```

#### Option B: Keypair File (Recommended for Development)

**What is a Keypair File?**
A keypair file is a JSON file containing the secret key (private key) of the mint signer. This is the cryptographic key that allows the signing service to sign transactions on behalf of the mint signer. Think of it like a password file - it gives the signing service permission to sign transactions.

**Why use a file?**
- Easy to manage and backup
- Can be stored securely on the server
- Simple to configure
- Good for development and testing

**How to set it up:**

1. **Extract the mint signer keypair:**
   ```bash
   cd backend
   npm run extract-mint-signer
   ```
   This will create a file called `mint-signer-keypair.json` in the backend directory.

2. **Configure the signing service:**
   ```bash
   # In backend/.env file
   MINT_SIGNER_KEYPAIR_PATH=./mint-signer-keypair.json
   ```
   Or use an absolute path:
   ```bash
   MINT_SIGNER_KEYPAIR_PATH=/absolute/path/to/mint-signer-keypair.json
   ```

3. **Security Note:**
   - ⚠️ **NEVER commit this file to git** - it contains sensitive private key data
   - Add it to `.gitignore`: `echo "mint-signer-keypair.json" >> .gitignore`
   - Store it securely (encrypted, restricted file permissions)
   - In production, use Option C (Secure Key Management) instead

#### Option C: Secure Key Management (Production)
Modify `signing-service.js` to integrate with:
- AWS KMS
- HashiCorp Vault
- Azure Key Vault
- Google Cloud KMS
- etc.

### 2. Configure the Main Backend

In your main backend's `.env` file:
```bash
# Enable signing service
USE_SIGNING_SERVICE=true
SIGNING_SERVICE_URL=http://localhost:3002
```

### 3. Run the Services

**Terminal 1 - Main Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Signing Service:**
```bash
cd backend
npm run signing-service
```

Or for development with auto-reload:
```bash
npm run signing-service:dev
```

## How It Works

1. **Main Backend** (`server.js`):
   - Builds the mint transaction
   - Detects if mint signer is a Keypair (not a PDA)
   - If `USE_SIGNING_SERVICE=true`, sends unsigned transaction to signing service
   - Receives partially signed transaction
   - Sends to frontend for user wallet signature

2. **Signing Service** (`signing-service.js`):
   - Receives unsigned transaction + mint signer public key
   - Loads mint signer keypair from secure storage
   - Signs the transaction
   - Returns signed transaction

3. **Frontend**:
   - Receives partially signed transaction (mint signer already signed)
   - User signs with their wallet (Phantom)
   - Sends fully signed transaction to Solana network

## Security Considerations

⚠️ **Important**: The mint signer keypair is sensitive. In production:

1. **Never commit keypairs to git**
2. **Use secure key management services** (AWS KMS, HashiCorp Vault, etc.)
3. **Restrict access** to the signing service (firewall, authentication)
4. **Use HTTPS** for all service communication
5. **Monitor and log** all signing requests
6. **Rotate keys** periodically

## Environment Variables

### Signing Service
- `SIGNING_SERVICE_PORT` - Port for signing service (default: 3002)
- `MINT_SIGNER_SECRET_KEY` - JSON array of secret key bytes
- `MINT_SIGNER_KEYPAIR_PATH` - Path to keypair JSON file

### Main Backend
- `USE_SIGNING_SERVICE` - Set to `'true'` to use external signing service
- `SIGNING_SERVICE_URL` - URL of signing service (default: http://localhost:3002)

## Testing

1. Start both services
2. Check health endpoints:
   - Main backend: `http://localhost:3001/health`
   - Signing service: `http://localhost:3002/health`
3. Try minting an NFT - the main backend should call the signing service

## Troubleshooting

**Error: "Mint signer keypair not available"**
- Make sure you've configured `MINT_SIGNER_SECRET_KEY` or `MINT_SIGNER_KEYPAIR_PATH`
- Verify the keypair file exists and is readable

**Error: "Signing service error"**
- Check that the signing service is running
- Verify `SIGNING_SERVICE_URL` is correct
- Check signing service logs for errors

**Transaction still fails**
- Verify the keypair matches the mint signer public key
- Check that both services are on the same network (devnet/mainnet)
- Review transaction logs for signature verification errors

