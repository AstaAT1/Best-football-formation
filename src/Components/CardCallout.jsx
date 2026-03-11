// ============================================================
// CardCallout.jsx — Collina referee: center→grow→slide to side
// ============================================================
import { useEffect, useState } from "react";
import images from "../constants/images";
import { useTranslation } from "react-i18next";

/**
 * Props:
 *   event: { type:"yellow"|"red", who:"user"|"bot", teamName } | null
 *   onDone: () => void
 */
export default function CardCallout({ event, onDone }) {
    const [phase, setPhase] = useState("hidden"); // hidden | center | slide | out
    const { t } = useTranslation("ui");

    useEffect(() => {
        if (!event) return;
        // Phase 1: appear centered+small, grow
        setPhase("center");
        // Phase 2: slide toward user/bot side
        const t1 = setTimeout(() => setPhase("slide"), 1000);
        // Phase 3: fade out
        const t2 = setTimeout(() => setPhase("out"), 1700);
        // Phase 4: cleanup
        const t3 = setTimeout(() => {
            setPhase("hidden");
            onDone();
        }, 2050);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [event]); // eslint-disable-line

    if (!event || phase === "hidden") return null;

    const isYellow = event.type === "yellow";
    const side = event.who === "user" ? "slide-left" : "slide-right";
    const label = event.who === "user" ? event.teamName : t("aiFc", "AI FC");
    const msg = isYellow
        ? `${label} — ${t("yellowCardLabel", "Yellow Card")} (${t("minusTwoPts", "−2 pts")})`
        : `${label} — ${t("redCardLabel", "Red Card")} ${t("removalAtEnd", "Removal at end!")}`;

    // We map phases to Tailwind utility classes to replace the old CSS @keyframes
    const overlayBase = "fixed inset-0 z-[200] flex items-center justify-center bg-black/82 pointer-events-none transition-opacity duration-300";
    const overlayState = phase === "hidden" ? "opacity-0 hidden" : phase === "out" ? "opacity-0" : "opacity-100";

    const boxBase = "flex flex-col items-center gap-3 transition-all duration-700 ease-in-out";

    // Scale transitions for appearance
    let boxTransform = "scale-50 opacity-0";
    if (phase === "center" || phase === "slide") boxTransform = "scale-100 opacity-100";
    if (phase === "out") boxTransform = "scale-90 opacity-0";

    // Slide transitions
    let slideTransform = "translate-x-0";
    if (phase === "slide") {
        slideTransform = side === "slide-left" ? "-translate-x-[25vw]" : "translate-x-[25vw]";
    }

    return (
        <div className={`${overlayBase} ${overlayState}`}>
            <div className={`${boxBase} ${boxTransform} ${slideTransform}`}>
                <img
                    src={images.PierluigiCollina}
                    alt="Referee Collina"
                    className="h-[110px] w-[110px] rounded-full border-[3px] border-white/20 object-cover shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                />
                <div
                    className={`h-[72px] w-[48px] rounded transition-colors duration-300 ${isYellow ? "bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]" : "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]"}`}
                />
                <p className="mt-2 text-center text-sm font-black uppercase tracking-[0.1em] text-white drop-shadow-md">
                    {msg}
                </p>
            </div>
        </div>
    );
}
