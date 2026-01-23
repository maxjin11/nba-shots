from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from nba_api.stats.endpoints import playercareerstats as pcs, ShotChartDetail
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
    print("Sample:", all_players[0])
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
    df = raw_shotlog.get_data_frames()[0]
    shotlog = df.to_dict(orient="records")

    shot_types = []
    for shots in shotlog:
        shot_category = "temp"


