// ============================================================
// ClubPathQuestion.jsx — renders a single "guess the player" question
// ============================================================
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import images from "../../constants/images";

/** Normalize a string for fuzzy comparison */
function normalize(str) {
    return (str || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip accents
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ");
}

function isAnswerCorrect(userAnswer, question) {
    const normalizedUser = normalize(userAnswer);
    if (!normalizedUser) return false;

    // Check against all acceptable answers
    const allAnswers = [question.answer, ...(question.acceptableAnswers || [])];
    return allAnswers.some((ans) => normalize(ans) === normalizedUser);
}

const QUESTION_TIMER_MS = 20_000;

export default function ClubPathQuestion({
    question,
    questionIndex,
    totalQuestions,
    onAnswer,
}) {
    const { t } = useTranslation("ui");
    const [input, setInput] = useState("");
    const [phase, setPhase] = useState("answering"); // "answering" | "revealed"
    const [isCorrect, setIsCorrect] = useState(false);
    const [timerMs, setTimerMs] = useState(QUESTION_TIMER_MS);
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const resolvedRef = useRef(false);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Timer countdown
    useEffect(() => {
        if (phase !== "answering") return;
        timerRef.current = setInterval(() => {
            setTimerMs((prev) => {
                const next = prev - 100;
                if (next <= 0) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    handleSubmit(true);
                    return 0;
                }
                return next;
            });
        }, 100);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]); // eslint-disable-line

    function handleSubmit(timedOut = false) {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const answer = timedOut ? "" : input;
        const correct = isAnswerCorrect(answer, question);
        setIsCorrect(correct);
        setPhase("revealed");
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    }

    function handleContinue() {
        onAnswer(isCorrect);
    }

    const timerPct = Math.max(0, (timerMs / QUESTION_TIMER_MS) * 100);
    const timerSec = Math.max(0, Math.ceil(timerMs / 1000));
    const clubs = question.clubs || [];

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto px-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-bold text-white/60 shadow-sm backdrop-blur-md">
                    {t("clubPathQuestion") || "Question"} {questionIndex + 1} / {totalQuestions}
                </span>
                <span className="inline-block rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]">
                    {t("guessByClubs") || "Guess by Clubs"}
                </span>
            </div>

            {/* Timer Bar */}
            {phase === "answering" && (
                <div className="relative w-full max-w-2xl">
                    <div className="flex items-end justify-between px-1 pb-1.5 opacity-80">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
                            {t("timeRemaining") || "TIME REMAINING"}
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
                </div>
            )}

            {/* Prompt text */}
            <div className="w-full rounded-2xl border border-white/10 bg-[#0b1018]/80 p-5 shadow-xl backdrop-blur-md text-center">
                <h2 className="text-lg font-bold leading-relaxed text-white sm:text-xl">
                    {t("whoIsThisPlayer") || "Who is this player?"}
                </h2>
                <p className="mt-1 text-sm text-white/50">
                    {t("clubPathHint") || "Identify the player from their club career path"}
                </p>
            </div>

            {/* Club Career Path */}
            <div className="w-full rounded-2xl border border-white/10 bg-[#0b1018]/60 p-6 shadow-xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {clubs.map((club, idx) => (
                        <div key={idx} className="flex items-center gap-2 sm:gap-3">
                            {/* Club Card */}
                            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 min-w-[80px] sm:min-w-[100px] transition-all hover:bg-white/[0.06] hover:border-white/20">
                                <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center">
                                    <img
                                        src={club.logo}
                                        alt={club.teamName}
                                        className="h-full w-full object-contain drop-shadow-lg"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                    <div
                                        className="hidden absolute inset-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold text-white/70 text-center p-1"
                                    >
                                        {club.teamName}
                                    </div>
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold text-white/80 text-center leading-tight max-w-[80px] sm:max-w-[100px] truncate">
                                    {club.teamName}
                                </span>
                                <span className="text-[10px] text-white/40 font-mono">
                                    {club.yearFrom || "?"}{club.yearTo ? `–${club.yearTo}` : "–"}
                                </span>
                            </div>

                            {/* Arrow between clubs */}
                            {idx < clubs.length - 1 && (
                                <svg
                                    width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    className="text-white/30 shrink-0 hidden sm:block"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>

                            )}
                            {idx < clubs.length - 1 && (
                                <svg
                                    width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    className="text-white/30 shrink-0 sm:hidden"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Answer Input or Result */}
            {phase === "answering" && (
                <div className="w-full flex flex-col items-center gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("enterPlayerName") || "Enter player name..."}
                        className="h-[52px] w-full max-w-md rounded-2xl border border-white/10 bg-black/20 px-5 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-black/30 text-center"
                        maxLength={50}
                        autoComplete="off"
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim()}
                        className="h-[48px] w-full max-w-md rounded-2xl bg-white text-[14px] font-black uppercase tracking-[0.05em] text-[#020617] transition hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                    >
                        {t("submitAnswer") || "SUBMIT ANSWER"}
                    </button>
                </div>
            )}

            {phase === "revealed" && (
                <div className="w-full flex flex-col items-center gap-4">
                    {/* Result card */}
                    <div
                        className={`w-full max-w-md flex flex-col items-center gap-3 rounded-2xl border p-5 text-center shadow-lg backdrop-blur-md ${isCorrect
                            ? "border-emerald-500/25 bg-emerald-950/20"
                            : "border-rose-500/20 bg-rose-950/20"
                            }`}
                    >
                        <span
                            className={`text-lg font-black uppercase tracking-wide ${isCorrect ? "text-emerald-400" : "text-rose-400"
                                }`}
                        >
                            {isCorrect
                                ? (t("correct") || "✅ CORRECT!")
                                : (t("incorrect") || "❌ INCORRECT")}
                        </span>

                        {/* Player photo reveal */}
                        {question.playerPhoto && (
                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-white/20 bg-white/5 shadow-lg">
                                <img
                                    src={question.playerPhoto}
                                    alt={question.answer}
                                    className="h-full w-full object-cover"
                                    onError={(e) => { e.target.parentElement.style.display = "none"; }}
                                />
                            </div>
                        )}

                        <span className="text-sm text-white/60">
                            {t("thePlayerWas") || "The player was"}:
                        </span>
                        <span className="text-xl font-black text-white">
                            {question.answer}
                        </span>
                        {!isCorrect && input.trim() && (
                            <span className="mt-1 text-xs text-white/40">
                                {t("yourAnswer") || "Your answer"}: {input}
                            </span>
                        )}
                    </div>

                    <button
                        className="mt-2 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/10 focus:ring-2 focus:ring-white/20 active:scale-95"
                        onClick={handleContinue}
                    >
                        {t("continueBtn") || "CONTINUE"}
                        <svg
                            width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
