import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

interface TransferResult {
    wasTransfer: boolean;
    success: boolean;
    amount?: number;
}

export const useSuiTransfer = () => {
    const [isTransferring, setIsTransferring] = useState(false);

    /**
     * Check if message is a transfer command like #send@20
     * If yes, execute the transfer and return result info
     */
    const handlePotentialTransfer = async (
        messageText: string,
        recipientAddress: string,
        currentAccount: any,
        signAndExecute: any
    ): Promise<TransferResult> => {
        // Parse the transfer command: #send@<amount>
        const transferRegex = /^#send@(\d+(?:\.\d+)?)$/i;
        const match = messageText.match(transferRegex);

        if (!match) {
            return { wasTransfer: false, success: false };
        }

        // It IS a transfer command
        const amount = parseFloat(match[1]);

        if (!currentAccount?.address) {
            toast.error("No wallet connected");
            return { wasTransfer: true, success: false, amount };
        }

        if (!recipientAddress || recipientAddress === "Unknown") {
            toast.error("Invalid recipient address");
            return { wasTransfer: true, success: false, amount };
        }

        setIsTransferring(true);

        // Show initial processing toast
        toast.loading(`Processing transfer of ${amount} SUI...`, {
            id: 'transfer-toast'
        });

        try {
            // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
            const amountInMist = Math.floor(amount * 1_000_000_000);

            // Create the transaction
            const tx = new Transaction();
            const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
            tx.transferObjects([coin], recipientAddress);

            // Execute the transaction
            await new Promise<void>((resolve, reject) => {
                signAndExecute(
                    {
                        transaction: tx,
                    },
                    {
                        onSuccess: () => {
                            // Dismiss loading toast and show success
                            toast.success(`Successfully sent ${amount} SUI!`, {
                                id: 'transfer-toast'
                            });
                            resolve();
                        },
                        onError: (error: Error) => {
                            console.error("Transfer failed:", error);
                            // Dismiss loading toast and show error
                            toast.error("Transfer failed: " + error.message, {
                                id: 'transfer-toast'
                            });
                            reject(error);
                        },
                    }
                );
            });

            setIsTransferring(false);
            return { wasTransfer: true, success: true, amount };
        } catch (error) {
            console.error("Transfer error:", error);
            // Dismiss loading toast and show error
            toast.error("Transfer failed", {
                id: 'transfer-toast'
            });
            setIsTransferring(false);
            return { wasTransfer: true, success: false, amount };
        }
    };

    return {
        handlePotentialTransfer,
        isTransferring,
    };
};
