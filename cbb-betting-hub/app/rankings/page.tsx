"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader } from "@/components/ui/Loader";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { AdjustedRating, EloRating, Ranking } from "@/lib/types";
import { dec } from "@/lib/utils";

const SEASON = 2026;
type RankingTab = "AP Poll" | "Efficiency" | "ELO";
type SortDir = "asc" | "desc";
type EfficiencySortKey = "net" | "team" | "conference" | "offensiveRating" | "defensiveRating" | "netRating" | "offenseRank" | "defenseRank";

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<RankingTab>("AP Poll");
  const [pollRankings, setPollRankings] = useState<Ranking[]>([]);
  const [adjustedRatings, setAdjustedRatings] = useState<AdjustedRating[]>([]);
  const [eloRatings, setEloRatings] = useState<EloRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<EfficiencySortKey>("net");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      const [rankingsData, adjustedData, eloData] = await Promise.all([
        apiFetch<Ranking[]>("/rankings", { season: SEASON }),
        apiFetch<AdjustedRating[]>("/ratings/adjusted", { season: SEASON }),
        apiFetch<EloRating[]>("/ratings/elo", { season: SEASON }),
      ]);

      if (cancelled) return;

      setPollRankings(rankingsData);
      setAdjustedRatings(adjustedData);
      setEloRatings(eloData);
      setLoading(false);
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const apPoll = useMemo(
    () =>
      pollRankings
        .filter((entry) => entry.pollType.toLowerCase().includes("ap"))
        .sort((a, b) => a.ranking - b.ranking)
        .slice(0, 25),
    [pollRankings]
  );

  const efficiencySorted = useMemo(() => {
    const getValue = (item: AdjustedRating): string | number => {
      switch (sortKey) {
        case "team":
          return item.team;
        case "conference":
          return item.conference;
        case "offensiveRating":
          return item.offensiveRating;
        case "defensiveRating":
          return item.defensiveRating;
        case "netRating":
          return item.netRating;
        case "offenseRank":
          return item.rankings?.offense ?? 999;
        case "defenseRank":
          return item.rankings?.defense ?? 999;
        case "net":
        default:
          return item.rankings?.net ?? 999;
      }
    };

    return [...adjustedRatings].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const left = Number(aVal);
      const right = Number(bVal);
      return sortDir === "asc" ? left - right : right - left;
    });
  }, [adjustedRatings, sortDir, sortKey]);

  const eloTop = useMemo(() => [...eloRatings].sort((a, b) => b.elo - a.elo).slice(0, 50), [eloRatings]);

  function updateSort(nextKey: EfficiencySortKey) {
    if (nextKey === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDir(nextKey === "team" || nextKey === "conference" ? "asc" : nextKey === "defensiveRating" ? "asc" : "desc");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <h1 className="font-heading text-4xl text-zinc-100">Rankings</h1>
        <p className="mt-1 text-zinc-400">AP Poll, adjusted efficiency, and ELO views for {SEASON}.</p>
        <div className="mt-4">
          <Tabs tabs={["AP Poll", "Efficiency", "ELO"]} active={activeTab} onChange={(tab) => setActiveTab(tab as RankingTab)} />
        </div>
      </section>

      {loading ? <Loader /> : null}

      {!loading && activeTab === "AP Poll" ? (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="px-3 py-2 font-mono">Rank</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Conference</th>
                <th className="px-3 py-2 font-mono">Points</th>
                <th className="px-3 py-2 font-mono">1st Place Votes</th>
              </tr>
            </thead>
            <tbody>
              {apPoll.map((entry) => (
                <tr key={`${entry.pollType}-${entry.ranking}-${entry.teamId}`} className="border-b border-white/5 text-zinc-200">
                  <td className="px-3 py-2 font-mono">{entry.ranking}</td>
                  <td className="px-3 py-2"><Link href={`/team/${encodeURIComponent(entry.team)}`} className="text-zinc-100 hover:text-amber-300">{entry.team}</Link></td>
                  <td className="px-3 py-2">{entry.conference}</td>
                  <td className="px-3 py-2 font-mono">{entry.points}</td>
                  <td className="px-3 py-2 font-mono">{entry.firstPlaceVotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {!loading && activeTab === "Efficiency" ? (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("net")}>Rank</th>
                <th className="cursor-pointer px-3 py-2" onClick={() => updateSort("team")}>Team</th>
                <th className="cursor-pointer px-3 py-2" onClick={() => updateSort("conference")}>Conference</th>
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("offensiveRating")}>Off Rating</th>
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("defensiveRating")}>Def Rating</th>
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("netRating")}>Net Rating</th>
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("offenseRank")}>Off Rank</th>
                <th className="cursor-pointer px-3 py-2 font-mono" onClick={() => updateSort("defenseRank")}>Def Rank</th>
              </tr>
            </thead>
            <tbody>
              {efficiencySorted.map((entry) => {
                const netRank = entry.rankings?.net ?? 999;
                return (
                  <tr key={`${entry.teamId}-${entry.team}`} className={`border-b border-white/5 text-zinc-200 ${netRank <= 25 ? "border-l-2 border-l-amber-400/50" : ""}`}>
                    <td className="px-3 py-2 font-mono">{entry.rankings?.net ?? "—"}</td>
                    <td className="px-3 py-2"><Link href={`/team/${encodeURIComponent(entry.team)}`} className="text-zinc-100 hover:text-amber-300">{entry.team}</Link></td>
                    <td className="px-3 py-2">{entry.conference}</td>
                    <td className="px-3 py-2 font-mono">{dec(entry.offensiveRating, 1)}</td>
                    <td className="px-3 py-2 font-mono">{dec(entry.defensiveRating, 1)}</td>
                    <td className="px-3 py-2 font-mono text-amber-300">{dec(entry.netRating, 1)}</td>
                    <td className="px-3 py-2 font-mono">{entry.rankings?.offense ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">{entry.rankings?.defense ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {!loading && activeTab === "ELO" ? (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="px-3 py-2 font-mono">Rank</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Conference</th>
                <th className="px-3 py-2 font-mono">ELO</th>
              </tr>
            </thead>
            <tbody>
              {eloTop.map((entry, idx) => (
                <tr key={`${entry.teamId}-${idx}`} className="border-b border-white/5 text-zinc-200">
                  <td className="px-3 py-2 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2"><Link href={`/team/${encodeURIComponent(entry.team)}`} className="text-zinc-100 hover:text-amber-300">{entry.team}</Link></td>
                  <td className="px-3 py-2">{entry.conference}</td>
                  <td className="px-3 py-2 font-mono">{dec(entry.elo, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
