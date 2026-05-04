"""
Cognitum Node Archetypes — Hardware and Virtual swarm nodes.

# Requirements (pip install):
#   cryptography>=42.0.0

Two concrete node types both derive from CognitumBaseNode (ABC):
  - CognitumHardwareNode  — simulates a USB Cognitum Seed physical device
  - CognitumVirtualNode   — software-only swarm participant
"""

from __future__ import annotations

import asyncio
import hashlib
import platform
import socket
import time
import uuid
from abc import ABC, abstractmethod
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from cognitum.engram_memory import EngramMemory


# ---------------------------------------------------------------------------
# CognitumBaseNode — abstract base
# ---------------------------------------------------------------------------


class CognitumBaseNode(ABC):
    """
    Abstract base for all Cognitum swarm nodes.

    Every node owns an EngramMemory instance and produces Ed25519-signed
    execution logs so that swarm activity is auditable.
    """

    def __init__(self, node_type: str) -> None:
        self.node_id: str = str(uuid.uuid4())
        self.node_type: str = node_type
        self.memory: EngramMemory = EngramMemory()
        self.is_active: bool = False
        self._private_key: Ed25519PrivateKey | None = None
        self._public_key: Ed25519PublicKey | None = None

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    async def process_mempool_event(self, event: dict) -> dict:
        """
        Process a mempool event.

        Returns a signed execution log if the event is profitable,
        otherwise returns an empty dict.
        """

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Activate this node."""
        self.is_active = True

    async def stop(self) -> None:
        """Deactivate this node."""
        self.is_active = False

    # ------------------------------------------------------------------
    # Execution log signing
    # ------------------------------------------------------------------

    def sign_execution_log(self, log: dict) -> dict:
        """
        Attach an Ed25519 signature to *log*.

        The signature covers the canonical string representation of the
        log fields (excluding any previous signature fields), encoded as
        UTF-8 bytes.

        Returns a copy of *log* with two extra fields added:
          - signature   : hex string of the 64-byte Ed25519 signature
          - signed_at   : Unix timestamp of signing
        """
        if self._private_key is None:
            raise RuntimeError(
                f"Node {self.node_id} has no signing key — call start() first."
            )

        # Canonical message: sorted key=value pairs, no sig fields
        exclude = {"signature", "signed_at"}
        message = "|".join(
            f"{k}={v}"
            for k, v in sorted(log.items())
            if k not in exclude
        ).encode("utf-8")

        raw_sig: bytes = self._private_key.sign(message)

        return {
            **log,
            "signature": raw_sig.hex(),
            "signed_at": time.time(),
        }

    # ------------------------------------------------------------------
    # Shared MEV scoring helper
    # ------------------------------------------------------------------

    @staticmethod
    def _score_mev(event: dict) -> tuple[float, float]:
        """
        Return (expected_profit_usdt, gas_cost_usdt) from a raw event dict.
        Falls back to 0.0 for missing fields so scoring is always safe.
        """
        profit = float(event.get("expected_profit_usdt", 0.0))
        gas = float(event.get("gas_cost_usdt", 0.0))
        return profit, gas

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_log(
        node_id: str,
        node_type: str,
        action: str,
        event: dict,
        expected_pnl_usdt: float,
    ) -> dict:
        """Build an unsigned execution log dict."""
        return {
            "timestamp": time.time(),
            "node_id": node_id,
            "node_type": node_type,
            "action": action,
            "symbol": event.get("symbol", ""),
            "side": event.get("side", ""),
            "amount_usdt": float(event.get("amount_usdt", 0.0)),
            "expected_pnl_usdt": expected_pnl_usdt,
        }

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"id={self.node_id[:8]}, "
            f"active={self.is_active}, "
            f"memory={self.memory})"
        )


# ---------------------------------------------------------------------------
# CognitumHardwareNode — simulated USB Cognitum Seed device
# ---------------------------------------------------------------------------


class CognitumHardwareNode(CognitumBaseNode):
    """
    Simulates a physical USB Cognitum Seed hardware device.

    The Ed25519 keypair is generated at init and stored in EngramMemory,
    mimicking a hardware secure element's non-extractable key storage.

    A 50 ms spawn delay on start() simulates USB enumeration latency.
    """

    def __init__(self, device_serial: str | None = None) -> None:
        super().__init__(node_type="hardware")
        self.device_serial: str = device_serial or f"HW-{uuid.uuid4().hex[:12].upper()}"

        # Generate keypair immediately (simulates SE key provisioning at manufacture)
        self._private_key = Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

        # Store public key in engram (SE exports public key only)
        pub_bytes = self._public_key.public_bytes_raw()
        self.memory.store(
            key=f"hw_pubkey_{self.device_serial}",
            value={
                "device_serial": self.device_serial,
                "public_key_hex": pub_bytes.hex(),
                "node_id": self.node_id,
                "usdt_price_anchor": 0.0,
            },
            tier=3,
        )

    async def start(self) -> None:
        """Simulate 50 ms USB enumeration before marking node active."""
        await asyncio.sleep(0.05)
        await super().start()

    async def process_mempool_event(self, event: dict) -> dict:
        """
        Process a mempool event on the hardware node.

        Steps:
          1. Store event in Engram memory (L1, hot).
          2. Score MEV opportunity.
          3. Return signed execution log if net profit > 0, else {}.
        """
        if not self.is_active:
            return {}

        tx_hash = event.get("tx_hash", uuid.uuid4().hex)
        mem_key = f"hw_event_{tx_hash}"
        self.memory.store(
            key=mem_key,
            value={**event, "processed_by": self.node_id},
            tier=1,
        )

        profit, gas = self._score_mev(event)
        net = profit - gas
        if net <= 0.0:
            return {}

        log = self._build_log(
            node_id=self.node_id,
            node_type=self.node_type,
            action="hw_mev_capture",
            event=event,
            expected_pnl_usdt=net,
        )
        log["device_serial"] = self.device_serial
        return self.sign_execution_log(log)

    def hardware_attestation(self) -> dict:
        """
        Return a device certificate dict containing the public key.

        In a real Cognitum Seed device this would be signed by the
        manufacturer root CA. Here we self-sign with the device key.
        """
        if self._public_key is None:
            raise RuntimeError("Keypair not initialised.")

        pub_bytes = self._public_key.public_bytes_raw()
        cert: dict[str, Any] = {
            "device_serial": self.device_serial,
            "node_id": self.node_id,
            "node_type": self.node_type,
            "public_key_hex": pub_bytes.hex(),
            "issued_at": time.time(),
            "issuer": "CognitumSwarm/SelfSigned/v0.1",
        }

        # Sign the cert payload with the device key
        message = "|".join(f"{k}={v}" for k, v in sorted(cert.items())).encode()
        cert["cert_signature"] = self._private_key.sign(message).hex()
        return cert


# ---------------------------------------------------------------------------
# CognitumVirtualNode — software swarm participant
# ---------------------------------------------------------------------------


class CognitumVirtualNode(CognitumBaseNode):
    """
    Software simulation of a Cognitum Seed hardware node.

    Tracks compute_units_contributed — a float that increments with each
    successfully processed mempool event to represent swarm contribution.
    """

    def __init__(self) -> None:
        super().__init__(node_type="virtual")
        self.machine_id: str = self._derive_machine_id()
        self.cpu_cores: int = self._detect_cpu_cores()
        self.gpu_available: bool = self._detect_gpu()
        self.compute_units_contributed: float = 0.0

        # Generate software Ed25519 keypair
        self._private_key = Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

        # Store identity in engram
        pub_bytes = self._public_key.public_bytes_raw()
        self.memory.store(
            key=f"virt_identity_{self.node_id}",
            value={
                "machine_id": self.machine_id,
                "public_key_hex": pub_bytes.hex(),
                "cpu_cores": self.cpu_cores,
                "gpu_available": self.gpu_available,
                "usdt_price_anchor": 0.0,
            },
            tier=3,
        )

    # ------------------------------------------------------------------
    # Machine fingerprinting
    # ------------------------------------------------------------------

    @staticmethod
    def _derive_machine_id() -> str:
        """Derive a stable machine ID from hostname SHA-256 (first 16 hex chars)."""
        hostname = socket.gethostname()
        return hashlib.sha256(hostname.encode()).hexdigest()[:16]

    @staticmethod
    def _detect_cpu_cores() -> int:
        try:
            import os
            return os.cpu_count() or 1
        except Exception:
            return 1

    @staticmethod
    def _detect_gpu() -> bool:
        """
        Heuristic GPU detection — checks for nvidia-smi or CUDA env vars.
        Returns False if detection fails (safe default).
        """
        import os
        import shutil
        return bool(
            shutil.which("nvidia-smi")
            or os.environ.get("CUDA_VISIBLE_DEVICES")
            or os.environ.get("NVIDIA_VISIBLE_DEVICES")
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        await super().start()

    # ------------------------------------------------------------------
    # Core processing
    # ------------------------------------------------------------------

    async def process_mempool_event(self, event: dict) -> dict:
        """
        Process a mempool event on the virtual node.

        Steps:
          1. Store event in Engram memory (L1, hot).
          2. Score MEV opportunity.
          3. If net profit > 0: sign execution log, increment compute units.
          4. Return signed log or {}.
        """
        if not self.is_active:
            return {}

        tx_hash = event.get("tx_hash", uuid.uuid4().hex)
        mem_key = f"virt_event_{tx_hash}"
        self.memory.store(
            key=mem_key,
            value={**event, "processed_by": self.node_id, "machine_id": self.machine_id},
            tier=1,
        )

        profit, gas = self._score_mev(event)
        net = profit - gas
        if net <= 0.0:
            return {}

        log = self._build_log(
            node_id=self.node_id,
            node_type=self.node_type,
            action="virt_mev_capture",
            event=event,
            expected_pnl_usdt=net,
        )
        log["machine_id"] = self.machine_id
        log["compute_units"] = self.compute_units_contributed

        signed = self.sign_execution_log(log)

        # Accrue compute contribution proportional to net profit captured
        self.compute_units_contributed += max(net / 100.0, 0.01)

        return signed

    # ------------------------------------------------------------------
    # Benchmarking
    # ------------------------------------------------------------------

    def benchmark(self) -> dict:
        """
        Run a micro-benchmark and return performance metrics.

        Returns:
          latency_ms          — time in ms to perform 10k hash ops
          throughput_ops_per_sec — hash ops per second
          memory_mb           — resident memory of this process in MB
        """
        import os

        OPS = 10_000
        t0 = time.perf_counter()
        acc = 0
        for i in range(OPS):
            acc ^= hash(i)  # pure-Python hash loop
        elapsed = time.perf_counter() - t0

        latency_ms = (elapsed / OPS) * 1000
        throughput = OPS / elapsed if elapsed > 0 else float("inf")

        # Resident memory via /proc/self/status (Linux) or fallback
        mem_mb = 0.0
        try:
            with open("/proc/self/status") as fh:
                for line in fh:
                    if line.startswith("VmRSS:"):
                        mem_kb = int(line.split()[1])
                        mem_mb = mem_kb / 1024.0
                        break
        except Exception:
            pass

        return {
            "latency_ms": round(latency_ms, 6),
            "throughput_ops_per_sec": round(throughput, 2),
            "memory_mb": round(mem_mb, 2),
        }
