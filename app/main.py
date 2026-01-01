from fastapi import FastAPI
import pandas as pd
from nba_api.stats.endpoints import playercareerstats as pcs, ShotChartDetail
from nba_api.stats.static import players, teams


all_players = players.get_active_players()
app = FastAPI()

@app.get("/")
async def test():
    return "Welcome!"

@app.get("/players")
async def get_players():
    return all_players

@app.get("/shots/{id}")
async def get_shots(id: int):
    name = ""
    for player in all_players:
        if player["id"] == id:
            name = player["full_name"]

    shotlog = ShotChartDetail(
        team_id = 0, 
        player_id = id,
        context_measure_simple = 'FGA', 
        season_type_all_star = ['Regular Season', 'Playoffs'],
        season_nullable = "2025-26"
    )

    print(f"Returning shot records for {name} over the 2025-26 season.")
    df = shotlog.get_data_frames()[0]
    return df.to_dict(orient="records")
