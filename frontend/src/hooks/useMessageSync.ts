// web-app/src/hooks/useMessageSync.ts

import { useEffect, useCallback } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { CHAT_ENVELOP_TYPE } from "../utilities/constants";
import { messageStore } from "../services/messageStore";
import type { ChatEnvelopFields } from "../utilities/types";

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
    }, [messagesData, userAddress]);

    // Auto-sync when data changes
    useEffect(() => {
        void syncMessages();
    }, [syncMessages]);

    return {
        syncMessages,
        refetchMessages: refetch,
    };
}
