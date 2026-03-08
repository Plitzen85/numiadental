import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, FileText, CheckCircle2, Activity, Stethoscope, Save } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { ToothSVG, ToothSurface, ToothCondition, ToothSurfaceMap, CONDITION_LABELS, defaultSurfaces } from './ToothSVG';
import { PeriodoGrid, PeriodoData, defaultPeriodoData } from './PeriodoGrid';
import { loadPatientRecord, savePatientRecord } from '../../lib/supabase';

// ─── Tooth layout ─────────────────────────────────────────────────────────────
const UPPER_ADULT = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ADULT = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// ─── Treatment catalog ────────────────────────────────────────────────────────
const TREATMENT_PRICES: Record<ToothCondition, { name: string; price: number }> = {
    healthy: { name: 'Limpieza / Revisión', price: 0 },
    caries: { name: 'Tratamiento de Caries', price: 850 },
    resin: { name: 'Resina Compuesta', price: 1200 },
    amalgam: { name: 'Amalgama', price: 750 },
    crown: { name: 'Corona de Porcelana', price: 3500 },
    extracted: { name: 'Extracción Simple', price: 1500 },
    implant: { name: 'Implante Dental', price: 18000 },
    root_canal: { name: 'Endodoncia', price: 4500 },
    bridge: { name: 'Puente', price: 9000 },
    veneer: { name: 'Carilla', price: 5000 },
    fracture: { name: 'Restauración/Fractura', price: 1800 },
};

// ─── Condition color class maps (replaces inline hex styles) ──────────────────
const CONDITION_ITEM_STYLE: Record<ToothCondition, string> = {
    healthy: 'bg-white/20 text-blue-400',
    caries: 'bg-red-500/20 text-red-400',
    resin: 'bg-blue-500/20 text-blue-400',
    amalgam: 'bg-purple-500/20 text-purple-400',
    crown: 'bg-yellow-500/20 text-yellow-400',
    extracted: 'bg-gray-600/20 text-gray-300',
    implant: 'bg-cyan-500/20 text-cyan-400',
    root_canal: 'bg-orange-500/20 text-orange-400',
    bridge: 'bg-purple-400/20 text-purple-300',
    veneer: 'bg-pink-500/20 text-pink-400',
    fracture: 'bg-gray-500/20 text-gray-400',
};

// ─── Condition toolbar definition ─────────────────────────────────────────────
const TOOLBAR: { condition: ToothCondition; dotClass: string; activeClass: string }[] = [
    { condition: 'healthy', dotClass: 'bg-white', activeClass: 'bg-white text-black' },
    { condition: 'caries', dotClass: 'bg-red-500', activeClass: 'bg-red-500/20 text-red-400 border border-red-500/40' },
    { condition: 'resin', dotClass: 'bg-blue-500', activeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/40' },
    { condition: 'amalgam', dotClass: 'bg-purple-500', activeClass: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
    { condition: 'crown', dotClass: 'bg-yellow-500', activeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
    { condition: 'extracted', dotClass: 'bg-gray-500', activeClass: 'bg-white/20 text-white border border-white/40' },
    { condition: 'implant', dotClass: 'bg-cyan-500', activeClass: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
    { condition: 'root_canal', dotClass: 'bg-orange-500', activeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/40' },
    { condition: 'veneer', dotClass: 'bg-pink-500', activeClass: 'bg-pink-500/20 text-pink-400 border border-pink-500/40' },
    { condition: 'fracture', dotClass: 'bg-gray-500', activeClass: 'bg-gray-500/20 text-gray-400 border border-gray-500/40' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppliedTreatment {
    id: string;
    toothNumber: number;
    surface: ToothSurface;
    condition: ToothCondition;
    price: number;
    name: string;
}

type ChartMode = 'odontogram' | 'periodonto';

// ─── Component ───────────────────────────────────────────────────────────────
export const HybridChart: React.FC<{ patientId?: string }> = ({ patientId }) => {
    const { clinicProfile } = useMarket();
    const [chartMode, setChartMode] = useState<ChartMode>('odontogram');

    // Odontogram state
    const allTeeth = [...UPPER_ADULT, ...LOWER_ADULT];
    const [surfaces, setSurfaces] = useState<Record<number, ToothSurfaceMap>>(
        Object.fromEntries(allTeeth.map(n => [n, defaultSurfaces()]))
    );
    const [activeTool, setActiveTool] = useState<ToothCondition>('caries');
    const [treatments, setTreatments] = useState<AppliedTreatment[]>([]);
    const [discountActive, setDiscountActive] = useState(false);

    // Periodontal state
    const [periodoData, setPeriodoData] = useState<Record<number, PeriodoData>>(
        Object.fromEntries(allTeeth.map(n => [n, defaultPeriodoData()]))
    );

    // ── Persist state ────────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load chart data on mount
    useEffect(() => {
        if (!patientId) return;
        loadPatientRecord(patientId).then(record => {
            if (record.chartData) {
                setSurfaces(record.chartData.surfaces as unknown as Record<number, ToothSurfaceMap>);
                setTreatments(record.chartData.treatments as unknown as AppliedTreatment[]);
                setPeriodoData(record.chartData.periodoData as unknown as Record<number, PeriodoData>);
            }
        });
    }, [patientId]);

    // Debounced auto-save whenever chart state changes
    useEffect(() => {
        if (!patientId) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            setIsSaving(true);
            await savePatientRecord(patientId, {
                chartData: { surfaces, treatments, periodoData },
            });
            setIsSaving(false);
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2000);
        }, 1500);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [patientId, surfaces, treatments, periodoData]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleSurfaceClick = (toothNum: number, surface: ToothSurface) => {
        const newCondition = activeTool;
        setSurfaces(prev => ({
            ...prev,
            [toothNum]: { ...prev[toothNum], [surface]: newCondition }
        }));

        setTreatments(prev => {
            const id = `${toothNum}-${surface}`;
            const without = prev.filter(t => t.id !== id);
            if (newCondition === 'healthy') return without;
            return [...without, {
                id,
                toothNumber: toothNum,
                surface,
                condition: newCondition,
                price: TREATMENT_PRICES[newCondition].price,
                name: TREATMENT_PRICES[newCondition].name,
            }];
        });
    };

    const reset = () => {
        if (!window.confirm('¿Está seguro de limpiar todo el odontograma?')) return;
        setSurfaces(Object.fromEntries(allTeeth.map(n => [n, defaultSurfaces()])));
        setTreatments([]);
        setPeriodoData(Object.fromEntries(allTeeth.map(n => [n, defaultPeriodoData()])));
    };

    // ── Quote calculations ───────────────────────────────────────────────────
    const subtotal = treatments.reduce((s, t) => s + t.price, 0);
    const discountAmt = discountActive ? subtotal * 0.1 : 0;
    const total = subtotal - discountAmt;

    // ── Services from clinic profile ─────────────────────────────────────────
    const clinicServices = clinicProfile?.servicios
        ? Object.values(clinicProfile.servicios).flatMap(cat => Object.entries(cat as Record<string, number>))
        : [];

    // ── Arc helper ──────────────────────────────────────────────────────────
    const Arc: React.FC<{ teeth: number[]; flip?: boolean }> = ({ teeth, flip }) => (
        <div className={`flex justify-center gap-1 ${flip ? 'flex-row-reverse' : ''}`}>
            {/* Right quadrant */}
            <div className={`flex gap-1 pr-3 border-r-2 border-dashed border-electric/30 ${flip ? 'justify-end' : ''}`}>
                {teeth.slice(0, 8).map(n => (
                    <ToothSVG
                        key={n}
                        number={n}
                        surfaces={surfaces[n]}
                        onSurfaceClick={s => handleSurfaceClick(n, s)}
                    />
                ))}
            </div>
            {/* Left quadrant */}
            <div className="flex gap-1 pl-3">
                {teeth.slice(8).map(n => (
                    <ToothSVG
                        key={n}
                        number={n}
                        surfaces={surfaces[n]}
                        onSurfaceClick={s => handleSurfaceClick(n, s)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full flex gap-6 h-full min-h-[600px]">
            {/* ── LEFT: Quote Panel ─────────────────────────────────────────── */}
            <div className="w-72 flex-shrink-0 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto quote-panel-gradient">
                <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Presupuesto</p>
                    <p className="font-syne text-4xl font-bold text-white">${total.toLocaleString('es-MX')}</p>
                </div>

                <div className="bg-white rounded-xl p-4 flex-1 flex flex-col text-gray-800 shadow-inner overflow-hidden">
                    {/* Discount toggle */}
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-400">Descuento Comercial</span>
                        <button onClick={() => setDiscountActive(d => !d)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${discountActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                            {discountActive ? '10% Activo' : 'Aplicar 10%'}
                        </button>
                    </div>

                    {/* Treatment list */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[80px]">
                        {treatments.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center mt-6">Haz clic en las superficies del diente para cotizar.</p>
                        ) : treatments.map(item => (
                            <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-50 pb-2">
                                <div className="flex gap-2 items-start">
                                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[9px] ${CONDITION_ITEM_STYLE[item.condition]}`}>
                                        {item.toothNumber}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-700 leading-tight">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 capitalize">{item.surface}</p>
                                    </div>
                                </div>
                                <span className="font-mono font-semibold text-gray-600 ml-2">${item.price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="pt-3 border-t border-gray-100 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span><span>${subtotal.toLocaleString('es-MX')}</span>
                        </div>
                        {discountActive && (
                            <div className="flex justify-between font-bold text-blue-500">
                                <span>Descuento 10%</span><span>-${discountAmt.toLocaleString('es-MX')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-800 text-base pt-1">
                            <span>Total</span><span className="text-blue-600">${total.toLocaleString('es-MX')}</span>
                        </div>
                    </div>
                </div>

                {/* Clinic services quick-add hint */}
                {clinicServices.length > 0 && (
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-2">Servicios de tu clínica</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {clinicServices.map(([name, price]) => (
                                <div key={name} className="flex justify-between text-[10px] text-white/70">
                                    <span>{name}</span><span>${price.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button className="flex-1 bg-white text-blue-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-50 transition-colors">
                        <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button className="flex-1 bg-blue-600 border border-white/20 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </button>
                </div>
            </div>

            {/* ── RIGHT: Chart Panel ────────────────────────────────────────── */}
            <div className="flex-1 glass-panel border border-white/10 rounded-2xl p-5 flex flex-col overflow-hidden">
                {/* Mode switcher */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button onClick={() => setChartMode('odontogram')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'odontogram' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-clinical'}`}>
                            <Stethoscope className="w-3.5 h-3.5" /> Odontograma
                        </button>
                        <button onClick={() => setChartMode('periodonto')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'periodonto' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-clinical'}`}>
                            <Activity className="w-3.5 h-3.5" /> Periodontograma
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {patientId && (
                            isSaving
                                ? <Save className="w-3 h-3 text-clinical/40 animate-pulse" />
                                : savedOk
                                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    : null
                        )}
                        <button type="button" onClick={reset} className="p-2 text-clinical/30 hover:text-red-400 transition-colors" title="Reiniciar todo">
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {chartMode === 'odontogram' && (
                        <motion.div key="odo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4 overflow-auto flex-1">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-1.5 bg-black/20 p-2 rounded-xl border border-white/5 self-center">
                                {TOOLBAR.map(({ condition, dotClass, activeClass }) => (
                                    <button key={condition}
                                        onClick={() => setActiveTool(condition)}
                                        title={CONDITION_LABELS[condition]}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTool === condition ? activeClass : 'text-white/50 hover:bg-white/10'}`}>
                                        <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${dotClass}`} />
                                        {CONDITION_LABELS[condition]}
                                    </button>
                                ))}
                            </div>

                            {/* Legend */}
                            <p className="text-[10px] text-clinical/30 text-center -mt-2">Haz clic en una superficie del diente para aplicar el tratamiento seleccionado</p>

                            {/* Upper arch */}
                            <div className="overflow-x-auto pb-2">
                                <Arc teeth={UPPER_ADULT} />
                            </div>

                            {/* Midline */}
                            <div className="w-full flex items-center gap-3 my-1">
                                <div className="flex-1 h-px bg-electric/20" />
                                <span className="text-[9px] text-electric/40 font-bold uppercase tracking-widest">Línea Media</span>
                                <div className="flex-1 h-px bg-electric/20" />
                            </div>

                            {/* Lower arch */}
                            <div className="overflow-x-auto pb-2">
                                <Arc teeth={LOWER_ADULT} />
                            </div>
                        </motion.div>
                    )}

                    {chartMode === 'periodonto' && (
                        <motion.div key="perio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-6 overflow-auto flex-1 pr-1">
                            <div>
                                <h3 className="text-xs font-bold text-electric uppercase tracking-widest mb-3">Cuadrante Superior</h3>
                                <PeriodoGrid
                                    teethNumbers={UPPER_ADULT}
                                    data={periodoData}
                                    onChange={(n, d) => setPeriodoData(prev => ({ ...prev, [n]: d }))}
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-premium uppercase tracking-widest mb-3">Cuadrante Inferior</h3>
                                <PeriodoGrid
                                    teethNumbers={LOWER_ADULT}
                                    data={periodoData}
                                    onChange={(n, d) => setPeriodoData(prev => ({ ...prev, [n]: d }))}
                                />
                            </div>

                            {/* Summary badges */}
                            <div className="flex gap-4 flex-wrap">
                                {(() => {
                                    let deepSites = 0;
                                    let bleedingTeeth = 0;
                                    let totalDepth = 0;
                                    let totalSites = 0;
                                    allTeeth.forEach(n => {
                                        const pd = periodoData[n];
                                        if (!pd || pd.absent) return;
                                        if (pd.bleeding.buccal || pd.bleeding.lingual) bleedingTeeth++;
                                        (['buccal', 'lingual'] as const).forEach(side => {
                                            pd.probingDepth[side].forEach(v => {
                                                if (v >= 4) deepSites++;
                                                totalDepth += v;
                                                totalSites++;
                                            });
                                        });
                                    });
                                    const avgDepth = totalSites > 0 ? (totalDepth / totalSites).toFixed(1) : '0.0';
                                    return (
                                        <>
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-red-400 font-bold text-lg">{deepSites}</p>
                                                <p className="text-[10px] text-red-400/70 uppercase font-bold">Sitios ≥ 4mm</p>
                                            </div>
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-orange-400 font-bold text-lg">{bleedingTeeth}</p>
                                                <p className="text-[10px] text-orange-400/70 uppercase font-bold">Dientes c/ Sangrado</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-blue-400 font-bold text-lg">{avgDepth}</p>
                                                <p className="text-[10px] text-blue-400/70 uppercase font-bold">Promedio Sondaje</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
