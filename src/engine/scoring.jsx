// ============================================================
// scoring.jsx — grading, round resolution, cards, streak, final
// ============================================================
import { YELLOWS_TO_RED, YELLOW_PTS, STREAK_THRESHOLD } from "./gameConfig";

/** Returns true if choiceIndex matches the correct answer */
export function gradeAnswer(question, choiceIndex) {
    return choiceIndex === question.answerIndex;
}

/**
 * Resolve a round outcome.
 * userAnswer : { choiceIndex: number|null, timeMs: number|null }
 * botAnswer  : { choiceIndex: number|null, timeMs: number|null }
 * Returns: "user" | "bot" | "swap"
 */
export function resolveRound(question, userAnswer, botAnswer) {
    const uCorrect = userAnswer.choiceIndex !== null &&
        gradeAnswer(question, userAnswer.choiceIndex);
    const bCorrect = botAnswer.choiceIndex !== null &&
        gradeAnswer(question, botAnswer.choiceIndex);

    if (!uCorrect && !bCorrect) return "swap";
    if (uCorrect && !bCorrect) return "user";
    if (!uCorrect && bCorrect) return "bot";

    // Both correct → faster wins
    const uTime = userAnswer.timeMs ?? Infinity;
    const bTime = botAnswer.timeMs ?? Infinity;
    return uTime <= bTime ? "user" : "bot";
}

/**
 * Returns which players ("user"|"bot") should receive a yellow.
 * Only when one was wrong while the other was right.
 */
export function yellowRecipients(question, userAnswer, botAnswer) {
    const uCorrect = userAnswer.choiceIndex !== null &&
        gradeAnswer(question, userAnswer.choiceIndex);
    const bCorrect = botAnswer.choiceIndex !== null &&
        gradeAnswer(question, botAnswer.choiceIndex);
    const out = [];
    if (!uCorrect && bCorrect) out.push("user");
    if (!bCorrect && uCorrect) out.push("bot");
    return out;
}

/** Initial card state */
export function initCards() {
    return { userYellow: 0, userRed: 0, botYellow: 0, botRed: 0 };
}

/** Initial streak state */
export function initStreaks() {
    return {
        userStreak: 0, botStreak: 0,
        userShield: false, botShield: false,
    };
}

/**
 * Apply yellow to `who`, respecting shield.
 * Returns { cards, streaks, shieldUsed }
 */
export function applyYellowWithShield(cards, streaks, who) {
    let c = { ...cards };
    let s = { ...streaks };
    let shieldUsed = false;

    const shieldKey = who === "user" ? "userShield" : "botShield";
    if (s[shieldKey]) {
        // Shield absorbs the yellow
        s[shieldKey] = false;
        shieldUsed = true;
    } else {
        if (who === "user") c.userYellow += 1;
        else c.botYellow += 1;
    }

    // Convert yellows to reds
    while (c.userYellow >= YELLOWS_TO_RED) { c.userYellow -= YELLOWS_TO_RED; c.userRed += 1; }
    while (c.botYellow >= YELLOWS_TO_RED) { c.botYellow -= YELLOWS_TO_RED; c.botRed += 1; }

    return { cards: c, streaks: s, shieldUsed };
}

/**
 * Update streak after a round.
 * `wasCorrect` is the answer correctness for `who`.
 * Returns { streaks, bonusTriggered, bonusType }
 * bonusType: "removeYellow" | "shield" | null
 */
export function updateStreak(cards, streaks, who, wasCorrect) {
    let s = { ...streaks };
    let c = { ...cards };
    const streakKey = who === "user" ? "userStreak" : "botStreak";
    const yellowKey = who === "user" ? "userYellow" : "botYellow";
    const shieldKey = who === "user" ? "userShield" : "botShield";

    if (wasCorrect) {
        s[streakKey] += 1;
    } else {
        s[streakKey] = 0;
        return { cards: c, streaks: s, bonusTriggered: false, bonusType: null };
    }

    let bonusTriggered = false;
    let bonusType = null;

    if (s[streakKey] >= STREAK_THRESHOLD) {
        s[streakKey] = 0; // reset streak
        bonusTriggered = true;
        if (c[yellowKey] > 0) {
            c[yellowKey] -= 1;
            bonusType = "removeYellow";
        } else {
            s[shieldKey] = true;
            bonusType = "shield";
        }
    }

    return { cards: c, streaks: s, bonusTriggered, bonusType };
}

/** Sum of overall ratings for a list of players */
export function sumOverall(team) {
    return team.reduce((s, p) => s + (p.overall ?? 0), 0);
}

/**
 * Compute final scores after all removals.
 * Returns { teamRating, penaltyPoints, finalScore }
 */
export function computeFinalScore(remainingTeam, remainingYellows) {
    const teamRating = sumOverall(remainingTeam);
    const penaltyPoints = YELLOW_PTS * remainingYellows;
    return { teamRating, penaltyPoints, finalScore: teamRating + penaltyPoints };
}
