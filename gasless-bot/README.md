# Gasless Flash-Loan Arbitrage & Liquidation Bot

A fully functional, **zero-ETH-required** MEV bot for **Arbitrum Mainnet** that combines:

- **ERC-4337 Account Abstraction** — all transactions are `UserOperation`s submitted through a Smart Contract Account (SCA).
- **Pimlico Verifying Paymaster** — sponsors 100 % of gas fees; the owner wallet needs no ETH.
- **Aave V3 Flash Loans** — provide the capital for every trade; no upfront funds required.
- **DEX Arbitrage** — atomic two-leg swaps between Uniswap V3 and SushiSwap.
- **Aave V3 Liquidations** — repay undercollateralised debt, collect the protocol-defined liquidation bonus (5–10 %).

---

## Architecture

```
Owner EOA (no ETH needed)
        │
        │  signs UserOperation
        ▼
Pimlico Bundler  ──────────────────────────────────────────────┐
        │                                                       │
        │  submits on-chain tx                                  │
        ▼                                                       │
ERC-4337 EntryPoint (0x0000000071727De22E5E9d8BAf0edAc6f37da032)
        │                                                       │
        │  verifies + executes                                  │
        ▼                                                       │
SimpleAccount (Smart Contract Account)                         │
        │                                                       │
        │  calls                                                │
        ▼                                                       │
FlashLoanArbExecutor                                           │
        │                                                       │
        ├─ flashLoanSimple() ──► Aave V3 Pool                  │
        │       │                                               │
        │       └─ executeOperation() callback                 │
        │               │                                       │
        │               ├─ [ARB]  swap A→B on Uniswap          │
        │               │         swap B→A on SushiSwap        │
        │               │         repay loan + 0.05 % fee      │
        │               │         keep profit                  │
        │               │                                       │
        │               └─ [LIQ]  liquidationCall() on Aave    │
        │                         receive collateral + bonus   │
        │                         swap collateral → debt asset │
        │                         repay loan + 0.05 % fee      │
        │                         keep bonus                   │
        │                                                       │
        └─ Gas sponsored by Pimlico Paymaster ◄────────────────┘
```

---

## Repository Layout

```
gasless-bot/
├── contracts/
│   └── FlashLoanArbExecutor.sol   # Core Solidity contract
├── abis/
│   └── FlashLoanArbExecutor.json  # ABI for Python bot
├── bot/
│   ├── bot.py                     # Main Python bot
│   └── requirements.txt
├── scripts/
│   ├── deploy_smart_account.py    # Deploy ERC-4337 SimpleAccount (gasless)
│   ├── deploy_executor.js         # Hardhat: deploy FlashLoanArbExecutor
│   └── transfer_ownership.py      # Transfer executor ownership to SCA
├── hardhat/
│   ├── hardhat.config.js
│   └── package.json
├── .env.example                   # Environment variable template
└── README.md
```

---

## Key Contract Addresses (Arbitrum Mainnet)

| Component | Address |
|---|---|
| Aave V3 Pool | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |
| Uniswap V3 SwapRouter | `0xE592427A0AEce92De3Edee1F18E0157C05861564` |
| SushiSwap Router | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |
| Uniswap V3 QuoterV2 | `0x61fFE014bA17989E743c5F6cB21bF9697530B21e` |
| ERC-4337 EntryPoint v0.7 | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| SimpleAccountFactory | `0x9406Cc6185a346906296840746125a0E44976454` |

---

## Setup Instructions

### Prerequisites

- Python 3.9 or later
- Node.js 18 or later + npm
- A **Pimlico API key** — sign up free at [dashboard.pimlico.io](https://dashboard.pimlico.io) (1 M sponsored ops/month on the free tier)
- An Arbitrum RPC URL (public endpoint works; Alchemy/Infura recommended for production)
- A small amount of ETH in the **deployer EOA** for the one-time contract deployment (≈ 0.001 ETH). After that, all bot operations are gasless.

### Step 1 — Clone and configure

```bash
git clone https://github.com/freefilm010/aiqtp-omni-nexus.git
cd aiqtp-omni-nexus/gasless-bot
cp .env.example .env
# Edit .env and fill in ARBITRUM_RPC_URL, PIMLICO_API_KEY, PRIVATE_KEY
```

### Step 2 — Deploy the FlashLoanArbExecutor contract

```bash
cd hardhat
npm install
cd ..
npx hardhat run scripts/deploy_executor.js --network arbitrum --config hardhat/hardhat.config.js
```

Copy the printed address into `.env` as `EXECUTOR_ADDRESS`.

### Step 3 — Deploy the ERC-4337 Smart Account (gasless)

```bash
cd bot
pip install -r requirements.txt
cd ..
python scripts/deploy_smart_account.py
```

This deploys a `SimpleAccount` via a Pimlico-sponsored `UserOperation` — **no ETH required**. Copy the printed address into `.env` as `SMART_ACCOUNT_ADDRESS`.

### Step 4 — Transfer executor ownership to the Smart Account

```bash
python scripts/transfer_ownership.py
```

This is a regular EOA transaction (requires a tiny amount of ETH for gas — approximately 0.00005 ETH). After this, the Smart Account is the executor's owner and can call `executeArbitrage` / `executeLiquidation` via gasless UserOperations.

### Step 5 — Start the bot

```bash
python bot/bot.py
```

The bot will:
1. Fetch live token prices from CoinGecko.
2. Scan Uniswap V3 and SushiSwap quoters for price discrepancies.
3. Query the Aave V3 subgraph for positions with health factor < 1.
4. For any profitable opportunity, build a `UserOperation`, request Pimlico paymaster sponsorship, sign it, and submit it to the bundler.
5. Wait for on-chain confirmation and log the result.
6. Repeat every `SCAN_INTERVAL_SEC` seconds (default: 12 s).

---

## How Flash Loans Work

A flash loan is a special Aave feature that lets you borrow any amount of any supported asset for the duration of a single transaction, with zero collateral, as long as you repay the principal plus a 0.05 % fee before the transaction ends. If you do not repay, the entire transaction reverts — so there is no risk to the protocol.

This bot uses flash loans to:

**Arbitrage** — borrow 100 000 USDC, buy WETH cheaply on Uniswap, sell WETH at a higher price on SushiSwap, repay 100 050 USDC (principal + fee), keep the spread.

**Liquidations** — borrow the exact amount of debt owed by an undercollateralised Aave borrower, call `liquidationCall` to seize their collateral at a 5–10 % discount, swap the collateral back to the debt asset, repay the flash loan, keep the liquidation bonus.

---

## How Gasless Execution Works

ERC-4337 Account Abstraction separates the *signer* (your EOA) from the *gas payer* (the Paymaster). The flow is:

1. The bot builds a `UserOperation` — a signed intent to call the executor contract.
2. The bot calls `pm_sponsorUserOperation` on Pimlico's API, which returns a `paymasterAndData` blob that commits Pimlico to paying the gas.
3. The bot signs the `UserOperation` hash with the owner private key.
4. The bot submits the `UserOperation` to the Pimlico bundler via `eth_sendUserOperation`.
5. The bundler packages it into a regular Ethereum transaction, calling `EntryPoint.handleOps()`.
6. The EntryPoint verifies the signature, calls the Smart Account's `execute()`, and charges the Paymaster for gas.

The owner EOA's balance is never touched.

---

## Tuning Parameters

| Variable | Default | Description |
|---|---|---|
| `MIN_ARB_PROFIT_USD` | `10` | Minimum estimated profit to execute an arb |
| `MIN_LIQ_BONUS_USD` | `20` | Minimum estimated bonus to execute a liquidation |
| `SCAN_INTERVAL_SEC` | `12` | Seconds between opportunity scans |
| `MAX_FLASH_LOAN_USD` | `500000` | Maximum flash loan size to attempt |

---

## Security Notes

- Keep your `PRIVATE_KEY` secret. It is only used to sign `UserOperation` hashes — it never submits on-chain transactions directly.
- The `FlashLoanArbExecutor` contract uses `onlyOwner` on all entry points. Only the Smart Account (which only the owner EOA can control) can trigger flash loans.
- The `amountOutMinimum: 0` setting in swap calls means there is no on-chain slippage protection. The bot relies on off-chain simulation (quoter calls) to ensure profitability before submission. For production use, compute a minimum output and pass it to the contract.
- The Aave subgraph may lag behind the chain by a few blocks. A position that appears liquidatable may already have been liquidated by the time your UserOp is included. The transaction will simply revert with no loss.

---

## Disclaimer

This software is provided for educational and experimental purposes. Flash loan arbitrage and liquidations are highly competitive on-chain activities. Profitability is not guaranteed. Always test on a fork before deploying to mainnet.
