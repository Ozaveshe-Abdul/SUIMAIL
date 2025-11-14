// web-app/src/utils/types.ts

import {SuiObjectResponse} from "@mysten/sui/client";

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

// utilities/sui.ts
export function extractProfile(obj: SuiObjectResponse): Profile | null {
    if (obj.data?.content?.dataType !== "moveObject") return null;

    const f = obj.data.content.fields as any;
    if (!f.id?.id || typeof f.public_key !== "string") return null;

    return {
        id: f.id.id,
        public_key: f.public_key,
        owner: f.owner,
        encrypted_backup_blob: f.encrypted_backup_blob,
    };
}
