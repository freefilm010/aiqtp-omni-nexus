import os
import time
import json
import requests
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

# Configuration
RPC_URL = os.getenv("ARBITRUM_RPC_URL", "https://arb1.arbitrum.io/rpc")
PIMLICO_API_KEY = os.getenv("PIMLICO_API_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
EXECUTOR_ADDRESS = os.getenv("EXECUTOR_ADDRESS")

# Addresses on Arbitrum
ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"

# Setup Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = Account.from_key(PRIVATE_KEY)
print(f"Bot starting. EOA Address: {account.address}")

# Load ABIs
with open("../abis/FlashLoanArbExecutor.json", "r") as f:
    executor_abi = json.load(f)
executor_contract = w3.eth.contract(address=EXECUTOR_ADDRESS, abi=executor_abi)

def get_pimlico_bundler_url():
    return f"https://api.pimlico.io/v2/arbitrum/rpc?apikey={PIMLICO_API_KEY}"

def scan_arbitrage_opportunities():
    # Mock logic for scanning DEXes
    # In a real bot, you would query Uniswap/Sushiswap quoter contracts
    print("Scanning for arbitrage opportunities...")
    return None

def scan_liquidation_opportunities():
    # Mock logic for scanning Aave positions
    # In a real bot, you would query Aave subgraph or contract for health factors < 1
    print("Scanning for liquidation opportunities...")
    return None

def build_and_send_user_op(target, data):
    print(f"Building UserOperation for target {target}...")
    
    # This is a simplified UserOperation builder.
    # In a production environment, you would use a library like userop-python
    # or interact with a Smart Account SDK to properly format the UserOp,
    # sign it, and request paymaster sponsorship.
    
    bundler_url = get_pimlico_bundler_url()
    
    # 1. Construct UserOp (mocked for brevity)
    user_op = {
        "sender": account.address, # Should be the Smart Account address
        "nonce": "0x0",
        "initCode": "0x",
        "callData": data,
        "callGasLimit": "0x100000",
        "verificationGasLimit": "0x100000",
        "preVerificationGas": "0x10000",
        "maxFeePerGas": "0x100000000",
        "maxPriorityFeePerGas": "0x100000000",
        "paymasterAndData": "0x", # Will be filled by Pimlico
        "signature": "0x"
    }
    
    # 2. Request Paymaster Sponsorship from Pimlico
    print("Requesting paymaster sponsorship from Pimlico...")
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "pm_sponsorUserOperation",
        "params": [user_op, ENTRYPOINT_V07]
    }
    
    try:
        response = requests.post(bundler_url, json=payload)
        result = response.json()
        if "result" in result:
            user_op["paymasterAndData"] = result["result"]["paymasterAndData"]
            user_op["preVerificationGas"] = result["result"]["preVerificationGas"]
            user_op["verificationGasLimit"] = result["result"]["verificationGasLimit"]
            user_op["callGasLimit"] = result["result"]["callGasLimit"]
            print("Sponsorship received!")
        else:
            print(f"Paymaster error: {result}")
            return
    except Exception as e:
        print(f"Error contacting paymaster: {e}")
        return

    # 3. Sign UserOp
    # (Mocked signature - requires proper EIP-712 signing for the specific Smart Account)
    user_op["signature"] = "0x" + "00" * 65 

    # 4. Send UserOp to Bundler
    print("Sending UserOperation to bundler...")
    send_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_sendUserOperation",
        "params": [user_op, ENTRYPOINT_V07]
    }
    
    try:
        response = requests.post(bundler_url, json=send_payload)
        result = response.json()
        if "result" in result:
            print(f"UserOperation submitted! Hash: {result['result']}")
        else:
            print(f"Bundler error: {result}")
    except Exception as e:
        print(f"Error sending to bundler: {e}")

def main():
    print("Gasless Flash Loan Bot Started")
    print(f"Using Executor Contract: {EXECUTOR_ADDRESS}")
    
    while True:
        try:
            arb_opp = scan_arbitrage_opportunities()
            if arb_opp:
                print(f"Found Arbitrage: {arb_opp}")
                # Build calldata for executeArbitrage
                calldata = executor_contract.encodeABI(fn_name="executeArbitrage", args=[
                    arb_opp['asset'],
                    arb_opp['amount'],
                    arb_opp['targetToken'],
                    arb_opp['poolFee'],
                    arb_opp['startOnUniswap']
                ])
                build_and_send_user_op(EXECUTOR_ADDRESS, calldata)
                
            liq_opp = scan_liquidation_opportunities()
            if liq_opp:
                print(f"Found Liquidation: {liq_opp}")
                # Build calldata for executeLiquidation
                calldata = executor_contract.encodeABI(fn_name="executeLiquidation", args=[
                    liq_opp['debtAsset'],
                    liq_opp['debtAmount'],
                    liq_opp['collateralAsset'],
                    liq_opp['userToLiquidate']
                ])
                build_and_send_user_op(EXECUTOR_ADDRESS, calldata)
                
            time.sleep(10) # Scan every 10 seconds
            
        except Exception as e:
            print(f"Error in main loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
