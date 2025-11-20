import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { SuiStackMessagingClient } from "@mysten/messaging";

// 1. Configs from the Official SDK Docs/Example
// (These are Testnet constants provided by Mysten)
const SEAL_CONFIGS = [
    { objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", weight: 1 },
    { objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", weight: 1 }
];

const WALRUS_CONFIG = {
    aggregator: "https://aggregator.walrus-testnet.walrus.space",
    publisher: "https://publisher.walrus-testnet.walrus.space",
    epochs: 1,
};

// 2. Initialize the "Mega Client"
// This combines Sui, Seal (Encryption), and Messaging into one object
export function createMessagingClient(sessionSigner: any) {
    const client = new SuiClient({ url: getFullnodeUrl("testnet") });

    return client
        .$extend(SealClient.asClientExtension({ serverConfigs: SEAL_CONFIGS }))
        .$extend(
            SuiStackMessagingClient.experimental_asClientExtension({
                walrusStorageConfig: WALRUS_CONFIG,
                // The Messaging SDK can use the Enoki signer as a session key!
                sessionKeyConfig: {
                    address: sessionSigner.toSuiAddress(),
                    ttlMin: 60 * 24, // 24 Hours
                    signer: sessionSigner,
                },
            })
        );
}
