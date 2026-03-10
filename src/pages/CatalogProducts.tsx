import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Tag, CheckCircle2, Plus, Trash2, Stethoscope } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { DEFAULT_TREATMENT_PRICES } from '../components/patient/HybridChart';
import { ToothCondition } from '../components/patient/ToothSVG';

const CONDITION_ORDER: ToothCondition[] = [
    'healthy', 'caries', 'resin', 'amalgam', 'crown',
    'extracted', 'implant', 'root_canal', 'bridge', 'veneer', 'fracture',
];

const CONDITION_DOT: Record<ToothCondition, string> = {
    healthy: 'bg-white/60',
    caries: 'bg-red-500',
    resin: 'bg-blue-500',
    amalgam: 'bg-purple-500',
    crown: 'bg-yellow-500',
    extracted: 'bg-gray-500',
    implant: 'bg-cyan-500',
    root_canal: 'bg-orange-500',
    bridge: 'bg-purple-400',
    veneer: 'bg-pink-500',
    fracture: 'bg-gray-400',
};

interface ExtraTreatment {
    id: string;
    name: string;
    price: number;
}

export const CatalogProducts: React.FC = () => {
    const { clinicProfile, setClinicProfile } = useMarket();
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);

    // ── Odontogram prices ────────────────────────────────────────────────────
    const [prices, setPrices] = useState<Record<string, { name: string; price: number }>>(() => ({
        ...DEFAULT_TREATMENT_PRICES,
        ...(clinicProfile?.odontogramPrices ?? {}),
    }));

    useEffect(() => {
        setPrices({
            ...DEFAULT_TREATMENT_PRICES,
            ...(clinicProfile?.odontogramPrices ?? {}),
        });
    }, [clinicProfile?.odontogramPrices]);

    const handleChange = (key: string, field: 'name' | 'price', value: string) => {
        setPrices(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: field === 'price' ? (parseFloat(value) || 0) : value,
            },
        }));
    };

    const handleReset = (key: string) => {
        const def = DEFAULT_TREATMENT_PRICES[key as ToothCondition];
        if (!def) return;
        setPrices(prev => ({ ...prev, [key]: { ...def } }));
    };

    const handleResetAll = () => {
        if (!window.confirm('¿Restablecer todos los precios del odontograma a los valores predeterminados?')) return;
        setPrices({ ...DEFAULT_TREATMENT_PRICES });
    };

    // ── Extra clinic treatments ──────────────────────────────────────────────
    const [extras, setExtras] = useState<ExtraTreatment[]>(() =>
        clinicProfile?.catalogoExtra ?? []
    );

    useEffect(() => {
        setExtras(clinicProfile?.catalogoExtra ?? []);
    }, [clinicProfile?.catalogoExtra]);

    const handleExtraChange = (id: string, field: 'name' | 'price', value: string) => {
        setExtras(prev => prev.map(e =>
            e.id === id
                ? { ...e, [field]: field === 'price' ? (parseFloat(value) || 0) : value }
                : e
        ));
    };

    const handleAddExtra = () => {
        setExtras(prev => [...prev, { id: `extra-${Date.now()}`, name: '', price: 0 }]);
    };

    const handleRemoveExtra = (id: string) => {
        setExtras(prev => prev.filter(e => e.id !== id));
    };

    // ── Save both sections ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (!clinicProfile) return;
        setIsSaving(true);
        await setClinicProfile({
            ...clinicProfile,
            odontogramPrices: prices,
            catalogoExtra: extras,
        });
        setIsSaving(false);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2500);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-electric/10 border border-electric/20 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-electric" />
                        </div>
                        <h1 className="font-syne text-2xl font-bold text-white">Catálogo de Productos</h1>
                    </div>
                    <p className="text-clinical/50 text-sm ml-11">Precios del odontograma, periodontograma y tratamientos de clínica</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-clinical/60 border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Restablecer odontograma
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-electric text-cobalt hover:bg-electric/90 transition-colors disabled:opacity-50"
                    >
                        {savedOk
                            ? <><CheckCircle2 className="w-4 h-4" /> Guardado</>
                            : isSaving
                                ? <><div className="w-4 h-4 border-2 border-cobalt/40 border-t-cobalt rounded-full animate-spin" /> Guardando…</>
                                : <><Save className="w-4 h-4" /> Guardar cambios</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Section 1: Odontogram prices ─────────────────────────────── */}
            <div className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-electric/70" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Odontograma y Plan de Tratamiento</h2>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel border border-white/10 rounded-2xl overflow-hidden mb-8"
            >
                <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-clinical/40 uppercase tracking-widest">
                    <span></span>
                    <span>Nombre del tratamiento</span>
                    <span>Precio (MXN)</span>
                    <span></span>
                </div>

                {CONDITION_ORDER.map((key, idx) => {
                    const entry = prices[key] ?? DEFAULT_TREATMENT_PRICES[key];
                    const isModified =
                        entry.name !== DEFAULT_TREATMENT_PRICES[key].name ||
                        entry.price !== DEFAULT_TREATMENT_PRICES[key].price;

                    return (
                        <div
                            key={key}
                            className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-4 items-center px-6 py-3 ${idx < CONDITION_ORDER.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/2 transition-colors`}
                        >
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${CONDITION_DOT[key]}`} />
                            <input
                                type="text"
                                title={`Nombre: ${key}`}
                                placeholder="Nombre del tratamiento"
                                value={entry.name}
                                onChange={e => handleChange(key, 'name', e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all"
                            />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical/40 text-sm">$</span>
                                <input
                                    type="number"
                                    min={0}
                                    title={`Precio: ${key}`}
                                    placeholder="0"
                                    value={entry.price}
                                    onChange={e => handleChange(key, 'price', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleReset(key)}
                                disabled={!isModified}
                                title="Restablecer"
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-clinical/30 hover:text-clinical/70 hover:bg-white/10 transition-all disabled:opacity-0"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </motion.div>

            {/* ── Section 2: Extra clinic treatments ───────────────────────── */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-premium/70" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Tratamientos de la Clínica</h2>
                </div>
                <p className="text-[10px] text-clinical/40">Referencia para Turismo Dental</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-panel border border-white/10 rounded-2xl overflow-hidden mb-4"
            >
                {extras.length > 0 && (
                    <div className="grid grid-cols-[1fr_1fr_2.5rem] gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-clinical/40 uppercase tracking-widest">
                        <span>Nombre del tratamiento</span>
                        <span>Precio (MXN)</span>
                        <span></span>
                    </div>
                )}

                {extras.length === 0 ? (
                    <div className="px-6 py-10 text-center text-clinical/30 text-sm">
                        <Tag className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p>No hay tratamientos adicionales aún.</p>
                        <p className="text-xs mt-1">Agrégalos con el botón de abajo.</p>
                    </div>
                ) : extras.map((extra, idx) => (
                    <div
                        key={extra.id}
                        className={`grid grid-cols-[1fr_1fr_2.5rem] gap-4 items-center px-6 py-3 ${idx < extras.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/2 transition-colors`}
                    >
                        <input
                            type="text"
                            title={`Nombre tratamiento ${idx + 1}`}
                            placeholder="Nombre del tratamiento"
                            value={extra.name}
                            onChange={e => handleExtraChange(extra.id, 'name', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all"
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical/40 text-sm">$</span>
                            <input
                                type="number"
                                min={0}
                                title={`Precio tratamiento ${idx + 1}`}
                                placeholder="0"
                                value={extra.price}
                                onChange={e => handleExtraChange(extra.id, 'price', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemoveExtra(extra.id)}
                            title="Eliminar"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-clinical/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {/* Add button inside the card */}
                <div className={`px-6 py-3 ${extras.length > 0 ? 'border-t border-white/5' : ''}`}>
                    <button
                        type="button"
                        onClick={handleAddExtra}
                        className="flex items-center gap-2 text-sm font-medium text-electric/70 hover:text-electric transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Agregar tratamiento
                    </button>
                </div>
            </motion.div>

            <p className="text-clinical/30 text-xs text-center mt-2">
                Los tratamientos de clínica aparecen como opciones en el módulo de Turismo Dental.
            </p>
        </div>
    );
};
