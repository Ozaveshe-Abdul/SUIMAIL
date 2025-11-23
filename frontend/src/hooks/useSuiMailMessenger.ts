import { useState, useCallback, useEffect, useRef } from "react";
import { useCurrentAccount, useSignPersonalMessage, useSignTransaction } from "@mysten/dapp-kit";
import { createMessagingClient, baseMessagingClient, APP_PACKAGE_ID } from "../services/suiMessagingClient";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { useRealTimeMessages } from "./useRealTimeMessages";

const SESSION_STORAGE_KEY = "suimail_session_v1";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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

export function useSuiMailMessenger(currentChannelId: string | null = null) {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const [client, setClient] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [messagesVersion, setMessagesVersion] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // --- OPTIMIZATION: Caching & Deduplication (Inspired by Official Example) ---
    const [memberCapCache, setMemberCapCache] = useState<Map<string, string>>(new Map());
    const inFlightRequests = useRef<Set<string>>(new Set());


    const handleNewMessage = useCallback(() => {
        console.log("🔔 Real-time update triggering refresh...");
        setMessagesVersion(v => v + 1);
    }, []);

    useRealTimeMessages({
        channelId: currentChannelId,
        onNewMessage: handleNewMessage
    });

    // --- SPONSORED TRANSACTION LOGIC ---
    const executeSponsoredTransaction = useCallback(async (tx: Transaction) => {
        if (!account) throw new Error("No account connected");

        tx.setSender(account.address);
        tx.setGasBudget(50_000_000); // Safety budget

        const txKindBytes = await tx.build({
            client: baseMessagingClient,
            onlyTransactionKind: true,
        });
        const txKindBase64 = toBase64(txKindBytes);

        const safeParse = async (res: Response) => {
            const text = await res.text();
            try { return JSON.parse(text); } catch { throw new Error(text || res.statusText); }
        };

        const sponsorResponse = await fetch(`${BACKEND_URL}/api/sponsor-transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                transactionKindBytes: txKindBase64,
                sender: account.address,
                network: 'testnet'
            })
        });

        const sponsorData = await safeParse(sponsorResponse);

        if (!sponsorResponse.ok) {
            const detailMsg = typeof sponsorData.details === 'string' ? sponsorData.details : JSON.stringify(sponsorData.details);
            throw new Error(detailMsg || sponsorData.error || "Failed to sponsor transaction");
        }

        const { bytes: sponsoredBytesBase64, digest } = sponsorData;
        // const sponsoredBytes = fromBase64(sponsoredBytesBase64);

        const { signature } = await signTransaction({ transaction: sponsoredBytesBase64 });
        if (!signature) throw new Error("User rejected signature");

        const executeResponse = await fetch(`${BACKEND_URL}/api/execute-transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ digest, signature })
        });

        const executeData = await safeParse(executeResponse);
        if (!executeResponse.ok) {
            throw new Error(executeData.error || "Failed to execute transaction");
        }

        return executeData;
    }, [account, signTransaction]);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (!account) {
            setClient(null);
            setIsReady(false);
            return;
        }

        const initClient = async () => {
            const requestKey = `init-${account.address}`;
            if (inFlightRequests.current.has(requestKey)) return;
            inFlightRequests.current.add(requestKey);

            try {
                let sessionKey: SessionKey | null = null;
                const storedString = localStorage.getItem(`${SESSION_STORAGE_KEY}_${account.address}`);

                if (storedString) {
                    try {
                        const storedData = JSON.parse(storedString);
                        const restored = SessionKey.import(storedData, baseMessagingClient);
                        if (!restored.isExpired()) sessionKey = restored;
                    } catch (e) { console.warn("Invalid stored session"); }
                }

                if (!sessionKey) {
                    sessionKey = await SessionKey.create({
                        address: account.address,
                        packageId: APP_PACKAGE_ID,
                        ttlMin: 30,
                        suiClient: baseMessagingClient,
                    });

                    const message = await signPersonalMessage({
                        message: sessionKey.getPersonalMessage(),
                    });

                    await sessionKey.setPersonalMessageSignature(message.signature);
                    localStorage.setItem(`${SESSION_STORAGE_KEY}_${account.address}`, serializeSessionKey(sessionKey));
                }

                const newClient = createMessagingClient(sessionKey);
                setClient(newClient);
                setIsReady(true);
            } catch (e: any) {
                console.error("Failed to initialize client:", e);
                setError(e.message);
            } finally {
                inFlightRequests.current.delete(requestKey);
            }
        };

        initClient();
    }, [account, signPersonalMessage]);

    // --- HELPER: Get Member Cap with Caching ---
    const getMemberCap = useCallback(async (channelId: string) => {
        // 1. Check Cache
        if (memberCapCache.has(channelId)) {
            return memberCapCache.get(channelId)!;
        }

        // 2. Fetch if missing
        if (!client || !account) throw new Error("Client not ready");

        const membershipsResult = await client.messaging.getChannelMemberships({
            address: account.address,
            limit: 50
        });

        const membership = membershipsResult.memberships.find((m: any) => m.channel_id === channelId);

        if (membership) {
            // Update Cache
            setMemberCapCache(prev => new Map(prev).set(channelId, membership.member_cap_id));
            return membership.member_cap_id;
        }

        throw new Error("You are not a member of this channel");
    }, [client, account, memberCapCache]);

    // --- ACTIONS ---

    const createChannel = useCallback(async (memberAddresses: string[]) => {
        if (!client || !account) throw new Error("Client not ready");

        const flow = client.messaging.createChannelFlow({
            creatorAddress: account.address,
            initialMemberAddresses: memberAddresses,
        });

        const channelTx = flow.build();
        const { digest } = await executeSponsoredTransaction(channelTx);

        const txResult = await baseMessagingClient.waitForTransaction({
            digest, options: { showObjectChanges: true }
        });

        const channelObj = txResult.objectChanges?.find(
            (c: any) => c.type === 'created' && c.objectType.includes('::channel::Channel')
        );
        const channelId = (channelObj as any)?.objectId;

        const { creatorMemberCap, creatorCap } = await flow.getGeneratedCaps({ digest });

        // Optimistically cache the new creator member cap
        if (channelId) {
            setMemberCapCache(prev => new Map(prev).set(channelId, creatorMemberCap.id.id));
        }

        const attachKeyTx = await flow.generateAndAttachEncryptionKey({ creatorMemberCap });
        const { digest: finalDigest } = await executeSponsoredTransaction(attachKeyTx);
        await baseMessagingClient.waitForTransaction({ digest: finalDigest });

        setMessagesVersion(v => v + 1)
        return { success: true, channelId, creatorCapId: creatorCap.id };
    }, [client, account, executeSponsoredTransaction]);

    const sendMessage = useCallback(async (
        channelId: string,
        memberCapId: string | null, // Made nullable to support auto-fetch
        messageText: string,
        channelObject: any,
        attachments?: File[]
    ) => {
        if (!client || !account) throw new Error("Client not ready");

        // Auto-resolve MemberCap if not provided
        const resolvedMemberCapId = memberCapId || await getMemberCap(channelId);

        const channelEncryptionKey = {
            $kind: "Encrypted" as const,
            encryptedBytes: new Uint8Array(channelObject.encryption_key_history.latest),
            version: channelObject.encryption_key_history.latest_version,
        };

        const tx = new Transaction();
        const sendMessageBuilder = await client.messaging.sendMessage(
            channelId,
            resolvedMemberCapId,
            account.address,
            messageText,
            channelEncryptionKey,
            attachments,
        );

        await sendMessageBuilder(tx);
        await executeSponsoredTransaction(tx);
        setMessagesVersion(v => v + 1)
        return { success: true, channelId: channelId };
    }, [client, account, executeSponsoredTransaction, getMemberCap]);

    const addMembers = useCallback(async (channelId: string, newMemberAddresses: string[]) => {
        if (!client || !account) throw new Error("Client not ready");

        const memberCapId = await getMemberCap(channelId);

        const ownedObjects = await client.core.getOwnedObjects({
            owner: account.address,
            filter: { StructType: `${APP_PACKAGE_ID}::creator_cap::CreatorCap` },
            options: { showType: true }
        });

        // Filter specifically for the CreatorCap that matches this channel
        // Note: In a real app, you'd need to inspect the CreatorCap fields or cache them to know which one matches the channelId
        // For now, taking the first one is a simplification, but checking the content would be safer if possible
        const creatorCapObj = ownedObjects.data[0];

        if (!creatorCapObj) throw new Error("No CreatorCap found");

        const tx = client.messaging.addMembersTransaction({
            channelId,
            memberCapId: memberCapId,
            creatorCapId: creatorCapObj.data.objectId,
            newMemberAddresses: newMemberAddresses.map(a => a.trim()),
        });

        const { digest } = await executeSponsoredTransaction(tx);
        await baseMessagingClient.waitForTransaction({ digest, options: { showObjectChanges: true } });
        setMessagesVersion(v => v + 1)
        return { success: true, digest };
    }, [client, account, executeSponsoredTransaction, getMemberCap]);

    // --- READ METHODS ---
    const getMyChannels = useCallback(async () => {
        if (!client || !account) return [];
        const requestKey = `getChannels-${account.address}-${messagesVersion}`;

        // Simple debounce/dedupe
        if (inFlightRequests.current.has(requestKey)) return [];
        inFlightRequests.current.add(requestKey);

        try {
            const result = await client.messaging.getChannelMemberships({ address: account.address, limit: 50 });
            return result.memberships;
        } finally {
            inFlightRequests.current.delete(requestKey);
        }
    }, [client, account, messagesVersion]);

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
    }, [client, account, messagesVersion]);

    return {
        isReady,
        error,
        messagesVersion,
        createChannel,
        sendMessage,
        addMembers,
        getMessages,
        getMyChannels,
        getChannelObjects,
        getChannelMembers
    };
}

/*
import { useState, useCallback, useEffect } from "react";
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSignPersonalMessage,
    useSignTransaction
} from "@mysten/dapp-kit";
import { createMessagingClient, baseMessagingClient, APP_PACKAGE_ID } from "../services/suiMessagingClient";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64, fromBase64 } from "@mysten/sui/utils";
import {useRealTimeMessages} from "./useRealTimeMessages.ts";

const SESSION_STORAGE_KEY = "suimail_session_v1";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Interface for Polling (kept for getLatestMessages if needed)
interface PollingState {
    lastMessageCount: bigint;
    lastCursor: bigint | null;
    channelId: string;
}

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

export function useSuiMailMessenger(currentChannelId: string | null = null) {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    // Using signTransaction because execution happens on backend
    const { mutateAsync: signTransaction } = useSignTransaction();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const [client, setClient] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);

    // This state drives the re-fetching in the UI
    const [messagesVersion, setMessagesVersion] = useState(0);

    // This should trigger the messages to reload
    const handleNewMessage = useCallback(() => {
        console.log("🔔 Real-time update triggering refresh...");
        setMessagesVersion(v => v + 1);
        console.log("increeeeeeeeeeeeeeee")
    }, []);

    useRealTimeMessages({
        channelId: currentChannelId,
        onNewMessage: handleNewMessage
    });
    // 2. REAL-TIME LISTENER
    // This hook listens for events on the *currentChannelId* and bumps *messagesVersion*
    // useRealTimeMessages({
    //     channelId: currentChannelId,
    //     onNewMessage: () => {
    //         console.log("Real-time update triggering refresh...");
    //         setMessagesVersion(v => v + 1);
    //     }
    // });

    // --- SPONSORED TRANSACTION LOGIC ---
    const executeSponsoredTransaction = useCallback(async (tx: Transaction) => {
        if (!account) throw new Error("No account connected");

        // 1. Build TransactionKind (only the kind, no gas)
        tx.setSender(account.address);
        const kindBytes = await tx.build({
            client: baseMessagingClient,
            onlyTransactionKind: true,
        });
        const kindBase64 = toBase64(kindBytes);

        // 2. Get sponsored transaction from your Enoki backend
        const sponsorRes = await fetch(`${BACKEND_URL}/api/sponsor-transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                transactionKindBytes: kindBase64,
                sender: account.address,
                network: "testnet",
            }),
        });

        if (!sponsorRes.ok) {
            const err = await sponsorRes.json();
            throw new Error(err.error || "Sponsorship failed");
        }

        const { bytes: sponsoredTxBytesBase64, digest } = await sponsorRes.json();
        const sponsoredTxBytes = fromBase64(sponsoredTxBytesBase64);

        // 3. Sign the **raw bytes** (this is the fix!)
        const { signature } = await signTransaction({
            transaction: toBase64(sponsoredTxBytes), // ← CORRECT: pass Uint8Array, NOT string
        });

        if (!signature) throw new Error("Signature rejected");

        // 4. Send to backend for execution
        const execRes = await fetch(`${BACKEND_URL}/api/execute-transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                digest,
                signature, // This is already a base64 string
            }),
        });

        if (!execRes.ok) {
            const err = await execRes.json();
            throw new Error(err.error || "Execution failed");
        }

        return await execRes.json();
    }, [account, signTransaction]);

    // 1. INITIALIZATION
    useEffect(() => {
        if (!account) {
            setClient(null);
            setIsReady(false);
            return;
        }

        const initClient = async () => {
            try {
                let sessionKey: SessionKey | null = null;
                const storedString = localStorage.getItem(`${SESSION_STORAGE_KEY}_${account.address}`);

                if (storedString) {
                    try {
                        const storedData = JSON.parse(storedString);
                        const restored = SessionKey.import(storedData, baseMessagingClient);
                        if (!restored.isExpired()) sessionKey = restored;
                    } catch (e) {
                        console.warn("Invalid stored session");
                    }
                }

                if (!sessionKey) {
                    sessionKey = await SessionKey.create({
                        address: account.address,
                        packageId: APP_PACKAGE_ID,
                        ttlMin: 30,
                        suiClient: baseMessagingClient,
                    });

                    const message = await signPersonalMessage({
                        message: sessionKey.getPersonalMessage(),
                    });

                    await sessionKey.setPersonalMessageSignature(message.signature);
                    localStorage.setItem(`${SESSION_STORAGE_KEY}_${account.address}`, serializeSessionKey(sessionKey));
                }

                const newClient = createMessagingClient(sessionKey);
                setClient(newClient);
                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize client:", error);
            }
        };

        initClient();
    }, [account, signPersonalMessage]);


    // --- ACTIONS ---

    const createChannel = useCallback(async (memberAddresses: string[]) => {
        if (!client || !account) throw new Error("Client not ready");

        const flow = client.messaging.createChannelFlow({
            creatorAddress: account.address,
            initialMemberAddresses: memberAddresses,
        });

        // Step 1: Create Channel (Sponsored)
        const channelTx = flow.build();
        const { digest } = await executeSponsoredTransaction(channelTx);

        // Wait for effects to get object ID
        const txResult = await baseMessagingClient.waitForTransaction({
            digest, options: { showObjectChanges: true }
        });

        const channelObj = txResult.objectChanges?.find(
            (c: any) => c.type === 'created' && c.objectType.includes('::channel::Channel')
        );
        const channelId = (channelObj as any)?.objectId;

        // Step 2: Attach Key (Sponsored)
        const { creatorMemberCap, creatorCap } = await flow.getGeneratedCaps({ digest });
        const attachKeyTx = await flow.generateAndAttachEncryptionKey({ creatorMemberCap });

        const { digest: finalDigest } = await executeSponsoredTransaction(attachKeyTx);
        await baseMessagingClient.waitForTransaction({ digest: finalDigest });
        setMessagesVersion(v => v + 1)
        return { success: true, channelId, creatorCapId: creatorCap.id };
    }, [client, account, executeSponsoredTransaction]);

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
        await signAndExecute({ transaction: tx });
        setMessagesVersion(v => v + 1);
        return
    }, [client, account, signAndExecute]);


    const addMembers = useCallback(async (channelId: string, newMemberAddresses: string[]) => {
        if (!client || !account) throw new Error("Client not ready");

        // Fetch required caps (simplified logic)
        const membershipsResult = await client.messaging.getChannelMemberships({ address: account.address, limit: 50 });
        const membership = membershipsResult.memberships.find((m: any) => m.channel_id === channelId);
        if (!membership) throw new Error("Not a member");

        const ownedObjects = await client.core.getOwnedObjects({
            owner: account.address,
            filter: { StructType: `${APP_PACKAGE_ID}::creator_cap::CreatorCap` },
            options: { showType: true }
        });
        const creatorCapObj = ownedObjects.data[0];
        if (!creatorCapObj) throw new Error("No CreatorCap found");

        const tx = client.messaging.addMembersTransaction({
            channelId,
            memberCapId: membership.member_cap_id,
            creatorCapId: creatorCapObj.data.objectId,
            newMemberAddresses: newMemberAddresses.map(a => a.trim()),
        });

        const { digest } = await executeSponsoredTransaction(tx);
        await baseMessagingClient.waitForTransaction({ digest, options: { showObjectChanges: true } });
        setMessagesVersion(v => v + 1);
        return { success: true, digest };
    }, [client, account, executeSponsoredTransaction]);

    // --- READ METHODS ---
    // These remain largely the same, but getMessages now depends on messagesVersion
    const getMyChannels = useCallback(async () => {
        if (!client || !account) return [];
        const result = await client.messaging.getChannelMemberships({ address: account.address, limit: 50 });
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
        // We pass messagesVersion to the dependency array effectively via the hook usage
        // but here we can just fetch fresh data
        return (await client.messaging.getChannelMessages({
            channelId,
            userAddress: account.address,
            limit,
            direction: 'backward',
        })).messages;
    }, [client, account, messagesVersion]); // <--- Trigger re-run on version change

    const getLatestMessages = useCallback(async (channelId: string, lastMessageCount: bigint, lastCursor: bigint | null, limit = 50) => {
        if (!client || !account) return { messages: [], hasNextPage: false, cursor: null };
        const pollingState: PollingState = { channelId, lastMessageCount, lastCursor };
        return await client.messaging.getLatestMessages({
            channelId,
            userAddress: account.address,
            pollingState,
            limit,
        });
    }, [client, account]);

    const refreshSessionKey = useCallback(async () => {
        if (!client) return null;
        const newKey = await client.messaging.refreshSessionKey();
        if (account && newKey) localStorage.setItem(`${SESSION_STORAGE_KEY}_${account.address}`, serializeSessionKey(newKey));
        return newKey;
    }, [client, account]);

    const updateSessionKey = useCallback((newSessionKey: SessionKey) => {
        if (!client) return;
        client.messaging.updateSessionKey(newSessionKey);
        if (account) localStorage.setItem(`${SESSION_STORAGE_KEY}_${account.address}`, serializeSessionKey(newSessionKey));
    }, [client, account]);

    return {
        isReady,
        messagesVersion, // Exported for UI side effects
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
*/
