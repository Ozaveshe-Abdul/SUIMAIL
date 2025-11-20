// web-app/src/services/messaging/client.ts
import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { SuiStackMessagingClient } from "@mysten/messaging";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Seal server configurations for Testnet
const SEAL_SERVERS_TESTNET = [
    {
        objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
        weight: 1,
    },
    {
        objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
        weight: 1,
    },
];

// Walrus storage configuration for Testnet
const WALRUS_CONFIG_TESTNET = {
    aggregator: "https://aggregator.walrus-testnet.walrus.space",
    publisher: "https://publisher.walrus-testnet.walrus.space",
    epochs: 1,
};

/**
 * Create a messaging client with Seal encryption and Walrus storage
 */
export function createMessagingClient(
    network: "testnet" | "mainnet",
    sessionKeypair: Ed25519Keypair,
    sessionTTLMinutes: number = 30
) {
    const rpcUrl =
        network === "mainnet"
            ? "https://fullnode.mainnet.sui.io:443"
            : "https://fullnode.testnet.sui.io:443";

    const sealServers = SEAL_SERVERS_TESTNET; // TODO: Add mainnet servers
    const walrusConfig = WALRUS_CONFIG_TESTNET; // TODO: Add mainnet config

    // Create base Sui client
    const client = new SuiClient({ url: rpcUrl });

    // Extend with Seal for encryption
    const sealClient = client.$extend(
        SealClient.asClientExtension({
            serverConfigs: sealServers,
        })
    );

    // Extend with Messaging SDK
    const messagingClient = sealClient.$extend(
        SuiStackMessagingClient.experimental_asClientExtension({
            walrusStorageConfig: walrusConfig,
            sessionKeyConfig: {
                address: sessionKeypair.toSuiAddress(),
                ttlMin: sessionTTLMinutes,
                signer: sessionKeypair,
            },
        })
    );

    return messagingClient;
}

/**
 * Messaging client instance type
 */
export type MessagingClient = ReturnType<typeof createMessagingClient>;
