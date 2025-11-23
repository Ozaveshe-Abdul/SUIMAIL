import { useEffect, useRef } from 'react';
import {APP_PACKAGE_ID, baseMessagingClient} from '../services/suiMessagingClient';

type RealTimeMessagesProps = {
    channelId: string | null;
    onNewMessage: () => void;
};

export function useRealTimeMessages({ channelId, onNewMessage }: RealTimeMessagesProps) {
    const client = baseMessagingClient;

    const onNewMessageRef = useRef(onNewMessage);

    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
    }, [onNewMessage]);

    useEffect(() => {
        if (!channelId) return;

        console.log(`🔌 Subscribing to real-time events for channel: ${channelId}`);

        let unsubscribeFn: (() => void) | null = null;

        const subscribe = async () => {
            try {
                const unsubPromise = client.subscribeEvent({
                    filter: {
                        MoveModule: {
                            package: APP_PACKAGE_ID,
                            module: 'message::MessageAddedEvent',
                        },
                    },
                    onMessage: (event) => {
                        console.log("🔔 RAW EVENT RECEIVED:", event); // Debug: see all events

                        const parsedJson = event.parsedJson as any;
                        console.log("📦 Parsed JSON:", parsedJson); // Debug: see structure

                        // Try multiple possible field names
                        const eventChannelId = parsedJson?.channelId
                            || parsedJson?.channel
                            || parsedJson?.channel_Id
                            || parsedJson?.channel_object_id;

                        console.log(`🔍 Event channel: ${eventChannelId}, Current channel: ${channelId}`);

                        if (eventChannelId === channelId) {
                            console.log("✅ Channel match! Triggering refresh...");
                            onNewMessageRef.current();
                        } else {
                            console.log("❌ Channel mismatch, ignoring event");
                        }
                    },
                });

                unsubscribeFn = await unsubPromise;
                console.log("✅ Successfully subscribed to events");
            } catch (error) {
                console.error("❌ Error subscribing to events:", error);
            }
        };

        subscribe();

        return () => {
            console.log(`🔌 Unsubscribing from channel: ${channelId}`);
            if (unsubscribeFn) {
                unsubscribeFn();
            }
        };
    }, [client, channelId]);
}
