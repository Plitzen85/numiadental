import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDentalTourismPackage } from '../lib/mockApi';
import { useMarket } from '../context/MarketContext';
import { Plane, Calculator, Globe, CheckCircle, FileText, Printer, Building2, MessageSquare, ChevronLeft, X, ShieldCheck } from 'lucide-react';

const SalesScriptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: any;
    lang: 'es' | 'en';
    setLang: (l: 'es' | 'en') => void;
}> = ({ isOpen, onClose, data, lang, setLang }) => {
    if (!isOpen || !data) return null;

    const content = data[lang];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-cobalt/95 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-cobalt border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-cobalt z-10">
                        <div className="flex items-center gap-4">
                            <button title="Regresar" aria-label="Regresar" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-clinical/60 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="font-syne text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-electric" /> Script y Herramientas de Venta
                            </h2>
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button onClick={() => setLang('es')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'es' ? 'bg-japandi-charcoal text-japandi-beige' : 'text-clinical/60 hover:text-clinical'}`}>ESPAÑOL</button>
                            <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-japandi-charcoal text-japandi-beige' : 'text-clinical/60 hover:text-clinical'}`}>ENGLISH</button>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Scripts section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-electric uppercase tracking-widest">WhatsApp / Chat Script</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
                                    {content.script.whatsapp}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-premium uppercase tracking-widest">Email Structure</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
                                    {content.script.email}
                                </div>
                            </div>
                        </div>

                        {/* FAQ and Objections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-clinical uppercase tracking-widest flex items-center gap-2">
                                    FAQs para Pacientes Extranjeros
                                </h3>
                                {content.faq.map((item: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <p className="text-sm font-bold text-electric">Q: {item.q}</p>
                                        <p className="text-sm text-clinical/60 italic border-l-2 border-white/10 pl-4">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-clinical uppercase tracking-widest flex items-center gap-2">
                                    Manejo de Objeciones
                                </h3>
                                {content.objections.map((item: any, i: number) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-sm font-bold text-premium mb-2">Objeción: "{item.o}"</p>
                                        <p className="text-sm text-clinical/80 font-medium">Respuesta Pro: {item.r || item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const DocumentPreview: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: any;
    params: any;
    clinic: any;
    lang: 'es' | 'en';
    setLang: (l: 'es' | 'en') => void;
}> = ({ isOpen, onClose, data, params, clinic, lang, setLang }) => {
    if (!isOpen || !data) return null;

    const content = data[lang] || data.es;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-japandi-charcoal/30 backdrop-blur-xl overflow-y-auto overflow-x-hidden print:absolute print:inset-0 print:w-full print:h-auto print:overflow-visible print:block print:bg-white print:p-0 print:m-0"
            >
                <div className="fixed inset-0 print:hidden" onClick={onClose}></div>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="relative bg-japandi-sand w-full max-w-[210mm] min-h-screen md:min-h-0 md:h-[90vh] overflow-y-auto overflow-x-hidden rounded-none md:rounded-[2.5rem] flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] transition-all print:block print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none print:min-h-0 print:h-auto print:max-h-none print:overflow-visible print:rounded-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Premium Sticky Toolbar */}
                    <div className="sticky top-0 z-[120] bg-white/80 backdrop-blur-md border-b border-japandi-charcoal/5 p-4 md:p-6 flex justify-between items-center no-print shadow-sm">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-4 py-2 bg-japandi-charcoal text-japandi-beige hover:brightness-125 rounded-xl transition-all group font-black uppercase text-[10px] tracking-widest active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                {lang === 'es' ? 'REGRESAR' : 'BACK'}
                            </button>
                            <div className="h-8 w-px bg-japandi-charcoal/10 hidden md:block" />
                            <div className="hidden lg:flex flex-col">
                                <span className="text-[9px] font-black text-japandi-charcoal/40 uppercase tracking-[0.3em] leading-none mb-1">{lang === 'es' ? 'DOCUMENTO EXCLUSIVO' : 'EXCLUSIVE DOCUMENT'}</span>
                                <h2 className="font-syne text-japandi-charcoal font-black text-xs uppercase tracking-[0.2em]">{lang === 'es' ? 'Propuesta VIP' : 'VIP Proposal'} — {params.tratamiento}</h2>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="hidden sm:flex bg-japandi-charcoal/5 rounded-xl p-1 border border-japandi-charcoal/5">
                                <button onClick={() => setLang('es')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${lang === 'es' ? 'bg-japandi-wood text-white shadow-md' : 'text-japandi-charcoal/40 hover:text-japandi-charcoal'}`}>ES</button>
                                <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${lang === 'en' ? 'bg-japandi-wood text-white shadow-md' : 'text-japandi-charcoal/40 hover:text-japandi-charcoal'}`}>EN</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => window.print()} className="bg-japandi-charcoal text-white h-10 w-10 sm:w-auto sm:px-5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-japandi-charcoal/90 transition-all text-[10px] tracking-widest shadow-md active:scale-95" title="PDF / Print">
                                    <Printer className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
                                </button>
                                <button onClick={() => alert(lang === 'es' ? 'Funcionalidad de correo próximamente' : 'Email functionality coming soon')} className="bg-japandi-wood text-white h-10 w-10 rounded-xl font-black flex items-center justify-center hover:brightness-110 transition-all shadow-md active:scale-95" title="Email">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                    title="Cerrar vista previa"
                                    aria-label="Cerrar vista previa"
                                    onClick={onClose}
                                    className="h-10 w-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Document Body - STRICT A4 PRINT BOUNDARIES */}
                    <div className="flex-1 bg-white relative mx-auto shadow-inner overflow-hidden w-full md:w-[210mm] min-h-[297mm] bg-japandi-sand/5 print:w-full print:max-w-none print:min-h-0 print:h-auto print:m-0 print:p-0 print:shadow-none print:overflow-visible print:block print-color-exact [print-color-adjust:exact]">
                        {/* Elegant Print Accents */}
                        <div className="absolute top-0 right-0 w-64 h-2 bg-japandi-wood/80 no-print"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-2 bg-japandi-wood/80 no-print"></div>

                        <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-12 print:p-0 print:h-auto print:block">
                            {/* 1. Header & ID Section */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b-2 border-japandi-charcoal/10 pb-10 print:flex-row">
                                <div className="space-y-8 flex-1">
                                    {clinic?.logo ? (
                                        <div className="p-2 border-l-4 border-japandi-wood bg-japandi-sand/30 inline-block rounded-r-xl">
                                            <img src={clinic.logo} alt="Logo" className="h-[70px] object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 text-japandi-wood">
                                            <Building2 className="w-16 h-16" />
                                            <span className="font-syne font-black text-2xl tracking-tighter uppercase">{clinic?.nombre || 'HEALTH CLINIC'}</span>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h1 className="text-3xl font-black text-japandi-charcoal font-syne tracking-tighter leading-none uppercase">{clinic?.nombre}</h1>
                                        <p className="text-[9px] text-japandi-charcoal/80 print:text-japandi-charcoal uppercase tracking-[0.25em] font-black max-w-xs leading-tight italic">{clinic?.direccion}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end shrink-0 gap-6">
                                    <span className="bg-japandi-charcoal text-japandi-beige px-8 py-3 rounded-full text-[10px] uppercase font-black tracking-[0.4em] shadow-lg">CONFIDENCIAL</span>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-japandi-charcoal/60 print:text-japandi-charcoal uppercase tracking-[0.3em] mb-1">{lang === 'es' ? 'ID DE PROPUESTA' : 'PROPOSAL ID'}</p>
                                        <p className="font-syne text-japandi-charcoal font-black text-sm tracking-widest italic flex items-center gap-2 justify-end">
                                            <span className="w-8 h-px bg-japandi-charcoal/40 print:bg-japandi-charcoal"></span>
                                            PX-{Math.random().toString(36).substring(7).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Visual Intro & Treatment */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch print:grid print:grid-cols-12 print:gap-16">
                                <div className="lg:col-span-12 border-l-[8px] border-japandi-wood pl-10 py-3 bg-japandi-sand/10 rounded-r-[2rem] print:col-span-12">
                                    <h2 className="text-3xl md:text-4xl font-syne font-black text-japandi-charcoal tracking-tighter leading-none uppercase mb-4 drop-shadow-sm">
                                        PREMIUM DENTAL<br />EXPERIENCE
                                    </h2>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <span className="bg-japandi-charcoal text-white px-6 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase shadow-lg inline-block">
                                            {params.tratamiento}
                                        </span>
                                        <div className="h-px w-12 bg-japandi-wood/30"></div>
                                        <span className="text-[9px] text-japandi-charcoal/80 print:text-japandi-charcoal font-black uppercase tracking-widest leading-none">Excellence Guaranteed</span>
                                    </div>
                                </div>

                                <div className="lg:col-span-6 space-y-10 flex flex-col justify-between print:col-span-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-japandi-wood uppercase tracking-[0.4em] flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-japandi-charcoal" /> {lang === 'es' ? 'FILOSOFÍA DE ATENCIÓN' : 'CARE PHILOSOPHY'}
                                        </h3>
                                        <p className="text-[13px] text-japandi-charcoal/90 font-medium leading-relaxed italic border-l-2 border-japandi-sand pl-6">
                                            {lang === 'es'
                                                ? 'Nuestra metodología integra la precisión tecnológica con una estética minimalista. Su tratamiento ha sido diseñado no solo para restaurar su sonrisa, sino para elevar su bienestar integral en un entorno de lujo y serenidad.'
                                                : 'Our methodology integrates technological precision with a minimalist aesthetic. Your treatment has been designed not only to restore your smile but to elevate your overall well-being in an environment of luxury and serenity.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4 bg-japandi-sand/20 p-6 rounded-2xl border border-japandi-charcoal/5 print:border-japandi-charcoal/20">
                                        <h4 className="text-[9px] font-black text-japandi-charcoal/80 print:text-japandi-charcoal uppercase tracking-[0.4em] pb-3 border-b border-japandi-charcoal/20 flex justify-between items-center">
                                            {lang === 'es' ? 'LOGÍSTICA PREVISTA' : 'PLANNED LOGISTICS'}
                                            <span className="text-japandi-wood font-black print:text-japandi-charcoal">2025 SERIES</span>
                                        </h4>
                                        <div className="space-y-4">
                                            {content.itinerario.map((item: any, i: number) => (
                                                <div key={i} className="flex gap-6 group items-center">
                                                    <div className="w-6 h-6 rounded-lg bg-japandi-charcoal flex items-center justify-center text-white text-[9px] font-black shadow-md shrink-0">
                                                        {item.dia}
                                                    </div>
                                                    <div className="flex-1 border-b border-japandi-charcoal/5 pb-1">
                                                        <p className="text-[11px] text-japandi-charcoal font-black uppercase tracking-tight leading-tight">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-6 space-y-6 print:col-span-6">
                                    {/* Financial Breakdown Container - Refined for A4 width */}
                                    <div className="bg-japandi-sand/30 backdrop-blur-sm p-6 rounded-[2rem] border-2 border-japandi-charcoal/5 shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[380px] print:min-h-0 print:p-4 print:space-y-2">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-japandi-wood/5 rounded-full -mr-12 -mt-12"></div>
                                        <h3 className="text-[10px] font-black text-japandi-charcoal uppercase tracking-[0.3em] text-center mb-1 opacity-60 print:mb-0">{lang === 'es' ? 'PROYECTO DE INVERSIÓN' : 'INVESTMENT PROJECT'}</h3>

                                        <div className="space-y-4 flex-1 print:space-y-2">
                                            <div className="flex justify-between items-end border-b border-japandi-charcoal/10 pb-2 gap-4">
                                                <p className="text-[9px] text-japandi-charcoal/60 uppercase font-black tracking-widest leading-none shrink-0">{lang === 'es' ? 'CONSULTORÍA & MÉDICO' : 'CONSULTATION & MEDICAL'}</p>
                                                <p className="text-sm font-syne font-black text-japandi-charcoal tracking-tighter shrink-0">${data.costosEstimados.tratamiento.toLocaleString()} MXN</p>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-japandi-charcoal/10 pb-2 gap-4">
                                                <p className="text-[9px] text-japandi-charcoal/60 uppercase font-black tracking-widest leading-none shrink-0">{lang === 'es' ? 'LUJO & ESTANCIA' : 'LUXURY & STAY'}</p>
                                                <p className="text-sm font-syne font-black text-japandi-charcoal tracking-tighter shrink-0">${(data.costosEstimados.hospedaje + (data.costosEstimados.comida || 0)).toLocaleString()} MXN</p>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-japandi-charcoal/10 pb-2 gap-4">
                                                <p className="text-[9px] text-japandi-charcoal/60 uppercase font-black tracking-widest leading-none shrink-0">{lang === 'es' ? 'TRANSPORTE & VUELOS' : 'TRANSPORT & FLIGHTS'}</p>
                                                <p className="text-sm font-syne font-black text-japandi-charcoal tracking-tighter shrink-0">${((data.costosEstimados.avion || 0) + (data.costosEstimados.transporte || 0)).toLocaleString()} MXN</p>
                                            </div>

                                            <div className="pt-4 mt-auto">
                                                <div className="flex flex-col gap-1 mb-4 border-t border-japandi-charcoal/10 pt-4 print:mb-2 print:pt-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-japandi-charcoal/80 print:text-japandi-charcoal font-black uppercase tracking-[0.3em]">{lang === 'es' ? 'MONTO TOTAL' : 'GRAND TOTAL'}</p>
                                                        <p className="text-[8px] text-japandi-wood print:text-japandi-charcoal font-black tracking-[0.2em] italic uppercase">Tax Included / All-In</p>
                                                    </div>
                                                    <p className="text-2xl font-syne font-black text-japandi-charcoal tracking-tighter leading-none">${data.costosEstimados.total.toLocaleString()} MXN</p>
                                                </div>

                                                {/* Percentage Optimization Banner */}
                                                <div className="bg-japandi-charcoal text-japandi-beige p-4 md:p-6 rounded-[2rem] shadow-xl text-center relative overflow-hidden group print:p-3">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700 h-px w-px" />
                                                    <p className="text-[9px] uppercase font-black tracking-[0.4em] mb-2 opacity-80 print:opacity-100 leading-none">{lang === 'es' ? 'OPTIMIZACIÓN VS ORIGEN' : 'OPTIMIZATION VS ORIGIN'}</p>
                                                    <p className="text-3xl font-syne font-black text-japandi-beige mb-1 tracking-tighter leading-none">{data.ahorroPorcentaje}%</p>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">{lang === 'es' ? 'AHORRO PROYECTADO' : 'PROJECTED SAVINGS'}</p>
                                                    <div className="h-0.5 w-6 bg-japandi-wood mx-auto my-3 opacity-80 print:opacity-100 print:my-1.5 print:bg-japandi-beige"></div>
                                                    <p className="text-[8px] text-japandi-beige/80 print:text-japandi-beige font-bold uppercase tracking-[0.2em]">
                                                        {lang === 'es' ? 'Basado en' : 'Based on'} {params.ciudadOrigen.split(',')[0].toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Added Value & Signature Section */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-t-4 border-japandi-charcoal/10 items-end mt-auto print:grid print:grid-cols-12 print:mt-12">
                                <div className="md:col-span-7 space-y-6 print:col-span-7">
                                    <h4 className="text-[10px] font-black text-japandi-charcoal uppercase tracking-[0.4em] flex items-center gap-3">
                                        <div className="w-6 h-[2px] bg-japandi-wood" /> {lang === 'es' ? 'DIFERENCIAL DE SERVICIO' : 'SERVICE DIFFERENTIAL'}
                                    </h4>

                                    <div className="bg-japandi-sand/20 p-6 rounded-2xl">
                                        <p className="text-[10px] font-black text-japandi-charcoal/60 uppercase tracking-[0.3em] mb-4">{lang === 'es' ? 'CANALES DE ATENCIÓN DIRECTA' : 'DIRECT CARE CHANNELS'}</p>
                                        <div className="flex flex-col gap-3">
                                            {clinic?.telefono && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-japandi-wood text-sm">●</span>
                                                    <p className="text-[11px] font-black text-japandi-charcoal tracking-widest">{clinic.telefono}</p>
                                                </div>
                                            )}
                                            {clinic?.email && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-japandi-wood text-sm">●</span>
                                                    <p className="text-[11px] font-black text-japandi-charcoal tracking-widest uppercase">{clinic.email}</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Social Media Integration - Fixed Contrast */}
                                        <div className="flex gap-6 pt-4 mt-4 border-t border-japandi-charcoal/10">
                                            {clinic?.redesSociales?.facebook && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                    <span className="text-[10px] font-black text-japandi-charcoal tracking-widest uppercase">{clinic.redesSociales.facebook}</span>
                                                </div>
                                            )}
                                            {clinic?.redesSociales?.instagram && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                    <span className="text-[10px] font-black text-japandi-charcoal tracking-widest uppercase">{clinic.redesSociales.instagram}</span>
                                                </div>
                                            )}
                                            {clinic?.redesSociales?.whatsapp && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-japandi-charcoal tracking-widest uppercase">{clinic.redesSociales.whatsapp}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-5 flex flex-col items-end gap-6 text-right print:col-span-5">
                                    <div className="space-y-4 w-full max-w-[240px]">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-japandi-charcoal/50 tracking-[0.4em] uppercase">{lang === 'es' ? 'VALIDACIÓN DE CALIDAD' : 'QUALITY VALIDATION'}</p>
                                            <div className="py-2 border-b border-japandi-charcoal w-full">
                                                <p className="font-syne text-xl font-black text-japandi-charcoal uppercase tracking-tighter leading-none">{clinic?.medicoResponsable || 'EXCELLENCE'}</p>
                                            </div>
                                            <p className="text-[7px] text-japandi-wood font-black tracking-[0.3em] uppercase italic">{lang === 'es' ? 'Director Médico' : 'Medical Director'}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1.5 opacity-60">
                                            <ShieldCheck className="w-3 h-3 text-japandi-charcoal" />
                                            <span className="text-[6px] font-black text-japandi-charcoal uppercase tracking-widest">NÜMIA CERTIFIED PROTOCOL 2025</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const Tourism: React.FC = () => {
    const { clinicProfile } = useMarket();
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isScriptOpen, setIsScriptOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState<'es' | 'en'>('es');
    const [params, setParams] = useState({
        tratamiento: 'Implantes All-on-4',
        duracion: 4,
        ciudadOrigen: 'Los Angeles, USA',
        acompanantes: 1,
        costoTratamiento: 25000,
        tipoHospedaje: 'Departamento Estándar',
        costoHospedajeCustom: 0,       // per-night price for "Otra" option
        costoAvion: 6500,
        costoTransporte: 2000,
        costoComida: 2000,
        comisionPerc1: 0,
        nombreComision1: '',
        comisionPerc2: 0,
        nombreComision2: ''
    });

    // ── Locked treatment from catalog ──────────────────────────────────────
    const lockedTreatment = (clinicProfile?.catalogoExtra ?? []).find(
        t => t.name === params.tratamiento && t.price > 0
    ) ?? null;

    useEffect(() => {
        if (lockedTreatment) {
            setParams(prev => ({ ...prev, costoTratamiento: lockedTreatment.price }));
        }
    }, [params.tratamiento, clinicProfile?.catalogoExtra]);

    // ── Hospedaje from catalog ─────────────────────────────────────────────
    const catalogHosp = clinicProfile?.catalogoHospedaje ?? {};
    const hospedajeOptions: string[] = Object.keys(catalogHosp).length > 0
        ? Object.keys(catalogHosp)
        : ['Departamento Estándar', 'Departamento de Lujo', 'Casa', 'Hotel 5 Estrellas'];

    // Per-night price for selected option (null if __none__ / __otra__ / no catalog)
    const lockedHospedajePorNoche: number | null =
        params.tipoHospedaje !== '__none__' && params.tipoHospedaje !== '__otra__' && catalogHosp[params.tipoHospedaje] > 0
            ? catalogHosp[params.tipoHospedaje]
            : null;

    // Total hospedaje cost used in generation
    const computedCostoHospedaje: number = (() => {
        if (params.tipoHospedaje === '__none__') return 0;
        if (params.tipoHospedaje === '__otra__') return (params.costoHospedajeCustom || 0) * params.duracion;
        if (lockedHospedajePorNoche !== null) return lockedHospedajePorNoche * params.duracion;
        // Fallback hardcoded defaults
        const fallback: Record<string, number> = {
            'Departamento Estándar': 2500, 'Departamento de Lujo': 5000,
            'Casa': 7500, 'Hotel 5 Estrellas': 10000,
        };
        return (fallback[params.tipoHospedaje] ?? 2500) * params.duracion;
    })();

    // ── Transporte & Comida from catalog ───────────────────────────────────
    const catalogTrans = clinicProfile?.catalogoTransporte ?? {};
    const transporteUnitPrice = catalogTrans['Transportación'] ?? 0;
    const comidaPerDia = catalogTrans['Comida Wellness'] ?? 0;

    const lockedTransporte: number | null = transporteUnitPrice > 0 ? transporteUnitPrice * 2 : null;
    const lockedComida: number | null = comidaPerDia > 0 ? comidaPerDia * params.duracion : null;

    // Sync locked transport/comida into params so they're visible in the display
    useEffect(() => {
        setParams(prev => ({
            ...prev,
            ...(lockedTransporte !== null ? { costoTransporte: lockedTransporte } : {}),
            ...(lockedComida !== null ? { costoComida: lockedComida } : {}),
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transporteUnitPrice, comidaPerDia, params.duracion]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setResult(null);

        const finalParams = {
            ...params,
            costoHospedaje: computedCostoHospedaje,
            costoTransporte: lockedTransporte ?? params.costoTransporte,
            costoComida: lockedComida ?? params.costoComida,
        };

        try {
            const res = await generateDentalTourismPackage(finalParams);
            setResult(res);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="print:bg-white print:text-black">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 print:hidden">
                <div className="flex items-center gap-3">
                    <Plane className="text-electric w-8 h-8" />
                    <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text">
                        Constructor de Turismo Dental
                    </h1>
                </div>
                <p className="text-clinical/60">Diseña paquetes premium internacionales y calcula márgenes exactos.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Form */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 lg:col-span-1 h-min">
                        <h2 className="font-syne text-xl mb-6">Configuración del Paquete</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Tratamiento Principal</label>
                                <select title="Opciones" value={params.tratamiento} onChange={e => {
                                    const name = e.target.value;
                                    const matchedExtra = clinicProfile?.catalogoExtra?.find(t => t.name === name);
                                    setParams(prev => ({
                                        ...prev,
                                        tratamiento: name,
                                        ...(matchedExtra && matchedExtra.price > 0 ? { costoTratamiento: matchedExtra.price } : {}),
                                    }));
                                }} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric appearance-none">
                                    {clinicProfile?.catalogoExtra && clinicProfile.catalogoExtra.length > 0 ? (
                                        <optgroup label="Tratamientos de la Clínica">
                                            {clinicProfile.catalogoExtra.filter(t => t.name.trim()).map(t => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                        </optgroup>
                                    ) : (
                                        <>
                                            <optgroup label="Estética y Restauración">
                                                <option>Implantes All-on-4</option>
                                                <option>Implantes All-on-6</option>
                                                <option>Diseño de Sonrisa (Carillas)</option>
                                                <option>Carillas de Porcelana (Set 6)</option>
                                                <option>Carillas de Porcelana (Set 12)</option>
                                                <option>Rehabilitación Oral Completa</option>
                                                <option>Zirconia Bridges</option>
                                                <option>Coronas de E-Max</option>
                                                <option>Blanqueamiento Láser Pro</option>
                                            </optgroup>
                                            <optgroup label="Ortodoncia">
                                                <option>Ortodoncia Invisible (Invisalign)</option>
                                                <option>Brackets de Zafiro</option>
                                                <option>Brackets Metálicos Pro</option>
                                                <option>Ortodoncia Lingual</option>
                                                <option>Retenedores Estéticos</option>
                                            </optgroup>
                                            <optgroup label="Cirugía y Otros">
                                                <option>Elevación de Seno Maxilar</option>
                                                <option>Injerto de Hueso Dental</option>
                                                <option>Extracción Cordales (4 Muelas)</option>
                                                <option>Gingivectomía Estética</option>
                                                <option>Implante Unitario Titanio</option>
                                                <option>Cirugía de Encía (Injerto)</option>
                                                <option>Frenectomía Láser</option>
                                                <option>Endodoncia Multi-conducto</option>
                                                <option>Endodoncia + Corona Zirconia</option>
                                                <option>Limpieza Ultrasónica VIP</option>
                                                <option>Prótesis Total Removible</option>
                                                <option>Incrustación Onlay/Inlay</option>
                                                <option>Resinas Estéticas (Set 4)</option>
                                                <option>Tratamiento Periodontal Profundo</option>
                                                <option>Férula de Miorrelajación (Bruxismo)</option>
                                                <option>Poste de Fibra de Vidrio</option>
                                                <option>Prótesis Parcial Flexible</option>
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <h3 className="text-[10px] text-electric uppercase font-bold tracking-widest">Costos Variables (MXN)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-clinical/40 block mb-1">
                                            Tratamiento
                                            {lockedTreatment && <span className="ml-1 text-electric/60">(catálogo)</span>}
                                        </label>
                                        {lockedTreatment
                                            ? <div className="w-full bg-cobalt/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-clinical/60 cursor-not-allowed select-none">${lockedTreatment.price.toLocaleString('es-MX')}</div>
                                            : <input title="Campo" type="number" value={params.costoTratamiento} onChange={e => setParams({ ...params, costoTratamiento: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-3 py-1.5 text-sm text-clinical focus:border-electric" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-clinical/40 block mb-1">Hospedaje</label>
                                        <select title="Opciones" value={params.tipoHospedaje} onChange={e => setParams({ ...params, tipoHospedaje: e.target.value, costoHospedajeCustom: 0 })} className="w-full bg-cobalt border border-white/20 rounded-lg px-3 py-1.5 text-sm text-clinical focus:outline-none focus:border-electric appearance-none">
                                            <option value="__none__">Sin Hospedaje</option>
                                            <optgroup label="Catálogo">
                                                {hospedajeOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </optgroup>
                                            <option value="__otra__">Otra opción…</option>
                                        </select>
                                        {lockedHospedajePorNoche !== null && (
                                            <div className="mt-1 text-[10px] text-electric/60">
                                                ${lockedHospedajePorNoche.toLocaleString('es-MX')}/noche × {params.duracion} días = ${computedCostoHospedaje.toLocaleString('es-MX')}
                                            </div>
                                        )}
                                        {params.tipoHospedaje === '__otra__' && (
                                            <input
                                                title="Precio por noche"
                                                type="number" min={0}
                                                placeholder="Precio por noche"
                                                value={params.costoHospedajeCustom || ''}
                                                onChange={e => setParams({ ...params, costoHospedajeCustom: Number(e.target.value) })}
                                                className="mt-1 w-full bg-cobalt border border-electric/30 rounded-lg px-3 py-1.5 text-sm text-clinical focus:border-electric"
                                            />
                                        )}
                                        {params.tipoHospedaje === '__none__' && (
                                            <div className="mt-1 text-[10px] text-clinical/40">No se incluye hospedaje en el paquete</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-clinical/40 block mb-1">Avión</label>
                                        <input title="Campo" type="number" value={params.costoAvion} onChange={e => setParams({ ...params, costoAvion: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-3 py-1.5 text-sm text-clinical focus:border-electric" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-clinical/40 block mb-1">
                                            Transportación
                                            {lockedTransporte !== null && <span className="ml-1 text-electric/60">(catálogo ×2)</span>}
                                        </label>
                                        {lockedTransporte !== null
                                            ? <div className="w-full bg-cobalt/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-clinical/60 cursor-not-allowed select-none">${lockedTransporte.toLocaleString('es-MX')}</div>
                                            : <input title="Campo" type="number" value={params.costoTransporte} onChange={e => setParams({ ...params, costoTransporte: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-3 py-1.5 text-sm text-clinical focus:border-electric" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-clinical/40 block mb-1">
                                            Comida Wellness
                                            {lockedComida !== null && <span className="ml-1 text-electric/60">(catálogo ×días)</span>}
                                        </label>
                                        {lockedComida !== null
                                            ? <div className="w-full bg-cobalt/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-clinical/60 cursor-not-allowed select-none">${lockedComida.toLocaleString('es-MX')}</div>
                                            : <input title="Campo" type="number" value={params.costoComida} onChange={e => setParams({ ...params, costoComida: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-3 py-1.5 text-sm text-clinical focus:border-electric" />
                                        }
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Duración del Viaje (Días)</label>
                                <input title="Campo" type="number" min={1} value={params.duracion} onChange={e => setParams({ ...params, duracion: Number(e.target.value) })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                            </div>
                            <div>
                                <label className="text-xs text-clinical/60 block mb-1">Ciudad/País de Origen</label>
                                <input title="Campo" type="text" value={params.ciudadOrigen} onChange={e => setParams({ ...params, ciudadOrigen: e.target.value })} className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" placeholder="Ej. Los Angeles, USA" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-clinical/60 uppercase tracking-widest font-bold">Comisiones / Intermediarios</label>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <input title="Campo" type="text"
                                            placeholder="Nombre Intermediario 1"
                                            className="col-span-2 bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-xs text-clinical focus:outline-none focus:border-electric"
                                            value={params.nombreComision1 || ''}
                                            onChange={(e) => setParams({ ...params, nombreComision1: e.target.value })}
                                        />
                                        <input title="Campo" type="number"
                                            placeholder="%"
                                            className="bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-xs text-clinical focus:outline-none focus:border-electric"
                                            value={params.comisionPerc1 || ''}
                                            onChange={(e) => setParams({ ...params, comisionPerc1: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input title="Campo" type="text"
                                            placeholder="Nombre Intermediario 2"
                                            className="col-span-2 bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-xs text-clinical focus:outline-none focus:border-electric"
                                            value={params.nombreComision2 || ''}
                                            onChange={(e) => setParams({ ...params, nombreComision2: e.target.value })}
                                        />
                                        <input title="Campo" type="number"
                                            placeholder="%"
                                            className="bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-xs text-clinical focus:outline-none focus:border-electric"
                                            value={params.comisionPerc2 || ''}
                                            onChange={(e) => setParams({ ...params, comisionPerc2: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full mt-4 bg-white/5 border border-electric/50 hover:bg-electric/10 text-electric font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>Calculando márgenes... <span className="w-4 h-4 rounded-full border-2 border-electric border-t-transparent animate-spin ml-2"></span></>
                                ) : (
                                    <>Construir Paquete <Calculator className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 lg:col-span-2 relative min-h-[500px]">
                        {!result && !isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-clinical/30 text-center px-10">
                                <Globe className="w-16 h-16 mb-4 opacity-50" />
                                <p>El Motor Financiero calculará los márgenes dinámicos y la comparativa de precios internacionales.</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 flex space-x-2">
                                    <div className="w-3 h-3 bg-electric rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-3 h-3 bg-electric rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-3 h-3 bg-electric rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}

                        {result && !isGenerating && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="glass-card p-4 border border-white/10 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-500/20"></div>
                                        <p className="text-[10px] text-clinical/60 uppercase tracking-widest font-bold">Costo en {params.ciudadOrigen.split(',')[0]}</p>
                                        <p className="text-xl font-syne text-clinical/50 line-through mt-1">${result.comparativaVsOrigen.toLocaleString()} MXN</p>
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase">Promedio del mercado local</p>
                                    </div>
                                    <div className="glass-card p-4 border border-electric/30 bg-electric/5 text-center shadow-[0_0_15px_rgba(0,212,255,0.1)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-electric"></div>
                                        <p className="text-[10px] text-electric uppercase tracking-widest font-bold">Inversión Paquete NÜMIA</p>
                                        <p className="text-2xl font-syne text-electric font-bold mt-1">${result.costosEstimados.total.toLocaleString()} MXN</p>
                                        <p className="text-[9px] text-electric/60 mt-1 uppercase">Ahorro de ${(result.ahorroDinero).toLocaleString()} MXN</p>
                                    </div>
                                    <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-500/10 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Beneficio Directo</p>
                                        <p className="text-2xl font-syne text-emerald-400 font-bold mt-1">{result.ahorroPorcentaje}%</p>
                                        <p className="text-[9px] text-emerald-500/60 mt-1 uppercase">Mayor rentabilidad vs origen</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-syne text-premium mb-4 text-lg">{selectedLang === 'es' ? 'Itinerario Sugerido' : 'Suggested Itinerary'} ({params.duracion} días)</h3>
                                        <div className="space-y-3">
                                            {result[selectedLang].itinerario.map((day: any) => (
                                                <div key={day.dia} className="flex gap-3 text-sm">
                                                    <div className="min-w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-japandi-wood">D{day.dia}</div>
                                                    <p className="text-clinical relative top-1">{day.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 mt-4 md:mt-0">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <h3 className="text-xs text-clinical/60 uppercase tracking-widest mb-3 font-bold">{selectedLang === 'es' ? 'Desglose de inversión' : 'Investment Breakdown'}</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs text-clinical/80">
                                                    <span>{selectedLang === 'es' ? 'Tratamiento' : 'Treatment'}</span> <span>${result.costosEstimados.tratamiento.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-clinical/80">
                                                    <span>{selectedLang === 'es' ? 'Alojamiento' : 'Accommodation'} ({params.duracion} {selectedLang === 'es' ? 'días' : 'days'})</span> <span>${result.costosEstimados.hospedaje.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-clinical/80">
                                                    <span>{selectedLang === 'es' ? 'Vuelo internacional' : 'International flight'}</span> <span>${result.costosEstimados.avion.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <h3 className="text-xs text-clinical/60 uppercase tracking-widest mb-3 font-bold">{selectedLang === 'es' ? 'Tips Logísticos' : 'Logistical Tips'}</h3>
                                            <ul className="text-sm space-y-2">
                                                {result[selectedLang].tips.map((t: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-japandi-wood mt-0.5" />
                                                        <span className="text-clinical/80">{t}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4 flex gap-4">
                                    <button
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="bg-japandi-wood hover:bg-japandi-wood/80 text-white font-bold px-6 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Propuesta VIP
                                    </button>
                                    <button onClick={() => setIsScriptOpen(true)} className="bg-white/10 hover:bg-white/20 text-clinical font-bold px-6 py-2 rounded-lg transition-colors text-sm flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Scripts de Venta
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            <DocumentPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={result}
                params={params}
                clinic={clinicProfile}
                lang={selectedLang}
                setLang={setSelectedLang}
            />

            <SalesScriptModal
                isOpen={isScriptOpen}
                onClose={() => setIsScriptOpen(false)}
                data={result}
                lang={selectedLang}
                setLang={setSelectedLang}
            />
        </div>
    );
};

