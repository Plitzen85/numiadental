import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Clock, XCircle, AlertCircle, Loader2, DollarSign, ChevronDown, ChevronRight, Printer, CalendarClock } from 'lucide-react';
import { TreatmentPlan, TreatmentPlanItem, TreatmentStatus } from '../../lib/supabase';
import { useMarket, StaffMember, isDoctor, Patient } from '../../context/MarketContext';
import { printTreatmentPlan } from '../../utils/patientPrint';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TreatmentStatus, {
    label: string; color: string; bg: string; border: string; icon: React.ReactNode;
}> = {
    pending:     { label: 'Pendiente',   color: 'text-yellow-400',  bg: 'bg-yellow-500/10',   border: 'border-yellow-500/30',  icon: <Clock        className="w-3.5 h-3.5" /> },
    in_progress: { label: 'En Proceso',  color: 'text-blue-400',    bg: 'bg-blue-500/10',     border: 'border-blue-500/30',    icon: <AlertCircle  className="w-3.5 h-3.5" /> },
    completed:   { label: 'Completado',  color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30', icon: <Check        className="w-3.5 h-3.5" /> },
    paid:        { label: 'Pagado',      color: 'text-teal-300',    bg: 'bg-teal-500/10',     border: 'border-teal-500/30',    icon: <DollarSign   className="w-3.5 h-3.5" /> },
    cancelled:   { label: 'Cancelado',   color: 'text-gray-500',    bg: 'bg-gray-500/10',     border: 'border-gray-500/30',    icon: <XCircle      className="w-3.5 h-3.5" /> },
};

// Logical next-step transitions per status (what buttons to show on the card)
const NEXT_STATUSES: Record<TreatmentStatus, TreatmentStatus[]> = {
    pending:     ['in_progress', 'cancelled'],
    in_progress: ['completed', 'pending', 'cancelled'],
    completed:   ['paid', 'in_progress'],
    paid:        [],                               // final — no further movement
    cancelled:   ['pending'],                      // reactivate only
};

// Pipeline columns (cancelled is shown separately below)
const PIPELINE_STATUSES: TreatmentStatus[] = ['pending', 'in_progress', 'completed', 'paid'];

const blankItem = (): Partial<TreatmentPlanItem> => ({
    name: '', phase: 1, status: 'pending', price: 0, discount: 0, notes: '', doctorName: '',
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface TreatmentPipelineProps {
    plan: TreatmentPlan;
    onSave: (plan: TreatmentPlan) => Promise<void>;
    patient?: Patient;
    clinicName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const TreatmentPipeline: React.FC<TreatmentPipelineProps> = ({ plan, onSave, patient, clinicName = 'Nümia Dental' }) => {
    const { clinicProfile } = useMarket();
    const doctors: StaffMember[] = (clinicProfile?.staff ?? []).filter(isDoctor);

    const [editingItem, setEditingItem]       = useState<Partial<TreatmentPlanItem> | null>(null);
    const [planNotes, setPlanNotes]           = useState(plan.notes);
    const [isSaving, setIsSaving]             = useState(false);
    const [showCancelled, setShowCancelled]   = useState(false);

    // Optimistic local items — UI updates immediately, backend saves async
    const [localItems, setLocalItems] = useState<TreatmentPlanItem[]>(plan.items);

    // Sync when parent loads a new plan (different patient / initial load)
    const prevPlanRef = React.useRef(plan.items);
    React.useEffect(() => {
        if (prevPlanRef.current !== plan.items) {
            prevPlanRef.current = plan.items;
            setLocalItems(plan.items);
        }
    }, [plan.items]);

    const savePlan = (items: TreatmentPlanItem[], notes = planNotes) => {
        // Update UI immediately
        setLocalItems(items);
        // Preserve existing createdAt, or stamp it on first save
        const createdAt = plan.createdAt ?? new Date().toISOString();
        // Persist in background (no await — don't block UI)
        setIsSaving(true);
        onSave({ items, notes, updatedAt: new Date().toISOString(), createdAt })
            .finally(() => setIsSaving(false));
    };

    const updateStatus = (id: string, status: TreatmentStatus) => {
        const updated = localItems.map(item =>
            item.id === id
                ? { ...item, status, ...(status === 'completed' || status === 'paid' ? { completedDate: new Date().toISOString() } : {}) }
                : item
        );
        savePlan(updated);
    };

    const deleteItem = (id: string) => {
        savePlan(localItems.filter(i => i.id !== id));
    };

    const saveItem = () => {
        if (!editingItem?.name?.trim()) return;
        let updated: TreatmentPlanItem[];
        if (editingItem.id) {
            updated = localItems.map(i => i.id === editingItem.id ? { ...i, ...editingItem } as TreatmentPlanItem : i);
        } else {
            const newItem: TreatmentPlanItem = {
                id: `tx-${Date.now()}`,
                name: editingItem.name!.trim(),
                code: editingItem.code ?? '',
                phase: editingItem.phase ?? 1,
                status: 'pending',
                price: editingItem.price ?? 0,
                discount: editingItem.discount ?? 0,
                toothNumber: editingItem.toothNumber,
                surface: editingItem.surface,
                notes: editingItem.notes ?? '',
                doctorName: editingItem.doctorName ?? '',
            };
            updated = [...localItems, newItem];
        }
        savePlan(updated);
        setEditingItem(null);
    };

    // ── Calculations ──────────────────────────────────────────────────────────
    const itemFinalPrice = (i: TreatmentPlanItem) => i.price - (i.price * (i.discount / 100));
    const activeItems    = localItems.filter(i => i.status !== 'cancelled');
    const totalPlan      = activeItems.reduce((s, i) => s + itemFinalPrice(i), 0);
    const totalPaid      = localItems.filter(i => i.status === 'paid').reduce((s, i) => s + itemFinalPrice(i), 0);
    const totalCompleted = localItems.filter(i => i.status === 'completed' || i.status === 'paid').reduce((s, i) => s + itemFinalPrice(i), 0);
    const totalAdeudo    = totalPlan - totalPaid;
    const progress       = totalPlan > 0 ? (totalCompleted / totalPlan) * 100 : 0;
    const cancelledItems = localItems.filter(i => i.status === 'cancelled');

    // Validity date helpers — use createdAt if available, otherwise today as reference
    const createdAtDate = new Date(plan.createdAt ?? new Date().toISOString());
    const validUntilDate = new Date(new Date(createdAtDate).setDate(createdAtDate.getDate() + 15));
    const fmtDate = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    const now = new Date();
    const daysLeft = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;
    const isExpiringSoon = !isExpired && daysLeft <= 3;

    return (
        <div className="space-y-5">

            {/* ── Validity + Print header ──────────────────────────────────── */}
            <div className={`flex items-center justify-between border rounded-xl px-4 py-2.5 ${isExpired ? 'bg-red-500/10 border-red-500/30' : isExpiringSoon ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/4 border-white/10'}`}>
                <div className="flex items-center gap-4 text-xs text-clinical/60">
                    <span className="flex items-center gap-1.5">
                        <CalendarClock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-400' : 'text-electric/60'}`} />
                        Emisión: <span className="text-clinical font-semibold">{fmtDate(createdAtDate)}</span>
                    </span>
                    <span className="text-white/20">|</span>
                    <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-amber-400/80'}`}>
                        Válido hasta: <span className="font-semibold">{fmtDate(validUntilDate)}</span>
                        {isExpired
                            ? <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">EXPIRADO</span>
                            : isExpiringSoon
                                ? <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Vence en {daysLeft}d</span>
                                : <span className="text-[9px] text-clinical/30">(15 días)</span>
                        }
                    </span>
                </div>
                {patient && (
                    <button
                        type="button"
                        onClick={() => printTreatmentPlan(patient, plan, clinicName)}
                        className="flex items-center gap-1.5 text-xs font-bold text-electric border border-electric/30 rounded-lg px-3 py-1.5 hover:bg-electric/10 transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" /> Imprimir Presupuesto
                    </button>
                )}
            </div>

            {/* ── Summary bar ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1">Total Plan</p>
                    <p className="font-syne text-xl font-bold text-white">${totalPlan.toLocaleString('es-MX')}</p>
                    <p className="text-[10px] text-clinical/40 mt-1">{activeItems.length} tratamientos</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-1">Realizados</p>
                    <p className="font-syne text-xl font-bold text-emerald-400">${totalCompleted.toLocaleString('es-MX')}</p>
                    <p className="text-[10px] text-emerald-400/60 mt-1">{localItems.filter(i => i.status === 'completed' || i.status === 'paid').length} completados</p>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-teal-400/70 uppercase tracking-widest mb-1">Cobrado</p>
                    <p className="font-syne text-xl font-bold text-teal-300">${totalPaid.toLocaleString('es-MX')}</p>
                    <p className="text-[10px] text-teal-400/60 mt-1">{localItems.filter(i => i.status === 'paid').length} pagados</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1">Adeudo</p>
                    <p className={`font-syne text-xl font-bold ${totalAdeudo > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        ${totalAdeudo.toLocaleString('es-MX')}
                    </p>
                    <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full bg-electric rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[9px] text-clinical/30 mt-1">{progress.toFixed(0)}% avance</p>
                </div>
            </div>

            {/* ── Add treatment button ─────────────────────────────────────── */}
            <button
                onClick={() => setEditingItem(blankItem())}
                className="w-full border border-dashed border-electric/30 rounded-xl py-3 text-electric text-sm font-bold hover:bg-electric/5 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Agregar Tratamiento al Plan
                {isSaving && <Loader2 className="w-3 h-3 animate-spin ml-2 text-clinical/40" />}
            </button>

            {/* ── Kanban pipeline (4 active columns) ───────────────────────── */}
            <div className="grid grid-cols-4 gap-3 min-h-[260px]">
                {PIPELINE_STATUSES.map(status => {
                    const cfg   = STATUS_CONFIG[status];
                    const items = localItems.filter(i => i.status === status);
                    const colTotal = items.reduce((s, i) => s + itemFinalPrice(i), 0);
                    return (
                        <div key={status} className={`border rounded-2xl p-3 ${cfg.bg} ${cfg.border}`}>
                            <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${cfg.border}`}>
                                <span className={cfg.color}>{cfg.icon}</span>
                                <span className={`text-[11px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                                <span className={`ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-black/20 ${cfg.color}`}>{items.length}</span>
                            </div>
                            {colTotal > 0 && (
                                <p className={`text-[10px] font-mono font-bold mb-2 ${cfg.color} opacity-70`}>
                                    ${colTotal.toLocaleString('es-MX')}
                                </p>
                            )}
                            <div className="space-y-2">
                                {items.map(item => (
                                    <TreatmentCard
                                        key={item.id}
                                        item={item}
                                        finalPrice={itemFinalPrice(item)}
                                        onEdit={() => setEditingItem({ ...item })}
                                        onDelete={() => deleteItem(item.id)}
                                        onStatusChange={s => updateStatus(item.id, s)}
                                    />
                                ))}
                                {items.length === 0 && (
                                    <p className={`text-[10px] text-center py-6 ${cfg.color} opacity-30`}>Sin tratamientos</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Cancelled section (collapsible) ──────────────────────────── */}
            {cancelledItems.length > 0 && (
                <div className="border border-gray-500/20 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowCancelled(v => !v)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-500/5 hover:bg-gray-500/10 transition-colors text-left"
                    >
                        {showCancelled ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        <XCircle className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Cancelados</span>
                        <span className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-black/20 text-gray-500">{cancelledItems.length}</span>
                    </button>
                    {showCancelled && (
                        <div className="p-3 grid grid-cols-4 gap-2">
                            {cancelledItems.map(item => (
                                <TreatmentCard
                                    key={item.id}
                                    item={item}
                                    finalPrice={itemFinalPrice(item)}
                                    onEdit={() => setEditingItem({ ...item })}
                                    onDelete={() => deleteItem(item.id)}
                                    onStatusChange={s => updateStatus(item.id, s)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Plan notes ───────────────────────────────────────────────── */}
            <div className="border-t border-white/10 pt-4">
                <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-2 block">Notas del Plan</label>
                <textarea
                    value={planNotes}
                    onChange={e => setPlanNotes(e.target.value)}
                    onBlur={() => savePlan(localItems, planNotes)}
                    rows={2}
                    placeholder="Observaciones generales del plan de tratamiento..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-clinical/90 text-sm focus:border-electric outline-none resize-none"
                />
            </div>

            {/* ── Edit / Add modal ─────────────────────────────────────────── */}
            {editingItem && (
                <ItemFormModal
                    item={editingItem}
                    doctors={doctors}
                    onChange={setEditingItem}
                    onSave={saveItem}
                    onCancel={() => setEditingItem(null)}
                />
            )}
        </div>
    );
};

// ─── TreatmentCard ────────────────────────────────────────────────────────────
const TreatmentCard: React.FC<{
    item: TreatmentPlanItem;
    finalPrice: number;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (s: TreatmentStatus) => void;
}> = ({ item, finalPrice, onEdit, onDelete, onStatusChange }) => {
    const [pendingDelete, setPendingDelete] = useState(false);
    const nexts = NEXT_STATUSES[item.status];

    const handleDeleteClick = () => {
        if (pendingDelete) {
            onDelete();
        } else {
            setPendingDelete(true);
            // Auto-reset after 4s if user doesn't confirm
            setTimeout(() => setPendingDelete(false), 4000);
        }
    };

    return (
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 group relative">
            {/* Name + actions */}
            <div className="flex items-start justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {item.toothNumber && (
                        <span className="w-5 h-5 bg-electric/10 text-electric text-[8px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {item.toothNumber}
                        </span>
                    )}
                    <p className="text-white text-xs font-bold leading-tight truncate">{item.name}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {!pendingDelete && (
                        <button type="button" onClick={onEdit} title="Editar"
                            className="text-clinical/40 hover:text-electric p-0.5 transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                    {pendingDelete ? (
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] text-red-400 font-bold">¿Eliminar?</span>
                            <button type="button" onClick={handleDeleteClick} title="Confirmar eliminación"
                                className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-red-700 transition-colors">
                                Sí
                            </button>
                            <button type="button" onClick={() => setPendingDelete(false)} title="Cancelar"
                                className="text-[8px] bg-white/10 text-clinical/60 px-1.5 py-0.5 rounded font-bold hover:bg-white/20 transition-colors">
                                No
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={handleDeleteClick} title="Eliminar tratamiento"
                            className="text-clinical/40 hover:text-red-400 p-0.5 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] bg-black/40 text-clinical/40 px-1.5 py-0.5 rounded font-bold">Fase {item.phase}</span>
                <span className="text-[10px] font-mono font-bold text-white/60 ml-auto">
                    ${finalPrice.toLocaleString('es-MX')}
                    {item.discount > 0 && <span className="text-emerald-400/60 ml-1">(-{item.discount}%)</span>}
                </span>
            </div>
            {item.doctorName && <p className="text-[9px] text-clinical/30 mb-1 truncate">Dr. {item.doctorName}</p>}
            {item.notes      && <p className="text-[9px] text-clinical/40 mb-2 truncate">{item.notes}</p>}

            {/* Status transition buttons — only logical next steps */}
            {nexts.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2 pt-2 border-t border-white/5">
                    {nexts.map(s => {
                        const scfg = STATUS_CONFIG[s];
                        const isForward = s !== 'cancelled' && s !== 'pending';
                        return (
                            <button type="button" key={s} onClick={() => onStatusChange(s)}
                                className={`text-[8px] font-bold px-2 py-1 rounded-full border transition-all
                                    ${isForward
                                        ? `${scfg.bg} ${scfg.color} ${scfg.border} hover:opacity-100 opacity-80`
                                        : 'bg-transparent border-white/10 text-clinical/30 hover:border-white/30 hover:text-clinical/60 opacity-70 hover:opacity-100'
                                    }`}>
                                {s === 'cancelled' ? '✕ Cancelar'
                                    : s === 'pending' ? '↩ Reactivar'
                                    : `→ ${scfg.label}`}
                            </button>
                        );
                    })}
                </div>
            )}
            {nexts.length === 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[8px] text-teal-400/50 font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Proceso completado
                    </span>
                </div>
            )}
        </div>
    );
};

// ─── ItemFormModal ────────────────────────────────────────────────────────────
const ItemFormModal: React.FC<{
    item: Partial<TreatmentPlanItem>;
    doctors: StaffMember[];
    onChange: (item: Partial<TreatmentPlanItem>) => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ item, doctors, onChange, onSave, onCancel }) => {
    const up = (patch: Partial<TreatmentPlanItem>) => onChange({ ...item, ...patch });

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
            <div
                className="bg-cobalt border border-electric/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <h4 className="font-syne font-bold text-white text-lg">
                    {item.id ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                </h4>

                <div>
                    <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Nombre del Tratamiento *</label>
                    <input
                        type="text" autoFocus
                        value={item.name ?? ''}
                        onChange={e => up({ name: e.target.value })}
                        placeholder="Ej. Endodoncia, Corona de porcelana, Carilla..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Diente #</label>
                        <input type="number"
                            value={item.toothNumber ?? ''}
                            onChange={e => up({ toothNumber: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="11-48"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Fase</label>
                        <select
                            value={item.phase ?? 1}
                            onChange={e => up({ phase: Number(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                        >
                            {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Fase {p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Precio</label>
                        <input type="number" min="0"
                            value={item.price ?? ''}
                            onChange={e => up({ price: Number(e.target.value) })}
                            placeholder="0"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Descuento %</label>
                        <input type="number" min="0" max="100"
                            value={item.discount ?? 0}
                            onChange={e => up({ discount: Number(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Doctor</label>
                        {doctors.length > 0 ? (
                            <select
                                value={item.doctorName ?? ''}
                                onChange={e => up({ doctorName: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                            >
                                <option value="">— Sin asignar —</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.nombres}>
                                        {d.nombres}
                                        {d.staffType === 'external_doctor' ? ' (Ext.)' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input type="text"
                                value={item.doctorName ?? ''}
                                onChange={e => up({ doctorName: e.target.value })}
                                placeholder="Nombre del doctor"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-electric outline-none"
                            />
                        )}
                    </div>
                </div>

                {/* Final price preview */}
                {(item.price ?? 0) > 0 && (
                    <div className="bg-electric/5 border border-electric/20 rounded-xl px-4 py-2 flex justify-between items-center">
                        <span className="text-xs text-clinical/50">Precio final (con descuento)</span>
                        <span className="font-mono font-bold text-electric text-sm">
                            ${((item.price ?? 0) - (item.price ?? 0) * ((item.discount ?? 0) / 100)).toLocaleString('es-MX')}
                        </span>
                    </div>
                )}

                <div>
                    <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Notas</label>
                    <textarea
                        value={item.notes ?? ''}
                        onChange={e => up({ notes: e.target.value })}
                        rows={2}
                        placeholder="Observaciones del tratamiento..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-clinical/90 text-sm focus:border-electric outline-none resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} className="flex-1 border border-white/20 text-clinical/60 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onSave} disabled={!item.name?.trim()}
                        className="flex-1 bg-electric text-cobalt py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
                        {item.id ? 'Actualizar' : 'Agregar al Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
};