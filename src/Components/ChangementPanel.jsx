// ============================================================
// ChangementPanel.jsx — optional skip/replace UI for rounds 12-15
// ============================================================
import images from "../constants/images";
import { POS_LABEL } from "../engine/gameConfig";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Props:
 *   candidate   — the new player assigned to the user
 *   pos         — normalized position (GK/DF/MF/ATK)
 *   teamAtPos   — user's current players at this position
 *   onReplace   — (discardedPlayer) => void
 *   onSkip      — () => void
 */
export default function ChangementPanel({ candidate, pos, teamAtPos, onReplace, onSkip }) {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1018]/95 p-6 shadow-2xl sm:p-8">
                <h2 className="mb-6 text-center text-xl font-bold text-white sm:text-2xl">
                    🔄 {t("changement", "Changement")} — <span className="text-amber-400">{POS_LABEL[pos]}</span>
                </h2>

                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">{t("newPlayer", "New candidate")}:</p>
                <div className="mb-6 flex items-center gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                    <img src={images[candidate.imageKey]} alt={candidate.name} className="h-16 w-16 rounded-full border-2 border-sky-400/50 object-cover" />
                    <div className="flex flex-col">
                        <strong className="text-lg text-white">{candidate.name}</strong>
                        <span className="text-xs text-sky-200/70">{candidate.nation} · {candidate.club}</span>
                    </div>
                </div>

                <p className="mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-white/50">
                    {t("replaceWho", "Replace one of your")} {POS_LABEL[pos]}s:
                </p>

                <div className="mb-6 flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin">
                    {teamAtPos.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                            <img src={images[p.imageKey]} alt={p.name} className="h-12 w-12 rounded-full border border-white/20 object-cover" />
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <span className="truncate text-sm font-bold text-white">{p.name}</span>
                                <span className="truncate text-xs text-white/50">{p.nation}</span>
                            </div>
                            <button
                                className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/20 active:scale-95"
                                onClick={() => onReplace(p)}
                            >
                                {t("replaceBtn", "Replace")}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-bold uppercase tracking-wider text-white/70 transition hover:bg-white/10 active:scale-[0.98]"
                    onClick={onSkip}
                >
                    ✕ {t("skipChangement", "Skip")} — {t("keepCurrentSquad", "Keep Current Team")}
                </button>
            </div>
        </div>
    );
}
