// web-app/src/components/ConversationPreview.tsx

import { Box, Flex, Text, Avatar } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { FileText, Image, MessageCircle } from "lucide-react";
import type { StoredMessage } from "../utilities/types.ts";
import { getFriendAlias } from "../services/friendsStore.ts";

interface ConversationPreviewProps {
    conversationId: string;
    messages: StoredMessage[];
    onClick: () => void;
    isSelected?: boolean;
}

export function ConversationPreview({
                                        conversationId,
                                        messages,
                                        onClick,
                                        isSelected = false,
                                    }: ConversationPreviewProps) {
    const friendAlias = getFriendAlias(conversationId);
    const displayName =
        friendAlias || `${conversationId.substring(0, 6)}...${conversationId.slice(-4)}`;

    // Handle empty conversations (friend added but no messages yet)
    const hasMessages = messages.length > 0;
    const latestMessage = hasMessages ? messages[0] : null;

    // Extract preview text
    let previewText = "No messages yet";
    let fileType: "image" | "file" | null = null;
    let timestamp = "";

    if (latestMessage) {
        if (latestMessage.decryptedPayload) {
            const { text, file } = latestMessage.decryptedPayload;

            if (text) {
                previewText = text.length > 40 ? text.substring(0, 40) + "..." : text;
            }

            if (file) {
                fileType = file.type.startsWith("image/") ? "image" : "file";
                previewText =
                    file.name.length > 35 ? file.name.substring(0, 35) + "..." : file.name;
            }
        } else {
            previewText = "[Encrypted Message]";
        }

        // Format timestamp
        const msgTimestamp = new Date(parseInt(latestMessage.timestamp));
        const now = new Date();
        const isToday = msgTimestamp.toDateString() === now.toDateString();
        timestamp = isToday
            ? msgTimestamp.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            })
            : msgTimestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ borderRadius: "12px" }}
        >
            <Box
                onClick={onClick}
                p="3"
                style={{
                    cursor: "pointer",
                    background: isSelected
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15))"
                        : "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(12px)",
                    border: isSelected
                        ? "1px solid rgba(59, 130, 246, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                        ? "0 4px 12px rgba(59, 130, 246, 0.2)"
                        : "0 1px 4px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                        <Flex gap="3" align="center">
                            <Avatar
                                size="3"
                                fallback={displayName[0].toUpperCase()}
                                radius="full"
                                style={{
                                    background: isSelected
                                        ? "linear-gradient(135deg, #3b82f6, #10b981)"
                                        : "linear-gradient(135deg, #6b7280, #374151)",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                }}
                            />

                            <Box>
                                <Text size="3" weight="bold" style={{ color: "#e0f2fe" }}>
                                    {displayName}
                                </Text>
                                {friendAlias && (
                                    <Text
                                        size="1"
                                        color="gray"
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: "0.7rem",
                                            opacity: 0.7,
                                        }}
                                    >
                                        {conversationId.substring(0, 6)}...{conversationId.slice(-4)}
                                    </Text>
                                )}
                            </Box>
                        </Flex>

                        {timestamp && (
                            <Text size="1" color="gray" style={{ opacity: 0.8 }}>
                                {timestamp}
                            </Text>
                        )}
                    </Flex>

                    <Flex gap="2" align="center" style={{ paddingLeft: "48px" }}>
                        {!hasMessages && (
                            <MessageCircle size={14} style={{ color: "#94a3b8", opacity: 0.5 }} />
                        )}
                        {fileType === "image" && (
                            <Image size={14} style={{ color: "#10b981" }} />
                        )}
                        {fileType === "file" && (
                            <FileText size={14} style={{ color: "#94a3b8" }} />
                        )}
                        <Text
                            size="2"
                            color="gray"
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                opacity: hasMessages ? 0.9 : 0.6,
                                fontSize: "0.85rem",
                                fontStyle: hasMessages ? "normal" : "italic",
                            }}
                        >
                            {previewText}
                        </Text>
                    </Flex>
                </Flex>
            </Box>
        </motion.div>
    );
}
