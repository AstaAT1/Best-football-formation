// ============================================================
// gameConfig.jsx — central config for 15-round game
// ============================================================

/**
 * 15 rounds total:
 *   1)   GK
 *   2-5) DF ×4
 *   6-8) MF ×3
 *   9-11) ATK ×3
 *   --- changement rounds ---
 *   12) GK   (replace)
 *   13) DF   (replace)
 *   14) MF   (replace)
 *   15) ATK  (replace)
 */
export const ROUND_POSITIONS = [
  "GK",
  "DF", "DF", "DF", "DF",
  "MF", "MF", "MF",
  "ATK", "ATK", "ATK",
  // changement
  "GK", "DF", "MF", "ATK",
];

export const TOTAL_ROUNDS = 15;
export const DRAFT_ROUNDS = 11;   // first 11 = normal draft
export const TIMER_MS = 12_000;
export const MAX_SWAPS = 3;
export const YELLOWS_TO_RED = 3;
export const YELLOW_PTS = -2;
export const STREAK_THRESHOLD = 3;    // 3 correct in a row

/** Players needed per position for draft (22) + changement (8) = 30 total */
export const DRAFT_NEEDS = { GK: 2, DF: 8, MF: 6, ATK: 6 };
export const CHANGE_NEEDS = { GK: 2, DF: 2, MF: 2, ATK: 2 };

export const POS_LABEL = {
  GK: "Goalkeeper",
  DF: "Defender",
  MF: "Midfielder",
  ATK: "Attacker",
};

export const DIFF = {
  easy: {
    accMin: 0.45, accMax: 0.55,
    speedMin: 6_000, speedMax: 11_000,
    pickBest: 0.30,
  },
  medium: {
    accMin: 0.60, accMax: 0.70,
    speedMin: 3_000, speedMax: 8_000,
    pickBest: 0.72,
  },
  hard: {
    accMin: 0.75, accMax: 0.90,
    speedMin: 1_200, speedMax: 5_000,
    pickBest: 0.95,
  },
};
