
import { useMemo } from "react";
import { ChatEnvelopFields } from "../utilities/types";

export function useGroupedMessages(messages: ChatEnvelopFields[]) {
    return useMemo(() => {
        const groups = new Map<string, ChatEnvelopFields[]>();

        for (const msg of messages) {
            const sender = msg.sender;
            if (!groups.has(sender)) {
                groups.set(sender, []);
            }
            groups.get(sender)!.push(msg);
        }

        return groups;
    }, [messages]);
}
/*
// web-app/src/useGroupedMessages.ts
import { useMemo } from "react";
import {ChatEnvelopFields} from "../utilities/types.ts";

/!**
 * A hook to process the flat list of message objects from the blockchain
 * into a structured Map of conversations, grouped by sender.
 *!/
export function useGroupedMessages(messages: ChatEnvelopFields[]) {
    return useMemo(() => {
        // We'll group messages by sender address
        const groups = new Map<string, ChatEnvelopFields[]>();

        for (const msg of messages) {
            const sender = msg.sender;

            if (!groups.has(sender)) {
                // If this is the first message from this sender, create an array
                groups.set(sender, []);
            }

            // Add the message to that sender's conversation
            groups.get(sender)!.push(msg);
        }

        // The 'messages' are already sorted newest-to-oldest,
        // so the conversation arrays are also sorted.
        return groups;
    }, [messages]);
}
*/
