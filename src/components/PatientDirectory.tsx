import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, UserCircle, Phone, Mail, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

interface PatientDirectoryProps {
    onOpenProfile: (patientId?: string) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({ onOpenProfile }) => {
    const { patients } = useMarket();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredPatients = patients.filter(p => {
        const matchesSearch =
            p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.folio.includes(searchTerm) ||
            p.telefono.includes(searchTerm);

        if (filterType === 'Todos') return matchesSearch;
        if (filterType === 'Con Deuda') return matchesSearch && p.saldo < 0;
        if (filterType === 'Alerta Médica') return matchesSearch && p.alertaMedica !== 'Sin alerta';

        return matchesSearch;
    });

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex w-full md:w-auto gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-clinical/50" />
                        <input
                            title="Buscar paciente"
                            type="text"
                            placeholder="Buscar por nombre, folio, teléfono..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-cobalt border border-white/20 rounded-lg pl-10 pr-4 py-2 text-clinical focus:outline-none focus:border-electric transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <select
                            title="Filtrar pacientes"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="bg-cobalt border border-white/20 rounded-lg pl-10 pr-8 py-2 text-clinical focus:outline-none focus:border-electric appearance-none"
                        >
                            <option value="Todos">Todos los pacientes</option>
                            <option value="Con Deuda">Con Saldo Pendiente</option>
                            <option value="Alerta Médica">Con Alerta Médica</option>
                        </select>
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-clinical/50 pointer-events-none" />
                    </div>
                </div>

                <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 hidden md:flex">
                    <button
                        title="Vista Cuadrícula"
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        title="Vista Lista"
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-white'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={() => onOpenProfile()}
                    className="w-full md:w-auto bg-electric text-cobalt font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-electric/90 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                >
                    <Plus className="w-5 h-5" /> Nuevo Paciente
                </button>
            </div>

            {/* Grid / List of Patients */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPatients.map((patient, i) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={patient.id}
                            onClick={() => onOpenProfile(patient.id)}
                            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-electric/50 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric/20 to-premium/20 border-2 border-white/10 flex items-center justify-center text-electric group-hover:border-electric transition-colors overflow-hidden">
                                    {patient.foto ? (
                                        <img src={patient.foto} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-8 h-8 opacity-80" />
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {patient.alertaMedica !== 'Sin alerta' && (
                                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1" title={patient.alertaMedica}>
                                            <AlertTriangle className="w-3 h-3" /> Médica
                                        </span>
                                    )}
                                    {patient.alertaAdministrativa !== 'Sin alerta' && (
                                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] px-2 py-1 rounded-full font-bold uppercase" title={patient.alertaAdministrativa}>
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-syne font-bold text-lg text-white mb-1 group-hover:text-electric transition-colors">
                                    {patient.nombres} {patient.apellidos}
                                </h3>
                                <div className="text-xs text-clinical/60 font-mono">Folio: {patient.folio} • {patient.tipoPaciente}</div>
                            </div>

                            <div className="space-y-2 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-clinical/80">
                                    <Phone className="w-4 h-4 opacity-50 shrink-0" /> {patient.telefono}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-clinical/80">
                                    <Mail className="w-4 h-4 opacity-50 shrink-0" /> <span className="truncate">{patient.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                                <div className="text-xs">
                                    <span className="text-clinical/50 block">Última Visita</span>
                                    <span className="text-white font-bold">{patient.ultimaVisita}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-clinical/50 block text-xs">Saldo</span>
                                    <span className={`font-bold ${patient.saldo < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ${Math.abs(patient.saldo).toLocaleString('es-MX')} {patient.saldo < 0 ? 'Pendiente' : ''}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden glass-panel">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-clinical/50 bg-black/20">
                                    <th className="p-4 font-medium pl-6">Paciente</th>
                                    <th className="p-4 font-medium">Contacto</th>
                                    <th className="p-4 font-medium hidden lg:table-cell">Alertas</th>
                                    <th className="p-4 font-medium">Última Visita</th>
                                    <th className="p-4 font-medium text-right pr-6">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient, i) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        key={patient.id}
                                        onClick={() => onOpenProfile(patient.id)}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric/20 to-premium/20 border-2 border-white/10 flex items-center justify-center text-electric shrink-0 group-hover:border-electric transition-colors overflow-hidden">
                                                    {patient.foto ? (
                                                        <img src={patient.foto} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCircle className="w-6 h-6 opacity-80" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-syne font-bold text-white group-hover:text-electric transition-colors">
                                                        {patient.nombres} {patient.apellidos}
                                                    </div>
                                                    <div className="text-xs text-clinical/50 font-mono">
                                                        Folio: {patient.folio} • {patient.tipoPaciente}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-clinical/80">
                                                    <Phone className="w-3 h-3 opacity-50 shrink-0" /> {patient.telefono}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-clinical/80">
                                                    <Mail className="w-3 h-3 opacity-50 shrink-0" /> <span className="truncate max-w-[150px] inline-block">{patient.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="flex flex-col gap-1 items-start">
                                                {patient.alertaMedica !== 'Sin alerta' && (
                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1" title={patient.alertaMedica}>
                                                        <AlertTriangle className="w-3 h-3" /> Médica
                                                    </span>
                                                )}
                                                {patient.alertaAdministrativa !== 'Sin alerta' && (
                                                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" title={patient.alertaAdministrativa}>
                                                        Admin
                                                    </span>
                                                )}
                                                {patient.alertaMedica === 'Sin alerta' && patient.alertaAdministrativa === 'Sin alerta' && (
                                                    <span className="text-clinical/30 text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-white text-sm">{patient.ultimaVisita}</span>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <span className={`font-bold ${patient.saldo < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                ${Math.abs(patient.saldo).toLocaleString('es-MX')} {patient.saldo < 0 ? 'Pendiente' : ''}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredPatients.length === 0 && (
                <div className="text-center py-20 text-clinical/50 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No se encontraron pacientes que coincidan con la búsqueda.</p>
                </div>
            )}
        </div>
    );
};
