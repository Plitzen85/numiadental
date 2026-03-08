import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Stethoscope, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';

interface LoginProps {
    onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const { login } = useAuth();
    const { clinicProfile, syncError, hasSyncedFromCloud, syncFromCloud } = useMarket();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Slight artificial delay for UX
        await new Promise(r => setTimeout(r, 600));

        const staff = clinicProfile?.staff ?? [];

        // --- EMERGENCY BYPASS LOGIC ---
        const hasAdmins = staff.some(s => s.role === 'admin' || s.staffType === 'admin');
        const isEmergencyAttempt = email.trim() === 'Plitzen' && password === 'Plitzen';

        let ok = false;
        if (!hasAdmins && isEmergencyAttempt) {
            console.warn('[Security] Emergency login triggered (no admins found)');
            // Create a temporary emergency admin session
            const emergencyUser: any = {
                id: 'emergency-admin',
                nombres: 'ADMIN EMERGENCIA',
                email: 'Plitzen',
                password: 'Plitzen',
                role: 'admin',
                staffType: 'admin',
                especialidad: 'Soporte Técnico',
                modulePermissions: {
                    dashboard: true, radar: true, agenda: true, clinica: true,
                    inventario: true, campanas: true, turismo: true, finanzas: true,
                    reportes: true, settings: true,
                }
            };
            // Note: AuthContext login searches the provided array
            ok = login('Plitzen', 'Plitzen', [emergencyUser]);
        } else {
            ok = login(email.trim(), password, staff);
        }
        // ------------------------------

        if (ok) {
            onSuccess();
        } else {
            console.log('[Login] Failure. Local staff count:', staff.length);
            const staffMatch = staff.find(s => s.email.toLowerCase() === email.trim().toLowerCase());

            if (staff.length > 0 && !staffMatch) {
                setError(`El correo "${email}" no está registrado en esta clínica. Verifica con tu administrador.`);
            } else if (staffMatch && staffMatch.password !== password) {
                setError('Contraseña incorrecta. Verifica tus datos.');
            } else {
                setError('Correo o contraseña incorrectos. Verifica tus datos.');
            }
            setShake(true);
            setTimeout(() => setShake(false), 650);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-cobalt flex items-center justify-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full login-glow-tl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full login-glow-br" />
                <div className="absolute inset-0 opacity-[0.03] login-grid" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md px-6"
            >
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-electric/10 border border-electric/20 mb-4">
                        <Stethoscope className="w-8 h-8 text-electric" />
                    </div>
                    <h1 className="font-syne text-4xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text">
                        NÜMIA
                    </h1>
                    <p className="text-clinical/40 text-sm tracking-[0.25em] uppercase mt-1">Dental Wellness</p>
                </div>

                {/* Card */}
                <motion.div
                    animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="glass-panel rounded-2xl p-8 border border-white/10"
                >
                    <h2 className="text-white font-bold text-lg mb-1">Bienvenido de vuelta</h2>
                    <p className="text-clinical/40 text-sm mb-8">Ingresa tus credenciales para acceder</p>

                    {syncError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-[10px] font-bold leading-tight">
                                    MODO OFFLINE: {syncError} Los datos podrían no estar sincronizados con la nube.
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    syncFromCloud();
                                }}
                                className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Reintentar Sincronización
                            </button>
                        </div>
                    )}

                    {!hasSyncedFromCloud && !syncError && (
                        <div className="mb-6 p-3 rounded-lg bg-electric/10 border border-electric/20 flex items-center gap-3 animate-pulse">
                            <AlertCircle className="w-5 h-5 text-electric flex-shrink-0" />
                            <p className="text-electric text-[10px] font-bold leading-tight">
                                SINCRONIZANDO: Espera un momento mientras cargamos la información más reciente...
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-clinical/50 uppercase tracking-widest">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical/30" />
                                <input
                                    id="login-email"
                                    type="text"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    placeholder="usuario@clinica.com"
                                    required
                                    autoComplete="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-clinical placeholder-clinical/20 focus:outline-none focus:border-electric/50 focus:bg-electric/5 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-clinical/50 uppercase tracking-widest">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical/30" />
                                <input
                                    id="login-password"
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-clinical placeholder-clinical/20 focus:outline-none focus:border-electric/50 focus:bg-electric/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-clinical/30 hover:text-clinical/70 transition-colors"
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-300 relative overflow-hidden disabled:opacity-60 login-btn-gradient"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Verificando...
                                </span>
                            ) : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="text-center text-[11px] text-clinical/25 mt-6">
                        Plataforma privada · Solo personal autorizado
                    </p>
                </motion.div>

                {/* --- DEBUG HELP (Hidden/Subtle) --- */}
                <div
                    onClick={() => {
                        const count = clinicProfile?.staff?.length ?? 0;
                        const staffList = clinicProfile?.staff?.map(s => s.email).join(', ') || 'Vacio';
                        alert(`Staff detectados: ${count}\nEmails: ${staffList}\nSupabase: ${!!import.meta.env.VITE_SUPABASE_URL ? 'Configurado' : 'FALTA ENV VAR'}`);
                    }}
                    className="mt-4 flex items-center justify-center gap-2 cursor-help opacity-40 hover:opacity-100 transition-opacity"
                >
                    <div className={`w-2 h-2 rounded-full ${clinicProfile?.staff?.length ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-[9px] text-clinical/40 uppercase font-mono tracking-tighter">
                        SYNC ID: {clinicProfile?.staff?.length || 0}S-ACTV
                    </span>
                </div>

                {/* Version */}
                <p className="text-center text-[10px] text-clinical/20 mt-6 tracking-widest uppercase">
                    NÜMIA Dental Wellness v2.0
                </p>
            </motion.div>
        </div>
    );
};
