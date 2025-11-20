// web-app/src/services/messageStore.ts

import type { ChatEnvelopFields, StoredMessage, MessagePayload } from "../utilities/types.ts";
import { decryptMessage } from "./encryption.ts";

const DB_NAME = "SuiMailDB";
const DB_VERSION = 1;
const MESSAGES_STORE = "messages";

class MessageStore {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
                    const objectStore = db.createObjectStore(MESSAGES_STORE, {
                        keyPath: "id.id",
                    });

                    objectStore.createIndex("conversationId", "conversationId", { unique: false });
                    objectStore.createIndex("timestamp", "timestamp", { unique: false });
                    objectStore.createIndex("sender", "sender", { unique: false });
                    objectStore.createIndex("receiver", "receiver", { unique: false });
                }
            };
        });
    }

    /**
     * Decode and decrypt message payload
     */
    private decodePayload(msg_blob: number[]): MessagePayload {
        try {
            const blobAsUint8 = new Uint8Array(msg_blob);
            const encryptedB64 = new TextDecoder().decode(blobAsUint8);
            const decrypted = decryptMessage(encryptedB64);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error("Failed to decode payload:", error);
            return { text: "[Decryption Failed]", file: null };
        }
    }

    /**
     * Save a message to local database
     */
    async saveMessage(
        message: ChatEnvelopFields,
        currentUserAddress: string
    ): Promise<void> {
        if (!this.db) await this.init();

        const conversationId =
            message.sender === currentUserAddress ? message.receiver : message.sender;

        const storedMessage: StoredMessage = {
            ...message,
            conversationId,
            isRead: message.sender === currentUserAddress,
            localTimestamp: Date.now(),
            decryptedPayload: this.decodePayload(message.msg_blob),
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readwrite");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const request = objectStore.put(storedMessage);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all messages for a conversation
     */
    async getConversationMessages(conversationId: string): Promise<StoredMessage[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readonly");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const index = objectStore.index("conversationId");
            const request = index.getAll(conversationId);

            request.onsuccess = () => {
                const messages = request.result as StoredMessage[];
                messages.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all conversations with latest message
     */
    async getAllConversations(): Promise<Map<string, StoredMessage[]>> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readonly");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const messages = request.result as StoredMessage[];
                const conversations = new Map<string, StoredMessage[]>();

                messages.forEach((msg) => {
                    if (!conversations.has(msg.conversationId)) {
                        conversations.set(msg.conversationId, []);
                    }
                    conversations.get(msg.conversationId)!.push(msg);
                });

                conversations.forEach((msgs) => {
                    msgs.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
                });

                resolve(conversations);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readwrite");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const request = objectStore.delete(messageId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readwrite");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const getRequest = objectStore.get(messageId);

            getRequest.onsuccess = () => {
                const message = getRequest.result as StoredMessage;
                if (message) {
                    message.isRead = true;
                    const putRequest = objectStore.put(message);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Clear all messages
     */
    async clearAll(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([MESSAGES_STORE], "readwrite");
            const objectStore = transaction.objectStore(MESSAGES_STORE);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const messageStore = new MessageStore();
