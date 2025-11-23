import { useState } from "react";
import {
    Button,
    Dialog,
    Flex,
    Text,
    TextArea,
    TextField,
    IconButton,
    Box,
    Spinner,
} from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Users, X } from "lucide-react";
import {addFriend, isValidSuiAddress} from "../services/friendsStore.ts";
import { useSuiMailMessenger } from "../hooks/useSuiMailMessenger.ts";
import {useCurrentAccount} from "@mysten/dapp-kit";

export function CreateGroupModal() {
    const [addresses, setAddresses] = useState("");
    const [groupAlias, setGroupAlias] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { createChannel } = useSuiMailMessenger();
    const connectedAccount = useCurrentAccount()

    const handleSave = async () => {
        setError("");
        const memberList = addresses
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a.length > 0);

        if (memberList.length === 0) {
            setError("Please enter at least one address");
            return;
        }

        const invalid = memberList.find((addr) => !isValidSuiAddress(addr));
        if (invalid) {
            setError(`Invalid address: ${invalid}`);
            return;
        }

        if (!groupAlias.trim()) {
            setError("Please enter a group name");
            return;
        }

        setIsCreating(true);
        try {
            const id = await createChannel(memberList);
            // TODO: Save groupAlias + memberList locally or on-chain
            addFriend(connectedAccount!!.address, id.channelId, groupAlias)
            setIsOpen(false);
            setAddresses("");
            setGroupAlias("");
            setError("");
        } catch (error: any) {
            alert("Group creation failed: " + error.message);
            console.error(error);
        } finally {
            setIsCreating(false);
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
                    >
                        {isCreating ? (
                            <Spinner />
                        ) : (
                            <>
                                <Users size={16} style={{ marginRight: 6 }} />
                                Create Group
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
                    maxWidth: 520,
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
                                Create New Group
                            </Dialog.Title>
                            <Dialog.Close>
                                <IconButton size="1" variant="ghost" style={{ color: "#94a3b8" }}>
                                    <X size={18} />
                                </IconButton>
                            </Dialog.Close>
                        </Flex>

                        <Dialog.Description size="2" style={{ color: "#94a3b8" }}>
                            Add multiple Sui addresses (comma-separated) and give your group a name.
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
                                    Group Name
                                </Text>
                                <TextField.Root
                                    placeholder="e.g., Crypto Bros"
                                    value={groupAlias}
                                    onChange={(e) => setGroupAlias(e.target.value)}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                    }}
                                />
                            </Box>

                            <Box>
                                <Text as="div" size="2" weight="bold" mb="1" style={{ color: "#e0f2fe" }}>
                                    Member Addresses (comma separated)
                                </Text>
                                <TextArea
                                    placeholder="0x1234..., 0x5678..., 0x9abc..."
                                    value={addresses}
                                    onChange={(e) => setAddresses(e.target.value)}
                                    style={{
                                        height: 120,
                                        background: "rgba(255, 255, 255, 0.1)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                        fontFamily: "monospace",
                                        resize: "none",
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
                                disabled={isCreating}
                                size="2"
                                style={{
                                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                                    color: "white",
                                    fontWeight: 600,
                                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                                }}
                            >
                                {isCreating ? <Spinner /> : "Create Group"}
                            </Button>
                        </Flex>
                    </Flex>
                </motion.div>
            </Dialog.Content>
        </Dialog.Root>
    );
}
