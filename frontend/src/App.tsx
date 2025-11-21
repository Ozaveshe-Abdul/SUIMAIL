import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home} from "./pages/Home.tsx";
// import {LoginScreen} from "./pages/LoginScreen.tsx";

function App() {
  return (
    <>

        <BrowserRouter>
            <Routes>
                <Route path="/" Component={Home} />
                {/*<Route path="/login" Component={LoginScreen} />*/}
            </Routes>
        </BrowserRouter>
    </>
  );
}

export default App;

{/*<Flex*/}
{/*  position="sticky"*/}
{/*  px="4"*/}
{/*  py="2"*/}
{/*  justify="between"*/}
{/*  style={{*/}
{/*    borderBottom: "1px solid var(--gray-a2)",*/}
{/*  }}*/}
{/*>*/}
{/*  <Box>*/}
{/*    <Heading>dApp Starter Template</Heading>*/}
{/*  </Box>*/}

{/*  <Box>*/}
{/*    <ConnectButton />*/}
{/*  </Box>*/}
{/*</Flex>*/}
{/*<Container>*/}
{/*<Container*/}
{/*  mt="5"*/}
{/*  pt="2"*/}
{/*  px="4"*/}
{/*  style={{ background: "var(--gray-a2)", minHeight: 500 }}*/}
{/*>*/}

{/*  <WalletStatus />*/}
{/*</Container>*/}

// // (The SDK requires a Keypair object for signing transactions)
// function getKeypair(address: string): Ed25519Keypair {
//     const key = `suimail_keypair_${address}`;
//     const stored = localStorage.getItem(key);
//     if (!stored) throw new Error("Keypair not found");
//     return Ed25519Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored)));
// }

// Helper: Get existing session keypair or generate a new one
// function getOrCreateKeypair(address: string): Ed25519Keypair {
//     const key = `suimail_session_key_${address}`;
//     const stored = localStorage.getItem(key);
//
//     if (stored) {
//         try {
//             return Ed25519Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored)));
//         } catch (e) {
//             console.warn("Invalid keypair found, regenerating...");
//         }
//     }
//
//     const keypair = Ed25519Keypair.generate();
//     localStorage.setItem(key, JSON.stringify(Array.from(keypair.getSecretKey())));
//     return keypair;
// }
