import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
// Import the shared client and config
import { createMessagingClient, baseMessagingClient, APP_PACKAGE_ID } from "../services/suiMessagingClient";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";

const SESSION_STORAGE_KEY = "suimail_session_v1";

// Serialization Helper
function serializeSessionKey(sessionKey: SessionKey): string {
    const exported = sessionKey.export();
    const serializable: any = {};
    for (const [key, value] of Object.entries(exported)) {
        try {
            JSON.stringify(value);
            serializable[key] = value;
        } catch {
            if (key === 'sessionKey' && typeof value === 'object' && value !== null) {
                if ('toString' in value) serializable[key] = (value as any).toString();
            }
        }
    }
    return JSON.stringify(serializable);
}

export function useSuiMailMessenger() {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    // REMOVED: const [suiClient] = useState(...)
    // We now use 'baseMessagingClient' imported directly

    const [client, setClient] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);

    // 1. INITIALIZATION
    useEffect(() => {
        if (!account) {
            setClient(null);
            setIsReady(false);
            return;
        }

        const initClient = async () => {
            try {
                console.log("Initializing session for:", account.address);
                let sessionKey: SessionKey | null = null;

                // A. Restore Session
                const storedString = localStorage.getItem(`${SESSION_STORAGE_KEY}_${account.address}`);
                if (storedString) {
                    try {
                        const storedData = JSON.parse(storedString);
                        // Use the SHARED base client for import
                        const restored = SessionKey.import(storedData, baseMessagingClient);
                        if (!restored.isExpired()) {
                            sessionKey = restored;
                            console.log("✅ Restored valid session key");
                        }
                    } catch (e) {
                        console.warn("Invalid stored session, creating new.");
                    }
                }

                // B. Create New Session
                if (!sessionKey) {
                    console.log("Creating new session key...");
                    sessionKey = await SessionKey.create({
                        address: account.address,
                        packageId: APP_PACKAGE_ID, // Use shared constant
                        ttlMin: 30,
                        suiClient: baseMessagingClient, // Use shared singleton
                    });

                    const message = await signPersonalMessage({
                        message: sessionKey.getPersonalMessage(),
                    });

                    await sessionKey.setPersonalMessageSignature(message.signature);

                    localStorage.setItem(
                        `${SESSION_STORAGE_KEY}_${account.address}`,
                        serializeSessionKey(sessionKey)
                    );
                    console.log("✅ New session key signed and saved");
                }

                // C. Initialize Messaging Client
                const newClient = createMessagingClient( sessionKey);
                setClient(newClient);
                setIsReady(true);

            } catch (error) {
                console.error("Failed to initialize messaging client:", error);
                setIsReady(false);
            }
        };

        initClient();
    }, [account, signPersonalMessage]);

    // ... (The rest of your code: getMyChannels, createChannel, etc. remains exactly the same)
    // Just make sure to replace 'suiClient' with 'baseMessagingClient' in the 'createChannel' function too!

    const createChannel = useCallback(async (friendAddress: string) => {
        if (!client || !account) throw new Error("Client not ready");

        const flow = client.messaging.createChannelFlow({
            creatorAddress: account.address,
            initialMemberAddresses: [friendAddress],
        });

        const channelTx = flow.build();
        const { digest } = await signAndExecute({ transaction: channelTx });

        // Use shared client to wait for transactions
        await baseMessagingClient.waitForTransaction({
            digest, options: { showObjectChanges: true }
        });

        const { creatorMemberCap } = await flow.getGeneratedCaps({ digest });
        const attachKeyTx = await flow.generateAndAttachEncryptionKey({ creatorMemberCap });

        const { digest: finalDigest } = await signAndExecute({ transaction: attachKeyTx });
        await baseMessagingClient.waitForTransaction({ digest: finalDigest });

        return { success: true };
    }, [client, account, signAndExecute]);

    const sendMessage = useCallback(async (
        channelId: string,
        memberCapId: string,
        messageText: string,
        channelObject: any,
        attachments?: File[]
    ) => {
        if (!client || !account) throw new Error("Client not ready");

        const channelEncryptionKey = {
            $kind: "Encrypted" as const,
            encryptedBytes: new Uint8Array(channelObject.encryption_key_history.latest),
            version: channelObject.encryption_key_history.latest_version,
        };

        const tx = new Transaction();
        const sendMessageBuilder = await client.messaging.sendMessage(
            channelId,
            memberCapId,
            account.address,
            messageText,
            channelEncryptionKey,
            attachments,
        );

        await sendMessageBuilder(tx);
        return await signAndExecute({ transaction: tx });

    }, [client, account, signAndExecute]);

    // READ methods (getMyChannels, etc.) remain unchanged...
    const getMyChannels = useCallback(async () => {
        if (!client || !account) return [];
        const result = await client.messaging.getChannelMemberships({
            address: account.address,
            limit: 50
        });
        return result.memberships;
    }, [client, account]);

    const getChannelObjects = useCallback(async (channelIds: string[]) => {
        if (!client || !account || channelIds.length === 0) return [];
        return await client.messaging.getChannelObjectsByChannelIds({
            channelIds,
            userAddress: account.address,
        });
    }, [client, account]);

    const getChannelMembers = useCallback(async (channelId: string) => {
        if (!client) return [];
        const result = await client.messaging.getChannelMembers(channelId);
        return result.members;
    }, [client]);

    const getMessages = useCallback(async (channelId: string, limit = 50) => {
        if (!client || !account) return [];
        return (await client.messaging.getChannelMessages({
            channelId,
            userAddress: account.address,
            limit,
            direction: 'backward',
        })).messages;
    }, [client, account]);

    return {
        isReady,
        createChannel,
        sendMessage,
        getMessages,
        getMyChannels,
        getChannelObjects,
        getChannelMembers
    };
}
