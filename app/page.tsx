"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import ShotChart from "./components/ShotChart";
import SearchBar from "./components/SearchBar";
import type { Player } from "./types/player";

type Shot = {
  LOC_X: number;
  LOC_Y: number;
  SHOT_MADE_FLAG: number;
  SHOT_DISTANCE: number;
  ACTION_TYPE: string;
  SHOT_ZONE_BASIC: string;
  SHOT_ZONE_AREA: string;
  SHOT_TYPE: string;
  GAME_DATE: string;
  HTM: string;
  VTM: string;
  PERIOD: number;
  MINUTES_REMAINING: number;
  SECONDS_REMAINING: number;
}

export default function Home() {
  const params = useParams();
  const playerId = params.id;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/players");
        const data = await res.json();
        
        setPlayers(data);
      } catch (error) {
        console.error("Failed to fetch players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleSelect = (player: Player) => {
    console.log("Selected:", player);
  };

  if (loading) {
    return (<div>Loading players...</div>);
  }  
  
  return (
    <div>
      <h1>NBA Player Finder</h1>
      <SearchBar players={players} onSelect={handleSelect} />
    </div>
  );
}
