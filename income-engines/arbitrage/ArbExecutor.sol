// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArbExecutor
 * @notice Atomic cross-DEX arbitrage helper using Balancer V2 flash loans
 *         (zero-fee on Arbitrum). The Python bot decides which DEX is cheap
 *         and which is rich, then calls `start()` with both swap calldatas.
 *
 *         Each `swapCalldata` is encoded for the target router (Uniswap V3,
 *         SushiSwap, or Camelot). This contract is router-agnostic.
 */

interface IBalancerVault {
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}

interface IERC20 {
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract ArbExecutor {
    address public immutable owner;
    IBalancerVault public immutable VAULT;

    constructor(address _vault) { owner = msg.sender; VAULT = IBalancerVault(_vault); }
    modifier onlyOwner() { require(msg.sender == owner, "no"); _; }

    /// Kick off a flash-loan-funded round trip.
    function start(
        address token,
        uint256 amount,
        address buyRouter,
        bytes calldata buyCall,
        address sellRouter,
        bytes calldata sellCall,
        uint256 minProfit
    ) external onlyOwner {
        address[] memory toks = new address[](1);
        uint256[] memory amts = new uint256[](1);
        toks[0] = token; amts[0] = amount;
        bytes memory data = abi.encode(buyRouter, buyCall, sellRouter, sellCall, minProfit);
        VAULT.flashLoan(address(this), toks, amts, data);
    }

    /// Balancer callback.
    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external {
        require(msg.sender == address(VAULT), "bad");
        (
            address buyRouter, bytes memory buyCall,
            address sellRouter, bytes memory sellCall,
            uint256 minProfit
        ) = abi.decode(userData, (address, bytes, address, bytes, uint256));

        // Leg 1: spend tokens[0] to acquire intermediate asset.
        IERC20(tokens[0]).approve(buyRouter, amounts[0]);
        (bool ok1,) = buyRouter.call(buyCall);
        require(ok1, "buy-fail");

        // Leg 2: sell intermediate asset back into tokens[0].
        // Caller embeds the correct approve+swap in `sellCall`.
        (bool ok2,) = sellRouter.call(sellCall);
        require(ok2, "sell-fail");

        // Verify profit.
        uint256 bal = IERC20(tokens[0]).balanceOf(address(this));
        require(bal >= amounts[0] + feeAmounts[0] + minProfit, "no-profit");

        // Repay flash loan.
        IERC20(tokens[0]).transfer(address(VAULT), amounts[0] + feeAmounts[0]);
    }

    function sweep(address token) external onlyOwner {
        uint256 b = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, b);
    }
}
