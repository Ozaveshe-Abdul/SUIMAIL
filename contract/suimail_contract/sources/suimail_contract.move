
/// Module: suimail_contract
module suimail_contract::suimail_contract;

// use sui::std::Clock

// user profile
public struct Profile has key {
    id: UID,
    public_key: vector<u8>, // key pair generated to encrypt and decrypt messages
    owner: address,
    encrypted_backup_blob: vector<u8>,
}

// message wrapper
public struct ChatEnvelop has key, store {
    id: UID,
    msg_blob: vector<u8>,
    sender: address,
    receiver: address,
    timestamp: u64
}

// creates profile for user and send to their wallet
public fun create_profile(public_key: vector<u8>, ctx: &mut TxContext) {
    let profile = Profile {
        id: object::new(ctx),
        public_key,
        owner: ctx.sender(),
        encrypted_backup_blob: b""
    };
    transfer::transfer(profile, ctx.sender());
}

public fun send_message(msg_blob_id: vector<u8>, recipient: address, ctx: &mut TxContext) {
    let chat = ChatEnvelop {
        id: object::new(ctx),
        msg_blob: msg_blob_id,
        sender: ctx.sender(),
        receiver: recipient,
        timestamp: tx_context::epoch_timestamp_ms(ctx)
    };

    transfer::transfer(chat, recipient);
}

public fun delete(envelop: ChatEnvelop, ctx: &TxContext) {
    assert!(envelop.receiver == ctx.sender());
    let ChatEnvelop { id, ..} = envelop;
    id.delete();
}


