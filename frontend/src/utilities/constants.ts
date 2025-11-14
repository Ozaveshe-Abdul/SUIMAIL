// web-app/src/constants.ts

// 🛑 REPLACE THIS with the Package ID from your Day 1 deploy
export const PACKAGE_ID = "0x4a90f7e1348c51d672249d930877ff1dd847c87e8079ca33b8f4c0aa65eb982f" //"0x350bd748e09b93e65b5a65e22a0d652e4bfbebdb66efbc55754560d4151d6992";
export const REGISTRY_ID = "0xafcc0479287bfebc729a7e3ecec5e165229eb1e33683631a950369a341a6161e";
// This is a fixed, on-chain object ID that is the same for all networks
export const SUI_CLOCK_OBJECT_ID = "0x6";

// --- Contract Types ---
export const CHAT_ENVELOP_TYPE = `${PACKAGE_ID}::suimail_contract::ChatEnvelop`;
export const PROFILE_TYPE = `${PACKAGE_ID}::suimail_contract::Profile`;
