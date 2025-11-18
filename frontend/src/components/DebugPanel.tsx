// web-app/src/components/DebugPanel.tsx
// Optional debug component - remove in production

import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface DebugPanelProps {
    profile: any;
    profileData: any;
    isCheckingProfile: boolean;
}

export function DebugPanel({ profile, profileData, isCheckingProfile }: DebugPanelProps) {
    const [isVisible, setIsVisible] = useState(false);
    const account = useCurrentAccount();

    if (!isVisible) {
        return (
            <Box
                style={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    zIndex: 9999,
                }}
            >
                <Button
                    size="2"
                    onClick={() => setIsVisible(true)}
                    style={{
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                    }}
                >
                    🐛 Debug
                </Button>
            </Box>
        );
    }

    return (
        <Box
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                width: 400,
                maxHeight: 600,
                overflowY: "auto",
                background: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: 16,
                zIndex: 9999,
                color: "white",
                fontFamily: "monospace",
                fontSize: 12,
            }}
        >
            <Flex justify="between" mb="3">
                <Text weight="bold">Debug Panel</Text>
                <Button size="1" onClick={() => setIsVisible(false)}>
                    ✕
                </Button>
            </Flex>

            <Box style={{ marginBottom: 12 }}>
                <Text weight="bold" style={{ color: "#60a5fa" }}>Wallet</Text>
                <Text style={{ wordBreak: "break-all" }}>
                    {account?.address || "Not connected"}
                </Text>
            </Box>

            <Box style={{ marginBottom: 12 }}>
                <Text weight="bold" style={{ color: "#60a5fa" }}>Checking Profile</Text>
                <Text>{isCheckingProfile ? "✅ Yes" : "❌ No"}</Text>
            </Box>

            <Box style={{ marginBottom: 12 }}>
                <Text weight="bold" style={{ color: "#60a5fa" }}>Profile State</Text>
                <Text>{profile ? "✅ Loaded" : "❌ Null"}</Text>
                {profile && (
                    <pre style={{ fontSize: 10, marginTop: 4 }}>
            {JSON.stringify(profile, null, 2)}
          </pre>
                )}
            </Box>

            <Box style={{ marginBottom: 12 }}>
                <Text weight="bold" style={{ color: "#60a5fa" }}>Profile Query Data</Text>
                {profileData === undefined && <Text>⏳ Loading...</Text>}
                {profileData && profileData.data && (
                    <Text>
                        Found {profileData.data.length} object(s)
                    </Text>
                )}
                {profileData && profileData.data?.length === 0 && (
                    <Text style={{ color: "#ef4444" }}>
                        No profile objects found
                    </Text>
                )}
            </Box>

            <Box>
                <Text weight="bold" style={{ color: "#60a5fa" }}>Raw Query Response</Text>
                <pre style={{ fontSize: 10, marginTop: 4, maxHeight: 200, overflow: "auto" }}>
          {JSON.stringify(profileData, null, 2)}
        </pre>
            </Box>
        </Box>
    );
}
