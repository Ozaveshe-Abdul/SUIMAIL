
/// Module: suimail_contract
module suimail_contract::junk;

use sui::event;
use sui::table::{Self, Table};


#[error]
const E_PROFILE_ALREADY_EXISTS: vector<u8> = b"Profile already exists for this address";
// --- Structs ---

/// Shared registry mapping addresses to public keys
public struct SuiMailRegistry has key {
    id: UID,
    keys: Table<address, vector<u8>>,
}

/// Private user profile
public struct Profile has key {
    id: UID,
    public_key: vector<u8>,
    owner: address,
    encrypted_backup_blob: vector<u8>,
}

/// Message wrapper - transferred to recipient
public struct ChatEnvelop has key, store {
    id: UID,
    msg_blob: vector<u8>,
    sender: address,
    receiver: address,
    timestamp: u64
}

// --- Events ---

/// Emitted when a new profile is created
public struct ProfileCreatedEvent has copy, drop {
    owner_address: address,
    public_key: vector<u8>,
}

/// Emitted when a message is sent
public struct MessageSentEvent has copy, drop {
    sender: address,
    recipient: address,
    message_key: u64,
    message_blob_id: vector<u8>
}

/// Emitted when a message is deleted
public struct MessageDeletedEvent has copy, drop {
    owner: address,
    message_key: u64
}

// --- Init Function ---

/// Called once when the module is published
fun init(ctx: &mut TxContext) {
    let registry = SuiMailRegistry {
        id: object::new(ctx),
        keys: table::new(ctx)
    };
    transfer::share_object(registry);
}

// --- Entry Functions ---

/// Creates a profile for the user
public fun create_profile(
    registry: &mut SuiMailRegistry,
    public_key: vector<u8>,
    ctx: &mut TxContext
) {

    let sender = ctx.sender();

    // Ensure profile does not already exist
    assert!(
        !table::contains(&registry.keys, sender),
        E_PROFILE_ALREADY_EXISTS
    );


    // Create private profile
    let profile = Profile {
        id: object::new(ctx),
        public_key,
        owner: sender,
        encrypted_backup_blob: b""
    };

    // Add public key to shared registry
    table::add(&mut registry.keys, sender, public_key);

    // Transfer profile privately to owner
    transfer::transfer(profile, sender);

    // Emit event
    event::emit(ProfileCreatedEvent {
        owner_address: sender,
        public_key,
    });
}

/// Sends a message to a recipient
public fun send_message(
    msg_blob_id: vector<u8>,
    recipient: address,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let timestamp = tx_context::epoch_timestamp_ms(ctx);

    let chat = ChatEnvelop {
        id: object::new(ctx),
        msg_blob: msg_blob_id,
        sender,
        receiver: recipient,
        timestamp
    };

    // Emit event before transfer
    event::emit(MessageSentEvent {
        sender,
        recipient,
        message_key: timestamp,
        message_blob_id: msg_blob_id
    });

    // Transfer message to recipient
    transfer::transfer(chat, recipient);
}

/// Deletes a message and emits event
public fun delete(
    envelop: ChatEnvelop,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);

    // Security check: only receiver can delete
    assert!(envelop.receiver == sender, 0);

    let timestamp = envelop.timestamp;

    // Destruct and delete
    let ChatEnvelop { id, msg_blob: _, sender: _, receiver: _, timestamp: _ } = envelop;
    object::delete(id);

    // Emit event
    event::emit(MessageDeletedEvent {
        owner: sender,
        message_key: timestamp
    });
}

/// Updates the encrypted backup blob
public fun update_backup(
    profile: &mut Profile,
    new_blob_id: vector<u8>,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);

    // Security check: only owner can update
    assert!(profile.owner == sender, 0);

    profile.encrypted_backup_blob = new_blob_id;
}

// --- View Functions (Optional but useful) ---

/// Get public key from registry
public fun get_public_key(
    registry: &SuiMailRegistry,
    user: address
): vector<u8> {
    *table::borrow(&registry.keys, user)
}

/// Check if user has registered
public fun is_registered(
    registry: &SuiMailRegistry,
    user: address
): bool {
    table::contains(&registry.keys, user)
}

