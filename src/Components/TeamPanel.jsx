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
        <aside className="team-panel">
            <h3 className="team-panel-name">{teamName}</h3>

            <div className="team-card-row">
                {yellow > 0 && <span className="badge badge-yellow">🟡 ×{yellow}</span>}
                {red > 0 && <span className="badge badge-red">🔴 ×{red}</span>}
                {yellow > 0 && <span className="badge badge-pen">{pts} pts</span>}
                {shield && <span className="badge badge-shield">🛡️</span>}
                {streak > 0 && <span className="badge badge-streak">🔥 {streak}</span>}
            </div>

            {team.length === 0 && <p className="team-empty">No players yet</p>}

            {POS_ORDER.map((pos) => {
                const players = grouped[pos] ?? [];
                if (!players.length) return null;
                return (
                    <div key={pos} className="team-pos-block">
                        <span className={`pos-pill pos-${pos}`}>{POS_LABEL[pos]}</span>
                        {players.map((p) => (
                            <div key={p.id} className="mini-card">
                                <img src={images[p.imageKey]} alt={p.name} className="mini-img" />
                                <span className="mini-name">{p.name}</span>
                                {showOverall && <span className="mini-overall">{p.overall}</span>}
                            </div>
                        ))}
                    </div>
                );
            })}
        </aside>
    );
}
