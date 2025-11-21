// web-app/src/services/messaging/client.ts

import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { SuiStackMessagingClient } from "@mysten/messaging";
import { SessionKey } from "@mysten/seal";

// --- Configuration Constants ---
// Export these if needed elsewhere, but keeping them internal is cleaner
const NETWORK = "testnet";
const RPC_URL = "https://fullnode.testnet.sui.io:443";
const MESSAGING_PACKAGE_ID = "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d";

const SEAL_SERVERS = [
    { objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", weight: 1 },
    { objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", weight: 1 },
];

const WALRUS_CONFIG = {
    aggregator: "https://aggregator.walrus-testnet.walrus.space",
    publisher: "https://publisher.walrus-testnet.walrus.space",
    epochs: 1,
};

// --- 1. The Shared Singleton (Base Client) ---
// We export this so the Hook can use it for SessionKey operations
export const baseMessagingClient = new SuiClient({
    url: RPC_URL,
    mvr: {
        url: "https://mvr.sui.io",
        overrides: {
            packages: {
                '@local-pkg/sui-stack-messaging': MESSAGING_PACKAGE_ID,
            },
        },
    },
});

// --- 2. The Factory (Extends the Base) ---
export function createMessagingClient(sessionKey: SessionKey) {
    // Extend the shared base client
    const sealClient = baseMessagingClient.$extend(
        SealClient.asClientExtension({
            serverConfigs: SEAL_SERVERS,
        })
    );

    const messagingClient = sealClient.$extend(
        SuiStackMessagingClient.experimental_asClientExtension({
            // @ts-ignore
            network: NETWORK,
            walrusStorageConfig: WALRUS_CONFIG,
            sessionKey: sessionKey,
            packageConfig: {
                packageId: MESSAGING_PACKAGE_ID,
            }
        })
    );

    return messagingClient;
}

// Export the package ID for use in the Hook's session creation
export const APP_PACKAGE_ID = MESSAGING_PACKAGE_ID;
/*// Seal server configurations for Testnet
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

const MESSAGING_PACKAGE_ID = "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d";

/!**
 * Create a messaging client with Seal encryption and Walrus storage
 *!/
export function createMessagingClient(
    network: "testnet" | "mainnet",
    sessionKeypair: SessionKey,
    // sessionTTLMinutes: number = 30
) {
    const rpcUrl =
        network === "mainnet"
            ? "https://fullnode.mainnet.sui.io:443"
            : "https://fullnode.testnet.sui.io:443";

    const sealServers = SEAL_SERVERS_TESTNET; // TODO: Add mainnet servers
    const walrusConfig = WALRUS_CONFIG_TESTNET; // TODO: Add mainnet config

    // Create base Sui client
    const client = new SuiClient({ url: rpcUrl , mvr: {
            overrides: {
                packages: {
                    // This tells the SDK exactly where to find the messaging contract
                    '@local-pkg/sui-stack-messaging': MESSAGING_PACKAGE_ID,
                },
            },
        },});

    // Extend with Seal for encryption
    const sealClient = client.$extend(
        SealClient.asClientExtension({
            serverConfigs: sealServers,
        })
    );

    // Extend with Messaging SDK
    const messagingClient = sealClient.$extend(
        SuiStackMessagingClient.experimental_asClientExtension({
            // @ts-ignore
            // network: network,
            walrusStorageConfig: walrusConfig,
            sessionKey: sessionKeypair
            // sessionKeyConfig: {
            //     address: sessionKeypair.toSuiAddress(),
            //     ttlMin: sessionTTLMinutes,
            //     signer: sessionKeypair,
            // },
        })
    );

    return messagingClient;
}*/

/**
 * Messaging client instance type
 */
export type MessagingClient = ReturnType<typeof createMessagingClient>;
