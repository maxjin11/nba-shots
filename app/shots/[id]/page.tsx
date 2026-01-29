"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShotChart from '../../components/ShotChart';
import SearchBar from "../../components/SearchBar";
import type { Player } from "../../types/player";

type Shot = {
  LOC_X: number;
  LOC_Y: number;
  SHOT_MADE_FLAG: number;
  SHOT_DISTANCE: number;
  SHOT_TYPE: string;
};

export default function ShotsPage() {
  const params = useParams();
  const playerId = params.id;
  const [shots, setShots] = useState<Shot[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  

  useEffect(() => {
    const fetchShots = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/shots/${playerId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch shots');
        }
        
        const data = await res.json();
        setShots(data);
        
        // Optionally fetch player name
        const playersRes = await fetch('http://localhost:8000/players');
        const players = await playersRes.json();
        const player = players.find((p: any) => p.id === parseInt(playerId as string));
        if (player) {
          setPlayerName(player.full_name);
        }
      } catch (error) {
        console.error("Failed to fetch shots:", error);
        setError("Failed to load shot data");
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchShots();
    }
  }, [playerId]);

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading shot chart...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: 'red'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '40px', paddingBottom: '0px', maxWidth: '1400px', margin: '0 auto'}}>
        <h1>NBA Player Finder</h1>
        <SearchBar players={players} onSelect={handleSelect} />
      </div>

      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <ShotChart shots={shots} playerName={playerName} />
      </div>
    </div>
  );
}