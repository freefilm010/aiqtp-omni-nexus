import asyncio
import os
import sys
import types
import unittest
from unittest.mock import AsyncMock, patch

sys.modules.setdefault("httpx", types.SimpleNamespace(AsyncClient=object))

from hummingbot_client import HummingbotClient


class HummingbotClientTests(unittest.TestCase):
    def setUp(self):
        for key in ("HUMMINGBOT_API_URL", "HUMMINGBOT_API_USERNAME", "HUMMINGBOT_API_PASSWORD", "HUMMINGBOT_LIVE_ENABLED"):
            os.environ.pop(key, None)

    def test_unconfigured_status_is_fail_closed(self):
        client = HummingbotClient()
        self.assertFalse(client.configured)
        self.assertFalse(client.live_enabled)
        self.assertEqual(client.public_status()["network"], "not_configured")

    def test_live_control_requires_explicit_gate(self):
        os.environ.update({
            "HUMMINGBOT_API_URL": "http://hummingbot-api:8000",
            "HUMMINGBOT_API_USERNAME": "operator",
            "HUMMINGBOT_API_PASSWORD": "secret",
        })
        client = HummingbotClient()
        client.request = AsyncMock()
        with self.assertRaisesRegex(RuntimeError, "live control is disabled"):
            asyncio.run(client.start_bot("bot-one"))
        client.request.assert_not_awaited()

    def test_health_never_returns_upstream_payload(self):
        os.environ.update({
            "HUMMINGBOT_API_URL": "http://hummingbot-api:8000",
            "HUMMINGBOT_API_USERNAME": "operator",
            "HUMMINGBOT_API_PASSWORD": "secret",
        })
        client = HummingbotClient()
        client.request = AsyncMock(return_value={"sensitive": "not-for-browser"})
        result = asyncio.run(client.health())
        self.assertTrue(result["reachable"])
        self.assertNotIn("upstream", result)


if __name__ == "__main__":
    unittest.main()