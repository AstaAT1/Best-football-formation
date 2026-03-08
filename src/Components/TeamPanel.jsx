// ============================================================
// TeamPanel.jsx — sidebar: team display + streak + shield
// ============================================================
import images from "../constants/images";
import { groupByPos } from "../engine/gameUtils";
import { POS_LABEL } from "../engine/gameConfig";

const POS_ORDER = ["GK", "DF", "MF", "ATK"];

export default function TeamPanel({ team, teamName, cards, showOverall, streak, shield }) {
    const grouped = groupByPos(team);
    const yellow = cards?.yellow ?? 0;
    const red = cards?.red ?? 0;
    const pts = yellow * -2;

    return (
        <aside className="sticky top-4 rounded-3xl border border-white/10 bg-[#0b1018]/80 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 text-center text-[15px] font-black tracking-wide text-white">{teamName}</h3>

            <div className="mb-4 flex flex-wrap justify-center gap-2">
                {yellow > 0 && <span className="rounded-lg bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-500">🟡 ×{yellow}</span>}
                {red > 0 && <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-500">🔴 ×{red}</span>}
                {yellow > 0 && <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-bold text-white/50">{pts} pts</span>}
                {shield && <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-500">🛡️</span>}
                {streak > 0 && <span className="rounded-lg bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-500">🔥 {streak}</span>}
            </div>

            {team.length === 0 && <p className="py-2 text-center text-xs font-medium text-white/40">No players yet</p>}

            {POS_ORDER.map((pos) => {
                const players = grouped[pos] ?? [];
                if (!players.length) return null;
                return (
                    <div key={pos} className="mb-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${pos === "GK" ? "bg-amber-400/15 text-amber-400" :
                                pos === "DF" ? "bg-white/[0.08] text-slate-300" :
                                    pos === "MF" ? "bg-white/[0.08] text-slate-200" :
                                        "bg-rose-500/15 text-rose-500"
                            }`}>
                            {POS_LABEL[pos]}
                        </span>
                        {players.map((p) => (
                            <div key={p.id} className="mt-1 flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-1.5 transition-colors hover:bg-white/[0.04]">
                                <img src={images[p.imageKey]} alt={p.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                                <span className="truncate text-xs font-semibold text-white/90">{p.name}</span>
                                {showOverall && <span className="ml-auto text-xs font-black text-emerald-400">{p.overall}</span>}
                            </div>
                        ))}
                    </div>
                );
            })}
        </aside>
    );
}
