#!/usr/bin/env python3
"""
gasless-bot/army/orchestrator.py
================================
Multi-instance orchestrator with auto-scaling worker pool.
Spawns and manages bot instances based on available configurations.
Reports metrics to the dashboard backend.
"""

import os
import sys
import time
import json
import logging
import threading
import multiprocessing
import random
import requests
from concurrent.futures import ProcessPoolExecutor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Orchestrator] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("orchestrator")

# Dashboard API endpoint
DASHBOARD_API = "http://localhost:5000/api/metrics"

# Auto-scaling settings
MIN_WORKERS = 1
MAX_WORKERS = multiprocessing.cpu_count() * 4  # Scale up to 4x CPU cores locally
TARGET_INSTANCES = int(os.getenv("TARGET_INSTANCES", "10")) # Default to 10 for testing

class BotInstance:
    """Simulates a single bot instance running a specific config."""
    def __init__(self, config):
        self.config = config
        self.instance_id = config["instance_id"]
        self.chain = config["chain"]
        self.pair = f"{config['token_a']}/{config['token_b']}"
        self.running = False
        
    def run_iteration(self):
        """Simulate one scan iteration."""
        # Simulate scanning
        time.sleep(random.uniform(0.5, 2.0))
        
        scanned = random.randint(5, 20)
        profitable = 0
        profit_usd = 0.0
        
        # Simulate finding a profitable opportunity (rare)
        if random.random() < 0.05:
            profitable = 1
            profit_usd = random.uniform(10.0, 500.0)
            
        return {
            "instance_id": self.instance_id,
            "chain": self.chain,
            "pair": self.pair,
            "scanned": scanned,
            "profitable": profitable,
            "profit_usd": profit_usd
        }

def worker_task(config):
    """Task executed by the worker pool."""
    bot = BotInstance(config)
    try:
        return bot.run_iteration()
    except Exception as e:
        log.error(f"Error in instance {config['instance_id']}: {e}")
        return None

class Orchestrator:
    def __init__(self, configs_dir="configs"):
        self.configs_dir = configs_dir
        self.configs = self._load_configs()
        self.active_configs = self.configs[:TARGET_INSTANCES]
        self.pool = ProcessPoolExecutor(max_workers=MAX_WORKERS)
        self.running = False
        
        # Metrics state
        self.metrics = {
            "total_bots": len(self.active_configs),
            "scanned_per_min": 0,
            "profitable_trades": 0,
            "total_profit_usd": 0.0,
            "profit_per_chain": {},
            "profit_per_pair": {},
            "success_rate": 0.0,
            "recent_activity": []
        }
        self.total_scanned = 0
        self.start_time = time.time()
        
    def _load_configs(self):
        configs = []
        if not os.path.exists(self.configs_dir):
            log.warning(f"Configs directory {self.configs_dir} not found. Run config_generator.py first.")
            return configs
            
        for filename in os.listdir(self.configs_dir):
            if filename.endswith(".json") and filename != "master_index.json":
                with open(os.path.join(self.configs_dir, filename), "r") as f:
                    configs.append(json.load(f))
        log.info(f"Loaded {len(configs)} configurations.")
        return configs
        
    def _update_metrics(self, results):
        """Aggregate results into global metrics."""
        for res in results:
            if not res:
                continue
                
            self.total_scanned += res["scanned"]
            
            if res["profitable"] > 0:
                self.metrics["profitable_trades"] += res["profitable"]
                self.metrics["total_profit_usd"] += res["profit_usd"]
                
                # Update chain metrics
                chain = res["chain"]
                self.metrics["profit_per_chain"][chain] = self.metrics["profit_per_chain"].get(chain, 0.0) + res["profit_usd"]
                
                # Update pair metrics
                pair = res["pair"]
                self.metrics["profit_per_pair"][pair] = self.metrics["profit_per_pair"].get(pair, 0.0) + res["profit_usd"]
                
                # Add to activity feed
                activity = {
                    "timestamp": time.time(),
                    "instance": res["instance_id"],
                    "chain": chain,
                    "pair": pair,
                    "profit": res["profit_usd"]
                }
                self.metrics["recent_activity"].insert(0, activity)
                self.metrics["recent_activity"] = self.metrics["recent_activity"][:50] # Keep last 50
                
        # Calculate rates
        elapsed_min = (time.time() - self.start_time) / 60.0
        if elapsed_min > 0:
            self.metrics["scanned_per_min"] = int(self.total_scanned / elapsed_min)
            
        if self.total_scanned > 0:
            self.metrics["success_rate"] = (self.metrics["profitable_trades"] / self.total_scanned) * 100.0
            
    def _report_metrics(self):
        """Send metrics to the dashboard backend."""
        try:
            requests.post(DASHBOARD_API, json=self.metrics, timeout=2)
        except requests.exceptions.RequestException:
            pass # Dashboard might not be running yet
            
    def _auto_scale(self):
        """Adjust the number of active instances based on performance."""
        # Simple auto-scaling logic: if success rate is high, scale up; if low, scale down
        # In a real scenario, this would depend on RPC limits, CPU usage, and actual profitability
        current = len(self.active_configs)
        
        if self.metrics["success_rate"] > 1.0 and current < len(self.configs):
            # Scale up
            new_target = min(current + 10, len(self.configs))
            self.active_configs = self.configs[:new_target]
            self.metrics["total_bots"] = new_target
            log.info(f"Auto-scaling UP: {current} -> {new_target} instances")
        elif self.metrics["success_rate"] < 0.1 and current > MIN_WORKERS:
            # Scale down
            new_target = max(current - 5, MIN_WORKERS)
            self.active_configs = self.configs[:new_target]
            self.metrics["total_bots"] = new_target
            log.info(f"Auto-scaling DOWN: {current} -> {new_target} instances")
            
    def start(self):
        if not self.configs:
            log.error("No configs available. Exiting.")
            return
            
        self.running = True
        log.info(f"Starting orchestrator with {len(self.active_configs)} initial instances.")
        log.info(f"Worker pool size: {MAX_WORKERS}")
        
        iteration = 0
        while self.running:
            try:
                # Dispatch tasks to worker pool
                results = list(self.pool.map(worker_task, self.active_configs))
                
                # Process results
                self._update_metrics(results)
                self._report_metrics()
                
                iteration += 1
                if iteration % 10 == 0:
                    self._auto_scale()
                    log.info(f"Metrics: {self.metrics['profitable_trades']} trades | ${self.metrics['total_profit_usd']:.2f} profit | {self.metrics['scanned_per_min']} scans/min")
                    
                time.sleep(1) # Brief pause between global iterations
                
            except KeyboardInterrupt:
                log.info("Shutting down orchestrator...")
                self.running = False
            except Exception as e:
                log.error(f"Orchestrator error: {e}")
                time.sleep(5)
                
        self.pool.shutdown(wait=True)
        log.info("Orchestrator stopped.")

if __name__ == "__main__":
    # Ensure configs exist
    if not os.path.exists("configs"):
        import config_generator
        config_generator.generate_configs()
        
    orchestrator = Orchestrator()
    orchestrator.start()
