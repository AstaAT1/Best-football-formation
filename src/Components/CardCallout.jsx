// ============================================================
// CardCallout.jsx — Collina referee: center→grow→slide to side
// ============================================================
import { useEffect, useState } from "react";
import images from "../constants/images";

/**
 * Props:
 *   event: { type:"yellow"|"red", who:"user"|"bot", teamName } | null
 *   onDone: () => void
 */
export default function CardCallout({ event, onDone }) {
    const [phase, setPhase] = useState("hidden"); // hidden | center | slide | out

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
    const label = event.who === "user" ? event.teamName : "AI FC";
    const msg = isYellow
        ? `${label} — Yellow Card (−2 pts)`
        : `${label} — Red Card! Removal at end!`;

    return (
        <div className={`callout-overlay callout-phase-${phase} ${phase === "slide" ? side : ""}`}>
            <div className="callout-box">
                <img
                    src={images.PierluigiCollina}
                    alt="Referee Collina"
                    className="callout-ref-img"
                />
                <div className={`callout-card-rect ${isYellow ? "callout-yellow" : "callout-red"}`} />
                <p className="callout-msg">{msg}</p>
            </div>
        </div>
    );
}
