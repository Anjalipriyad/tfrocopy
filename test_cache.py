"""Quick smoke-test for backend/cache.py — run with: python3 test_cache.py"""
import sys
sys.path.insert(0, ".")
from backend.cache import get_cached, set_cached, invalidate, invalidate_all, cache_stats

# 1. Miss on a cold cache
assert get_cached("AAPL") is None, "Expected cache miss"

# 2. Store and hit
set_cached("AAPL", {"score": 42})
result = get_cached("AAPL")
assert result == {"score": 42}, f"Expected hit, got {result}"

# 3. Stats
stats = cache_stats()
assert "AAPL" in stats["cached_keys"]
assert stats["entry_count"] == 1
print("Stats:", stats)

# 4. Single invalidation
removed = invalidate("AAPL")
assert removed is True
assert get_cached("AAPL") is None

# 5. Multi-entry invalidate_all
set_cached("TSLA", {"score": 30})
set_cached("NVDA", {"score": 20})
assert cache_stats()["entry_count"] == 2
n = invalidate_all()
assert n == 2
assert cache_stats()["entry_count"] == 0

# 6. Regime key doesn't clash with ticker keys
set_cached("__regime__^GSPC", {"regime": "Low"})
assert get_cached("__regime__^GSPC") == {"regime": "Low"}
assert get_cached("^GSPC") is None   # different key

print("All cache tests passed ✓")
