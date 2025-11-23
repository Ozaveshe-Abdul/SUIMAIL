// src/components/SidebarButton.tsx
import { Flex, Text, Box } from "@radix-ui/themes";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SidebarButtonProps {
    icon: ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}

export function SidebarButton({
                                  icon,
                                  label,
                                  isActive = false,
                                  onClick,
                              }: SidebarButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="w-full"
            style={{ outline: "none", border: "none", background: "transparent" }}
        >
            <Flex
                align="center"
                gap="3"
                p="3"
                className="rounded-xx transition-all duration-300"
                style={{
                    background: isActive
                        ? "rgba(59, 130, 246, 0.25)"
                        : "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(12px)",
                    border: isActive
                        ? "2px solid rgba(59, 130, 246, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: isActive ? "20%" : "5%",
                    cursor: "pointer",
                    transition: "all 0.5s",
                }}
            >
                <Box
                    style={{
                        color: isActive ? "#60a5fa" : "#94a3b8",
                        transition: "color 0.3s",
                    }}
                >
                    {icon}
                </Box>

                <Text
                    size="3"
                    weight={isActive ? "bold" : "medium"}
                    style={{
                        color: isActive ? "#e0f2fe" : "#cbd5e1",
                        transition: "all 0.3s",
                    }}
                >
                    {label}
                </Text>

                {/* Active indicator bar */}
                {isActive && (
                    <Box
                        className="ml-auto"
                        style={{
                            width: "8px",
                            height: "8px",
                            background: "#60a5fa",
                            borderRadius: "90%",
                            boxShadow: "0 0 12px #60a5fa",
                        }}
                    />
                )}
            </Flex>
        </motion.button>
    );
}
