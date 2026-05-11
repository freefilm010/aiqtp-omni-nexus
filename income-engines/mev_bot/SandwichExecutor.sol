// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SandwichExecutor
 * @notice Single-contract atomic sandwich helper used by the AIQTP MEV bot.
 *         It performs the front-run swap, expects the victim's swap to land
 *         in the same block, and is then called again to back-run.
 *
 *         Two entrypoints are exposed because the bot decides which side
 *         (in/out) of the trade to take after decoding the victim calldata.
 */

interface IERC20 {
    function approve(address s, uint256 a) external returns (bool);
    function transfer(address t, uint256 a) external returns (bool);
    function balanceOf(address o) external view returns (uint256);
}

interface IUniV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory);
}

interface IUniV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata p)
        external payable returns (uint256);
}

contract SandwichExecutor {
    address public immutable owner;
    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "no"); _; }

    /// Generic V2-style front/back swap.
    function v2(
        address router,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    ) external onlyOwner returns (uint256[] memory amts) {
        IERC20(path[0]).approve(router, amountIn);
        amts = IUniV2Router(router).swapExactTokensForTokens(
            amountIn, amountOutMin, path, address(this), block.timestamp
        );
    }

    /// Uniswap V3 single-hop front/back swap.
    function v3(
        address router,
        IUniV3SwapRouter.ExactInputSingleParams calldata p
    ) external onlyOwner returns (uint256 out) {
        IERC20(p.tokenIn).approve(router, p.amountIn);
        out = IUniV3SwapRouter(router).exactInputSingle(p);
    }

    function sweep(address token) external onlyOwner {
        uint256 b = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, b);
    }
    function sweepETH() external onlyOwner {
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "eth");
    }
    receive() external payable {}
}
