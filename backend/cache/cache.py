# backend/utils/cache.py
import redis
import json
import os

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def cache_get(key: str):
    value = redis_client.get(key)
    return json.loads(value) if value else None


def cache_set(key: str, value: dict, ttl: int = 300):
    redis_client.setex(key, ttl, json.dumps(value))
