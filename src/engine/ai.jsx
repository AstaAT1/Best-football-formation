// ============================================================
// ai.jsx — bot logic & draft-pair construction for 15 rounds
// ============================================================
import { DIFF, DRAFT_NEEDS, CHANGE_NEEDS, ROUND_POSITIONS } from "./gameConfig";
import { shuffle, sampleN, groupByPos, normalizePos, randFloat } from "./gameUtils";

/**
 * Plan how and when the bot answers.
 * Returns { choiceIndex, timeMs }
 */
export function planBotAnswer(question, difficulty) {
    const cfg = DIFF[difficulty] ?? DIFF.medium;
    const accuracy = randFloat(cfg.accMin, cfg.accMax);
    const isCorrect = Math.random() < accuracy;
    const timeMs = Math.round(randFloat(cfg.speedMin, cfg.speedMax));

    let choiceIndex;
    if (isCorrect) {
        choiceIndex = question.answerIndex;
    } else {
        const wrong = question.choices
            .map((_, i) => i)
            .filter((i) => i !== question.answerIndex);
        choiceIndex = wrong[Math.floor(Math.random() * wrong.length)];
    }
    return { choiceIndex, timeMs };
}

/**
 * Bot picks which player from the pair (when bot wins the round).
 */
export function botPickFromPair(playerA, playerB, difficulty) {
    const cfg = DIFF[difficulty] ?? DIFF.medium;
    const better = playerA.overall >= playerB.overall ? playerA : playerB;
    const worse = playerA.overall >= playerB.overall ? playerB : playerA;
    return Math.random() < cfg.pickBest ? better : worse;
}

/**
 * Bot selects a player to remove from a team (red-card penalty at end).
 */
export function botRemovePlayer(team, difficulty) {
    if (!team.length) return null;
    const cfg = DIFF[difficulty] ?? DIFF.medium;
    if (Math.random() < cfg.pickBest) {
        return [...team].sort((a, b) => b.overall - a.overall)[0];
    }
    return team[Math.floor(Math.random() * team.length)];
}

/**
 * Bot decides whether to apply or skip a changement.
 * candidate: the player the bot received from the draft pair
 * botTeamAtPos: array of bot's current players at this position
 *
 * Returns { action: "replace"|"skip", discard: player|null }
 *   - "replace" + discard → swap discard for candidate
 *   - "skip" → keep team as-is, discard candidate
 */
export function botChangementDecision(candidate, botTeamAtPos, difficulty) {
    if (!botTeamAtPos.length) return { action: "skip", discard: null };

    const weakest = [...botTeamAtPos].sort((a, b) => a.overall - b.overall)[0];
    const diff = candidate.overall - weakest.overall;

    if (difficulty === "easy") {
        // Easy: replace only if candidate is much better (>5), or random 20% chance
        if (diff > 5 || (diff > 0 && Math.random() < 0.2)) {
            return { action: "replace", discard: weakest };
        }
        return { action: "skip", discard: null };
    }

    if (difficulty === "medium") {
        // Medium: replace if candidate is better (threshold 2)
        if (diff >= 2) return { action: "replace", discard: weakest };
        if (diff > 0 && Math.random() < 0.4) return { action: "replace", discard: weakest };
        return { action: "skip", discard: null };
    }

    // Hard: replace if candidate is better at all (threshold 0)
    if (diff > 0) return { action: "replace", discard: weakest };
    if (diff === 0 && Math.random() < 0.3) return { action: "replace", discard: weakest };
    return { action: "skip", discard: null };
}

/**
 * Build 15 draft pairs from allPlayers.
 * First 11 pairs = draft (GK×2, DF×8, MF×6, ATK×6 = 22 players)
 * Last 4 pairs  = changement (GK×2, DF×2, MF×2, ATK×2 = 8 players)
 * Returns array of { pos, playerA, playerB, isChangement }
 */
export function buildDraftPairs(allPlayers) {
    const grouped = groupByPos(allPlayers);

    const draftPool = {};
    for (const [pos, need] of Object.entries(DRAFT_NEEDS)) {
        draftPool[pos] = shuffle(sampleN(grouped[pos] ?? [], need));
    }

    const usedIds = new Set();
    for (const list of Object.values(draftPool)) {
        for (const p of list) usedIds.add(p.id);
    }

    const changePool = {};
    for (const [pos, need] of Object.entries(CHANGE_NEEDS)) {
        const remaining = (grouped[pos] ?? []).filter((p) => !usedIds.has(p.id));
        changePool[pos] = shuffle(sampleN(remaining, need));
    }

    const draftIdx = { GK: 0, DF: 0, MF: 0, ATK: 0 };
    const changeIdx = { GK: 0, DF: 0, MF: 0, ATK: 0 };

    return ROUND_POSITIONS.map((pos, i) => {
        const isChangement = i >= 11;
        const pool = isChangement ? changePool : draftPool;
        const idx = isChangement ? changeIdx : draftIdx;
        const j = idx[pos];
        idx[pos] += 2;
        return {
            pos,
            playerA: pool[pos][j],
            playerB: pool[pos][j + 1],
            isChangement,
        };
    });
}
