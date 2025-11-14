// gas-station/server.js

const express = require("express");
const cors = require("cors");
const { SuiClient } = require("@mysten/sui/client");
const { Ed25519Keypair } = require("@mysten/sui/keypairs/ed25519");
const { Transaction } = require("@mysten/sui/transactions");
const { fromB64, toB64 } = require("@mysten/sui/utils");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Initialize Sui client
const suiClient = new SuiClient({
    url: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
});

// Load sponsor keypair from environment
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
if (!SPONSOR_PRIVATE_KEY) {
    console.error("❌ SPONSOR_PRIVATE_KEY not found in .env file");
    process.exit(1);
}

let sponsorKeypair;
try {
    const privateKeyBytes = fromB64(SPONSOR_PRIVATE_KEY);
    sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    console.log("✅ Sponsor wallet loaded:", sponsorKeypair.getPublicKey().toSuiAddress());
} catch (error) {
    console.error("❌ Invalid SPONSOR_PRIVATE_KEY:", error.message);
    process.exit(1);
}

/**
 * POST /sponsor-tx
 * Sponsors a transaction by signing it as the gas payer
 */
app.post("/sponsor-tx", async (req, res) => {
    try {
        const { txBytes, senderAddress } = req.body;

        if (!txBytes || !senderAddress) {
            return res.status(400).json({
                error: "Missing required fields: txBytes, senderAddress",
            });
        }

        console.log(`📨 Sponsoring transaction for: ${senderAddress}`);

        // Deserialize the transaction
        const txBytesArray = new Uint8Array(txBytes);
        const transaction = Transaction.from(txBytesArray);

        // Set gas payment to sponsor's wallet
        transaction.setSender(senderAddress);
        transaction.setGasOwner(sponsorKeypair.getPublicKey().toSuiAddress());

        // Build the transaction with gas estimation
        const builtTx = await transaction.build({
            client: suiClient,
        });

        // Sign as sponsor (gas payer)
        const sponsorSignature = await sponsorKeypair.signTransaction(builtTx);

        // Execute the transaction
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: builtTx,
            signature: [sponsorSignature.signature],
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        console.log("✅ Transaction executed:", result.digest);

        return res.json({
            success: true,
            digest: result.digest,
            effects: result.effects,
        });
    } catch (error) {
        console.error("❌ Sponsorship error:", error);
        return res.status(500).json({
            error: error.message || "Failed to sponsor transaction",
            details: error.toString(),
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", async (req, res) => {
    try {
        const address = sponsorKeypair.getPublicKey().toSuiAddress();
        const balance = await suiClient.getBalance({ owner: address });

        res.json({
            status: "healthy",
            sponsor: address,
            balance: balance.totalBalance,
            network: process.env.SUI_RPC_URL || "testnet",
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            error: error.message,
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 SuiMail Gas Station running on port ${PORT}
📍 Sponsor Address: ${sponsorKeypair.getPublicKey().toSuiAddress()}
🌐 Network: ${process.env.SUI_RPC_URL || "testnet"}
  `);
});
