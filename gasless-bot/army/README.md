# Gasless Bot Army

This directory contains the multi-instance orchestration framework for scaling the gasless flash loan bot across multiple chains, DEXes, and token pairs simultaneously.

## Architecture

The "Army" framework consists of three main components:

1. **Configuration Generator (`config_generator.py`)**: Generates thousands of JSON configuration files covering all profitable combinations of chains (Arbitrum, Optimism, Base, Polygon), DEX routes, and token pairs.
2. **Orchestrator (`orchestrator.py`)**: A multi-processing Python script that spawns a worker pool to run bot instances in parallel. It auto-scales the number of active workers based on success rates and aggregates metrics.
3. **Live Dashboard (`dashboard.py` & `dashboard.html`)**: A real-time Flask + HTML/JS dashboard that visualizes the army's performance, including total profit, profit per chain/pair, and a live activity feed.

## Getting Started

### 1. Pimlico API Key (Required)

To run gasless transactions at scale, you need a Pimlico API key for their Verifying Paymaster and Bundler.

**How to get a key:**
1. Go to [dashboard.pimlico.io](https://dashboard.pimlico.io)
2. Sign up with your email address (requires email verification).
3. Log in to the dashboard.
4. Click "Generate API Key" in the top right.
5. Copy the key and add it to your `.env` file as `PIMLICO_API_KEY`.

*Note: The free tier supports up to 1,000,000 sponsored operations per month. For a large-scale army, you will need to upgrade to a paid tier.*

### 2. Generate Configurations

Run the generator to create the bot configurations:

```bash
python3 config_generator.py
```

This will create a `configs/` directory containing JSON files for each bot instance.

### 3. Start the Dashboard

In a separate terminal, start the metrics dashboard:

```bash
pip install flask
python3 dashboard.py
```

The dashboard will be available at `http://localhost:5000`.

### 4. Start the Orchestrator

Run the orchestrator to begin spawning bot instances:

```bash
# Optional: Set the initial target number of instances (default is 10)
export TARGET_INSTANCES=50
python3 orchestrator.py
```

## Production Deployment (Scaling to 100k+ Instances)

Running 100,000 instances on a single machine is impossible due to CPU, RAM, and RPC rate limits. To scale to this level, you must shard the workload across a distributed cluster.

### Kubernetes / Docker Swarm Architecture

1. **Containerize**: Package the bot and orchestrator into a Docker image.
2. **Redis Metrics**: Replace the in-memory Flask metrics store with a centralized Redis instance.
3. **Sharding**: Modify `orchestrator.py` to accept a shard ID or a subset of configs (e.g., `configs/shard_001/`).
4. **RPC Nodes**: You **must** run your own dedicated RPC nodes (Erigon/Reth) for each chain. Public or standard tier Alchemy/Infura endpoints will rate-limit you instantly at this scale.
5. **Deployment**: Deploy 1,000 pods, each running an orchestrator managing 100 worker threads.

### Safety Warning

The orchestrator is currently configured in **simulation mode** for safety. To enable real on-chain execution, you must integrate the core logic from `../bot/bot.py` into the `BotInstance.run_iteration()` method in `orchestrator.py` and ensure your Smart Account is funded or fully sponsored by Pimlico.
