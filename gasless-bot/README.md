# Gasless Flash Loan Arbitrage & Liquidation Bot (ERC-4337)

This repository contains a fully functional, gasless flash loan arbitrage and liquidation bot for Arbitrum Mainnet. It leverages ERC-4337 Account Abstraction and the Pimlico Paymaster to sponsor all gas fees, meaning the executing wallet requires **zero ETH**.

## Features
- **ERC-4337 Account Abstraction**: Uses a Smart Contract Account to execute transactions.
- **Gasless Execution**: Pimlico Paymaster sponsors all transaction fees.
- **Aave V3 Flash Loans**: Borrows capital with zero upfront cost.
- **Arbitrage**: Executes atomic swaps between Uniswap V3 and Sushiswap.
- **Liquidations**: Liquidates undercollateralized Aave V3 positions for a bonus.

## Architecture
1. **Smart Contract (`FlashLoanArbExecutor.sol`)**: Handles the Aave flash loan callback, executes the arbitrage or liquidation logic, and repays the loan.
2. **Python Bot (`bot.py`)**: Scans for opportunities, builds ERC-4337 `UserOperations`, requests gas sponsorship from Pimlico, and submits the operations to the bundler.

## Setup Instructions

### 1. Prerequisites
- Python 3.9+
- Node.js & npm (for compiling/deploying contracts, e.g., via Hardhat or Foundry)
- A Pimlico API Key (Free tier available at [pimlico.io](https://pimlico.io))

### 2. Install Dependencies
```bash
cd bot
pip install -r requirements.txt
```

### 3. Configuration
Copy the `.env.example` file to `.env` and fill in your details:
```bash
cp .env.example .env
```
Edit `.env`:
- `ARBITRUM_RPC_URL`: Your Arbitrum RPC endpoint.
- `PIMLICO_API_KEY`: Your Pimlico API key.
- `PRIVATE_KEY`: The private key of the EOA that owns the Smart Account.
- `EXECUTOR_ADDRESS`: The address of your deployed `FlashLoanArbExecutor` contract.

### 4. Deploy the Smart Contract
Deploy `FlashLoanArbExecutor.sol` to Arbitrum Mainnet. You will need to pass the following addresses to the constructor:
- Aave V3 Pool: `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- Uniswap V3 Router: `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- Sushiswap Router: `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506`

*Note: You must deploy this contract using your Smart Account or transfer ownership to it so the bot can call it.*

### 5. Run the Bot
```bash
cd bot
python bot.py
```

## Disclaimer
This bot is provided for educational and experimental purposes. Flash loan arbitrage and liquidations are highly competitive. Ensure you thoroughly test your strategies and understand the risks before deploying significant capital or relying on mainnet execution.
