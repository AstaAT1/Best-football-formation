#!/usr/bin/env node
/**
 * generate-club-path-questions.js
 *
 * Generates quiz-ready "Guess the Player by Clubs" questions
 * from API-Football transfer data.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
}

loadEnv();

const API_KEY = process.env.APIFOOTBALL_KEY;
if (!API_KEY) {
  console.error("❌ APIFOOTBALL_KEY not found in .env");
  process.exit(1);
}

const API_BASE = "https://v3.football.api-sports.io";
const DELAY_MS = 400;
const MAX_CLUBS = 5;
const MIN_CLUBS = 2;

// CACHE
const CACHE_PATH = path.join(__dirname, "..", "src", "data", "transfersCache.json");
let transfersCache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      transfersCache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
      console.log(`📦 Loaded ${Object.keys(transfersCache).length} cached player transfers`);
    }
  } catch {
    transfersCache = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(transfersCache, null, 2), "utf-8");
  } catch (err) {
    console.error(`⚠️ Failed to save cache: ${err.message}`);
  }
}

import { curatedPlayers } from "./curated_players.js";

// PLAYER LIST
const PLAYER_LIST_PATH = path.join(__dirname, "players_list_bulk.json");

function loadPlayerList() {
  let bulk = [];
  if (fs.existsSync(PLAYER_LIST_PATH)) {
    bulk = JSON.parse(fs.readFileSync(PLAYER_LIST_PATH, "utf-8"));
  } else {
    console.error(`❌ Player list not found at: ${PLAYER_LIST_PATH}`);
  }
  return [...curatedPlayers, ...bulk];
}

const PLAYER_LIST = loadPlayerList();

/* ──────────────────────── HELPERS ──────────────────────── */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* ──────────────────────── API ──────────────────────── */
async function fetchTransfers(playerId) {
  if (transfersCache[playerId]) {
    return transfersCache[playerId];
  }

  const url = `${API_BASE}/transfers?player=${playerId}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const response = data.response || [];

  transfersCache[playerId] = response;
  return response;
}

/* ──────────────────────── NORMALIZATION ──────────────────────── */
function normalizeTransfers(transferResponse) {
  if (!transferResponse.length) return [];

  const playerData = transferResponse[0];
  if (!playerData || !Array.isArray(playerData.transfers) || playerData.transfers.length === 0) return [];

  const rawClubs = [];

  // Sort oldest first
  const sortedTransfers = [...playerData.transfers].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  if (sortedTransfers.length > 0) {
    const firstTransfer = sortedTransfers[0];
    const teamOut = firstTransfer?.teams?.out;
    if (teamOut?.name) {
      rawClubs.push({
        teamName: teamOut.name,
        logo: teamOut.logo || null,
        year: firstTransfer.date ? firstTransfer.date.split("-")[0] : null,
      });
    }
  }

  for (const transfer of sortedTransfers) {
    const teamIn = transfer?.teams?.in;
    if (!teamIn?.name) continue;

    const date = transfer?.date || null;
    const year = date ? date.split("-")[0] : null;

    rawClubs.push({
      teamName: teamIn.name,
      logo: teamIn.logo || null,
      year,
    });
  }

  // Merge consecutive duplicates
  const merged = [];
  for (const club of rawClubs) {
    const last = merged[merged.length - 1];
    if (last && last.teamName === club.teamName) continue;
    merged.push(club);
  }

  const result = [];
  for (let i = 0; i < merged.length; i++) {
    const current = merged[i];
    const next = merged[i + 1];

    result.push({
      teamName: current.teamName,
      logo: current.logo,
      yearFrom: current.year,
      yearTo: next ? next.year : null,
    });
  }

  return result;
}

function pickBestClubWindow(clubs) {
  if (clubs.length <= MAX_CLUBS) return clubs;
  // Use most recent N clubs
  return clubs.slice(-MAX_CLUBS);
}

function isUsableCareerPath(clubs) {
  if (!Array.isArray(clubs) || clubs.length < MIN_CLUBS) return false;
  const uniqueTeams = new Set(clubs.map((c) => c.teamName));
  if (uniqueTeams.size < MIN_CLUBS) return false;
  return true;
}

function assessDifficulty(clubs) {
  if (clubs.length <= 2) return "easy";
  if (clubs.length <= 3) return "medium";
  return "hard";
}

/* ──────────────────────── DISTRACTORS ──────────────────────── */
function buildChoices(correctPlayer, allPlayers) {
  const samePos = allPlayers.filter((p) => p.name !== correctPlayer.name && p.pos === correctPlayer.pos);
  let pool = samePos.length >= 3 ? samePos : allPlayers.filter((p) => p.name !== correctPlayer.name);

  pool = shuffle(pool);
  const distractors = pool.slice(0, 3).map((p) => {
    return p.acceptableAnswers ? p.acceptableAnswers[0] : p.name;
  });

  const correctName = correctPlayer.acceptableAnswers ? correctPlayer.acceptableAnswers[0] : correctPlayer.name;
  const choices = shuffle([...distractors, correctName]);
  const answerIndex = choices.indexOf(correctName);

  return { choices, answerIndex };
}

/* ──────────────────────── MAIN ──────────────────────── */
async function main() {
  loadCache();

  // Deduplicate PLAYER_LIST array to avoid doing the same API ID twice
  const uniqueMap = new Map();
  for (const p of PLAYER_LIST) {
     if (!uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
     }
  }
  const uniquePlayers = Array.from(uniqueMap.values());

  console.log(`🚀 Generating club-path questions...`);
  console.log(`   Players to process: ${uniquePlayers.length}`);

  let questions = [];

  for (let i = 0; i < uniquePlayers.length; i++) {
    const player = uniquePlayers[i];
    const wasCached = !!transfersCache[player.id];
    
    if (!wasCached) {
      console.log(`📥 [${i + 1}/${uniquePlayers.length}] Fetching ${player.name} (ID: ${player.id})...`);
    } else {
      console.log(`📦 [${i + 1}/${uniquePlayers.length}] ${player.name} (ID: ${player.id})`);
    }

    try {
      const transfers = await fetchTransfers(player.id);
      if (!wasCached) saveCache();

      const normalizedClubs = normalizeTransfers(transfers);
      const selectedClubs = pickBestClubWindow(normalizedClubs);

      if (!isUsableCareerPath(selectedClubs)) {
        console.log(`⚠️  Skipping ${player.name}: unusable career path`);
        if (!wasCached) await sleep(DELAY_MS);
        continue;
      }

      const { choices, answerIndex } = buildChoices(player, uniquePlayers);
      const difficulty = assessDifficulty(selectedClubs);

      const question = {
        id: `cp_${player.id}`,
        pos: player.pos,
        difficulty,
        mode: "clubpath",
        text: "Who is this player?",
        choices,
        answerIndex,
        explanation: `${player.name}'s career: ${selectedClubs.map(c => c.teamName).join(" → ")}`,
        clubs: selectedClubs,
        playerPhoto: `https://media.api-sports.io/football/players/${player.id}.png`
      };

      questions.push(question);
      console.log(`✅ Included ${player.name}: ${selectedClubs.length} clubs`);
    } catch (err) {
      console.error(`❌ Error processing ${player.name}: ${err.message}`);
    }

    if (!wasCached) {
      await sleep(DELAY_MS);
    }
  }

  // Final deduplication for questions (just in case)
  const finalQuestions = [];
  const seenQ = new Set();
  for (const q of questions) {
    const clubKey = q.clubs.map(c => c.teamName).join("|");
    const dedupeKey = `${q.id}_${clubKey}`;
    if (!seenQ.has(dedupeKey)) {
      seenQ.add(dedupeKey);
      finalQuestions.push(q);
    }
  }

  const outPath = path.join(__dirname, "..", "src", "data", "clubPathQuestions.json");
  fs.writeFileSync(outPath, JSON.stringify(finalQuestions, null, 2), "utf-8");
  
  console.log(`\n🎉 Generated ${finalQuestions.length} club-path questions!`);
  console.log(`💾 Saved to ${outPath}`);
}

main().catch(err => console.error(err));