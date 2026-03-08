import { motion } from "framer-motion";
import images from "../constants/images";

const FORMATION = {
  GK: [{ x: 50, y: 86 }],
  DF: [
    { x: 17, y: 69 },
    { x: 39, y: 69 },
    { x: 61, y: 69 },
    { x: 83, y: 69 },
  ],
  MF: [
    { x: 30, y: 49 },
    { x: 50, y: 49 },
    { x: 70, y: 49 },
  ],
  ATK: [
    { x: 30, y: 29 },
    { x: 50, y: 29 },
    { x: 70, y: 29 },
  ],
};

const POS_ORDER = ["GK", "DF", "MF", "ATK"];

function getPlayerPos(player) {
  return (player?.pos || player?.position || "").toUpperCase();
}

function groupPlayers(team = []) {
  const grouped = {
    GK: [],
    DF: [],
    MF: [],
    ATK: [],
  };

  team.forEach((player) => {
    const pos = getPlayerPos(player);
    if (grouped[pos]) grouped[pos].push(player);
  });

  return grouped;
}

function getPlayerImage(player) {
  return images?.[player?.imageKey] || images?.fallbackAvatar || images?.avatar;
}

function shortName(name = "") {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1] || name;
}

export default function PitchLineup({ team = [], teamName }) {
  const grouped = groupPlayers(team);

  const markers = [];

  for (const pos of POS_ORDER) {
    const players = grouped[pos] ?? [];
    const slots = FORMATION[pos] ?? [];

    for (let i = 0; i < slots.length; i += 1) {
      markers.push({
        player: players[i] ?? null,
        x: slots[i].x,
        y: slots[i].y,
        pos,
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <h3 className="mb-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white/85">
        {teamName}
      </h3>

      <div className="relative mx-auto aspect-[3/4.2] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
        {/* subtle overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_50%)]" />

        {/* halfway line */}
        <div className="absolute left-[8%] right-[8%] top-1/2 h-px -translate-y-1/2 bg-white/10" />

        {/* center circle */}
        <div className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

        {/* top penalty area */}
        <div className="absolute left-1/2 top-[6%] h-[13%] w-[48%] -translate-x-1/2 rounded-b-xl border border-t-0 border-white/10" />
        <div className="absolute left-1/2 top-[6%] h-[4%] w-[18%] -translate-x-1/2 rounded-b-md border border-t-0 border-white/10" />

        {/* bottom penalty area */}
        <div className="absolute bottom-[6%] left-1/2 h-[13%] w-[48%] -translate-x-1/2 rounded-t-xl border border-b-0 border-white/10" />
        <div className="absolute bottom-[6%] left-1/2 h-[4%] w-[18%] -translate-x-1/2 rounded-t-md border border-b-0 border-white/10" />

        {markers.map((marker, index) => (
          <motion.div
            key={`${marker.pos}-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 240,
              damping: 18,
            }}
          >
            {marker.player ? (
              <div className="flex w-[74px] flex-col items-center text-center sm:w-[82px]">
                <img
                  src={getPlayerImage(marker.player)}
                  alt={marker.player.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-white/75 shadow-[0_6px_12px_rgba(0,0,0,0.28)] sm:h-12 sm:w-12"
                />

                <span className="mt-1.5 max-w-full truncate text-[11px] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {shortName(marker.player.name)}
                </span>

                <span className="mt-1 inline-flex min-w-[24px] items-center justify-center rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-black text-emerald-200">
                  {marker.player.overall}
                </span>
              </div>
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white/20 bg-black/10 text-sm text-white/22">
                ×
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}