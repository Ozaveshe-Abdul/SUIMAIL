// web-app/src/utils/types.ts

export interface ChatEnvelopFields {
    id: { id: string };
    msg_blob: number[];
    sender: string;
    receiver: string;
    timestamp: string;
}

export interface Profile {
    id: { id: string };
    public_key: number[];
    owner: string;
    encrypted_backup_blob: number[];
}

export interface MessagePayload {
    text: string | null;
    file: {
        name: string;
        type: string;
        data: string; // base64
    } | null;
}

export interface StoredMessage extends ChatEnvelopFields {
    conversationId: string;
    isRead: boolean;
    localTimestamp: number;
    decryptedPayload?: MessagePayload;
}

export interface FriendsList {
    [address: string]: string; // address -> alias
}
