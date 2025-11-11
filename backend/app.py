import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Pysui Imports ---
from pysui.sui.sui_pgql.pgql_sync_txn import SuiTransaction
from pysui.sui.sui_pgql.pgql_sync_client import SyncGqlClient
from pysui.sui.sui_pgql.pgql_configs import PysuiConfiguration
from pysui.sui.sui_pgql.pgql_types import SuiSignature
from pysui.sui.sui_pgql import pgql_builders as qn
from pysui.abstracts.client_config import ClientConfiguration

# --- Load Environment Variables ---
load_dotenv()

# --- Initialize Flask App ---
app = Flask(__name__)
# Allow your Vercel frontend to call this API
CORS(app) 

# --- Load Sponsor Wallet ---
# This is the wallet that will pay for all the gas.
# It MUST be funded with Testnet SUI.
try:
    sponsor_key_b64 = os.environ['SPONSOR_PRIVATE_KEY']
    # We create a client configuration from our private key
    sponsor_config = ClientConfiguration.from_keystring(sponsor_key_b64)
    # We build the Sui Client (using GraphQL)
    sponsor_client = SyncGqlClient(pysui_config=PysuiConfiguration(client_config=sponsor_config))
    SPONSOR_ADDRESS = str(sponsor_client.config.active_address)
    print(f"✅ Gas Station is online.")
    print(f"✅ Sponsoring from address: {SPONSOR_ADDRESS}")

except Exception as e:
    print(f"🔥 ERROR: Could not load sponsor wallet. Is SPONSOR_PRIVATE_KEY set in .env?")
    print(e)
    exit()

# --- The Main Sponsor Endpoint ---
@app.route("/sponsor-tx", methods=["POST"])
def sponsor_transaction():
    try:
        data = request.json
        tx_kind_b64 = data.get('tx_kind_b64')
        user_signature_b64 = data.get('user_signature_b64')
        user_address = data.get('user_address')

        if not all([tx_kind_b64, user_signature_b64, user_address]):
            return jsonify({"error": "Missing required fields"}), 400

        # 1. Deserialize the user's gas-less transaction *intent*
        tx_kind_bytes = base64.b64decode(tx_kind_b64)

        # 2. !!! CRITICAL SECURITY CHECK !!!
        # For a hackathon, we trust the intent.
        # For production, you MUST deserialize 'tx_kind_bytes' and verify
        # it *only* calls your 'send_message' or 'create_profile' functions.
        # This prevents spammers from draining your wallet.
        
        # 3. Create a new transaction builder on the server
        txn = SuiTransaction(client=sponsor_client)
        
        # 4. Load the user's intent
        txn.raw_kind(tx_kind_bytes) 
        txn.set_sender(user_address)

        # 5. Set OURSELVES as the sponsor (gas payer)
        txn.signer_block.sponsor = SPONSOR_ADDRESS

        # 6. Build the full transaction & sign it as the SPONSOR
        # This attaches the sponsor's gas coin and signs it.
        tx_dict = txn.build_and_sign()

        # 7. Add the USER'S original signature
        # A sponsored transaction needs BOTH signatures.
        user_signature = SuiSignature(user_signature_b64)
        tx_dict['signatures'].append(user_signature.to_b64())

        # 8. Execute the dual-signed transaction!
        print(f"Executing dual-signed tx for {user_address}...")
        result = sponsor_client.execute_query_node(
            with_node=qn.ExecuteTransaction(**tx_dict)
        )

        if result.is_ok():
            digest = result.result_data.digest
            print(f"✅ Success! Digest: {digest}")
            return jsonify({"digest": digest}), 200
        else:
            print(f"🔥 Execution failed: {result.result_string}")
            return jsonify({"error": result.result_string}), 500

    except Exception as e:
        print(f"🔥 Internal Server Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

# --- Health Check Endpoint ---
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "sponsor_address": SPONSOR_ADDRESS
    }), 200

if __name__ == '__main__':
    # We use port 10000 for Render's default
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 10000), debug=True)