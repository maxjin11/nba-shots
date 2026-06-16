"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { JetBrains_Mono } from "next/font/google";
import type { Player } from "../types/player";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

type PlayerSearchProps = {
  players: Player[];
  onSelect: (player: Player) => void;
};

export default function SearchBar({ players, onSelect }: PlayerSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  const fuse = useMemo(
    () =>
      new Fuse(players, {
        keys: ["id", "full_name"],
        threshold: 0.3,
      }),
    [players]
  );

  const results: Player[] = query
    ? fuse.search(query).map((res) => res.item)
    : [];

  const visible = results.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusedIndex < 0) return;
    itemRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || visible.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < visible.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handlePlayerSelect(visible[focusedIndex]);
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
    <div ref={wrapperRef} className={`${mono.className} relative w-full`}>
      <style>{`
        .shoot-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(237,237,237,0.12) transparent;
        }
        .shoot-scroll::-webkit-scrollbar { width: 6px; }
        .shoot-scroll::-webkit-scrollbar-track { background: transparent; }
        .shoot-scroll::-webkit-scrollbar-thumb {
          background: rgba(237,237,237,0.12);
          border-radius: 999px;
          transition: background 0.2s;
        }
        .shoot-scroll:hover::-webkit-scrollbar-thumb { background: rgba(237,237,237,0.22); }
        .shoot-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,94,43,0.55); }
      `}</style>
      <div className="group relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#ededed]/40 transition-colors duration-200 group-focus-within:text-[#ff5e2b]"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          type="text"
          placeholder="search a player…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-full border border-white/10 bg-white/[0.035] py-3.5 pl-11 pr-4 text-sm tracking-wide text-[#ededed] placeholder:text-[#ededed]/35 outline-none backdrop-blur-sm transition-all duration-200 focus:border-[#ff5e2b]/60 focus:bg-white/[0.055] focus:shadow-[0_0_0_4px_rgba(255,94,43,0.08)]"
        />
      </div>

      {isOpen && query && visible.length > 0 && (
        <ul className="shoot-scroll absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[min(280px,32vh)] list-none overflow-y-auto rounded-2xl border border-white/10 bg-[#101013]/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {visible.map((player, index) => (
            <li
              key={player.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <Link
                href={`/shots/${player.id}`}
                onClick={() => handlePlayerSelect(player)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm no-underline transition-colors duration-150 ${
                  focusedIndex === index
                    ? "bg-white/[0.06] text-[#ededed]"
                    : "text-[#ededed]/75 hover:text-[#ededed]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-[6px] w-[6px] rounded-full transition-colors duration-150 ${
                      focusedIndex === index
                        ? "bg-[#ff5e2b]"
                        : "bg-[#ededed]/15"
                    }`}
                  />
                  <span className="tracking-wide">{player.full_name}</span>
                </span>
                {focusedIndex === index && (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#ededed]/40">
                    enter ↵
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && visible.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-white/10 bg-[#101013]/95 px-5 py-4 text-[11px] uppercase tracking-[0.32em] text-[#ededed]/40 backdrop-blur-xl">
          no players found
        </div>
      )}
    </div>
  );
}