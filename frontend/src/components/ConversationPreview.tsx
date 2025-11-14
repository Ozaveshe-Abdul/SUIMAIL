// web-app/src/components/ConversationPreview.tsx
import { Box, Flex, Text, Avatar } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { FileText, Image } from "lucide-react";
import { ChatEnvelopFields } from "../utilities/types.ts";
import { loadFriendsList } from "../utilities/store.ts";

interface ConversationPreviewProps {
    messages: ChatEnvelopFields[];
    onClick: () => void;
    isSelected?: boolean;
}

function getFriendAlias(sender: string): string | null {
    const friends = loadFriendsList();
    return friends[sender] || null;
}

export function ConversationPreview({
                                        messages,
                                        onClick,
                                        isSelected = false,
                                    }: ConversationPreviewProps) {
    if (messages.length === 0) return null;

    const latestMessage = messages[0];
    const sender = latestMessage.sender;

    const friendAlias = getFriendAlias(sender);
    const displayName = friendAlias || `${sender.substring(0, 6)}...${sender.slice(-4)}`;

    // ────── Decode message preview safely ──────
    let previewText = "[Encrypted Message]";
    let fileType: "image" | "file" | null = null;

    try {
        const payload = JSON.parse(
            new TextDecoder().decode(Uint8Array.from(latestMessage.msg_blob))
        );

        if (payload.text) {
            previewText = payload.text.length > 40
                ? payload.text.substring(0, 40) + "..."
                : payload.text;
        }

        if (payload.file) {
            fileType = payload.file.type.startsWith("image/") ? "image" : "file";
            const name = payload.file.name;
            previewText = name.length > 35 ? name.substring(0, 35) + "..." : name;
        }
    } catch (e) {
        console.error("Failed to decode preview:", e);
    }

    // ────── Format timestamp ──────
    const timestamp = new Date(parseInt(latestMessage.timestamp));
    const now = new Date();
    const isToday = timestamp.toDateString() === now.toDateString();
    const timeStr = isToday
        ? timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.transform = "translateY(0)";
                    }
                }}
            >
                <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                        <Flex gap="3" align="center">
                            {/* Gradient Avatar */}
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
                                        {sender.substring(0, 6)}...{sender.slice(-4)}
                                    </Text>
                                )}
                            </Box>
                        </Flex>

                        <Text size="1" color="gray" style={{ opacity: 0.8 }}>
                            {timeStr}
                        </Text>
                    </Flex>

                    {/* Preview */}
                    <Flex gap="2" align="center" style={{ paddingLeft: "48px" }}>
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
                                opacity: 0.9,
                                fontSize: "0.85rem",
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
