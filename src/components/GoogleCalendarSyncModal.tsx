/**
 * GoogleCalendarSyncModal
 *
 * Shows all doctors with their Google Calendar connection status.
 * Flow per doctor:
 *   1. Admin clicks "Conectar"
 *   2. Confirmation dialog appears (shows the doctor's email stored in their profile)
 *   3. On confirm → Google OAuth popup opens for that email/account
 *   4. After authorization → calendar is synced automatically
 *   5. If email doesn't exist in Google → OAuth fails silently, nothing changes
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CheckCircle2, AlertCircle, Loader2, RefreshCcw, LogOut } from 'lucide-react';
import { useMarket, isDoctor, type StaffMember } from '../context/MarketContext';
import {
    connectDoctor,
    disconnectDoctor,
    getStoredToken,
    getClientId,
} from '../lib/googleCalendar';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSyncComplete: () => void; // called after a doctor connects/disconnects so Agenda re-fetches
}

interface DoctorSyncState {
    connecting: boolean;
    error: string | null;
    connected: boolean;
    email: string;
}

/** Confirmation dialog shown before opening Google OAuth */
const ConfirmConnectDialog: React.FC<{
    doctor: StaffMember;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ doctor, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
        <div className="bg-[#0d1b2e] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-syne font-bold text-white text-lg">Vincular Google Calendar</h3>
            </div>

            <p className="text-clinical/70 text-sm mb-3">
                Se abrirá una ventana de autorización de Google para vincular el calendario de:
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="font-bold text-white text-sm">{doctor.nombres}</div>
                <div className="text-electric text-xs font-mono mt-1">{doctor.email}</div>
                <div className="text-clinical/50 text-xs mt-1">{doctor.especialidad}</div>
            </div>

            <p className="text-clinical/50 text-xs mb-6">
                Al confirmar, Google pedirá que inicies sesión con la cuenta <strong className="text-clinical/80">{doctor.email}</strong>.
                Si el correo es incorrecto o no existe en Google, la autorización simplemente no funcionará.
                Nümia no almacena tu contraseña de Google.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-clinical/70 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Autorizar con Google
                </button>
            </div>
        </div>
    </motion.div>
);

export const GoogleCalendarSyncModal: React.FC<Props> = ({ isOpen, onClose, onSyncComplete }) => {
    const { clinicProfile } = useMarket();
    const doctors = (clinicProfile?.staff || []).filter(isDoctor);
    const clientIdConfigured = Boolean(getClientId());

    const [syncStates, setSyncStates] = useState<Record<string, DoctorSyncState>>({});
    const [pendingConfirm, setPendingConfirm] = useState<StaffMember | null>(null);

    // Initialize sync states from existing session tokens
    useEffect(() => {
        if (!isOpen) return;
        const initial: Record<string, DoctorSyncState> = {};
        for (const doc of doctors) {
            const token = getStoredToken(doc.id);
            initial[doc.id] = {
                connecting: false,
                error: null,
                connected: Boolean(token),
                email: token?.email || doc.email,
            };
        }
        setSyncStates(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const updateState = (doctorId: string, patch: Partial<DoctorSyncState>) => {
        setSyncStates(prev => ({
            ...prev,
            [doctorId]: { ...prev[doctorId], ...patch },
        }));
    };

    const handleConnect = (doctor: StaffMember) => {
        setPendingConfirm(doctor);
    };

    const handleConfirm = (doctor: StaffMember) => {
        setPendingConfirm(null);
        updateState(doctor.id, { connecting: true, error: null });

        connectDoctor(
            doctor.id,
            (token) => {
                updateState(doctor.id, {
                    connecting: false,
                    connected: true,
                    error: null,
                    email: token.email || doctor.email,
                });
                onSyncComplete();
            },
            (msg) => {
                updateState(doctor.id, { connecting: false, error: msg });
            }
        );
    };

    const handleDisconnect = (doctor: StaffMember) => {
        disconnectDoctor(doctor.id);
        updateState(doctor.id, { connected: false, email: doctor.email, error: null });
        onSyncComplete();
    };

    return (
        <>
            <AnimatePresence>
                {pendingConfirm && (
                    <ConfirmConnectDialog
                        doctor={pendingConfirm}
                        onConfirm={() => handleConfirm(pendingConfirm)}
                        onCancel={() => setPendingConfirm(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0d1b2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-syne font-bold text-white">Google Calendar</h2>
                                        <p className="text-xs text-clinical/50">Sincronización por doctor</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/5 text-clinical/40 hover:text-white transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Client ID warning */}
                            {!clientIdConfigured && (
                                <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-300">
                                        <strong>Falta configuración:</strong> Agrega{' '}
                                        <code className="font-mono bg-black/20 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>{' '}
                                        en el archivo <code className="font-mono bg-black/20 px-1 rounded">.env</code> para
                                        habilitar la sincronización.
                                    </p>
                                </div>
                            )}

                            {/* Doctor list */}
                            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                                {doctors.length === 0 && (
                                    <p className="text-clinical/40 text-sm text-center py-8">
                                        No hay doctores registrados en el staff.
                                    </p>
                                )}

                                {doctors.map(doctor => {
                                    const state = syncStates[doctor.id] ?? {
                                        connecting: false, error: null, connected: false, email: doctor.email,
                                    };

                                    return (
                                        <div
                                            key={doctor.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                                state.connected
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-white/3 border-white/8'
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${doctor.colorTheme?.split(' ')[0] || 'bg-electric/10'}`}>
                                                {doctor.nombres.charAt(0)}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm truncate">{doctor.nombres}</div>
                                                <div className="text-xs text-clinical/50 truncate font-mono">
                                                    {state.connected ? state.email : doctor.email}
                                                </div>
                                                {state.error && (
                                                    <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                                        {state.error}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status + action */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {state.connected && (
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Activo
                                                    </span>
                                                )}

                                                {state.connecting ? (
                                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                                ) : state.connected ? (
                                                    <button
                                                        onClick={() => handleDisconnect(doctor)}
                                                        title="Desconectar Google Calendar"
                                                        className="p-1.5 rounded-lg text-clinical/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnect(doctor)}
                                                        disabled={!clientIdConfigured}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                        </svg>
                                                        Conectar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex items-center justify-between">
                                <p className="text-xs text-clinical/30 flex items-center gap-1">
                                    <RefreshCcw className="w-3 h-3" />
                                    La agenda se sincroniza automáticamente cada 30 s
                                </p>
                                <button
                                    onClick={() => { onSyncComplete(); onClose(); }}
                                    className="px-4 py-2 rounded-lg bg-electric text-cobalt text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Listo
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};