from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from nba_api.stats.endpoints import playercareerstats as pcs, ShotChartDetail, PlayerProfileV2
from nba_api.stats.static import players, teams

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

@app.get("/shots/{id}")
async def get_shots(id: int):
    name = players.find_player_by_id(id)

    raw_shotlog = ShotChartDetail(
        team_id = 0, 
        player_id = id,
        context_measure_simple = 'FGA', 
        season_type_all_star = ['Regular Season', 'Playoffs'],
        season_nullable = "2025-26"
    )

    print(f"Returning shot records for {name} over the 2025-26 season.")
    shotlog_df = raw_shotlog.get_data_frames()[0]
    shotlog = shotlog_df.to_dict(orient="records")

    return shotlog

@app.get("/players/{id}/current-season")
async def get_player_stats(id: int):
    name = players.find_player_by_id(id)
    raw_stats = pcs.PlayerCareerStats(
        per_mode36 = 'PerGame',
        player_id = id,
    )

    print(f"Returning stats for {name} over the 2025-26 season.")
    stats_df = raw_stats.get_data_frames()[0]
    stats = stats_df.to_dict(orient="records")
    
    return stats[-1]
