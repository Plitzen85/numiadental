import React, { useState, useMemo } from 'react';
import {
    DollarSign, Plus, CreditCard, Banknote, ArrowDownToLine,
    Bitcoin, CheckCircle2, Clock, ChevronDown, ChevronUp,
    Receipt, Wallet, TrendingUp, AlertCircle, X, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarket } from '../../context/MarketContext';
import { addTransaction, AccountType } from '../../lib/financeApi';
import {
    PatientPayment, MetodoPago, TreatmentPlan,
} from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientFinanzasProps {
    patientId?: string;
    patientName: string;
    treatmentPlan: TreatmentPlan;
    payments: PatientPayment[];
    onSavePayment: (payment: PatientPayment) => Promise<void>;
}

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

const CUENTA_BY_METODO: Record<MetodoPago, AccountType> = {
    efectivo:        'efectivo',
    tarjeta_credito: 'bbva',
    tarjeta_debito:  'banorte',
    transferencia:   'bbva',
    cripto:          'cripto',
};

const CRYPTO_TYPES = ['USDT', 'BTC', 'ETH', 'MXN (Bitso)'];

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

const genReceipt = () => `REC-${Date.now().toString(36).toUpperCase()}`;

// ─── Component ────────────────────────────────────────────────────────────────

export const PatientFinanzas: React.FC<PatientFinanzasProps> = ({
    patientName,
    treatmentPlan,
    payments,
    onSavePayment,
}) => {
    const { currentUserId, clinicProfile } = useMarket();
    const currentStaff = clinicProfile?.staff?.find(s => s.id === currentUserId);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    // ── Form state ───────────────────────────────────────────────────────────
    const [monto, setMonto] = useState('');
    const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
    const [cryptoType, setCryptoType] = useState('USDT');
    const [concepto, setConcepto] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    // ── Expand history ───────────────────────────────────────────────────────
    const [showAll, setShowAll] = useState(false);

    // ── Computed balances ────────────────────────────────────────────────────
    const activeItems = useMemo(
        () => treatmentPlan.items.filter(i => i.status !== 'cancelled'),
        [treatmentPlan.items]
    );

    const totalPlan = useMemo(
        () => activeItems.reduce((sum, i) => sum + (i.price - i.discount), 0),
        [activeItems]
    );

    const totalPagado = useMemo(
        () => payments.reduce((sum, p) => sum + p.monto, 0),
        [payments]
    );

    const totalPendiente = totalPlan - totalPagado;
    const pctPagado = totalPlan > 0 ? Math.min(100, (totalPagado / totalPlan) * 100) : 0;

    // Items amount covered by payments
    const coveredItemIds = useMemo(() => {
        const ids = new Set<string>();
        payments.forEach(p => p.treatmentItemIds.forEach(id => ids.add(id)));
        return ids;
    }, [payments]);

    // Auto-fill concepto when items change
    const autoConcepto = (ids: string[]) => {
        const names = activeItems.filter(i => ids.includes(i.id)).map(i => i.name);
        return names.length ? names.join(', ') : `Pago — ${patientName}`;
    };

    const handleToggleItem = (id: string) => {
        const next = selectedItems.includes(id)
            ? selectedItems.filter(x => x !== id)
            : [...selectedItems, id];
        setSelectedItems(next);
        if (!concepto || concepto === autoConcepto(selectedItems)) {
            setConcepto(autoConcepto(next));
        }
    };

    // Quick-fill: total pendiente
    const fillPendiente = () => {
        const pending = activeItems
            .filter(i => !coveredItemIds.has(i.id))
            .map(i => i.id);
        setSelectedItems(pending);
        setMonto(String(Math.max(0, totalPendiente)));
        setConcepto(autoConcepto(pending));
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!monto || Number(monto) <= 0) return;
        setSaving(true);

        const isCripto = metodo === 'cripto';
        const rawMonto = Number(monto);
        const feeRate = isCripto && !cryptoType.startsWith('MXN') ? 0.015 : 0;
        const montoNeto = rawMonto * (1 - feeRate);

        const payment: PatientPayment = {
            id: `pay-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            monto: montoNeto,
            metodoPago: metodo,
            cryptoType: isCripto ? cryptoType : undefined,
            cuentaDestino: CUENTA_BY_METODO[metodo],
            concepto: concepto || `Pago — ${patientName}`,
            treatmentItemIds: selectedItems,
            receivedById: currentUserId,
            receivedByName: currentStaff?.nombres ?? 'Staff',
            notes: notes || undefined,
            receiptNumber: genReceipt(),
        };

        // Persist to patient record
        await onSavePayment(payment);

        // Also update global finance (caja / finanzas page)
        await addTransaction(
            'ingreso',
            CUENTA_BY_METODO[metodo],
            `${payment.concepto} · ${patientName}`,
            rawMonto,
            isCripto ? cryptoType : undefined,
        );

        setSaving(false);
        setSavedMsg(`Cobro de ${fmt(montoNeto)} registrado ✓`);
        setTimeout(() => setSavedMsg(''), 3500);
        setShowModal(false);
        setMonto('');
        setConcepto('');
        setSelectedItems([]);
        setNotes('');
        setMetodo('efectivo');
    };

    // ── History list ─────────────────────────────────────────────────────────
    const sortedPayments = [...payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const visiblePayments = showAll ? sortedPayments : sortedPayments.slice(0, 4);

    // ── Item balance breakdown ───────────────────────────────────────────────
    const itemsPendientes = activeItems.filter(i => !coveredItemIds.has(i.id) && i.status !== 'paid');

    return (
        <div className="p-6 overflow-y-auto h-full animate-in fade-in duration-300">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* ── Toast ──────────────────────────────────────────────── */}
                <AnimatePresence>
                    {savedMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold"
                        >
                            <CheckCircle2 className="w-4 h-4" /> {savedMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Balance Cards ───────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total del Plan', value: totalPlan, icon: <TrendingUp className="w-5 h-5" />, color: 'text-electric border-electric/30 bg-electric/5' },
                        { label: 'Pagado', value: totalPagado, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                        { label: 'Pendiente', value: totalPendiente, icon: <Clock className="w-5 h-5" />, color: totalPendiente > 0 ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-clinical/40 border-white/10 bg-white/3' },
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

                {/* ── Progress Bar ─────────────────────────────────────────── */}
                {totalPlan > 0 && (
                    <div>
                        <div className="flex justify-between text-xs text-clinical/50 mb-1">
                            <span>Progreso de pago</span>
                            <span>{pctPagado.toFixed(0)}% cubierto</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctPagado}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-electric to-emerald-400 rounded-full"
                            />
                        </div>
                    </div>
                )}

                {/* ── Cobrar Button ─────────────────────────────────────────── */}
                <button
                    type="button"
                    onClick={() => { setShowModal(true); fillPendiente(); }}
                    disabled={totalPendiente <= 0 && totalPlan > 0}
                    className="w-full py-4 rounded-2xl bg-premium text-cobalt font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(212,175,55,0.35)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    {totalPlan === 0 ? 'Registrar Pago' : totalPendiente <= 0 ? 'Plan Totalmente Pagado' : `Registrar Cobro — ${fmt(totalPendiente)} pendiente`}
                </button>

                {/* ── Pending items breakdown ──────────────────────────────── */}
                {itemsPendientes.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-3">
                            <AlertCircle className="w-4 h-4" /> Tratamientos pendientes de pago
                        </div>
                        <div className="space-y-2">
                            {itemsPendientes.map(item => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="text-clinical/70">
                                        {item.toothNumber ? `D${item.toothNumber} · ` : ''}{item.name}
                                    </span>
                                    <span className="text-amber-400 font-bold">{fmt(item.price - item.discount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Payment History ──────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-syne text-sm font-bold text-white/70 uppercase tracking-wide flex items-center gap-2">
                            <Receipt className="w-4 h-4" /> Historial de Cobros
                        </h4>
                        <span className="text-xs text-clinical/40">{payments.length} registro{payments.length !== 1 ? 's' : ''}</span>
                    </div>

                    {sortedPayments.length === 0 ? (
                        <div className="text-center py-10 text-clinical/30 text-sm">
                            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            Sin cobros registrados
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visiblePayments.map(payment => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                        {METODO_ICONS[payment.metodoPago]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-bold truncate">{payment.concepto}</p>
                                        <p className="text-xs text-clinical/40">
                                            {fmtDate(payment.date)} · {METODO_LABELS[payment.metodoPago]}
                                            {payment.cryptoType ? ` (${payment.cryptoType})` : ''}
                                            {payment.receivedByName ? ` · Recibió: ${payment.receivedByName}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-emerald-400 font-bold text-sm">{fmt(payment.monto)}</p>
                                        {payment.receiptNumber && (
                                            <p className="text-[10px] text-clinical/30">{payment.receiptNumber}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {sortedPayments.length > 4 && (
                        <button
                            type="button"
                            onClick={() => setShowAll(v => !v)}
                            className="w-full mt-2 text-xs text-clinical/40 hover:text-clinical/70 flex items-center justify-center gap-1 py-2 transition-colors"
                        >
                            {showAll ? <><ChevronUp className="w-3 h-3" /> Ver menos</> : <><ChevronDown className="w-3 h-3" /> Ver los {sortedPayments.length - 4} anteriores</>}
                        </button>
                    )}
                </div>
            </div>

            {/* ════════════════════ MODAL COBRO ════════════════════ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-syne text-xl font-bold text-white">Registrar Cobro</h3>
                                    <p className="text-xs text-clinical/40 mt-0.5">{patientName}</p>
                                </div>
                                <button
                                    type="button"
                                    title="Cerrar"
                                    onClick={() => setShowModal(false)}
                                    className="text-clinical/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                                {/* Treatment items selector */}
                                {activeItems.length > 0 && (
                                    <div>
                                        <label className="text-xs text-clinical/50 font-bold uppercase mb-2 block">
                                            Tratamientos que cubre este cobro
                                        </label>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {activeItems.map(item => (
                                                <label
                                                    key={item.id}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                                        selectedItems.includes(item.id)
                                                            ? 'border-electric/60 bg-electric/5 text-white'
                                                            : 'border-white/10 bg-white/3 text-clinical/60 hover:border-white/20'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="accent-yellow-400"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => handleToggleItem(item.id)}
                                                    />
                                                    <span className="flex-1 text-sm truncate">
                                                        {item.toothNumber ? `D${item.toothNumber} · ` : ''}{item.name}
                                                    </span>
                                                    <span className="text-xs font-bold text-electric flex-shrink-0">
                                                        {fmt(item.price - item.discount)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Concepto */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Concepto</label>
                                    <input
                                        type="text"
                                        value={concepto}
                                        onChange={e => setConcepto(e.target.value)}
                                        placeholder={`Pago — ${patientName}`}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-electric outline-none transition-colors"
                                    />
                                </div>

                                {/* Método de pago */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-2 block">Método de Pago</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {(Object.keys(METODO_LABELS) as MetodoPago[]).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setMetodo(m)}
                                                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                    metodo === m
                                                        ? 'border-electric bg-electric/10 text-electric'
                                                        : 'border-white/10 text-clinical/40 hover:border-white/20'
                                                }`}
                                            >
                                                {METODO_ICONS[m]}
                                                <span className="leading-tight text-center">{METODO_LABELS[m]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cripto type */}
                                {metodo === 'cripto' && (
                                    <div>
                                        <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Red / Token</label>
                                        <select
                                            title="Red / Token cripto"
                                            value={cryptoType}
                                            onChange={e => setCryptoType(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-electric transition-colors"
                                        >
                                            {CRYPTO_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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
                                            value={monto}
                                            onChange={e => setMonto(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg focus:border-electric outline-none transition-colors"
                                        />
                                    </div>
                                    {metodo === 'cripto' && monto && !cryptoType.startsWith('MXN') && (
                                        <p className="text-[11px] text-amber-400/70 mt-1">
                                            Neto tras comisión 1.5%: {fmt(Number(monto) * 0.985)}
                                        </p>
                                    )}
                                    {totalPendiente > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setMonto(String(totalPendiente))}
                                            className="text-[11px] text-electric/70 hover:text-electric mt-1 transition-colors"
                                        >
                                            Completar saldo: {fmt(totalPendiente)}
                                        </button>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-xs text-clinical/50 font-bold uppercase mb-1 block">Notas (opcional)</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Ej: Primera parcialidad, referencia de transferencia…"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-electric outline-none transition-colors"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 rounded-2xl bg-premium text-cobalt font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
                                >
                                    {saving
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <><DollarSign className="w-5 h-5" /> Confirmar Cobro</>
                                    }
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
