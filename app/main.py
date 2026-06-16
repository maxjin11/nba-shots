from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from nba_api.stats.endpoints import playercareerstats as pcs, ShotChartDetail, PlayerProfileV2
from nba_api.stats.static import players, teams
import time as t
import os
from upstash_redis import Redis
import json
from dotenv import load_dotenv


load_dotenv()
redis = Redis.from_env()

all_players = players.get_active_players()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def get_shots(id: int):
    name = players.find_player_by_id(id)
    cache_key = f"shots:{id}:2025-26"
    cached = redis.get(cache_key)
    
    if cached:
        print(f"Found in shots cache: {id}")
        return json.loads(cached)

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
async def get_player_stats(id: int):
    name = players.find_player_by_id(id)
    cache_key = f"stats:{id}:2025-26"
    cached = redis.get(cache_key)
    
    if cached:
        print(f"Found in stats cache: {id}")
        return json.loads(cached)

    raw_stats = pcs.PlayerCareerStats(
        per_mode36 = 'PerGame',
        player_id = id,
    )

    print(f"Returning stats for {name} over the 2025-26 season.")
    stats_df = raw_stats.get_data_frames()[0]
    stats = stats_df.to_dict(orient="records")
    
    redis.set(cache_key, json.dumps(stats[-1]))

    return stats[-1]
