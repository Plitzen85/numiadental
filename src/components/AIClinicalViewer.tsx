import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanFace, Activity, X, Upload, Layers, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface AIClinicalViewerProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
}

type TabType = 'smile' | 'xray';

export const AIClinicalViewer: React.FC<AIClinicalViewerProps> = ({ isOpen, onClose, patientName }) => {
    const [activeTab, setActiveTab] = useState<TabType>('smile');
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);
    const [sliderValue, setSliderValue] = useState(50);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening/closing or switching tabs
    useEffect(() => {
        if (isOpen) {
            setImage(null);
            setIsProcessing(false);
            setIsProcessed(false);
            setSliderValue(50);
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setIsProcessed(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = () => {
        if (!image) return;
        setIsProcessing(true);
        // Simulate AI processing delay
        setTimeout(() => {
            setIsProcessing(false);
            setIsProcessed(true);
        }, 2500);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-cobalt/95 backdrop-blur-xl font-syne"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-premium/5 pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                    className="relative w-full max-w-5xl h-[85vh] bg-japandi-charcoal border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-electric/10 flex items-center justify-center border border-electric/20">
                                <Sparkles className="w-6 h-6 text-electric" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    NÜMIA AI Clinical Hub
                                </h2>
                                <p className="text-xs text-clinical/60 uppercase tracking-widest font-sans mt-1">
                                    Paciente: <span className="text-electric">{patientName}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            title="Cerrar visor"
                            aria-label="Cerrar visor"
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden font-sans">
                        {/* Sidebar */}
                        <div className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col gap-4">
                            <button
                                onClick={() => setActiveTab('smile')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'smile'
                                    ? 'bg-electric/20 text-electric border border-electric/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                                    : 'bg-white/5 text-clinical/70 hover:bg-white/10 hover:text-white border border-transparent'
                                    }`}
                            >
                                <ScanFace className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold text-sm">Simulador de Sonrisa</p>
                                    <p className="text-[9px] uppercase tracking-widest opacity-70 mt-0.5">Diseño Estético</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('xray')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'xray'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    : 'bg-white/5 text-clinical/70 hover:bg-white/10 hover:text-white border border-transparent'
                                    }`}
                            >
                                <Activity className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold text-sm">Analizador Rayos X</p>
                                    <p className="text-[9px] uppercase tracking-widest opacity-70 mt-0.5">Detección de Patologías</p>
                                </div>
                            </button>

                            <div className="mt-auto">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-electric" /> Precisión NÜMIA AI
                                    </h4>
                                    <p className="text-[10px] text-clinical/50 leading-relaxed mb-3">
                                        Nuestros modelos están entrenados con más de 1.5M de estudios clínicos para proporcionar soporte diagnóstico y simulaciones realistas.
                                    </p>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-gradient-to-r from-electric to-purple-500 w-[95%] h-full rounded-full"></div>
                                    </div>
                                    <p className="text-[9px] text-right mt-1 text-electric font-bold">95% Confianza</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Work Area */}
                        <div className="flex-1 p-8 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent">
                            {!image ? (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl bg-black/10 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-full bg-electric/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,212,255,0.1)] group-hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                                        <Upload className="w-8 h-8 text-electric" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 font-syne">
                                        Cargar {activeTab === 'smile' ? 'Fotografía Frontal' : 'Radiografía Panorámica'}
                                    </h3>
                                    <p className="text-clinical/50 text-sm max-w-sm text-center mb-6">
                                        Sube un archivo de alta resolución para que el motor de NÜMIA AI pueda analizarlo y generar resultados precisos.
                                    </p>
                                    <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                                        Explorar Archivos
                                    </button>
                                    <input title="Cargar archivo" aria-label="Cargar archivo" type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-black/30 overflow-hidden relative">
                                    {/* Toolbar */}
                                    <div className="h-14 border-b border-white/10 bg-white/5 flex items-center justify-between px-6 z-20 absolute top-0 w-full backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setImage(null)} className="text-xs text-clinical/60 hover:text-white transition-colors flex items-center gap-1">
                                                <X className="w-3 h-3" /> Descartar Imagen
                                            </button>
                                        </div>
                                        {!isProcessed && !isProcessing && (
                                            <button onClick={handleProcess} className={`px-5 py-1.5 font-bold text-sm rounded-lg text-cobalt flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 ${activeTab === 'smile' ? 'bg-electric' : 'bg-purple-500'}`}>
                                                <Sparkles className="w-4 h-4" /> Ejecutar NÜMIA AI
                                            </button>
                                        )}
                                        {isProcessed && (
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                                <CheckCircle2 className="w-3 h-3" /> Análisis Completo
                                            </span>
                                        )}
                                    </div>

                                    {/* Image Container */}
                                    <div className="flex-1 relative flex items-center justify-center p-6 mt-14">
                                        {activeTab === 'smile' ? (
                                            // SMILE SIMULATOR
                                            <div className="relative w-full h-full max-h-full flex items-center justify-center overflow-hidden rounded-xl bg-black">
                                                <div className="relative h-full aspect-[4/3] md:aspect-auto md:w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                                                    {/* ORIGINAL IMAGE (Background) */}
                                                    <img src={image} alt="Original Patient" className="absolute inset-0 w-full h-full object-cover" />

                                                    {/* PROCESSED IMAGE overlay */}
                                                    {isProcessed && (
                                                        <>
                                                            <div
                                                                className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-2 border-electric"
                                                                style={{ width: `${sliderValue}%` }}
                                                            >
                                                                {/* Simulated "After" Image - using CSS filters to whiten/brighten area to simulate veneers/whitening */}
                                                                <img
                                                                    src={image}
                                                                    alt="Simulated Result"
                                                                    className="absolute top-0 left-0 min-w-max h-full object-cover w-[calc(100vw*0.7)] [filter:brightness(1.1)_contrast(1.05)_saturate(1.1)_hue-rotate(-2deg)]"
                                                                />
                                                                {/* Mock AI smile overlay area (simulate brightened teeth) */}
                                                                <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>

                                                                <div className="absolute top-4 left-4 bg-electric text-cobalt px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                                    Después (Generado por IA)
                                                                </div>
                                                            </div>

                                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                                                                Antes
                                                            </div>

                                                            {/* Slider control */}
                                                            <div
                                                                className="absolute top-0 bottom-0 -ml-4 flex items-center justify-center cursor-ew-resize z-30 group"
                                                                style={{ left: `${sliderValue}%` }}
                                                            >
                                                                <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <div className="flex gap-0.5">
                                                                        <ChevronLeft className="w-3 h-3 text-electric" />
                                                                        <ChevronRight className="w-3 h-3 text-electric" />
                                                                    </div>
                                                                </div>
                                                                <input
                                                                    title="Simulador Antes/Después"
                                                                    type="range"
                                                                    min="0" max="100"
                                                                    value={sliderValue}
                                                                    onChange={(e) => setSliderValue(Number(e.target.value))}
                                                                    className="absolute inset-0 opacity-0 cursor-ew-resize w-16 -ml-4"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // X-RAY ANALYZER
                                            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-black">
                                                <div className="relative h-full w-full max-w-5xl mx-auto flex items-center justify-center">
                                                    <img src={image} alt="X-Ray Image" className={`max-w-full max-h-full object-contain transition-all duration-1000 ${isProcessed ? 'filter grayscale brightness-75 contrast-125' : ''}`} />

                                                    {/* Simulated AI Overlays */}
                                                    {isProcessed && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                            <div className="relative w-[80%] h-[70%]">
                                                                {/* Mock bounding boxes representing detected issues */}
                                                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8 }} className="absolute top-[30%] left-[20%] w-16 h-20 border-2 border-red-500 bg-red-500/10 rounded-lg flex items-start justify-end p-1 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                                                    <div className="bg-red-500 text-white text-[8px] font-bold px-1 rounded flex items-center gap-0.5"><AlertTriangle className="w-2 h-2" /> 92% Caries Profunda</div>
                                                                </motion.div>

                                                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.1 }} className="absolute bottom-[20%] right-[30%] w-24 h-16 border-2 border-yellow-500 bg-yellow-500/10 rounded-lg flex items-start justify-start p-1 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                                                                    <div className="bg-yellow-500 text-black text-[8px] font-bold px-1 rounded flex items-center gap-0.5"><Activity className="w-2 h-2" /> 78% Pérdida Ósea</div>
                                                                </motion.div>

                                                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.4 }} className="absolute top-[20%] right-[15%] w-12 h-14 border-2 border-blue-400 bg-blue-400/10 rounded-lg flex items-start justify-end p-1 shadow-[0_0_15px_rgba(96,165,250,0.4)]">
                                                                    <div className="bg-blue-400 text-cobalt text-[8px] font-bold px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2" /> Tratamiento Endodóntico Previo</div>
                                                                </motion.div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Scanner Animation */}
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-cobalt/40 backdrop-blur-[2px] z-30 overflow-hidden flex flex-col items-center justify-center">
                                                <div className="w-full absolute top-0 h-1 bg-gradient-to-r from-transparent via-electric to-transparent blur-[2px] animate-scan shadow-[0_0_20px_#00D4FF]"></div>
                                                <div className="w-full absolute top-0 h-1bg-electric opacity-50 animate-scan"></div>

                                                <div className="w-24 h-24 rounded-full border-t-2 border-b-2 border-electric animate-spin flex items-center justify-center mb-6">
                                                    <div className="w-16 h-16 rounded-full border-l-2 border-r-2 border-purple-500 animate-spin-reverse flex items-center justify-center">
                                                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                                    </div>
                                                </div>
                                                <h3 className="font-syne text-2xl font-bold text-white tracking-widest uppercase mb-2 text-center">
                                                    Analizando Morfología
                                                </h3>
                                                <p className="text-sm font-mono text-electric opacity-80 animate-pulse text-center">
                                                    Aplicando modelos de visión computacional...
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Info Data */}
                                    {isProcessed && activeTab === 'xray' && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-0 w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 z-20">
                                            <div className="flex gap-6 max-w-4xl mx-auto">
                                                <div className="flex-1">
                                                    <h4 className="text-[10px] text-clinical/50 uppercase tracking-widest font-bold mb-2">Hallazgos Primarios (Generados por IA)</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> P. 46, 47 - Posible compromiso pulpar</span>
                                                        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-xs rounded-lg flex items-center gap-1"><Activity className="w-3 h-3" /> Reabsorción ósea moderada sector anteroinferior</span>
                                                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Implantes integrados P. 14, 15</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
