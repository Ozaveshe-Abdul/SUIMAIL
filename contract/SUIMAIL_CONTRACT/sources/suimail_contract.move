
/// Module: suimail_contract
module suimail_contract::suimail_contract;

public struct Profile has key {
    id: UID,
    public_key: vector<u8>,
    encrypted_backup_blob: vector<u8>,
}



