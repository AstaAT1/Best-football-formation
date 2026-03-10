// ============================================================
// PickScreen.jsx — shown after user wins a round
// ============================================================
import images from "../constants/images";
import { POS_LABEL } from "../engine/gameConfig";
import { normalizePos } from "../engine/gameUtils";
import { useLanguage } from "../contexts/LanguageContext";

export default function PickScreen({ pair, onPick }) {
    const { t } = useLanguage();
    const pos = normalizePos(pair.pos);
    const players = [pair.playerA, pair.playerB];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1018]/95 p-8 text-center shadow-2xl">
                <h2 className="mb-2 text-xl font-bold text-white">🏆 {t("winnerPicksFirst", "You won — pick your player!")}</h2>
                <p className="mb-6">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] ${pos === "GK" ? "bg-amber-400/15 text-amber-400" :
                        pos === "DF" ? "bg-white/[0.08] text-slate-300" :
                            pos === "MF" ? "bg-white/[0.08] text-slate-200" :
                                "bg-rose-500/15 text-rose-500"
                        }`}>
                        {POS_LABEL[pos]}
                    </span>
                </p>
                <div className="flex justify-center gap-4 sm:gap-6">
                    {players.map((p) => (
                        <button
                            key={p.id}
                            className="group flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 border-white/10 bg-white/[0.03] p-4 text-[15px] font-bold text-white transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                            onClick={() => onPick(p)}
                        >
                            <img
                                src={images[p.imageKey]}
                                alt={p.name}
                                className="h-20 w-20 rounded-full border-2 border-white/10 object-cover"
                            />
                            <strong className="mt-2 text-sm">{p.name}</strong>
                            <span className="text-xs font-normal text-white/50">{p.nation}</span>
                            <span className="text-xs font-normal text-white/50">{p.club}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
