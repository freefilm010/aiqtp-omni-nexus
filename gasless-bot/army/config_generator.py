#!/usr/bin/env python3
"""
gasless-bot/army/config_generator.py
====================================
Generates configurations for thousands of bot instances covering
combinations of chains, DEX routes, and token pairs.
"""

import json
import os
import itertools

# Supported chains and their RPCs (placeholders for env vars)
CHAINS = {
    "arbitrum": {"chain_id": 42161, "rpc_env": "ARBITRUM_RPC_URL"},
    "optimism": {"chain_id": 10, "rpc_env": "OPTIMISM_RPC_URL"},
    "base": {"chain_id": 8453, "rpc_env": "BASE_RPC_URL"},
    "polygon": {"chain_id": 137, "rpc_env": "POLYGON_RPC_URL"},
}

# Supported DEXes per chain (simplified for generation)
DEXES = {
    "arbitrum": ["uniswap_v3", "sushiswap", "camelot", "balancer"],
    "optimism": ["uniswap_v3", "velodrome", "curve"],
    "base": ["uniswap_v3", "aerodrome", "baseswap"],
    "polygon": ["uniswap_v3", "quickswap", "sushiswap"],
}

# Common token pairs to scan
TOKEN_PAIRS = [
    ("USDC", "WETH"),
    ("USDC", "WBTC"),
    ("WETH", "WBTC"),
    ("USDC", "ARB"),
    ("WETH", "ARB"),
    ("USDC", "LINK"),
    ("USDC", "UNI"),
    ("WETH", "GMX"),
]

# Flash loan sizes in USD
LOAN_SIZES = [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000]

def generate_configs(output_dir="configs"):
    os.makedirs(output_dir, exist_ok=True)
    
    configs = []
    instance_id = 1
    
    for chain, chain_info in CHAINS.items():
        available_dexes = DEXES[chain]
        
        # Generate pairs of DEXes for arbitrage
        dex_pairs = list(itertools.combinations(available_dexes, 2))
        if not dex_pairs:
            continue
            
        for dex_a, dex_b in dex_pairs:
            for token_a, token_b in TOKEN_PAIRS:
                # Create a config for this specific combination
                config = {
                    "instance_id": f"bot_{instance_id:05d}",
                    "chain": chain,
                    "chain_id": chain_info["chain_id"],
                    "rpc_env": chain_info["rpc_env"],
                    "dex_a": dex_a,
                    "dex_b": dex_b,
                    "token_a": token_a,
                    "token_b": token_b,
                    "loan_sizes_usd": LOAN_SIZES,
                    "min_profit_usd": 10.0,
                    "scan_interval_sec": 12
                }
                
                configs.append(config)
                
                # Save individual config file
                with open(os.path.join(output_dir, f"{config['instance_id']}.json"), "w") as f:
                    json.dump(config, f, indent=2)
                    
                instance_id += 1
                
    # Save master index
    with open(os.path.join(output_dir, "master_index.json"), "w") as f:
        json.dump({"total_instances": len(configs), "instances": [c["instance_id"] for c in configs]}, f, indent=2)
        
    print(f"Generated {len(configs)} bot configurations in '{output_dir}/'")
    return configs

if __name__ == "__main__":
    generate_configs()
