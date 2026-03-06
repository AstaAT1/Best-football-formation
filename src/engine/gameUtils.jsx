// ============================================================
// gameUtils.jsx — pure, side-effect-free helpers
// ============================================================

/** Fisher-Yates shuffle (returns new array) */
export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Pick n items from list at random, without replacement */
export function sampleN(list, n) {
    return shuffle(list).slice(0, Math.min(n, list.length));
}

/** Normalise position string to uppercase */
export function normalizePos(pos) {
    return (pos ?? "").toUpperCase();
}

/** Normalise text for comparison */
export function normalizeText(str) {
    return (str ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Group an array of players by their pos (normalised).
 * Returns { GK:[], DF:[], MF:[], ATK:[] }
 */
export function groupByPos(players) {
    const g = { GK: [], DF: [], MF: [], ATK: [] };
    for (const p of players) {
        const pos = normalizePos(p.pos);
        if (g[pos]) g[pos].push(p);
    }
    return g;
}

/**
 * Shuffle question choices and remap the correct answer index.
 * Returns { ...question, shuffledChoices, shuffledAnswerIndex }
 */
export function shuffleChoices(question) {
    // Create indexed pairs: [originalIndex, choiceText]
    const indexed = question.choices.map((c, i) => ({ text: c, origIdx: i }));
    const shuffled = shuffle(indexed);
    const shuffledChoices = shuffled.map((s) => s.text);
    const shuffledAnswerIndex = shuffled.findIndex(
        (s) => s.origIdx === question.answerIndex
    );
    return {
        ...question,
        shuffledChoices,
        shuffledAnswerIndex,
    };
}

/**
 * Pick an unused question for `pos` & `difficulty`.
 * Falls back progressively through difficulty levels, then any pos,
 * then any question.  Never returns a question in usedIds.
 */
export function pickUnusedQuestion(questions, pos, difficulty, usedIds) {
    const posUp = normalizePos(pos);
    const unusedForPos = questions.filter(
        (q) => normalizePos(q.pos) === posUp && !usedIds.has(q.id)
    );

    const diffOrder =
        difficulty === "easy" ? ["easy", "medium", "hard"] :
            difficulty === "hard" ? ["hard", "medium", "easy"] :
                ["medium", "easy", "hard"];

    for (const d of diffOrder) {
        const pool = unusedForPos.filter((q) => q.difficulty === d);
        if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }

    const anyUnused = questions.filter((q) => !usedIds.has(q.id));
    if (anyUnused.length) return anyUnused[Math.floor(Math.random() * anyUnused.length)];

    return questions[0];
}

/** Random float in [min, max) */
export function randFloat(min, max) {
    return min + Math.random() * (max - min);
}
