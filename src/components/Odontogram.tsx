import React, { useState } from 'react';
import { Settings2, RefreshCcw, FileText, CheckCircle2 } from 'lucide-react';

export const TREATMENT_PRICES: Record<ToothCondition, { name: string, price: number }> = {
    healthy: { name: 'Limpieza / Revisión', price: 0 },
    caries: { name: 'Tratamiento de Caries', price: 850 },
    resin: { name: 'Resina Compuesta', price: 1200 },
    amalgam: { name: 'Amalgama', price: 750 },
    extracted: { name: 'Extracción Simple', price: 1500 },
    crown: { name: 'Corona de Porcelana', price: 3500 }
};

interface AppliedTreatment {
    id: string; // unique combo of tooth-zone
    toothNumber: number;
    zone: ToothZone;
    condition: ToothCondition;
    price: number;
    name: string;
}

export type ToothZone = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type ToothCondition = 'healthy' | 'caries' | 'resin' | 'amalgam' | 'extracted' | 'crown';

export interface ToothData {
    number: number;
    zones: Record<ToothZone, ToothCondition>;
}

const CONDITION_COLORS: Record<ToothCondition, string> = {
    healthy: 'transparent',
    caries: '#ef4444',     // Red
    resin: '#3b82f6',      // Blue
    amalgam: '#8b5cf6',    // Purple
    extracted: '#000000',  // Black (X over the tooth)
    crown: '#eab308'       // Yellow (Border or full cover)
};

interface ToothProps {
    data: ToothData;
    onZoneClick: (number: number, zone: ToothZone) => void;
    onToothClick: (number: number) => void; // For whole-tooth conditions like extraction/crown
}

const Tooth: React.FC<ToothProps> = ({ data, onZoneClick, onToothClick }) => {
    const isExtracted = Object.values(data.zones).some(c => c === 'extracted');
    const isCrown = Object.values(data.zones).some(c => c === 'crown');

    const getFill = (zone: ToothZone) => {
        if (isExtracted) return 'transparent';
        if (isCrown) return CONDITION_COLORS['crown'];
        return CONDITION_COLORS[data.zones[zone]];
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-clinical/70">{data.number}</span>
            <div className="relative w-10 h-10 cursor-pointer group" onDoubleClick={() => onToothClick(data.number)}>
                {/* SVG Geometric representation */}
                <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
                    {/* Top */}
                    <polygon
                        points="0,0 40,0 30,10 10,10"
                        fill={getFill('top')}
                        stroke="#4b5563" strokeWidth="1"
                        className="hover:opacity-80 transition-opacity"
                        onClick={() => onZoneClick(data.number, 'top')}
                    />
                    {/* Right */}
                    <polygon
                        points="40,0 40,40 30,30 30,10"
                        fill={getFill('right')}
                        stroke="#4b5563" strokeWidth="1"
                        className="hover:opacity-80 transition-opacity"
                        onClick={() => onZoneClick(data.number, 'right')}
                    />
                    {/* Bottom */}
                    <polygon
                        points="40,40 0,40 10,30 30,30"
                        fill={getFill('bottom')}
                        stroke="#4b5563" strokeWidth="1"
                        className="hover:opacity-80 transition-opacity"
                        onClick={() => onZoneClick(data.number, 'bottom')}
                    />
                    {/* Left */}
                    <polygon
                        points="0,40 0,0 10,10 10,30"
                        fill={getFill('left')}
                        stroke="#4b5563" strokeWidth="1"
                        className="hover:opacity-80 transition-opacity"
                        onClick={() => onZoneClick(data.number, 'left')}
                    />
                    {/* Center */}
                    <rect
                        x="10" y="10" width="20" height="20"
                        fill={getFill('center')}
                        stroke="#4b5563" strokeWidth="1"
                        className="hover:opacity-80 transition-opacity"
                        onClick={() => onZoneClick(data.number, 'center')}
                    />
                </svg>
                {/* Extracted Overlay (X) */}
                {isExtracted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg viewBox="0 0 40 40" className="w-full h-full text-red-500">
                            <line x1="0" y1="0" x2="40" y2="40" stroke="currentColor" strokeWidth="3" />
                            <line x1="40" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="3" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

// Generate default teeth sets
const createDefaultTeeth = (numbers: number[]): ToothData[] => {
    return numbers.map(n => ({
        number: n,
        zones: { top: 'healthy', right: 'healthy', bottom: 'healthy', left: 'healthy', center: 'healthy' }
    }));
};

const UPPER_ADULT = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ADULT = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const Odontogram: React.FC = () => {
    const [teeth, setTeeth] = useState<ToothData[]>([...createDefaultTeeth(UPPER_ADULT), ...createDefaultTeeth(LOWER_ADULT)]);
    const [activeTool, setActiveTool] = useState<ToothCondition>('healthy');
    const [appliedTreatments, setAppliedTreatments] = useState<AppliedTreatment[]>([]);
    const [discountActive, setDiscountActive] = useState(false);
    const DISCOUNT_PERCENTAGE = 0.10; // 10%

    const handleZoneClick = (number: number, zone: ToothZone) => {
        if (activeTool === 'extracted' || activeTool === 'crown') return; // Must double-click for whole tooth

        setTeeth(prev => prev.map(t => {
            if (t.number === number) {
                return { ...t, zones: { ...t.zones, [zone]: activeTool } };
            }
            return t;
        }));

        setAppliedTreatments(prev => {
            // Remove previous treatment for this specific zone if any
            let updated = prev.filter(t => t.id !== `${number}-${zone}`);
            // If we are not 'erasing' (healthy represents erase here), add the new treatment
            if (activeTool !== 'healthy') {
                updated.push({
                    id: `${number}-${zone}`,
                    toothNumber: number,
                    zone,
                    condition: activeTool,
                    price: TREATMENT_PRICES[activeTool].price,
                    name: TREATMENT_PRICES[activeTool].name
                });
            }
            return updated;
        });
    };

    const handleToothClick = (number: number) => {
        // Use double click to apply whole-tooth conditions or clear them
        setTeeth(prev => prev.map(t => {
            if (t.number === number) {
                const isCurrentlyExtracted = Object.values(t.zones).some(z => z === 'extracted');
                if (isCurrentlyExtracted) {
                    return { ...t, zones: { top: 'healthy', right: 'healthy', bottom: 'healthy', left: 'healthy', center: 'healthy' } };
                }
                if (activeTool === 'extracted' || activeTool === 'crown') {
                    return { ...t, zones: { top: activeTool, right: activeTool, bottom: activeTool, left: activeTool, center: activeTool } };
                }
            }
            return t;
        }));

        setAppliedTreatments(prev => {
            const isCurrentlyExtracted = prev.some(t => t.toothNumber === number && t.condition === 'extracted');
            // Remove all treatments for this tooth
            let updated = prev.filter(t => t.toothNumber !== number);

            if (!isCurrentlyExtracted && (activeTool === 'extracted' || activeTool === 'crown')) {
                updated.push({
                    id: `${number}-whole`,
                    toothNumber: number,
                    zone: 'center', // Representing whole tooth
                    condition: activeTool,
                    price: TREATMENT_PRICES[activeTool].price,
                    name: TREATMENT_PRICES[activeTool].name
                });
            }
            return updated;
        });
    };

    const resetOdontogram = () => {
        if (window.confirm('¿Está seguro de limpiar todo el odontograma?')) {
            setTeeth([...createDefaultTeeth(UPPER_ADULT), ...createDefaultTeeth(LOWER_ADULT)]);
            setAppliedTreatments([]);
            setDiscountActive(false);
        }
    };

    // Derived Totals
    const subtotal = appliedTreatments.reduce((sum, item) => sum + item.price, 0);
    const discountAmount = discountActive ? subtotal * DISCOUNT_PERCENTAGE : 0;
    const total = subtotal - discountAmount;

    return (
        <div className="w-full h-[80vh] flex gap-6 overflow-hidden">
            {/* LEFT PANEL: Quote & Actions */}
            <div className="w-80 flex-shrink-0 bg-blue-500 rounded-3xl p-6 flex flex-col shadow-xl text-white overflow-y-auto">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-sans font-bold opacity-80 uppercase tracking-widest mb-1">Presupuesto Actual</h2>
                        <span className="font-syne text-4xl font-bold">${total.toLocaleString('es-MX')}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 text-gray-800 shadow-inner flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-400">Descuento Comercial</span>
                        <button
                            onClick={() => setDiscountActive(!discountActive)}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${discountActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            {discountActive ? '10% Activo' : 'Aplicar 10%'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {appliedTreatments.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-10">
                                <span className="opacity-50">Selecciona tratamientos en el odontograma para cotizar.</span>
                            </div>
                        ) : (
                            appliedTreatments.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 font-bold flex items-center justify-center text-[10px]">
                                            {item.toothNumber}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 capitalize">{item.zone !== 'center' ? 'Zona ' + item.zone : 'Pieza Completa'}</span>
                                        </div>
                                    </div>
                                    <span className="font-mono text-gray-500 font-semibold">${item.price.toLocaleString('es-MX')}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-1 text-gray-500">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString('es-MX')}</span>
                        </div>
                        {discountActive && (
                            <div className="flex justify-between text-sm mb-1 text-blue-500 font-bold">
                                <span>Descuento</span>
                                <span>-${discountAmount.toLocaleString('es-MX')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-800 mt-2">
                            <span>Total</span>
                            <span className="text-blue-600">${total.toLocaleString('es-MX')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-2">
                    <button className="flex-1 bg-white text-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                        <FileText className="w-5 h-5" /> Imprimir
                    </button>
                    <button className="flex-1 bg-blue-600 text-white border-2 border-white/20 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                        <CheckCircle2 className="w-5 h-5" /> Generar
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Odontogram Grid & Tools */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-2xl flex flex-col relative overflow-y-auto">
                <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50 pointer-events-none">
                    <Settings2 className="w-4 h-4 text-electric" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white">Interactive Chart</span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-10 bg-black/20 p-2 rounded-2xl border border-white/5 mt-2 self-center z-10">
                    <button title="Herramienta" onClick={() => setActiveTool('healthy')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'healthy' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'}`}>
                        Limpiar Selec.
                    </button>
                    <button title="Herramienta" onClick={() => setActiveTool('caries')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTool === 'caries' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'text-white/60 hover:bg-white/10'}`}>
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div> Caries
                    </button>
                    <button title="Herramienta" onClick={() => setActiveTool('resin')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTool === 'resin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-white/60 hover:bg-white/10'}`}>
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Resina
                    </button>
                    <button title="Herramienta" onClick={() => setActiveTool('amalgam')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTool === 'amalgam' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'text-white/60 hover:bg-white/10'}`}>
                        <div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Amalgama
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    <button title="Herramienta (Doble Clic)" onClick={() => setActiveTool('extracted')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTool === 'extracted' ? 'bg-white/20 text-white border border-white/50' : 'text-white/60 hover:bg-white/10'}`}>
                        <span className="font-serif text-lg leading-none cursor-pointer">✕</span> Extracción
                    </button>
                    <button title="Herramienta (Doble Clic)" onClick={() => setActiveTool('crown')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTool === 'crown' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-white/60 hover:bg-white/10'}`}>
                        <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div> Corona
                    </button>

                    <div className="flex-1 w-4"></div>
                    <button onClick={resetOdontogram} className="p-2 text-clinical/40 hover:text-red-400 transition-colors ml-4" title="Reiniciar Todo">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Upper Arc */}
                <div className="flex justify-center gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-4 mb-20 w-full overflow-x-auto pb-4">
                    {/* Upper Right Quadrant (18-11) */}
                    <div className="flex gap-1.5 justify-end pr-4 border-r-2 border-dashed border-electric/30">
                        {UPPER_ADULT.slice(0, 8).map(num => (
                            <Tooth
                                key={num}
                                data={teeth.find(t => t.number === num)!}
                                onZoneClick={handleZoneClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                    {/* Upper Left Quadrant (21-28) */}
                    <div className="flex gap-1.5 pl-4">
                        {UPPER_ADULT.slice(8, 16).map(num => (
                            <Tooth
                                key={num}
                                data={teeth.find(t => t.number === num)!}
                                onZoneClick={handleZoneClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Lower Arc */}
                <div className="flex justify-center gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-4 w-full overflow-x-auto pb-4">
                    {/* Lower Right Quadrant (48-41) */}
                    <div className="flex gap-1.5 justify-end pr-4 border-r-2 border-dashed border-electric/30">
                        {LOWER_ADULT.slice(0, 8).map(num => (
                            <Tooth
                                key={num}
                                data={teeth.find(t => t.number === num)!}
                                onZoneClick={handleZoneClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                    {/* Lower Left Quadrant (31-38) */}
                    <div className="flex gap-1.5 pl-4">
                        {LOWER_ADULT.slice(8, 16).map(num => (
                            <Tooth
                                key={num}
                                data={teeth.find(t => t.number === num)!}
                                onZoneClick={handleZoneClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
