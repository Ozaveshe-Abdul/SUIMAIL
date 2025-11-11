
import React from "react";
import { Container, Heading, Box, Flex, Text } from "@radix-ui/themes";

export function ChatScreen() {
	const messages: string[] = [
		"Welcome to SuiMail — this is message one.",
		"Here's message two: a short example list.",
		"Final sample message three."
	];

	return (
		<Container my="2">
			<Heading mb="2">Chat</Heading>

			<Flex direction="column" gap="2">
				{messages.map((msg, idx) => (
					<Box
						key={idx}
						style={{
							padding: "8px",
							borderRadius: 6,
							border: "1px solid var(--gray-a3)",
							background: "var(--white)"
						}}
					>
						<Text>{msg}</Text>
					</Box>
				))}
			</Flex>
		</Container>
	);
}

export default ChatScreen;

