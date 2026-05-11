"""
Canonical contract addresses for protocols used by the income engines.

Sources verified against the official docs as of 2025/2026:
  * Aave V3 Arbitrum:  https://docs.aave.com/developers/deployed-contracts/v3-mainnet/arbitrum
  * Uniswap V3:        https://docs.uniswap.org/contracts/v3/reference/deployments
  * SushiSwap Arbitrum:https://docs.sushi.com/docs/Products/Classic%20AMM/Deployment%20Addresses
  * Camelot V2:        https://docs.camelot.exchange/protocol/deployments
"""

# --- Arbitrum One ---------------------------------------------------------

ARBITRUM = {
    # Tokens (canonical / bridged)
    "WETH":   "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    "USDC":   "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",  # native USDC
    "USDC_E": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",  # bridged USDC.e
    "USDT":   "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "DAI":    "0xDA10009cbd5D07dd0CeCc66161FC93D7c9000da1",
    "WBTC":   "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    "ARB":    "0x912CE59144191C1204E64559FE8253a0e49E6548",

    # Aave V3
    "AAVE_POOL":          "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "AAVE_DATA_PROVIDER": "0x7F23D86Ee20D869112572136221e173428DD740B",
    "AAVE_ORACLE":        "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",

    # Uniswap V3
    "UNI_V3_ROUTER":  "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "UNI_V3_QUOTER":  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    "UNI_V3_FACTORY": "0x1F98431c8aD98523631AE4a59f267346ea31F984",

    # SushiSwap (V2-style)
    "SUSHI_ROUTER":  "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    "SUSHI_FACTORY": "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",

    # Camelot V2
    "CAMELOT_ROUTER":  "0xc873fEcbd354f5A56E00E710B90EF4201db2448d",
    "CAMELOT_FACTORY": "0x6EcCab422D763aC031210895C81787E87B43A652",

    # Balancer Vault (alt flash-loan source, 0 fee)
    "BALANCER_VAULT": "0xBA12222222228d8Ba445958a75a0704d566BF2C8",

    # GMX V2
    "GMX_V2_READER":  "0xf60becbba223EEA9495Da3f606753867eC10d139",
    "GMX_V2_DATASTORE": "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8",
}

# --- Optimism -------------------------------------------------------------

OPTIMISM = {
    "WETH": "0x4200000000000000000000000000000000000006",
    "USDC": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "AAVE_POOL": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "UNI_V3_ROUTER": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "UNI_V3_QUOTER": "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
}

# --- Base -----------------------------------------------------------------

BASE = {
    "WETH": "0x4200000000000000000000000000000000000006",
    "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "AAVE_POOL": "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    "UNI_V3_ROUTER": "0x2626664c2603336E57B271c5C0b26F421741e481",
    "UNI_V3_QUOTER": "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
}

CHAINS = {"arbitrum": ARBITRUM, "optimism": OPTIMISM, "base": BASE}
