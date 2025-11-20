// web-app/src/App.tsx

import {useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import {Link} from "react-router-dom"
import { useEffect, useState, useRef } from "react";
import {
    Box,
    Container,
    Text,
    Flex,
    Heading,
    TextField,
    Spinner,
    IconButton,
    Button,
} from "@radix-ui/themes";
import {  AnimatePresence } from "framer-motion";
import { Paperclip, Send, X } from "lucide-react";

import { PROFILE_TYPE } from "../utilities/constants.ts";
import type { Profile, MessagePayload } from "../utilities/types.ts";
import { useSuiMail } from "../hooks/useSuiMail.ts";
import { useMessageSync } from "../hooks/useMessageSync.ts";
import { useConversations } from "../hooks/useConversations.ts";
import { GradientButton } from "../components/GradientButton.tsx";
import { AddFriendModal } from "../components/AddFriendModal.tsx";
import { ConversationPreview } from "../components/ConversationPreview.tsx";
import { MessageBubble } from "../components/MessageBubble.tsx";
import { getFriendAlias } from "../services/friendsStore.ts";
import {DebugPanel} from "../components/DebugPanel.tsx";
import {StyledConnectButton, StyledLink} from "../components/s.tsx";
// import { DebugPanel } from "./components/DebugPanel"; // Uncomment for debugging

export function Home() {
    const account = useCurrentAccount();
    const {isPending, createProfile, sendMessage, deleteMessage} = useSuiMail();
    const {syncMessages, refetchMessages} = useMessageSync(account?.address);
    const {
        conversations,
        selectedChat,
        currentMessages,
        selectChat,
        deleteLocalMessage,
        loadConversations,
        setSelectedChat
    } = useConversations();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const [currentMessage, setCurrentMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch profile
    const {data: profileData, refetch: refetchProfile} = useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: account?.address!,
            filter: {StructType: PROFILE_TYPE},
            options: {showContent: true},
        },
        {
            enabled: !!account,
            refetchOnWindowFocus: true, // Refetch when window gets focus
            refetchInterval: 5000, // Check every 5 seconds
        }
    );

    // Process profile data
    useEffect(() => {
        if (!account) {
            setProfile(null);
            setIsCheckingProfile(false);
            return;
        }

        if (profileData?.data && profileData.data.length > 0) {
            const profileObj = profileData.data[0];
            if (profileObj.data?.content?.dataType === "moveObject") {
                const profileFields = profileObj.data.content.fields as unknown as Profile;
                console.log("✅ Profile found:", profileFields);
                setProfile(profileFields);
                setIsCheckingProfile(false);
            } else {
                console.log("❌ No valid profile data");
                setProfile(null);
                setIsCheckingProfile(false);
            }
        } else if (profileData !== undefined) {
            // Query has completed but no profile found
            console.log("ℹ️ No profile exists for this wallet");
            setProfile(null);
            setIsCheckingProfile(false);
        }
    }, [profileData, account]);

    // Reset state when wallet changes
    useEffect(() => {
        if (account) {
            console.log("🔄 Wallet connected:", account.address);
            setProfile(null);
            setIsCheckingProfile(true); // Show loading while checking
            setSelectedChat(null);
            setCurrentMessage("");
            setAttachedFile(null);
            setFilePreview(null);

            // Trigger profile fetch
            setTimeout(() => {
                void refetchProfile();
            }, 500);
        } else {
            setProfile(null);
            setIsCheckingProfile(false);
        }
    }, [account?.address, refetchProfile]);

    // Listen for friends updates (moved to useConversations hook)
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [currentMessages]);

    // File handling
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFile = (file: File) => {
        setAttachedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const buildPayload = async (): Promise<string> => {
        const text = currentMessage.trim();
        let fileData = "";
        let fileName = "";
        let fileType = "";

        if (attachedFile) {
            const arrayBuffer = await attachedFile.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            const binary = uint8.reduce((str, byte) => str + String.fromCharCode(byte), "");
            fileData = btoa(binary);
            fileName = attachedFile.name;
            fileType = attachedFile.type;
        }

        const payload: MessagePayload = {
            text: text || null,
            file: attachedFile ? {name: fileName, type: fileType, data: fileData} : null,
        };

        return JSON.stringify(payload);
    };

    // Handlers
    const handleCreateProfile = async () => {
        createProfile(
            async (digest) => {
                console.log("Profile created:", digest);
                alert("Profile created successfully! ✅");

                // Wait a bit for blockchain to process
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Refetch profile to trigger UI update
                const result = await refetchProfile();
                console.log("Profile refetch result:", result);

                // Force re-check if profile still null
                if (result.data?.data && result.data.data.length > 0) {
                    const profileObj = result.data.data[0];
                    if (profileObj.data?.content?.dataType === "moveObject") {
                        setProfile(profileObj.data.content.fields as unknown as Profile);
                    }
                }
            },
            (error) => alert("Create profile failed: " + error)
        );
    };

    const handleSendMessage = async () => {
        if (!selectedChat || (!currentMessage.trim() && !attachedFile)) return;

        const payload = await buildPayload();
        const messageText = currentMessage;
        const file = attachedFile;

        setCurrentMessage("");
        setAttachedFile(null);
        setFilePreview(null);

        sendMessage(
            selectedChat,
            payload,
            (digest) => {
                console.log("Message sent:", digest);
                setTimeout(() => {
                    void syncMessages();
                    void loadConversations();
                }, 2000);
            },
            (error) => {
                alert("Send failed: " + error);
                setCurrentMessage(messageText);
                setAttachedFile(file);
            }
        );
    };

    const handleDelete = (messageId: string) => {
        deleteMessage(
            messageId,
            () => {
                alert("Deleted! SUI rebate received. 💰");
                void deleteLocalMessage(messageId);
                void refetchMessages();
            },
            (error) => alert("Delete failed: " + error)
        );
    };

    // Not connected
    if (!account) {
        return (
            <Box
                style={{
                    height: "100vh",
                    background: "linear-gradient(135deg, #1e3a8a, #065f46)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <StyledConnectButton/>
                <StyledLink />
                {/*<Link to={'/login'} >Login Screen </Link>*/}
            </Box>
        );
    }

    // No profile
    if (!profile && !isCheckingProfile) {
        return (
            <Box
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #1e3a8a, #065f46)",
                    padding: "2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Container size="2" style={{maxWidth: 500}}>
                    <Flex direction="column" gap="5" align="center">
                        <Heading
                            size="9"
                            align="center"
                            style={{
                                background: "linear-gradient(135deg, #60a5fa, #34d399)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                fontWeight: 800,
                            }}
                        >
                            SuiMail
                        </Heading>
                        <Text size="4" align="center" color="gray">
                            Private, on-chain messaging with <strong>sponsored sends</strong> and{" "}
                            <strong>SUI rebates</strong>.
                        </Text>
                        <GradientButton onClick={handleCreateProfile} disabled={isPending}>
                            {isPending ? <Spinner/> : "Create Profile (You Pay Gas)"}
                        </GradientButton>
                        <StyledConnectButton/>
                    </Flex>
                </Container>
            </Box>
        );
    }

    // Loading state while checking profile
    if (isCheckingProfile) {
        return (
            <Box
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #1e3a8a, #065f46)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Flex direction="column" align="center" gap="4">
                    <Spinner size="3"/>
                    <Text size="4" style={{color: "rgba(255,255,255,0.8)"}}>
                        Checking profile...
                    </Text>
                </Flex>
            </Box>
        );
    }

    // Main app
    return (
        <>
            <Flex style={{height: "100vh", background: "linear-gradient(135deg, #1e3a8a, #065f46)"}}>
                {/* Sidebar */}
                <Box
                    style={{
                        width: "320px",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <Flex
                        p="4"
                        justify="between"
                        align="center"
                        style={{borderBottom: "1px solid rgba(255,255,255,0.15)"}}
                    >
                        <Heading
                            size="5"
                            style={{
                                background: "linear-gradient(135deg, #60a5fa, #34d399)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Inbox
                        </Heading>
                        <Flex gap="2">
                            <AddFriendModal/>
                            <Button
                                variant="soft"
                                size="2"
                                onClick={() => {
                                    void syncMessages();
                                    void loadConversations();
                                }}
                                style={{background: "rgba(255,255,255,0.15)", color: "white"}}
                            >
                                Refresh
                            </Button>
                        </Flex>
                    </Flex>

                    <Box p="2" style={{overflowY: "auto", maxHeight: "calc(100vh - 80px)"}}>
                        <Flex direction="column" gap="2">
                            {Array.from(conversations.entries()).map(([addr, msgs]) => (
                                <ConversationPreview
                                    key={addr}
                                    conversationId={addr}
                                    messages={msgs}
                                    onClick={() => void selectChat(addr)}
                                    isSelected={selectedChat === addr}
                                />
                            ))}
                        </Flex>
                    </Box>
                    <Box
                        style={{
                            position: "absolute",
                            marginTop: "auto",
                            marginBottom: "auto",
                            padding: "16px",
                            borderTop: "1px solid rgba(255,255,255,0.15)",
                        }}
                    >
                        <StyledConnectButton />
                    </Box>
                </Box>

                {/* Chat Area */}
                <Flex direction="column" style={{flex: 1}}>
                    {!selectedChat ? (
                        <Flex
                            align="center"
                            justify="center"
                            style={{height: "100%", color: "rgba(255,255,255,0.6)"}}
                        >
                            <Text size="5">Select a chat to start messaging</Text>
                        </Flex>
                    ) : (
                        <Flex direction="column" style={{height: "100%"}}>
                            {/* Header */}
                            <Box
                                p="4"
                                style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                }}
                            >
                                <Heading size="4" style={{color: "#e0f2fe"}}>
                                    {getFriendAlias(selectedChat) ||
                                        `${selectedChat.substring(0, 6)}...${selectedChat.slice(-4)}`}
                                </Heading>
                            </Box>

                            {/* Messages */}
                            <Flex
                                direction="column-reverse"
                                gap="3"
                                p="4"
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    background: "rgba(0,0,0,0.1)",
                                }}
                            >
                                <div ref={messagesEndRef}/>
                                <AnimatePresence>
                                    {currentMessages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id.id}
                                            message={msg}
                                            onDelete={() => handleDelete(msg.id.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </Flex>

                            {/* Input */}
                            <Box
                                p="3"
                                style={{
                                    borderTop: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.08)",
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                            >
                                <StyledConnectButton />
                                {filePreview && (
                                    <Flex
                                        gap="2"
                                        align="center"
                                        p="2"
                                        mb="2"
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {attachedFile?.type.startsWith("image/") ? (
                                            <img
                                                src={filePreview}
                                                alt="preview"
                                                style={{width: 40, height: 40, borderRadius: 6, objectFit: "cover"}}
                                            />
                                        ) : (
                                            <Paperclip size={20}/>
                                        )}
                                        <Text size="2" style={{color: "#e0f2fe"}}>
                                            {attachedFile?.name}
                                        </Text>
                                        <IconButton
                                            size="1"
                                            variant="ghost"
                                            onClick={() => {
                                                setAttachedFile(null);
                                                setFilePreview(null);
                                            }}
                                        >
                                            <X size={16}/>
                                        </IconButton>
                                    </Flex>
                                )}

                                <Flex gap="2" align="center">
                                    {/* Text Input */}
                                    <TextField.Root
                                        placeholder="Type a message..."
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                void handleSendMessage();
                                            }
                                        }}
                                        disabled={isPending}
                                        style={{
                                            flex: 1,
                                            background: "rgba(255, 255, 255, 0.15)",
                                            color: "white",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            borderRadius: "8px",
                                        }}
                                    />

                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    />

                                    {/* Attach Button */}
                                    <IconButton
                                        size="3"
                                        variant="soft"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ color: "#94a3b8" }}
                                    >
                                        <Paperclip size={18} />
                                    </IconButton>

                                    {/* Send Button */}
                                    <GradientButton
                                        onClick={handleSendMessage}
                                        disabled={isPending || (!currentMessage.trim() && !attachedFile)}
                                    >
                                        {isPending ? <Spinner /> : <Send size={18} />}
                                    </GradientButton>
                                </Flex>
                            </Box>
                        </Flex>
                    )}
                </Flex>

                {/* Debug Panel - Uncomment to use */}
                <DebugPanel
                    profile={profile}
                    profileData={profileData}
                    isCheckingProfile={isCheckingProfile}
                />
            </Flex>
        </>
    );
}
