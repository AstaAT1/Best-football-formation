// ============================================================
// ClubPathGameScreen.jsx — main controller for "Guess by Clubs" mode
// ============================================================
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ClubPathQuestion from "./ClubPathQuestion";
import ClubPathResults from "./ClubPathResults";
import images from "../../constants/images";

const QUESTIONS_PER_GAME = 10;

/** Fisher-Yates shuffle */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function ClubPathGameScreen({ questions, onExit }) {
    const { t } = useTranslation("ui");

    // Shuffle and pick N questions for this game session
    const gameQuestions = useMemo(
        () => shuffle(questions).slice(0, Math.min(QUESTIONS_PER_GAME, questions.length)),
        [] // eslint-disable-line
    );

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]); // { answer, clubs, correct }[]
    const [phase, setPhase] = useState("playing"); // "playing" | "finished"

    const handleAnswer = useCallback(
        (isCorrect) => {
            const q = gameQuestions[currentIndex];
            const newResults = [
                ...results,
                {
                    answer: q.answer,
                    clubs: q.clubs,
                    correct: isCorrect,
                },
            ];
            const newScore = isCorrect ? score + 1 : score;

            setResults(newResults);
            setScore(newScore);

            if (currentIndex + 1 >= gameQuestions.length) {
                setPhase("finished");
            } else {
                setCurrentIndex(currentIndex + 1);
            }
        },
        [currentIndex, gameQuestions, results, score]
    );

    if (phase === "finished") {
        return (
            <ClubPathResults
                score={score}
                total={gameQuestions.length}
                results={results}
                onPlayAgain={onExit}
            />
        );
    }

    const currentQuestion = gameQuestions[currentIndex];
    if (!currentQuestion) return null;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-8">
            {/* Back button */}
            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold text-white/60 backdrop-blur-md transition hover:bg-black/50 hover:text-white"
                >
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    {t("backToMenu") || "BACK"}
                </button>
            </div>

            <ClubPathQuestion
                key={currentIndex}
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={gameQuestions.length}
                onAnswer={handleAnswer}
            />
        </div>
    );
}
