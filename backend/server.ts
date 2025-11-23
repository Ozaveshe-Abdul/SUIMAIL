import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { EnokiClient } from '@mysten/enoki';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!process.env.ENOKI_PRIVATE_KEY) {
    throw new Error('ENOKI_PRIVATE_KEY environment variable is not set');
}

// Your messaging package on testnet
const MESSAGING_PACKAGE_ID = "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d";

const enokiClient = new EnokiClient({
    apiKey: process.env.ENOKI_PRIVATE_KEY!,
});

interface SponsorTransactionRequest {
    transactionKindBytes: string;
    sender: string;
    network?: 'testnet' | 'mainnet';
}

interface ExecuteTransactionRequest {
    digest: string;
    signature: string;
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Enoki sponsor service is running' });
});

// 1. Sponsor Transaction
app.post('/api/sponsor-transaction', async (req: Request<{}, {}, SponsorTransactionRequest>, res: Response) => {
    try {
        const { transactionKindBytes, sender, network = 'testnet' } = req.body;

        if (!transactionKindBytes || !sender) {
            return res.status(400).json({ error: 'Missing transactionKindBytes or sender' });
        }

        console.log(`Sponsoring tx for ${sender} on ${network}`);

        const allowedTargets = [
            // --- 1. Channel Operations ---
            `${MESSAGING_PACKAGE_ID}::channel::new`,
            `${MESSAGING_PACKAGE_ID}::channel::share`,
            `${MESSAGING_PACKAGE_ID}::channel::add_encrypted_key`,
            `${MESSAGING_PACKAGE_ID}::channel::send_message`,
            `${MESSAGING_PACKAGE_ID}::channel::add_members`,
            `${MESSAGING_PACKAGE_ID}::channel::remove_members`,

            // --- 2. Cap Management (Crucial for setup) ---
            `${MESSAGING_PACKAGE_ID}::member_cap::transfer_to_sender`,
            `${MESSAGING_PACKAGE_ID}::member_cap::transfer_to_recipient`,
            `${MESSAGING_PACKAGE_ID}::member_cap::transfer_member_caps`,
            `${MESSAGING_PACKAGE_ID}::creator_cap::transfer_to_sender`, // If this exists in your contract

            // --- 3. Helpers ---
            `${MESSAGING_PACKAGE_ID}::config::none`,
            `${MESSAGING_PACKAGE_ID}::attachment::new`,

            // --- 4. Standard Library (REQUIRED) ---
            // The SDK uses these internally for vector/coin management
            "0x0000000000000000000000000000000000000000000000000000000000000001::vector::empty",
            "0x1::vector::empty", // Short form (include both to be safe)

            // Optional: Coin management if needed
            "0x0000000000000000000000000000000000000000000000000000000000000002::coin::join",
            "0x2::coin::join",
            "0x0000000000000000000000000000000000000000000000000000000000000002::coin::split",
            "0x2::coin::split"
        ];

        const sponsored = await enokiClient.createSponsoredTransaction({
            network,
            transactionKindBytes,
            sender,
            allowedMoveCallTargets: allowedTargets, // Security: only allow your package
            allowedAddresses: [sender],
        });

        res.json({
            success: true,
            bytes: sponsored.bytes,
            digest: sponsored.digest,
        });
    } catch (error: any) {
        console.error('Sponsorship failed:', error);
        res.status(500).json({
            error: 'Failed to sponsor transaction',
            details: error.message,
        });
    }
});

// 2. Execute Transaction
app.post('/api/execute-transaction', async (req: Request<{}, {}, ExecuteTransactionRequest>, res: Response) => {
    try {
        const { digest, signature } = req.body;

        if (!digest || !signature) {
            return res.status(400).json({ error: 'Missing digest or signature' });
        }

        console.log(`Executing sponsored tx: ${digest}`);

        // This returns only { digest: string }
        const result = await enokiClient.executeSponsoredTransaction({
            digest,
            signature,
        });

        // Enoki only returns the final transaction digest
        res.json({
            success: true,
            digest: result.digest,           // This is the executed transaction digest
            transactionDigest: result.digest, // Same thing — for frontend clarity
        });
    } catch (error: any) {
        console.error('Execution failed:', error);
        res.status(500).json({
            error: 'Failed to execute transaction',
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Enoki Service running on http://localhost:${PORT}`);
});
