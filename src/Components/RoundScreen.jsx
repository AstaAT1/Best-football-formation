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
    const timerSec = (timerMs / 1000).toFixed(1);
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

            <div className="round-center">
                <div className="round-header">
                    <span className="round-badge">
                        Round {roundIndex + 1} / 15
                        {isChange && <span className="change-tag">  CHANGEMENT</span>}
                    </span>
                    <span className={`pos-pill pos-${pos}`}>{POS_LABEL[pos]}</span>
                </div>

                <div className="timer-wrap">
                    <div
                        className={`timer-bar ${timerPct < 30 ? "timer-danger" : ""}`}
                        style={{ width: `${timerPct}%` }}
                    />
                    <span className="timer-label">{timerSec}s</span>
                </div>

                <div className="draft-pair">
                    {[pair.playerA, pair.playerB].map((p) => (
                        <div key={p.id} className="draft-card">
                            <img src={images[p.imageKey]} alt={p.name} className="draft-img" />
                            <strong className="draft-name">{p.name}</strong>
                            <span className="draft-meta">{p.nation}</span>
                            <span className="draft-meta">{p.club}</span>
                            <span className={`pos-pill pos-${pos} small`}>{POS_LABEL[pos]}</span>
                        </div>
                    ))}
                </div>

                {/* Question — uses SHUFFLED choices */}
                {(phase === "answering" || phase === "result_swap") && (
                    <>
                        <p className="question-text">{question.text}</p>
                        <div className="choices-grid">
                            {question.shuffledChoices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    className={`choice-btn ${selectedIdx === idx ? "chosen" : ""}`}
                                    onClick={() => handleChoice(idx)}
                                    disabled={locked || phase === "result_swap"}
                                >
                                    <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {phase === "result_swap" && (
                    <div className="result-swap">
                        <strong>🔄 Both wrong! Swapping question… ({swapCount}/{MAX_SWAPS})</strong>
                    </div>
                )}

                {phase === "result_win" && (
                    <div className="result-win-block">
                        <p className="question-text">{question.text}</p>
                        <div className="choices-grid">
                            {question.shuffledChoices.map((choice, idx) => {
                                let cls = "choice-btn resolved";
                                if (idx === question.shuffledAnswerIndex) cls += " correct";
                                else if (idx === selectedIdx) cls += " wrong";
                                return (
                                    <button key={idx} className={cls} disabled>
                                        <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={`result-banner ${roundWinner === "user" ? "banner-win" : "banner-lose"}`}>
                            <span>{roundWinner === "user" ? "🏆 You win this round!" : "🤖 Bot wins this round!"}</span>
                            <span className="result-detail">
                                You: {selectedIdx !== null ? (uCorrect ? "✅" : "❌") : "⌛ No answer"}
                                {userTimeMs != null && ` ${(userTimeMs / 1000).toFixed(1)}s`}
                                {" · "}
                                Bot: {bCorrect ? "✅" : "❌"} {(botPlan.timeMs / 1000).toFixed(1)}s
                            </span>
                            {question.explanation && (
                                <span className="result-explanation">{question.explanation}</span>
                            )}
                            {yellows.length > 0 && (
                                <span className="result-yellow">
                                    🟡 Yellow: {yellows.map((w) => w === "user" ? settings.teamName : "AI FC").join(", ")}
                                </span>
                            )}
                        </div>

                        <button className="btn-continue" onClick={handleContinue}>
                            {isChange
                                ? "Changement Decision →"
                                : roundWinner === "user" ? "Pick Your Player →" : "Continue →"}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
