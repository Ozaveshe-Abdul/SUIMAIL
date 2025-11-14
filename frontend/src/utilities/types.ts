// --- Type Definitions ---
export type ChatEnvelopFields = {
    id: { id: string };
    msg_blob: number[];
    sender: string;
    receiver: string;
    timestamp: string;
};

export type Profile = {
    id: { id: string };
    public_key: number[];
    owner: string;
    encrypted_backup_blob: number[];
};
