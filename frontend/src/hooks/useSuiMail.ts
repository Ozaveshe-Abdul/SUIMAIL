// web-app/src/hooks/useSuiMail.ts

import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {

    REGISTRY_ID,
    CREATE_PROFILE_FUNCTION,
    SEND_MESSAGE_FUNCTION,
    DELETE_MESSAGE_FUNCTION,
    UPDATE_BACKUP_FUNCTION,
} from "../utilities/constants";
import {
    generateEncryptionKeypair,
    saveEncryptionKeypair,
    getPublicKeyBytes,
    encryptMessage,
} from "../services/encryption";
import type { Profile } from "../utilities/types";

export function useSuiMail() {
    const account = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction, isPending } =
        useSignAndExecuteTransaction();

    /**
     * Create profile (USER PAYS)
     */
    const createProfile = async (
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) {
            onError("Wallet not connected");
            return;
        }

        try {
            // Generate encryption keypair
            const keypair = generateEncryptionKeypair();
            const publicKeyBytes = getPublicKeyBytes(keypair);

            // Build transaction
            const txb = new Transaction();
            txb.moveCall({
                target: CREATE_PROFILE_FUNCTION,
                arguments: [
                    txb.object(REGISTRY_ID),
                    txb.pure.vector("u8", publicKeyBytes),
                ],
            });

            // Execute with user's wallet (user pays gas)
            const result = await signAndExecuteTransaction({
                transaction: txb,
            });

            // Save keypair after successful transaction
            saveEncryptionKeypair(keypair);

            onSuccess(result.digest);
        } catch (error: any) {
            console.error("Create profile error:", error);
            onError(error.message || "Failed to create profile");
        }
    };

    /**
     * Send message (USER PAYS - temporary fix until gas station is working)
     * TODO: Re-enable sponsorship after gas station is configured
     */
    const sendMessage = async (
        recipientAddress: string,
        payloadJson: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) {
            onError("Wallet not connected");
            return;
        }

        try {
            // Encrypt the payload
            const encryptedPayload = encryptMessage(payloadJson);
            const payloadBytes = Array.from(new TextEncoder().encode(encryptedPayload));

            // Build transaction
            const txb = new Transaction();
            txb.moveCall({
                target: SEND_MESSAGE_FUNCTION,
                arguments: [
                    txb.pure.vector("u8", payloadBytes),
                    txb.pure.address(recipientAddress),
                ],
            });

            // For now, user pays (comment out gas station code)
            console.log("Sending message (user pays)...");

            const result = await signAndExecuteTransaction({
                transaction: txb,
            });

            onSuccess(result.digest);

            /* TODO: Re-enable when gas station is properly configured
            try {
              // Try gas station first
              txb.setSender(account.address);
              const txBytes = await txb.build({ client: await getSuiClient() });

              const sponsorResponse = await fetch(`${GAS_STATION_URL}/sponsor-tx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  txBytes: Array.from(txBytes),
                  senderAddress: account.address,
                }),
              });

              if (!sponsorResponse.ok) {
                throw new Error("Gas station failed");
              }

              const { digest } = await sponsorResponse.json();
              onSuccess(digest);
            } catch (gasStationError) {
              // Fallback to user paying
              console.warn("Gas station failed, user will pay:", gasStationError);
              const result = await signAndExecuteTransaction({
                transaction: txb,
              });
              onSuccess(result.digest);
            }
            */
        } catch (error: any) {
            console.error("Send message error:", error);
            onError(error.message || "Failed to send message");
        }
    };

    /**
     * Delete message (USER PAYS - to receive storage rebate)
     */
    const deleteMessage = async (
        messageObjectId: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) {
            onError("Wallet not connected");
            return;
        }

        try {
            const txb = new Transaction();
            txb.moveCall({
                target: DELETE_MESSAGE_FUNCTION,
                arguments: [txb.object(messageObjectId)],
            });

            const result = await signAndExecuteTransaction({
                transaction: txb,
            });

            onSuccess(result.digest);
        } catch (error: any) {
            console.error("Delete message error:", error);
            onError(error.message || "Failed to delete message");
        }
    };

    /**
     * Update backup blob (USER PAYS)
     */
    const updateBackup = async (
        profile: Profile,
        backupBlob: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) {
            onError("Wallet not connected");
            return;
        }

        try {
            const backupBytes = Array.from(new TextEncoder().encode(backupBlob));

            const txb = new Transaction();
            txb.moveCall({
                target: UPDATE_BACKUP_FUNCTION,
                arguments: [
                    txb.object(profile.id.id),
                    txb.pure.vector("u8", backupBytes),
                ],
            });

            const result = await signAndExecuteTransaction({
                transaction: txb,
            });

            onSuccess(result.digest);
        } catch (error: any) {
            console.error("Update backup error:", error);
            onError(error.message || "Failed to update backup");
        }
    };

    return {
        isPending,
        createProfile,
        sendMessage,
        deleteMessage,
        updateBackup,
    };
}

// Helper to get Sui client (adjust based on your setup)
async function getSuiClient() {
    const { SuiClient } = await import("@mysten/sui/client");
    return new SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
}
