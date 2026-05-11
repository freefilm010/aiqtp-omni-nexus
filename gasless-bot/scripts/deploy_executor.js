/**
 * scripts/deploy_executor.js
 * ==========================
 * Hardhat script to deploy FlashLoanArbExecutor on Arbitrum Mainnet.
 *
 * Usage:
 *   cd gasless-bot
 *   npm install
 *   npx hardhat run scripts/deploy_executor.js --network arbitrum
 *
 * After deployment:
 *   1. Note the printed contract address.
 *   2. Set EXECUTOR_ADDRESS in your .env.
 *   3. Call transferOwnership(<SMART_ACCOUNT_ADDRESS>) on the contract
 *      so the ERC-4337 Smart Account can call executeArbitrage /
 *      executeLiquidation.
 *
 * The deployer EOA pays gas for this one-time deployment.
 * All subsequent bot operations are gasless (paid by Pimlico).
 */

const { ethers } = require("hardhat");

// ── Arbitrum Mainnet addresses ────────────────────────────────
const AAVE_POOL    = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const UNI_ROUTER   = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const SUSHI_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("FlashLoanArbExecutor");
  console.log("Deploying FlashLoanArbExecutor …");

  const executor = await Factory.deploy(AAVE_POOL, UNI_ROUTER, SUSHI_ROUTER);
  await executor.waitForDeployment();

  const address = await executor.getAddress();
  console.log("\n✅ FlashLoanArbExecutor deployed at:", address);
  console.log("\nNext steps:");
  console.log("  1. Set EXECUTOR_ADDRESS=" + address + " in your .env");
  console.log("  2. Run: python scripts/deploy_smart_account.py");
  console.log("  3. Call transferOwnership(<SMART_ACCOUNT>) on the executor");
  console.log("  4. Run: python bot/bot.py");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
