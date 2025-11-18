// web-app/src/hooks/useConversations.ts

import { useState, useEffect, useCallback } from "react";
import { messageStore } from "../services/messageStore";
import { loadFriendsList } from "../services/friendsStore";
import type { StoredMessage } from "../utilities/types";

/**
 * Hook to manage conversations from local database
 */
export function useConversations() {
    const [conversations, setConversations] = useState<Map<string, StoredMessage[]>>(
        new Map()
    );
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<StoredMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Load all conversations from IndexedDB and merge with friends list
     */
    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const convs = await messageStore.getAllConversations();

            // Get friends list
            const friends = loadFriendsList();

            // Add friends who don't have conversations yet
            for (const friendAddress of Object.keys(friends)) {
                if (!convs.has(friendAddress)) {
                    convs.set(friendAddress, []); // Empty conversation
                }
            }

            setConversations(convs);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Load specific conversation messages
     */
    const loadConversation = useCallback(async (conversationId: string) => {
        setIsLoading(true);
        try {
            const messages = await messageStore.getConversationMessages(conversationId);
            setCurrentMessages(messages);
        } catch (error) {
            console.error("Failed to load conversation:", error);
            setCurrentMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Delete a message from local database
     */
    const deleteLocalMessage = useCallback(async (messageId: string) => {
        try {
            await messageStore.deleteMessage(messageId);
            // Reload conversations
            await loadConversations();
            if (selectedChat) {
                await loadConversation(selectedChat);
            }
        } catch (error) {
            console.error("Failed to delete local message:", error);
        }
    }, [selectedChat, loadConversations, loadConversation]);

    /**
     * Select a chat and load its messages
     */
    const selectChat = useCallback(
        async (conversationId: string) => {
            setSelectedChat(conversationId);
            await loadConversation(conversationId);
        },
        [loadConversation]
    );

    // Load conversations on mount
    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    // Reload when selected chat changes
    useEffect(() => {
        if (selectedChat) {
            void loadConversation(selectedChat);
        }
    }, [selectedChat, loadConversation]);

    // Listen for friend updates
    useEffect(() => {
        const handleFriendsUpdate = () => {
            void loadConversations();
        };

        window.addEventListener("friendsUpdated", handleFriendsUpdate);
        return () => window.removeEventListener("friendsUpdated", handleFriendsUpdate);
    }, [loadConversations]);

    return {
        conversations,
        selectedChat,
        currentMessages,
        isLoading,
        loadConversations,
        selectChat,
        deleteLocalMessage,
        setSelectedChat
    };
}
