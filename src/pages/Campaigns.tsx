import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCampaign } from '../lib/mockApi';
import { useMarket } from '../context/MarketContext';
import { Sparkles, Megaphone, Copy, Target, TrendingUp, Upload, X, FileText, Printer, Building2, MessageSquare, CheckCircle } from 'lucide-react';

const SalesScriptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    script: any;
}> = ({ isOpen, onClose, script }) => {
    if (!isOpen) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copiado al portapapeles");
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cobalt/90 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-cobalt border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h2 className="font-syne text-xl text-electric flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Guiones de Ventas IA
                        </h2>
                        <button title="Cerrar modal" aria-label="Cerrar modal" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-clinical/60" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs text-clinical/40 uppercase tracking-widest font-bold">
                                <span>WhatsApp / Mensajería</span>
                                <button onClick={() => copyToClipboard(script.whatsapp)} className="text-electric hover:underline flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copiar
                                </button>
                            </div>
                            <pre className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-clinical/80 whitespace-pre-wrap font-sans">
                                {script.whatsapp}
                            </pre>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs text-clinical/40 uppercase tracking-widest font-bold">
                                <span>Email / Propuesta</span>
                                <button onClick={() => copyToClipboard(script.email)} className="text-electric hover:underline flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copiar
                                </button>
                            </div>
                            <pre className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-clinical/80 whitespace-pre-wrap font-sans">
                                {script.email}
                            </pre>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const BrochurePreview: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: any;
    clinic: any;
    media: string | null;
}> = ({ isOpen, onClose, data, clinic, media }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-cobalt/95 backdrop-blur-md print:bg-white print:p-0 print:block"
            >
                <style>{`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body * { visibility: hidden !important; }
                        .print-ready, .print-ready * { visibility: visible !important; }
                        .print-ready { 
                            position: fixed !important; 
                            left: 0 !important; 
                            top: 0 !important; 
                            width: 210mm !important; 
                            height: 297mm !important;
                            margin: 0 !important;
                            padding: 20mm !important;
                            background: white !important;
                            color: black !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print { display: none !important; }
                    }
                `}</style>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="bg-white w-full max-w-[210mm] h-full md:h-[297mm] overflow-y-auto rounded-none md:rounded-2xl flex flex-col shadow-2xl print-ready"
                >
                    {/* Toolbar - Hidden when printing */}
                    <div className="bg-clinical/5 border-b p-4 flex justify-between items-center no-print">
                        <h2 className="font-syne text-clinical font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-electric" /> Brochure de Marketing Premium
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="bg-electric text-cobalt px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all">
                                <Printer className="w-4 h-4" /> Exportar / Imprimir
                            </button>
                            <button title="Cerrar modal" aria-label="Cerrar modal" onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-white text-gray-900 font-sans p-[15mm] md:p-[20mm] relative">
                        {/* Luxury Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 rounded-bl-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-premium/5 rounded-tr-full pointer-events-none"></div>

                        <div className="relative z-10">
                            {/* Header Branding */}
                            <div className="flex justify-between items-start mb-16 border-b border-gray-100 pb-10">
                                <div className="space-y-4">
                                    {clinic?.logo ? (
                                        <img src={clinic.logo} alt="Logo" className="h-16 object-contain" />
                                    ) : (
                                        <div className="flex items-center gap-3 text-electric">
                                            <Building2 className="w-12 h-12" />
                                            <span className="font-syne font-bold text-2xl tracking-tighter uppercase italic">NÜMIA</span>
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-2xl font-bold text-clinical font-syne tracking-tight">{clinic?.nombre || 'Mi Clínica Dental'}</h1>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-medium">{clinic?.direccion}</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-bold text-electric uppercase tracking-[0.3em]">Propuesta Estratégica</p>
                                    <p className="text-[9px] text-gray-300 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Main Title Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-16">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <span className="bg-electric/10 text-electric px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest leading-none inline-block">Innovación Dental</span>
                                        <h2 className="text-5xl font-syne font-bold text-clinical leading-[1.1] tracking-tighter">
                                            {data.title}
                                        </h2>
                                        <p className="text-xl text-gray-500 font-light leading-relaxed">
                                            {data.subtitle}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {data.features.map((f: any, i: number) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:border-electric/30 transition-colors">
                                                    <CheckCircle className="w-5 h-5 text-electric" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-clinical text-base">{f.title}</p>
                                                    <p className="text-sm text-gray-400 leading-snug">{f.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-0 bg-electric/10 rounded-[2.5rem] blur-2xl group-hover:bg-electric/20 transition-all duration-500 opacity-50"></div>
                                    <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[12px] border-white">
                                        {media ? (
                                            <img src={media} alt="Campaign Media" className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-4">
                                                <Megaphone className="w-24 h-24 opacity-20 animate-pulse" />
                                                <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-30">Visual Showcase</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 bg-clinical text-white p-8 rounded-[2rem] shadow-2xl max-w-[220px] transform hover:scale-105 transition-transform">
                                        <div className="w-10 h-10 bg-electric/20 rounded-full flex items-center justify-center mb-4">
                                            <Sparkles className="w-5 h-5 text-electric" />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-widest mb-2 text-electric/80">Lanzamiento Exclusivo</p>
                                        <p className="text-sm font-medium leading-relaxed">Descubre una nueva forma de cuidar tu sonrisa con tecnología NÜMIA.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits Bar */}
                            <div className="grid grid-cols-3 gap-8 mb-16 py-10 border-y border-gray-50">
                                {data.benefits.map((b: string, i: number) => (
                                    <div key={i} className="text-center space-y-2">
                                        <div className="text-[10px] font-black text-electric uppercase tracking-widest opacity-40">0{i + 1}</div>
                                        <p className="text-xs font-bold text-clinical px-4 leading-relaxed">{b}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Footer CTA */}
                            <div className="bg-gray-50 p-10 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric/30 to-transparent"></div>
                                <h3 className="text-xl font-syne font-bold text-clinical uppercase tracking-widest">
                                    {data.cta}
                                </h3>
                                <p className="text-sm text-gray-400 max-w-md">Para más información o para agendar tu cita de valoración premium, contáctanos hoy mismo.</p>
                                <div className="mt-2 font-syne text-clinical font-black tracking-[0.2em] text-[10px] border-b border-clinical/20 pb-1 uppercase italic">
                                    AURA DENTAL GLOBAL NETWORK
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const Campaigns: React.FC = () => {
    const { intelligence, clinicProfile } = useMarket();
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isScriptOpen, setIsScriptOpen] = useState(false);
    const [isBrochureOpen, setIsBrochureOpen] = useState(false);
    const [media, setMedia] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [params, setParams] = useState({
        clinica: clinicProfile?.nombre || 'Mi Clínica',
        direccion: clinicProfile?.direccion || '',
        servicio: intelligence.topService !== 'N/A' ? intelligence.topService : 'Implantes',
        presupuesto: 5000,
        publico: 'Adultos 30-50',
        canal: 'Meta Ads (IG/FB)',
        tono: 'Profesional y Lujoso'
    });

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMedia(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setResult(null);
        try {
            const res = await generateCampaign(params);
            setResult(res);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <Megaphone className="text-electric w-8 h-8" />
                <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text">
                    Generador de Campañas
                </h1>
            </div>
            <p className="text-clinical/60">Crea campañas publicitarias de alta conversión basadas en inteligencia de mercado local.</p>

            {/* SEO Trends Banner */}
            <div className="bg-gradient-to-r from-electric/10 to-premium/5 border border-electric/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-electric/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
                    <div>
                        <h2 className="font-syne text-lg text-white flex items-center gap-2 font-bold mb-1">
                            <TrendingUp className="w-5 h-5 text-electric" /> Tendencias SEO 2025 (Riviera Maya)
                        </h2>
                        <p className="text-sm text-clinical/70">Top búsquedas orgánicas en Cancún y Playa del Carmen. Haz clic para autocompletar.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setParams({ ...params, servicio: 'Implantes Dentales GBR', publico: 'Adultos 40-65 (Extranjeros/Locales)', canal: 'Google Ads' })}
                            className="bg-cobalt border border-white/10 hover:border-electric/50 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-white"
                        >
                            <span className="text-electric font-black">#1</span> Implantes Dentales
                        </button>
                        <button
                            onClick={() => setParams({ ...params, servicio: 'Diseño de Sonrisa Digital (DSD)', publico: 'Adultos Jóvenes 25-45', canal: 'Meta Ads (IG/FB)' })}
                            className="bg-cobalt border border-white/10 hover:border-premium/50 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-white"
                        >
                            <span className="text-premium font-black">#2</span> Odontología Estética
                        </button>
                        <button
                            onClick={() => setParams({ ...params, servicio: 'Ortodoncia Invisible (Alineadores)', publico: 'Jóvenes y Adultos 20-40', canal: 'TikTok Ads' })}
                            className="bg-cobalt border border-white/10 hover:border-blue-400/50 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-white"
                        >
                            <span className="text-blue-400 font-black">#3</span> Ortodoncia Invisible
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Input Form */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 h-min space-y-6">
                    <h2 className="font-syne text-xl text-clinical flex items-center gap-2">
                        <Target className="w-5 h-5 text-electric" /> Configuración Estratégica
                    </h2>

                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl border border-dashed border-white/20 group hover:border-electric/50 transition-colors cursor-pointer relative">
                            {media ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                    <img src={media} alt="Media" className="w-full h-full object-cover" />
                                    <button title="Eliminar imagen" aria-label="Eliminar imagen" onClick={() => setMedia(null)} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white shadow-lg">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-clinical/30 group-hover:text-electric transition-colors" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-clinical/60">Sube Imágenes o Videos</p>
                                        <p className="text-[10px] text-clinical/40 uppercase tracking-widest">Formatos: JPG, PNG, MP4</p>
                                    </div>
                                </>
                            )}
                            <input title="Campo" type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Nombre de Clínica</label>
                                <input title="Campo" type="text" value={params.clinica} onChange={e => setParams({ ...params, clinica: e.target.value })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Servicio</label>
                                <input title="Campo" type="text" value={params.servicio} onChange={e => setParams({ ...params, servicio: e.target.value })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Presupuesto (MXN)</label>
                                <input title="Campo" type="number" value={params.presupuesto} onChange={e => setParams({ ...params, presupuesto: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Canal Principal</label>
                                <select title="Opciones" value={params.canal} onChange={e => setParams({ ...params, canal: e.target.value })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric transition-colors appearance-none">
                                    <option>Meta Ads (IG/FB)</option>
                                    <option>Google Ads</option>
                                    <option>TikTok Ads</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full mt-4 bg-gradient-to-r from-electric to-blue-500 hover:opacity-90 text-cobalt font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                        >
                            {isGenerating ? (
                                <>Generando vía IA <span className="w-5 h-5 rounded-full border-2 border-cobalt border-t-transparent animate-spin ml-2"></span></>
                            ) : (
                                <>Generar Campaña <Sparkles className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Output Results */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 relative min-h-[500px]">
                    {!result && !isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-clinical/30 px-10 text-center">
                            <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                            <p>Configura los parámetros a la izquierda y presiona Generar para crear una campaña optimizada.</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 border-4 border-white/5 border-t-electric rounded-full animate-spin mb-4 shadow-[0_0_15px_#00D4FF]"></div>
                            <p className="text-electric font-syne animate-pulse tracking-wide">Sintetizando copy y optimizando keywords...</p>
                        </div>
                    )}

                    {result && !isGenerating && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h2 className="font-syne text-xl text-electric uppercase tracking-tighter italic">Resultados de IA</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsScriptOpen(true)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-clinical/70 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold border border-white/10">
                                        <MessageSquare className="w-4 h-4 text-electric" /> Guiones
                                    </button>
                                    <button onClick={() => setIsBrochureOpen(true)} className="flex items-center gap-2 bg-electric/10 hover:bg-electric/20 text-electric px-3 py-1.5 rounded-lg transition-colors text-xs font-bold border border-electric/20">
                                        <FileText className="w-4 h-4" /> Brochure
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-xs text-clinical/60 uppercase tracking-widest mb-2 font-bold flex items-center gap-2">Headlines Sugeridos <span className="bg-electric/20 text-electric px-2 py-0.5 rounded text-[10px] ml-auto">Efectividad Alta</span></h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        {result.headlines.map((h: string, i: number) => <li key={i}>{h}</li>)}
                                    </ul>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-xs text-clinical/60 uppercase tracking-widest mb-2 font-bold">Copy Publicitario</h4>
                                    <p className="text-sm text-clinical leading-relaxed">{result.longCopy}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <h4 className="text-xs text-clinical/60 uppercase tracking-widest mb-2 font-bold">Hashtags IA</h4>
                                        <p className="text-xs text-electric/70 font-mono">{result.hashtags.join(' ')}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <h4 className="text-xs text-emerald-400/80 uppercase tracking-widest mb-1 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ROI Proyectado</h4>
                                        <p className="text-2xl font-syne text-emerald-400 font-bold">340%</p>
                                        <p className="text-[10px] text-emerald-400/60 mt-1">Estimación basada en zona</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <SalesScriptModal isOpen={isScriptOpen} onClose={() => setIsScriptOpen(false)} script={result?.salesScript} />
            <BrochurePreview isOpen={isBrochureOpen} onClose={() => setIsBrochureOpen(false)} data={result?.brochureData} clinic={clinicProfile} media={media} />
        </motion.div>
    );
};
