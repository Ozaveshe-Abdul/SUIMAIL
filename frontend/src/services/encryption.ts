// web-app/src/services/encryption.ts

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64, toB64 } from "@mysten/sui/utils";

const ENCRYPTION_KEY_STORAGE = "suimail_encryption_keypair";

/**
 * Generate a new encryption keypair
 */
export function generateEncryptionKeypair(): Ed25519Keypair {
    return new Ed25519Keypair();
}

/**
 * Save the keypair to localStorage
 */
export function saveEncryptionKeypair(keypair: Ed25519Keypair): void {
    const secretKey = keypair.getSecretKey();
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, secretKey);
}

/**
 * Load the keypair from localStorage
 */
export function loadEncryptionKeypair(): Ed25519Keypair | null {
    const secretKeyB64 = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (!secretKeyB64) return null;

    try {
        const secretKeyBytes = fromB64(secretKeyB64);
        return Ed25519Keypair.fromSecretKey(secretKeyBytes);
    } catch (error) {
        console.error("Failed to load encryption keypair:", error);
        return null;
    }
}

/**
 * Get public key as bytes array
 */
export function getPublicKeyBytes(keypair: Ed25519Keypair): number[] {
    return Array.from(keypair.getPublicKey().toRawBytes());
}

/**
 * Simple encryption (base64 encoding for hackathon)
 * TODO: Implement real E2E encryption with recipient's public key
 */
export function encryptMessage(message: string): string {
    return toB64(new TextEncoder().encode(message));
}

/**
 * Simple decryption (base64 decoding for hackathon)
 * TODO: Implement real E2E decryption with private key
 */
export function decryptMessage(encryptedB64: string): string {
    try {
        const bytes = fromB64(encryptedB64);
        return new TextDecoder().decode(bytes);
    } catch (error) {
        console.error("Decryption failed:", error);
        return "[Decryption Error]";
    }
}
