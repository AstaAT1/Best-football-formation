// ============================================================
// PickScreen.jsx — shown after user wins a round
// ============================================================
import images from "../constants/images";
import { POS_LABEL } from "../engine/gameConfig";
import { normalizePos } from "../engine/gameUtils";

export default function PickScreen({ pair, onPick }) {
    const pos = normalizePos(pair.pos);
    const players = [pair.playerA, pair.playerB];

    return (
        <div className="pick-overlay">
            <div className="pick-modal cafe-panel">
                <h2 className="pick-title">🏆 You won — pick your player!</h2>
                <p className="pick-pos-label">
                    <span className={`pos-pill pos-${pos}`}>{POS_LABEL[pos]}</span>
                </p>
                <div className="pick-pair">
                    {players.map((p) => (
                        <button
                            key={p.id}
                            className="pick-card"
                            onClick={() => onPick(p)}
                        >
                            <img
                                src={images[p.imageKey]}
                                alt={p.name}
                                className="pick-img"
                            />
                            <strong className="pick-name">{p.name}</strong>
                            <span className="pick-meta">{p.nation}</span>
                            <span className="pick-meta">{p.club}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
