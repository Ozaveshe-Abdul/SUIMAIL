// web-app/src/utils/constants.ts

// 🔴 REPLACE WITH YOUR DEPLOYED PACKAGE ID
export const PACKAGE_ID = "0x657cd1fba52a28bbb2c1e9fe5bb60b0222e4d4315e3a0ee92ac7026f1f799ce1";
export const REGISTRY_ID = "0x8f0b16d02922b414f98ea7e11c644d12054094abb146357bb1b975cefc8bca13";

// Contract module and function paths
export const MODULE_NAME = "suimail_contract";
export const CREATE_PROFILE_FUNCTION = `${PACKAGE_ID}::${MODULE_NAME}::create_profile`;
export const SEND_MESSAGE_FUNCTION = `${PACKAGE_ID}::${MODULE_NAME}::send_message`;
export const DELETE_MESSAGE_FUNCTION = `${PACKAGE_ID}::${MODULE_NAME}::delete`;
export const UPDATE_BACKUP_FUNCTION = `${PACKAGE_ID}::${MODULE_NAME}::update_backup`;

// Type paths for querying
export const CHAT_ENVELOP_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::ChatEnvelop`;
export const PROFILE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Profile`;

// Gas station endpoint
export const GAS_STATION_URL = import.meta.env.VITE_GAS_STATION_URL || "http://127.0.0.1:5000";
