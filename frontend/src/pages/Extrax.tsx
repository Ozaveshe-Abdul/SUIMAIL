import { useState } from "react";
import { Newspaper, Store, Copy, Check, Wallet, Sparkles } from "lucide-react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { toast } from "sonner";
import {
    Flex,
    Text,
    IconButton,
    Badge,
    Separator,
} from "@radix-ui/themes";
import { motion } from "framer-motion";
import NewsFeed from "../components/NewsFeed.tsx";

const Extras = () => {
    const [activeTab, setActiveTab] = useState<"news" | "nft">("news");
    const [hasCopied, setHasCopied] = useState(false);

    const account = useCurrentAccount();

    const { data: balanceData, isLoading: isBalanceLoading } = useSuiClientQuery(
        "getBalance",
        { owner: account?.address || "", coinType: "0x2::sui::SUI" },
        { enabled: !!account }
    );

    const formatSui = (mist: string) => {
        const sui = Number(mist) / 1_000_000_000;
        return sui.toFixed(sui < 1 ? 4 : 2);
    };

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const copyAddress = async () => {
        if (!account?.address) return;
        await navigator.clipboard.writeText(account.address);
        setHasCopied(true);
        toast.success("Address copied!");
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
            flex: 1,
            minWidth: 0
        }}>
            {/* === User Profile Header === */}
            <div style={{
                padding: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
                minHeight: "fit-content"
            }}>
                {account ? (
                    <Flex align="center" justify="between">
                        <Flex direction="column" gap="2">
                            <Flex align="center" gap="3">
                                <Text size="5" weight="bold" style={{ color: "#e0f2fe" }}>
                                    Hey,{" "}
                                    <span style={{ color: "#60a5fa" }}>{shortenAddress(account.address)}</span>
                                </Text>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <IconButton
                                        size="2"
                                        variant="soft"
                                        onClick={copyAddress}
                                        style={{
                                            background: hasCopied ? "rgba(34, 197, 94, 0.3)" : "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            color: hasCopied ? "#86efac" : "#94a3b8",
                                            cursor: "pointer"
                                        }}
                                        title="Copy address"
                                    >
                                        {hasCopied ? <Check size={18} /> : <Copy size={18} />}
                                    </IconButton>
                                </motion.div>
                            </Flex>

                            <Flex align="center" gap="2">
                                <Wallet size={16} style={{ color: "#64748b" }} />
                                <Text size="3" style={{ color: "#94a3b8" }}>
                                    {isBalanceLoading ? (
                                        "Loading..."
                                    ) : balanceData ? (
                                        <>
                                            <span style={{ color: "#e0f2fe", fontWeight: 600 }}>
                                                {formatSui(balanceData.totalBalance)}
                                            </span>{" "}
                                            SUI
                                        </>
                                    ) : (
                                        "— SUI"
                                    )}
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex align="center" justify="center">
                            <Text size="5" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                                Select a chat to start messaging
                            </Text>
                        </Flex>
                        <Badge
                            variant="soft"
                            size="2"
                            style={{
                                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                                color: "white",
                                fontWeight: 600,
                            }}
                        >
                            <Sparkles size={14} style={{ marginRight: 6 }} />
                            Extras
                        </Badge>
                    </Flex>
                ) : (
                    <Text size="4" style={{ color: "#94a3b8" }}>
                        Connect wallet to view profile
                    </Text>
                )}
            </div>

            {/* === Tab Navigation === */}
            <div style={{
                display: "flex",
                flexShrink: 0,
                userSelect: "none",
                minHeight: "fit-content"
            }}>
                <button
                    onClick={() => setActiveTab("news")}
                    style={{
                        flex: 1,
                        padding: "14px 20px",
                        background: activeTab === "news" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: activeTab === "news" ? "3px solid #60a5fa" : "3px solid transparent",
                        color: activeTab === "news" ? "#e0f2fe" : "#94a3b8",
                        fontWeight: activeTab === "news" ? 600 : 500,
                        transition: "all 0.3s",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        outline: "none"
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== "news") {
                            e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== "news") {
                            e.currentTarget.style.background = "transparent";
                        }
                    }}
                >
                    <Newspaper size={18} />
                    <span>Crypto News</span>
                </button>

                <button
                    onClick={() => setActiveTab("nft")}
                    style={{
                        flex: 1,
                        padding: "14px 20px",
                        background: activeTab === "nft" ? "rgba(236, 72, 153, 0.25)" : "transparent",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: activeTab === "nft" ? "3px solid #ec4899" : "3px solid transparent",
                        color: activeTab === "nft" ? "#e0f2fe" : "#94a3b8",
                        fontWeight: activeTab === "nft" ? 600 : 500,
                        transition: "all 0.3s",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        outline: "none"
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== "nft") {
                            e.currentTarget.style.background = "rgba(236, 72, 153, 0.1)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== "nft") {
                            e.currentTarget.style.background = "transparent";
                        }
                    }}
                >
                    <Store size={18} />
                    <span>NFT Market</span>
                </button>
            </div>

            <Separator size="4" style={{ flexShrink: 0 }} />

            {/* === Tab Content === */}
            <div style={{
                flex: 1,
                overflow: "hidden",
                position: "relative",
                minHeight: 0,
                display: "flex",
                flexDirection: "column"
            }}>
                {activeTab === "news" ? (
                    <div style={{
                        height: "100%",
                        overflow: "auto",
                        flex: 1
                    }}>
                        <NewsFeed />
                    </div>
                ) : (
                    <div style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px",
                        gap: "24px"
                    }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                width: 140,
                                height: 140,
                                borderRadius: "50%",
                                background: "rgba(236, 72, 153, 0.15)",
                                backdropFilter: "blur(12px)",
                                border: "2px dashed rgba(236, 72, 153, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <Store size={64} style={{ color: "#ec4899" }} />
                        </motion.div>

                        <Text size="7" weight="bold" style={{ color: "#e0f2fe" }}>
                            NFT Marketplace
                        </Text>
                        <Text size="4" style={{ color: "#94a3b8", textAlign: "center", maxWidth: "400px" }}>
                            Buy, sell, and discover exclusive NFTs directly in <strong>SuiMail.</strong>
                        </Text>
                        <Badge size="3" style={{ background: "rgba(236, 72, 153, 0.3)", color: "#fdbcb4" }}>
                            Coming Soon
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Extras;
