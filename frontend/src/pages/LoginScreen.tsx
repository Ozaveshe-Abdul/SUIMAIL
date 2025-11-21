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
    // const facebookWallet = walletsByProvider.get('facebook');

    // If already connected, show address (or hide this component entirely)
    // if (currentAccount) {
    //     return (
    //         <Flex direction="column" gap="2" align="center" justify="center" p="6">
    //             <Text size="3" weight="medium" className="text-gray-300">
    //                 Connected
    //             </Text>
    //             <Text size="2" className="text-gray-500 font-mono">
    //                 {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
    //             </Text>
    //             <LogoutButton />
    //         </Flex>
    //     );
    // }

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

/*
<Box
    className="min-h-screen"
    style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0b2e 100%)',
    }}
>
    <Flex
        direction="column"
        align="center"
        justify="center"
        gap="8"
        className="min-h-screen px-6"
    >
        {/!* Logo / Title *!/}
        <Flex direction="column" align="center" gap="3">
            <Heading size="8" weight="bold" className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                ChainMail
            </Heading>
            <Text size="4" className="text-gray-400">
                Private. On-chain. Instant.
            </Text>
        </Flex>

        {/!* Tagline *!/}
        <Text size="5" align="center" className="text-gray-300 max-w-80 max-w-md">
            The first fully encrypted, gas-free, wallet-linked messenger on Sui.
        </Text>

        {/!* Login Buttons *!/}
        <Flex direction="column" gap="4" className="w-full max-w-xs">
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

            {facebookWallet && (
                <Button
                    size="4"
                    variant="solid"
                    className="h-14 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300"
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                    onClick={() => connect({ wallet: facebookWallet })}
                >
                    <Facebook size={24} />
                    <span className="ml-3">Continue with Facebook</span>
                </Button>
            )}
        </Flex>

        {/!* Footer *!/}
        <Text size="2" className="text-gray-600">
            Powered by Enoki • zkLogin • Sui Stack
        </Text>
    </Flex>
</Box>*/
