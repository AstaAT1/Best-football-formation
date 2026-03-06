// ============================================================
// EndScreen.jsx — removals → scoring → side-by-side pitch reveal
// ============================================================
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import images from "../constants/images";
import { botRemovePlayer } from "../engine/ai";
import { computeFinalScore } from "../engine/scoring";
import TeamPanel from "./TeamPanel";
import PitchLineup from "./PitchLineup";

export default function EndScreen({ teams, cards, settings, onPlayAgain }) {
    const difficulty = settings?.difficulty ?? "medium";
    const teamName = settings?.teamName ?? "Your Team";

    const [userTeam, setUserTeam] = useState([...teams.user]);
    const [botTeam, setBotTeam] = useState([...teams.bot]);
    const [userRedsLeft, setUserRedsLeft] = useState(cards.userRed);
    const [botRedsLeft, setBotRedsLeft] = useState(cards.botRed);
    const [phase, setPhase] = useState("removals");
    const [removalLog, setRemovalLog] = useState([]);

    // Bot auto-removes from user's team
    useEffect(() => {
        if (phase !== "removals" || userRedsLeft <= 0) return;
        const t = setTimeout(() => {
            const victim = botRemovePlayer(userTeam, difficulty);
            if (!victim) { setUserRedsLeft(0); return; }
            setUserTeam((prev) => prev.filter((p) => p.id !== victim.id));
            setRemovalLog((l) => [...l, `🤖 Bot removed ${victim.name} from ${teamName}.`]);
            setUserRedsLeft((r) => r - 1);
        }, 1100);
        return () => clearTimeout(t);
    }, [phase, userRedsLeft]); // eslint-disable-line

    useEffect(() => {
        if (phase === "removals" && userRedsLeft <= 0 && botRedsLeft <= 0) {
            const t = setTimeout(() => setPhase("final"), 700);
            return () => clearTimeout(t);
        }
    }, [phase, userRedsLeft, botRedsLeft]);

    function handleRemoveBotPlayer(player) {
        if (botRedsLeft <= 0) return;
        setBotTeam((prev) => prev.filter((p) => p.id !== player.id));
        setRemovalLog((l) => [...l, `You removed ${player.name} from AI FC.`]);
        setBotRedsLeft((r) => r - 1);
    }

    const userFinal = computeFinalScore(userTeam, cards.userYellow);
    const botFinal = computeFinalScore(botTeam, cards.botYellow);
    const winner =
        userFinal.finalScore > botFinal.finalScore ? teamName :
            userFinal.finalScore < botFinal.finalScore ? "AI FC" : "Draw";

    return (
        <div className="screen end-screen">
            <div className="end-content">

                {/* REMOVAL PHASE */}
                {phase === "removals" && (
                    <div className="removals-phase">
                        <h2 className="phase-title">⚖️ Red Card Removals</h2>
                        {removalLog.map((m, i) => <p key={i} className="removal-log">{m}</p>)}

                        {userRedsLeft > 0 && (
                            <p className="removal-info">Bot is removing {userRedsLeft} player(s) from your team…</p>
                        )}

                        {botRedsLeft > 0 && userRedsLeft <= 0 && (
                            <div className="removal-pick">
                                <p className="removal-info">
                                    You have {botRedsLeft} red card(s) — remove {botRedsLeft} player(s) from AI FC:
                                </p>
                                <div className="removal-grid">
                                    {botTeam.map((p) => (
                                        <button key={p.id} className="removal-card" onClick={() => handleRemoveBotPlayer(p)}>
                                            <img src={images[p.imageKey]} alt={p.name} className="removal-img" />
                                            <span className="removal-name">{p.name}</span>
                                            <span className="removal-overall">{p.overall}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {userRedsLeft <= 0 && botRedsLeft <= 0 && (
                            <p className="removal-info">All removals complete — computing scores…</p>
                        )}
                    </div>
                )}

                {/* FINAL PHASE */}
                {phase === "final" && (
                    <motion.div
                        className="final-phase"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="end-title">
                            {winner === "Draw" ? "🤝 It's a Draw!" : `🏆 ${winner} Wins!`}
                        </h2>

                        {/* Score breakdown */}
                        <div className="score-vs">
                            <ScoreCard label={teamName} f={userFinal} yellow={cards.userYellow} />
                            <span className="vs-divider">VS</span>
                            <ScoreCard label="AI FC" f={botFinal} yellow={cards.botYellow} />
                        </div>

                        {/* Side-by-side pitches */}
                        <div className="dual-pitch">
                            <PitchLineup team={userTeam} teamName={teamName} />
                            <PitchLineup team={botTeam} teamName="AI FC" />
                        </div>

                        {/* Full teams with overalls revealed */}
                        <div className="final-teams">
                            <TeamPanel
                                team={userTeam} teamName={teamName}
                                cards={{ yellow: cards.userYellow, red: cards.userRed }}
                                showOverall
                            />
                            <TeamPanel
                                team={botTeam} teamName="AI FC"
                                cards={{ yellow: cards.botYellow, red: cards.botRed }}
                                showOverall
                            />
                        </div>

                        <button className="btn-start" onClick={onPlayAgain} style={{ marginTop: "1.5rem" }}>
                            🔄 Play Again
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function ScoreCard({ label, f, yellow }) {
    return (
        <div className="score-card">
            <h3 className="score-label">{label}</h3>
            <div className="score-row"><span>Team Rating</span><span>{f.teamRating}</span></div>
            <div className="score-row penalty">
                <span>Card Penalty ({yellow} 🟡)</span><span>{f.penaltyPoints}</span>
            </div>
            <div className="score-row total">
                <span>Final Score</span><span>{f.finalScore}</span>
            </div>
        </div>
    );
}
