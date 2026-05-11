// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  FlashLoanArbExecutor  –  Arbitrum Mainnet
//
//  Executes two strategies entirely within a single Aave V3
//  flash loan callback, so no upfront capital is required:
//
//    1. DEX Arbitrage  – borrow asset, buy low on DEX-A,
//                        sell high on DEX-B, repay loan + fee,
//                        keep the spread.
//
//    2. Liquidation    – borrow debt asset, call Aave
//                        liquidationCall to seize collateral
//                        at a discount, swap collateral back
//                        to debt asset, repay loan + fee,
//                        keep the liquidation bonus.
//
//  Gas is sponsored by a Pimlico Verifying Paymaster via the
//  ERC-4337 EntryPoint; the owner EOA never needs ETH.
// ============================================================

// ─────────────────────────────────────────────────────────────
//  Minimal ERC-20 interface
// ─────────────────────────────────────────────────────────────
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// ─────────────────────────────────────────────────────────────
//  Aave V3 Pool (only the two methods we call)
// ─────────────────────────────────────────────────────────────
interface IAavePool {
    /**
     * @notice Borrow `amount` of `asset` for one transaction.
     *         The receiver must implement executeOperation().
     */
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;

    /**
     * @notice Liquidate an undercollateralised position.
     *         Caller must have approved this contract to spend
     *         at least `debtToCover` of `debtAsset`.
     */
    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool    receiveAToken
    ) external;
}

// ─────────────────────────────────────────────────────────────
//  Uniswap V3 SwapRouter  (same ABI used by SushiSwap V3 fork)
// ─────────────────────────────────────────────────────────────
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24  fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

// ─────────────────────────────────────────────────────────────
//  FlashLoanArbExecutor
// ─────────────────────────────────────────────────────────────
contract FlashLoanArbExecutor {

    // ── Immutable addresses ──────────────────────────────────

    /// @notice Aave V3 Pool on Arbitrum
    address public constant AAVE_POOL    = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    /// @notice Uniswap V3 SwapRouter on Arbitrum
    address public constant UNI_ROUTER   = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    /// @notice SushiSwap Router on Arbitrum
    address public constant SUSHI_ROUTER = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;

    IAavePool   private immutable _aavePool;
    ISwapRouter private immutable _uniRouter;
    ISwapRouter private immutable _sushiRouter;

    // ── Ownership ────────────────────────────────────────────

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "FlashLoanArbExecutor: caller is not owner");
        _;
    }

    // ── Operation type tags ──────────────────────────────────

    uint8 private constant OP_ARB = 1;
    uint8 private constant OP_LIQ = 2;

    // ── Events ───────────────────────────────────────────────

    event ArbExecuted(
        address indexed borrowAsset,
        address indexed midToken,
        uint256         borrowed,
        uint256         profit
    );

    event LiquidationExecuted(
        address indexed collateral,
        address indexed debt,
        address indexed liquidatedUser,
        uint256         debtCovered,
        uint256         collateralSeized
    );

    // ── Constructor ──────────────────────────────────────────

    /**
     * @param _pool   Aave V3 Pool address.
     * @param _uni    Uniswap V3 SwapRouter address.
     * @param _sushi  SushiSwap Router address.
     *
     * After deployment, call transferOwnership() to hand control
     * to the ERC-4337 Smart Account that will operate the bot.
     */
    constructor(address _pool, address _uni, address _sushi) {
        owner       = msg.sender;
        _aavePool   = IAavePool(_pool);
        _uniRouter  = ISwapRouter(_uni);
        _sushiRouter = ISwapRouter(_sushi);
    }

    // ── Public entry points (called via ERC-4337 UserOp) ─────

    /**
     * @notice Flash-loan `amount` of `asset`, execute a two-leg
     *         DEX arbitrage, repay the loan, and keep the profit.
     *
     * @param asset          Token to borrow (e.g. USDC, WETH).
     * @param amount         Amount to borrow (in token's decimals).
     * @param midToken       Intermediate token for the swap pair.
     * @param poolFee        Uniswap V3 fee tier: 500, 3000, or 10000.
     * @param startOnUniswap true  → buy on Uniswap, sell on SushiSwap.
     *                       false → buy on SushiSwap, sell on Uniswap.
     */
    function executeArbitrage(
        address asset,
        uint256 amount,
        address midToken,
        uint24  poolFee,
        bool    startOnUniswap
    ) external onlyOwner {
        bytes memory params = abi.encode(OP_ARB, midToken, poolFee, startOnUniswap);
        _aavePool.flashLoanSimple(address(this), asset, amount, params, 0);
    }

    /**
     * @notice Flash-loan `debtAmount` of `debtAsset`, liquidate
     *         `userToLiquidate` on Aave V3, swap the seized
     *         collateral back to `debtAsset`, repay the loan,
     *         and keep the liquidation bonus.
     *
     * @param debtAsset       Token the borrower owes.
     * @param debtAmount      Amount to cover (≤ 50 % of total debt).
     * @param collateralAsset Collateral token to receive as bonus.
     * @param userToLiquidate Address of the undercollateralised user.
     */
    function executeLiquidation(
        address debtAsset,
        uint256 debtAmount,
        address collateralAsset,
        address userToLiquidate
    ) external onlyOwner {
        bytes memory params = abi.encode(OP_LIQ, collateralAsset, userToLiquidate, debtAmount);
        _aavePool.flashLoanSimple(address(this), debtAsset, debtAmount, params, 0);
    }

    // ── Aave V3 flash-loan callback ──────────────────────────

    /**
     * @notice Invoked by the Aave Pool immediately after transferring
     *         funds.  Must approve the pool for `amount + premium`
     *         before returning true.
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender  == address(_aavePool), "Caller is not Aave Pool");
        require(initiator   == address(this),      "Initiator is not this contract");

        uint8 opType = abi.decode(params, (uint8));

        if (opType == OP_ARB) {
            (, address midToken, uint24 poolFee, bool startOnUniswap)
                = abi.decode(params, (uint8, address, uint24, bool));
            _doArbitrage(asset, amount, midToken, poolFee, startOnUniswap);

        } else if (opType == OP_LIQ) {
            (, address collateralAsset, address user, uint256 debtAmount)
                = abi.decode(params, (uint8, address, address, uint256));
            _doLiquidation(asset, debtAmount, collateralAsset, user);

        } else {
            revert("Unknown operation type");
        }

        // Approve Aave to pull repayment (borrowed amount + 0.05 % fee)
        uint256 repay = amount + premium;
        require(
            IERC20(asset).balanceOf(address(this)) >= repay,
            "Insufficient balance to repay flash loan"
        );
        IERC20(asset).approve(address(_aavePool), repay);

        return true;
    }

    // ── Internal: arbitrage ──────────────────────────────────

    function _doArbitrage(
        address asset,
        uint256 amount,
        address midToken,
        uint24  poolFee,
        bool    startOnUniswap
    ) internal {
        // Approve both routers upfront
        _safeApproveMax(asset,    address(_uniRouter));
        _safeApproveMax(asset,    address(_sushiRouter));
        _safeApproveMax(midToken, address(_uniRouter));
        _safeApproveMax(midToken, address(_sushiRouter));

        uint256 assetBefore = IERC20(asset).balanceOf(address(this));

        uint256 midAmount;
        if (startOnUniswap) {
            midAmount = _swap(_uniRouter,   asset,    midToken, poolFee, amount);
            _swap(_sushiRouter, midToken, asset,    poolFee, midAmount);
        } else {
            midAmount = _swap(_sushiRouter, asset,    midToken, poolFee, amount);
            _swap(_uniRouter,   midToken, asset,    poolFee, midAmount);
        }

        uint256 assetAfter = IERC20(asset).balanceOf(address(this));
        uint256 profit = assetAfter > assetBefore ? assetAfter - assetBefore : 0;

        emit ArbExecuted(asset, midToken, amount, profit);
    }

    // ── Internal: liquidation ────────────────────────────────

    function _doLiquidation(
        address debtAsset,
        uint256 debtAmount,
        address collateralAsset,
        address user
    ) internal {
        // Allow Aave Pool to pull the debt repayment from this contract
        _safeApproveMax(debtAsset, address(_aavePool));

        uint256 collBefore = IERC20(collateralAsset).balanceOf(address(this));

        // Liquidate: repay `debtAmount` of `debtAsset`, receive
        // `collateralAsset` + liquidation bonus (typically 5–10 %)
        _aavePool.liquidationCall(
            collateralAsset,
            debtAsset,
            user,
            debtAmount,
            false   // receive underlying token, not aToken
        );

        uint256 collReceived =
            IERC20(collateralAsset).balanceOf(address(this)) - collBefore;

        emit LiquidationExecuted(
            collateralAsset, debtAsset, user, debtAmount, collReceived
        );

        // Swap collateral → debtAsset to fund flash-loan repayment
        if (collateralAsset != debtAsset && collReceived > 0) {
            _safeApproveMax(collateralAsset, address(_uniRouter));
            // Use 3000 (0.3 %) pool; bot can override via a more
            // sophisticated routing strategy if needed
            _swap(_uniRouter, collateralAsset, debtAsset, 3000, collReceived);
        }
    }

    // ── Internal: helpers ────────────────────────────────────

    function _swap(
        ISwapRouter router,
        address     tokenIn,
        address     tokenOut,
        uint24      fee,
        uint256     amountIn
    ) internal returns (uint256 amountOut) {
        amountOut = router.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn:           tokenIn,
                tokenOut:          tokenOut,
                fee:               fee,
                recipient:         address(this),
                deadline:          block.timestamp,
                amountIn:          amountIn,
                amountOutMinimum:  0,   // slippage checked off-chain before submission
                sqrtPriceLimitX96: 0
            })
        );
    }

    function _safeApproveMax(address token, address spender) internal {
        // Only approve if we actually hold some tokens (avoids wasted gas)
        if (IERC20(token).balanceOf(address(this)) > 0) {
            IERC20(token).approve(spender, type(uint256).max);
        }
    }

    // ── Profit withdrawal ────────────────────────────────────

    /**
     * @notice Transfer the entire ERC-20 balance to the owner.
     *         Call this after each successful operation to sweep profits.
     */
    function withdraw(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "Nothing to withdraw");
        IERC20(token).transfer(owner, bal);
    }

    /// @notice Rescue any ETH accidentally sent to this contract.
    function withdrawETH() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No ETH to withdraw");
        payable(owner).transfer(bal);
    }

    // ── Ownership transfer ───────────────────────────────────

    /**
     * @notice Transfer ownership to the ERC-4337 Smart Account so
     *         the bot can call executeArbitrage / executeLiquidation
     *         via UserOperations.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}
