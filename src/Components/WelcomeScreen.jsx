import { useState } from "react";
import images from "../constants/images";
import bg from "../assets/images/background.jpg";

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

const STADIUMS = [
  { id: "stadebernabeu", label: "Santiago Bernabéu", sub: "Real Madrid" },
  { id: "barcastade", label: "Camp Nou", sub: "FC Barcelona" },
  { id: "moroccostade", label: "Moulay Abdellah", sub: "Morocco" },
  { id: "uclstade", label: "Champions League", sub: "Final Night" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ChevronDown({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function RulesAccordion({ open, onToggle }) {
  return (
    <div className="mt-5">
      <button
        type="button"
        className="w-full text-inherit"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/15 hover:bg-black/25">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm">
              📋
            </div>
            <span className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-white">
              How to Play
            </span>
          </div>
          <ChevronDown open={open} />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-1.5">
            <div className="max-h-[220px] overflow-y-auto px-2 py-1">
              {RULES.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/50" />
                  <span className="text-[13px] leading-6 text-white/70">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DifficultySelector({ value, onChange }) {
  return (
    <div className="mt-5">
      <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/75">
        Difficulty
      </label>

      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((level) => {
          const active = value === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={cn(
                "min-w-[84px] rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                active
                  ? "border-white bg-white text-[#0b0e14]"
                  : "border-white/10 bg-black/20 text-white/75 hover:bg-black/30"
              )}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StadiumCarousel({
  stadium,
  currentIndex,
  currentStadium,
  currentImage,
  onPrev,
  onNext,
  onSelect,
  onGoTo,
}) {
  const isSelected = stadium === currentStadium.id;

  return (
    <div className="mt-5">
      <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/75">
        Select Stadium
      </label>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div
          className="group relative aspect-[16/8.6] cursor-pointer overflow-hidden"
          onClick={onSelect}
        >
          <img
            src={currentImage}
            alt={currentStadium.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition hover:bg-black/70"
            onClick={onPrev}
            aria-label="Previous stadium"
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition hover:bg-black/70"
            onClick={onNext}
            aria-label="Next stadium"
          >
            <ChevronRight />
          </button>

          {isSelected && (
            <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0b0e14]">
              <CheckIcon />
              Selected
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 z-[2]">
            <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">
              {currentStadium.sub}
            </div>
            <div className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-white sm:text-[24px]">
              {currentStadium.label}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-1.5 sm:justify-start">
            {STADIUMS.map((item, index) => {
              const isActive = index === currentIndex;
              const isPicked = item.id === stadium;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onGoTo(index)}
                  aria-label={`Go to ${item.label}`}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    isActive
                      ? "h-1.5 w-5.5 bg-white"
                      : isPicked
                      ? "h-1.5 w-2.5 bg-white/70"
                      : "h-1.5 w-1.5 bg-white/25"
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold uppercase tracking-[0.08em] transition",
              isSelected
                ? "border-white bg-white text-[#0b0e14]"
                : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
            )}
          >
            {isSelected ? (
              <>
                <CheckIcon />
                Confirmed
              </>
            ) : (
              "Select Venue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WelcomeScreen({ onStart }) {
  const [teamName, setTeamName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [stadium, setStadium] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const currentStadium = STADIUMS[currentIndex];
  const currentStadiumImage = images?.[currentStadium.id] || bg;
  const canStart = Boolean(teamName.trim() && stadium);

  const selectCurrentStadium = () => {
    setStadium(currentStadium.id);
  };

  const goPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? STADIUMS.length - 1 : prev - 1));
  };

  const goNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === STADIUMS.length - 1 ? 0 : prev + 1));
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!canStart) return;

    onStart?.({
      teamName: teamName.trim(),
      difficulty,
      stadium,
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#05070c] px-4 py-8 text-white">
      {/* background image visible */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* light dark overlay only */}
      <div className="absolute inset-0 bg-black/45" />

      {/* soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.28)_100%)]" />

      <div className="relative z-10 w-full max-w-[620px]">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/35 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <header className="mb-8 text-center">
              <h1 className="text-[clamp(42px,8vw,64px)] font-black leading-none tracking-tight text-white">
                ⚽ Draft Arena
              </h1>
              <p className="mt-3 text-[15px] font-medium tracking-wide text-white/60">
                Build your dream squad — one question at a time.
              </p>
            </header>

            <RulesAccordion
              open={showRules}
              onToggle={() => setShowRules((prev) => !prev)}
            />

            <form onSubmit={handleStart} className="mt-6">
              <div className="mt-4">
                <label
                  htmlFor="teamName"
                  className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/75"
                >
                  Your Team Name
                </label>

                <input
                  id="teamName"
                  type="text"
                  className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 px-5 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-black/30"
                  placeholder="e.g. Atlas Lions FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={24}
                  autoFocus
                />
              </div>

              <DifficultySelector value={difficulty} onChange={setDifficulty} />

              <StadiumCarousel
                stadium={stadium}
                currentIndex={currentIndex}
                currentStadium={currentStadium}
                currentImage={currentStadiumImage}
                onPrev={goPrev}
                onNext={goNext}
                onSelect={selectCurrentStadium}
                onGoTo={setCurrentIndex}
              />

              <div className="mt-8 border-t border-white/5 pt-4">
                <button
                  type="submit"
                  className="h-[56px] w-full rounded-2xl bg-white text-[15px] font-black uppercase tracking-[0.05em] text-[#020617] transition hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                  disabled={!canStart}
                >
                  Start Draft ⚡
                </button>

                {!canStart && (
                  <div className="mx-auto mt-4 max-w-xs text-center text-xs font-medium leading-relaxed text-white/40">
                    {!teamName.trim() && !stadium
                      ? "Enter your team name and select a stadium to continue."
                      : !teamName.trim()
                      ? "Enter your team name to continue."
                      : "Select a stadium to continue."}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}