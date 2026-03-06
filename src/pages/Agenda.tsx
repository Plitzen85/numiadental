import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, UserPlus, Sparkles, RefreshCcw, CheckCircle2, Bot } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { AppointmentType, generateMockAppointments, getActiveUnitsAtTime, parseTimeToMinutes } from '../lib/agendaLogic';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { PatientProfileForm } from '../components/PatientProfileForm';
import { PatientProfile } from '../components/PatientProfile';
import { PatientDirectory } from '../components/PatientDirectory';

export const Agenda: React.FC = () => {
    const { clinicProfile, appointments, setAppointments, setFinanceStats, patients } = useMarket();
    const doctors = clinicProfile?.staff || [];
    const [isGoogleSynced, setIsGoogleSynced] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
    const [initialModalTime, setInitialModalTime] = useState<string | undefined>(undefined);
    const [initialModalDoctorId, setInitialModalDoctorId] = useState<string | undefined>(undefined);
    const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
    const [isPatientViewOpen, setIsPatientViewOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);

    const handleOpenProfile = (id?: string) => {
        if (id) {
            setSelectedPatientId(id);
            setIsPatientViewOpen(true);
        } else {
            setSelectedPatientId(undefined);
            setIsPatientFormOpen(true);
        }
    };
    const [activeTab, setActiveTab] = useState<'calendario' | 'pacientes'>('calendario');

    // Default to today's date (and current month/year) for the view
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
    const [currentMonth] = useState<number>(today.getMonth());
    const [currentYear] = useState<number>(today.getFullYear());

    // Agenda Time Configurations
    const START_HOUR = 8; // 8:00 AM
    const END_HOUR = 20; // 8:00 PM
    const TIME_INTERVAL_MINS = 30; // Row height represents 30 minutes

    const generateTimeSlots = () => {
        const slots = [];
        for (let h = START_HOUR; h < END_HOUR; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    const handleOptimize = () => {
        setIsOptimizing(true);
        setTimeout(() => {
            setIsOptimizing(false);
            setIsOptimized(true);

            setAppointments(prev => {
                const updated = prev.map(a =>
                    a.id === '5' ? { ...a, startTime: '10:30', aiNote: 'Reprogramado AI: Evita saturación de sillones' } : a
                );

                updated.push({
                    id: 'ai-1', patientName: 'Carlos Gómez (Lista Espera)', procedure: 'Resina',
                    doctorId: doctors[1]?.id || '2', startTime: '10:30', durationMinutes: 30, status: 'scheduled', aiNote: 'AI Match: Hueco optimizado'
                });
                updated.push({
                    id: 'ai-2', patientName: 'Lucía Fernández (Seguimiento)', procedure: 'Revisión',
                    doctorId: doctors[0]?.id || '1', startTime: '11:00', durationMinutes: 30, status: 'scheduled', aiNote: 'AI Match: Seguimiento proactivo'
                });
                updated.push({
                    id: 'ai-3', patientName: 'Roberto Medina (Urgencia)', procedure: 'Valoración',
                    doctorId: doctors[2]?.id || '3', startTime: '11:00', durationMinutes: 45, status: 'scheduled', aiNote: 'AI Match: Urgencia encajada'
                });
                return updated;
            });
        }, 3000);
    };

    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const selectedDateObj = new Date(currentYear, currentMonth, selectedDate);
    const formattedDateString = `${daysOfWeek[selectedDateObj.getDay()]}, ${selectedDate} de ${months[currentMonth]} ${currentYear}`;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="text-japandi-wood w-8 h-8" />
                        <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-japandi-wood to-white text-transparent bg-clip-text">
                            Agenda & CRM
                        </h1>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
                        <button
                            onClick={() => setActiveTab('calendario')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'calendario' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-white'}`}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setActiveTab('pacientes')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'pacientes' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-white'}`}
                        >
                            Pacientes
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsGoogleSynced(!isGoogleSynced)}
                        className={`font-bold px-4 py-2 rounded-lg flex flex-col items-center justify-center transition-all ${isGoogleSynced ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-clinical hover:bg-white/10 border border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            <RefreshCcw className={`w-4 h-4 ${isGoogleSynced ? 'animate-spin-slow' : ''}`} />
                            {isGoogleSynced ? 'Google Calendar Sync Activo' : 'Sincronizar G-Calendar'}
                        </div>
                        {isGoogleSynced && doctors.length > 0 && (
                            <span className="text-[10px] font-mono opacity-80 mt-1">Sincronizando {doctors.length} cuentas (vía Email)</span>
                        )}
                    </button>
                    <button
                        onClick={() => handleOpenProfile()}
                        className="bg-white/10 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors border border-white/10"
                    >
                        <UserPlus className="w-4 h-4" /> Nuevo Paciente
                    </button>
                    <button
                        onClick={() => setIsNewAppointmentModalOpen(true)}
                        className="bg-electric text-cobalt font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <CalendarIcon className="w-4 h-4" /> Nueva Cita
                    </button>
                </div>
            </div>

            <p className="text-clinical/60">Gestión de citas y acceso rápido a los expedientes clínicos de los pacientes.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {activeTab === 'calendario' ? (
                    <>
                        {/* Calendar Mini-view & AI Tool */}
                        <div className="md:col-span-1 space-y-4">
                            <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase">{months[currentMonth]} {currentYear}</h3>
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-clinical/50 mb-2">
                                    <div>Do</div><div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sa</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold">
                                    {Array.from({ length: 31 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setSelectedDate(i + 1); setIsOptimized(false); setAppointments(generateMockAppointments()); }}
                                            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${i + 1 === selectedDate ? 'bg-electric text-cobalt' : 'text-clinical/80'} ${i + 1 === today.getDate() && i + 1 !== selectedDate ? 'border border-electric/30' : ''}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl bg-gradient-to-b from-premium/10 to-transparent border border-premium/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-premium" />
                                    <h3 className="font-syne font-bold text-white text-sm">Gemini AI Scheduler</h3>
                                </div>
                                <p className="text-xs text-clinical/70 mb-4">Optimiza la agenda diaria, detecta huecos ineficientes y reorganiza citas automáticamente.</p>
                                <button
                                    onClick={handleOptimize}
                                    disabled={isOptimized || isOptimizing}
                                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${isOptimized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-premium text-cobalt hover:bg-premium/90 shadow-[0_0_15px_rgba(212,175,55,0.3)]'}`}
                                >
                                    {isOptimizing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : isOptimized ? <CheckCircle2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    {isOptimizing ? 'Analizando Patrones...' : isOptimized ? 'Agenda Optimizada' : 'Optimizar Agenda'}
                                </button>
                            </div>
                        </div>

                        {/* Daily Schedule */}
                        <div className="md:col-span-3">
                            <div className="glass-panel p-6 rounded-2xl min-h-[600px] relative overflow-hidden">

                                {isOptimizing && (
                                    <div className="absolute inset-0 z-10 bg-cobalt/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                            <Sparkles className="w-12 h-12 text-premium mb-4" />
                                        </motion.div>
                                        <h3 className="font-syne text-xl text-white font-bold mb-2">Google Gemini AI Trabajando...</h3>
                                        <p className="text-sm text-premium/80">Analizando historiales clínicos, tiempos de sillón y preferencias de doctores.</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                                    <div>
                                        <h2 className="font-syne text-2xl text-white flex items-center gap-3">
                                            {formattedDateString}
                                            {isOptimized && <span className="bg-premium/20 text-premium text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-black border border-premium/30 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Optimizado</span>}
                                        </h2>
                                        <div className="mt-2 flex items-center gap-4 text-sm text-clinical/60">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                                <span>Bloqueado (Sillones Llenos)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-electric"></div>
                                                <span>Capacidad Disponible</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ADVANCED MULTI-DOCTOR GRID */}
                                <div className="overflow-auto custom-scrollbar relative h-[500px] md:h-[60vh] bg-cobalt/30 rounded-xl border border-white/10 shadow-inner">
                                    <div className="min-w-max relative pb-12">
                                        {/* Sticky Grid Header (Doctors) */}
                                        <div className="flex border-b border-white/10 sticky top-0 z-40 bg-[#0B1526] shadow-md">
                                            <div className="w-20 shrink-0 border-r border-white/10 sticky left-0 z-50 bg-[#0B1526] text-center py-3 text-xs text-clinical/40 font-bold uppercase">
                                                Hora
                                            </div>
                                            {doctors.map(doctor => (
                                                <div key={doctor.id} className="w-64 shrink-0 text-center py-3 border-r border-white/5 relative bg-[#0B1526]">
                                                    <div className="font-syne font-bold text-white text-sm truncate px-2">{doctor.nombres}</div>
                                                    <div className="text-[10px] text-clinical/60 uppercase">{doctor.especialidad}</div>
                                                    <div className={`absolute bottom-0 left-0 w-full h-1 ${doctor.colorTheme?.split(' ')[0] || 'bg-white/20'}`}></div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Grid Body (Time Slots) */}
                                        <div className="relative">
                                            {timeSlots.map((time) => {
                                                const activeUnits = getActiveUnitsAtTime(appointments, time);
                                                const isMaxCapacity = activeUnits >= 3;

                                                return (
                                                    <div key={time} className="flex group relative">
                                                        {/* Sticky Time Column */}
                                                        <div className="w-20 shrink-0 border-r border-b border-white/10 sticky left-0 z-30 bg-[#0B1526] text-center py-2 text-xs text-clinical/80 font-medium">
                                                            <span className="-translate-y-3 block bg-[#0B1526] px-1 mx-auto w-fit relative">{time}</span>
                                                        </div>

                                                        {/* Doctor Columns for this Time Slot */}
                                                        {doctors.map((doctor: any) => (
                                                            <div
                                                                key={`${doctor.id}-${time}`}
                                                                onClick={() => {
                                                                    if (!isMaxCapacity) {
                                                                        setInitialModalTime(time);
                                                                        setInitialModalDoctorId(doctor.id);
                                                                        setIsNewAppointmentModalOpen(true);
                                                                    }
                                                                }}
                                                                className={`w-64 shrink-0 border-r border-b border-white/5 h-12 relative transition-colors ${isMaxCapacity ? 'bg-red-500/5' : 'hover:bg-white/5 cursor-crosshair'}`}
                                                            >
                                                                {isMaxCapacity && <div className="absolute inset-0 striped-bg-red opacity-10 pointer-events-none"></div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}

                                            {/* APPOINTMENT OVERLAYS */}
                                            {appointments.map((appt: any) => {
                                                const doctorIndex = doctors.findIndex(d => d.id === appt.doctorId);
                                                if (doctorIndex === -1) return null;

                                                const startMins = parseTimeToMinutes(appt.startTime);
                                                const gridStartMins = START_HOUR * 60;

                                                // Y Position: Calculate distance from top. 48px is the height of one 30min slot (h-12)
                                                const yOffset = ((startMins - gridStartMins) / TIME_INTERVAL_MINS) * 48;
                                                // Height: duration / 30 mins * 48px
                                                const height = (appt.durationMinutes / TIME_INTERVAL_MINS) * 48;

                                                const doctor = doctors[doctorIndex];
                                                const colorTheme = doctor.colorTheme || 'bg-white/10 border-white/20 text-white shadow-none';

                                                const getStatusColor = (status: string) => {
                                                    if (status === 'cancelled') return 'border-b-4 border-red-500';
                                                    if (status === 'completed') return 'border-b-4 border-emerald-600';
                                                    if (status === 'arrived') return 'border-b-4 border-green-400';
                                                    if (status === 'confirmed') return 'border-b-4 border-blue-400';
                                                    if (status === 'scheduled') return 'border-b-4 border-yellow-400';
                                                    return 'border-b-4 border-transparent';
                                                };

                                                const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, apptId: string) => {
                                                    e.stopPropagation();
                                                    const newStatus = e.target.value as AppointmentType['status'];
                                                    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));

                                                    // If marked completed, simulate a payment to increase the KPIs
                                                    if (newStatus === 'completed') {
                                                        setFinanceStats(prev => ({
                                                            ...prev,
                                                            weeklyIncome: prev.weeklyIncome + 1500, // mock $1500 ticket
                                                            monthlyIncome: prev.monthlyIncome + 1500,
                                                            monthlyPatientsTreated: prev.monthlyPatientsTreated + 1
                                                        }));
                                                    }
                                                };

                                                return (
                                                    <div
                                                        key={appt.id}
                                                        onClick={() => {
                                                            const pSearch = patients.find(p => p.nombres.includes(appt.patientName.split(' ')[0]) || appt.patientName.includes(p.nombres));
                                                            handleOpenProfile(pSearch?.id);
                                                        }}
                                                        className={`absolute rounded-md border p-2 text-xs overflow-hidden shadow-lg hover:z-50 hover:brightness-110 transition-all cursor-pointer backdrop-blur-md flex flex-col ${colorTheme} ${getStatusColor(appt.status)} pb-6 z-20 hover:scale-[1.02]`}
                                                        // X Position: 5rem (80px) for time col + (doctorIndex * 16rem/256px for doc cols) + tiny margin
                                                        style={{
                                                            top: `${yOffset}px`,
                                                            height: `${height}px`,
                                                            left: `calc(5rem + ${doctorIndex * 16}rem + 4px)`,
                                                            width: `calc(16rem - 8px)`
                                                        }}
                                                    >
                                                        <div className="font-bold truncate">{appt.patientName}</div>
                                                        <div className="text-[10px] opacity-80 truncate">{appt.procedure}</div>

                                                        <div className="text-[9px] opacity-60 flex items-center justify-between mt-1">
                                                            <span>{appt.startTime} ({appt.durationMinutes}m)</span>
                                                            {(appt.status === 'arrived' || appt.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                                                        </div>

                                                        {/* BOTTOM RIBBON */}
                                                        <div
                                                            className={`absolute bottom-0 left-0 w-full flex items-center justify-between px-1 py-0.5 text-[9px] font-bold ${appt.aiNote && isOptimized ? 'bg-premium text-cobalt' : 'bg-black/20 text-white'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {appt.aiNote && isOptimized ? (
                                                                <div className="flex items-center gap-1 truncate max-w-[50%] pointer-events-none">
                                                                    <Sparkles className="w-2 h-2 shrink-0" />
                                                                    <span className="truncate">{appt.aiNote}</span>
                                                                </div>
                                                            ) : <div className="max-w-[10%]"></div>}

                                                            <select
                                                                title="Estado de la cita"
                                                                aria-label="Estado de la cita"
                                                                value={appt.status}
                                                                onChange={(e) => handleStatusChange(e, appt.id)}
                                                                className={`bg-transparent outline-none appearance-none cursor-pointer hover:opacity-80 transition-opacity text-right ${appt.aiNote && isOptimized ? 'text-cobalt' : 'text-white'}`}
                                                            >
                                                                <option value="scheduled" className="text-black">Por conf.</option>
                                                                <option value="confirmed" className="text-black">Confirmada</option>
                                                                <option value="arrived" className="text-black">En sala</option>
                                                                <option value="completed" className="text-black">Terminada</option>
                                                                <option value="cancelled" className="text-black">Cancelada</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="col-span-1 md:col-span-4 min-h-[600px]">
                        <PatientDirectory onOpenProfile={(id) => handleOpenProfile(id)} />
                    </div>
                )}
            </div>

            {/* NEW APPOINTMENT MODAL (NUEVA CITA PREVIA) */}
            <NewAppointmentModal
                isOpen={isNewAppointmentModalOpen}
                onClose={() => {
                    setIsNewAppointmentModalOpen(false);
                    setInitialModalTime(undefined);
                    setInitialModalDoctorId(undefined);
                }}
                initialTime={initialModalTime}
                initialDoctorId={initialModalDoctorId}
            />

            {/* NEW PATIENT FORM */}
            <PatientProfileForm
                isOpen={isPatientFormOpen}
                onClose={() => setIsPatientFormOpen(false)}
                patientId={undefined}
            />

            {/* PATIENT PROFILE VIEW (AI Hub & Odontogram) */}
            {isPatientViewOpen && (
                <PatientProfile
                    patientName={patients.find(p => p.id === selectedPatientId) ? `${patients.find(p => p.id === selectedPatientId)?.nombres} ${patients.find(p => p.id === selectedPatientId)?.apellidos}` : 'Paciente Seleccionado'}
                    onClose={() => setIsPatientViewOpen(false)}
                />
            )}

        </motion.div>
    );
};
