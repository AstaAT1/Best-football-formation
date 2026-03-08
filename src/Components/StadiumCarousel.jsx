// ============================================================
// StadiumCarousel.jsx — setup carousel (clean Tailwind rebuild)
// ============================================================
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import images from "../constants/images";
import { STADIUMS } from "../engine/gameConfig";

const SLIDE_VARIANTS = {
    enter: (dir) => ({ x: dir > 0 ? 260 : -260, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -260 : 260, opacity: 0, scale: 0.96 }),
};

export default function StadiumCarousel({ value, onChange }) {
    const initial = value ? STADIUMS.findIndex((s) => s.id === value) : 0;
    const [index, setIndex] = useState(initial < 0 ? 0 : initial);
    const [dir, setDir] = useState(1);

    const current = STADIUMS[index];
    const selectedStadium = STADIUMS.find((s) => s.id === value) || null;

    useEffect(() => {
        if (!value) return;
        const next = STADIUMS.findIndex((s) => s.id === value);
        if (next >= 0) setIndex(next);
    }, [value]);

    function go(delta) {
        setDir(delta);
        setIndex((prev) => (prev + delta + STADIUMS.length) % STADIUMS.length);
    }

    return (
        <div className="w-full space-y-3">
            <div className="relative">
                <div className="absolute inset-y-0 left-2 z-20 flex items-center">
                    <button
                        className="h-10 w-10 rounded-full border border-white/15 bg-black/50 text-xl text-white/75
                            transition-all hover:border-white/30 hover:bg-black/70 hover:text-white"
                        onClick={() => go(-1)}
                        aria-label="Previous stadium"
                    >
                        ‹
                    </button>
                </div>
                <div className="absolute inset-y-0 right-2 z-20 flex items-center">
                    <button
                        className="h-10 w-10 rounded-full border border-white/15 bg-black/50 text-xl text-white/75
                            transition-all hover:border-white/30 hover:bg-black/70 hover:text-white"
                        onClick={() => go(1)}
                        aria-label="Next stadium"
                    >
                        ›
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
                    <AnimatePresence initial={false} custom={dir} mode="wait">
                        <motion.div
                            key={current.id}
                            className="relative"
                            custom={dir}
                            variants={SLIDE_VARIANTS}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 240, damping: 28 }}
                        >
                            <div className="relative h-[220px] sm:h-[250px] overflow-hidden">
                                <img
                                    src={images[current.imageKey]}
                                    alt={current.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,12,.98)] via-[rgba(8,8,12,.35)] to-transparent" />
                                {value === current.id && (
                                    <motion.div
                                        className="absolute right-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[0.68rem] font-black uppercase tracking-wider text-black shadow-lg"
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        Selected
                                    </motion.div>
                                )}
                            </div>
                            <div className="space-y-2 p-4 sm:p-5">
                                <h3 className="text-base font-black tracking-wide text-white sm:text-[1.05rem]">
                                    {current.name}
                                </h3>
                                {current.subtitle && (
                                    <p className="text-[0.76rem] leading-relaxed text-[#9a9aac] sm:text-[0.8rem]">
                                        {current.subtitle}
                                    </p>
                                )}
                                <button
                                    className={`mt-1 inline-flex h-9 items-center justify-center rounded-lg border px-4 text-[0.7rem] font-black uppercase tracking-[0.08em] transition-all
                                        ${value === current.id
                                            ? "text-white shadow-[0_0_20px_var(--stadium-accent)]"
                                            : "border-white/20 bg-white/5 text-white/75 hover:border-white/35 hover:bg-white/10 hover:text-white"
                                        }`}
                                    style={{
                                        "--stadium-accent": current.accent,
                                        ...(value === current.id ? { background: current.accent, borderColor: current.accent } : {}),
                                    }}
                                    onClick={() => onChange(value === current.id ? null : current.id)}
                                >
                                    {value === current.id ? "Stadium Selected" : "Select Stadium"}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {STADIUMS.map((s, i) => (
                    <button
                        key={s.id}
                        className={`rounded-full border px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.06em] transition-all
                            ${value === s.id
                                ? "text-white"
                                : i === index
                                    ? "border-white/30 bg-white/10 text-white/90"
                                    : "border-white/10 bg-white/[0.02] text-[#8a8a9a] hover:border-white/20 hover:text-white/90"
                            }`}
                        style={value === s.id ? { borderColor: s.accent, background: s.accent } : undefined}
                        onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
                    >
                        {s.name}
                    </button>
                ))}
            </div>

            <p className="text-[0.72rem] text-[#9a9aac]">
                {selectedStadium
                    ? `Selected: ${selectedStadium.name}`
                    : "No stadium selected yet"}
            </p>
        </div>
    );
}
