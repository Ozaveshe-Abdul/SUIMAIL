import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
// import { useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';

// Helper to convert SUI amount to MIST (1 SUI = 10^9 MIST)
const SUI_TO_MIST = 1_000_000_000n;

interface UseSuiTransferResult {
    handlePotentialTransfer: (
        messageText: string,
        recipientAddress: string,
        signerAccount: any, // The account from useCurrentAccount()
        signAndExecute: any // The function from useSignAndExecuteTransaction()
    ) => Promise<boolean>; // Returns true if a transfer was handled, false if not
    isTransferring: boolean;
}

export const useSuiTransfer = (): UseSuiTransferResult => {
    const [isTransferring, setIsTransferring] = useState(false);
    // const suiClient = useSuiClient();

    /**
     * Checks a message for the transfer command (#send@AMOUNT) and executes it if found.
     */
    const handlePotentialTransfer = async (
        messageText: string,
        recipientAddress: string,
        signerAccount: any,
        signAndExecute: any
    ): Promise<boolean> => {
        // 1. Regex to find the command.
        // It looks for "#send@" followed by digits, with optional decimals.
        // Capturing group 1 is the amount.
        const transferRegex = /^#send@(\d+(\.\d+)?)$/;
        const match = messageText.trim().match(transferRegex);

        // If no match, return false so the normal message handler can proceed.
        if (!match || !match[1]) {
            return false;
        }

        if (!signerAccount) {
            toast.error("You must be connected to send SUI.");
            return true; // Handled, even if failed
        }

        const amountSuiStr = match[1];

        try {
            setIsTransferring(true);
            toast.loading(`Processing transfer of ${amountSuiStr} SUI...`, { id: 'transfer-toast' });

            // 2. Convert amount to MIST.
            // Handle potential decimal inputs (e.g., 0.5 SUI).
            let amountMist: bigint;
            if (amountSuiStr.includes('.')) {
                const [whole, fraction] = amountSuiStr.split('.');
                const fractionPadded = fraction.padEnd(9, '0').slice(0, 9);
                amountMist = BigInt(whole) * SUI_TO_MIST + BigInt(fractionPadded);
            } else {
                amountMist = BigInt(amountSuiStr) * SUI_TO_MIST;
            }

            if (amountMist === 0n) {
                throw new Error("Amount must be greater than 0.");
            }

            // 3. Build the Programmable Transaction Block (PTB)
            const tx = new Transaction();

            // A. Split the gas coin to get the exact amount we want to send.
            // This is the standard way to handle SUI payments.
            const [coinToSend] = tx.splitCoins(tx.gas, [amountMist]);

            // B. Transfer that newly created coin to the recipient.
            tx.transferObjects([coinToSend], recipientAddress);

            // 4. Sign and Execute the transaction.
            // We use the dApp Kit's execute function.
            await signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result: any) => {
                        console.log('Transfer successful:', result);
                        toast.success(`Successfully sent ${amountSuiStr} SUI!`, { id: 'transfer-toast' });
                        // Here you would typically send a "system message" to the chat
                        // so the other user sees it immediately.
                    },
                    onError: (error: any) => {
                        console.error('Transfer failed:', error);
                        // Extract error message from the raw error object if possible
                        let errorMessage = "Transfer failed. Please try again.";
                        if (error?.message?.includes("InsufficientCoinBalance")) {
                            errorMessage = "Insufficient SUI balance for this transfer.";
                        }
                        toast.error(errorMessage, { id: 'transfer-toast' });
                    },
                }
            );

        } catch (error: any) {
            console.error("Transfer logic error:", error);
            toast.error(`Error: ${error.message}`, { id: 'transfer-toast' });
        } finally {
            setIsTransferring(false);
        }

        // Return true to indicate we handled this message as a transfer.
        return true;
    };

    return { handlePotentialTransfer, isTransferring };
};
