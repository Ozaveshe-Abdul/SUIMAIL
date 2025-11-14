// contract/sources/suimail_contract.move

module suimail_contract::suimail_contract;
use sui::table::{Self, Table};
use sui::event;

// --- Error Codes ---
#[error]
const E_NOT_AUTHORIZED: vector<u8> = b"Not profile owner";

#[error]
const E_PROFILE_ALREADY_EXISTS: vector<u8> = b"Profile already exists for this address";
// ✅ ADD THIS NEW ERROR
#[error]
const E_INVALID_PERMISSION: vector<u8> = b"Only profile owner can delete";


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

/// Message envelope - transferred to recipient
public struct ChatEnvelop has key, store {
id: UID,
msg_blob: vector<u8>,
sender: address,
receiver: address,
timestamp: u64,
}

// --- Events ---

public struct ProfileCreatedEvent has copy, drop {
owner_address: address,
public_key: vector<u8>,
}

public struct MessageSentEvent has copy, drop {
sender: address,
recipient: address,
timestamp: u64,
}

public struct MessageDeletedEvent has copy, drop {
owner: address,
message_id: address,
}


public struct ProfileDeletedEvent has copy, drop {
    owner_address: address,
}

// --- Init Function ---

fun init(ctx: &mut TxContext) {
    let registry = SuiMailRegistry {
        id: object::new(ctx),
        keys: table::new(ctx),
    };
    transfer::share_object(registry);
}

// --- Entry Functions ---

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
        encrypted_backup_blob: vector::empty(),
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

public fun send_message(
    msg_blob: vector<u8>,
    recipient: address,
    ctx: &mut TxContext
) {
    let sender = ctx.sender();
    let timestamp = ctx.epoch_timestamp_ms();

    let envelope = ChatEnvelop {
        id: object::new(ctx),
        msg_blob,
        sender,
        receiver: recipient,
        timestamp,
    };

    // Emit event
    event::emit(MessageSentEvent {
        sender,
        recipient,
        timestamp,
    });

    // Transfer to recipient
    transfer::transfer(envelope, recipient);
}

public fun delete(
    envelope: ChatEnvelop,
    ctx: &TxContext
) {
    let sender = ctx.sender();

    // Only receiver can delete
    assert!(envelope.receiver == sender, E_NOT_AUTHORIZED);

    let message_id = object::uid_to_address(&envelope.id);

    // Destruct and delete
    let ChatEnvelop { id, msg_blob: _, sender: _, receiver: _, timestamp: _ } = envelope;
    object::delete(id);

    // Emit event
    event::emit(MessageDeletedEvent {
        owner: sender,
        message_id,
    });
}

public fun delete_profile(
    registry: &mut SuiMailRegistry,
    profile: Profile, // Pass in the user's *private* Profile object
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);

    // 1. Security check: only the owner can delete their profile
    assert!(profile.owner == sender, E_INVALID_PERMISSION);

    // 2. Remove their public key from the shared registry
    let _public_key: vector<u8> = table::remove(&mut registry.keys, sender);

    // 3. Deconstruct and delete the private profile object
    let Profile { id, .. } = profile;
    object::delete(id);

    // 4. Emit an event so the indexer knows this user is gone
    event::emit(ProfileDeletedEvent {
        owner_address: sender
    });
}

public fun update_backup(
    profile: &mut Profile,
    new_blob: vector<u8>,
    ctx: &TxContext
) {
    let sender = ctx.sender();

    // Only owner can update
    assert!(profile.owner == sender, E_NOT_AUTHORIZED);

    profile.encrypted_backup_blob = new_blob;
}

// --- View Functions ---

public fun get_public_key(
    registry: &SuiMailRegistry,
    user: address
): vector<u8> {
    *table::borrow(&registry.keys, user)
}

public fun is_registered(
    registry: &SuiMailRegistry,
    user: address
): bool {
    table::contains(&registry.keys, user)
}



