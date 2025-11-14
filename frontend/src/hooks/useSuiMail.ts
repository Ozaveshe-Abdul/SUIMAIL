// web-app/src/useSuiMail.ts
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSignTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, REGISTRY_ID } from "../utilities/constants";
import * as crypto from "../utilities/crypto";
import { Profile } from "../utilities/types";


// --- Our Gas Station API Endpoint ---
const SPONSOR_SERVER_URL = "http://127.0.0.1:5000/sponsor-tx";

export function useSuiMail() {
    const account = useCurrentAccount();

    // Hook for USER-PAYS txns (delete, backup)
    const { mutateAsync: signAndExecute, isPending: isUserPaysPending } =
        useSignAndExecuteTransaction();

    // Hook for GAS-LESS txns (send, create)
    const { mutateAsync: signGaslessTx, isPending: isGaslessPending } =
        useSignTransaction();

    // ✅ FIX: Combine both loading states from the hooks
    const isPending = isUserPaysPending || isGaslessPending;



    // --- 1. SPONSORED: Create Profile ---
    const createProfile = async (
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) return onError("Wallet not connected");
        try {
            const keys = crypto.generateEncryptionKeypair();
            crypto.savePrivateKey(keys);

            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::suimail_contract::create_profile`,
                arguments: [
                    txb.object(REGISTRY_ID),
                    txb.pure(Array.from(keys.getPublicKey().toSuiBytes()), "vector<u8>"),
                ],
            });
            txb.setSender(account.address);

            const signedIntent = await signGaslessTx({ transaction: txb });

            const sponsorResponse = await callSponsorServer(
                signedIntent.bytes,
                signedIntent.signature,
                account.address
            );
            onSuccess(sponsorResponse.digest);
        } catch (e: any) {
            onError(e.message);
        }
    };

    // --- 2. SPONSORED: Send Message ---
    const sendMessage = async (
        recipientAddress: string,
        message: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        if (!account) return onError("Wallet not connected");
        try {
            const encryptedMessage = crypto.encryptMessage(message);
            const messageAsBytes = new TextEncoder().encode(encryptedMessage);

            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::suimail_contract::send_message`,
                arguments: [
                    txb.pure(Array.from(messageAsBytes), "vector<u8>"),
                    txb.pure.address(recipientAddress),
                ],
            });
            txb.setSender(account.address);

            const signedIntent = await signGaslessTx({ transaction: txb });

            const sponsorResponse = await callSponsorServer(
                signedIntent.bytes,
                signedIntent.signature,
                account.address
            );
            onSuccess(sponsorResponse.digest);
        } catch (e: any) {
            onError(e.message);
        }
    };

    // --- 3. USER-PAYS: Delete Message (for Storage Rebate) ---
    const deleteMessage = async (
        objectId: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        try {
            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::suimail_contract::delete`,
                arguments: [txb.object(objectId)],
            });

            const result = await signAndExecute({ transaction: txb });
            onSuccess(result.digest);
        } catch (e: any) {
            onError(e.message);
        }
    };

    // --- 4. USER-PAYS: Update Backup ---
    const updateBackup = async (
        profile: Profile,
        backupBlob: string,
        onSuccess: (digest: string) => void,
        onError: (error: string) => void
    ) => {
        try {
            const backupAsBytes = new TextEncoder().encode(backupBlob);
            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::suimail_contract::update_backup`,
                arguments: [
                    txb.object(profile.id.id),
                    txb.pure(Array.from(backupAsBytes), "vector<u8>"),
                ],
            });

            const result = await signAndExecute({ transaction: txb });
            onSuccess(result.digest);
        } catch (e: any) {
            onError(e.message);
        }
    };

    // --- HELPER: Call Sponsor Server ---
    const callSponsorServer = async (
        txKindB64: string,
        userSignature: string,
        userAddress: string
    ): Promise<{ digest: string }> => {
        // This helper logic remains unchanged
        const response = await fetch(`${SPONSOR_SERVER_URL}/sponsor-tx`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tx_kind_b64: txKindB64,
                user_signature_b64: userSignature,
                user_address: userAddress,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to sponsor transaction");
        }
        return data;
    };

    return {
        isPending, // ✅ This now correctly combines both hook states
        createProfile,
        sendMessage,
        deleteMessage,
        updateBackup,
    };
}
