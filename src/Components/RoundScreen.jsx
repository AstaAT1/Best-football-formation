// ============================================================
// RoundScreen.jsx — draft + optional changement, shuffled choices
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import images from "../constants/images";
import { TIMER_MS, MAX_SWAPS, POS_LABEL, DRAFT_ROUNDS } from "../engine/gameConfig";
import { normalizePos, pickUnusedQuestion, shuffleChoices } from "../engine/gameUtils";
import { planBotAnswer, botPickFromPair, botChangementDecision } from "../engine/ai";
import { gradeAnswer, resolveRound, yellowRecipients } from "../engine/scoring";
import PickScreen from "./PickScreen";
import ChangementPanel from "./ChangementPanel";

export default function RoundScreen({
    roundIndex, pair, allQuestions, usedQuestionIds, settings, teams, onRoundDone,
}) {
    const pos = normalizePos(pair.pos);
    const difficulty = settings?.difficulty ?? "medium";
    const isChange = roundIndex >= DRAFT_ROUNDS;

    const [question, setQuestion] = useState(null);  // shuffled question
    const [botPlan, setBotPlan] = useState(null);
    const [phase, setPhase] = useState("answering");
    const [timerMs, setTimerMs] = useState(TIMER_MS);
    const [swapCount, setSwapCount] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [locked, setLocked] = useState(false);
    const [userTimeMs, setUserTimeMs] = useState(null);
    const [roundWinner, setRoundWinner] = useState(null);
    const [yellows, setYellows] = useState([]);
    const [userCandidate, setUserCandidate] = useState(null);
    const [botCandidate, setBotCandidate] = useState(null);

    const resolvedRef = useRef(false);
    const timerRef = useRef(null);
    const startRef = useRef(Date.now());
    const questionRef = useRef(null);
    const botPlanRef = useRef(null);
    const selectedRef = useRef(null);
    const userTimeRef = useRef(null);
    const lockedRef = useRef(false);
    const swapRef = useRef(0);

    useEffect(() => { questionRef.current = question; }, [question]);
    useEffect(() => { botPlanRef.current = botPlan; }, [botPlan]);
    useEffect(() => { selectedRef.current = selectedIdx; }, [selectedIdx]);
    useEffect(() => { userTimeRef.current = userTimeMs; }, [userTimeMs]);
    useEffect(() => { lockedRef.current = locked; }, [locked]);
    useEffect(() => { swapRef.current = swapCount; }, [swapCount]);

    function clearTimers() {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }

    function loadQuestion() {
        const raw = pickUnusedQuestion(allQuestions, pos, difficulty, usedQuestionIds);
        usedQuestionIds.add(raw.id);
        // Shuffle choices + remap answerIndex
        return shuffleChoices(raw);
    }

    const initRound = useCallback(() => {
        clearTimers();
        resolvedRef.current = false;
        const q = loadQuestion();
        // Bot answers against the SHUFFLED answerIndex
        const bp = planBotAnswer(
            { ...q, answerIndex: q.shuffledAnswerIndex, choices: q.shuffledChoices },
            difficulty
        );
        questionRef.current = q;
        botPlanRef.current = bp;
        selectedRef.current = null;
        userTimeRef.current = null;
        lockedRef.current = false;
        setQuestion(q);
        setBotPlan(bp);
        setPhase("answering");
        setTimerMs(TIMER_MS);
        setSelectedIdx(null);
        setLocked(false);
        setUserTimeMs(null);
        setRoundWinner(null);
        setYellows([]);
        setUserCandidate(null);
        setBotCandidate(null);
        startRef.current = Date.now();
    }, [allQuestions, pos, difficulty, usedQuestionIds]); // eslint-disable-line

    useEffect(() => {
        swapRef.current = 0;
        setSwapCount(0);
        initRound();
        return clearTimers;
    }, [roundIndex]); // eslint-disable-line

    // 12s countdown
    useEffect(() => {
        if (phase !== "answering" || !question) return;
        timerRef.current = setInterval(() => {
            setTimerMs((t) => {
                const next = t - 100;
                if (next <= 0) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setTimeout(() => doResolve(selectedRef.current, userTimeRef.current), 0);
                    return 0;
                }
                return next;
            });
        }, 100);
        return () => { clearInterval(timerRef.current); timerRef.current = null; };
    }, [phase, question, swapCount]); // eslint-disable-line

    // Resolve uses shuffledAnswerIndex
    function doResolve(userChoiceIdx, userTime) {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        clearTimers();
        const q = questionRef.current;
        const bp = botPlanRef.current;
        if (!q || !bp) return;

        const elapsed = Date.now() - startRef.current;
        const botAnswered = bp.timeMs <= Math.max(elapsed, TIMER_MS);
        const bChoice = botAnswered ? bp.choiceIndex : null;
        const bTime = botAnswered ? bp.timeMs : null;
        const uAns = { choiceIndex: userChoiceIdx ?? null, timeMs: userTime ?? null };
        const bAns = { choiceIndex: bChoice, timeMs: bTime };

        // Build a question-like object with shuffled answer index for grading
        const qForGrade = { ...q, answerIndex: q.shuffledAnswerIndex, choices: q.shuffledChoices };
        const result = resolveRound(qForGrade, uAns, bAns);

        if (result === "swap") {
            const nextSwap = swapRef.current + 1;
            if (nextSwap >= MAX_SWAPS) {
                resolvedRef.current = false;
                const forcedQ = loadQuestion();
                const forcedBp = { choiceIndex: forcedQ.shuffledAnswerIndex, timeMs: 3000 };
                questionRef.current = forcedQ;
                botPlanRef.current = forcedBp;
                selectedRef.current = null;
                userTimeRef.current = null;
                lockedRef.current = false;
                swapRef.current = nextSwap;
                setQuestion(forcedQ); setBotPlan(forcedBp); setSwapCount(nextSwap);
                setPhase("answering"); setTimerMs(TIMER_MS);
                setSelectedIdx(null); setLocked(false); setUserTimeMs(null);
                startRef.current = Date.now();
                return;
            }
            swapRef.current = nextSwap;
            setSwapCount(nextSwap);
            setPhase("result_swap");
            setTimeout(() => { resolvedRef.current = false; initRound(); }, 1400);
            return;
        }

        const yRecips = yellowRecipients(qForGrade, uAns, bAns);
        setYellows(yRecips);
        setRoundWinner(result);
        setPhase("result_win");
    }

    function handleChoice(idx) {
        if (phase !== "answering" || lockedRef.current) return;
        const elapsed = Date.now() - startRef.current;
        setSelectedIdx(idx); setUserTimeMs(elapsed); setLocked(true);
        selectedRef.current = idx; userTimeRef.current = elapsed; lockedRef.current = true;
        setTimeout(() => doResolve(idx, elapsed), 250);
    }

    function wasUserCorrect() {
        if (!question || selectedIdx === null) return false;
        return selectedIdx === question.shuffledAnswerIndex;
    }
    function wasBotCorrect() {
        if (!botPlan || !question || botPlan.choiceIndex === null) return false;
        return botPlan.choiceIndex === question.shuffledAnswerIndex;
    }

    function handleContinue() {
        if (roundWinner === "user") {
            setPhase("picking");
        } else {
            const botPicked = botPickFromPair(pair.playerA, pair.playerB, difficulty);
            const userGets = botPicked.id === pair.playerA.id ? pair.playerB : pair.playerA;
            if (isChange) {
                setUserCandidate(userGets);
                setBotCandidate(botPicked);
                setPhase("changement");
            } else {
                onRoundDone({
                    userPlayer: userGets, botPlayer: botPicked,
                    yellowFor: yellows, isChangement: false,
                    userCorrect: wasUserCorrect(), botCorrect: wasBotCorrect(),
                });
            }
        }
    }

    function handleUserPick(chosen) {
        const other = chosen.id === pair.playerA.id ? pair.playerB : pair.playerA;
        if (isChange) {
            setUserCandidate(chosen);
            setBotCandidate(other);
            setPhase("changement");
        } else {
            onRoundDone({
                userPlayer: chosen, botPlayer: other,
                yellowFor: yellows, isChangement: false,
                userCorrect: wasUserCorrect(), botCorrect: wasBotCorrect(),
            });
        }
    }

    function handleChangementReplace(discardPlayer) {
        const botTeamAtPos = (teams.bot || []).filter((p) => normalizePos(p.pos) === pos);
        const botDecision = botChangementDecision(botCandidate, botTeamAtPos, difficulty);
        onRoundDone({
            userPlayer: userCandidate, botPlayer: botCandidate,
            yellowFor: yellows, isChangement: true,
            userSkipped: false, userDiscard: discardPlayer,
            botSkipped: botDecision.action === "skip", botDiscard: botDecision.discard,
            userCorrect: wasUserCorrect(), botCorrect: wasBotCorrect(),
        });
    }

    function handleChangementSkip() {
        const botTeamAtPos = (teams.bot || []).filter((p) => normalizePos(p.pos) === pos);
        const botDecision = botChangementDecision(botCandidate, botTeamAtPos, difficulty);
        onRoundDone({
            userPlayer: userCandidate, botPlayer: botCandidate,
            yellowFor: yellows, isChangement: true,
            userSkipped: true, userDiscard: null,
            botSkipped: botDecision.action === "skip", botDiscard: botDecision.discard,
            userCorrect: wasUserCorrect(), botCorrect: wasBotCorrect(),
        });
    }

    // Render
    if (!question || !botPlan) return null;

    const timerPct = Math.max(0, (timerMs / TIMER_MS) * 100);
    const timerSec = Math.max(0, Math.ceil(timerMs / 1000));
    const uCorrect = selectedIdx !== null && selectedIdx === question.shuffledAnswerIndex;
    const bCorrect = botPlan.choiceIndex === question.shuffledAnswerIndex;
    const userTeamAtPos = (teams.user || []).filter((p) => normalizePos(p.pos) === pos);

    return (
        <>
            {phase === "picking" && <PickScreen pair={pair} onPick={handleUserPick} />}

            {phase === "changement" && userCandidate && (
                <ChangementPanel
                    candidate={userCandidate} pos={pos} teamAtPos={userTeamAtPos}
                    onReplace={handleChangementReplace} onSkip={handleChangementSkip}
                />
            )}

            <div className="flex flex-col items-center gap-4 py-4 sm:py-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-bold text-white/60 shadow-sm backdrop-blur-md">
                        Round {roundIndex + 1} / 15
                        {isChange && <span className="ml-2 font-black text-amber-500"> CHANGEMENT</span>}
                    </span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] ${pos === "GK" ? "bg-amber-400/15 text-amber-400" :
                        pos === "DF" ? "bg-white/[0.08] text-slate-300" :
                            pos === "MF" ? "bg-white/[0.08] text-slate-200" :
                                "bg-rose-500/15 text-rose-500"
                        }`}>
                        {POS_LABEL[pos]}
                    </span>
                </div>

                {/* Timer Bar */}
                <div className="relative mx-auto mt-2 w-full max-w-2xl px-2">
                    <div className="flex items-end justify-between px-1 pb-1.5 opacity-80">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
                            Time Remaining
                        </span>
                        <span className="font-mono text-sm font-bold text-white/80">
                            {timerSec}s
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                        <div
                            className={`h-full rounded-full transition-all duration-100 ease-linear ${timerPct > 40
                                    ? "bg-gradient-to-r from-sky-500 to-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                    : timerPct > 15
                                        ? "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                                        : "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.8)]"
                                }`}
                            style={{ width: `${timerPct}%` }}
                        />
                    </div>
                    {/* Urgency Red Glow Overlay */}
                    {timerPct <= 15 && timerPct > 0 && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 animate-pulse bg-rose-500/10 mix-blend-screen blur-xl" />
                    )}
                </div>

                <div className="mx-auto flex w-full max-w-2xl justify-center gap-4 sm:gap-6">
                    {[pair.playerA, pair.playerB].map((p) => (
                        <div key={p.id} className="flex w-full max-w-[280px] flex-1 flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0b1018]/60 p-4 text-center shadow-lg backdrop-blur-md">
                            <img src={images[p.imageKey]} alt={p.name} className="h-20 w-20 rounded-full border-2 border-white/10 object-cover shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
                            <strong className="mt-1 text-[15px] font-bold text-white">{p.name}</strong>
                            <span className="text-xs text-white/50">{p.nation}</span>
                            <span className="text-xs text-white/50">{p.club}</span>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${pos === "GK" ? "bg-amber-400/15 text-amber-400" :
                                pos === "DF" ? "bg-white/[0.08] text-slate-300" :
                                    pos === "MF" ? "bg-white/[0.08] text-slate-200" :
                                        "bg-rose-500/15 text-rose-500"
                                }`}>
                                {POS_LABEL[pos]}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Question Area */}
                {(phase === "answering" || phase === "result_swap") && (
                    <div className="mx-auto mt-2 flex w-full max-w-2xl flex-col items-center gap-6">
                        <div className="w-full rounded-2xl border border-white/10 bg-[#0b1018]/80 p-5 shadow-xl backdrop-blur-md sm:p-6">
                            <h2 className="text-center text-lg font-bold leading-relaxed text-white sm:text-xl">{question.text}</h2>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                            {question.shuffledChoices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/50 active:scale-95 ${selectedIdx === idx
                                        ? "border-sky-400/50 bg-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                                        : "border-white/10 bg-[#0b1018]/60 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                                        } ${(locked || phase === "result_swap") && selectedIdx !== idx ? "opacity-50" : ""}`}
                                    onClick={() => handleChoice(idx)}
                                    disabled={locked || phase === "result_swap"}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black transition-colors ${selectedIdx === idx ? "bg-sky-400 text-[#0b1018]" : "bg-white/[0.08] text-white/50 group-hover:bg-white/15 group-hover:text-white"
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className={`text-sm font-medium transition-colors sm:text-base ${selectedIdx === idx ? "text-white" : "text-white/80 group-hover:text-white"
                                        }`}>
                                        {choice}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {phase === "result_swap" && (
                    <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm text-white/60">
                        <strong>🔄 Both wrong! Swapping question… ({swapCount}/{MAX_SWAPS})</strong>
                    </div>
                )}

                {phase === "result_win" && (
                    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
                        <h2 className="mb-2 text-center text-xl font-bold leading-relaxed text-white/60 sm:text-2xl">{question.text}</h2>

                        <div className="w-full grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {question.shuffledChoices.map((choice, idx) => {
                                const isCorrect = idx === question.shuffledAnswerIndex;
                                const isSelected = idx === selectedIdx;
                                return (
                                    <div key={idx} className={`relative flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" :
                                        isSelected ? "border-rose-500/50 bg-rose-500/10" :
                                            "border-white/10 bg-white/[0.02]"
                                        }`}>
                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black ${isCorrect ? "bg-emerald-500 text-white" :
                                            isSelected ? "bg-rose-500 text-white" :
                                                "bg-white/[0.05] text-white/30"
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className={`text-sm sm:text-base ${isCorrect ? "text-emerald-100 font-bold" :
                                            isSelected ? "text-rose-100" :
                                                "text-white/40"
                                            }`}>
                                            {choice}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`mt-2 flex w-full flex-col gap-2 rounded-2xl border p-5 text-center shadow-lg backdrop-blur-md ${roundWinner === "user" ? "border-emerald-500/25 bg-emerald-950/20" : "border-rose-500/20 bg-rose-950/20"
                            }`}>
                            <span className={`text-lg font-black uppercase tracking-wide ${roundWinner === "user" ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                {roundWinner === "user" ? "🏆 You win this round!" : "🤖 Bot wins this round!"}
                            </span>

                            <span className="mt-2 text-sm text-white/60">
                                You: {selectedIdx !== null ? (uCorrect ? "✅" : "❌") : "⌛ No answer"}
                                {userTimeMs != null && ` ${(userTimeMs / 1000).toFixed(1)}s`}
                                <span className="mx-2 opacity-30">|</span>
                                Bot: {bCorrect ? "✅" : "❌"} {(botPlan.timeMs / 1000).toFixed(1)}s
                            </span>

                            {question.explanation && (
                                <span className="mt-4 rounded-xl bg-black/30 p-4 text-xs italic leading-relaxed text-white/60">
                                    {question.explanation}
                                </span>
                            )}

                            {yellows.length > 0 && (
                                <span className="mt-4 rounded-lg bg-amber-500/10 py-2 text-xs font-bold text-amber-500">
                                    🟡 Yellow: {yellows.map((w) => w === "user" ? settings.teamName : "AI FC").join(", ")}
                                </span>
                            )}
                        </div>

                        <button
                            className="mt-4 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/10 focus:ring-2 focus:ring-white/20 active:scale-95"
                            onClick={handleContinue}
                        >
                            {isChange
                                ? "Changement Decision"
                                : roundWinner === "user" ? "Pick Your Player" : "Continue"}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
