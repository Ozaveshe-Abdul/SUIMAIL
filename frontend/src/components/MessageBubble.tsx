// web-app/src/MessageBubble.tsx
import { Box, Card, Text, IconButton, Flex } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Trash2, Download, FileText } from "lucide-react";
import { ChatEnvelopFields } from "../utilities/types.ts";
import { motion } from "framer-motion";

interface MessageBubbleProps {
    message: ChatEnvelopFields;
    onDelete: () => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
    const account = useCurrentAccount();
    const isMe = message.sender === account?.address;
    const canDelete = !isMe;

    // ────── Parse JSON payload (text + optional file) ──────
    let text = "";
    let file: { name: string; type: string; data: string } | null = null;

    try {
        // Fix TS2345: Cast to Uint8Array, then decode
        const blobAsUint8 = new Uint8Array(message.msg_blob);
        const payload = JSON.parse(new TextDecoder().decode(blobAsUint8));
        text = payload.text || "";
        file = payload.file || null;
    } catch (e) {
        text = "[Invalid payload or decryption failed]";
    }

    const timestamp = new Date(parseInt(message.timestamp)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

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
            <Flex
                direction={isMe ? "row-reverse" : "row"}
                gap="2"
                align="end"
            >
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
                        transition: "all 0.2s ease",
                    }}
                    asChild
                >
                    <motion.div
                        whileHover={isMe ? { scale: 1.02 } : undefined}
                    >
                        <Box>
                            {/* Text */}
                            {text && (
                                <Text size="2" style={{ lineHeight: 1.4 }}>
                                    {text}
                                </Text>
                            )}

                            {/* File Attachment */}
                            {file && (
                                <Box mt={text ? "2" : "0"}>
                                    {file.type.startsWith("image/") ? (
                                        <Box
                                            style={{
                                                position: "relative",
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
                                                    position: "absolute",
                                                    bottom: 6,
                                                    left: 8,
                                                    right: 8,
                                                    background: "rgba(0, 0, 0, 0.6)",
                                                    color: "white",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    fontWeight: 500,
                                                    textAlign: "center",
                                                    fontSize: "0.75rem",
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
                                                transition: "all 0.2s ease",
                                            }}
                                            onClick={() => {
                                                const link = document.createElement("a");
                                                link.href = `data:${file.type};base64,${file.data}`;
                                                link.download = file.name;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            <FileText size={20} style={{ color: "#94a3b8" }} />
                                            <Box>
                                                <Text size="2" style={{ color: "#e0f2fe" }}>
                                                    {file.name}
                                                </Text>
                                                <Text size="1" color="gray">
                                                    {(file.data.length * 0.75 / 1024).toFixed(1)} KB
                                                </Text>
                                            </Box>
                                            <Download size={16} style={{ color: "#10b981", marginLeft: "auto" }} />
                                        </Flex>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </motion.div>
                </Card>

                {/* Delete Button (only for received messages) */}
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
                                transition: "all 0.2s ease",
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
