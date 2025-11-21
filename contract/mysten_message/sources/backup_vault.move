#[allow(lint(self_transfer))]
module suimail_contract::private_vault;

use sui::event;

public struct PrivateVault has key, store {
    id: UID,
    encrypted_contacts_blob: vector<u8>
}

public struct VaultCreated has copy, drop {
    id: ID,
    owner: address
}

// SPONSORED by Enoki
public fun create_vault(ctx: &mut TxContext) {
    let vault = PrivateVault {
        id: object::new(ctx),
        encrypted_contacts_blob: vector::empty()
    };

    event::emit(VaultCreated {
        id: object::id(&vault),
        owner: tx_context::sender(ctx)
    });

    transfer::transfer(vault, ctx.sender());
}

// USER-PAYS (High value action)
public fun update_backup(
    vault: &mut PrivateVault,
    new_blob_id: vector<u8>,
    _ctx: &mut TxContext
) {
    vault.encrypted_contacts_blob = new_blob_id;
}
