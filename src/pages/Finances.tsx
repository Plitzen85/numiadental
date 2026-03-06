import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, TrendingUp, TrendingDown, Wallet, Users, Plane, CreditCard, Banknote, Building, Plus, X, FileText, Bitcoin } from 'lucide-react';
import { getFinancialSummary, addTransaction, AccountType } from '../lib/financeApi';

const TransactionModal: React.FC<{ isOpen: boolean; onClose: () => void; onComplete: () => void }> = ({ isOpen, onClose, onComplete }) => {
    const [tipo, setTipo] = useState<'ingreso' | 'egreso' | 'comision_intermediario'>('ingreso');
    const [cuenta, setCuenta] = useState<AccountType>('bbva');
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [cryptoType, setCryptoType] = useState('USDT');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!concepto || !monto) return;
        setIsSaving(true);
        await addTransaction(tipo, cuenta, concepto, Number(monto), cuenta === 'cripto' ? cryptoType : undefined);
        setIsSaving(false);
        onComplete();
        onClose();
        setConcepto('');
        setMonto('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cobalt/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-cobalt border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="font-syne text-xl text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-electric" /> Registrar Movimiento
                    </h2>
                    <button title="Cerrar modal" aria-label="Cerrar modal" onClick={onClose} className="text-clinical/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setTipo('ingreso')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${tipo === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 border-white/10 text-clinical/60 hover:bg-white/10'}`}>Ingreso</button>
                        <button type="button" onClick={() => setTipo('egreso')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${tipo === 'egreso' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 border-white/10 text-clinical/60 hover:bg-white/10'}`}>Egreso</button>
                        <button type="button" onClick={() => setTipo('comision_intermediario')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${tipo === 'comision_intermediario' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-white/5 border-white/10 text-clinical/60 hover:bg-white/10'}`}>Comisión</button>
                    </div>
                    <div>
                        <label className="text-xs text-clinical/60 mb-1 block">Cuenta Destino/Origen</label>
                        <select title="Opciones" value={cuenta} onChange={(e) => setCuenta(e.target.value as AccountType)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-electric transition-colors outline-none">
                            <option value="bbva">BBVA</option>
                            <option value="banorte">Banorte</option>
                            <option value="revolut">Revolut (Internacional)</option>
                            <option value="cripto">Criptomonedas</option>
                            <option value="efectivo">Efectivo Físico</option>
                        </select>
                    </div>

                    {cuenta === 'cripto' && (
                        <div>
                            <label className="text-xs text-japandi-wood mb-1 block">Moneda de Pago</label>
                            <select title="Opciones" value={cryptoType} onChange={(e) => setCryptoType(e.target.value)} className="w-full bg-japandi-wood/10 border border-japandi-wood/30 rounded-lg p-3 text-white focus:border-japandi-wood transition-colors outline-none">
                                <option value="MXN">Peso Mexicano Digital (Bitso - 0% Com.)</option>
                                <option value="USDT">Tether (USDT)</option>
                                <option value="BTC">Bitcoin (BTC)</option>
                                <option value="ETH">Ethereum (ETH)</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-clinical/60 mb-1 block">
                            {tipo === 'comision_intermediario' ? 'Nombre del Intermediario' : 'Concepto / Paciente'}
                        </label>
                        <input title="Campo" type="text" required value={concepto} onChange={e => setConcepto(e.target.value)} placeholder={tipo === 'comision_intermediario' ? "Ej. Medical Travelers USA" : "Ej. Implantes Sr. García"} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-electric transition-colors outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-clinical/60 mb-1 block">Monto Bruto Recibido en MXN</label>
                        <input title="Campo" type="number" required min="1" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-electric transition-colors outline-none" />
                        {cuenta === 'cripto' && tipo === 'ingreso' && monto && (
                            <p className="text-[10px] text-japanese-sand mt-2 italic bg-japandi-wood/10 p-2 rounded-lg border border-japandi-wood/20">
                                {cryptoType === 'MXN' ? (
                                    <><b>Conexión Directa Bitso:</b> 0% comisión por red local. Monto íntegro a acreditar: <b>${Number(monto).toLocaleString()} MXN</b>.</>
                                ) : (
                                    <><b>Nota de Exchange:</b> Se aplicará una deducción simulada del 1.5% por spread. Monto neto a acreditar: <b>${(Number(monto) * 0.985).toLocaleString()} MXN</b>.</>
                                )}
                            </p>
                        )}
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-3 rounded-lg bg-electric text-cobalt font-bold hover:opacity-90 transition-opacity mt-4 flex justify-center items-center">
                        {isSaving ? <span className="w-5 h-5 border-2 border-cobalt/30 border-t-cobalt rounded-full animate-spin"></span> : 'Guardar Movimiento'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export const Finances: React.FC = () => {
    const [financeData, setFinanceData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        const data = await getFinancialSummary();
        setFinanceData(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-electric/30 border-t-electric rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Landmark className="text-emerald-400 w-8 h-8" />
                    <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-emerald-400 to-white text-transparent bg-clip-text">
                        Control Financiero
                    </h1>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-electric text-cobalt font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                    <Plus className="w-4 h-4" /> Nuevo Movimiento
                </button>
            </div>
            <p className="text-clinical/60">Monitoreo de ingresos, egresos, saldos en cuentas y cálculo de comisiones.</p>

            {/* Global Balance & Cash Flow Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 bg-emerald-500/10 px-3 py-1 rounded-full">Al día</span>
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-clinical/60 mb-2">Ingresos Brutos (Mes)</p>
                        <p className="text-3xl font-syne font-black text-white tracking-tighter">${financeData?.ingresosAdicionales.toLocaleString()} MXN</p>
                    </div>
                </div>

                <div className="glass-card p-6 border-red-500/30 bg-red-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-red-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400/80 bg-red-500/10 px-3 py-1 rounded-full">Operativo</span>
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-clinical/60 mb-2">Egresos (Mes)</p>
                        <p className="text-3xl font-syne font-black text-white tracking-tighter">${financeData?.egresosOperativos.toLocaleString()} MXN</p>
                    </div>
                </div>

                <div className="glass-card p-6 border-blue-500/30 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 bg-blue-500/10 px-3 py-1 rounded-full">Neto</span>
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-clinical/60 mb-2">Balance Neta (Mes)</p>
                        <p className="text-3xl font-syne font-black text-white tracking-tighter">${financeData?.balanceNeto.toLocaleString()} MXN</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Available Balances Matrix */}
                <div className="lg:col-span-8 space-y-6">
                    <h2 className="font-syne text-xl bg-gradient-to-r from-japandi-wood to-white text-transparent bg-clip-text flex items-center gap-3">
                        <Building className="w-5 h-5 text-japandi-wood" /> Estado de Cuenta
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-electric/30 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <CreditCard className="w-4 h-4 text-electric group-hover:scale-110 transition-transform" />
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-clinical/60">BBVA (Operativa)</h3>
                            </div>
                            <p className="text-2xl font-syne font-bold text-white tracking-tight">${financeData?.saldos?.bbva?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} <span className="text-xs text-clinical/40">MXN</span></p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-red-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <CreditCard className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-clinical/60">Banorte</h3>
                            </div>
                            <p className="text-2xl font-syne font-bold text-white tracking-tight">${financeData?.saldos?.banorte?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} <span className="text-xs text-clinical/40">MXN</span></p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-blue-400/30 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <Plane className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-clinical/60">Revolut (Turismo)</h3>
                            </div>
                            <p className="text-2xl font-syne font-bold text-white tracking-tight">${financeData?.saldos?.revolut?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} <span className="text-xs text-clinical/40">MXN</span></p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-japandi-wood/30 transition-colors relative overflow-hidden">
                            <div className="absolute inset-0 bg-japandi-wood/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <Bitcoin className="w-4 h-4 text-japandi-wood group-hover:rotate-12 transition-transform" />
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-japandi-wood">Bóveda Cripto</h3>
                            </div>
                            <p className="text-2xl font-syne font-bold text-white tracking-tight relative z-10">${financeData?.saldos?.cripto?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} <span className="text-xs text-clinical/40">MXN eq.</span></p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <Banknote className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-clinical/60">Efectivo Físico</h3>
                            </div>
                            <p className="text-2xl font-syne font-bold text-white tracking-tight">${financeData?.saldos?.efectivo?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} <span className="text-xs text-clinical/40">MXN</span></p>
                        </div>
                    </div>

                    {/* Recent Income List */}
                    <div className="glass-panel rounded-2xl p-6 mt-8">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-clinical/60 mb-6">Ingresos Destacados Recientes</h3>
                        <div className="space-y-4">
                            {financeData?.ingresosRecientes.map((ingreso: any, index: number) => (
                                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{ingreso.concepto}</p>
                                            <div className="flex gap-3 text-[10px] text-clinical/50 mt-1 uppercase tracking-wider">
                                                <span>ID: {ingreso.id}</span>
                                                <span>•</span>
                                                <span>{ingreso.fecha}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-syne font-bold text-emerald-400">+${ingreso.monto.toLocaleString()} MXN</p>
                                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${ingreso.estatus === 'Completado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {ingreso.estatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Commissions Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="font-syne text-xl bg-gradient-to-r from-japandi-wood to-white text-transparent bg-clip-text flex items-center gap-3">
                        <Users className="w-5 h-5 text-japandi-wood" /> Comisiones
                    </h2>

                    {/* Comisiones Doctor */}
                    <div className="glass-panel p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-clinical/60">Por Doctor</h3>
                            <Users className="w-4 h-4 text-clinical/40" />
                        </div>
                        <div className="space-y-4">
                            {financeData?.comisionesDoctor.map((com: any, idx: number) => (
                                <div key={idx} className="bg-cobalt/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-japandi-wood/30 transition-colors">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-japandi-wood/60 group-hover:bg-japandi-wood transition-colors"></div>
                                    <p className="text-sm font-bold text-white">{com.doctor}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-clinical/40 mb-3">{com.especialidad}</p>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-clinical/60">Monto Calculado ({com.porcentaje}%)</p>
                                            <p className="text-sm font-syne font-bold text-white">${com.montoGenerado.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-japandi-wood uppercase tracking-widest mb-1">A Pagar</p>
                                            <p className="text-lg font-syne font-black text-japandi-wood">${com.aPagar.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comisiones Turismo Dental */}
                    <div className="glass-panel p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-clinical/60">Turismo Dental (Intermediarios)</h3>
                            <Plane className="w-4 h-4 text-electric" />
                        </div>
                        <div className="space-y-4">
                            {financeData?.comisionesTurismo.map((tur: any, idx: number) => (
                                <div key={idx} className="bg-cobalt/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-electric/30 transition-colors">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-electric/60 group-hover:bg-electric transition-colors"></div>
                                    <p className="text-sm font-bold text-white">{tur.intermediario}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-clinical/40 mb-3">{tur.operaciones} Operaciones cerradas</p>

                                    <div className="flex justify-between items-end">
                                        <div className="text-right">
                                            <p className="text-[9px] text-electric uppercase tracking-widest mb-1">A Pagar</p>
                                            <p className="text-lg font-syne font-black text-electric">${tur.aPagar.toLocaleString()}</p>
                                        </div>
                                        <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${tur.estatus === 'Pagado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                            {tur.estatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onComplete={() => loadData()}
            />
        </motion.div>
    );
};
