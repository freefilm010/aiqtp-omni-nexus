#!/usr/bin/env python3
"""
gasless-bot/army/dashboard.py
=============================
Real-time web dashboard for the bot army.
Receives metrics from the orchestrator and serves a live web UI.
"""

import os
import json
import logging
from flask import Flask, jsonify, request, send_from_directory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Dashboard] %(message)s")
log = logging.getLogger("dashboard")

app = Flask(__name__, static_folder=None)

# In-memory metrics store. In production, replace with Redis or a proper DB.
METRICS = {
    "total_bots": 0,
    "scanned_per_min": 0,
    "profitable_trades": 0,
    "total_profit_usd": 0.0,
    "profit_per_chain": {},
    "profit_per_pair": {},
    "success_rate": 0.0,
    "recent_activity": []
}

@app.route("/")
def index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")

@app.route("/api/metrics", methods=["GET", "POST"])
def metrics_endpoint():
    global METRICS
    if request.method == "POST":
        data = request.get_json()
        if data:
            METRICS = data
        return jsonify({"status": "ok"})
    return jsonify(METRICS)

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "bot-army-dashboard"})

if __name__ == "__main__":
    port = int(os.getenv("DASHBOARD_PORT", "5000"))
    log.info(f"Starting dashboard on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
