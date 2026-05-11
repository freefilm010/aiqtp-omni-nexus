// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
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

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract FlashLoanArbExecutor {
    address public owner;
    IPool public immutable aavePool;
    ISwapRouter public immutable uniswapRouter;
    ISwapRouter public immutable sushiswapRouter;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _aavePool, address _uniswapRouter, address _sushiswapRouter) {
        owner = msg.sender;
        aavePool = IPool(_aavePool);
        uniswapRouter = ISwapRouter(_uniswapRouter);
        sushiswapRouter = ISwapRouter(_sushiswapRouter);
    }

    // Function to initiate flash loan for arbitrage
    function executeArbitrage(
        address asset,
        uint256 amount,
        address targetToken,
        uint24 poolFee,
        bool startOnUniswap
    ) external onlyOwner {
        bytes memory params = abi.encode(uint8(1), targetToken, poolFee, startOnUniswap);
        aavePool.flashLoanSimple(address(this), asset, amount, params, 0);
    }

    // Function to initiate flash loan for liquidation
    function executeLiquidation(
        address debtAsset,
        uint256 debtAmount,
        address collateralAsset,
        address userToLiquidate
    ) external onlyOwner {
        bytes memory params = abi.encode(uint8(2), collateralAsset, userToLiquidate, debtAmount);
        aavePool.flashLoanSimple(address(this), debtAsset, debtAmount, params, 0);
    }

    // Aave callback
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == address(aavePool), "Caller must be Aave pool");
        
        uint8 operationType = abi.decode(params, (uint8));

        if (operationType == 1) {
            // Arbitrage
            (address targetToken, uint24 poolFee, bool startOnUniswap) = abi.decode(params, (uint8, address, uint24, bool));
            _handleArbitrage(asset, amount, targetToken, poolFee, startOnUniswap);
        } else if (operationType == 2) {
            // Liquidation
            (address collateralAsset, address userToLiquidate, uint256 debtAmount) = abi.decode(params, (uint8, address, address, uint256));
            _handleLiquidation(asset, debtAmount, collateralAsset, userToLiquidate);
        }

        // Approve Aave to pull the borrowed amount + premium
        uint256 amountToReturn = amount + premium;
        IERC20(asset).approve(address(aavePool), amountToReturn);

        return true;
    }

    function _handleArbitrage(
        address asset,
        uint256 amount,
        address targetToken,
        uint24 poolFee,
        bool startOnUniswap
    ) internal {
        // Approve routers
        IERC20(asset).approve(address(uniswapRouter), type(uint256).max);
        IERC20(asset).approve(address(sushiswapRouter), type(uint256).max);
        IERC20(targetToken).approve(address(uniswapRouter), type(uint256).max);
        IERC20(targetToken).approve(address(sushiswapRouter), type(uint256).max);

        uint256 intermediateAmount;
        
        if (startOnUniswap) {
            // Swap asset -> targetToken on Uniswap
            ISwapRouter.ExactInputSingleParams memory params1 = ISwapRouter.ExactInputSingleParams({
                tokenIn: asset,
                tokenOut: targetToken,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            intermediateAmount = uniswapRouter.exactInputSingle(params1);

            // Swap targetToken -> asset on Sushiswap
            ISwapRouter.ExactInputSingleParams memory params2 = ISwapRouter.ExactInputSingleParams({
                tokenIn: targetToken,
                tokenOut: asset,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: intermediateAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            sushiswapRouter.exactInputSingle(params2);
        } else {
            // Swap asset -> targetToken on Sushiswap
            ISwapRouter.ExactInputSingleParams memory params1 = ISwapRouter.ExactInputSingleParams({
                tokenIn: asset,
                tokenOut: targetToken,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            intermediateAmount = sushiswapRouter.exactInputSingle(params1);

            // Swap targetToken -> asset on Uniswap
            ISwapRouter.ExactInputSingleParams memory params2 = ISwapRouter.ExactInputSingleParams({
                tokenIn: targetToken,
                tokenOut: asset,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: intermediateAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            uniswapRouter.exactInputSingle(params2);
        }
    }

    function _handleLiquidation(
        address debtAsset,
        uint256 debtAmount,
        address collateralAsset,
        address userToLiquidate
    ) internal {
        // Approve Aave pool to use debt asset for liquidation
        IERC20(debtAsset).approve(address(aavePool), debtAmount);

        // Liquidate the user
        aavePool.liquidationCall(
            collateralAsset,
            debtAsset,
            userToLiquidate,
            debtAmount,
            false // Receive underlying asset, not aToken
        );

        // Swap received collateral back to debt asset to repay flash loan
        uint256 collateralReceived = IERC20(collateralAsset).balanceOf(address(this));
        
        IERC20(collateralAsset).approve(address(uniswapRouter), collateralReceived);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: collateralAsset,
            tokenOut: debtAsset,
            fee: 3000, // Assuming 0.3% pool for collateral -> debt swap
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: collateralReceived,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        
        uniswapRouter.exactInputSingle(params);
    }

    // Withdraw profits
    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, balance);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
