// src/components/LoginScreen.tsx
import { useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { isEnokiWallet, AuthProvider } from '@mysten/enoki';
import { Flex, Box, Heading, Text, Button } from '@radix-ui/themes';
import { Chrome, } from 'lucide-react';
import {Container,} from "@radix-ui/themes";
// import {GradientButton} from "../components/GradientButton.tsx";
import {StyledConnectButton} from "../components/s.tsx";

export function LoginScreen() {
    // const currentAccount = useCurrentAccount();
    const { mutate: connect } = useConnectWallet();

    const wallets = useWallets().filter(isEnokiWallet);
    const walletsByProvider = wallets.reduce(
        (map, wallet) => map.set(wallet.provider, wallet),
        new Map<AuthProvider, any>()
    );

    const googleWallet = walletsByProvider.get('google');

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
                        <strong>Private, encrypted,</strong> on-chain, <strong>gas-free</strong> messaging. <br/>
                        Experience the first instant, <strong>wallet-linked</strong> messenger on Sui
                    </Text>

                    {googleWallet && (
                        <Button
                            size="4"
                            variant="solid"
                            className="h-14 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                            }}
                            onClick={() => connect({ wallet: googleWallet })}
                        >
                            <Chrome size={24} />
                            <span className="ml-3">Continue with Google</span>
                        </Button>
                    )}
                    <StyledConnectButton/>
                    <Text size="2" className="text-gray-600">
                        Powered by Enoki • zkLogin • Sui Stack
                    </Text>
                </Flex>
            </Container>
        </Box>
    );
}
