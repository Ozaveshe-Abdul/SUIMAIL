// web-app/src/components/MessageBubble.tsx

import { Box, Card, Text, IconButton, Flex, Avatar } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Trash2, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { StoredMessage } from "../utilities/types.ts";

interface MessageBubbleProps {
    message: StoredMessage;
    onDelete: () => void;
    showSender?: boolean;        // ← NEW: show name + avatar
    senderAlias: string | null;        // ← Optional: display name (from friends list)
    isConsecutive?: boolean;     // ← For message grouping (same sender = no avatar/name)
}

export function MessageBubble({
                                  message,
                                  onDelete,
                                  showSender = false,
                                  senderAlias,
                                  isConsecutive = false,
                              }: MessageBubbleProps) {
    const account = useCurrentAccount();
    const isMe = message.sender === account?.address;

    // Only allow deletion if it's NOT your message (rebate logic)
    const canDelete = !isMe;

    const payload = message.decryptedPayload;
    const text = payload?.text || "[Decryption Failed]";
    const file = payload?.file || null;

    const timestamp = new Date(parseInt(message.timestamp)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handleFileDownload = () => {
        if (!file) return;
        const link = document.createElement("a");
        link.href = `data:${file.type};base64,${file.data}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                maxWidth: "75%",
                marginBottom: isConsecutive ? "4px" : "12px",
            }}
        >
            {/* Sender Name (only in group + not consecutive) */}
            {showSender && !isConsecutive && !isMe && (
                <Text
                    size="1"
                    weight="medium"
                    style={{
                        color: "#94a3b8",
                        marginLeft: "48px",
                        marginBottom: "2px",
                        opacity: 0.9,
                    }}
                >
                    {senderAlias || message.sender.slice(0, 8) + "..."}
                </Text>
            )}

            <Flex direction={isMe ? "row-reverse" : "row"} gap="2" align="end">
                {/* Avatar (only in group, not consecutive, not me) */}
                {showSender && !isConsecutive && !isMe && (
                    <Avatar
                        size="2"
                        fallback={message.sender[6] || "?"}
                        style={{
                            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                            color: "white",
                            fontWeight: "bold",
                        }}
                    />
                )}

                {/* Optional spacer when avatar is hidden */}
                {showSender && !isConsecutive && isMe && <Box width="32px" height="32px" />}

                {/* Message Card */}
                <Card
                    style={{
                        background: isMe
                            ? "linear-gradient(135deg, #3b82f6, #10b981)"
                            : "rgba(255, 255, 255, 0.12)",
                        backdropFilter: isMe ? "none" : "blur(10px)",
                        border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.15)",
                        color: isMe ? "white" : "#e0f2fe",
                        borderRadius: "16px",
                        padding: "12px 16px",
                        maxWidth: "100%",
                        boxShadow: isMe
                            ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                            : "0 2px 8px rgba(0, 0, 0, 0.1)",
                        borderBottomLeftRadius: showSender && !isConsecutive && !isMe ? "4px" : "16px",
                        borderTopLeftRadius: showSender && !isConsecutive && !isMe ? "16px" : "16px",
                    }}
                >
                    <Box>
                        {text && (
                            <Text size="2" style={{ lineHeight: 1.5 }}>
                                {text}
                            </Text>
                        )}

                        {file && (
                            <Box mt={text ? "3" : "0"}>
                                {file.type.startsWith("image/") ? (
                                    <Box
                                        style={{
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                            maxWidth: 260,
                                            marginTop: "6px",
                                        }}
                                    >
                                        <img
                                            src={`data:${file.type};base64,${file.data}`}
                                            alt={file.name}
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                display: "block",
                                                borderRadius: "12px",
                                            }}
                                        />
                                        <Text size="1" style={{ marginTop: "4px", opacity: 0.8 }}>
                                            {file.name}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Flex
                                        align="center"
                                        gap="3"
                                        p="3"
                                        style={{
                                            background: "rgba(255, 255, 255, 0.1)",
                                            borderRadius: "10px",
                                            border: "1px dashed rgba(255, 255, 255, 0.3)",
                                            cursor: "pointer",
                                        }}
                                        onClick={handleFileDownload}
                                    >
                                        <FileText size={22} style={{ color: "#94a3b8" }} />
                                        <Box>
                                            <Text size="2" style={{ color: "#e0f2fe" }}>
                                                {file.name}
                                            </Text>
                                            <Text size="1" color="gray">
                                                {((file.data.length * 0.75) / 1024).toFixed(1)} KB
                                            </Text>
                                        </Box>
                                        <Download size={18} style={{ color: "#10b981", marginLeft: "auto" }} />
                                    </Flex>
                                )}
                            </Box>
                        )}
                    </Box>
                </Card>

                {/* Delete Button (only for others) */}
                {canDelete && (
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <IconButton
                            size="1"
                            variant="ghost"
                            onClick={onDelete}
                            style={{
                                color: "#f87171",
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "50%",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(248, 113, 113, 0.3)",
                            }}
                            title="Delete & Claim SUI Rebate"
                        >
                            <Trash2 size={14} />
                        </IconButton>
                    </motion.div>
                )}

                {/* Timestamp */}
                <Text
                    size="1"
                    style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        opacity: 0.7,
                        minWidth: "50px",
                        textAlign: isMe ? "right" : "left",
                        marginTop: "2px",
                    }}
                >
                    {timestamp}
                </Text>
            </Flex>
        </motion.div>
    );
}
