import { ConnectButton } from "@mysten/dapp-kit";
import "./ConnectButton.css";
import {useNavigate} from "react-router-dom";
import {Chrome} from "lucide-react";
import {Button} from "@radix-ui/themes"; // Your custom styles

export function StyledConnectButton() {
    return (
        <div className="connect-button-wrapper">
            <ConnectButton connectText="Connect Wallet" />
        </div>
    );
}

export function StyledLink() {
    const navigate = useNavigate();

    return (
        < Button
    size="4"
    variant="solid"
    className="h-14 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300"
    style={{
        background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
    }}
    onClick={() => navigate('/login')}
>
<Chrome size={24} />
    <span className="ml-3">Continue with Google</span>
</Button>
    );
}
