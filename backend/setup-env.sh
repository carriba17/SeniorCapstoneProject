#!/bin/bash
# Setup script to create .env file with signing service configuration

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Exiting."
        exit 1
    fi
fi

cat > "$ENV_FILE" << 'EOF'
# Main Backend Configuration
PORT=3001
SOLANA_NETWORK=devnet
CANDY_MACHINE_ID=GMvEvHuHQuZKnEgZNVJTPF3JexmjwbMzrUC7SKyj3MNL
KEYPAIR_PATH=~/.config/solana/id.json

# Signing Service Configuration
# Set to 'true' to use the external signing service
USE_SIGNING_SERVICE=true
SIGNING_SERVICE_URL=http://localhost:3002

# Signing Service (runs on port 3002)
# Path to the mint signer keypair file
MINT_SIGNER_KEYPAIR_PATH=./mint-signer-keypair.json
SIGNING_SERVICE_PORT=3002
EOF

echo "✅ Created .env file with signing service configuration"
echo ""
echo "📝 Next steps:"
echo "   1. Review the .env file and adjust if needed"
echo "   2. Start the signing service: npm run signing-service"
echo "   3. Start the main backend: npm start"
echo "   4. Try minting an NFT!"

