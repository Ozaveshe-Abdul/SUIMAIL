import {useCurrentAccount} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import {useCallback, useEffect, useRef, useState} from "react";
import Logout from "../components/LogoutButton.tsx";
import {Box, Flex, Heading, ScrollArea, Spinner, Text} from "@radix-ui/themes";
import {AnimatePresence} from "framer-motion";
import {Sparkles} from "lucide-react";

// Hooks and Services
import {useSuiMailMessenger} from "../hooks/useSuiMailMessenger";
import {AddFriendModal} from "../components/AddFriendModal.tsx";
import {ConversationPreview} from "../components/ConversationPreview.tsx";
import {MessageBubble} from "../components/MessageBubble.tsx";
import {LoginScreen} from "./LoginScreen.tsx";
import {CreateGroupModal} from "../components/CreateGroupModal.tsx";
import {getFriendAlias, isFriend} from "../services/friendsStore.ts";
import {ChatHeaderActions} from "../components/ChatHeaderActions.tsx";
import {StoredMessage} from "../utilities/types.ts";
import Extras from "./Extrax.tsx";
import {SidebarButton} from "../components/SidebarButton.tsx";
import {ChatInputArea} from "../components/ChatInput.tsx";

export type ChannelData = {
    channelId: string;
    memberCapId: string;
    channelObject: any;
    friendAddress: string;
    lastMessage: any | null;
    updatedAt: number; // Added for sorting
};

export function Home() {
    const account = useCurrentAccount();

    // 1. STATE (Moved up to pass to hook)
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [channels, setChannels] = useState<ChannelData[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
    const [groups, setGroups] = useState<ChannelData[]>([]);
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    // Assuming your state looks something like this:
    const [activeSection, setActiveSection] = useState<'chats' | 'extras'>( 'extras');
    const [friendsUpdateTrigger, setFriendsUpdateTrigger] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 2. HOOK
    // Pass the selectedChannelId so the hook knows what to listen to
    const {
        isReady,
        sendMessage,
        getMessages,
        getMyChannels,
        getChannelObjects,
        getChannelMembers,
        messagesVersion // This signals when to re-fetch
    } = useSuiMailMessenger(selectedChannelId);

    // ------------------------------------------------------------------
    // 3. LOAD CHANNELS
    // ------------------------------------------------------------------
    const loadChannels = useCallback(async () => {
        if (!isReady || !account) {
            setChannels([]);
            setGroups([]);
            return;
        }

        try {
            const memberships = await getMyChannels();
            if (!memberships || memberships.length === 0) {
                setChannels([]);
                setGroups([]);
                return;
            }

            const channelIds = memberships.map((m: any) => m.channel_id);
            const channelObjects = await getChannelObjects(channelIds);

            const dmList: ChannelData[] = [];
            const groupList: ChannelData[] = [];

            await Promise.all(memberships.map(async (mem: any) => {
                const obj = channelObjects.find((o: any) => o.id.id === mem.channel_id);
                if (!obj) return;

                let updatedAt = Number(obj.created_at_ms);
                if (obj.last_message) {
                    updatedAt = Number(obj.last_message.createdAtMs);
                } else if (obj.updated_at_ms) {
                    updatedAt = Number(obj.updated_at_ms);
                }

                let otherMember = "Unknown";
                let isGroup = false;

                try {
                    const membersData = await getChannelMembers(mem.channel_id);

                    if (membersData.length > 2) {
                        isGroup = true;
                    } else {
                        const found = membersData.find((m: any) => m.memberAddress !== account.address);
                        if (found) otherMember = found.memberAddress;
                    }
                } catch (e) {
                    console.warn("Could not fetch members for channel", mem.channel_id);
                }

                const channelData: ChannelData = {
                    channelId: mem.channel_id,
                    memberCapId: mem.member_cap_id,
                    channelObject: obj,
                    friendAddress: otherMember,
                    lastMessage: obj.last_message,
                    updatedAt: updatedAt
                };

                if (isGroup) {
                    groupList.push(channelData);
                } else {
                    dmList.push(channelData);
                }
            }));

            // D. Sort by Recency (Newest First)
            const sortFn = (a: ChannelData, b: ChannelData) => b.updatedAt - a.updatedAt;
            const chnls = [...dmList, ...groupList]
            setGroups(groupList);
            setChannels(chnls.sort(sortFn));

        } catch (e) {
            console.error("Failed to load channels", e);
        }
    }, [isReady, account, getMyChannels, getChannelObjects, getChannelMembers, friendsUpdateTrigger]);

    // Effect to handle data loading and event listeners
    useEffect(() => {
        loadChannels();

        // Listen for friends updates
        const handleFriendsUpdate = () => {
            // Optional: Check if update is for current user
            // if (event.detail?.ownerAddress === account?.address) ...
            loadChannels(); // Re-run loading logic to pick up new aliases
            setFriendsUpdateTrigger(prev => prev + 1); // Force re-render
        };

        window.addEventListener("friends-updated", handleFriendsUpdate);
        const interval = setInterval(loadChannels, 60000);

        return () => {
            window.removeEventListener("friends-updated", handleFriendsUpdate);
            clearInterval(interval);
        };
    }, [loadChannels, messagesVersion]);
    // ------------------------------------------------------------------
    // 4. LOAD MESSAGES (Real-Time Optimized)
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!selectedChannelId || !isReady) return;

        console.log(`🔄 Fetching messages for channel ${selectedChannelId}, version: ${messagesVersion}`);

        const fetchMessages = async () => {
            // Only spinner on initial empty load
            if (currentMessages.length === 0) setIsLoadingMessages(true);

            try {
                const msgs = await getMessages(selectedChannelId, 50);

                const sortedMsgs = msgs.sort((a: any, b: any) =>
                    Number(b.createdAtMs) - Number(a.createdAtMs)
                );

                const processedMsgs = await Promise.all(sortedMsgs.map(async (msg: any) => {
                    if (msg.attachments && msg.attachments.length > 0) {
                        try {
                            const att = msg.attachments[0];
                            const dataBytes = await att.data;
                            const blob = new Blob([dataBytes], { type: att.mimeType });
                            const url = URL.createObjectURL(blob);

                            return {
                                ...msg,
                                id: { id: msg.createdAtMs },
                                decryptedPayload: {
                                    text: msg.text,
                                    file: {
                                        name: att.fileName,
                                        type: att.mimeType,
                                        data: url
                                    }
                                }
                            };
                        } catch (e) {
                            console.error("Failed to load attachment", e);
                            return msg;
                        }
                    }
                    return {
                        ...msg,
                        id: { id: msg.createdAtMs },
                        decryptedPayload: { text: msg.text, file: null }
                    };
                }));

                setCurrentMessages(processedMsgs);
            } catch (e) {
                console.error("Error fetching messages", e);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [selectedChannelId, isReady, getMessages, messagesVersion]);
// ↑ messagesVersion MUST be here

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages]);

    // ------------------------------------------------------------------
    // 5. ACTIONS
    // ------------------------------------------------------------------

    // Render Helpers
    const activeChannel = channels.find(c => c.channelId === selectedChannelId);
    const getHeaderTitle = () => {
        if (!activeChannel) return "Chat";

        const isGroup = groups.some((g) => g.channelId === selectedChannelId);

        // 1. Try to get a custom alias (works for Friend Address OR Channel ID)
        const identifier = isGroup ? activeChannel.channelId : activeChannel.friendAddress;
        const alias = getFriendAlias(account!!.address, identifier);

        if (alias) return alias;

        // 2. Fallback if no alias
        if (isGroup) {
            return "Group Chat"; // Or truncate channel ID: `${activeChannel.channelId.slice(0,6)}...`
        }

        // 3. Fallback for DM (Truncate Address)
        return `${activeChannel.friendAddress.slice(0, 6)}...${activeChannel.friendAddress.slice(-4)}`;
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

    // The UI rendering part remains identical
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
                    </Flex>
                </Flex>


                <Box p="2" style={{ overflowY: "auto", maxHeight: "calc(100vh - 80px)" }}>
                    <Flex direction="column" gap="2">
                        <SidebarButton
                            icon={<Sparkles className="h-5 w-5" />}
                            label="Extras"
                            isActive={activeSection === 'extras'}
                            onClick={() => {
                                setActiveSection('extras')
                                setSelectedChannelId(null)
                            }}
                        />
                        {channels.map((channel) => (
                            <ConversationPreview
                                key={channel.channelId}
                                conversationId={ groups?.find((g) => g.channelId === channel.channelId) ? channel.channelId : channel.friendAddress}
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
                                onClick={() =>{
                                    setSelectedChannelId(channel.channelId)
                                    setCurrentMessages([])
                                    setIsLoadingMessages(true)
                                    setSelectedChannel(channel)
                                    setActiveSection("chats")
                                }}
                                isSelected={selectedChannelId === channel.channelId}
                            />
                        ))}
                    </Flex>
                </Box>
                <Box style={{ position: "absolute", bottom: 16, left: 16 }}>
                    <CreateGroupModal />
                    <Box p="2"></Box>
                    <Logout />
                </Box>
            </Box>

            {/* CHAT AREA */}
            {activeSection === "extras" ? (
                <Extras />
            ) : (
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    overflow: "hidden"
                }}>
                    {selectedChannelId &&
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            overflow: "hidden"
                        }}>
                            {/* Header */}
                            <div
                                style={{
                                    padding: "12px",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    backdropFilter: "blur(10px)",
                                    flexShrink: 0
                                }}
                            >
                                <Flex justify="between" align="center">
                                    <Box>
                                        <Heading size="5" weight="bold" style={{ color: "#e0f2fe" }}>
                                            {getHeaderTitle()}
                                        </Heading>
                                    </Box>

                                    <ChatHeaderActions
                                        channelId={selectedChannelId}
                                        channel={selectedChannel}
                                        account={account}
                                        isFriend={isFriend}
                                        groups={groups}
                                    />
                                </Flex>
                            </div>

                            {/* Messages Area */}
                            <div style={{
                                flex: 1,
                                position: "relative",
                                background: "rgba(0,0,0,0.12)",
                                overflow: "hidden",
                                minHeight: 0
                            }}>
                                <ScrollArea
                                    type="auto"
                                    scrollbars="vertical"
                                    style={{
                                        height: "100%",
                                        width: "100%"
                                    }}
                                >
                                    <Box p="4">
                                        <Flex direction="column-reverse" gap="3">
                                            <div ref={messagesEndRef} />

                                            {isLoadingMessages && (
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: "rgba(0,0,0,0.3)",
                                                        backdropFilter: "blur(4px)",
                                                        zIndex: 10,
                                                    }}
                                                >
                                                    <Spinner size="3" />
                                                </Flex>
                                            )}
                                            <AnimatePresence>
                                                {currentMessages.map((msg, index) => {
                                                    const currentGroup = groups?.find((g) => g.channelId === selectedChannelId);
                                                    const isGroup = !!currentGroup;

                                                    return (
                                                        <MessageBubble
                                                            key={msg.createdAtMs || index}
                                                            message={{
                                                                id: { id: msg.createdAtMs },
                                                                sender: msg.sender,
                                                                timestamp: String(msg.createdAtMs),
                                                                decryptedPayload: {
                                                                    text: msg.text || "",
                                                                    file: msg.attachments?.[0]
                                                                        ? {
                                                                            name: msg.attachments[0].fileName,
                                                                            type: msg.attachments[0].mimeType,
                                                                            data: msg.attachments[0].url,
                                                                        }
                                                                        : null,
                                                                },
                                                            } as StoredMessage}
                                                            onDelete={() => {}}
                                                            showSender={isGroup}
                                                            senderAlias={getFriendAlias(account!!.address, msg.sender)}
                                                            isConsecutive={false}
                                                        />
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </Flex>
                                    </Box>
                                </ScrollArea>
                            </div>

                            {/* Input Area */}
                            {/* Input Area */}
                            <ChatInputArea
                                onSendMessage={async (text: string, file: File | null) => {
                                    if (!selectedChannelId) return;

                                    const targetChannel = channels.find(c => c.channelId === selectedChannelId);
                                    if (!targetChannel) return;

                                    const attachments = file ? [file] : undefined;

                                    await sendMessage(
                                        targetChannel.channelId,
                                        targetChannel.memberCapId,
                                        text,
                                        targetChannel.channelObject,
                                        attachments
                                    );

                                }}
                                recipientAddress={activeChannel?.friendAddress || ""}
                                channelId={selectedChannelId || undefined}
                            />
                        </div>
                    }
                </div>
            )}
       </Flex>
    );
}
