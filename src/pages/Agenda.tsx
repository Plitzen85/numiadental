import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, UserPlus, Sparkles, RefreshCcw, CheckCircle2, Bot, Wifi } from 'lucide-react';
import { useMarket, isDoctor } from '../context/MarketContext';
import { AppointmentType, getActiveUnitsAtTime, parseTimeToMinutes } from '../lib/agendaLogic';
import {
    fetchCalendarEvents,
    gcalEventToAppointment,
    getConnectedDoctorIds,
    getAuthorizedDoctorIds,
    silentReconnect,
} from '../lib/googleCalendar';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { PatientProfileForm } from '../components/PatientProfileForm';
import { PatientProfile } from '../components/PatientProfile';
import { PatientDirectory } from '../components/PatientDirectory';
import { GoogleCalendarSyncModal } from '../components/GoogleCalendarSyncModal';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const Agenda: React.FC = () => {
    const { clinicProfile, appointments, setAppointments, setFinanceStats, patients } = useMarket();
    const doctors = (clinicProfile?.staff || []).filter(isDoctor);

    // --- Google Calendar state ---
    const [gcalEvents, setGcalEvents] = useState<AppointmentType[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [connectedCount, setConnectedCount] = useState(0);
    const [isGcalModalOpen, setIsGcalModalOpen] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- Other UI state ---
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
    const [initialModalTime, setInitialModalTime] = useState<string | undefined>(undefined);
    const [initialModalDoctorId, setInitialModalDoctorId] = useState<string | undefined>(undefined);
    const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
    const [isPatientViewOpen, setIsPatientViewOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
    const [editPatientId, setEditPatientId] = useState<string | undefined>(undefined);
    const [newPatientInitialName, setNewPatientInitialName] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'calendario' | 'pacientes'>('calendario');

    const today = new Date();
    const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
    const [currentMonth] = useState<number>(today.getMonth());
    const [currentYear] = useState<number>(today.getFullYear());

    const START_HOUR = 8;
    const END_HOUR = 20;
    const TIME_INTERVAL_MINS = 30;

    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        for (let h = START_HOUR; h < END_HOUR; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    // -----------------------------------------------------------------------
    // Google Calendar: fetch events for all connected doctors
    // -----------------------------------------------------------------------
    const syncGoogleCalendar = useCallback(async () => {
        const connectedIds = getConnectedDoctorIds();
        setConnectedCount(connectedIds.length);
        if (connectedIds.length === 0) return;

        setIsSyncing(true);
        const date = new Date(currentYear, currentMonth, selectedDate);

        const results = await Promise.all(
            connectedIds.map(doctorId =>
                fetchCalendarEvents(doctorId, date).then(events =>
                    events
                        .map(e => gcalEventToAppointment(e, doctorId))
                        .filter((a): a is AppointmentType => a !== null)
                )
            )
        );

        setGcalEvents(results.flat());
        setLastSynced(new Date());
        setIsSyncing(false);
        setConnectedCount(getConnectedDoctorIds().length);
    }, [selectedDate, currentMonth, currentYear]);

    // -----------------------------------------------------------------------
    // On mount: attempt silent reconnect for all doctors, then start polling
    // -----------------------------------------------------------------------
    useEffect(() => {
        const init = async () => {
            // Only silently reconnect doctors who have previously authorized.
            // getAuthorizedDoctorIds() reads from localStorage — survives page reloads.
            // GIS reissues the token silently (no popup) if the user is still signed in to Google.
            const authorizedIds = getAuthorizedDoctorIds();
            if (authorizedIds.length > 0) {
                await Promise.all(authorizedIds.map(id => silentReconnect(id)));
            }
            setConnectedCount(getConnectedDoctorIds().length);
            await syncGoogleCalendar();
        };
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount

    // Re-fetch when selected date changes
    useEffect(() => {
        syncGoogleCalendar();
    }, [syncGoogleCalendar]);

    // Auto-poll every 30 s
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            syncGoogleCalendar();
        }, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [syncGoogleCalendar]);

    // -----------------------------------------------------------------------
    // Merge local appointments + Google Calendar events (deduplicate by gcal ID)
    // -----------------------------------------------------------------------
    const allAppointments = useMemo<AppointmentType[]>(() => {
        const localGcalIds = new Set(
            appointments
                .filter(a => a.googleCalendarEventId)
                .map(a => a.googleCalendarEventId!)
        );
        // Only add gcal events that aren't already tracked locally
        const newGcalEvents = gcalEvents.filter(
            e => e.googleCalendarEventId && !localGcalIds.has(e.googleCalendarEventId)
        );
        return [...appointments, ...newGcalEvents];
    }, [appointments, gcalEvents]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleOpenProfile = (id?: string) => {
        if (id) { setSelectedPatientId(id); setIsPatientViewOpen(true); }
        else { setEditPatientId(undefined); setIsPatientFormOpen(true); }
    };

    const handleEditPatient = (id: string) => {
        setEditPatientId(id);
        setIsPatientFormOpen(true);
    };

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
                    {/* Google Calendar sync button — always visible, shows live status */}
                    <button
                        onClick={() => setIsGcalModalOpen(true)}
                        className={`font-bold px-4 py-2 rounded-lg flex flex-col items-center justify-center transition-all border ${
                            connectedCount > 0
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-white/5 text-clinical hover:bg-white/10 border-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {isSyncing ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : connectedCount > 0 ? (
                                <Wifi className="w-4 h-4" />
                            ) : (
                                <RefreshCcw className="w-4 h-4" />
                            )}
                            {connectedCount > 0 ? 'G-Calendar Conectado' : 'Sincronizar G-Calendar'}
                        </div>
                        {connectedCount > 0 && (
                            <span className="text-[10px] font-mono opacity-70 mt-0.5">
                                {connectedCount} {connectedCount === 1 ? 'cuenta' : 'cuentas'} · {isSyncing ? 'Actualizando…' : lastSynced ? `Última sync ${lastSynced.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'En tiempo real'}
                            </span>
                        )}
                    </button>

                    {/* Force-refresh button — only shown when connected */}
                    {connectedCount > 0 && (
                        <button
                            onClick={() => syncGoogleCalendar()}
                            disabled={isSyncing}
                            title="Forzar sincronización ahora"
                            className="p-2 rounded-lg border border-white/10 text-clinical/60 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors disabled:opacity-40"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    )}

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
                                            onClick={() => {
                                                setSelectedDate(i + 1);
                                                setIsOptimized(false);
                                            }}
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

                            {/* Google Calendar legend */}
                            {connectedCount > 0 && (
                                <div className="glass-panel p-4 rounded-2xl space-y-2">
                                    <p className="text-[10px] text-clinical/40 uppercase font-bold tracking-wider">Leyenda</p>
                                    <div className="flex items-center gap-2 text-xs text-clinical/70">
                                        <div className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-400/50 shrink-0"></div>
                                        Evento de Google Calendar
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-clinical/70">
                                        <div className="w-3 h-3 rounded-sm bg-electric/30 border border-electric/50 shrink-0"></div>
                                        Cita en Nümia
                                    </div>
                                </div>
                            )}
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
                                            {connectedCount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                    <span>Google Calendar ({gcalEvents.length})</span>
                                                </div>
                                            )}
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
                                                    {/* Google Calendar connected indicator */}
                                                    {getConnectedDoctorIds().includes(doctor.id) && (
                                                        <div className="absolute top-1 right-2 flex items-center gap-0.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                        </div>
                                                    )}
                                                    <div className={`absolute bottom-0 left-0 w-full h-1 ${doctor.colorTheme?.split(' ')[0] || 'bg-white/20'}`}></div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Grid Body (Time Slots) */}
                                        <div className="relative">
                                            {timeSlots.map((time) => {
                                                const activeUnits = getActiveUnitsAtTime(allAppointments, time);
                                                const isMaxCapacity = activeUnits >= 3;

                                                return (
                                                    <div key={time} className="flex group relative">
                                                        <div className="w-20 shrink-0 border-r border-b border-white/10 sticky left-0 z-30 bg-[#0B1526] text-center py-2 text-xs text-clinical/80 font-medium">
                                                            <span className="-translate-y-3 block bg-[#0B1526] px-1 mx-auto w-fit relative">{time}</span>
                                                        </div>
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
                                            {allAppointments.map((appt: any) => {
                                                const doctorIndex = doctors.findIndex(d => d.id === appt.doctorId);
                                                if (doctorIndex === -1) return null;

                                                const startMins = parseTimeToMinutes(appt.startTime);
                                                const gridStartMins = START_HOUR * 60;
                                                const yOffset = ((startMins - gridStartMins) / TIME_INTERVAL_MINS) * 48;
                                                const height = (appt.durationMinutes / TIME_INTERVAL_MINS) * 48;
                                                const doctor = doctors[doctorIndex];

                                                // Status-based card background — status takes priority; gcal-blue only for unmodified (scheduled) gcal events
                                                const getCardStyle = (status: string, isGcal: boolean) => {
                                                    if (status === 'cancelled') return 'bg-red-500/20 border-red-500/40 text-red-100';
                                                    if (status === 'completed') return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-100';
                                                    if (status === 'arrived')   return 'bg-purple-500/20 border-purple-500/40 text-purple-100';
                                                    if (status === 'confirmed') return 'bg-green-500/20 border-green-500/40 text-green-100';
                                                    // scheduled: gcal events stay blue, local events gray
                                                    if (isGcal) return 'bg-blue-500/20 border-blue-400/40 text-blue-100';
                                                    return 'bg-gray-500/15 border-gray-400/30 text-gray-100';
                                                };

                                                // Status change: works for both local and gcal events.
                                                // If the event is a gcal import, adopt it into local appointments first.
                                                const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, apptId: string) => {
                                                    e.stopPropagation();
                                                    const newStatus = e.target.value as AppointmentType['status'];
                                                    const isLocal = appointments.some(a => a.id === apptId);
                                                    if (isLocal) {
                                                        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
                                                    } else {
                                                        // Adopt gcal event into local state so status is tracked
                                                        const gcalAppt = gcalEvents.find(ev => ev.id === apptId);
                                                        if (gcalAppt) setAppointments(prev => [...prev, { ...gcalAppt, status: newStatus }]);
                                                    }
                                                    if (newStatus === 'completed') {
                                                        setFinanceStats(prev => ({
                                                            ...prev,
                                                            weeklyIncome: prev.weeklyIncome + 1500,
                                                            monthlyIncome: prev.monthlyIncome + 1500,
                                                            monthlyPatientsTreated: prev.monthlyPatientsTreated + 1
                                                        }));
                                                    }
                                                };

                                                const cardStyle = getCardStyle(appt.status, appt.isGoogleCalendarEvent);

                                                return (
                                                    <div
                                                        key={appt.id}
                                                        onClick={() => {
                                                            const firstName = appt.patientName.split(' ')[0].toLowerCase();
                                                            const found = patients.find(p =>
                                                                p.nombres.toLowerCase().includes(firstName) ||
                                                                appt.patientName.toLowerCase().includes(p.nombres.toLowerCase())
                                                            );
                                                            if (found) {
                                                                setSelectedPatientId(found.id);
                                                                setIsPatientViewOpen(true);
                                                            } else {
                                                                setEditPatientId(undefined);
                                                                setNewPatientInitialName(appt.patientName);
                                                                setIsPatientFormOpen(true);
                                                            }
                                                        }}
                                                        className={`absolute rounded-md border p-2 text-xs overflow-hidden shadow-lg hover:z-50 hover:brightness-110 transition-all backdrop-blur-md flex flex-col pb-6 z-20 hover:scale-[1.02] cursor-pointer ${cardStyle}`}
                                                        style={{
                                                            top: `${yOffset}px`,
                                                            height: `${height}px`,
                                                            left: `calc(5rem + ${doctorIndex * 16}rem + 4px)`,
                                                            width: `calc(16rem - 8px)`
                                                        }}
                                                    >
                                                        {/* Doctor color accent bar */}
                                                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-md ${doctor.colorTheme?.split(' ')[0] || 'bg-white/30'}`}></div>

                                                        <div className="flex items-center gap-1 pl-1.5">
                                                            {appt.isGoogleCalendarEvent && (
                                                                <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 fill-blue-300 opacity-80">
                                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                                </svg>
                                                            )}
                                                            <div className="font-bold truncate">{appt.patientName}</div>
                                                        </div>
                                                        <div className="text-[10px] opacity-80 truncate pl-1.5">{appt.procedure}</div>
                                                        <div className="text-[9px] opacity-60 flex items-center justify-between mt-1 pl-1.5">
                                                            <span>{appt.startTime} ({appt.durationMinutes}m)</span>
                                                            {(appt.status === 'arrived' || appt.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                                                        </div>

                                                        {/* BOTTOM RIBBON — status selector */}
                                                        <div
                                                            className="absolute bottom-0 left-0 w-full flex items-center justify-between px-1 py-0.5 text-[9px] font-bold bg-black/20"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {appt.aiNote && isOptimized ? (
                                                                <div className="flex items-center gap-1 truncate max-w-[50%] pointer-events-none text-premium">
                                                                    <Sparkles className="w-2 h-2 shrink-0" />
                                                                    <span className="truncate">{appt.aiNote}</span>
                                                                </div>
                                                            ) : <div />}
                                                            <select
                                                                title="Estado de la cita"
                                                                aria-label="Estado de la cita"
                                                                value={appt.status}
                                                                onChange={(e) => handleStatusChange(e, appt.id)}
                                                                className="bg-transparent outline-none appearance-none cursor-pointer hover:opacity-80 transition-opacity text-right text-white"
                                                            >
                                                                <option value="scheduled" className="text-black">Por conf.</option>
                                                                <option value="confirmed" className="text-black">Confirmada</option>
                                                                <option value="arrived"   className="text-black">En sala</option>
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
                        <PatientDirectory onOpenProfile={(id) => handleOpenProfile(id)} onEditPatient={handleEditPatient} />
                    </div>
                )}
            </div>

            {/* NEW APPOINTMENT MODAL */}
            <NewAppointmentModal
                isOpen={isNewAppointmentModalOpen}
                onClose={() => {
                    setIsNewAppointmentModalOpen(false);
                    setInitialModalTime(undefined);
                    setInitialModalDoctorId(undefined);
                }}
                initialTime={initialModalTime}
                initialDoctorId={initialModalDoctorId}
                selectedDate={new Date(currentYear, currentMonth, selectedDate)}
                onAppointmentCreated={() => syncGoogleCalendar()}
                onCreatePatient={(name) => {
                    setEditPatientId(undefined);
                    setNewPatientInitialName(name || undefined);
                    setIsPatientFormOpen(true);
                }}
            />

            {/* NEW PATIENT FORM */}
            <PatientProfileForm
                isOpen={isPatientFormOpen}
                onClose={() => { setIsPatientFormOpen(false); setEditPatientId(undefined); setNewPatientInitialName(undefined); }}
                patientId={editPatientId}
                initialName={newPatientInitialName}
            />

            {/* PATIENT PROFILE VIEW */}
            {isPatientViewOpen && (
                <PatientProfile
                    patientId={selectedPatientId ?? ''}
                    patientName={patients.find(p => p.id === selectedPatientId) ? `${patients.find(p => p.id === selectedPatientId)?.nombres} ${patients.find(p => p.id === selectedPatientId)?.apellidos}` : 'Paciente Seleccionado'}
                    onClose={() => setIsPatientViewOpen(false)}
                />
            )}

            {/* GOOGLE CALENDAR SYNC MODAL */}
            <GoogleCalendarSyncModal
                isOpen={isGcalModalOpen}
                onClose={() => setIsGcalModalOpen(false)}
                onSyncComplete={() => syncGoogleCalendar()}
            />

        </motion.div>
    );
};