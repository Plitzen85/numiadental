import React, { useState, useMemo } from 'react';
import {
    DollarSign, Plus, CreditCard, Banknote, ArrowDownToLine,
    Bitcoin, CheckCircle2, Clock, ChevronDown, ChevronUp,
    Receipt, Wallet, TrendingUp, AlertCircle, X, Loader2,
    Lock, ChevronRight, FileText, Printer, Gift, Minus, Trash2,
} from 'lucide-react';
import { printPaymentReceipt } from '../../utils/patientPrint';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarket } from '../../context/MarketContext';
import { addTransaction, AccountType } from '../../lib/financeApi';
import { addMovimiento } from '../../lib/cajaApi';
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
    onDeletePayment?: (paymentId: string) => Promise<void>;
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
    patientId,
    patientName,
    treatmentPlan,
    payments,
    onSavePayment,
    onDeletePayment,
}) => {
    const { currentUserId, clinicProfile, patients, setPatients } = useMarket();
    const currentStaff = clinicProfile?.staff?.find(s => s.id === currentUserId);
    const currentPatient = patients.find(p => p.id === patientId);
    const saldo = currentPatient?.saldo ?? 0;

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
    const [selectedPayment, setSelectedPayment] = useState<PatientPayment | null>(null);

    // ── Saldo / crédito ──────────────────────────────────────────────────────
    const [showSaldoModal, setShowSaldoModal] = useState(false);
    const [saldoAjuste, setSaldoAjuste] = useState('');
    const [saldoTipo, setSaldoTipo] = useState<'abonar' | 'cargo'>('abonar');
    const [aplicarSaldo, setAplicarSaldo] = useState(false);

    const updateSaldo = (nuevoSaldo: number) => {
        if (!patientId) return;
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, saldo: nuevoSaldo } : p));
    };

    const handleSaldoAjuste = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(saldoAjuste);
        if (!amt || amt <= 0) return;
        const delta = saldoTipo === 'abonar' ? amt : -amt;
        updateSaldo(saldo + delta);
        setSaldoAjuste('');
        setShowSaldoModal(false);
    };

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

    // Si se borraron ítems, los pagos excedentes no se vuelven "deuda negativa"
    const totalPendiente = Math.max(0, totalPlan - totalPagado);
    // Excedente: pagos que superan el valor actual del plan (ítems borrados)
    const excedente = totalPagado > totalPlan ? totalPagado - totalPlan : 0;
    const pctPagado = totalPlan > 0 ? Math.min(100, (totalPagado / totalPlan) * 100) : 100;

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
        // Apply credit: reduce what patient pays today and subtract from saldo
        const saldoAplicado = aplicarSaldo && saldo > 0 ? Math.min(saldo, rawMonto) : 0;
        const montoNeto = (rawMonto - saldoAplicado) * (1 - feeRate);

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

        // Deduct applied credit from patient saldo
        if (saldoAplicado > 0) updateSaldo(saldo - saldoAplicado);

        // Sync to Caja del Día (if open)
        addMovimiento({
            tipo: 'ingreso',
            monto: montoNeto,
            concepto: `${payment.concepto} · ${patientName}`,
            metodoPago: metodo,
            patientId: payment.receivedById,
            patientName,
            paymentId: payment.id,
            operadorId: currentUserId,
            operadorName: currentStaff?.nombres ?? 'Staff',
        });

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
        setAplicarSaldo(false);
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

                {/* ── Saldo a favor ────────────────────────────────────────── */}
                {patientId && (
                    <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                        saldo > 0
                            ? 'bg-emerald-500/8 border-emerald-500/25'
                            : saldo < 0
                            ? 'bg-red-500/8 border-red-500/25'
                            : 'bg-white/3 border-white/10'
                    }`}>
                        <div className="flex items-center gap-3">
                            <Gift className={`w-4 h-4 ${saldo > 0 ? 'text-emerald-400' : saldo < 0 ? 'text-red-400' : 'text-clinical/30'}`} />
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${saldo > 0 ? 'text-emerald-400/70' : saldo < 0 ? 'text-red-400/70' : 'text-clinical/30'}`}>
                                    {saldo > 0 ? 'Saldo a favor' : saldo < 0 ? 'Saldo deudor' : 'Sin saldo'}
                                </p>
                                <p className={`font-syne text-lg font-bold ${saldo > 0 ? 'text-emerald-400' : saldo < 0 ? 'text-red-400' : 'text-clinical/40'}`}>
                                    {saldo > 0 ? '+' : ''}{fmt(saldo)}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSaldoModal(true)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/15 text-clinical/50 hover:text-white hover:border-white/30 transition-colors flex items-center gap-1.5"
                        >
                            <DollarSign className="w-3.5 h-3.5" /> Ajustar
                        </button>
                    </div>
                )}

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

                {/* ── Aviso excedente (ítems borrados del plan) ────────────── */}
                {excedente > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-electric/25 bg-electric/5 text-sm">
                        <AlertCircle className="w-4 h-4 text-electric shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold text-white text-xs uppercase tracking-wide mb-0.5">Pagos exceden el plan actual</p>
                            <p className="text-clinical/60 text-xs">
                                Los cobros registrados ({fmt(totalPagado)}) superan el valor del plan actual ({fmt(totalPlan)}).
                                El excedente de <span className="text-electric font-bold">{fmt(excedente)}</span> puede registrarse como saldo a favor del paciente.
                            </p>
                        </div>
                        {patientId && (
                            <button
                                type="button"
                                onClick={() => { setSaldoTipo('abonar'); setSaldoAjuste(String(excedente)); setShowSaldoModal(true); }}
                                className="shrink-0 text-[11px] font-bold text-electric border border-electric/30 rounded-lg px-2.5 py-1.5 hover:bg-electric/10 transition-colors"
                            >
                                Abonar saldo
                            </button>
                        )}
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
                                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment(selectedPayment?.id === payment.id ? null : payment)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                            {METODO_ICONS[payment.metodoPago]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-bold truncate">{payment.concepto}</p>
                                            <p className="text-xs text-clinical/40">
                                                {fmtDate(payment.date)} · {METODO_LABELS[payment.metodoPago]}
                                                {payment.cryptoType ? ` (${payment.cryptoType})` : ''}
                                                {payment.notes && <span className="text-electric/50"> · 📝 Nota</span>}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                                            <div>
                                                <p className="text-emerald-400 font-bold text-sm">{fmt(payment.monto)}</p>
                                                {payment.receiptNumber && (
                                                    <p className="text-[10px] text-clinical/30">{payment.receiptNumber}</p>
                                                )}
                                            </div>
                                            <ChevronRight className={`w-3.5 h-3.5 text-clinical/30 transition-transform ${selectedPayment?.id === payment.id ? 'rotate-90' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Expanded detail row */}
                                    <AnimatePresence>
                                        {selectedPayment?.id === payment.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-3 pt-0 border-t border-white/10 space-y-2">
                                                    <div className="flex flex-wrap gap-3 text-xs text-clinical/50 pt-2">
                                                        <span>Recibió: <span className="text-white">{payment.receivedByName}</span></span>
                                                        <span>Cuenta: <span className="text-white">{payment.cuentaDestino}</span></span>
                                                        {payment.treatmentItemIds.length > 0 && (
                                                            <span>Tratamientos: <span className="text-electric">{payment.treatmentItemIds.length}</span></span>
                                                        )}
                                                    </div>
                                                    {payment.notes && (
                                                        <div className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2">
                                                            <FileText className="w-3.5 h-3.5 text-electric/60 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs text-clinical/70 leading-relaxed">{payment.notes}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => printPaymentReceipt(patientName, payment)}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-electric border border-electric/30 rounded-lg px-3 py-1.5 hover:bg-electric/10 transition-colors"
                                                        >
                                                            <Printer className="w-3 h-3" /> Imprimir Comprobante
                                                        </button>
                                                        {onDeletePayment && (
                                                            <button
                                                                type="button"
                                                                title="Eliminar pago"
                                                                onClick={async () => {
                                                                    if (!confirm(`¿Eliminar el cobro "${payment.concepto}" de ${fmt(payment.monto)}? Esta acción no se puede deshacer.`)) return;
                                                                    await onDeletePayment(payment.id);
                                                                    setSelectedPayment(null);
                                                                }}
                                                                className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" /> Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                            {activeItems.map(item => {
                                                const alreadyCovered = coveredItemIds.has(item.id);
                                                return (
                                                    <label
                                                        key={item.id}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                                                            alreadyCovered
                                                                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60 cursor-not-allowed opacity-70'
                                                                : selectedItems.includes(item.id)
                                                                    ? 'border-electric/60 bg-electric/5 text-white cursor-pointer'
                                                                    : 'border-white/10 bg-white/3 text-clinical/60 hover:border-white/20 cursor-pointer'
                                                        }`}
                                                    >
                                                        {alreadyCovered
                                                            ? <Lock className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                                                            : <input
                                                                type="checkbox"
                                                                className="accent-yellow-400"
                                                                checked={selectedItems.includes(item.id)}
                                                                onChange={() => handleToggleItem(item.id)}
                                                                disabled={alreadyCovered}
                                                            />
                                                        }
                                                        <span className="flex-1 text-sm truncate">
                                                            {item.toothNumber ? `D${item.toothNumber} · ` : ''}{item.name}
                                                        </span>
                                                        <span className={`text-xs font-bold flex-shrink-0 ${alreadyCovered ? 'text-emerald-400/60 line-through' : 'text-electric'}`}>
                                                            {alreadyCovered ? 'Pagado' : fmt(item.price - item.discount)}
                                                        </span>
                                                    </label>
                                                );
                                            })}
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

                                {/* Apply credit */}
                                {saldo > 0 && (
                                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 cursor-pointer hover:bg-emerald-500/12 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="accent-yellow-400"
                                            checked={aplicarSaldo}
                                            onChange={e => setAplicarSaldo(e.target.checked)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-emerald-400">Aplicar saldo a favor</p>
                                            <p className="text-xs text-clinical/40">
                                                Disponible: {fmt(saldo)} — se descontará del cobro
                                            </p>
                                        </div>
                                        <Gift className="w-4 h-4 text-emerald-400/60 flex-shrink-0" />
                                    </label>
                                )}

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

            {/* ════════ MODAL AJUSTE DE SALDO ════════ */}
            <AnimatePresence>
                {showSaldoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowSaldoModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-syne text-lg font-bold text-white">Ajustar Saldo</h3>
                                    <p className="text-xs text-clinical/40 mt-0.5">Actual: {fmt(saldo)}</p>
                                </div>
                                <button type="button" title="Cerrar" onClick={() => setShowSaldoModal(false)} className="text-clinical/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSaldoAjuste} className="p-5 space-y-4">
                                {/* Tipo */}
                                <div className="flex gap-2">
                                    {(['abonar', 'cargo'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setSaldoTipo(t)}
                                            className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${
                                                saldoTipo === t
                                                    ? t === 'abonar'
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                        : 'bg-red-500/20 border-red-500/40 text-red-400'
                                                    : 'border-white/10 text-clinical/40 hover:border-white/20'
                                            }`}
                                        >
                                            {t === 'abonar' ? <><Plus className="w-4 h-4" /> Abonar</> : <><Minus className="w-4 h-4" /> Cargo</>}
                                        </button>
                                    ))}
                                </div>
                                {/* Monto */}
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-clinical/40 font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={saldoAjuste}
                                        onChange={e => setSaldoAjuste(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg focus:border-electric outline-none transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-clinical/35">
                                    Nuevo saldo: <span className="text-white font-bold">
                                        {fmt(saldo + (saldoTipo === 'abonar' ? Number(saldoAjuste) || 0 : -(Number(saldoAjuste) || 0)))}
                                    </span>
                                </p>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-2xl bg-premium text-cobalt font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <Gift className="w-4 h-4" /> Guardar Ajuste
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
