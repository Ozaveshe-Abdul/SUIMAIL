// web-app/src/components/AddFriendModal.tsx
import { useState } from "react";
import {
    Button,
    Dialog,
    Flex,
    Text,
    TextField,
    IconButton,
    Box,
} from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { addFriend, isValidSuiAddress } from "../services/friendsStore.ts";

export function AddFriendModal() {
    const [address, setAddress] = useState("");
    const [alias, setAlias] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    const handleSave = () => {
        setError("");

        const trimmedAddress = address.trim();
        const trimmedAlias = alias.trim();

        if (!trimmedAddress || !trimmedAlias) {
            setError("Please fill out both fields");
            return;
        }

        if (!isValidSuiAddress(trimmedAddress)) {
            setError("Invalid Sui address format (must be 0x + 64 hex chars)");
            return;
        }

        addFriend(trimmedAddress, trimmedAlias);

        // Reset and close
        setIsOpen(false);
        setAddress("");
        setAlias("");
        setError("");
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            {/* Trigger */}
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
                    >
                        <Plus size={16} style={{ marginRight: 6 }} />
                        Add Friend
                    </Button>
                </motion.div>
            </Dialog.Trigger>

            {/* Content */}
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
                                Add New Friend
                            </Dialog.Title>
                            <Dialog.Close>
                                <IconButton size="1" variant="ghost" style={{ color: "#94a3b8" }}>
                                    <X size={18} />
                                </IconButton>
                            </Dialog.Close>
                        </Flex>

                        <Dialog.Description size="2" style={{ color: "#94a3b8" }}>
                            Enter their Sui wallet address and a local alias.
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
                                    Alias
                                </Text>
                                <TextField.Root
                                    placeholder="e.g., Alice"
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

                        {/* Buttons */}
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
                                size="2"
                                style={{
                                    background: "linear-gradient(135deg, #3b82f6, #10b981)",
                                    color: "white",
                                    fontWeight: 600,
                                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                                }}
                            >
                                Save Friend
                            </Button>
                        </Flex>
                    </Flex>
                </motion.div>
            </Dialog.Content>
        </Dialog.Root>
    );
}
