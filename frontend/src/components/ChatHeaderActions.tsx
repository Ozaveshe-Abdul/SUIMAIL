// src/components/ChatHeaderActions.tsx
import { Flex, Badge } from "@radix-ui/themes";
import { AddMemberModal } from "./AddMemberModal";
import { SaveFriendModal } from "./SaveFriendModal";
import { Users } from "lucide-react";
import {useSuiMailMessenger} from "../hooks/useSuiMailMessenger.ts";

interface ChatHeaderActionsProps {
    channelId: string;
    channel: any;
    account: any;
    isFriend: (user: string, friend: string) => boolean;
    groups: any[];
}

export function ChatHeaderActions({
                                      channelId,
                                      channel,
                                      account,
                                      isFriend,
                                      groups,
                                  }: ChatHeaderActionsProps) {
    const {getChannelMembers} = useSuiMailMessenger()
    const currentGroup = groups?.find((g) => g.channel_id === channelId);
    const isGroup = !!currentGroup;
    const friendAddress = channel?.friendAddress;

    // Count unique members (including self)
    const memberCount = isGroup
        ? getChannelMembers.length
        : 2; // 1-on-1 always has 2 people

    if (!account?.address) return null;

    return (
        <Flex gap="3" align="center">
            {/* Member Count Badge (only show for groups) */}
            {isGroup && (
                <Flex align="center" gap="2" style={{ opacity: 0.9 }}>
                    <Users size={16} style={{ color: "#94a3b8" }} />
                    <Badge
                        variant="soft"
                        style={{
                            background: "rgba(139, 92, 246, 0.2)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            fontWeight: 600,
                        }}
                    >
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                    </Badge>
                </Flex>
            )}

            {/* Action Buttons */}
            {isGroup ? (
                <AddMemberModal
                    channelId={channelId}
                />
            ) : friendAddress ? (
                <SaveFriendModal
                    friendAddress={friendAddress}
                    userAddress={account.address}
                    isFriend={isFriend(account.address, friendAddress)}
                />
            ) : null}
        </Flex>
    );
}

{/* Optional: Show member count below title for large groups */}
{/*{groups?.find((g) => g.channelId === selectedChannelId) && (*/}
{/*    <Text size="2" style={{ color: "#94a3b8", marginTop: "4px" }}>*/}
{/*        {(() => {*/}
{/*            const count = new Set([*/}
{/*                ...(groups.find(g => g.channelId === selectedChannelId)?.channelObject || []),*/}
{/*                account?.address,*/}
{/*            ]).size;*/}
{/*            return `${count} member${count !== 1 ? "s" : ""} online`;*/}
{/*        })()}*/}
{/*    </Text>*/}
{/*)}*/}

// {isLoadingMessages && (
//     <Flex
//         align="center"
//         justify="center"
//         style={{
//             position: "absolute",
//             inset: 0,
//             background: "rgba(0,0,0,0.3)",
//             backdropFilter: "blur(4px)",
//             zIndex: 0,
//         }}
//     >
//         <Spinner size="3" />
//     </Flex>
// )}
