import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
// Import the shared client and config
import { createMessagingClient, baseMessagingClient, APP_PACKAGE_ID } from "../services/suiMessagingClient";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";

const SESSION_STORAGE_KEY = "suimail_session_v1";

// Interface for Polling used in getLatestMessages
interface PollingState {
    lastMessageCount: bigint;
    lastCursor: bigint | null;
    channelId: string;
}

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
                const newClient = createMessagingClient(sessionKey);
                setClient(newClient);
                setIsReady(true);

            } catch (error) {
                console.error("Failed to initialize messaging client:", error);
                setIsReady(false);
            }
        };

        initClient();
    }, [account, signPersonalMessage]);

    /**
     * Create Channel (Modified to accept list of addresses for Groups)
     */
    const createChannel = useCallback(async (memberAddresses: string[]) => {
        if (!client || !account) throw new Error("Client not ready");

        // Use the SDK flow which handles multiple initial members automatically
        const flow = client.messaging.createChannelFlow({
            creatorAddress: account.address,
            initialMemberAddresses: memberAddresses, // Pass the full array here
        });

        const channelTx = flow.build();
        const { digest } = await signAndExecute({ transaction: channelTx });

        // Use shared client to wait for transactions
        await baseMessagingClient.waitForTransaction({
            digest, options: { showObjectChanges: true }
        });
        const txResult = await baseMessagingClient.waitForTransaction({
            digest, options: { showObjectChanges: true }
        });

        const channelObj = txResult.objectChanges?.find(
            (c: any) => c.type === 'created' && c.objectType.includes('::channel::Channel')
        );
        console.log("channelObj", channelObj);
        const channelId = (channelObj as any).objectId;
        console.log("channelId", channelId);

        const { creatorMemberCap, creatorCap } = await flow.getGeneratedCaps({ digest });
        const attachKeyTx = await flow.generateAndAttachEncryptionKey({ creatorMemberCap });

        const { digest: finalDigest } = await signAndExecute({ transaction: attachKeyTx });
        await baseMessagingClient.waitForTransaction({ digest: finalDigest });

        // Return creatorCap as well, as it is needed for addMembers
        return { success: true, channelId, creatorCapId: creatorCap.id };
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

    /**
     * Add Members to Channel (Auto-resolves Caps)
     */
    const addMembers = useCallback(async (
        channelId: string,
        newMemberAddresses: string[]
    ) => {
        if (!client || !account) throw new Error("Client not ready");

        // Trim addresses for safety before use
        const trimmedAddresses = newMemberAddresses.map(a => a.trim());

        // 1. Fetch the user's MemberCap for this channel
        // We fetch memberships to find the specific ID needed to prove we are in the channel
        const membershipsResult = await client.messaging.getChannelMemberships({
            address: account.address,
            limit: 50 // Adjust if user is in many channels
        });

        const membership = membershipsResult.memberships.find(
            (m: any) => m.channel_id === channelId
        );

        if (!membership) {
            throw new Error("You are not a member of this channel");
        }

        // 2. Fetch the user's CreatorCap (Required for admin rights)
        // We scan the user's objects to find the CreatorCap
        // Note: We filter by the specific Struct Type for CreatorCap
        const ownedObjects = await client.core.getOwnedObjects({
            owner: account.address,
            filter: {
                StructType: `${APP_PACKAGE_ID}::creator_cap::CreatorCap`
            },
            options: { showType: true }
        });

        // In this simplified logic, we assume the first CreatorCap found is valid.
        const creatorCapObj = ownedObjects.data[0];

        if (!creatorCapObj || !creatorCapObj.data) {
            throw new Error("You do not have the Creator Capability (Admin rights) to add members.");
        }

        // 3. Build and Execute
        const tx = client.messaging.addMembersTransaction({
            channelId,
            memberCapId: membership.member_cap_id,
            creatorCapId: creatorCapObj.data.objectId,
            newMemberAddresses: trimmedAddresses,
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await baseMessagingClient.waitForTransaction({ digest, options: { showObjectChanges: true } });

        return { success: true, digest };
    }, [client, account, signAndExecute]);

    // READ methods
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

    const getChannelObjectsByAddress = useCallback(async () => {
        if (!client || !account) return [];
        const result = await client.messaging.getChannelObjectsByAddress({
            address: account.address,
            limit: 50
        });
        return result.channelObjects;
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

    const getLatestMessages = useCallback(async (
        channelId: string,
        lastMessageCount: bigint,
        lastCursor: bigint | null,
        limit = 50
    ) => {
        if (!client || !account) return { messages: [], hasNextPage: false, cursor: null };

        const pollingState: PollingState = {
            channelId,
            lastMessageCount,
            lastCursor
        };

        return await client.messaging.getLatestMessages({
            channelId,
            userAddress: account.address,
            pollingState,
            limit,
        });
    }, [client, account]);

    // Session Key Management
    const refreshSessionKey = useCallback(async () => {
        if (!client) return null;
        const newKey = await client.messaging.refreshSessionKey();

        // Update local storage with new key
        if (account && newKey) {
            localStorage.setItem(
                `${SESSION_STORAGE_KEY}_${account.address}`,
                serializeSessionKey(newKey)
            );
        }
        return newKey;
    }, [client, account]);

    const updateSessionKey = useCallback((newSessionKey: SessionKey) => {
        if (!client) return;
        client.messaging.updateSessionKey(newSessionKey);

        if (account) {
            localStorage.setItem(
                `${SESSION_STORAGE_KEY}_${account.address}`,
                serializeSessionKey(newSessionKey)
            );
        }
    }, [client, account]);

    return {
        isReady,
        createChannel,
        sendMessage,
        addMembers,
        getMessages,
        getLatestMessages,
        getMyChannels,
        getChannelObjects,
        getChannelObjectsByAddress,
        getChannelMembers,
        refreshSessionKey,
        updateSessionKey
    };
}
