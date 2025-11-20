import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import {Button} from "@radix-ui/themes";
import {Facebook} from "lucide-react";

function LogoutButton() {
    const account = useCurrentAccount();
    const disconnectWallet = useDisconnectWallet();
    const navigate = useNavigate();

    const handleLogout = () => {
        disconnectWallet.mutate();
        navigate('/login');
    };

    if (!account) return null;

    return <Button
                size="4"
            variant="solid"
            className="h-14 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300"
            style={{
                background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={() => handleLogout()}
        >
            <Facebook size={24} />
            <span className="ml-3">Logout</span>
    </Button>;
}

export default LogoutButton;
