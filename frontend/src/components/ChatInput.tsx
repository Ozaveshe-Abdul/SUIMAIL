// Import necessary hooks from Radix UI themes, icons, and SUI dApp Kit
import { Box, Flex, TextField, IconButton, Text, Spinner } from "@radix-ui/themes";
import { X, Paperclip, Send } from "lucide-react";
import { GradientButton } from "./GradientButton"; // Assuming this is your custom button
import {useEffect, useRef, useState} from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {useSuiTransfer} from "../hooks/useSuiTransfer.ts";

// Define props for the component
interface ChatInputAreaProps {
    onSendMessage: (text: string, file: File | null) => Promise<void>;
    // You need to pass the recipient's address to this component now
    recipientAddress: string;
    // to clear data when a chat is changes
    channelId?: string;
}

export const ChatInputArea = ({ onSendMessage, recipientAddress, channelId }: ChatInputAreaProps) => {
    // Local state for message text and file attachments
    const [currentMessage, setCurrentMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    // General loading state for sending a normal message
    const [isSendingNormal, setIsSendingNormal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get dApp Kit hooks for account and transaction signing
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Get our custom SUI transfer hook
    // isTransferring will be true while a SUI transfer tx is processing
    const { handlePotentialTransfer, isTransferring } = useSuiTransfer();

    // Combine loading states
    const isBusy = isSendingNormal || isTransferring;

    // Add this useEffect
    useEffect(() => {
        // Reset input fields when channel changes
        setCurrentMessage("");
        setAttachedFile(null);
        setFilePreview(null);
    }, [channelId]);

    // Handle file selection from input or drop
    const handleFile = (file: File) => {
        setAttachedFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    // The main send handler
    const handleSendMessage = async () => {
        const messageText = currentMessage.trim();
        if (!messageText && !attachedFile) return;

        // 1. First, check if this is a SUI transfer command (e.g., #send@20)
        // We don't allow files with transfers for simplicity.
        if (!attachedFile) {
            const transferResult = await handlePotentialTransfer(
                messageText,
                recipientAddress,
                currentAccount,
                signAndExecute
            );

            // If it WAS a transfer command, our hook handled it.
            if (transferResult.wasTransfer) {
                setCurrentMessage("");

                // If the transfer was successful, send a notification message
                if (transferResult.success && transferResult.amount) {
                    try {
                        setIsSendingNormal(true);
                        // Send a message indicating the transfer
                        const transferMessage = `💸 Sent ${transferResult.amount} SUI`;
                        await onSendMessage(transferMessage, null);
                    } catch (error) {
                        console.error("Failed to send transfer notification:", error);
                    } finally {
                        setIsSendingNormal(false);
                    }
                }
                return;
            }
        }

        // 2. If it was NOT a transfer, proceed with sending a normal chat message.
        try {
            setIsSendingNormal(true);
            // Call the prop function provided by the parent component
            await onSendMessage(messageText, attachedFile);

            // Clear input and attachments on success
            setCurrentMessage("");
            setAttachedFile(null);
            setFilePreview(null);
        } catch (error) {
            console.error("Failed to send message:", error);
            // You might want to show a toast error here
        } finally {
            setIsSendingNormal(false);
        }
    };

    return (
        <Box
            p="3"
            style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.08)",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
        >
            {/* File Preview Area (Unchanged) */}
            {filePreview && (
                <Flex
                    gap="2"
                    align="center"
                    p="2"
                    mb="2"
                    style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                >
                    <Text size="2" style={{ color: "#e0f2fe" }}>
                        {attachedFile?.name}
                    </Text>
                    <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => {
                            setAttachedFile(null);
                            setFilePreview(null);
                        }}
                    >
                        <X size={16} />
                    </IconButton>
                </Flex>
            )}

            {/* Input Field and Buttons */}
            <Flex gap="2" align="center">
                <TextField.Root
                    placeholder="Type a message or #send@amount..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                    }}
                    style={{ flex: 1 }}
                    disabled={isBusy} // Disable input while sending
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <IconButton
                    size="3"
                    variant="soft"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy} // Disable file button while sending
                >
                    <Paperclip size={18} />
                </IconButton>
                <GradientButton onClick={handleSendMessage} disabled={isBusy}>
                    {isBusy ? <Spinner /> : <Send size={18} />}
                </GradientButton>
            </Flex>
        </Box>
    );
};
