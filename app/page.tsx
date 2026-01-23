"use client";

import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import type { Player } from "./types/player";



export default function Home() {
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
