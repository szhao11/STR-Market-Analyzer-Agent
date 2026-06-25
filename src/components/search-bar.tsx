"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  city: string;
  state: string;
  stateAbbr: string;
  metroArea: string;
}

export function SearchBar({
  placeholder = "Search a city to analyze (e.g., Nashville, TN)…",
}: {
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCities(query), 200);
    return () => clearTimeout(timer);
  }, [query, searchCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const analyzeCity = (city: string, stateAbbr: string) => {
    setIsOpen(false);
    setQuery("");
    const slug = `${city.toLowerCase().replace(/\s+/g, "-")}-${stateAbbr.toLowerCase()}`;
    router.push(`/market/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isOpen && selectedIndex >= 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        analyzeCity(selected.city, selected.stateAbbr);
        return;
      }
      if (results.length > 0) {
        e.preventDefault();
        analyzeCity(results[0].city, results[0].stateAbbr);
      }
      return;
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className={cn("h-9 pl-9", isOpen && results.length > 0 && "rounded-b-none")}
        />
        {isLoading && (
          <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full overflow-hidden rounded-b-md border border-t-0 border-border bg-popover shadow-[0_4px_12px_rgba(15,15,15,0.08)]"
        >
          {results.map((result, index) => (
            <button
              key={`${result.city}-${result.stateAbbr}`}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-hover",
                index === selectedIndex && "bg-hover"
              )}
              onClick={() => analyzeCity(result.city, result.stateAbbr)}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="font-medium">
                  {result.city}, {result.stateAbbr}
                </span>
                <span className="ml-2 text-muted-foreground">{result.metroArea}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
