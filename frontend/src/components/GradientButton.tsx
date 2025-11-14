// web-app/src/components/GradientButton.tsx

import { Button } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface GradientButtonProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    size?: "1" | "2" | "3" | "4";
    type?: "button" | "submit" | "reset";
}

export function GradientButton({
                                   children,
                                   onClick,
                                   disabled = false,
                                   size = "3",
                                   type = "button",
                               }: GradientButtonProps) {
    return (
        <Button
            size={size}
            onClick={onClick}
            disabled={disabled}
            type={type}
            style={{
                background: disabled
                    ? "var(--gray-8)"
                    : "linear-gradient(135deg, #3b82f6, #10b981)",
                color: "white",
                fontWeight: 600,
                boxShadow: disabled ? "none" : "0 4px 12px rgba(59,130,246,0.3)",
                transition: "all 0.2s ease",
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
            }}
        >
            {children}
        </Button>
    );
}
