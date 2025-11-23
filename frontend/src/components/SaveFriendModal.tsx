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
import {Edit, UserPlus, X} from "lucide-react";
import {addFriend, editFriendAlias} from "../services/friendsStore.ts";

interface SaveFriendModalProps {
    friendAddress: string;
    userAddress: string;
    isFriend: boolean;
}

export function SaveFriendModal({ friendAddress, userAddress , isFriend}: SaveFriendModalProps) {
    const [alias, setAlias] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    const handleSave = () => {
        setError("");
        const trimmedAlias = alias.trim();

        if (!trimmedAlias) {
            setError("Please enter an alias");
            return;
        }

        try {
            addFriend(userAddress, friendAddress, trimmedAlias);
            setIsOpen(false);
            setAlias("");
        } catch (e) {
            console.error(e);
            setError("Failed to save friend");
        }
    };

    const handleEdit = () => {
        setError("");
        const trimmedAlias = alias.trim();

        if (!trimmedAlias) {
            setError("Please enter an alias");
            return;
        }

        try {
            editFriendAlias(userAddress, friendAddress, trimmedAlias);
            setIsOpen(false);
            setAlias("");
        } catch (e) {
            console.error(e);
            setError("Failed to save friend");
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            {/* Trigger Button */}
            <Dialog.Trigger>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    {isFriend ? (
                        <Button
                            size="1"
                            variant="soft"
                            color="teal"
                            style={{ cursor: 'pointer' }}
                        >
                             Rename
                             <Edit size={14} style={{ marginRight: 4 }} />
                        </Button>

                    ) :(
                        <Button
                            size="1"
                            variant="soft"
                            color="teal"
                            style={{ cursor: 'pointer' }}
                        >
                             <UserPlus size={14} style={{ marginRight: 4 }} />
                            "Save Friend"
                        </Button>

                        )
                    }
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
                                Save Contact
                            </Dialog.Title>
                            <Dialog.Close>
                                <IconButton size="1" variant="ghost" style={{ color: "#94a3b8" }}>
                                    <X size={18} />
                                </IconButton>
                            </Dialog.Close>
                        </Flex>

                        <Dialog.Description size="2" style={{ color: "#94a3b8" }}>
                            Save this address to your friends list for easy access.
                        </Dialog.Description>

                        {error && (
                            <Text size="2" style={{ color: "#ef4444" }}>
                                {error}
                            </Text>
                        )}

                        {/* Form Fields */}
                        <Flex direction="column" gap="4">
                            {/* Read-only Address Field */}
                            <Box>
                                <Text as="div" size="2" weight="bold" mb="1" style={{ color: "#e0f2fe" }}>
                                    Wallet Address
                                </Text>
                                <TextField.Root
                                    value={friendAddress}
                                    readOnly
                                    variant="soft"
                                    color="gray"
                                    style={{
                                        background: "rgba(0, 0, 0, 0.2)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        color: "#94a3b8",
                                        fontFamily: "monospace",
                                        opacity: 0.8,
                                        cursor: "not-allowed"
                                    }}
                                />
                            </Box>

                            {/* Alias Input */}
                            <Box>
                                <Text as="div" size="2" weight="bold" mb="1" style={{ color: "#e0f2fe" }}>
                                    Assign Alias
                                </Text>
                                <TextField.Root
                                    placeholder="e.g., Bob form Work"
                                    value={alias}
                                    onChange={(e) => setAlias(e.target.value)}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                    }}
                                />
                            </Box>
                        </Flex>

                        {/* Buttons */}
                        <Flex gap="3" mt="4" justify="end">
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
                                onClick={isFriend ? handleEdit : handleSave}
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
