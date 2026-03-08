// ============================================================
// StageTransition.jsx — Collina announces stage boundaries
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import images from "../constants/images";

/**
 * Props:
 *   message: string | null    — text to display, null hides overlay
 *   isSpecial: boolean        — true for the draft→changement transition (extra emphasis)
 *   onDone: () => void        — called when overlay finishes
 */
export default function StageTransition({ message, isSpecial, onDone }) {
    const duration = isSpecial ? 2400 : 2000;

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onDone, duration);
        return () => clearTimeout(t);
    }, [message]); // eslint-disable-line

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className={`flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#0b1018]/95 p-8 text-center shadow-2xl ${isSpecial ? "border-amber-400/50 bg-amber-950/40 shadow-[0_0_40px_rgba(251,191,36,0.2)]" : ""
                            }`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    >
                        <motion.img
                            src={images.PierluigiCollina}
                            alt="Referee Collina"
                            className="h-[120px] w-[120px] rounded-full border-[3px] border-white/20 object-cover shadow-xl"
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ repeat: 1, duration: 0.6, ease: "easeInOut" }}
                        />
                        {isSpecial && <span className="text-4xl drop-shadow-lg">🏟️</span>}
                        <p className={`text-lg font-bold leading-relaxed tracking-tight ${isSpecial ? "text-amber-300" : "text-white"}`}>
                            {message}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
