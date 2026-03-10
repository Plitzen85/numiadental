import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    FileBarChart, Search, Download, Loader2, RefreshCw,
    TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Users, Landmark, CalendarDays,
    Banknote, CreditCard, ArrowDownToLine, Bitcoin,
} from 'lucide-react';
import { useMarket, isDoctor } from '../context/MarketContext';
import { loadPatientRecord, PatientRecordData, MetodoPago } from '../lib/supabase';
import {
    calcularLiquidaciones, primerDiaMes, hoy,
    LiquidacionDoctor, PatientSummaryForLiquidacion,
} from '../lib/comisionesEngine';
import { getAllCajas, calcTotals, CajaDay } from '../lib/cajaApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Main Component ───────────────────────────────────────────────────────────

export const Reports: React.FC = () => {
    const { clinicProfile, patients, appointments } = useMarket();
    const staff = clinicProfile?.staff ?? [];

    // ── Filters ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'medicos' | 'pacientes' | 'servicios' | 'caja' | 'agenda'>('medicos');
    const [search, setSearch] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('');
    const [desde, setDesde] = useState(primerDiaMes());
    const [hasta, setHasta] = useState(hoy());

    // ── Data loading ─────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState<PatientSummaryForLiquidacion[]>([]);
    const [lastLoaded, setLastLoaded] = useState<string | null>(null);
    const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

    const loadAllRecords = async () => {
        if (patients.length === 0) return;
        setLoading(true);
        const results: PatientSummaryForLiquidacion[] = [];

        await Promise.all(
            patients.map(async (p) => {
                const record: PatientRecordData = await loadPatientRecord(p.id);
                results.push({
                    patientId: p.id,
                    patientName: p.nombres,
                    payments: record.payments ?? [],
                    treatmentItems: record.treatmentPlan?.items ?? [],
                });
            })
        );

        setPatientData(results);
        setLastLoaded(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
    };

    useEffect(() => {
        loadAllRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patients.length]);

    // ── Liquidaciones (real) ─────────────────────────────────────────────────
    const liquidaciones: LiquidacionDoctor[] = useMemo(() => {
        if (patientData.length === 0) return [];
        return calcularLiquidaciones(
            staff,
            patientData,
            desde,
            hasta,
            filterDoctor ? [filterDoctor] : undefined,
        );
    }, [staff, patientData, desde, hasta, filterDoctor]);

    // Summary totals across all doctors
    const grandTotal = useMemo(() => ({
        generado:  liquidaciones.reduce((s, d) => s + d.totalGenerado, 0),
        comision:  liquidaciones.reduce((s, d) => s + d.totalComision, 0),
        pagado:    liquidaciones.reduce((s, d) => s + d.totalPagado, 0),
        pendiente: liquidaciones.reduce((s, d) => s + d.totalPendiente, 0),
    }), [liquidaciones]);

    // ── Patient payments view ─────────────────────────────────────────────────
    const allPayments = useMemo(() => {
        return patientData
            .flatMap(p => p.payments.map(pay => ({ ...pay, patientName: p.patientName })))
            .filter(pay => pay.date >= desde && pay.date <= hasta)
            .filter(pay => !search || pay.patientName.toLowerCase().includes(search.toLowerCase()) || pay.concepto.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [patientData, desde, hasta, search]);

    // ── Services view ─────────────────────────────────────────────────────────
    const serviceStats = useMemo(() => {
        const map = new Map<string, { count: number; total: number }>();
        for (const p of patientData) {
            for (const item of p.treatmentItems) {
                if (!item.completedDate || item.completedDate < desde || item.completedDate > hasta) continue;
                if (item.status !== 'completed' && item.status !== 'paid') continue;
                const entry = map.get(item.name) ?? { count: 0, total: 0 };
                entry.count++;
                entry.total += item.price - item.discount;
                map.set(item.name, entry);
            }
        }
        return [...map.entries()]
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total);
    }, [patientData, desde, hasta]);

    // ── Caja data ─────────────────────────────────────────────────────────────
    const cajaData = useMemo(() => {
        return getAllCajas().filter(c => c.date >= desde && c.date <= hasta);
    }, [desde, hasta]);

    const cajaTotals = useMemo(() => {
        const METODOS: MetodoPago[] = ['efectivo','tarjeta_credito','tarjeta_debito','transferencia','cripto'];
        let ingresos = 0, egresos = 0, retiros = 0;
        const byMetodo: Record<MetodoPago, number> = { efectivo:0, tarjeta_credito:0, tarjeta_debito:0, transferencia:0, cripto:0 };
        for (const day of cajaData) {
            const t = calcTotals(day);
            ingresos += t.ingresos; egresos += t.egresos; retiros += t.retiros;
            for (const m of METODOS) byMetodo[m] += t.byMetodo[m] ?? 0;
        }
        return { ingresos, egresos, retiros, neto: ingresos - egresos - retiros, byMetodo };
    }, [cajaData]);

    // ── A/R Aging (cuentas por cobrar) ────────────────────────────────────────
    const arAging = useMemo(() => {
        const today = new Date(hoy());
        const rows: { patientName: string; tratamiento: string; dias: number; monto: number; bucket: string }[] = [];
        for (const p of patientData) {
            for (const item of p.treatmentItems) {
                if (item.status !== 'completed') continue; // only completed-but-not-paid
                const completedDate = item.completedDate ? new Date(item.completedDate) : null;
                if (!completedDate) continue;
                const dias = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                const monto = (item.price - item.discount) - (p.payments.reduce((s, pay) => s + (pay.treatmentItemIds.includes(item.id) ? pay.monto : 0), 0));
                if (monto <= 0) continue;
                const bucket = dias <= 30 ? '0–30 días' : dias <= 60 ? '31–60 días' : dias <= 90 ? '61–90 días' : '+90 días';
                rows.push({ patientName: p.patientName, tratamiento: item.name, dias, monto, bucket });
            }
        }
        return rows.sort((a, b) => b.dias - a.dias);
    }, [patientData]);

    // ── Agenda KPIs ───────────────────────────────────────────────────────────
    const agendaKPIs = useMemo(() => {
        const doctors = (clinicProfile?.staff ?? []).filter(isDoctor);
        const total = appointments.length;
        const byStatus = (s: string) => appointments.filter(a => a.status === s).length;
        const confirmed = byStatus('confirmed') + byStatus('arrived') + byStatus('in_chair') + byStatus('completed') + byStatus('billed');
        const cancelled = byStatus('cancelled');
        const completed = byStatus('completed') + byStatus('billed');
        const byDoctor = doctors.map(d => {
            const appts = appointments.filter(a => a.doctorId === d.id);
            return {
                name: d.nombres,
                total: appts.length,
                completed: appts.filter(a => a.status === 'completed' || a.status === 'billed').length,
                cancelled: appts.filter(a => a.status === 'cancelled').length,
            };
        });
        return { total, confirmed, cancelled, completed, confirmRate: total ? Math.round(confirmed/total*100) : 0, cancelRate: total ? Math.round(cancelled/total*100) : 0, completeRate: total ? Math.round(completed/total*100) : 0, byDoctor };
    }, [appointments, clinicProfile]);

    // ── Export CSV ────────────────────────────────────────────────────────────
    const exportCSV = () => {
        if (activeTab === 'medicos') {
            const rows = [
                ['Médico', 'Paciente', 'Tratamiento', 'Diente', 'Fecha', 'Precio', '% Comisión', 'Comisión', 'Estado'],
                ...liquidaciones.flatMap(d =>
                    d.lineas.map(l => [
                        d.doctorName, l.paciente, l.tratamiento,
                        l.toothNumber ?? '', l.fecha,
                        l.precio, l.porcentaje, l.comision, l.estatus,
                    ])
                ),
            ];
            downloadCSV(rows, `liquidacion-${desde}-${hasta}.csv`);
        } else if (activeTab === 'pacientes') {
            const rows = [
                ['Paciente', 'Fecha', 'Concepto', 'Monto', 'Método'],
                ...allPayments.map(p => [p.patientName, p.date, p.concepto, p.monto, p.metodoPago]),
            ];
            downloadCSV(rows, `cobros-${desde}-${hasta}.csv`);
        } else {
            const rows = [
                ['Servicio', 'Cantidad', 'Total MXN'],
                ...serviceStats.map(s => [s.name, s.count, s.total]),
            ];
            downloadCSV(rows, `servicios-${desde}-${hasta}.csv`);
        }
    };

    const downloadCSV = (rows: (string | number)[][], filename: string) => {
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─────────────────────────────────────────────────────────────────────────

    const doctors = staff.filter(s => s.staffType === 'doctor' || s.staffType === 'external_doctor');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-7xl mx-auto">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileBarChart className="text-electric w-8 h-8" />
                    <div>
                        <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-white text-transparent bg-clip-text">
                            Informes
                        </h1>
                        {lastLoaded && (
                            <p className="text-[11px] text-clinical/30">Actualizado: {lastLoaded}</p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={loadAllRecords}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-clinical/50 hover:text-white hover:border-white/20 transition-colors text-sm"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Recargar datos
                </button>
            </div>

            {/* ── KPI Summary ───────────────────────────────────────────── */}
            {activeTab === 'medicos' && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Producción', value: grandTotal.generado, icon: <TrendingUp className="w-4 h-4" />, color: 'text-electric border-electric/30 bg-electric/5' },
                        { label: 'Comisiones', value: grandTotal.comision, icon: <DollarSign className="w-4 h-4" />, color: 'text-premium border-premium/30 bg-premium/5' },
                        { label: 'Pagado', value: grandTotal.pagado, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                        { label: 'Pendiente', value: grandTotal.pendiente, icon: <Clock className="w-4 h-4" />, color: grandTotal.pendiente > 0 ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-clinical/30 border-white/10 bg-white/3' },
                    ].map(card => (
                        <div key={card.label} className={`border rounded-2xl p-4 ${card.color}`}>
                            <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold uppercase">
                                {card.icon} {card.label}
                            </div>
                            <div className="font-syne text-xl font-bold">{fmt(card.value)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters ───────────────────────────────────────────────── */}
            <div className="bg-white/3 border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-clinical/40 absolute left-3 top-3.5" />
                        <input
                            title="Buscar"
                            type="text"
                            placeholder="Buscar paciente, procedimiento…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-electric outline-none"
                        />
                    </div>
                    <select
                        title="Filtrar por médico"
                        value={filterDoctor}
                        onChange={e => setFilterDoctor(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-clinical focus:border-electric outline-none"
                    >
                        <option value="">Todos los médicos</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.nombres}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <label className="text-[10px] text-clinical/40 uppercase absolute top-1 left-3">Desde</label>
                        <input
                            title="Desde"
                            type="date"
                            value={desde}
                            onChange={e => setDesde(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 pt-5 pb-2 text-sm text-white focus:border-electric outline-none"
                        />
                    </div>
                    <div className="relative">
                        <label className="text-[10px] text-clinical/40 uppercase absolute top-1 left-3">Hasta</label>
                        <input
                            title="Hasta"
                            type="date"
                            value={hasta}
                            onChange={e => setHasta(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 pt-5 pb-2 text-sm text-white focus:border-electric outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="flex border-b border-white/10">
                {([
                    { id: 'medicos',   label: 'Liquidación Médicos' },
                    { id: 'pacientes', label: 'Cobros de Pacientes' },
                    { id: 'servicios', label: 'Servicios Prestados' },
                    { id: 'caja',      label: 'Caja' },
                    { id: 'agenda',    label: 'KPIs Agenda' },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 font-bold text-sm transition-colors relative ${activeTab === tab.id ? 'text-white' : 'text-clinical/50 hover:text-white'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric rounded-t" />}
                    </button>
                ))}
            </div>

            {/* ── Loading ────────────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-16 gap-3 text-clinical/40">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Cargando expedientes de {patients.length} pacientes…</span>
                </div>
            )}

            {/* ══════════════ TAB: MÉDICOS ══════════════ */}
            {!loading && activeTab === 'medicos' && (
                <div className="space-y-4">
                    {liquidaciones.length === 0 ? (
                        <div className="text-center py-16 text-clinical/25">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No hay tratamientos completados en este período.</p>
                        </div>
                    ) : (
                        liquidaciones
                            .filter(d => !search || d.doctorName.toLowerCase().includes(search.toLowerCase()) || d.lineas.some(l => l.paciente.toLowerCase().includes(search.toLowerCase())))
                            .map(doc => (
                                <div key={doc.doctorId} className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                                    {/* Doctor header */}
                                    <button
                                        type="button"
                                        onClick={() => setExpandedDoctor(expandedDoctor === doc.doctorId ? null : doc.doctorId)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-electric/10 border border-electric/30 flex items-center justify-center text-electric font-bold text-sm">
                                                {doc.doctorName.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-white">{doc.doctorName}</p>
                                                <p className="text-xs text-clinical/40">{doc.especialidad} · {doc.porcentajeComision}% comisión · {doc.lineas.length} tratamientos</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-clinical/40">Producción</p>
                                                <p className="font-bold text-white">{fmt(doc.totalGenerado)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-clinical/40">Comisión total</p>
                                                <p className="font-bold text-premium">{fmt(doc.totalComision)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-clinical/40">Pendiente</p>
                                                <p className={`font-bold ${doc.totalPendiente > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {fmt(doc.totalPendiente)}
                                                </p>
                                            </div>
                                            {expandedDoctor === doc.doctorId
                                                ? <ChevronUp className="w-4 h-4 text-clinical/40" />
                                                : <ChevronDown className="w-4 h-4 text-clinical/40" />
                                            }
                                        </div>
                                    </button>

                                    {/* Expanded lines */}
                                    {expandedDoctor === doc.doctorId && (
                                        <div className="border-t border-white/10">
                                            {doc.lineas.length === 0 ? (
                                                <p className="text-center py-6 text-clinical/30 text-sm">Sin tratamientos en este período.</p>
                                            ) : (
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-white/3 text-[10px] uppercase text-clinical/40 tracking-wide">
                                                            <th className="px-5 py-3">Paciente</th>
                                                            <th className="px-5 py-3">Tratamiento</th>
                                                            <th className="px-5 py-3">Fecha</th>
                                                            <th className="px-5 py-3 text-right">Precio</th>
                                                            <th className="px-5 py-3 text-right">Comisión</th>
                                                            <th className="px-5 py-3 text-center">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {doc.lineas.map((linea, i) => (
                                                            <tr key={i} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                                                <td className="px-5 py-3 text-white font-bold">{linea.paciente}</td>
                                                                <td className="px-5 py-3 text-clinical/70">
                                                                    {linea.toothNumber ? `D${linea.toothNumber} · ` : ''}{linea.tratamiento}
                                                                </td>
                                                                <td className="px-5 py-3 text-clinical/50">{fmtDate(linea.fecha)}</td>
                                                                <td className="px-5 py-3 text-right text-white">{fmt(linea.precio)}</td>
                                                                <td className="px-5 py-3 text-right text-premium font-bold">{fmt(linea.comision)}</td>
                                                                <td className="px-5 py-3 text-center">
                                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                                                        linea.estatus === 'pagado'
                                                                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                                                                            : 'text-amber-400 border-amber-500/30 bg-amber-500/5'
                                                                    }`}>
                                                                        {linea.estatus}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-white/5 border-t border-white/10 font-bold text-sm">
                                                            <td colSpan={3} className="px-5 py-3 text-clinical/50">Total del período</td>
                                                            <td className="px-5 py-3 text-right text-white">{fmt(doc.totalGenerado)}</td>
                                                            <td className="px-5 py-3 text-right text-premium">{fmt(doc.totalComision)}</td>
                                                            <td className="px-5 py-3 text-center text-amber-400">{fmt(doc.totalPendiente)} pdte.</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            )}

            {/* ══════════════ TAB: PACIENTES ══════════════ */}
            {!loading && activeTab === 'pacientes' && (
                <div>
                    {allPayments.length === 0 ? (
                        <div className="text-center py-16 text-clinical/25">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sin cobros registrados en este período.</p>
                        </div>
                    ) : (
                        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                        <th className="px-5 py-3">Paciente</th>
                                        <th className="px-5 py-3">Fecha</th>
                                        <th className="px-5 py-3">Concepto</th>
                                        <th className="px-5 py-3">Método</th>
                                        <th className="px-5 py-3 text-right">Monto</th>
                                        <th className="px-5 py-3">Recibo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPayments.map(pay => (
                                        <tr key={pay.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                            <td className="px-5 py-3 text-white font-bold">{pay.patientName}</td>
                                            <td className="px-5 py-3 text-clinical/50">{fmtDate(pay.date)}</td>
                                            <td className="px-5 py-3 text-clinical/70">{pay.concepto}</td>
                                            <td className="px-5 py-3 text-clinical/50 capitalize">{pay.metodoPago.replace('_', ' ')}</td>
                                            <td className="px-5 py-3 text-right text-emerald-400 font-bold">{fmt(pay.monto)}</td>
                                            <td className="px-5 py-3 text-clinical/30 text-xs">{pay.receiptNumber ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white/5 border-t border-white/10 font-bold">
                                        <td colSpan={4} className="px-5 py-3 text-clinical/50">Total cobrado en período</td>
                                        <td className="px-5 py-3 text-right text-emerald-400">
                                            {fmt(allPayments.reduce((s, p) => s + p.monto, 0))}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── A/R Aging (dentro de pacientes) ──────── */}
            {!loading && activeTab === 'pacientes' && arAging.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Cuentas por Cobrar — Aging
                    </h3>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {(['0–30 días','31–60 días','61–90 días','+90 días'] as const).map((bucket, i) => {
                            const rows = arAging.filter(r => r.bucket === bucket);
                            const colors = ['text-emerald-400','text-amber-400','text-orange-400','text-red-400'];
                            return (
                                <div key={bucket} className="bg-white/3 border border-white/10 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-clinical/40 uppercase font-bold">{bucket}</p>
                                    <p className={`font-syne font-bold text-lg ${colors[i]}`}>{fmt(rows.reduce((s,r)=>s+r.monto,0))}</p>
                                    <p className="text-[10px] text-clinical/30">{rows.length} tratamientos</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                    <th className="px-5 py-3">Paciente</th>
                                    <th className="px-5 py-3">Tratamiento</th>
                                    <th className="px-5 py-3 text-center">Días vencido</th>
                                    <th className="px-5 py-3 text-right">Pendiente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {arAging.slice(0,20).map((row, i) => (
                                    <tr key={i} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                        <td className="px-5 py-3 font-bold text-white">{row.patientName}</td>
                                        <td className="px-5 py-3 text-clinical/70">{row.tratamiento}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                                row.dias <= 30 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' :
                                                row.dias <= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
                                                row.dias <= 90 ? 'text-orange-400 border-orange-500/30 bg-orange-500/5' :
                                                'text-red-400 border-red-500/30 bg-red-500/5'
                                            }`}>
                                                {row.dias} días
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-amber-400 font-bold">{fmt(row.monto)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Pacientes sin cita (>6 meses) ────────── */}
            {!loading && activeTab === 'pacientes' && (() => {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                const inactivos = patients
                    .filter(p => !p.ultimaVisita || new Date(p.ultimaVisita) < sixMonthsAgo)
                    .sort((a, b) => (a.ultimaVisita ?? '').localeCompare(b.ultimaVisita ?? ''));
                if (inactivos.length === 0) return null;
                return (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4" /> Pacientes inactivos — Sin cita en +6 meses ({inactivos.length})
                        </h3>
                        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                        <th className="px-5 py-3">Paciente</th>
                                        <th className="px-5 py-3">Teléfono</th>
                                        <th className="px-5 py-3">Última visita</th>
                                        <th className="px-5 py-3 text-center">Días sin cita</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inactivos.slice(0, 30).map(p => {
                                        const last = p.ultimaVisita ? new Date(p.ultimaVisita) : null;
                                        const dias = last ? Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                        return (
                                            <tr key={p.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="px-5 py-3 font-bold text-white">{p.nombres} {p.apellidos}</td>
                                                <td className="px-5 py-3 text-clinical/50">{p.telefono ?? '—'}</td>
                                                <td className="px-5 py-3 text-clinical/50">{last ? last.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin registro'}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-orange-400 border-orange-500/30 bg-orange-500/5">
                                                        {dias !== null ? `${dias} días` : 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* ══════════════ TAB: SERVICIOS ══════════════ */}
            {!loading && activeTab === 'servicios' && (
                <div>
                    {serviceStats.length === 0 ? (
                        <div className="text-center py-16 text-clinical/25">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sin servicios completados en este período.</p>
                        </div>
                    ) : (
                        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                        <th className="px-5 py-3">Servicio</th>
                                        <th className="px-5 py-3 text-center">Cantidad</th>
                                        <th className="px-5 py-3 text-right">Ingresos</th>
                                        <th className="px-5 py-3">% del total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serviceStats.map(s => {
                                        const totalAll = serviceStats.reduce((sum, x) => sum + x.total, 0);
                                        const pct = totalAll > 0 ? (s.total / totalAll * 100) : 0;
                                        return (
                                            <tr key={s.name} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="px-5 py-3 text-white font-bold">{s.name}</td>
                                                <td className="px-5 py-3 text-center text-clinical/70">{s.count}</td>
                                                <td className="px-5 py-3 text-right text-electric font-bold">{fmt(s.total)}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-electric rounded-full transition-all"
                                                                ref={el => { if (el) el.style.width = `${pct}%`; }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-clinical/40 w-8 text-right">{pct.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ TAB: CAJA ══════════════ */}
            {activeTab === 'caja' && (
                <div className="space-y-6">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Ingresos', value: cajaTotals.ingresos, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                            { label: 'Egresos',  value: cajaTotals.egresos,  icon: <DollarSign className="w-4 h-4" />, color: 'text-red-400 border-red-500/30 bg-red-500/5' },
                            { label: 'Retiros',  value: cajaTotals.retiros,  icon: <ArrowDownToLine className="w-4 h-4" />, color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
                            { label: 'Neto',     value: cajaTotals.neto,     icon: <Landmark className="w-4 h-4" />, color: cajaTotals.neto >= 0 ? 'text-electric border-electric/30 bg-electric/5' : 'text-red-400 border-red-500/30 bg-red-500/5' },
                        ].map(card => (
                            <div key={card.label} className={`border rounded-2xl p-4 ${card.color}`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold uppercase">{card.icon}{card.label}</div>
                                <div className="font-syne text-xl font-bold">{fmt(card.value)}</div>
                            </div>
                        ))}
                    </div>
                    {/* By método */}
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-clinical/40 uppercase tracking-widest mb-3">Ingresos por método de pago</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {([
                                { key: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
                                { key: 'tarjeta_credito', label: 'T. Crédito', icon: <CreditCard className="w-4 h-4" /> },
                                { key: 'tarjeta_debito', label: 'T. Débito', icon: <CreditCard className="w-4 h-4" /> },
                                { key: 'transferencia', label: 'Transferencia', icon: <ArrowDownToLine className="w-4 h-4" /> },
                                { key: 'cripto', label: 'Cripto', icon: <Bitcoin className="w-4 h-4" /> },
                            ] as { key: MetodoPago; label: string; icon: React.ReactNode }[]).map(m => (
                                <div key={m.key} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-clinical/40 mb-1">{m.icon}<span className="text-[10px] uppercase font-bold">{m.label}</span></div>
                                    <p className="font-syne font-bold text-electric">{fmt(cajaTotals.byMetodo[m.key])}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Daily table */}
                    {cajaData.length === 0 ? (
                        <div className="text-center py-16 text-clinical/25">
                            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sin registros de caja en este período.</p>
                        </div>
                    ) : (
                        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                        <th className="px-5 py-3">Fecha</th>
                                        <th className="px-5 py-3 text-right">Apertura</th>
                                        <th className="px-5 py-3 text-right">Ingresos</th>
                                        <th className="px-5 py-3 text-right">Egresos</th>
                                        <th className="px-5 py-3 text-right">Neto</th>
                                        <th className="px-5 py-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cajaData.map((c: CajaDay) => {
                                        const t = calcTotals(c);
                                        return (
                                            <tr key={c.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="px-5 py-3 font-bold text-white">{fmtDate(c.date)}</td>
                                                <td className="px-5 py-3 text-right text-clinical/50">{fmt(c.apertura)}</td>
                                                <td className="px-5 py-3 text-right text-emerald-400 font-bold">{fmt(t.ingresos)}</td>
                                                <td className="px-5 py-3 text-right text-red-400">{fmt(t.egresos)}</td>
                                                <td className="px-5 py-3 text-right font-bold text-electric">{fmt(t.neto)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.status === 'closed' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-amber-400 border-amber-500/30 bg-amber-500/5'}`}>
                                                        {c.status === 'closed' ? 'Cerrada' : 'Abierta'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white/5 border-t border-white/10 font-bold">
                                        <td colSpan={2} className="px-5 py-3 text-clinical/50">Total período ({cajaData.length} días)</td>
                                        <td className="px-5 py-3 text-right text-emerald-400">{fmt(cajaTotals.ingresos)}</td>
                                        <td className="px-5 py-3 text-right text-red-400">{fmt(cajaTotals.egresos)}</td>
                                        <td className="px-5 py-3 text-right text-electric">{fmt(cajaTotals.neto)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ TAB: AGENDA KPIs ══════════════ */}
            {activeTab === 'agenda' && (
                <div className="space-y-6">
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total citas', value: agendaKPIs.total, sub: 'en el sistema', color: 'text-electric border-electric/30 bg-electric/5' },
                            { label: 'Tasa confirmación', value: `${agendaKPIs.confirmRate}%`, sub: `${agendaKPIs.confirmed} confirmadas`, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                            { label: 'Tasa cancelación', value: `${agendaKPIs.cancelRate}%`, sub: `${agendaKPIs.cancelled} canceladas`, color: agendaKPIs.cancelRate > 20 ? 'text-red-400 border-red-500/30 bg-red-500/5' : 'text-clinical/50 border-white/10 bg-white/3' },
                            { label: 'Tasa completadas', value: `${agendaKPIs.completeRate}%`, sub: `${agendaKPIs.completed} completadas`, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' },
                        ].map(card => (
                            <div key={card.label} className={`border rounded-2xl p-4 ${card.color}`}>
                                <p className="text-[10px] font-bold uppercase opacity-70 mb-1">{card.label}</p>
                                <p className="font-syne text-2xl font-bold">{card.value}</p>
                                <p className="text-[11px] opacity-50 mt-0.5">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                    {/* By doctor */}
                    {agendaKPIs.byDoctor.length === 0 ? (
                        <div className="text-center py-16 text-clinical/25">
                            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sin citas registradas.</p>
                        </div>
                    ) : (
                        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase text-clinical/40 tracking-wide">
                                        <th className="px-5 py-3">Doctor</th>
                                        <th className="px-5 py-3 text-center">Total citas</th>
                                        <th className="px-5 py-3 text-center">Completadas</th>
                                        <th className="px-5 py-3 text-center">Canceladas</th>
                                        <th className="px-5 py-3">% Éxito</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agendaKPIs.byDoctor.map(d => {
                                        const pct = d.total ? Math.round(d.completed/d.total*100) : 0;
                                        return (
                                            <tr key={d.name} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="px-5 py-3 font-bold text-white">{d.name}</td>
                                                <td className="px-5 py-3 text-center text-clinical/70">{d.total}</td>
                                                <td className="px-5 py-3 text-center text-cyan-400 font-bold">{d.completed}</td>
                                                <td className="px-5 py-3 text-center text-red-400">{d.cancelled}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-electric rounded-full" ref={el => { if (el) el.style.width = `${pct}%`; }} />
                                                        </div>
                                                        <span className="text-xs text-clinical/40 w-8 text-right">{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Export ────────────────────────────────────────────────── */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                    <Download className="w-4 h-4" /> Exportar CSV
                </button>
            </div>
        </motion.div>
    );
};
