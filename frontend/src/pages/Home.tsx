import { useCurrentAccount } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { useEffect, useState, useRef } from "react";
import Logout from "../components/LogoutButton.tsx";
import { Box, Flex, Heading, TextField, Spinner, IconButton, Text } from "@radix-ui/themes";
import { AnimatePresence } from "framer-motion";
import { Paperclip, Send, X } from "lucide-react";

// Hooks and Services
import { useSuiMailMessenger } from "../hooks/useSuiMailMessenger";
import { getFriendAlias } from "../services/friendsStore.ts";

// Components
import { GradientButton } from "../components/GradientButton.tsx";
import { AddFriendModal } from "../components/AddFriendModal.tsx";
import { ConversationPreview } from "../components/ConversationPreview.tsx";
import { MessageBubble } from "../components/MessageBubble.tsx";
import { StyledConnectButton } from "../components/s.tsx";
import { LoginScreen } from "./LoginScreen.tsx";
import {useFriends} from "../hooks/useFriends.ts";

// Data Structure to match your UI needs
type ChannelData = {
    channelId: string;
    memberCapId: string;
    channelObject: any; // Stores the full SDK object (needed for encryption keys)
    friendAddress: string;
    lastMessage: any | null;
};

export function Home() {
    const account = useCurrentAccount();

    const {
        isReady,
        sendMessage,
        getMessages,
        getMyChannels,
        getChannelObjects,
        getChannelMembers // New function to find who is in the chat
    } = useSuiMailMessenger();

    // State
    const [channels, setChannels] = useState<ChannelData[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Input State
    const [currentMessage, setCurrentMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const friendsList = useFriends();
    // ------------------------------------------------------------------
    // 1. LOAD CHANNELS
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!isReady || !account) {
            setChannels([])
            setSelectedChannelId(null)
            setCurrentMessages([])
            setIsLoadingMessages(false)
            setIsSending(false)

            return
        };

        const loadChannels = async () => {
            try {
                console.log("load channels");
                console.log(account.address);
                // A. Get Memberships (To get IDs and MemberCaps)
                const memberships = await getMyChannels();
                if (!memberships || memberships.length === 0) {
                    setChannels([]);
                    return;
                }

                const channelIds = memberships.map((m: any) => m.channel_id); // Note: SDK uses snake_case 'channel_id' in some responses

                // B. Get Full Objects (To get keys and metadata)
                const channelObjects = await getChannelObjects(channelIds);

                // C. Process and Merge
                const formattedChannels: ChannelData[] = [];

                for (const mem of memberships) {
                    const obj = channelObjects.find((o: any) => o.id.id === mem.channel_id);
                    if (!obj) continue;

                    // D. FIND FRIEND ADDRESS
                    // The SDK 'DecryptedChannelObject' might not list members directly.
                    // We fetch them explicitly to be safe.
                    let otherMember = "Unknown";
                    try {
                        const membersData = await getChannelMembers(mem.channel_id);
                        const found = membersData.find((m: any) => m.memberAddress !== account.address);
                        if (found) otherMember = found.memberAddress;
                    } catch (e) {
                        console.warn("Could not fetch members for channel", mem.channel_id);
                    }

                    formattedChannels.push({
                        channelId: mem.channel_id,
                        memberCapId: mem.member_cap_id,
                        channelObject: obj, // Store full object for sendMessage
                        friendAddress: otherMember,
                        lastMessage: obj.last_message // SDK returns 'last_message'
                    });
                }

                setChannels(formattedChannels);
            } catch (e) {
                console.error("Failed to load channels", e);
            }
        };

        loadChannels();
        const interval = setInterval(loadChannels, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [isReady, account, getMyChannels, getChannelObjects, getChannelMembers]);

    // ------------------------------------------------------------------
    // 2. LOAD MESSAGES
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!selectedChannelId || !isReady) return;

        const fetchMessages = async () => {
            if (currentMessages.length === 0) setIsLoadingMessages(true);

            try {
                const msgs = await getMessages(selectedChannelId, 50);

                // This works with flex-direction: column-reverse to put the newest at the bottom
                const sortedMsgs = msgs.sort((a: any, b: any) =>
                    Number(b.createdAtMs) - Number(a.createdAtMs)
                );
                // Process Attachments (Lazy Loading)
                // We must resolve the promises for any attachments
                const processedMsgs = await Promise.all(sortedMsgs.map(async (msg: any) => {
                    if (msg.attachments && msg.attachments.length > 0) {
                        // Resolve the data promise for the UI
                        const resolvedAttachments = await Promise.all(msg.attachments.map(async (att: any) => {
                            const data = await att.data; // AWAIT THE PROMISE
                            const blob = new Blob([data], { type: att.mimeType });
                            const url = URL.createObjectURL(blob);
                            return { ...att, url }; // Add URL for <img> tag
                        }));
                        return { ...msg, attachments: resolvedAttachments };
                    }
                    return msg;
                }));

                setCurrentMessages(processedMsgs);
            } catch (e) {
                console.error("Error fetching messages", e);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [selectedChannelId, isReady, getMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages]);

    // ------------------------------------------------------------------
    // 3. SEND MESSAGE
    // ------------------------------------------------------------------
    const handleSendMessage = async () => {
        if (!selectedChannelId || (!currentMessage.trim() && !attachedFile)) return;

        const targetChannel = channels.find(c => c.channelId === selectedChannelId);
        if (!targetChannel) return;

        setIsSending(true);
        try {
            const attachments = attachedFile ? [attachedFile] : undefined;

            // Pass the full channelObject so the hook can extract 'encryption_key_history'
            await sendMessage(
                targetChannel.channelId,
                targetChannel.memberCapId,
                currentMessage,
                targetChannel.channelObject,
                attachments
            );

            setCurrentMessage("");
            setAttachedFile(null);
            setFilePreview(null);

            // Quick Refresh
            const msgs = await getMessages(selectedChannelId, 50);
            setCurrentMessages(msgs);
        } catch (error) {
            alert("Send failed: " + error);
        } finally {
            setIsSending(false);
        }
    };

    // ... (Input handlers like handleFileDrop remain the same)
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleFile = (file: File) => {
        setAttachedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    // ... (Render Logic helpers)
    const activeChannel = channels.find(c => c.channelId === selectedChannelId);
    const getHeaderTitle = () => {
        if (!activeChannel) return "Chat";
        // const alias = friendsList[activeChannel.friendAddress];
        // return alias || `${activeChannel.friendAddress.slice(0, 6)}...${activeChannel.friendAddress.slice(-4)}`;
        const alias = getFriendAlias(activeChannel.friendAddress);
        return alias || `${activeChannel.friendAddress.slice(0, 6)}...${activeChannel.friendAddress.slice(-4)}`;
    };

    if (!account) return <LoginScreen />;

    if (!isReady) {
        return (
            <Box style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
                <Flex direction="column" align="center" gap="3">
                    <Spinner size="3" />
                    <Text color="gray">Initializing Secure Client...</Text>
                </Flex>
            </Box>
        );
    }

    return (
        <Flex style={{ height: "100vh", background: "linear-gradient(135deg, #1e3a8a, #065f46)" }}>
            {/* SIDEBAR */}
            <Box style={{ width: "320px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                <Flex p="4" justify="between" align="center" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                    <Heading size="5" style={{ background: "linear-gradient(135deg, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Inbox
                    </Heading>
                    <Flex gap="2">
                        <AddFriendModal />
                        {/*<Logout />*/}
                    </Flex>
                </Flex>

                <Box p="2" style={{ overflowY: "auto", maxHeight: "calc(100vh - 80px)" }}>
                    <Flex direction="column" gap="2">
                        {channels.map((channel) => (
                            <ConversationPreview
                                key={channel.channelId}
                                conversationId={channel.friendAddress}
                                // Ensure lastMessage is formatted as ConversationPreview expects
                                messages={channel.lastMessage ? [{
                                    id: { id: "latest" },
                                    timestamp: channel.lastMessage.createdAtMs,
                                    decryptedPayload: {
                                        text: channel.lastMessage.text,
                                        file: channel.lastMessage.attachments?.[0] ? {
                                            name: channel.lastMessage.attachments[0].fileName,
                                            type: channel.lastMessage.attachments[0].mimeType
                                        } : null
                                    }
                                }] as any : []}
                                onClick={() => setSelectedChannelId(channel.channelId)}
                                isSelected={selectedChannelId === channel.channelId}
                            />
                        ))}
                    </Flex>
                </Box>
                <Box style={{ position: "absolute", bottom: 16, left: 16 }}>
                    {/*<StyledConnectButton />*/}
                    <Logout />
                </Box>
            </Box>

            {/* CHAT AREA */}
            <Flex direction="column" style={{ flex: 1 }}>
                {!selectedChannelId ? (
                    <Flex align="center" justify="center" style={{ height: "100%", color: "rgba(255,255,255,0.6)" }}>
                        <Text size="5">Select a chat to start messaging</Text>
                    </Flex>
                ) : (
                    <Flex direction="column" style={{ height: "100%" }}>
                        <Box p="4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                            <Heading size="4" style={{ color: "#e0f2fe" }}>{getHeaderTitle()}</Heading>
                        </Box>

                        <Flex direction="column-reverse" gap="3" p="4" style={{ flex: 1, overflowY: "auto", background: "rgba(0,0,0,0.1)" }}>
                            <div ref={messagesEndRef} />
                            {isLoadingMessages && <Spinner />}
                            <AnimatePresence>
                                {currentMessages.map((msg) => (
                                    <MessageBubble
                                        key={msg.createdAtMs || Math.random()}
                                        // Map SDK message format to what MessageBubble expects
                                        message={{
                                            id: { id: msg.createdAtMs }, // SDK doesn't give msg ID in decrypted list usually, use timestamp
                                            sender: msg.sender,
                                            timestamp: msg.createdAtMs,
                                            decryptedPayload: {
                                                text: msg.text,
                                                // We added the .url property in the useEffect above
                                                file: msg.attachments?.[0] ? {
                                                    name: msg.attachments[0].fileName,
                                                    type: msg.attachments[0].mimeType,
                                                    data: msg.attachments[0].url // Use the Blob URL created
                                                } : null
                                            }
                                        } as any}
                                        onDelete={() => {}}
                                    />
                                ))}
                            </AnimatePresence>
                        </Flex>

                        {/* Input Area */}
                        <Box p="3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.08)" }} onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}>
                            {filePreview && (
                                <Flex gap="2" align="center" p="2" mb="2" style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
                                    <Text size="2" style={{ color: "#e0f2fe" }}>{attachedFile?.name}</Text>
                                    <IconButton size="1" variant="ghost" onClick={() => { setAttachedFile(null); setFilePreview(null); }}><X size={16} /></IconButton>
                                </Flex>
                            )}
                            <Flex gap="2" align="center">
                                <TextField.Root
                                    placeholder="Type a message..."
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                                    style={{ flex: 1 }}
                                />
                                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                <IconButton size="3" variant="soft" onClick={() => fileInputRef.current?.click()}><Paperclip size={18} /></IconButton>
                                <GradientButton onClick={handleSendMessage} disabled={isSending}>{isSending ? <Spinner /> : <Send size={18} />}</GradientButton>
                            </Flex>
                        </Box>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
}
