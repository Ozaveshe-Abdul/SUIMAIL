// src/components/ChatHeaderActions.tsx
import {Badge, Flex} from "@radix-ui/themes";
import {AddMemberModal} from "./AddMemberModal";
import {SaveFriendModal} from "./SaveFriendModal";
import {Users} from "lucide-react";
import {ChannelData} from "../pages/Home.tsx";

interface ChatHeaderActionsProps {
    channelId: string;
    channel: any;
    account: any;
    isFriend: (user: string, friend: string) => boolean;
    groups: ChannelData[];
}

export function ChatHeaderActions({
                                      channelId,
                                      channel,
                                      account,
                                      isFriend,
                                      groups,
                                  }: ChatHeaderActionsProps) {
    if (!account?.address) return null;

    const currentGroup = groups?.find((g) => g.channelId === channelId);
    const isGroup = !!currentGroup;

    const friendAddress = channel?.friendAddress;
    // Count unique members (including self)

    const memberCount = isGroup
        ? groups.length
        : 2; // 1-on-1 always has 2 people

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
                         {memberCount === 1 ? "member" : "members"}
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



