/**
 * SafetyOverlay
 * ─────────────
 * Renders 3 UI elements on top of the RideTracking page (never blocks ride flow):
 *  1. Floating 🚨 ALERT button (bottom-right)
 *  2. Inactivity popup — "Is your ride started?" with YES / NO + countdown
 *  3. Offline banner (top of screen)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wifi, WifiOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface SafetyOverlayProps {
    rideStatus: string;
    showInactivityPopup: boolean;
    countdown: number;
    isOnline: boolean;
    alertButtonCooldown: boolean;
    pendingAlertCount: number;
    onUserResponded: (answer: 'yes' | 'no') => void;
    onManualAlert: () => Promise<void>;
    emergencyContacts?: { name: string; phone: string }[];
}

const SafetyOverlay = ({
    rideStatus,
    showInactivityPopup,
    countdown,
    isOnline,
    alertButtonCooldown,
    pendingAlertCount,
    onUserResponded,
    onManualAlert,
    emergencyContacts,
}: SafetyOverlayProps) => {
    const rideComplete =
        rideStatus === 'COMPLETED' || rideStatus === 'completed';

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Get the primary emergency contact (or fallback to 112)
    const primaryContact = emergencyContacts && emergencyContacts.length > 0
        ? emergencyContacts[0]
        : { name: 'Emergency Services', phone: '112' };

    const handleAlertClick = () => {
        if (alertButtonCooldown) return;
        setShowConfirmDialog(true);
    };

    const handleConfirmAlert = async () => {
        setShowConfirmDialog(false);
        await onManualAlert();
        toast.error('🚨 Emergency help message sent to your contacts!', {
            duration: 5000,
            style: { background: '#dc2626', color: 'white' },
        });
    };

    const handleCancelAlert = () => {
        setShowConfirmDialog(false);
    };

    const handleYes = () => {
        onUserResponded('yes');
        toast.success('✅ Ride continued — timer reset.', { duration: 3000 });
    };

    const handleNo = () => {
        onUserResponded('no');
        toast.error('🚨 Emergency alert triggered!', {
            duration: 5000,
            style: { background: '#dc2626', color: 'white' },
        });
    };

    return (
        <>
            {/* ── Offline Banner ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        key="offline-banner"
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 flex items-center justify-center gap-2 py-2 text-sm font-semibold shadow-lg"
                    >
                        <WifiOff size={15} />
                        Offline — Alerts queued locally
                        {pendingAlertCount > 0 && (
                            <span className="bg-amber-950 text-amber-300 text-xs px-2 py-0.5 rounded-full ml-1">
                                {pendingAlertCount} pending
                            </span>
                        )}
                    </motion.div>
                )}

                {/* Brief "back online" flash */}
                {isOnline && pendingAlertCount > 0 && (
                    <motion.div
                        key="online-syncing"
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white flex items-center justify-center gap-2 py-2 text-sm font-semibold shadow-lg"
                    >
                        <Wifi size={15} />
                        Back online — Syncing {pendingAlertCount} buffered item(s)…
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Inactivity Popup ───────────────────────────────────────────── */}
            <AnimatePresence>
                {showInactivityPopup && (
                    <motion.div
                        key="inactivity-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-card/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-8 max-w-sm w-full text-center"
                        >
                            {/* Pulsing icon */}
                            <motion.div
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                                className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5"
                            >
                                <AlertTriangle size={32} className="text-amber-500" />
                            </motion.div>

                            <h2 className="font-display text-2xl font-bold mb-2">
                                Is your ride started?
                            </h2>
                            <p className="text-muted-foreground text-sm mb-2">
                                No movement detected for a while. Are you safe?
                            </p>

                            {/* Countdown ring */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className="text-sm text-muted-foreground">Auto-alert in</span>
                                <span
                                    className={`font-display font-bold text-xl tabular-nums ${countdown <= 10 ? 'text-destructive' : 'text-amber-500'
                                        }`}
                                >
                                    {countdown}s
                                </span>
                            </div>

                            {/* Countdown progress bar */}
                            <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${countdown <= 10 ? 'bg-destructive' : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${(countdown / 30) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleNo}
                                    className="py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-base hover:brightness-110 active:scale-95 transition-all shadow-lg"
                                >
                                    NO 🆘
                                </button>
                                <button
                                    onClick={handleYes}
                                    className="py-3 rounded-xl bg-green-600 text-white font-bold text-base hover:brightness-110 active:scale-95 transition-all shadow-lg"
                                >
                                    YES ✅
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground mt-4">
                                Tapping NO or ignoring for {countdown}s will alert your emergency contacts.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Emergency Confirmation Dialog ──────────────────────────────── */}
            <AnimatePresence>
                {showConfirmDialog && (
                    <motion.div
                        key="confirm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-card/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-8 max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-5">
                                <AlertTriangle size={36} className="text-destructive animate-pulse" />
                            </div>

                            <h2 className="font-display text-2xl font-bold mb-2 text-destructive">
                                Send Emergency Alert?
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                This will immediately send a help message with your live location to your emergency contacts.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCancelAlert}
                                    className="py-3 rounded-xl bg-muted text-foreground font-bold text-base hover:brightness-110 active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAlert}
                                    className="py-3 rounded-xl bg-destructive text-white font-bold text-base hover:bg-red-700 active:scale-95 transition-all shadow-lg"
                                >
                                    Yes, Alert Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating ALERT Button ──────────────────────────────────────── */}
            {!rideComplete && (
                <div className="fixed bottom-6 right-4 z-[9997] flex flex-col items-center gap-1">
                    {/* Safety shield indicator */}
                    <div className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full mb-1">
                        <Shield size={9} className="text-green-400" />
                        <span className="text-green-400">Safety ON</span>
                    </div>

                    <div className="relative w-48 h-14 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center px-1 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-white/80 text-xs font-bold uppercase tracking-wider pl-8">
                                {alertButtonCooldown ? "Alert Sent" : "Slide to SOS"}
                            </span>
                        </div>
                        <motion.div
                            drag={alertButtonCooldown ? false : "x"}
                            dragConstraints={{ left: 0, right: 136 }}
                            dragElastic={0.1}
                            onDragEnd={(e, info) => {
                                if (info.offset.x > 100 && !alertButtonCooldown) {
                                    handleAlertClick();
                                }
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg border-2 border-white/30 ${
                                alertButtonCooldown ? "bg-gray-500" : "bg-destructive shadow-[0_0_15px_rgba(220,38,38,0.7)]"
                            }`}
                        >
                            {alertButtonCooldown ? (
                                <span className="text-lg">⏳</span>
                            ) : (
                                <span className="text-xl leading-none">🚨</span>
                            )}
                        </motion.div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SafetyOverlay;
