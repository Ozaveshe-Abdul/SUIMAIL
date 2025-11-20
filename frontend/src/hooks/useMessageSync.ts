// web-app/src/hooks/useMessageSync.ts

import { useEffect, useCallback } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { CHAT_ENVELOP_TYPE } from "../utilities/constants.ts";
import { messageStore } from "../services/messageStore.ts";
import type { ChatEnvelopFields } from "../utilities/types.ts";
import {SuiObjectResponse} from "@mysten/sui/client";


function extractChatEnvelop(obj: SuiObjectResponse): ChatEnvelopFields | null {
    // 1. Must be a Move object
    if (obj.data?.content?.dataType !== "moveObject") return null;

    const f = obj.data.content.fields as any; // raw MoveStruct fields

    // 2. Guard against missing fields (Sui can return partial data)
    if (
        typeof f.id?.id !== "string" ||
        typeof f.msg_blob !== "string" ||
        typeof f.sender !== "string" ||
        typeof f.receiver !== "string" ||
        typeof f.timestamp !== "string"
    ) {
        return null;
    }

    return {
        id: f.id.id,          // <-- the nested .id.id is the real object ID
        msg_blob: f.msg_blob,
        sender: f.sender,
        receiver: f.receiver,
        timestamp: f.timestamp,
    };
}
/**
 * Hook to sync blockchain messages with local IndexedDB
 */
export function useMessageSync(userAddress: string | undefined) {
    // Fetch messages from blockchain
    const { data: messagesData, refetch } = useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: userAddress!,
            filter: { StructType: CHAT_ENVELOP_TYPE },
            options: { showContent: true },
        },
        { enabled: !!userAddress, refetchInterval: 10000 } // Poll every 10 seconds
    );

    /**
     * Sync messages from blockchain to local database
     */
    const syncMessages = useCallback(async () => {
        if (!messagesData || !userAddress) return;

        try {
            // 1. Extract only valid envelopes
            const envelopes: ChatEnvelopFields[] = messagesData.data
                .map(extractChatEnvelop)
                .filter((m): m is ChatEnvelopFields => m !== null);

            // 2. Persist to IndexedDB (unchanged)
            for (const env of envelopes) {
                await messageStore.saveMessage(env, userAddress);
            }

            console.log(`Synced ${envelopes.length} messages to local database`);
        } catch (error) {
            console.error("Failed to sync messages:", error);
        }
    }, [messagesData, userAddress, messageStore]);
    /*const syncMessages = useCallback(async () => {
        if (!messagesData || !userAddress) return;

        try {
            const messages = messagesData.data
                .map((obj) => {
                    if (obj.data?.content?.dataType === "moveObject") {
                        return obj.data.content.fields as ChatEnvelopFields;
                    }
                    return null;
                })
                .filter((m): m is ChatEnvelopFields => m !== null);

            // Save each message to IndexedDB
            for (const message of messages) {
                await messageStore.saveMessage(message, userAddress);
            }

            console.log(`Synced ${messages.length} messages to local database`);
        } catch (error) {
            console.error("Failed to sync messages:", error);
        }
    }, [messagesData, userAddress]);*/

    // Auto-sync when data changes
    useEffect(() => {
        void syncMessages();
    }, [syncMessages]);

    return {
        syncMessages,
        refetchMessages: refetch,
    };
}
