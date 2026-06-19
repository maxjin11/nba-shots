from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from nba_api.stats.endpoints import playercareerstats as pcs, ShotChartDetail, PlayerProfileV2
from nba_api.stats.static import players, teams
import time as t
import os
import secrets
from upstash_redis import Redis
import json
from dotenv import load_dotenv


load_dotenv()
redis = Redis.from_env()

all_players = players.get_active_players()

app = FastAPI()

# Comma-separated list of allowed frontend origins. Set FRONTEND_ORIGINS in
# production (e.g. "https://your-app.vercel.app"); defaults to the local dev
# server.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── rate limit ────────────────────────────────────────────────
# 4 cache-miss API calls per minute per client IP, shared across the shots
# and current-season endpoints. Cached lookups are free because they don't
# hit the NBA API — the limiter exists to protect that upstream, not to
# throttle browsing. Loading a fresh player costs 2 slots (shots + stats);
# loading a cached one costs 0.
SEARCH_RATE_LIMIT = 4
SEARCH_RATE_WINDOW_S = 60


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def consume_search_slot(request: Request):
    """Sliding-window limiter: at most SEARCH_RATE_LIMIT cache-miss searches
    in any rolling SEARCH_RATE_WINDOW_S period, per client IP.

    Each search is stored as a ZSET member with the request timestamp as its
    score. Before counting we drop members older than the window, so the
    "in-window count" is always exact regardless of when the window started.

    Fails open: if Redis errors out, the request is allowed through. The
    limiter is a safety net for the NBA API — it shouldn't be a single point
    of failure for the whole site.
    """
    ip = get_client_ip(request)
    key = f"rate:search-miss:{ip}"
    now_ms = int(t.time() * 1000)
    window_ms = SEARCH_RATE_WINDOW_S * 1000
    cutoff_ms = now_ms - window_ms

    try:
        # Slide the window forward by evicting expired entries.
        redis.zremrangebyscore(key, 0, cutoff_ms)
        in_window = redis.zcard(key) or 0
    except Exception as exc:
        print(f"[rate-limit] redis read failed, allowing request: {exc}")
        return

    if in_window >= SEARCH_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit exceeded: {SEARCH_RATE_LIMIT} fresh data calls per minute. "
                "Cached players remain unlimited — try again in a moment."
            ),
            headers={"Retry-After": str(SEARCH_RATE_WINDOW_S)},
        )

    try:
        # Record this search. The random suffix guarantees uniqueness even
        # when multiple requests land in the same millisecond (ZSET members
        # are keys).
        member = f"{now_ms}:{secrets.token_hex(4)}"
        redis.zadd(key, {member: now_ms})
        # Auto-clean the key if the IP goes quiet — TTL slightly outlives the
        # window so the last entry can fully age out.
        redis.expire(key, SEARCH_RATE_WINDOW_S + 5)
    except Exception as exc:
        print(f"[rate-limit] redis write failed, request already allowed: {exc}")


@app.get("/")
async def test():
    return "Welcome!"

@app.get("/players")
async def get_players():
    print("Retrieving all players.")
    return all_players

# Add this to see the actual response from NBA API
@app.get("/debug-nba/{player_id}")
async def debug_nba(player_id: int):
    try:
        import requests
        url = f"https://stats.nba.com/stats/shotchartdetail"
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://stats.nba.com/',
        }
        params = {
            'PlayerID': player_id,
            'Season': '2025-26',
            'SeasonType': 'Regular Season',
            'TeamID': 0,
            'ContextMeasure': 'FGA'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        return {
            "status_code": response.status_code,
            "text": response.text[:500]  # First 500 chars
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/shots/{id}")
async def get_shots(id: int, request: Request):
    name = players.find_player_by_id(id)
    cache_key = f"shots:{id}:2025-26"
    cached = redis.get(cache_key)

    if cached:
        print(f"Found in shots cache: {id}")
        return json.loads(cached)

    # Cache miss — gate the NBA API call behind the per-IP search budget.
    consume_search_slot(request)

    raw_shotlog = ShotChartDetail(
        team_id = 0, 
        player_id = id,
        context_measure_simple = 'FGA', 
        season_type_all_star = ['Regular Season', 'Playoffs'],
        season_nullable = "2025-26",
        timeout=60
    )

    print(f"Returning shot records for {name} over the 2025-26 season.")
    shotlog_df = raw_shotlog.get_data_frames()[0]
    shotlog = shotlog_df.to_dict(orient="records")
    
    redis.set(cache_key, json.dumps(shotlog))

    return shotlog

@app.get("/players/{id}/current-season")
async def get_player_stats(id: int, request: Request):
    name = players.find_player_by_id(id)
    cache_key = f"stats:{id}:2025-26"
    cached = redis.get(cache_key)

    if cached:
        print(f"Found in stats cache: {id}")
        return json.loads(cached)

    # Cache miss — same shared budget as /shots/{id}.
    consume_search_slot(request)

    raw_stats = pcs.PlayerCareerStats(
        per_mode36 = 'PerGame',
        player_id = id,
    )

    print(f"Returning stats for {name} over the 2025-26 season.")
    stats_df = raw_stats.get_data_frames()[0]
    stats = stats_df.to_dict(orient="records")
    
    redis.set(cache_key, json.dumps(stats[-1]))

    return stats[-1]
