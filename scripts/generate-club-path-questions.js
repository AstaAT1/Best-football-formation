#!/usr/bin/env node
/**
 * generate-club-path-questions.js
 *
 * Generates quiz-ready "Guess the Player by Clubs" questions
 * from API-Football transfer data.
 *
 * Usage:
 *   1. Create a .env file in the project root:
 *      APIFOOTBALL_KEY=your_api_key
 *
 *   2. Run:
 *      node scripts/generate-club-path-questions.js
 *
 * Output:
 *   src/data/clubPathQuestions.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found. Create one in the project root with: APIFOOTBALL_KEY=your_key");
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
const MAX_CLUBS = 4;
const MIN_CLUBS = 2;

/**
 * IMPORTANT:
 * زيد هنا لاعبين أكثر باش تكبر الداتاسيت
 * خاص كل لاعب يكون عندو:
 * - id
 * - name
 * - pos
 * - acceptableAnswers
 */
const PLAYER_LIST = [
  { id: 276, name: "Neymar", pos: "ATK", acceptableAnswers: ["Neymar", "Neymar Jr", "Neymar Junior"] },
  { id: 154, name: "Robert Lewandowski", pos: "ATK", acceptableAnswers: ["Robert Lewandowski", "Lewandowski", "Lewy"] },
  { id: 874, name: "Antoine Griezmann", pos: "ATK", acceptableAnswers: ["Antoine Griezmann", "Griezmann"] },
  { id: 1100, name: "Mohamed Salah", pos: "ATK", acceptableAnswers: ["Mohamed Salah", "Mo Salah", "Salah"] },
  { id: 2295, name: "Erling Haaland", pos: "ATK", acceptableAnswers: ["Erling Haaland", "Haaland"] },
  { id: 762, name: "Kylian Mbappé", pos: "ATK", acceptableAnswers: ["Kylian Mbappe", "Mbappé", "Mbappe"] },
  { id: 1427, name: "Eden Hazard", pos: "ATK", acceptableAnswers: ["Eden Hazard", "Hazard"] },
  { id: 521, name: "Kevin De Bruyne", pos: "MID", acceptableAnswers: ["Kevin De Bruyne", "De Bruyne", "KDB"] },
  { id: 759, name: "Karim Benzema", pos: "ATK", acceptableAnswers: ["Karim Benzema", "Benzema"] },
  { id: 756, name: "Luka Modrić", pos: "MID", acceptableAnswers: ["Luka Modric", "Modric", "Modrić"] },
  { id: 1460, name: "Pierre-Emerick Aubameyang", pos: "ATK", acceptableAnswers: ["Aubameyang", "Pierre-Emerick Aubameyang"] },
  { id: 882, name: "Paul Pogba", pos: "MID", acceptableAnswers: ["Paul Pogba", "Pogba"] },
  { id: 739, name: "Gareth Bale", pos: "ATK", acceptableAnswers: ["Gareth Bale", "Bale"] },
  { id: 186, name: "Luis Suárez", pos: "ATK", acceptableAnswers: ["Luis Suarez", "Suárez", "Suarez"] },
  { id: 278, name: "Philippe Coutinho", pos: "MID", acceptableAnswers: ["Philippe Coutinho", "Coutinho"] },
  { id: 735, name: "Son Heung-min", pos: "ATK", acceptableAnswers: ["Son Heung-min", "Son", "Sonny"] },
  { id: 1585, name: "Ángel Di María", pos: "ATK", acceptableAnswers: ["Angel Di Maria", "Di Maria", "Di María"] },
  { id: 129718, name: "Jude Bellingham", pos: "MID", acceptableAnswers: ["Jude Bellingham", "Bellingham"] },
  { id: 47380, name: "Bruno Fernandes", pos: "MID", acceptableAnswers: ["Bruno Fernandes", "Bruno"] },
  { id: 1584, name: "Thibaut Courtois", pos: "GK", acceptableAnswers: ["Thibaut Courtois", "Courtois"] },

  // زيد هنا مزيد من اللاعبين
  { id: 2783, name: "Cristiano Ronaldo", pos: "ATK", acceptableAnswers: ["Cristiano Ronaldo", "Ronaldo", "CR7"] },
  { id: 1547, name: "Sadio Mané", pos: "ATK", acceptableAnswers: ["Sadio Mane", "Mané", "Mane"] },
  { id: 1579, name: "Romelu Lukaku", pos: "ATK", acceptableAnswers: ["Romelu Lukaku", "Lukaku"] },
  { id: 1580, name: "Edinson Cavani", pos: "ATK", acceptableAnswers: ["Edinson Cavani", "Cavani"] },
  { id: 280, name: "Ousmane Dembélé", pos: "ATK", acceptableAnswers: ["Ousmane Dembele", "Dembélé", "Dembele"] },
  { id: 239, name: "Raphinha", pos: "ATK", acceptableAnswers: ["Raphinha"] },
  { id: 1320, name: "Antony", pos: "ATK", acceptableAnswers: ["Antony"] },
  { id: 1179, name: "João Félix", pos: "ATK", acceptableAnswers: ["Joao Felix", "João Félix", "Felix"] },
  { id: 217, name: "Memphis Depay", pos: "ATK", acceptableAnswers: ["Memphis Depay", "Depay", "Memphis"] },
  { id: 633, name: "Kingsley Coman", pos: "ATK", acceptableAnswers: ["Kingsley Coman", "Coman"] },
  { id: 1361, name: "Leroy Sané", pos: "ATK", acceptableAnswers: ["Leroy Sane", "Sané", "Sane"] },

  { id: 1277, name: "Toni Kroos", pos: "MID", acceptableAnswers: ["Toni Kroos", "Kroos"] },
  { id: 746, name: "Ivan Rakitić", pos: "MID", acceptableAnswers: ["Ivan Rakitic", "Rakitić", "Rakitic"] },
  { id: 2553, name: "Declan Rice", pos: "MID", acceptableAnswers: ["Declan Rice", "Rice"] },
  { id: 2192, name: "Rodri", pos: "MID", acceptableAnswers: ["Rodri"] },
  { id: 310, name: "Frenkie de Jong", pos: "MID", acceptableAnswers: ["Frenkie de Jong", "De Jong"] },
  { id: 47468, name: "Martin Ødegaard", pos: "MID", acceptableAnswers: ["Martin Odegaard", "Ødegaard", "Odegaard"] },
  { id: 632, name: "İlkay Gündoğan", pos: "MID", acceptableAnswers: ["Ilkay Gundogan", "İlkay Gündoğan", "Gundogan"] },
  { id: 1572, name: "Christian Eriksen", pos: "MID", acceptableAnswers: ["Christian Eriksen", "Eriksen"] },

  { id: 886, name: "Sergio Ramos", pos: "DEF", acceptableAnswers: ["Sergio Ramos", "Ramos"] },
  { id: 1514, name: "Antonio Rüdiger", pos: "DEF", acceptableAnswers: ["Antonio Rudiger", "Rüdiger", "Rudiger"] },
  { id: 903, name: "Achraf Hakimi", pos: "DEF", acceptableAnswers: ["Achraf Hakimi", "Hakimi"] },
  { id: 797, name: "João Cancelo", pos: "DEF", acceptableAnswers: ["Joao Cancelo", "João Cancelo", "Cancelo"] },
  { id: 1582, name: "Kalidou Koulibaly", pos: "DEF", acceptableAnswers: ["Kalidou Koulibaly", "Koulibaly"] },

  { id: 644, name: "Jan Oblak", pos: "GK", acceptableAnswers: ["Jan Oblak", "Oblak"] },
  { id: 1599, name: "Gianluigi Donnarumma", pos: "GK", acceptableAnswers: ["Gianluigi Donnarumma", "Donnarumma"] },
  { id: 3790, name: "David de Gea", pos: "GK", acceptableAnswers: ["David de Gea", "De Gea"] }
];

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

async function fetchTransfers(playerId) {
  const url = `${API_BASE}/transfers?player=${playerId}`;
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.response || [];
}

function normalizeTransfers(transferResponse) {
  if (!transferResponse.length) return [];

  const playerData = transferResponse[0];
  if (!playerData || !Array.isArray(playerData.transfers)) return [];

  const rawClubs = [];
  const seen = new Set();

  for (const transfer of playerData.transfers) {
    const teamIn = transfer?.teams?.in;
    if (!teamIn?.name) continue;

    const date = transfer?.date || null;
    const year = date ? date.split("-")[0] : null;

    const dedupeKey = `${teamIn.id || "unknown"}_${teamIn.name}_${date || "nodate"}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    rawClubs.push({
      teamId: teamIn.id || null,
      teamName: teamIn.name,
      logo: teamIn.logo || null,
      year,
      date,
    });
  }

  rawClubs.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const merged = [];
  for (const club of rawClubs) {
    const last = merged[merged.length - 1];
    if (last && last.teamName === club.teamName) {
      // skip consecutive duplicate club names
      continue;
    }
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

  return clubs.slice(-MAX_CLUBS);
}

function isUsableCareerPath(clubs) {
  if (!Array.isArray(clubs) || clubs.length < MIN_CLUBS) return false;

  const uniqueTeams = new Set(clubs.map((c) => c.teamName));
  if (uniqueTeams.size < MIN_CLUBS) return false;

  return true;
}

function assessDifficulty(clubs) {
  if (clubs.length <= 3) return "easy";
  if (clubs.length <= 4) return "medium";
  return "hard";
}

function buildExplanation(playerName, clubs) {
  return `${playerName}'s career: ${clubs.map((c) => c.teamName).join(" → ")}`;
}

function buildChoices(correctPlayer, allPlayers) {
  const samePos = allPlayers.filter(
    (p) => p.name !== correctPlayer.name && p.pos === correctPlayer.pos
  );

  let pool = samePos;

  if (pool.length < 3) {
    pool = allPlayers.filter((p) => p.name !== correctPlayer.name);
  }

  const wrongChoices = shuffle(pool).slice(0, 3).map((p) => p.name);
  const choices = shuffle([correctPlayer.name, ...wrongChoices]).slice(0, 4);
  const answerIndex = choices.indexOf(correctPlayer.name);

  return { choices, answerIndex };
}

function dedupeQuestions(questions) {
  const seen = new Set();
  const result = [];

  for (const q of questions) {
    const key = `${q.answer}__${q.clubs.map((c) => c.teamName).join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(q);
  }

  return result;
}

async function main() {
  console.log("🚀 Generating club-path questions...");
  console.log(`   Players to process: ${PLAYER_LIST.length}`);

  const questions = [];
  const skipped = [];

  for (const player of PLAYER_LIST) {
    try {
      console.log(`   📥 Fetching transfers for ${player.name} (ID: ${player.id})...`);

      const transfers = await fetchTransfers(player.id);
      const normalizedClubs = normalizeTransfers(transfers);
      const selectedClubs = pickBestClubWindow(normalizedClubs);

      if (!isUsableCareerPath(selectedClubs)) {
        console.log(`   ⚠️  Skipping ${player.name}: unusable career path`);
        skipped.push({ player: player.name, reason: "unusable career path" });
        await sleep(DELAY_MS);
        continue;
      }

      const { choices, answerIndex } = buildChoices(player, PLAYER_LIST);
      const difficulty = assessDifficulty(selectedClubs);

      const question = {
        id: `cp_${slugify(player.name)}`,
        pos: player.pos,
        difficulty,
        mode: "clubpath",
        text: "Who is this player?",
        choices,
        answerIndex,
        explanation: buildExplanation(player.name, selectedClubs),
        clubs: selectedClubs,
        playerPhoto: `https://media.api-sports.io/football/players/${player.id}.png`
      };

      if (question.answerIndex === -1 || question.choices.length < 4) {
        console.log(`   ⚠️  Skipping ${player.name}: could not build valid choices`);
        skipped.push({ player: player.name, reason: "invalid choices" });
        await sleep(DELAY_MS);
        continue;
      }

      questions.push(question);
      console.log(`   ✅ ${player.name}: ${selectedClubs.length} clubs, difficulty: ${difficulty}`);
    } catch (err) {
      console.error(`   ❌ Error fetching ${player.name}: ${err.message}`);
      skipped.push({ player: player.name, reason: err.message });
    }

    await sleep(DELAY_MS);
  }

  const finalQuestions = dedupeQuestions(questions);

  const outputPath = path.join(__dirname, "..", "src", "data", "clubPathQuestions.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(finalQuestions, null, 2), "utf-8");

  console.log(`\n✅ Generated ${finalQuestions.length} questions → ${outputPath}`);

  if (skipped.length) {
    console.log("\n⚠️ Skipped players:");
    for (const item of skipped) {
      console.log(`   - ${item.player}: ${item.reason}`);
    }
  }

}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
}); onsole.error("Fatal error:", err);
process.exit(1);
});