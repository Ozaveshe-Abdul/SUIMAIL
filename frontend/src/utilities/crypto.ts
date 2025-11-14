
// web-app/src/crypto.ts
// import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import { Keypair } from "@mysten/sui/cryptography"; // We still use this type
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const ENCRYPTION_KEY = "suimail_encryption_key";

// --- Key Generation ---

/**
 * Generates a new, random x25519 keypair for encryption.
 * This is what we'll use for our simple "create profile"
 */
export function generateEncryptionKeypair(): Keypair {
    // We'll use Ed25519 for everything to keep it simple
    return new Ed25519Keypair();
}

/**
 * Saves the user's private encryption key to localStorage.
 */
export function savePrivateKey(keypair: Keypair) {
    const edKeypair = keypair as Ed25519Keypair;
    const secretKeyString = edKeypair.getSecretKey(); // This is a base64 string
    localStorage.setItem(ENCRYPTION_KEY, secretKeyString);
}

/**
 * Loads the user's private encryption key from localStorage.
 */
export function loadPrivateKey(): Keypair | null {
    const secretKeyString = localStorage.getItem(ENCRYPTION_KEY);
    if (!secretKeyString) return null;

    const secretKeyBytes = naclUtil.decodeBase64(secretKeyString);
    return Ed25519Keypair.fromSecretKey(secretKeyBytes);
}

// --- Encryption / Decryption ---
// (Placeholders - we are just base64-encoding the text for the demo)

export function encryptMessage(message: string): string {
    console.log("Encrypting:", message);
    return naclUtil.encodeBase64(naclUtil.decodeUTF8(message));
}

export function decryptMessage(encryptedBase64: string): string | null {
    console.log("Decrypting:", encryptedBase64);
    try {
        return naclUtil.encodeUTF8(naclUtil.decodeBase64(encryptedBase64));
    } catch (e) {
        return "[Decryption Error]";
    }
}
/*
// web-app/src/crypto.ts
import naclUtil from "tweetnacl-util";
//
// ✅ THE REAL FIX:
// 'Ed25519Keypair' is in its own '/keypairs/ed25519' module.
// 'Keypair' is in the '/cryptography' module.
//
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { type Keypair } from "@mysten/sui/cryptography";

const SESSION_KEY = "suimail_session_key";

// --- 1. Deterministic Encryption Key (Key A) ---

/!**
 * Derives a user's permanent E2E encryption keypair
 * from their wallet's signature.
 * @param signature The 64-byte signature from signPersonalMessage
 * @returns An Ed25519Keypair
 *!/
export function deriveEncryptionKeypair(signature: string): Keypair {
    const signatureBytes = naclUtil.decodeBase64(signature);
    // Use the first 32 bytes of the signature as a seed
    const seed = signatureBytes.slice(0, 32);

    // ✅ FIX: Use 'fromSecretKey' instead of 'fromSeed'
    return Ed25519Keypair.fromSecretKey(seed);
}

// --- 2. Temporary Session Key (Key B) ---

/!**
 * Generates a *new, random* keypair to use for this session.
 *!/
export function generateSessionKeypair(): Keypair {
    return new Ed25519Keypair();
}

/!**
 * Saves the session key's *private* key to localStorage.
 *!/
export function saveSessionKey(keypair: Keypair) {
    const edKeypair = keypair as Ed25519Keypair;

    // ✅ FIX: getSecretKey() returns a base64 string, so we save it directly.
    const secretKeyString = edKeypair.getSecretKey();
    localStorage.setItem(SESSION_KEY, secretKeyString);
}

/!**
 * Loads a session key from localStorage.
 *!/
export function loadSessionKey(): Keypair | null {
    // 1. Load the base64 string from localStorage
    const secretKeyString = localStorage.getItem(SESSION_KEY);
    if (!secretKeyString) return null;

    // 2. ✅ FIX: Decode the base64 string back into bytes
    const secretKeyBytes = naclUtil.decodeBase64(secretKeyString);

    // 3. Use the bytes to create the keypair
    return Ed25519Keypair.fromSecretKey(secretKeyBytes);
}

// --- 3. Encryption / Decryption ---
// (Placeholders)

export function encryptMessage(
    message: string,
    theirPublicKey: Uint8Array,
    myPrivateKey: Uint8Array
): string {
    console.log("Encrypting...", theirPublicKey, myPrivateKey);
    // This is a placeholder for the complex E2E logic
    // For the hackathon, we can just base64 encode it
    return naclUtil.encodeBase64(naclUtil.decodeUTF8(message));
}

export function decryptMessage(
    encryptedBase64: string,
    theirPublicKey: Uint8Array,
    myPrivateKey: Uint8Array
): string | null {
    console.log("Decrypting...", theirPublicKey, myPrivateKey);
    // Placeholder for decryption
    try {
        return naclUtil.encodeUTF8(naclUtil.decodeBase64(encryptedBase64));
    } catch (e) {
        return "[Decryption Error]";
    }
}
*/
