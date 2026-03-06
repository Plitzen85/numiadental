import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Search, Filter, Download } from 'lucide-react';

const mockReports = [
    {
        id: 1,
        medico: 'Dr. Alejandro Rivas',
        fechaPago: 'Mar. 01, 2026',
        procedimiento: 'Implantes All-on-4',
        precioBase: 120000,
        pagado: 120000,
        noPagado: 0,
        costoMaterial: 45000,
        ingresoTotal: 120000,
        ingresoPeriodo: 36000,
        salarioEspera: 0,
        paciente: 'Arturo Mendoza'
    },
    {
        id: 2,
        medico: 'Dra. Sofía Mendoza',
        fechaPago: 'Mar. 02, 2026',
        procedimiento: 'Diseño de Sonrisa DSD',
        precioBase: 85000,
        pagado: 40000,
        noPagado: 45000,
        costoMaterial: 15000,
        ingresoTotal: 85000,
        ingresoPeriodo: 12000,
        salarioEspera: 13500,
        paciente: 'Carlos Valladares'
    },
    {
        id: 3,
        medico: 'Dr. Alejandro Rivas',
        fechaPago: 'Mar. 04, 2026',
        procedimiento: 'Elevación de Seno Maxilar',
        precioBase: 35000,
        pagado: 35000,
        noPagado: 0,
        costoMaterial: 5000,
        ingresoTotal: 35000,
        ingresoPeriodo: 10500,
        salarioEspera: 0,
        paciente: 'Marta Higareda'
    }
];

export const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'medicos' | 'pacientes' | 'servicios'>('medicos');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
            <div className="flex items-center gap-3">
                <FileBarChart className="text-electric w-8 h-8" />
                <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-white text-transparent bg-clip-text">
                    Informes
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('medicos')}
                    className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'medicos' ? 'bg-white/10 text-white' : 'text-clinical/60 hover:text-white bg-transparent'}`}
                >
                    Liquidación para médicos
                    {activeTab === 'medicos' && <div className="absolute top-0 left-0 right-0 h-1 bg-electric"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('pacientes')}
                    className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'pacientes' ? 'bg-white/10 text-white' : 'text-clinical/60 hover:text-white bg-white/5'}`}
                >
                    Reporte de pagos de pacientes
                    {activeTab === 'pacientes' && <div className="absolute top-0 left-0 right-0 h-1 bg-electric"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('servicios')}
                    className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'servicios' ? 'bg-white/10 text-white' : 'text-clinical/60 hover:text-white bg-white/5'}`}
                >
                    Informe de Servicios Prestados
                    {activeTab === 'servicios' && <div className="absolute top-0 left-0 right-0 h-1 bg-electric"></div>}
                </button>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <p className="text-sm font-bold text-clinical mb-4">Filtro</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6">
                    <div className="md:col-span-4 relative">
                        <input title="Campo" type="text" placeholder="Nombre, DNI, ID, teléfono" className="w-full bg-cobalt border border-white/20 rounded-lg pl-4 pr-10 py-3 text-sm text-clinical focus:border-electric outline-none" />
                        <Search className="w-4 h-4 text-clinical/50 absolute right-3 top-3.5" />
                    </div>
                    <div className="md:col-span-3">
                        <select title="Opciones" className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-sm text-clinical focus:border-electric outline-none appearance-none">
                            <option value="">Seleccionar un médico</option>
                            <option value="1">Dr. Alejandro Rivas</option>
                            <option value="2">Dra. Sofía Mendoza</option>
                        </select>
                    </div>
                    <div className="md:col-span-5">
                        <select title="Opciones" className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-sm text-clinical focus:border-electric outline-none appearance-none">
                            <option value="">Servicios</option>
                            <option value="imp">Implantes Dentales</option>
                            <option value="ort">Ortodoncia Invisible</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 relative">
                        <label className="text-[10px] text-clinical/50 uppercase tracking-widest absolute top-1 left-3">Pagos, desde</label>
                        <input title="Campo" type="date" className="w-full bg-cobalt border border-white/20 rounded-lg px-3 pt-5 pb-2 text-sm text-clinical focus:border-electric outline-none" defaultValue="2026-03-01" />
                    </div>
                    <div className="md:col-span-4 relative">
                        <label className="text-[10px] text-clinical/50 uppercase tracking-widest absolute top-1 left-3">Pagos, hasta</label>
                        <input title="Campo" type="date" className="w-full bg-cobalt border border-white/20 rounded-lg px-3 pt-5 pb-2 text-sm text-clinical focus:border-electric outline-none" defaultValue="2026-03-31" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                        <input title="Campo" type="checkbox" id="detallada" className="w-4 h-4 bg-cobalt border-white/20 rounded text-electric focus:ring-electric" />
                        <label htmlFor="detallada" className="text-sm text-clinical/70">Vista detallada</label>
                    </div>
                    <div className="md:col-span-2">
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Filter className="w-4 h-4 text-white" /> Seleccionar
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-clinical/60">
                            <th className="p-4 font-bold">Médico</th>
                            <th className="p-4 font-bold border-l border-white/5 flex items-center gap-1">Fecha de pago <span className="text-electric">↕</span></th>
                            <th className="p-4 font-bold border-l border-white/5">Nombre del procedimiento</th>
                            <th className="p-4 font-bold border-l border-white/5">Precio sin descuento<br />y sin IVA</th>
                            <th className="p-4 font-bold border-l border-white/5">Pagado</th>
                            <th className="p-4 font-bold border-l border-white/5">No pagado</th>
                            <th className="p-4 font-bold border-l border-white/5">Costos de<br />material</th>
                            <th className="p-4 font-bold border-l border-white/5">Ingresos<br />totales del Dr.</th>
                            <th className="p-4 font-bold border-l border-white/5">Ingresos del Dr.<br />por período</th>
                            <th className="p-4 font-bold border-l border-white/5">Salario<br />en espera</th>
                            <th className="p-4 font-bold border-l border-white/5">Paciente</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {mockReports.map((row) => (
                            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 text-white font-bold">{row.medico}</td>
                                <td className="p-4 text-clinical/80">{row.fechaPago}</td>
                                <td className="p-4 text-clinical">{row.procedimiento}</td>
                                <td className="p-4 text-white">${row.precioBase.toLocaleString()}</td>
                                <td className="p-4 text-emerald-400">${row.pagado.toLocaleString()}</td>
                                <td className="p-4 text-red-400">${row.noPagado.toLocaleString()}</td>
                                <td className="p-4 text-japandi-wood">${row.costoMaterial.toLocaleString()}</td>
                                <td className="p-4 text-white">${row.ingresoTotal.toLocaleString()}</td>
                                <td className="p-4 text-electric font-bold">${row.ingresoPeriodo.toLocaleString()}</td>
                                <td className="p-4 text-yellow-400">${row.salarioEspera.toLocaleString()}</td>
                                <td className="p-4 text-clinical/70">{row.paciente}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="bg-white/5 p-3 flex justify-end gap-4 text-xs text-clinical/50 items-center">
                    <span>Filas por página: 10</span>
                    <span>1-3 de 3</span>
                </div>
            </div>

            {/* Totals & Export */}
            <div className="flex justify-between items-center mt-6">
                <button className="bg-[#900038] hover:bg-[#7a002e] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
                    <Download className="w-5 h-5" /> Descargar Excel
                </button>
            </div>
        </motion.div>
    );
};
