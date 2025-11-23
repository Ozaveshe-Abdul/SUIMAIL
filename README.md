# SUIMAIL
a decentralize messenger on sui blockchain

Here is a concise yet descriptive `README.md` for SuiMail, highlighting its key features and technical stack.

-----

# SuiMail: Decentralized Web3 Messaging

**SuiMail** is a next-generation messaging platform built natively on the Sui blockchain. It combines the seamless user experience of Web2 chat apps with the privacy, security, and ownership of Web3.

Every message is encrypted end-to-end, stored permanently on-chain, and fully owned by the user.

## Key Features

* **🔒 End-to-End Encryption:** All messages and attachments are encrypted using **Seal**, ensuring that only the sender and recipient can ever read them.
* **⚡ Pop-up Free Experience:** Powered by **Enoki** session keys, users sign in once and chat freely without approving every message transaction.
* **💸 Sponsored Transactions:** Gas fees for messaging are sponsored, making the platform completely free for end-users.
* **💰 In-Chat SUI Transfers:** Send SUI directly within a conversation using simple commands (e.g., `#send@5` to send 5 SUI), making payments as easy as sending a text.
* **🗂️ Decentralized Storage:** Message metadata lives on Sui, while large file attachments are stored securely on **Walrus**.
* **📰 Crypto News Feed:** Stay updated with a real-time feed of the latest crypto news directly within the app.
* **🤖 Token-Gated Communities (Coming Soon):** Exclusive group chats that grant automatic access to holders of specific NFTs.

## Technical Stack

SuiMail is built on a cutting-edge Web3 stack:

* **Blockchain:** [Sui Network](https://sui.io/) (Testnet)
* **Frontend:** React, TypeScript, Radix UI, Tailwind CSS
* **Messaging Protocol:** [Sui Stack Messaging SDK](https://github.com/MystenLabs/sui-stack-messaging-sdk)
* **Authentication & Sponsorship:** [Enoki](https://enoki.mystenlabs.com/)
* **Encryption:** [Seal SDK](https://github.com/MystenLabs/seal)
* **Storage:** [Walrus](https://walrus.xyz/)

## Getting Started

### Prerequisites

* Node.js (v18+)
* pnpm
* An [Enoki](https://portal.enoki.mystenlabs.com/) account with API keys.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/suimail.git
    cd suimail
    ```

2.  **Setup Backend:**

    ```bash
    cd backend
    pnpm install
    # Create a .env file and add your Enoki secret key: ENOKI_SECRET_KEY=...
    npm start
    ```

3.  **Setup Frontend:**

    ```bash
    cd ../web-app
    pnpm install
    # Update src/utils/enoki.ts with your Enoki public key.
    pnpm dev
    ```

Your app should now be running on `http://localhost:5173`.

## License

[MIT License](https://www.google.com/search?q=LICENSE)
