import React, { useState, useEffect, useMemo } from 'react';
import {
    Landmark, Plus, Lock, Unlock, TrendingUp, TrendingDown,
    Banknote, CreditCard, ArrowDownToLine, Bitcoin, Minus,
    CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp,
    DollarSign, X, Loader2, Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarket } from '../context/MarketContext';
import {
    getTodayCaja, abrirCaja, cerrarCaja, addMovimiento,
    getAllCajas, calcTotals, CajaDay, CajaMovimiento,
} from '../lib/cajaApi';
import { MetodoPago } from '../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const METODO_LABELS: Record<MetodoPago, string> = {
    efectivo:        'Efectivo',
    tarjeta_credito: 'T. Crédito',
    tarjeta_debito:  'T. Débito',
    transferencia:   'Transferencia',
    cripto:          'Cripto',
};

const METODO_ICONS: Record<MetodoPago, React.ReactNode> = {
    efectivo:        <Banknote className="w-4 h-4" />,
    tarjeta_credito: <CreditCard className="w-4 h-4" />,
    tarjeta_debito:  <CreditCard className="w-4 h-4" />,
    transferencia:   <ArrowDownToLine className="w-4 h-4" />,
    cripto:          <Bitcoin className="w-4 h-4" />,
};

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

// ─── Subcomponents ────────────────────────────────────────────────────────────

const MetodoBadge: React.FC<{ metodo: MetodoPago }> = ({ metodo }) => (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-clinical/50">
        {METODO_ICONS[metodo]}
        {METODO_LABELS[metodo]}
    </span>
);

const TipoChip: React.FC<{ tipo: CajaMovimiento['tipo'] }> = ({ tipo }) => {
    const map = {
        ingreso: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        egreso:  'bg-red-500/10 text-red-400 border-red-500/20',
        retiro:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    const labels = { ingreso: 'Ingreso', egreso: 'Egreso', retiro: 'Retiro' };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[tipo]}`}>
            {labels[tipo]}
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Caja: React.FC = () => {
    const { currentUserId, clinicProfile } = useMarket();
    const currentStaff = clinicProfile?.staff?.find(s => s.id === currentUserId);
    const operadorName = currentStaff?.nombres ?? 'Operador';

    const [caja, setCaja] = useState<CajaDay | null>(null);
    const [historial, setHistorial] = useState<CajaDay[]>([]);
    const [showHistorial, setShowHistorial] = useState(false);

    // ── Apertura modal ───────────────────────────────────────────────────────
    const [showApertura, setShowApertura] = useState(false);
    const [aperturaAmt, setAperturaAmt] = useState('');
    const [savingApertura, setSavingApertura] = useState(false);

    // ── Movimiento modal ─────────────────────────────────────────────────────
    const [showMovModal, setShowMovModal] = useState(false);
    const [movTipo, setMovTipo] = useState<CajaMovimiento['tipo']>('ingreso');
    const [movMonto, setMovMonto] = useState('');
    const [movConcepto, setMovConcepto] = useState('');
    const [movMetodo, setMovMetodo] = useState<MetodoPago>('efectivo');
    const [savingMov, setSavingMov] = useState(false);

    // ── Cierre modal ─────────────────────────────────────────────────────────
    const [showCierre, setShowCierre] = useState(false);
    const [cierreEfectivo, setCierreEfectivo] = useState('');
    const [cierreNotas, setCierreNotas] = useState('');
    const [savingCierre, setSavingCierre] = useState(false);

    // ── Expand list ──────────────────────────────────────────────────────────
    const [showAllMovs, setShowAllMovs] = useState(false);

    // ── Toast ────────────────────────────────────────────────────────────────
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    // ── Load ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        setCaja(getTodayCaja());
        setHistorial(getAllCajas().filter(d => d.id !== `caja-${new Date().toISOString().split('T')[0]}`));
    }, []);

    const totals = useMemo(() => caja ? calcTotals(caja) : null, [caja]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleAbrirCaja = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingApertura(true);
        const opened = abrirCaja(Number(aperturaAmt) || 0, currentUserId, operadorName);
        setCaja(opened);
        setSavingApertura(false);
        setShowApertura(false);
        setAperturaAmt('');
        showToast('Caja abierta correctamente');
    };

    const handleAddMov = (e: React.FormEvent) => {
        e.preventDefault();
        if (!movMonto || Number(movMonto) <= 0) return;
        setSavingMov(true);
        const updated = addMovimiento({
            tipo: movTipo,
            monto: Number(movMonto),
            concepto: movConcepto || (movTipo === 'ingreso' ? 'Cobro de servicio' : movTipo === 'egreso' ? 'Gasto operativo' : 'Retiro de efectivo'),
            metodoPago: movMetodo,
            operadorId: currentUserId,
            operadorName,
        });
        if (updated) setCaja({ ...updated });
        setSavingMov(false);
        setShowMovModal(false);
        setMovMonto('');
        setMovConcepto('');
        setMovTipo('ingreso');
        setMovMetodo('efectivo');
        showToast('Movimiento registrado');
    };

    const handleCerrarCaja = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCierre(true);
        const updated = cerrarCaja(Number(cierreEfectivo) || 0, cierreNotas, currentUserId);
        if (updated) {
            setCaja({ ...updated });
            setHistorial(prev => [updated, ...prev.filter(d => d.id !== updated.id)]);
        }
        setSavingCierre(false);
        setShowCierre(false);
        setCierreEfectivo('');
        setCierreNotas('');
        showToast('Caja cerrada correctamente');
    };

    const sortedMovs = useMemo(() =>
        [...(caja?.movimientos ?? [])].reverse(),
        [caja]
    );
    const visibleMovs = showAllMovs ? sortedMovs : sortedMovs.slice(0, 6);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-syne text-3xl font-bold text-white flex items-center gap-3">
                        <Landmark className="text-premium" /> Caja del Día
                    </h1>
                    <p className="text-clinical/40 text-sm mt-1 capitalize">
                        {fmtDate(new Date().toISOString().split('T')[0])}
                    </p>
                </div>
                {caja?.status === 'open' && (
                    <button
                        type="button"
                        onClick={() => setShowCierre(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
                    >
                        <Lock className="w-4 h-4" /> Cerrar Caja
                    </button>
                )}
            </div>

            {/* ── Toast ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4" /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════════ NO CAJA ABIERTA ════════ */}
            {!caja && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-10 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-premium/10 border border-premium/30 flex items-center justify-center mx-auto mb-5">
                        <Unlock className="w-8 h-8 text-premium" />
                    </div>
                    <h2 className="font-syne text-2xl font-bold text-white mb-2">Caja no abierta</h2>
                    <p className="text-clinical/40 text-sm mb-8 max-w-xs mx-auto">
                        Abre la caja del día para registrar movimientos, cobros y egresos de la clínica.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowApertura(true)}
                        className="px-8 py-4 rounded-2xl bg-premium text-cobalt font-black text-base hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(212,175,55,0.35)] flex items-center gap-2 mx-auto"
                    >
                        <Unlock className="w-5 h-5" /> Abrir Caja del Día
                    </button>
                </motion.div>
            )}

            {/* ════════ CAJA ABIERTA / CERRADA ════════ */}
            {caja && totals && (
                <>
                    {/* Status banner */}
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
                        caja.status === 'open'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-clinical/5 border-white/10 text-clinical/40'
                    }`}>
                        {caja.status === 'open'
                            ? <><CheckCircle2 className="w-4 h-4" /> Caja abierta — {operadorName} · apertura {fmt(caja.apertura)}</>
                            : <><Lock className="w-4 h-4" /> Caja cerrada — {caja.cierre?.closedAt ? new Date(caja.cierre.closedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}</>
                        }
                    </div>

                    {/* ── KPI Cards ──────────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Ingresos', value: totals.ingresos, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                            { label: 'Egresos', value: totals.egresos, icon: <TrendingDown className="w-5 h-5" />, color: 'text-red-400 border-red-500/30 bg-red-500/5' },
                            { label: 'Retiros', value: totals.retiros, icon: <Minus className="w-5 h-5" />, color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
                            { label: 'Neto del Día', value: totals.neto, icon: <DollarSign className="w-5 h-5" />, color: totals.neto >= 0 ? 'text-electric border-electric/30 bg-electric/5' : 'text-red-400 border-red-500/30 bg-red-500/5' },
                        ].map(card => (
                            <div key={card.label} className={`border rounded-2xl p-4 ${card.color}`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                    {card.icon}
                                    <span className="text-xs font-bold uppercase tracking-wide">{card.label}</span>
                                </div>
                                <div className="font-syne text-xl font-bold">{fmt(card.value)}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Desglose por método de pago ─────────────────────── */}
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-clinical/40 uppercase tracking-wide mb-3">Ingresos por método de pago</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {(Object.entries(totals.byMetodo) as [MetodoPago, number][]).map(([metodo, monto]) => (
                                <div key={metodo} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${monto > 0 ? 'border-white/15 bg-white/5' : 'border-white/5 opacity-30'}`}>
                                    <span className="text-clinical/50">{METODO_ICONS[metodo]}</span>
                                    <span className="text-[11px] text-clinical/40 font-bold">{METODO_LABELS[metodo]}</span>
                                    <span className={`text-sm font-bold ${monto > 0 ? 'text-white' : 'text-clinical/30'}`}>{fmt(monto)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Efectivo esperado ───────────────────────────────── */}
                    <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4">
                        <div>
                            <p className="text-xs text-amber-400/70 font-bold uppercase">Efectivo esperado en caja</p>
                            <p className="font-syne text-2xl font-bold text-amber-400">{fmt(totals.efectivoEsperado)}</p>
                            <p className="text-[11px] text-clinical/30 mt-0.5">Apertura {fmt(caja.apertura)} + cobros efectivo − egresos/retiros</p>
                        </div>
                        {caja.cierre && (
                            <div className="text-right">
                                <p className="text-xs text-clinical/40 font-bold uppercase">Contado al cierre</p>
                                <p className={`font-syne text-2xl font-bold ${caja.cierre.diferencia === 0 ? 'text-emerald-400' : caja.cierre.diferencia > 0 ? 'text-electric' : 'text-red-400'}`}>
                                    {fmt(caja.cierre.efectivoContado)}
                                </p>
                                <p className={`text-xs font-bold mt-0.5 ${caja.cierre.diferencia === 0 ? 'text-emerald-400' : caja.cierre.diferencia > 0 ? 'text-electric' : 'text-red-400'}`}>
                                    {caja.cierre.diferencia > 0 ? '+' : ''}{fmt(caja.cierre.diferencia)} diferencia
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Movimientos del día ─────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-syne text-sm font-bold text-white/70 uppercase tracking-wide flex items-center gap-2">
                                <Receipt className="w-4 h-4" /> Movimientos del día
                                <span className="text-clinical/30 font-normal normal-case">({caja.movimientos.length})</span>
                            </h3>
                            {caja.status === 'open' && (
                                <button
                                    type="button"
                                    onClick={() => setShowMovModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-electric/10 border border-electric/30 text-electric hover:bg-electric/15 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Agregar
                                </button>
                            )}
                        </div>

                        {caja.movimientos.length === 0 ? (
                            <div className="text-center py-8 text-clinical/25 text-sm">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                Sin movimientos aún
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visibleMovs.map(mov => (
                                    <motion.div
                                        key={mov.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            mov.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' :
                                            mov.tipo === 'egreso'  ? 'bg-red-500/10 text-red-400' :
                                            'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {mov.tipo === 'ingreso' ? <TrendingUp className="w-4 h-4" /> :
                                             mov.tipo === 'egreso'  ? <TrendingDown className="w-4 h-4" /> :
                                             <Minus className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm text-white font-bold truncate">{mov.concepto}</p>
                                                <TipoChip tipo={mov.tipo} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-clinical/35">{mov.time}</span>
                                                <MetodoBadge metodo={mov.metodoPago} />
                                                {mov.patientName && (
                                                    <span className="text-[11px] text-electric/50">· {mov.patientName}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold flex-shrink-0 ${
                                            mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {mov.tipo === 'ingreso' ? '+' : '-'}{fmt(mov.monto)}
                                        </div>
                                    </motion.div>
                                ))}
                                {sortedMovs.length > 6 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllMovs(v => !v)}
                                        className="w-full text-xs text-clinical/35 hover:text-clinical/60 flex items-center justify-center gap-1 py-2 transition-colors"
                                    >
                                        {showAllMovs
                                            ? <><ChevronUp className="w-3 h-3" /> Ver menos</>
                                            : <><ChevronDown className="w-3 h-3" /> Ver {sortedMovs.length - 6} más</>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Historial de cajas ─────────────────────────────────────── */}
            {historial.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowHistorial(v => !v)}
                        className="flex items-center gap-2 text-sm text-clinical/40 hover:text-clinical/70 transition-colors font-bold mb-3"
                    >
                        {showHistorial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Historial de cortes ({historial.length})
                    </button>
                    <AnimatePresence>
                        {showHistorial && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                {historial.slice(0, 10).map(h => {
                                    const t = calcTotals(h);
                                    return (
                                        <div key={h.id} className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
                                            <div>
                                                <p className="text-sm text-white font-bold capitalize">{fmtDate(h.date)}</p>
                                                <p className="text-xs text-clinical/35">
                                                    {h.movimientos.length} mov. · Apertura {fmt(h.apertura)}
                                                    {h.cierre ? ` · Dif. ${h.cierre.diferencia >= 0 ? '+' : ''}${fmt(h.cierre.diferencia)}` : ' · Sin cerrar'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-electric">{fmt(t.ingresos)}</p>
                                                <p className="text-[11px] text-clinical/35">ingresos</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ════ MODAL APERTURA ════ */}
            <AnimatePresence>
                {showApertura && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowApertura(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-sm p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-syne text-xl font-bold text-white">Apertura de Caja</h3>
                                <button type="button" title="Cerrar" onClick={() => setShowApertura(false)} className="text-clinical/40 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAbrirCaja} className="space-y-4">
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">
                                        Efectivo inicial en caja (MXN)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-clinical/40 font-bold">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={aperturaAmt}
                                            onChange={e => setAperturaAmt(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg focus:border-electric outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[11px] text-clinical/30 mt-1">Puede ser 0 si no hay fondo de caja inicial.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingApertura}
                                    className="w-full py-4 rounded-2xl bg-premium text-cobalt font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    {savingApertura ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Unlock className="w-5 h-5" /> Abrir Caja</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════ MODAL MOVIMIENTO ════ */}
            <AnimatePresence>
                {showMovModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowMovModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-syne text-xl font-bold text-white">Nuevo Movimiento</h3>
                                <button type="button" title="Cerrar" onClick={() => setShowMovModal(false)} className="text-clinical/40 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddMov} className="space-y-4">
                                {/* Tipo */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-2 block">Tipo</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['ingreso', 'egreso', 'retiro'] as CajaMovimiento['tipo'][]).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setMovTipo(t)}
                                                className={`py-2.5 rounded-xl border text-sm font-bold capitalize transition-all ${
                                                    movTipo === t
                                                        ? t === 'ingreso' ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                                                          : t === 'egreso' ? 'border-red-500/60 bg-red-500/10 text-red-400'
                                                          : 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                                                        : 'border-white/10 text-clinical/40 hover:border-white/20'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Concepto */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Concepto</label>
                                    <input
                                        type="text"
                                        value={movConcepto}
                                        onChange={e => setMovConcepto(e.target.value)}
                                        placeholder={movTipo === 'ingreso' ? 'Cobro de servicio…' : movTipo === 'egreso' ? 'Material dental, renta…' : 'Retiro a cuenta bancaria…'}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-electric outline-none transition-colors"
                                    />
                                </div>
                                {/* Método */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-2 block">Método de pago</label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {(Object.keys(METODO_LABELS) as MetodoPago[]).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setMovMetodo(m)}
                                                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-bold transition-all ${
                                                    movMetodo === m
                                                        ? 'border-electric/60 bg-electric/10 text-electric'
                                                        : 'border-white/10 text-clinical/40 hover:border-white/20'
                                                }`}
                                            >
                                                {METODO_ICONS[m]}
                                                <span className="leading-tight text-center">{METODO_LABELS[m]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Monto */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Monto (MXN)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-clinical/40 font-bold">$</span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            step="0.01"
                                            value={movMonto}
                                            onChange={e => setMovMonto(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg focus:border-electric outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingMov}
                                    className="w-full py-3.5 rounded-2xl bg-electric text-cobalt font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    {savingMov ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Registrar Movimiento</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════ MODAL CIERRE ════ */}
            <AnimatePresence>
                {showCierre && caja && totals && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowCierre(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-sm p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-syne text-xl font-bold text-white">Cierre de Caja</h3>
                                <button type="button" title="Cerrar" onClick={() => setShowCierre(false)} className="text-clinical/40 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Summary */}
                            <div className="bg-white/5 rounded-2xl p-4 mb-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-clinical/50">Ingresos del día</span>
                                    <span className="text-emerald-400 font-bold">{fmt(totals.ingresos)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-clinical/50">Egresos</span>
                                    <span className="text-red-400 font-bold">-{fmt(totals.egresos)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-clinical/50">Retiros</span>
                                    <span className="text-amber-400 font-bold">-{fmt(totals.retiros)}</span>
                                </div>
                                <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                                    <span className="text-white">Efectivo esperado</span>
                                    <span className="text-amber-400">{fmt(totals.efectivoEsperado)}</span>
                                </div>
                            </div>
                            <form onSubmit={handleCerrarCaja} className="space-y-4">
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">
                                        Efectivo contado físicamente ($)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-clinical/40 font-bold">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={cierreEfectivo}
                                            onChange={e => setCierreEfectivo(e.target.value)}
                                            placeholder={String(totals.efectivoEsperado)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg focus:border-electric outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    {cierreEfectivo && (
                                        <p className={`text-xs font-bold mt-1 ${
                                            Number(cierreEfectivo) - totals.efectivoEsperado === 0 ? 'text-emerald-400' :
                                            Number(cierreEfectivo) - totals.efectivoEsperado > 0 ? 'text-electric' : 'text-red-400'
                                        }`}>
                                            Diferencia: {Number(cierreEfectivo) - totals.efectivoEsperado >= 0 ? '+' : ''}{fmt(Number(cierreEfectivo) - totals.efectivoEsperado)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Notas del cierre</label>
                                    <textarea
                                        value={cierreNotas}
                                        onChange={e => setCierreNotas(e.target.value)}
                                        placeholder="Observaciones, diferencias, incidencias…"
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-electric outline-none transition-colors resize-none"
                                    />
                                </div>
                                <div className="flex items-start gap-2 text-xs text-amber-400/70 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Esta acción cierra la caja del día. No se podrán agregar más movimientos.</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingCierre}
                                    className="w-full py-3.5 rounded-2xl bg-red-500/80 text-white font-black flex items-center justify-center gap-2 hover:bg-red-500/90 transition-colors"
                                >
                                    {savingCierre ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Confirmar Cierre</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
