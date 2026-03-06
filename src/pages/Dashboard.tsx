import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, Target, Award, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { fetchDentalCompetitors } from '../lib/mockApi';
import { getTodayAppointmentsSummary, fetchStaffAbsencesFromCalendar } from '../lib/agendaLogic';

const SkeletonCard = () => (
    <div className="glass-card p-6 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-white/10 mb-4"></div>
        <div className="h-6 w-24 bg-white/10 rounded mb-2"></div>
        <div className="h-8 w-32 bg-white/20 rounded"></div>
    </div>
);

export const Dashboard: React.FC = () => {
    const { competitors, setCompetitors, baseLocation, clinicProfile, isLoading, appointments, financeStats } = useMarket();
    const [loading, setLoading] = useState(true);
    const [staffAbsences, setStaffAbsences] = useState<any[]>([]);
    const [loadingAbsences, setLoadingAbsences] = useState(true);

    const handleReportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        alert("El motor de reportes está preparando la información. Pronto podrás descargar este reporte completo.");
    };

    useEffect(() => {
        let mounted = true;
        const loadDashboardData = async () => {
            if (competitors.length === 0) {
                setLoading(true);
                try {
                    const data = await fetchDentalCompetitors(baseLocation, 10);
                    if (mounted) setCompetitors(data.negocios);
                } catch (e) {
                    console.error("Failed fetching dashboard data", e);
                }
            }
            if (mounted) setLoading(false);
        };
        const loadAbsences = async () => {
            if (mounted) setLoadingAbsences(true);
            try {
                const absences = await fetchStaffAbsencesFromCalendar(clinicProfile?.staff || []);
                if (mounted) setStaffAbsences(absences);
            } catch (e) {
                console.error("Failed fetching absences", e);
            }
            if (mounted) setLoadingAbsences(false);
        };
        loadDashboardData();
        loadAbsences();
        return () => { mounted = false; };
    }, [baseLocation, competitors.length, setCompetitors, clinicProfile?.staff]);

    // Compute Top 5 Services Ranking
    const topServicesRanking = useMemo(() => {
        if (!competitors.length) return [];

        const serviceMap: Record<string, { freq: number, totalAmount: number }> = {};
        competitors.forEach(c => {
            Object.entries(c.precios).forEach(([srv, prce]) => {
                if (!serviceMap[srv]) serviceMap[srv] = { freq: 0, totalAmount: 0 };
                serviceMap[srv].freq += 1;
                serviceMap[srv].totalAmount += prce;
            });
        });

        const getUserPrice = (name: string) => {
            let myPrice = 0;
            if (clinicProfile?.servicios) {
                for (const cat of Object.values(clinicProfile.servicios)) {
                    if (cat[name]) { myPrice = cat[name]; break; }
                }
            }
            return myPrice;
        };

        return Object.entries(serviceMap)
            .sort((a, b) => b[1].freq - a[1].freq)
            .slice(0, 5)
            .map(([name, data]) => {
                const avgPrice = Math.round(data.totalAmount / data.freq);
                const userPrice = getUserPrice(name);

                let diffPct = 0;
                if (userPrice > 0) {
                    diffPct = ((userPrice - avgPrice) / avgPrice) * 100;
                }

                return {
                    name,
                    freq: data.freq,
                    avgPrice,
                    userPrice,
                    diffPct: Math.round(diffPct)
                };
            });
    }, [competitors, clinicProfile]);

    const appointmentSummary = useMemo(() => {
        return getTodayAppointmentsSummary(appointments);
    }, [appointments]);

    const avgTicket = financeStats.monthlyPatientsTreated > 0
        ? Math.round(financeStats.monthlyIncome / financeStats.monthlyPatientsTreated)
        : 0;

    const stats = [
        { label: 'Total Previstas', value: appointmentSummary.total.toString(), icon: Target, color: 'text-premium', desc: 'Agenda del día' },
        { label: 'Por Confirmar', value: appointmentSummary.scheduled.toString(), icon: TrendingUp, color: 'text-yellow-400', desc: 'Requieren contacto' },
        { label: 'Confirmadas', value: appointmentSummary.confirmed.toString(), icon: Activity, color: 'text-blue-400', desc: 'Confirmaron asistencia' },
        { label: 'En Sala', value: appointmentSummary.arrived.toString(), icon: Activity, color: 'text-amber-400', desc: 'Esperando atención' },
        { label: 'Terminadas', value: appointmentSummary.completed.toString(), icon: Activity, color: 'text-emerald-400', desc: 'Atención finalizada' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div>
                <h1 className="font-syne text-4xl font-bold bg-gradient-to-r from-electric to-clinical text-transparent bg-clip-text">
                    Intelligence Dashboard
                </h1>
                <p className="text-clinical/60 mt-2 font-sans">
                    Resumen ejecutivo del mercado dental local y oportunidades estratégicas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {loading || isLoading ? (
                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <stat.icon className={`w-24 h-24 ${stat.color}`} />
                            </div>
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-cobalt/80 border border-white/10 flex items-center justify-center mb-4 inner-shadow`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <p className="text-clinical/60 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-3xl font-bold font-syne mt-1 text-clinical">{stat.value}</h3>
                                <p className={`text-xs mt-2 font-medium ${stat.color}`}>{stat.desc}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* FINANCIAL TRAFFIC LIGHT (SEMÁFORO FINANCIERO) */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-lg mt-8">
                <h2 className="font-syne text-xl font-semibold flex items-center gap-2 mb-6">
                    <DollarSign className="text-emerald-400 w-5 h-5" /> Tablero de Control Semanal (KPIs)
                </h2>
                <div className="w-full overflow-hidden bg-white/5 rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-clinical/60 text-sm">
                                <th className="py-4 px-6 font-medium border-b border-white/10">Indicador</th>
                                <th className="py-4 px-6 font-medium border-b border-white/10 text-right">Meta Semanal</th>
                                <th className="py-4 px-6 font-medium border-b border-white/10 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="py-6 px-6 relative overflow-hidden">
                                    <h3 className="font-bold text-lg text-white font-syne mb-1 z-10 relative">TOTAL SEMANAL</h3>
                                    <p className="text-xl font-black text-premium z-10 relative">${financeStats.weeklyIncome.toLocaleString()} MXN</p>
                                </td>
                                <td className="py-6 px-6 text-right">
                                    <span className="bg-black/20 px-3 py-1 rounded text-clinical/80 font-mono text-lg">${financeStats.weeklyGoal.toLocaleString()}</span>
                                </td>
                                <td className="py-6 px-6">
                                    <div className="flex justify-center items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 ${financeStats.weeklyIncome >= financeStats.weeklyGoal ? 'bg-green-500 border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-green-500/20 border-green-500/30'}`}></div>
                                        <div className={`w-6 h-6 rounded-full border-2 ${(financeStats.weeklyIncome >= 70000 && financeStats.weeklyIncome < financeStats.weeklyGoal) ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-yellow-400/20 border-yellow-500/30'}`}></div>
                                        <div className={`w-6 h-6 rounded-full border-2 ${financeStats.weeklyIncome < 70000 ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-red-500/20 border-red-500/30'}`}></div>
                                    </div>
                                    <div className="text-center mt-2 text-xs font-bold font-syne opacity-80">
                                        {financeStats.weeklyIncome >= financeStats.weeklyGoal ? (
                                            <span className="text-green-400">¡META SUPERADA!</span>
                                        ) : financeStats.weeklyIncome >= 70000 ? (
                                            <span className="text-yellow-400">RIESGO MEDIO</span>
                                        ) : (
                                            <span className="text-red-400">ALERTA CRÍTICA</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="py-6 px-6 relative overflow-hidden">
                                    <h3 className="font-bold text-lg text-white font-syne mb-1 z-10 relative">TICKET PROMEDIO MENS.</h3>
                                    <p className="text-xl font-black text-green-400 z-10 relative">${avgTicket.toLocaleString()} MXN</p>
                                    <p className="text-xs text-clinical/60 mt-1">{financeStats.monthlyPatientsTreated} pacientes atendidos este mes</p>
                                </td>
                                <td className="py-6 px-6 text-right">
                                    <span className="bg-black/20 px-3 py-1 rounded text-clinical/80 font-mono text-lg">N/A</span>
                                </td>
                                <td className="py-6 px-6">
                                    <div className="text-center text-xs font-bold font-syne opacity-80 text-clinical/60">
                                        MÉTRICA INFORMATIVA
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Progress Bar Visualization */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs text-clinical/60 mb-2">
                        <span>$0</span>
                        <span>$70k</span>
                        <span>Meta ${financeStats.weeklyGoal.toLocaleString()}</span>
                    </div>
                    <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden flex relative">
                        {/* 0 to 70k zone */}
                        <div className="absolute top-0 bottom-0 left-0 w-[87.5%] border-r-2 border-dashed border-white/20 z-0"></div>

                        {/* Dynamic Progress */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((financeStats.weeklyIncome / financeStats.weeklyGoal) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full relative z-10 ${financeStats.weeklyIncome >= financeStats.weeklyGoal ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                financeStats.weeklyIncome >= 70000 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                    'bg-gradient-to-r from-red-600 to-red-400'
                                }`}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px] border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-syne text-xl font-semibold flex items-center gap-2">
                            <Activity className="text-electric w-5 h-5" /> Ranking de Servicios Locales
                        </h2>
                        <button onClick={handleReportClick} className="text-electric text-sm hover:underline">Ver Reporte</button>
                    </div>

                    {loading ? (
                        <div className="w-full h-64 bg-white/5 animate-pulse rounded-xl"></div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-clinical/60 text-sm">
                                        <th className="pb-3 px-2 font-medium">Servicio (# Solicitudes)</th>
                                        <th className="pb-3 px-2 font-medium">Promedio Zona</th>
                                        <th className="pb-3 px-2 font-medium">Mi Precio</th>
                                        <th className="pb-3 px-2 font-medium text-right">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topServicesRanking.map((svc, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-2">
                                                <p className="font-bold text-sm text-clinical">{svc.name}</p>
                                                <p className="text-xs text-clinical/40">{svc.freq} clínicas ofertan</p>
                                            </td>
                                            <td className="py-4 px-2 text-sm text-clinical">${svc.avgPrice.toLocaleString()}</td>
                                            <td className="py-4 px-2 text-sm font-semibold text-premium">
                                                {svc.userPrice > 0 ? `$${svc.userPrice.toLocaleString()}` : <span className="text-clinical/30">N/A</span>}
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                {svc.userPrice === 0 ? (
                                                    <span className="text-clinical/50 flex justify-end"><Minus className="w-4 h-4" /></span>
                                                ) : (
                                                    <div className={`flex items-center justify-end gap-1 font-bold text-sm ${svc.diffPct > 0 ? 'text-red-400' : svc.diffPct < 0 ? 'text-green-400' : 'text-clinical'}`}>
                                                        {svc.diffPct > 0 ? <ArrowUpRight className="w-4 h-4" /> : svc.diffPct < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                                        <span>{Math.abs(svc.diffPct)}% {svc.diffPct > 0 ? 'Arriba' : svc.diffPct < 0 ? 'Abajo' : 'Igual'}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="glass-panel rounded-2xl p-6">
                    <h2 className="font-syne text-xl font-semibold mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-premium" /> Oportunidades Clave
                    </h2>
                    <div className="space-y-4">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl"></div>
                            ))
                        ) : (
                            [
                                { t: 'Alta demanda en Ortodoncia Invisible', d: 'Baja oferta en tu radio de 5km' },
                                { t: 'Optimización de Precios', d: 'Tus blanqueamientos están 15% por debajo del mercado' },
                                { t: 'Nicho Turismo Dental', d: 'Pacientes de USA buscan Implantes All-on-4' }
                            ].map((op, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                    <h4 className="text-sm font-bold text-electric">{op.t}</h4>
                                    <p className="text-xs text-clinical/60 mt-1">{op.d}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Nueva Sección: Operatividad Diaria */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-lg mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-syne text-xl font-semibold flex items-center gap-2">
                        <Activity className="text-amber-400 w-5 h-5" /> Avisos del Personal (Operatividad)
                    </h2>
                    <span className="text-xs bg-black/20 text-premium px-3 py-1 rounded-full border border-premium/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-premium animate-pulse"></div>
                        Sync: Google Calendar
                    </span>
                </div>

                {loadingAbsences ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse h-20"></div>
                ) : staffAbsences.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-clinical/60 text-sm text-center">
                        Todo el personal operando con normalidad hoy.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staffAbsences.map((notice: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-amber-200 text-lg font-syne">{notice.doctor}</h4>
                                    <span className="text-xs text-amber-500/80 font-mono bg-black/20 px-2 py-1 rounded">{notice.date}</span>
                                </div>
                                <p className="text-sm text-amber-100 flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    {notice.status}
                                </p>
                                <p className="text-[10px] text-amber-500/60 font-mono mt-2">Origen: {notice.source}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </motion.div>
    );
};
