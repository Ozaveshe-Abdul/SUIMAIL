import express from "express";
import cors from "cors";
import { EnokiClient } from "@mysten/enoki";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Enoki with your PRIVATE Secret Key
// (Make sure ENOKI_SECRET_KEY is in your .env file!)
const enokiClient = new EnokiClient({
    apiKey: process.env.ENOKI_SECRET_KEY!,
});

/**
 * Endpoint: /sponsor
 * Purpose: Receives a transaction from the frontend, asks Enoki to pay the gas,
 * and returns the sponsored transaction for the user to sign.
 */
app.post("/sponsor", async (req, res) => {
    try {
        const { network, txBytes, sender } = req.body;

        console.log(`⛽ Sponsoring transaction for ${sender}...`);

        // 2. Ask Enoki to sponsor this transaction
        const sponsored = await enokiClient.createSponsoredTransaction({
            network: network || "testnet",
            transactionKindBytes: txBytes,
            sender: sender,
            allowedAddresses: [sender], // Security: Only allow the sender to use this sponsorship
        });

        console.log(`✅ Transaction sponsored! Digest: ${sponsored.digest}`);

        // 3. Return the sponsored digest & bytes to frontend
        res.json(sponsored);
    } catch (error: any) {
        console.error("❌ Sponsorship failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint: /execute
 * Purpose: Receives the user's signature and the sponsored transaction,
 * and executes it on the Sui network via Enoki.
 */
app.post("/execute", async (req, res) => {
    try {
        const { digest, signature } = req.body;

        console.log(`🚀 Executing transaction ${digest}...`);

        // 4. Execute the transaction
        const result = await enokiClient.executeSponsoredTransaction({
            digest,
            signature,
        });

        console.log(`🎉 Success! Status: ${result.effects?.status.status}`);
        res.json(result);
    } catch (error: any) {
        console.error("❌ Execution failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`⛽ Gas Station running on port ${PORT}`));
