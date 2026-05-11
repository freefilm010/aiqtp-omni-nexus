// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlashLiquidator
 * @notice Aave V3 flash-loan receiver that liquidates an undercollateralized
 *         position on Aave V3 and swaps the seized collateral back to the
 *         debt asset via Uniswap V3, repaying the flash loan and keeping the
 *         spread as profit.
 *
 *         Deploy once per chain, then call `start()` from the Python bot.
 *
 *         Audited? NO. Test on Arbitrum Sepolia before mainnet use.
 */

interface IPool {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;

    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool receiveAToken
    ) external;
}

interface IERC20 {
    function approve(address s, uint256 a) external returns (bool);
    function transfer(address t, uint256 a) external returns (bool);
    function balanceOf(address o) external view returns (uint256);
}

interface ISwapRouter {
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
        external payable returns (uint256 amountOut);
}

contract FlashLiquidator {
    address public immutable owner;
    IPool   public immutable POOL;
    ISwapRouter public immutable ROUTER;

    constructor(address _pool, address _router) {
        owner  = msg.sender;
        POOL   = IPool(_pool);
        ROUTER = ISwapRouter(_router);
    }

    modifier onlyOwner() { require(msg.sender == owner, "not-owner"); _; }

    /// Kick off the liquidation. `params` packs collateral, victim, fee tier.
    function start(
        address debtAsset,
        uint256 debtAmount,
        address collateralAsset,
        address victim,
        uint24  swapFee
    ) external onlyOwner {
        address[] memory assets   = new address[](1);
        uint256[] memory amounts  = new uint256[](1);
        uint256[] memory modes    = new uint256[](1);
        assets[0]  = debtAsset;
        amounts[0] = debtAmount;
        modes[0]   = 0; // no debt, must repay in same tx

        bytes memory params = abi.encode(collateralAsset, victim, swapFee);
        POOL.flashLoan(address(this), assets, amounts, modes, address(this), params, 0);
    }

    /// Aave V3 callback.
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address /*initiator*/,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == address(POOL), "bad-caller");
        (address collateralAsset, address victim, uint24 swapFee) =
            abi.decode(params, (address, address, uint24));

        // 1. Approve pool to pull debt amount, then liquidate.
        IERC20(assets[0]).approve(address(POOL), amounts[0]);
        POOL.liquidationCall(collateralAsset, assets[0], victim, amounts[0], false);

        // 2. Swap seized collateral -> debt asset via Uniswap V3.
        uint256 seized = IERC20(collateralAsset).balanceOf(address(this));
        IERC20(collateralAsset).approve(address(ROUTER), seized);
        ROUTER.exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: collateralAsset,
            tokenOut: assets[0],
            fee: swapFee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: seized,
            amountOutMinimum: amounts[0] + premiums[0], // must cover repayment
            sqrtPriceLimitX96: 0
        }));

        // 3. Approve pool to pull repayment.
        IERC20(assets[0]).approve(address(POOL), amounts[0] + premiums[0]);
        return true;
    }

    function sweep(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, bal);
    }

    function sweepETH() external onlyOwner {
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "eth-sweep-fail");
    }

    receive() external payable {}
}
