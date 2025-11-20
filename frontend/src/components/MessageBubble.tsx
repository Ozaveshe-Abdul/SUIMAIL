// web-app/src/components/MessageBubble.tsx

import { Box, Card, Text, IconButton, Flex } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Trash2, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { StoredMessage } from "../utilities/types.ts";

interface MessageBubbleProps {
    message: StoredMessage;
    onDelete: () => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
    const account = useCurrentAccount();
    const isMe = message.sender === account?.address;
    const canDelete = !isMe; // Only receiver can delete for rebate

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
                marginBottom: "8px",
            }}
        >
            <Flex direction={isMe ? "row-reverse" : "row"} gap="2" align="end">
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
                    }}
                >
                    <Box>
                        {text && (
                            <Text size="2" style={{ lineHeight: 1.4 }}>
                                {text}
                            </Text>
                        )}

                        {file && (
                            <Box mt={text ? "2" : "0"}>
                                {file.type.startsWith("image/") ? (
                                    <Box
                                        style={{
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                            maxWidth: 240,
                                            marginTop: "4px",
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
                                        <Text
                                            size="1"
                                            style={{
                                                marginTop: "4px",
                                                opacity: 0.8,
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Flex
                                        align="center"
                                        gap="2"
                                        p="2"
                                        style={{
                                            background: "rgba(255, 255, 255, 0.1)",
                                            borderRadius: "8px",
                                            border: "1px dashed rgba(255, 255, 255, 0.3)",
                                            cursor: "pointer",
                                        }}
                                        onClick={handleFileDownload}
                                    >
                                        <FileText size={20} style={{ color: "#94a3b8" }} />
                                        <Box>
                                            <Text size="2" style={{ color: "#e0f2fe" }}>
                                                {file.name}
                                            </Text>
                                            <Text size="1" color="gray">
                                                {((file.data.length * 0.75) / 1024).toFixed(1)} KB
                                            </Text>
                                        </Box>
                                        <Download
                                            size={16}
                                            style={{ color: "#10b981", marginLeft: "auto" }}
                                        />
                                    </Flex>
                                )}
                            </Box>
                        )}
                    </Box>
                </Card>

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

                <Text
                    size="1"
                    color="gray"
                    style={{
                        fontSize: "0.7rem",
                        opacity: 0.7,
                        minWidth: "50px",
                        textAlign: isMe ? "right" : "left",
                        marginBottom: "2px",
                    }}
                >
                    {timestamp}
                </Text>
            </Flex>
        </motion.div>
    );
}
