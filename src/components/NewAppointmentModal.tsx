import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { useMarket, isDoctor } from '../context/MarketContext';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTime?: string;
    initialDoctorId?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, initialTime, initialDoctorId }) => {
    const { clinicProfile, appointments, setAppointments, patients } = useMarket();
    const doctors = (clinicProfile?.staff || []).filter(isDoctor);

    // Form State (Mocked for UI purposes)
    const [modalFormState, setModalFormState] = useState<Record<string, string>>({
        datetime_start: initialTime ? `2024-03-01T${initialTime}` : '',
    });
    const handleModalInput = (key: string, val: string) => setModalFormState(prev => ({ ...prev, [key]: val }));
    const [selectedDoctor, setSelectedDoctor] = useState(initialDoctorId || (doctors.length > 0 ? doctors[0].id : ''));

    // Sync external props with internal state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialDoctorId) {
                setSelectedDoctor(initialDoctorId);
            }
            if (initialTime) {
                setModalFormState(prev => ({ ...prev, datetime_start: `2024-03-01T${initialTime}` }));
            }
        }
    }, [isOpen, initialDoctorId, initialTime]);

    const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
    const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([]);
    const [activeRightTab, setActiveRightTab] = useState<'tratamiento' | 'laboratorio'>('tratamiento');

    // Auto-assign chair based on doctor (Mock logic: Doctor Index + 1, max 3)
    const doctorIndex = doctors.findIndex(d => d.id === selectedDoctor);
    const assignedChair = doctorIndex >= 0 ? `Sillón ${(doctorIndex % 3) + 1}` : 'Sin asignar';

    const [selectedColor, setSelectedColor] = useState('');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    // Dropdown toggle states
    const [isTreatmentsOpen, setIsTreatmentsOpen] = useState(false);
    const [isLabOrdersOpen, setIsLabOrdersOpen] = useState(false);
    const [isDoctorSelectOpen, setIsDoctorSelectOpen] = useState(false);

    // Mock Options
    const mockTreatments = ['Examen Dental', 'Limpieza', 'Extracción', 'Blanqueamiento', 'Implante', 'Ortodoncia'];
    const mockLabOrders = ['Corona de Zirconio', 'Férula de Descarga', 'Prótesis Removible', 'Carillas'];

    // Color options matching the screenshot's 3x3 grid
    const colors = [
        'bg-red-200 border-red-300', 'bg-orange-200 border-orange-300', 'bg-pink-200 border-pink-300',
        'bg-purple-200 border-purple-300', 'bg-amber-200 border-amber-300', 'bg-cyan-200 border-cyan-300',
        'bg-blue-200 border-blue-300', 'bg-green-200 border-green-300', 'bg-lime-200 border-lime-300'
    ];

    const handleClose = () => {
        setModalFormState({});
        setSelectedTreatments([]);
        setSelectedLabOrders([]);
        setSelectedColor('');
        setIsTreatmentsOpen(false);
        setIsLabOrdersOpen(false);
        setIsDoctorSelectOpen(false);
        setIsColorPickerOpen(false);
        setActiveRightTab('tratamiento');
        onClose();
    };

    const handleSave = () => {
        if (!selectedDoctor || !modalFormState["datetime_start"]) {
            alert('Por favor selecciona un médico y una fecha de inicio.');
            return;
        }

        // Parse date and time from datetime-local input
        const startDt = new Date(modalFormState["datetime_start"]);
        const timeString = `${startDt.getHours().toString().padStart(2, '0')}:${startDt.getMinutes().toString().padStart(2, '0')}`;

        const duration = 30; // Default duration since we removed the end time picker

        const searchInput = modalFormState["search"] || 'Paciente Nuevo';
        let patientName = searchInput;
        // Match with a patient if it exists in Context
        if (patients && patients.length > 0) {
            const foundPatient = patients.find(p =>
                p.nombres.toLowerCase().includes(searchInput.toLowerCase()) ||
                p.folio.includes(searchInput)
            );
            if (foundPatient) {
                patientName = `${foundPatient.nombres} ${foundPatient.apellidos}`;
            }
        }

        const newAppt = {
            id: Date.now().toString(),
            patientName: patientName,
            procedure: selectedTreatments.length > 0 ? selectedTreatments.join(', ') : 'Consulta General',
            doctorId: selectedDoctor,
            startTime: timeString,
            durationMinutes: duration,
            status: 'scheduled' as const,
        };

        setAppointments([...appointments, newAppt]);
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 font-syne">Nueva cita previa</h2>
                            <button title="Cerrar modal" aria-label="Cerrar modal" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content Body - Split View */}
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

                            {/* LEFT PANE - FORM */}
                            <div className="w-full lg:w-[45%] p-6 overflow-y-auto border-r border-gray-100 space-y-4">

                                {/* Patient Search */}
                                <div className="relative">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input title="Campo" type="text"
                                        value={modalFormState["search"] || ""}
                                        onChange={e => handleModalInput("search", e.target.value)}
                                        placeholder="Nombre, DNI, teléfono"
                                        className="w-full pl-4 pr-10 py-3 text-gray-800 rounded-lg border border-gray-200 focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-all text-sm"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="mb-4">
                                    <div className="w-full relative">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 absolute top-1 left-2">Calendario</label>
                                        <input title="Campo" type="datetime-local"
                                            value={modalFormState["datetime_start"] || ""}
                                            onChange={e => handleModalInput("datetime_start", e.target.value)}
                                            className="w-full px-2 pt-5 pb-1 text-gray-800 rounded-lg border border-gray-200 bg-white text-sm focus:border-electric outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                {selectedDoctor && (
                                    <div className="text-[10px] text-emerald-600 font-bold mb-4 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded w-fit">
                                        <Check className="w-3 h-3" /> Disponibilidad sincronizada con G-Calendar de Dr/a. {doctors.find(d => d.id === selectedDoctor)?.nombres.split(' ')[0]}
                                    </div>
                                )}

                                {/* Treatments Dropdown (Multiselect) */}
                                <div className="relative">
                                    <div
                                        onClick={() => setIsTreatmentsOpen(!isTreatmentsOpen)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <span className={`text-sm line-clamp-1 ${selectedTreatments.length > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                            {selectedTreatments.length > 0 ? selectedTreatments.join(', ') : 'Seleccionar Tratamientos...'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                    </div>
                                    {isTreatmentsOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                            {mockTreatments.map(t => (
                                                <div
                                                    key={t}
                                                    onClick={() => {
                                                        setSelectedTreatments(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                                                    }}
                                                    className="px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer flex items-center justify-between"
                                                >
                                                    {t}
                                                    {selectedTreatments.includes(t) && <Check className="w-4 h-4 text-electric" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lab Orders Dropdown (Multiselect) */}
                                <div className="relative">
                                    <div
                                        onClick={() => setIsLabOrdersOpen(!isLabOrdersOpen)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <span className={`text-sm line-clamp-1 ${selectedLabOrders.length > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                            {selectedLabOrders.length > 0 ? selectedLabOrders.join(', ') : 'Seleccionar Órdenes de Lab...'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                    </div>
                                    {isLabOrdersOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                            {mockLabOrders.map(lo => (
                                                <div
                                                    key={lo}
                                                    onClick={() => {
                                                        setSelectedLabOrders(prev => prev.includes(lo) ? prev.filter(x => x !== lo) : [...prev, lo]);
                                                    }}
                                                    className="px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer flex items-center justify-between"
                                                >
                                                    {lo}
                                                    {selectedLabOrders.includes(lo) && <Check className="w-4 h-4 text-electric" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* End Date */}


                                {/* Doctor Select */}
                                <div className="relative mt-2">
                                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 font-medium z-10">Médico</label>
                                    <div
                                        onClick={() => setIsDoctorSelectOpen(!isDoctorSelectOpen)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-800 flex justify-between items-center bg-white cursor-pointer relative z-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-red-400"></div>
                                            <span className="text-sm font-semibold text-gray-700 uppercase">{doctors.find(d => d.id === selectedDoctor)?.nombres || 'Seleccionar médico...'}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                    </div>

                                    {isDoctorSelectOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-800 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto w-full">
                                            {doctors.map(d => (
                                                <div
                                                    key={d.id}
                                                    onClick={() => {
                                                        setSelectedDoctor(d.id);
                                                        setIsDoctorSelectOpen(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0"
                                                >
                                                    <span className="uppercase font-medium">{d.nombres}</span>
                                                    <span className="text-xs text-gray-400">{d.especialidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Auto-Assigned Chair and Color Split Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative border border-gray-200 rounded-lg bg-gray-50 flex items-center px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sillón Asignado</span>
                                            <span className="text-sm font-bold text-gray-700">{assignedChair}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div
                                            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <span className="text-sm text-gray-400">Color (no obligatorio)</span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </div>

                                        {/* Inline Color Picker Popover */}
                                        {isColorPickerOpen && (
                                            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48">
                                                <div className="grid grid-cols-3 gap-3 justify-items-center">
                                                    {colors.map((colorClass, idx) => (
                                                        <button
                                                            title={`Color ${colorClass.split('-')[1]}`}
                                                            aria-label={`Seleccionar color ${colorClass.split('-')[1]}`}
                                                            key={idx}
                                                            onClick={() => { setSelectedColor(colorClass); setIsColorPickerOpen(false); }}
                                                            className={`w-6 h-6 rounded-full border-2 ${colorClass} ${selectedColor === colorClass ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-70'} hover:opacity-100 transition-all`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comentario */}
                                <div className="pt-2">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Comentario</h4>
                                    <textarea title="Texto" value={modalFormState["textarea_1"] || ""} onChange={e => handleModalInput("textarea_1", e.target.value)}
                                        placeholder="Anotaciones"
                                        rows={3}
                                        className="w-full p-4 text-gray-800 rounded-lg border border-gray-200 focus:outline-none focus:border-electric transition-all text-sm resize-none"
                                    />
                                </div>

                                {/* Comments / Evolution Notes */}
                                <div className="pt-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Anotaciones / Evolución del paciente</label>
                                    <textarea title="Texto" value={modalFormState["textarea_2"] || ""} onChange={e => handleModalInput("textarea_2", e.target.value)}
                                        rows={3}
                                        placeholder="Detalles importantes para el tratamiento..."
                                        className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 text-sm focus:border-electric focus:ring-1 focus:ring-electric transition-all outline-none resize-none"
                                    ></textarea>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-4 pt-4">
                                    <button onClick={handleClose} className="px-6 py-2 bg-red-500 text-white rounded-md font-medium text-sm flex items-center gap-2 hover:bg-red-600 transition-colors">
                                        <X className="w-4 h-4" /> Eliminar
                                    </button>
                                    <button onClick={handleSave} className="px-6 py-2 bg-green-500 text-white rounded-md font-medium text-sm flex items-center gap-2 hover:bg-green-600 transition-colors">
                                        <Check className="w-4 h-4" /> Guardar
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT PANE - PATIENT HISTORY */}
                            <div className="w-full lg:w-[55%] bg-gray-50 flex flex-col overflow-hidden relative">
                                <div className="flex-1 overflow-y-auto p-8">
                                    <h3 className="font-bold text-lg text-gray-800 mb-6">Visitas</h3>

                                    {/* Tab Navigation */}
                                    <div className="flex mb-6 w-full max-w-md">
                                        <button
                                            onClick={() => setActiveRightTab('tratamiento')}
                                            className={`flex-1 py-3 text-sm font-medium ${activeRightTab === 'tratamiento' ? 'text-gray-800 bg-white border border-gray-200 rounded-tl-lg rounded-bl-lg shadow-sm z-10' : 'text-gray-500 bg-gray-200/50 border border-gray-200 rounded-tl-lg rounded-bl-lg hover:bg-gray-200 transition-colors'}`}>
                                            Tratamiento
                                        </button>
                                        <button
                                            onClick={() => setActiveRightTab('laboratorio')}
                                            className={`flex-1 py-3 text-sm font-medium ${activeRightTab === 'laboratorio' ? 'text-gray-800 bg-white border border-gray-200 rounded-tr-lg rounded-br-lg shadow-sm z-10' : 'text-gray-500 bg-gray-200/50 border border-t border-b border-r border-gray-200 rounded-tr-lg rounded-br-lg hover:bg-gray-200 transition-colors -ml-[1px]'}`}>
                                            Órdenes de laboratorio
                                        </button>
                                    </div>

                                    {/* Mock Data Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-200/50 text-gray-600 text-xs font-semibold">
                                                <tr>
                                                    {activeRightTab === 'tratamiento' ? (
                                                        <>
                                                            <th className="px-4 py-3">Fecha de procedimiento</th>
                                                            <th className="px-4 py-3">Procedimientos</th>
                                                            <th className="px-4 py-3">Médico</th>
                                                            <th className="px-4 py-3">Importe</th>
                                                            <th className="px-4 py-3">No pagado</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-4 py-3">Fecha de orden</th>
                                                            <th className="px-4 py-3">Órdenes</th>
                                                            <th className="px-4 py-3">Laboratorio</th>
                                                            <th className="px-4 py-3">Estado</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Empty State representing a new patient or no history */}
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                                        {activeRightTab === 'tratamiento' ? 'No hay procedimientos registrados' : 'No hay órdenes de laboratorio'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Help Button (Bottom Right) */}
                                <div className="absolute bottom-6 right-6">
                                    <button className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-xl transition-colors">
                                        ?
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
