import React, { useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';

import { AppointmentType } from '../lib/agendaLogic';
import { loadClinicProfile, saveClinicProfile, supabase, CLINIC_ID } from '../lib/supabase';

// Define the shape of our data
export interface Service {
    name: string;
    priceAvg: number;
}

export interface FinanceStats {
    weeklyIncome: number;
    weeklyGoal: number;
    monthlyIncome: number;
    monthlyPatientsTreated: number;
}

export interface Patient {
    id: string;
    numeroPaciente: number;  // Auto-assigned consecutive ID, immutable after creation
    folio: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    genero: string;
    estadoCivil: string;
    fechaNacimiento: string;
    tipoPaciente: string;
    alertaMedica: string;
    alertaAdministrativa: string;
    domicilio: string;
    ciudad: string;
    pais: string;
    foto?: string;
    saldo: number;
    ultimaVisita: string;
    registroToken?: string; // Unique token for patient self-service portal link
}

export interface ModulePermissions {
    dashboard: boolean;
    radar: boolean;
    agenda: boolean;
    clinica: boolean;
    inventario: boolean;
    campanas: boolean;
    turismo: boolean;
    finanzas: boolean;
    caja: boolean;
    reportes: boolean;
    settings: boolean;
    catalogo: boolean;
    proveedores: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: ModulePermissions = {
    dashboard: true, radar: true, agenda: true, clinica: true,
    inventario: true, campanas: true, turismo: true, finanzas: true,
    caja: true, reportes: true, settings: true, catalogo: true, proveedores: true,
};

export const DEFAULT_DOCTOR_PERMISSIONS: ModulePermissions = {
    dashboard: true, radar: false, agenda: true, clinica: true,
    inventario: false, campanas: false, turismo: false, finanzas: false,
    caja: false, reportes: false, settings: false, catalogo: false, proveedores: false,
};

export interface StaffMember {
    id: string;
    nombres: string;
    organizacion: string;
    fechaNacimiento: string;
    email: string;
    password: string;
    domicilio: string;
    pais: string;
    telefono: string;
    genero: string;
    estadoCivil: string;
    ciudad: string;
    especialidad: string;
    comentario: string;
    foto?: string;
    colorTheme?: string;
    role?: 'admin' | 'doctor' | 'assistant';
    staffType: 'admin' | 'doctor' | 'external_doctor';
    modulePermissions?: ModulePermissions;
    isMasterAdmin?: boolean; // Unique role with total access
    googleCalendarConnected?: boolean; // true once doctor has authorized Google Calendar
    porcentajeComision?: number; // % del monto del tratamiento que corresponde al doctor (ej: 30)
    cedProfesional?: string;    // Cédula profesional individual del doctor
}

/** True if staff member can be assigned as treating doctor */
export const isDoctor = (s: StaffMember) =>
    s.staffType === 'doctor' || s.staffType === 'external_doctor';

export interface DirectoryEntity {
    id: string;
    clave: string;
    nombre: string;
    razonSocial: string;
    domicilio: string;
    codigoPostal: string;
    ciudad: string;
    telefonos: string;
    email: string;
    nombreContacto: string;
    emailContacto: string;
    telefonoContacto: string;
    comentario: string;
}

export interface ClinicProfile {
    nombre: string;
    lat: number;
    lng: number;
    direccion: string;
    telefono?: string;
    email?: string;
    medicoResponsable?: string;
    cedProfesional?: string;
    redesSociales?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
    };
    servicios: Record<string, Record<string, number>>; // Category -> { Service Name: Price }
    odontogramPrices?: Record<string, { name: string; price: number }>; // ToothCondition -> price info
    catalogoExtra?: { id: string; name: string; price: number }[]; // Extra clinic treatments (Tourism reference)
    catalogoHospedaje?: Record<string, number>; // Accommodation per-night prices
    catalogoTransporte?: Record<string, number>; // 'Transportación' (one-way) and 'Comida Wellness' (per day)
    logo?: string; // Base64 logo
    staff?: StaffMember[];
    depositos?: DirectoryEntity[];
    laboratorios?: DirectoryEntity[];
    proveedores?: DirectoryEntity[];
    aseguradoras?: DirectoryEntity[];
    patients?: Patient[]; // Persisted patient list
    whatsappTemplate?: string; // Configurable reminder template
    timezone?: string;          // IANA timezone e.g. 'America/Mexico_City' (default)
    identidadCorporativa?: {
        logo?: string;           // Base64 or URL
        slogan?: string;
        colorPrimario?: string;  // hex e.g. '#00d4ff'
        website?: string;
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
        twitter?: string;
        tiktok?: string;
        pieDePagina?: string;     // Custom footer text for PDFs
        direccionDocumentos?: string;
        telefonoDocumentos?: string;
        emailDocumentos?: string;
    };
}

export interface Competitor {
    id: string;
    nombre: string;
    direccion: string;
    servicios: string[];
    precios: Record<string, number>;
    rating: number;
    distancia_km: number;
    segmento: 'Premium' | 'Standard' | 'Low-cost';
    posicionamiento: string;
    lat: number;
    lng: number;
}

export interface MarketIntelligence {
    saturationIndex: number; // 0 to 100
    topService: string;
    averageCAC: number;
    alerts: { type: 'warning' | 'opportunity' | 'info'; message: string }[];
}

export interface MarketContextType {
    competitors: Competitor[];
    setCompetitors: (data: Competitor[]) => void;
    intelligence: MarketIntelligence;
    setIntelligence: (data: MarketIntelligence) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    searchRadius: number;
    setSearchRadius: (km: number) => void;
    baseLocation: { lat: number; lng: number };
    setBaseLocation: (loc: { lat: number; lng: number }) => void;
    clinicProfile: ClinicProfile | null;
    setClinicProfile: (profile: ClinicProfile | null) => void;
    appointments: AppointmentType[];
    setAppointments: React.Dispatch<React.SetStateAction<AppointmentType[]>>;
    financeStats: FinanceStats;
    setFinanceStats: React.Dispatch<React.SetStateAction<FinanceStats>>;
    patients: Patient[];
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
    // RBAC
    currentUserId: string;
    setCurrentUserId: (id: string) => void;
    hasPermission: (module: keyof ModulePermissions) => boolean;
    updateStaffPermissions: (staffId: string, permissions: ModulePermissions) => void;
    updateStaffPassword: (staffId: string, newPassword: string) => void;
    updateStaffMember: (staffId: string, updates: Partial<StaffMember>) => void;
    setMasterAdmin: (staffId: string) => void;
    syncError: string | null;
    hasSyncedFromCloud: boolean;
    syncFromCloud: () => Promise<void>;
}

const defaultContext: MarketContextType = {
    competitors: [],
    setCompetitors: () => { },
    intelligence: { saturationIndex: 0, topService: 'N/A', averageCAC: 0, alerts: [] },
    setIntelligence: () => { },
    isLoading: false,
    setIsLoading: () => { },
    searchRadius: 10,
    setSearchRadius: () => { },
    baseLocation: { lat: 19.4326, lng: -99.1332 },
    setBaseLocation: () => { },
    clinicProfile: null,
    setClinicProfile: () => { },
    appointments: [],
    setAppointments: () => { },
    financeStats: { weeklyIncome: 0, weeklyGoal: 80000, monthlyIncome: 0, monthlyPatientsTreated: 0 },
    setFinanceStats: () => { },
    patients: [],
    setPatients: () => { },
    // RBAC defaults
    currentUserId: '1',
    setCurrentUserId: () => { },
    hasPermission: () => true,
    updateStaffPermissions: () => { },
    updateStaffPassword: () => { },
    updateStaffMember: () => { },
    setMasterAdmin: () => { },
    syncError: null,
    hasSyncedFromCloud: false,
    syncFromCloud: async () => { },
};

const MarketContext = React.createContext<MarketContextType>(defaultContext);

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState<string>('1');
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [intelligence, setIntelligence] = useState<MarketIntelligence>(defaultContext.intelligence);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [baseLocation, setBaseLocation] = useState<{ lat: number, lng: number }>(defaultContext.baseLocation);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [hasSyncedFromCloud, setHasSyncedFromCloud] = useState<boolean>(false);

    // Global States
    // Start empty — real data comes from Google Calendar sync.
    // Mock data is only injected by the AI Scheduler button for demo purposes.
    const [appointments, setAppointments] = useState<AppointmentType[]>([]);
    const [financeStats, setFinanceStats] = useState<FinanceStats>({
        weeklyIncome: 65000,
        weeklyGoal: 80000,
        monthlyIncome: 120000,
        monthlyPatientsTreated: 80
    });
    // ── Patients — initialized from localStorage for instant hydration on refresh ──
    const [patients, setPatientsState] = useState<Patient[]>(() => {
        try {
            const saved = localStorage.getItem('clinicProfile');
            if (saved) return (JSON.parse(saved) as ClinicProfile).patients ?? [];
        } catch { /* ignore */ }
        return [];
    });
    const clinicProfileRef = useRef<ClinicProfile | null>(null);
    const hasSyncedRef = useRef(false);
    const patientsRef = useRef<Patient[]>([]);

    // Schema version — bump to force-clear stale localStorage on breaking changes
    const SCHEMA_V = 'v2.7';

    const SEED_PROFILE: ClinicProfile = {
        nombre: 'Nümia Dental',
        lat: 19.4326,
        lng: -99.1332,
        direccion: 'Playa del Carmen',
        servicios: {},
        logo: '',
        staff: [
            {
                id: '1', nombres: 'Kike Vazquez', organizacion: 'Nümia Dental',
                fechaNacimiento: '1985-02-03', email: 'admin@numiadental.com',
                password: '12345',
                domicilio: 'Los Olivos', pais: 'México', telefono: '984-120-1970',
                genero: 'Masculino', estadoCivil: 'Casado(a)', ciudad: 'Playa del Carmen',
                especialidad: 'Director Administrativo', comentario: 'Director Administrativo',
                colorTheme: 'bg-blue-500/20 border-blue-500 text-blue-300',
                role: 'admin', staffType: 'admin',
                modulePermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
                isMasterAdmin: true
            },
            {
                id: 'p-pamela', nombres: 'Pamela Salinas', organizacion: 'Nümia Dental',
                fechaNacimiento: '1990-05-17', email: 'pam@numiadental.com',
                password: '12345',
                domicilio: 'Los Olivos', pais: 'México', telefono: '',
                genero: 'Femenino', estadoCivil: 'Casado(a)', ciudad: 'Playa del Carmen',
                especialidad: 'Periodoncista', comentario: 'Periodoncista',
                staffType: 'doctor', role: 'doctor',
                modulePermissions: { ...DEFAULT_DOCTOR_PERMISSIONS }
            },
            {
                id: 'p-rocio', nombres: 'Rocio Vazquez', organizacion: 'Nümia Dental (Externo)',
                fechaNacimiento: '1987-09-02', email: 'rocio@numiadental.com',
                password: '12345',
                domicilio: 'Monterrey', pais: 'México', telefono: '',
                genero: 'Femenino', estadoCivil: 'Soltero(a)', ciudad: 'Monterrey',
                especialidad: 'Psicologia', comentario: 'Psicologa',
                staffType: 'admin', role: 'assistant',
                modulePermissions: { ...DEFAULT_DOCTOR_PERMISSIONS, agenda: true, clinica: true }
            },
            {
                id: 'p-santiago', nombres: 'Santiago Treviño', organizacion: 'Nümia Dental (Externo)',
                fechaNacimiento: '1985-10-13', email: 'santi@numiadental.com',
                password: '12345',
                domicilio: 'Monterrey', pais: 'México', telefono: '',
                genero: 'Masculino', estadoCivil: 'Soltero(a)', ciudad: 'Monterrey',
                especialidad: 'Gerente de Identidad Corporativa y Marketing', comentario: 'Gerente de Identidad Corporativa y Marketing',
                staffType: 'doctor', role: 'doctor',
                modulePermissions: { ...DEFAULT_DOCTOR_PERMISSIONS }
            },
            {
                id: 'p-eduardo', nombres: 'Eduardo Nepote', organizacion: 'Nümia Dental',
                fechaNacimiento: '1984-12-17', email: 'nepo@numiadental.com',
                password: '12345',
                domicilio: 'Guadalajara', pais: 'México', telefono: '333-667-2505',
                genero: 'Masculino', estadoCivil: 'Casado(a)', ciudad: 'Guadalajara',
                especialidad: 'Asesor Tecnico', comentario: 'El mero mero',
                staffType: 'doctor', role: 'doctor',
                modulePermissions: { ...DEFAULT_DOCTOR_PERMISSIONS }
            }
        ],
        depositos: [],
        laboratorios: [],
        proveedores: [],
        aseguradoras: []
    };

    const [clinicProfile, setClinicProfileState] = useState<ClinicProfile | null>(() => {
        const saved = localStorage.getItem('clinicProfile');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const stale = parsed.staff?.some((s: StaffMember) => !s.password || !s.staffType);
                if (!stale) {
                    localStorage.setItem('clinicProfile_schema', SCHEMA_V);
                    return parsed;
                }
            } catch (e) {
                console.error('Failed to parse saved clinic profile', e);
            }
        }
        return SEED_PROFILE;
    });

    const syncFromCloud = async () => {
        console.log('[MarketContext] Attempting to load profile from cloud...');
        setIsLoading(true);
        try {
            const cloudProfile = await loadClinicProfile<ClinicProfile>();
            if (cloudProfile) {
                console.log('[MarketContext] Cloud profile loaded successfully:', cloudProfile.nombre);
                // Merge: prefer cloud patients if present, otherwise keep local patients
                const localPatients = patientsRef.current;
                const mergedPatients = cloudProfile.patients ?? localPatients;
                const merged = { ...cloudProfile, patients: mergedPatients };
                setClinicProfileState(merged);
                setPatientsState(mergedPatients);
                localStorage.setItem('clinicProfile', JSON.stringify(merged));
                localStorage.setItem('clinicProfile_schema', SCHEMA_V);
                // If cloud was missing patients but we have local ones, back-fill to cloud
                if (cloudProfile.patients === undefined && localPatients.length > 0) {
                    saveClinicProfile(merged).catch(e =>
                        console.error('[MarketContext] Failed to back-fill patients to cloud:', e)
                    );
                }
                setSyncError(null);
                setHasSyncedFromCloud(true);
                hasSyncedRef.current = true;
            } else {
                console.warn('[MarketContext] No cloud profile found.');
                setHasSyncedFromCloud(true); // Allow saving initial profile
                setSyncError(null);
            }
        } catch (e: any) {
            console.error('[MarketContext] Cloud sync failed:', e);
            const msg = e.message || '';
            if (msg.includes('schema cache') || msg.includes('does not exist')) {
                setSyncError('¡TABLA FALTANTE! Debes crear la tabla "clinic_profiles" en el SQL Editor de Supabase para activar la nube.');
            } else {
                setSyncError('Falla de conexión: No se pudo sincronizar con la nube.');
            }
            setHasSyncedFromCloud(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Cloud Sync: Load from Supabase on mount
    useEffect(() => {
        syncFromCloud();

        // ─── Supabase Realtime Subscription ──────────────────────────────────
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'clinic_profiles',
                    filter: `id=eq.${CLINIC_ID}`
                },
                (payload) => {
                    console.log('[MarketContext] Realtime update received:', payload);
                    const newProfile = payload.new.profile_json as ClinicProfile;
                    if (newProfile) {
                        const merged = { ...newProfile, patients: newProfile.patients ?? patientsRef.current };
                        setClinicProfileState(merged);
                        setPatientsState(merged.patients ?? []);
                        localStorage.setItem('clinicProfile', JSON.stringify(merged));
                        localStorage.setItem('clinicProfile_schema', SCHEMA_V);
                        setSyncError(null);
                    }
                }
            )
            .subscribe((status) => {
                console.log('[MarketContext] Realtime subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const setClinicProfile = async (profile: ClinicProfile | null) => {
        setClinicProfileState(profile);
        if (profile) {
            localStorage.setItem('clinicProfile', JSON.stringify(profile));
            localStorage.setItem('clinicProfile_schema', SCHEMA_V);

            if (!hasSyncedFromCloud) {
                console.error('[MarketContext] Safety block: Attempted to save before successful sync.');
                setSyncError('Bloqueo de seguridad: No se puede guardar sin sincronización previa exitosa.');
                return;
            }

            const result = await saveClinicProfile(profile);
            if (!result.success) {
                setSyncError(result.error || 'Error al guardar en la nube');
            } else {
                setSyncError(null);
            }
        } else {
            localStorage.removeItem('clinicProfile');
            localStorage.removeItem('clinicProfile_schema');
        }
    };

    // Keep refs current (always fresh values without stale closures)
    useEffect(() => { clinicProfileRef.current = clinicProfile; }, [clinicProfile]);
    useEffect(() => { hasSyncedRef.current = hasSyncedFromCloud; }, [hasSyncedFromCloud]);
    useEffect(() => { patientsRef.current = patients; }, [patients]);

    // setPatients: updates state AND immediately persists to localStorage + Supabase.
    // Uses setTimeout(0) to run after the render commit, safely outside the updater.
    const setPatients: React.Dispatch<React.SetStateAction<Patient[]>> = useCallback(
        (updater) => {
            let captured: Patient[] | undefined;
            setPatientsState(prev => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                captured = next;
                return next;
            });
            setTimeout(() => {
                const next = captured;
                if (next === undefined) return;
                const profile = clinicProfileRef.current;
                if (!profile) return;
                const updated = { ...profile, patients: next };
                setClinicProfileState(updated);
                localStorage.setItem('clinicProfile', JSON.stringify(updated));
                if (hasSyncedRef.current) {
                    saveClinicProfile(updated).catch(e =>
                        console.error('[MarketContext] Failed to persist patients:', e)
                    );
                }
            }, 0);
        },
        []
    );

    // RBAC helpers
    const hasPermission = (module: keyof ModulePermissions): boolean => {
        const staff = clinicProfile?.staff ?? [];
        const user = staff.find(s => s.id === currentUserId);
        if (!user) return true;
        if (user.isMasterAdmin) return true;
        if (user.role === 'admin') return true;
        if (module === 'settings') return true;
        return user.modulePermissions?.[module] ?? false;
    };

    const updateStaffPermissions = (staffId: string, permissions: ModulePermissions) => {
        if (!clinicProfile) return;
        const updatedStaff = (clinicProfile.staff ?? []).map(s =>
            s.id === staffId ? { ...s, modulePermissions: permissions } : s
        );
        setClinicProfile({ ...clinicProfile, staff: updatedStaff });
    };

    const updateStaffPassword = (staffId: string, newPassword: string) => {
        if (!clinicProfile) return;
        const updatedStaff = (clinicProfile.staff ?? []).map(s =>
            s.id === staffId ? { ...s, password: newPassword } : s
        );
        setClinicProfile({ ...clinicProfile, staff: updatedStaff });
    };

    const updateStaffMember = (staffId: string, updates: Partial<StaffMember>) => {
        if (!clinicProfile) return;
        const updatedStaff = (clinicProfile.staff ?? []).map(s =>
            s.id === staffId ? { ...s, ...updates } : s
        );
        setClinicProfile({ ...clinicProfile, staff: updatedStaff });
    };

    const setMasterAdmin = (staffId: string) => {
        if (!clinicProfile) return;
        const updatedStaff = (clinicProfile.staff ?? []).map(s => ({
            ...s,
            isMasterAdmin: s.id === staffId
        }));
        setClinicProfile({ ...clinicProfile, staff: updatedStaff });
    };

    return (
        <MarketContext.Provider value={{
            competitors, setCompetitors,
            intelligence, setIntelligence,
            isLoading, setIsLoading,
            searchRadius, setSearchRadius,
            baseLocation, setBaseLocation,
            clinicProfile, setClinicProfile,
            appointments, setAppointments,
            financeStats, setFinanceStats,
            patients, setPatients,
            currentUserId, setCurrentUserId,
            hasPermission,
            updateStaffPermissions,
            updateStaffPassword,
            updateStaffMember,
            setMasterAdmin,
            syncError,
            hasSyncedFromCloud,
            syncFromCloud,
        }}>
            {children}
        </MarketContext.Provider>
    );
};
