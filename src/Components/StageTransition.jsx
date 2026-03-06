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
                    className="stage-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className={`stage-box ${isSpecial ? "stage-special" : ""}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    >
                        <motion.img
                            src={images.PierluigiCollina}
                            alt="Referee Collina"
                            className="stage-ref-img"
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ repeat: 1, duration: 0.6, ease: "easeInOut" }}
                        />
                        {isSpecial && <span className="stage-whistle">🏟️</span>}
                        <p className="stage-msg">{message}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
