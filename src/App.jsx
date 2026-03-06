// ============================================================
// App.jsx — 15-round state machine + stage transitions
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

import bg from "./assets/images/background.jpg";
import allPlayers from "./data/players.json";
import allQuestions from "./data/questions.json";

import { buildDraftPairs } from "./engine/ai";
import { TOTAL_ROUNDS } from "./engine/gameConfig";
import {
  initCards, initStreaks,
  applyYellowWithShield, updateStreak,
} from "./engine/scoring";

import WelcomeScreen from "./Components/WelcomeScreen";
import RoundScreen from "./Components/RoundScreen";
import EndScreen from "./Components/EndScreen";
import TeamPanel from "./Components/TeamPanel";
import CardCallout from "./Components/CardCallout";
import StageTransition from "./Components/StageTransition";

const DEFAULT_SETTINGS = { teamName: "My Team", difficulty: "medium" };

/** Stage boundary definitions: after completing roundIndex N, show message */
const STAGE_BOUNDARIES = {
  1: { msg: "GK stage completed ✅ — Next up: DEFENDERS (DF) 🛡️", special: false },
  5: { msg: "DF stage completed ✅ — Next up: MIDFIELDERS (MF) 🧠", special: false },
  8: { msg: "MF stage completed ✅ — Next up: ATTACKERS (ATK) ⚡", special: false },
  11: { msg: "Draft completed ✅ — It's CHANGEMENT time! 🔁 Substitution rounds start now.", special: true },
};

function buildInitialGame() {
  return {
    screen: "welcome",
    settings: { ...DEFAULT_SETTINGS },
    draftPairs: [],
    roundIndex: 0,
    teams: { user: [], bot: [] },
    cards: initCards(),
    streaks: initStreaks(),
  };
}

export default function App() {
  const [game, setGame] = useState(buildInitialGame);
  const [cardEvent, setCardEvent] = useState(null);
  const [cardPending, setCardPending] = useState([]);
  const [streakToast, setStreakToast] = useState(null);
  const [stageTransition, setStageTransition] = useState(null); // { msg, special } | null

  const usedQIds = useRef(new Set());

  // Drain card event queue
  useEffect(() => {
    if (cardPending.length === 0 || cardEvent !== null) return;
    const [first, ...rest] = cardPending;
    setCardEvent(first);
    setCardPending(rest);
  }, [cardPending, cardEvent]);

  // Streak toast auto-dismiss
  useEffect(() => {
    if (!streakToast) return;
    const t = setTimeout(() => setStreakToast(null), 2500);
    return () => clearTimeout(t);
  }, [streakToast]);

  function startGame(settings) {
    usedQIds.current = new Set();
    setGame({
      screen: "game",
      settings: { ...DEFAULT_SETTINGS, ...settings },
      draftPairs: buildDraftPairs(allPlayers),
      roundIndex: 0,
      teams: { user: [], bot: [] },
      cards: initCards(),
      streaks: initStreaks(),
    });
  }

  const handleRoundDone = useCallback(({
    userPlayer, botPlayer, yellowFor,
    isChangement, userSkipped, botSkipped, userDiscard, botDiscard,
    userCorrect, botCorrect,
  }) => {
    setGame((prev) => {
      let cards = { ...prev.cards };
      let streaks = { ...prev.streaks };
      const events = [];

      // 1) Apply yellows with shield
      for (const who of yellowFor) {
        const before = { ...cards };
        const result = applyYellowWithShield(cards, streaks, who);
        cards = result.cards;
        streaks = result.streaks;
        if (!result.shieldUsed) {
          const redMade = who === "user"
            ? cards.userRed > before.userRed
            : cards.botRed > before.botRed;
          events.push({ type: redMade ? "red" : "yellow", who });
        }
      }

      // 2) Update streaks
      const usr = updateStreak(cards, streaks, "user", userCorrect);
      cards = usr.cards; streaks = usr.streaks;
      if (usr.bonusTriggered) setStreakToast({ who: "user", bonusType: usr.bonusType });

      const bsr = updateStreak(cards, streaks, "bot", botCorrect);
      cards = bsr.cards; streaks = bsr.streaks;
      if (bsr.bonusTriggered) setStreakToast({ who: "bot", bonusType: bsr.bonusType });

      // 3) Update teams
      let userTeam = [...prev.teams.user];
      let botTeam = [...prev.teams.bot];

      if (isChangement) {
        if (!userSkipped && userDiscard) {
          userTeam = userTeam.filter((p) => p.id !== userDiscard.id);
          userTeam.push(userPlayer);
        }
        if (!botSkipped && botDiscard) {
          botTeam = botTeam.filter((p) => p.id !== botDiscard.id);
          botTeam.push(botPlayer);
        }
      } else {
        userTeam.push(userPlayer);
        botTeam.push(botPlayer);
      }

      if (events.length > 0) setCardPending(events);

      const nextRound = prev.roundIndex + 1;

      // Check for stage transition
      const boundary = STAGE_BOUNDARIES[nextRound];
      if (boundary && nextRound < TOTAL_ROUNDS) {
        setStageTransition(boundary);
      }

      return {
        ...prev,
        screen: nextRound >= TOTAL_ROUNDS ? "end" : "game",
        roundIndex: nextRound,
        teams: { user: userTeam, bot: botTeam },
        cards,
        streaks,
      };
    });
  }, []);

  function handleCardDone() {
    setCardEvent(null);
  }

  function handleStageDone() {
    setStageTransition(null);
  }

  const { screen, settings, draftPairs, roundIndex, teams, cards, streaks } = game;

  // Don't render RoundScreen while stage transition or card callout is active
  const isBlocked = stageTransition !== null || cardEvent !== null;

  return (
    <div className="app" style={{ backgroundImage: `url(${bg})` }}>
      <div className="app-overlay">

        <CardCallout
          event={cardEvent ? { ...cardEvent, teamName: settings.teamName } : null}
          onDone={handleCardDone}
        />

        <StageTransition
          message={stageTransition?.msg ?? null}
          isSpecial={stageTransition?.special ?? false}
          onDone={handleStageDone}
        />

        {streakToast && (
          <div className={`streak-toast ${streakToast.who === "user" ? "toast-left" : "toast-right"}`}>
            🔥 {streakToast.who === "user" ? settings.teamName : "AI FC"} —
            {streakToast.bonusType === "removeYellow"
              ? " Streak! 🟡 Yellow removed!"
              : " Streak! 🛡️ Shield earned!"}
          </div>
        )}

        {screen === "welcome" && <WelcomeScreen onStart={startGame} />}

        {screen === "game" && draftPairs.length > 0 && (
          <div className="game-layout">
            <TeamPanel
              team={teams.user} teamName={settings.teamName}
              cards={{ yellow: cards.userYellow, red: cards.userRed }}
              streak={streaks.userStreak} shield={streaks.userShield}
            />
            {/* Only render RoundScreen when not blocked by overlays */}
            {!isBlocked && (
              <RoundScreen
                key={roundIndex}
                roundIndex={roundIndex}
                pair={draftPairs[roundIndex]}
                allQuestions={allQuestions}
                usedQuestionIds={usedQIds.current}
                settings={settings}
                teams={teams}
                onRoundDone={handleRoundDone}
              />
            )}
            {isBlocked && (
              <div className="round-center">
                <div className="round-header">
                  <span className="round-badge">Round {roundIndex + 1} / 15</span>
                </div>
              </div>
            )}
            <TeamPanel
              team={teams.bot} teamName="AI FC"
              cards={{ yellow: cards.botYellow, red: cards.botRed }}
              streak={streaks.botStreak} shield={streaks.botShield}
            />
          </div>
        )}

        {screen === "end" && (
          <EndScreen
            teams={teams} cards={cards}
            settings={settings}
            onPlayAgain={() => setGame(buildInitialGame())}
          />
        )}
      </div>
    </div>
  );
}
