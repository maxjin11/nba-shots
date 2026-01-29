"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import type { Player } from "../types/player"

type PlayerSearchProps = {
    players: Player[];
    onSelect: (player: Player) => void;
}

export default function SearchBar({ 
    players, 
    onSelect 
}: PlayerSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(players, {
      keys: ["id", "full_name"],
      threshold: 0.3,
    });
  }, [players]);

  const results: Player[] = query
    ? fuse.search(query).map((res) => res.item)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < Math.min(results.length - 1, 7) ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handlePlayerSelect(results[focusedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const handlePlayerSelect = (player: Player) => {
    onSelect(player);
    setQuery("");
    setIsOpen(false);
    setFocusedIndex(-1);
  };
  

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: 400 }}>
      <input
        type="text"
        placeholder="Search NBA players..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setFocusedIndex(-1);
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#1d4ed8";
          if (query) setIsOpen(true);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#ddd";
        }}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "16px",
          border: "2px solid #ddd",
          borderRadius: "8px",
          outline: "none",
          transition: "border-color 0.2s",
        }}
      />

      {isOpen && query && results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            margin: 0,
            padding: 0,
            listStyle: "none",
            zIndex: 10,
            maxHeight: "320px",
            overflowY: "auto",
            color: "#000",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {results.slice(0, 8).map((player, index) => (
            <li
              key={player.id}
              onClick={() => handlePlayerSelect(player)}
              onMouseEnter={() => setFocusedIndex(index)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                backgroundColor:
                  focusedIndex === index ? "#f3f4f6" : "white",
                borderBottom:
                  index < Math.min(results.length - 1, 7)
                    ? "1px solid #f0f0f0"
                    : "none",
                transition: "background-color 0.15s",
              }}
            >
              <Link
                href = {`/shots/${player.id}`}
                onClick = {() => handlePlayerSelect(player)}
                style = {{
                  display: "block",
                  padding: "12px 16px",
                  textDecoration: "none",
                  color: "inherit",
                  backgroundColor:
                    focusedIndex === index? "#f3f4f6" : "white",
                  transition: "background-color 0.15s",
                }}
              >
                <div style={{ fontWeight: 500 }}>{player.full_name}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "#000",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          No players found
        </div>
      )}
    </div>
  );
}