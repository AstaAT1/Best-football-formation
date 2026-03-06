// ============================================================
// ChangementPanel.jsx — optional skip/replace UI for rounds 12-15
// ============================================================
import images from "../constants/images";
import { POS_LABEL } from "../engine/gameConfig";

/**
 * Props:
 *   candidate   — the new player assigned to the user
 *   pos         — normalized position (GK/DF/MF/ATK)
 *   teamAtPos   — user's current players at this position
 *   onReplace   — (discardedPlayer) => void
 *   onSkip      — () => void
 */
export default function ChangementPanel({ candidate, pos, teamAtPos, onReplace, onSkip }) {
    return (
        <div className="pick-overlay">
            <div className="changement-modal">
                <h2 className="changement-title">🔄 Changement — {POS_LABEL[pos]}</h2>

                <p className="changement-subtitle">New candidate:</p>
                <div className="changement-candidate">
                    <img src={images[candidate.imageKey]} alt={candidate.name} className="changement-cand-img" />
                    <div className="changement-cand-info">
                        <strong>{candidate.name}</strong>
                        <span className="changement-meta">{candidate.nation} · {candidate.club}</span>
                    </div>
                </div>

                <p className="changement-subtitle" style={{ marginTop: "1rem" }}>
                    Replace one of your {POS_LABEL[pos]}s:
                </p>

                <div className="changement-list">
                    {teamAtPos.map((p) => (
                        <div key={p.id} className="changement-row">
                            <img src={images[p.imageKey]} alt={p.name} className="changement-row-img" />
                            <span className="changement-row-name">{p.name}</span>
                            <span className="changement-row-meta">{p.nation}</span>
                            <button className="changement-replace-btn" onClick={() => onReplace(p)}>
                                Replace
                            </button>
                        </div>
                    ))}
                </div>

                <button className="changement-skip-btn" onClick={onSkip}>
                    ✕ Skip — Keep Current Team
                </button>
            </div>
        </div>
    );
}
