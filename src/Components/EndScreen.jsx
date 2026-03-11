import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import images from "../constants/images";
import bg from "../assets/images/background.jpg";
import { botRemovePlayer } from "../engine/ai";
import { computeFinalScore } from "../engine/scoring";
import TeamPanel from "./TeamPanel";
import PitchLineup from "./PitchLineup";
import { useTranslation } from "react-i18next";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const POSITION_ORDER = ["GK", "DF", "MF", "ATK"];

const POSITION_META = {
  GK: {
    label: "Goalkeepers",
    badge: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    overall: "from-amber-200 to-amber-300 text-[#111827]",
    accent: "bg-amber-300",
  },
  DF: {
    label: "Defenders",
    badge: "border-slate-300/20 bg-slate-300/10 text-slate-200",
    overall: "from-slate-200 to-slate-300 text-[#111827]",
    accent: "bg-slate-300",
  },
  MF: {
    label: "Midfielders",
    badge: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    overall: "from-sky-300 to-sky-500 text-white",
    accent: "bg-sky-300",
  },
  ATK: {
    label: "Attackers",
    badge: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    overall: "from-rose-300 to-rose-500 text-white",
    accent: "bg-rose-300",
  },
};

function getPlayerPos(player) {
  return (player?.pos || player?.position || "").toUpperCase();
}

function getPlayerImage(player) {
  return images?.[player?.imageKey] || images?.fallbackAvatar || bg;
}

function getRefereeImage() {
  return (
    images?.PierluigiCollina ||
    images?.pierluigiCollina ||
    images?.collina ||
    bg
  );
}

function buildRevealPairs(userTeam, botTeam) {
  const groupedUser = { GK: [], DF: [], MF: [], ATK: [] };
  const groupedBot = { GK: [], DF: [], MF: [], ATK: [] };

  userTeam.forEach((player) => {
    const pos = getPlayerPos(player);
    if (groupedUser[pos]) groupedUser[pos].push(player);
  });

  botTeam.forEach((player) => {
    const pos = getPlayerPos(player);
    if (groupedBot[pos]) groupedBot[pos].push(player);
  });

  const pairs = [];

  POSITION_ORDER.forEach((pos) => {
    const total = Math.max(groupedUser[pos].length, groupedBot[pos].length);

    for (let index = 0; index < total; index += 1) {
      pairs.push({
        id: `${pos}-${index}`,
        pos,
        slot: index + 1,
        totalSlots: total,
        userPlayer: groupedUser[pos][index] || null,
        botPlayer: groupedBot[pos][index] || null,
      });
    }
  });

  return pairs;
}

function SectionPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
      {children}
    </span>
  );
}

function LiveScoreTicker({ teamName, runningUserScore, runningBotScore }) {
  const { t } = useTranslation("ui");
  return (
    <div className="mx-auto mt-6 flex w-full max-w-lg items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="flex min-w-[120px] flex-col items-center px-5 py-3">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          {teamName}
        </span>
        <motion.span
          key={runningUserScore}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-1 font-mono text-3xl font-black text-white"
        >
          {runningUserScore}
        </motion.span>
      </div>

      <div className="h-12 w-px bg-white/10" />

      <div className="flex flex-col items-center px-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          {t("live", "LIVE")}
        </span>
        <span className="text-xs font-black italic tracking-[0.2em] text-white/20">
          VS
        </span>
      </div>

      <div className="h-12 w-px bg-white/10" />

      <div className="flex min-w-[120px] flex-col items-center px-5 py-3">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          AI FC
        </span>
        <motion.span
          key={runningBotScore}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-1 font-mono text-3xl font-black text-white"
        >
          {runningBotScore}
        </motion.span>
      </div>
    </div>
  );
}

function RemovalPhase({
  removalLog,
  userRedsLeft,
  botRedsLeft,
  botTeam,
  teamName,
  onRemoveBotPlayer,
}) {
  const { t } = useTranslation("ui");
  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018]/75 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 px-6 py-5 text-center">
          <SectionPill>{t("redCardPenalties", "Red Card Penalties")}</SectionPill>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t("finalRemovals", "Final Removals")}
          </h2>
          <p className="mt-2 text-sm text-white/45">
            {t("removalsExplanation", "Red cards are applied before the final comparison starts.")}
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                Match Log
              </span>
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/25">
                {removalLog.length} events
              </span>
            </div>

            <div className="space-y-2">
              {removalLog.length === 0 ? (
                <div className="flex h-14 items-center justify-center rounded-xl bg-white/[0.02]">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/30">
                    {t("awaitingRemovals", "Awaiting removals")}
                  </span>
                </div>
              ) : (
                removalLog.map((message, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="text-sm font-medium text-white/78">
                      {message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {userRedsLeft > 0 && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-center">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-yellow-300">
                AI is removing {userRedsLeft} player{userRedsLeft > 1 ? "s" : ""} from {teamName}
              </p>
            </div>
          )}

          {botRedsLeft > 0 && userRedsLeft <= 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="mb-4 text-center text-sm font-bold text-white">
                Remove {botRedsLeft} player{botRedsLeft > 1 ? "s" : ""} from AI FC
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {botTeam.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => onRemoveBotPlayer(player)}
                    className="group flex w-[98px] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 transition hover:-translate-y-1 hover:border-red-500/35 hover:bg-white/[0.07]"
                  >
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <span className="w-full truncate text-center text-[11px] font-bold text-white">
                      {player.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {userRedsLeft <= 0 && botRedsLeft <= 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-white/50">
                {t("allRemovalsComplete", "All removals complete")}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function VerdictOverlay() {
  const { t } = useTranslation("ui");
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06080f]/95 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.045),_transparent_38%)]" />

      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mb-8"
      >
        <div className="absolute -inset-8 rounded-full bg-sky-300/10 blur-3xl" />
        <img
          src={getRefereeImage()}
          alt="Referee"
          className="relative z-10 h-40 w-40 rounded-full border-4 border-white/10 object-cover shadow-[0_0_55px_rgba(0,0,0,0.8)] grayscale-[30%] contrast-125 md:h-52 md:w-52"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <SectionPill>Draft Arena · Final Decision</SectionPill>
        <h2 className="mt-5 text-[clamp(2.2rem,6vw,4rem)] font-black uppercase tracking-[0.08em] text-white">
          {t("playerComparison", "Player Comparison")}
        </h2>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-white/35">
          {t("revealingRatings", "Revealing ratings...")}
        </p>
      </motion.div>
    </motion.div>
  );
}

function RevealPlayerCard({ side, teamName, player, position }) {
  const meta = POSITION_META[position];

  if (!player) {
    return (
      <motion.div
        initial={{ opacity: 0, x: side === "left" ? -24 : 24 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex min-h-[240px] w-full items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 backdrop-blur-sm"
      >
        <div className="text-center">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {teamName}
          </p>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/30">
            No Player
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -26 : 26 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1018]/75 p-5 shadow-2xl backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_42%)]" />
      <div className={cn("absolute inset-x-0 top-0 h-1", meta.accent)} />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              {teamName}
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                meta.badge
              )}
            >
              {position}
            </span>
          </div>

          <motion.div
            initial={{ scale: 0.65, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              delay: 0.55,
              duration: 0.42,
              type: "spring",
              stiffness: 220,
              damping: 13,
            }}
            className={cn(
              "inline-flex min-w-[78px] items-center justify-center rounded-2xl bg-gradient-to-br px-4 py-3 shadow-lg",
              meta.overall
            )}
          >
            <span className="font-mono text-3xl font-black">{player.overall}</span>
          </motion.div>
        </div>

        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.12 }}
            className="relative"
          >
            <img
              src={getPlayerImage(player)}
              alt={player.name}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white/10 shadow-[0_16px_34px_rgba(0,0,0,0.45)] sm:h-32 sm:w-32"
            />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-4 text-2xl font-black tracking-tight text-white"
          >
            {player.name}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-1 text-sm font-medium text-white/45"
          >
            {player.club || "Club"}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function FinalScoreColumn({ isWinner, result, yellow, teamName }) {
  const { t } = useTranslation("ui");
  return (
    <div className={cn("flex flex-1 flex-col p-6 md:p-7", isWinner && "bg-white/[0.03]")}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3
          className={cn(
            "text-xl font-black uppercase tracking-[0.08em]",
            isWinner ? "text-white" : "text-white/55"
          )}
        >
          {teamName}
        </h3>

        {isWinner && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6.5l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Winner
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-sm font-medium text-white/50">{t("baseScore", "Base Rating")}</span>
          <span className="font-mono text-lg font-bold text-white">{result.teamRating}</span>
        </div>

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="flex items-center gap-2 text-sm font-medium text-white/50">
            {t("penalties", "Card Penalty")}
            {yellow > 0 && (
              <span className="rounded bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-black text-yellow-300">
                {yellow}×🟡
              </span>
            )}
          </span>
          <span className="font-mono text-lg font-bold text-rose-400">{result.penaltyPoints}</span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
            {t("finalScoreLabel", "Final")}
          </span>
          <span
            className={cn(
              "font-mono text-5xl font-black leading-none",
              isWinner ? "text-white" : "text-white/70"
            )}
          >
            {result.finalScore}
          </span>
        </div>
      </div>
    </div>
  );
}

function PitchPanel({ team, name }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018]/60 backdrop-blur-md">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="h-4 w-1 rounded-full bg-white/30" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
          {name}
        </span>
      </div>

      <div className="px-2 py-4 sm:px-4 sm:py-5">
        <div className="mx-auto w-full max-w-[620px]">
          <PitchLineup team={team} teamName={name} />
        </div>
      </div>
    </div>
  );
}

export default function EndScreen({ teams, cards, settings, onPlayAgain }) {
  const { t } = useTranslation("ui");
  const difficulty = settings?.difficulty ?? "medium";
  const teamName = settings?.teamName ?? "Your Team";
  const stadiumBg = images?.[settings?.stadium] || bg;

  const [userTeam, setUserTeam] = useState([...teams.user]);
  const [botTeam, setBotTeam] = useState([...teams.bot]);
  const [userRedsLeft, setUserRedsLeft] = useState(cards.userRed);
  const [botRedsLeft, setBotRedsLeft] = useState(cards.botRed);

  const [phase, setPhase] = useState("removals");
  const [removalLog, setRemovalLog] = useState([]);
  const [pairIndex, setPairIndex] = useState(0);
  const [runningUserScore, setRunningUserScore] = useState(0);
  const [runningBotScore, setRunningBotScore] = useState(0);

  const countedPairsRef = useRef(new Set());

  const revealPairs = useMemo(
    () => buildRevealPairs(userTeam, botTeam),
    [userTeam, botTeam]
  );

  const currentPair = revealPairs[pairIndex] || null;

  const userFinal = useMemo(
    () => computeFinalScore(userTeam, cards.userYellow),
    [userTeam, cards.userYellow]
  );

  const botFinal = useMemo(
    () => computeFinalScore(botTeam, cards.botYellow),
    [botTeam, cards.botYellow]
  );

  const winner =
    userFinal.finalScore > botFinal.finalScore
      ? teamName
      : userFinal.finalScore < botFinal.finalScore
        ? "AI FC"
        : "Draw";

  useEffect(() => {
    setUserTeam([...teams.user]);
    setBotTeam([...teams.bot]);
    setUserRedsLeft(cards.userRed);
    setBotRedsLeft(cards.botRed);
    setPhase("removals");
    setRemovalLog([]);
    setPairIndex(0);
    setRunningUserScore(0);
    setRunningBotScore(0);
    countedPairsRef.current.clear();
  }, [teams, cards]);

  useEffect(() => {
    if (phase !== "removals" || userRedsLeft <= 0) return;

    const timer = setTimeout(() => {
      const victim = botRemovePlayer(userTeam, difficulty);

      if (!victim) {
        setUserRedsLeft(0);
        return;
      }

      setUserTeam((prev) => prev.filter((p) => p.id !== victim.id));
      setRemovalLog((prev) => [
        ...prev,
        `🤖 AI removed ${victim.name} from ${teamName}.`,
      ]);
      setUserRedsLeft((prev) => prev - 1);
    }, 1100);

    return () => clearTimeout(timer);
  }, [phase, userRedsLeft, userTeam, difficulty, teamName]);

  useEffect(() => {
    if (phase !== "removals" || userRedsLeft > 0 || botRedsLeft > 0) return;

    const timer = setTimeout(() => setPhase("verdict"), 1000);
    return () => clearTimeout(timer);
  }, [phase, userRedsLeft, botRedsLeft]);

  useEffect(() => {
    if (phase !== "verdict") return;

    const timer = setTimeout(() => {
      setPairIndex(0);
      setRunningUserScore(0);
      setRunningBotScore(0);
      countedPairsRef.current.clear();
      setPhase(revealPairs.length === 0 ? "final" : "reveal");
    }, 2400);

    return () => clearTimeout(timer);
  }, [phase, revealPairs.length]);

  useEffect(() => {
    if (phase !== "reveal" || !currentPair) return;

    let mounted = true;

    const scoreTimer = setTimeout(() => {
      if (!mounted || countedPairsRef.current.has(currentPair.id)) return;

      countedPairsRef.current.add(currentPair.id);
      setRunningUserScore((prev) => prev + (currentPair.userPlayer?.overall || 0));
      setRunningBotScore((prev) => prev + (currentPair.botPlayer?.overall || 0));
    }, 1200);

    const nextTimer = setTimeout(() => {
      if (!mounted) return;

      if (pairIndex < revealPairs.length - 1) {
        setPairIndex((prev) => prev + 1);
      } else {
        setPhase("final");
      }
    }, 3400);

    return () => {
      mounted = false;
      clearTimeout(scoreTimer);
      clearTimeout(nextTimer);
    };
  }, [phase, currentPair, pairIndex, revealPairs.length]);

  function handleRemoveBotPlayer(player) {
    if (botRedsLeft <= 0) return;

    setBotTeam((prev) => prev.filter((p) => p.id !== player.id));
    setRemovalLog((prev) => [...prev, `You removed ${player.name} from AI FC.`]);
    setBotRedsLeft((prev) => prev - 1);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#020408] text-white">
      {/* 1. Global Fixed Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(170deg,rgba(4,6,14,0.92)_0%,rgba(4,6,12,0.9)_40%,rgba(3,5,10,0.98)_100%)]" />
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(0deg,transparent,transparent_56px,rgba(255,255,255,0.015)_56px,rgba(255,255,255,0.015)_57px),repeating-linear-gradient(90deg,transparent,transparent_56px,rgba(255,255,255,0.015)_56px,rgba(255,255,255,0.015)_57px)]" />
      </div>

      {/* 2. Scrolling Content Container */}
      <div className="relative z-10 h-[100dvh] w-full overflow-y-auto">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          {phase === "removals" && (
            <RemovalPhase
              removalLog={removalLog}
              userRedsLeft={userRedsLeft}
              botRedsLeft={botRedsLeft}
              botTeam={botTeam}
              teamName={teamName}
              onRemoveBotPlayer={handleRemoveBotPlayer}
            />
          )}

          <AnimatePresence>{phase === "verdict" && <VerdictOverlay />}</AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === "reveal" && currentPair && (
              <motion.div
                key={currentPair.id}
                className="flex w-full max-w-7xl flex-col items-center justify-center py-6"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
              >
                <header className="mb-8 w-full text-center">
                  <SectionPill>
                    {currentPair.pos} · {currentPair.slot}/{currentPair.totalSlots}
                  </SectionPill>

                  <h2 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] font-black tracking-tight text-white">
                    {POSITION_META[currentPair.pos].label}
                  </h2>

                  <LiveScoreTicker
                    teamName={teamName}
                    runningUserScore={runningUserScore}
                    runningBotScore={runningBotScore}
                  />
                </header>

                <div className="grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_64px_1fr] lg:gap-6">
                  <RevealPlayerCard
                    side="left"
                    teamName={teamName}
                    player={currentPair.userPlayer}
                    position={currentPair.pos}
                  />

                  <div className="flex items-center justify-center">
                    <div className="rounded-full border border-white/10 bg-[#06080F]/80 px-4 py-3 text-sm font-black italic tracking-[0.22em] text-white/25 backdrop-blur-sm">
                      VS
                    </div>
                  </div>

                  <RevealPlayerCard
                    side="right"
                    teamName="AI FC"
                    player={currentPair.botPlayer}
                    position={currentPair.pos}
                  />
                </div>

                <div className="mt-8 flex items-center gap-3">
                  {revealPairs.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        index === pairIndex
                          ? "h-1 w-6 bg-white"
                          : index < pairIndex
                            ? "h-1 w-2 bg-white/45"
                            : "h-1 w-2 bg-white/15"
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "final" && (
            <motion.div
              className="flex w-full max-w-7xl flex-col items-center justify-start pb-16 pt-8"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <header className="mb-10 w-full text-center">
                <SectionPill>Draft Arena · {t("fullTime", "Full Time")}</SectionPill>

                <div className="mt-5">
                  {winner === "Draw" ? (
                    <h2 className="text-[clamp(3rem,9vw,6rem)] font-black uppercase leading-none tracking-tight text-white">
                      {t("itsADraw", "It's a Draw")}
                    </h2>
                  ) : (
                    <>
                      <p className="mb-2 text-sm font-black uppercase tracking-[0.24em] text-white/45">
                        {t("winnerLabel", "Winner")}
                      </p>
                      <h2 className="text-[clamp(2.6rem,8vw,5.5rem)] font-black uppercase leading-none tracking-tight text-white">
                        {winner}
                      </h2>
                    </>
                  )}
                </div>
              </header>

              <div className="mx-auto mb-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018]/70 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
                  <div className="h-4 w-1 rounded-full bg-white/30" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                    {t("finalResults", "Final Scorecard")}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row">
                  <FinalScoreColumn
                    isWinner={winner === teamName}
                    result={userFinal}
                    yellow={cards.userYellow}
                    teamName={teamName}
                  />

                  <div className="flex items-center justify-center border-x border-white/10 px-5 py-4">
                    <span className="text-xs font-black italic tracking-[0.2em] text-white/20">
                      VS
                    </span>
                  </div>

                  <FinalScoreColumn
                    isWinner={winner === "AI FC"}
                    result={botFinal}
                    yellow={cards.botYellow}
                    teamName="AI FC"
                  />
                </div>
              </div>

              <div className="mb-10 grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                <PitchPanel team={userTeam} name={teamName} />
                <PitchPanel team={botTeam} name="AI FC" />
              </div>

              <div className="mb-12 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                <TeamPanel
                  team={userTeam}
                  teamName={teamName}
                  cards={{ yellow: cards.userYellow, red: cards.userRed }}
                  showOverall
                />
                <TeamPanel
                  team={botTeam}
                  teamName="AI FC"
                  cards={{ yellow: cards.botYellow, red: cards.botRed }}
                  showOverall
                />
              </div>

              <div className="sticky bottom-6 z-50">
                <button
                  onClick={onPlayAgain}
                  className="group inline-flex h-14 items-center gap-3 rounded-full border border-white/15 bg-[#0b1018]/90 px-9 text-[15px] font-black uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#111827] active:scale-[0.98]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:-rotate-90"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}