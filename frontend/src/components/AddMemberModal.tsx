import { useState, useEffect } from "react";
import {
    Button,
    Dialog,
    Flex,
    Text,
    TextField,
    IconButton,
    Box,
    Spinner,
} from "@radix-ui/themes";
import { motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import {addFriend, isValidSuiAddress} from "../services/friendsStore.ts";
import { useSuiMailMessenger } from "../hooks/useSuiMailMessenger.ts";
import {useCurrentAccount} from "@mysten/dapp-kit";

interface AddMemberModalProps {
    channelId: string;
}

export function AddMemberModal({ channelId}: AddMemberModalProps) {
    const [address, setAddress] = useState("");
    const [alias, setAlias] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const { addMembers } = useSuiMailMessenger();
    const connectedAccount = useCurrentAccount()

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setAddress("");
            setAlias("");
            setError("");
        }
    }, [isOpen]);

    const handleSave = async () => {
        setError("");

        const trimmedAddress = address.trim();
        const trimmedAlias = alias.trim();

        if (!trimmedAddress) {
            setError("Please enter a Sui address");
            return;
        }

        if (!isValidSuiAddress(trimmedAddress)) {
            setError("Invalid Sui address format (must be 0x + 64 hex chars)");
            return;
        }

        setIsAdding(true);
        try {
            await addMembers(channelId, [trimmedAddress]);

            // Optionally save alias locally if your friendsStore supports it
            // addFriendToGroupLocally(channelId, trimmedAddress, trimmedAlias);

            addFriend(connectedAccount!!.address, trimmedAddress, trimmedAlias)
            // onSuccess?.();

            // Close and reset
            setIsOpen(false);
        } catch (error: any) {
            const msg = error?.message || String(error);
            console.error("Failed to add member:", msg);
            setError("Failed to add member: " + msg);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            {/* Trigger Button */}
            <Dialog.Trigger>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        variant="soft"
                        size="2"
                        style={{
                            background: "rgba(255, 255, 255, 0.15)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "white",
                            fontWeight: 600,
                        }}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <Spinner />
                        ) : (
                            <>
                                <UserPlus size={16} style={{ marginRight: 6 }} />
                                Add Member
                            </>
                        )}
                    </Button>
                </motion.div>
            </Dialog.Trigger>

            {/* Modal Content */}
            <Dialog.Content
                style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    maxWidth: 480,
                    width: "90vw",
                    background: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <Flex direction="column" gap="4">
                        {/* Header */}
                        <Flex justify="between" align="center">
                            <Dialog.Title style={{ color: "#e0f2fe", fontWeight: 700 }}>
                                Add Group Member
                            </Dialog.Title>
                            <Dialog.Close>
                                <IconButton size="1" variant="ghost" style={{ color: "#94a3b8" }}>
                                    <X size={18} />
                                </IconButton>
                            </Dialog.Close>
                        </Flex>

                        <Dialog.Description size="2" style={{ color: "#94a3b8" }}>
                            Enter their Sui address and optionally give them a display name (alias).
                        </Dialog.Description>

                        {error && (
                            <Text size="2" style={{ color: "#ef4444" }}>
                                {error}
                            </Text>
                        )}

                        {/* Form Fields */}
                        <Flex direction="column" gap="4">
                            <Box>
                                <Text as="div" size="2" weight="bold" mb="1" style={{ color: "#e0f2fe" }}>
                                    Alias (optional)
                                </Text>
                                <TextField.Root
                                    placeholder="e.g., John"
                                    value={alias}
                                    onChange={(e) => setAlias(e.target.value)}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                    }}
                                />
                            </Box>

                            <Box>
                                <Text as="div" size="2" weight="bold" mb="1" style={{ color: "#e0f2fe" }}>
                                    Sui Address
                                </Text>
                                <TextField.Root
                                    placeholder="0x..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                        fontFamily: "monospace",
                                    }}
                                />
                            </Box>
                        </Flex>

                        {/* Action Buttons */}
                        <Flex gap="3" mt="2" justify="end">
                            <Dialog.Close>
                                <Button
                                    variant="soft"
                                    size="2"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        color: "#94a3b8",
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Dialog.Close>

                            <Button
                                onClick={handleSave}
                                disabled={isAdding}
                                size="2"
                                style={{
                                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                                    color: "white",
                                    fontWeight: 600,
                                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                                }}
                            >
                                {isAdding ? <Spinner /> : "Add Member"}
                            </Button>
                        </Flex>
                    </Flex>
                </motion.div>
            </Dialog.Content>
        </Dialog.Root>
    );
}
