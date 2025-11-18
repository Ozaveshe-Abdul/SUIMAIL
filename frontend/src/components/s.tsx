import { ConnectButton } from "@mysten/dapp-kit";
import "./ConnectButton.css"; // Your custom styles

export function StyledConnectButton() {
    return (
        <div className="connect-button-wrapper">
            <ConnectButton connectText="Connect Wallet" />
        </div>
    );
}
