// ============================================================
// ClubPathResults.jsx — end screen for "Guess by Clubs" mode
// ============================================================
import { useTranslation } from "react-i18next";
import images from "../../constants/images";

export default function ClubPathResults({
    score,
    total,
    results,
    onPlayAgain,
}) {
    const { t } = useTranslation("ui");
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    const grade =
        pct >= 80
            ? { emoji: "🏆", label: t("clubPathGradeExcellent") || "Excellent!", color: "text-amber-400" }
            : pct >= 50
                ? { emoji: "⚽", label: t("clubPathGradeGood") || "Good job!", color: "text-emerald-400" }
                : { emoji: "💪", label: t("clubPathGradeKeepTrying") || "Keep trying!", color: "text-sky-400" };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
            <div className="w-full max-w-xl">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/35 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
                    <div className="px-6 py-8 sm:px-10 sm:py-10">
                        {/* Header */}
                        <header className="mb-6 text-center">
                            <div className="text-5xl mb-3">{grade.emoji}</div>
                            <h1 className={`text-2xl font-black ${grade.color} sm:text-3xl`}>
                                {grade.label}
                            </h1>
                            <p className="mt-2 text-sm text-white/50">
                                {t("clubPathResultsSub") || "Guess the Player by Clubs — Results"}
                            </p>
                        </header>

                        {/* Score circle */}
                        <div className="mx-auto mb-8 flex flex-col items-center gap-1">
                            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/10 bg-white/[0.03]">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">{score}</div>
                                    <div className="text-xs font-bold text-white/40">/ {total}</div>
                                </div>
                            </div>
                            <span className="mt-2 text-sm font-bold text-white/50">{pct}%</span>
                        </div>

                        {/* Results list */}
                        <div className="mb-6 max-h-[300px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-1.5">
                            <div className="space-y-1">
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.correct
                                                ? "bg-emerald-500/5"
                                                : "bg-rose-500/5"
                                            }`}
                                    >
                                        <span className="text-lg">
                                            {r.correct ? "✅" : "❌"}
                                        </span>
                                        <div className="flex flex-1 flex-col">
                                            <span className="text-sm font-bold text-white/80">
                                                {r.answer}
                                            </span>
                                            <span className="text-[11px] text-white/40">
                                                {r.clubs
                                                    .slice(0, 3)
                                                    .map((c) => c.teamName)
                                                    .join(" → ")}
                                                {r.clubs.length > 3 ? " → ..." : ""}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Play Again */}
                        <button
                            onClick={onPlayAgain}
                            className="h-[56px] w-full rounded-2xl bg-white text-[15px] font-black uppercase tracking-[0.05em] text-[#020617] transition hover:bg-white/90 active:scale-[0.98]"
                        >
                            {t("playAgain") || "PLAY AGAIN ⚡"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
