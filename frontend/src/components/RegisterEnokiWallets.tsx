import {useSuiClientContext} from "@mysten/dapp-kit";
import {isEnokiNetwork, registerEnokiWallets} from "@mysten/enoki";
import {useEffect} from "react";

export default function RegisterEnokiWallets() {
    const { client, network } = useSuiClientContext();

    useEffect(() => {
        if (!isEnokiNetwork(network)) return;

        const { unregister } = registerEnokiWallets({
            apiKey: import.meta.env.VITE_ENOKI_PUBLIC_KEY,
            providers: {
                // Provide the client IDs for each of the auth providers you want to use:
                google: {
                    clientId: import.meta.env.VITE_GOOGLE_KEY,
                },
                facebook: {
                    clientId: 'YOUR_FACEBOOK_CLIENT_ID',
                },
                twitch: {
                    clientId: 'YOUR_TWITCH_CLIENT_ID',
                },
            },
            client,
            network,
        });

        return unregister;
    }, [client, network]);

    return null;
}
