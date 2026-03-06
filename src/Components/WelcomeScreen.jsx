// ============================================================
// WelcomeScreen.jsx — rules + team name + difficulty
// ============================================================
import { useState } from "react";

const RULES = [
    "15 rounds total: 11 draft rounds + 4 CHANGEMENT (substitution) rounds.",
    "Draft rounds build your squad: 1 GK → 4 DF → 3 MF → 3 ATK.",
    "Changement rounds (12-15): replace one existing player of that position.",
    "Each round: answer a football trivia question in 12 seconds.",
    "Two players are up for grabs — winner picks first, loser gets the other.",
    "Both wrong? Question swaps (max 3 times), then play continues.",
    "Wrong answer (while opponent was right) = 🟡 Yellow card (−2 pts).",
    "3 yellows = 🔴 Red card → opponent removes 1 of your players at end.",
    "🔥 3 correct answers in a row = Streak Bonus! (removes 1 yellow or gives 🛡️ shield).",
    "Final score = Σ player ratings − yellow penalty points.",
    "Player ratings are hidden during the game — revealed at the end!",
];

export default function WelcomeScreen({ onStart }) {
    const [teamName, setTeamName] = useState("");
    const [difficulty, setDifficulty] = useState("medium");

    const handleStart = (e) => {
        e.preventDefault();
        if (!teamName.trim()) return;
        onStart({ teamName: teamName.trim(), difficulty });
    };

    return (
        <div className="screen welcome-screen">
            <div className="welcome-card">
                <h1 className="welcome-title">⚽ Draft Arena</h1>
                <p className="welcome-sub">Build your dream squad — one question at a time.</p>

                <section className="rules-box">
                    <h3 className="rules-heading">📋 How to Play</h3>
                    <ul className="rules-list">
                        {RULES.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                </section>

                <form className="setup-form" onSubmit={handleStart}>
                    <div className="field-group">
                        <label htmlFor="teamName">Your Team Name</label>
                        <input
                            id="teamName" type="text"
                            placeholder="e.g. Atlas Lions FC"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            maxLength={24} autoFocus
                        />
                    </div>

                    <div className="field-group">
                        <label>Difficulty</label>
                        <div className="btn-row">
                            {["easy", "medium", "hard"].map((d) => (
                                <button
                                    key={d} type="button"
                                    className={`diff-btn ${difficulty === d ? "active" : ""}`}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-start" disabled={!teamName.trim()}>
                        Start Draft ⚡
                    </button>
                </form>
            </div>
        </div>
    );
}
