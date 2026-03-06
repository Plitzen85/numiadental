import React, { useState } from 'react';
import { User, Activity, FileText, BriefcaseMedical, Landmark, Pill, Camera, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { addTransaction, AccountType } from '../lib/financeApi';
import { AIClinicalViewer } from './AIClinicalViewer';
import { Odontogram } from './Odontogram';

interface PatientProfileProps {
    patientName: string;
    onClose: () => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patientName, onClose }) => {
    const [activeTab, setActiveTab] = useState<'historial' | 'periodontograma' | 'seguimiento' | 'finanzas'>('historial');
    const [isAIViewerOpen, setIsAIViewerOpen] = useState(false);
    const [conceptoCobro, setConceptoCobro] = useState(`Tratamiento: ${patientName}`);
    const [cuentaCobro, setCuentaCobro] = useState<AccountType>('bbva');
    const [montoCobro, setMontoCobro] = useState('');
    const [cryptoType, setCryptoType] = useState('USDT');
    const [isSaving, setIsSaving] = useState(false);
    const [pagoAprobado, setPagoAprobado] = useState(false);

    const handleCobroSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!montoCobro) return;
        setIsSaving(true);
        await addTransaction('ingreso', cuentaCobro, conceptoCobro, Number(montoCobro), cuentaCobro === 'cripto' ? cryptoType : undefined);
        setIsSaving(false);
        setPagoAprobado(true);
        setTimeout(() => setPagoAprobado(false), 3000);
        setMontoCobro('');
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-cobalt/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-cobalt border border-white/10 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-white/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-electric/20 flex items-center justify-center border border-electric/40">
                            <span className="font-syne font-bold text-2xl text-electric">{patientName.charAt(0)}</span>
                        </div>
                        <div>
                            <h2 className="font-syne text-2xl font-bold text-white">{patientName}</h2>
                            <p className="text-clinical/60 text-sm">ID: PX-88492 • Paciente Frecuente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAIViewerOpen(true)}
                            className="bg-electric/20 text-electric hover:bg-electric/30 border border-electric/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                        >
                            <Sparkles className="w-4 h-4" /> NÜMIA AI
                        </button>
                        <button onClick={onClose} className="text-clinical/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">Cerrar Expediente</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-6">
                    <button onClick={() => setActiveTab('historial')} className={`py-4 px-4 text-sm font-bold flex gap-2 items-center transition-colors border-b-2 ${activeTab === 'historial' ? 'border-electric text-electric' : 'border-transparent text-clinical/60 hover:text-white'}`}><User className="w-4 h-4" /> Historial Clínico</button>
                    <button onClick={() => setActiveTab('periodontograma')} className={`py-4 px-4 text-sm font-bold flex gap-2 items-center transition-colors border-b-2 ${activeTab === 'periodontograma' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-clinical/60 hover:text-white'}`}><Activity className="w-4 h-4" /> Periodontograma</button>
                    <button onClick={() => setActiveTab('seguimiento')} className={`py-4 px-4 text-sm font-bold flex gap-2 items-center transition-colors border-b-2 ${activeTab === 'seguimiento' ? 'border-japandi-wood text-japandi-wood' : 'border-transparent text-clinical/60 hover:text-white'}`}><BriefcaseMedical className="w-4 h-4" /> Evolución & Recetas</button>
                    <button onClick={() => setActiveTab('finanzas')} className={`py-4 px-4 text-sm font-bold flex gap-2 items-center transition-colors border-b-2 ${activeTab === 'finanzas' ? 'border-premium text-premium' : 'border-transparent text-clinical/60 hover:text-white'}`}><Landmark className="w-4 h-4" /> Cobrar (Caja)</button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">

                    {activeTab === 'historial' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="font-syne text-lg text-white">Antecedentes Médicos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl bg-white/5">
                                        <input title="Campo" type="checkbox" className="w-5 h-5 bg-black border-white/20 rounded text-electric" />
                                        <span className="text-clinical/90">Alergias a Medicamentos</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-red-500/30 rounded-xl bg-red-500/10">
                                        <input title="Campo" type="checkbox" defaultChecked className="w-5 h-5 bg-black border-white/20 rounded text-electric" />
                                        <span className="text-white font-bold">Diabetes / Hipertensión</span>
                                    </label>
                                </div>
                                <textarea title="Texto" className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-clinical/80 focus:border-electric outline-none" placeholder="Notas adicionales sobre el historial del paciente... (Ej. Paciente refiere dolor punzante en cuadrante 2)"></textarea>
                            </div>

                            <h3 className="font-syne text-lg text-white mt-8 mb-4">Archivos y Radiografías</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-clinical/50 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <Camera className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Subir Radiografía</span>
                                </div>
                                <div className="aspect-square border border-white/10 rounded-xl bg-black/50 p-2 relative group">
                                    <img src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=200&h=200" className="w-full h-full object-cover rounded-lg opacity-60 group-hover:opacity-100 transition-opacity" alt="Panorámica" />
                                    <span className="absolute bottom-3 left-3 text-[10px] bg-black/80 px-2 py-1 rounded text-white font-bold">Panorámica 01/26</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'periodontograma' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                <p className="text-emerald-400 font-bold flex items-center gap-2"><Activity className="w-5 h-5" /> Diagnóstico Periodontal Activo</p>
                            </div>
                            <div className="p-8 border border-white/10 rounded-2xl bg-white/5 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 opacity-10"></div>
                                <div className="z-10 w-full relative">
                                    <Odontogram />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seguimiento' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                            <div>
                                <h3 className="font-syne text-lg text-white mb-4">Notas de Evolución</h3>
                                <div className="space-y-4">
                                    <div className="border border-white/10 rounded-xl p-4 bg-white/5 border-l-4 border-l-electric">
                                        <p className="text-[10px] text-clinical/50 mb-2 uppercase tracking-widest">Hace 2 días • Dr. A. Rivas</p>
                                        <p className="text-sm text-clinical/90">Se realiza profilaxis profuna y detartraje. Instrucciones de higiene bucal. Cita de revisión programada en 6 meses.</p>
                                    </div>
                                    <div className="border border-white/10 rounded-xl p-4 bg-white/5 border-l-4 border-l-japandi-wood">
                                        <p className="text-[10px] text-clinical/50 mb-2 uppercase tracking-widest">Hace 1 mes • Dra. S. Mendoza</p>
                                        <p className="text-sm text-clinical/90">Diagnóstico preliminar para carillas. Toma de impresiones digitales.</p>
                                    </div>
                                    <textarea title="Texto" className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-clinical focus:border-electric outline-none mt-4" placeholder="Escribir nueva nota clínica..."></textarea>
                                    <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">Guardar Nota</button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-syne text-lg text-white mb-4 flex items-center gap-2"><Pill className="w-5 h-5" /> Recetario Electrónico</h3>
                                <div className="bg-white p-6 rounded-2xl relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><FileText className="w-24 h-24 text-black" /></div>
                                    <p className="font-syne font-black text-black text-xl border-b border-black/10 pb-2 mb-4">RX</p>
                                    <textarea title="Texto" className="w-full h-32 bg-transparent text-black placeholder:text-black/30 outline-none resize-none font-sans text-sm" placeholder="Ej. Amoxicilina 500mg, Tomar 1 cápsula cada 8 horas por 7 días..."></textarea>
                                    <button className="bg-black hover:bg-black/80 text-white w-full text-sm font-bold py-3 rounded-lg transition-colors mt-2">Emitir Receta (PDF)</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finanzas' && (
                        <div className="max-w-xl mx-auto animate-in fade-in duration-300">
                            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-premium/20 rounded-full blur-3xl"></div>
                                <h3 className="font-syne text-2xl text-white mb-6 flex items-center gap-3 relative z-10"><Landmark className="text-premium" /> Caja Centralizada</h3>

                                {pagoAprobado ? (
                                    <div className="bg-emerald-500/20 border border-emerald-500/50 p-6 rounded-2xl text-center relative z-10">
                                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">✓</div>
                                        <h4 className="font-syne text-xl font-bold text-emerald-400">Pago Ingresado con Éxito</h4>
                                        <p className="text-sm text-clinical/70 mt-2">El saldo ha sido actualizado en la cuenta y el Historial de Finanzas de la clínica.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCobroSubmit} className="space-y-5 relative z-10">
                                        <div>
                                            <label className="text-xs text-clinical/60 mb-1 block">Concepto del Cobro</label>
                                            <input title="Campo" type="text" required value={conceptoCobro} onChange={e => setConceptoCobro(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-premium transition-colors outline-none" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-clinical/60 mb-1 block">Cuenta a Recibir</label>
                                                <select title="Opciones" value={cuentaCobro} onChange={(e) => setCuentaCobro(e.target.value as AccountType)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-premium transition-colors outline-none appearance-none">
                                                    <option value="bbva">T. Crédito / BBVA</option>
                                                    <option value="banorte">T. Débito / Banorte</option>
                                                    <option value="revolut">Revolut Bank</option>
                                                    <option value="cripto">Criptomonedas</option>
                                                    <option value="efectivo">Efectivo Físico</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-clinical/60 mb-1 block">Monto a Cobrar (MXN)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-4 text-clinical/50 font-bold">$</span>
                                                    <input title="Campo" type="number" required min="1" value={montoCobro} onChange={e => setMontoCobro(e.target.value)} placeholder="0.00" className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-4 text-white font-bold focus:border-premium transition-colors outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {cuentaCobro === 'cripto' && (
                                            <div className="bg-japandi-wood/10 border border-japandi-wood/30 p-4 rounded-xl">
                                                <label className="text-xs text-japandi-wood mb-2 block">Seleccione Red Crypto</label>
                                                <select title="Opciones" value={cryptoType} onChange={(e) => setCryptoType(e.target.value)} className="w-full bg-black/40 border border-japandi-wood/30 rounded-lg p-3 text-white focus:border-japandi-wood outline-none mb-3">
                                                    <option value="MXN">Peso Mexicano Digital (Bitso - 0%)</option>
                                                    <option value="USDT">USDT (TRC20)</option>
                                                    <option value="BTC">Bitcoin</option>
                                                    <option value="ETH">Ethereum (ERC20)</option>
                                                </select>
                                                {montoCobro && (
                                                    <p className="text-[10px] text-japanese-sand italic">
                                                        {cryptoType === 'MXN'
                                                            ? `Transacción sin comisiones (Bitso). La clínica recibirá $${Number(montoCobro).toLocaleString()} MXN netos.`
                                                            : `La clínica recibirá $${(Number(montoCobro) * 0.985).toLocaleString()} MXN netos después de las comisiones de conversión del 1.5%.`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <button type="submit" disabled={isSaving} className="w-full py-4 rounded-xl bg-premium text-cobalt font-black text-lg hover:opacity-90 transition-opacity mt-4 flex justify-center items-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                            {isSaving ? <span className="w-6 h-6 border-2 border-cobalt/30 border-t-cobalt rounded-full animate-spin"></span> : 'Procesar Cobro'}
                                        </button>
                                        <p className="text-center text-[10px] text-clinical/40 mt-2">El cobro impactará inmediatamente los reportes financieros de la clínica.</p>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div >

            {/* AI Clinical Viewer Modal */}
            < AIClinicalViewer
                isOpen={isAIViewerOpen}
                onClose={() => setIsAIViewerOpen(false)}
                patientName={patientName}
            />
        </div >
    );
};
