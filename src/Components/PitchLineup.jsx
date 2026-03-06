// ============================================================
// PitchLineup.jsx — 4-3-3 formation on pitch (framer-motion)
// ============================================================
import { motion } from "framer-motion";
import images from "../constants/images";
import { groupByPos } from "../engine/gameUtils";

const FORMATION = {
    GK: [{ x: 50, y: 88 }],
    DF: [{ x: 20, y: 72 }, { x: 40, y: 72 }, { x: 60, y: 72 }, { x: 80, y: 72 }],
    MF: [{ x: 30, y: 52 }, { x: 50, y: 52 }, { x: 70, y: 52 }],
    ATK: [{ x: 30, y: 28 }, { x: 50, y: 28 }, { x: 70, y: 28 }],
};

const POS_ORDER = ["GK", "DF", "MF", "ATK"];

export default function PitchLineup({ team, teamName }) {
    const grouped = groupByPos(team);

    const markers = [];
    for (const pos of POS_ORDER) {
        const players = grouped[pos] ?? [];
        const slots = FORMATION[pos];
        for (let i = 0; i < slots.length; i++) {
            markers.push({
                player: players[i] ?? null,
                x: slots[i].x,
                y: slots[i].y,
                pos,
            });
        }
    }

    return (
        <div className="pitch-wrap">
            <h3 className="pitch-team-label">{teamName}</h3>
            <div className="pitch-field">
                {/* CSS-drawn markings */}
                <div className="pitch-center-line" />
                <div className="pitch-center-circle" />
                <div className="pitch-penalty-top" />
                <div className="pitch-penalty-bottom" />
                <div className="pitch-goal-top" />
                <div className="pitch-goal-bottom" />

                {markers.map((m, i) => (
                    <motion.div
                        key={i}
                        className={`pitch-marker ${!m.player ? "pitch-empty" : ""}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 20 }}
                    >
                        {m.player ? (
                            <>
                                <img
                                    src={images[m.player.imageKey]}
                                    alt={m.player.name}
                                    className="pitch-player-img"
                                />
                                <span className="pitch-player-name">
                                    {m.player.name.split(" ").pop()}
                                </span>
                                <span className="pitch-player-overall">{m.player.overall}</span>
                            </>
                        ) : (
                            <span className="pitch-ghost">✕</span>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
