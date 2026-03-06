import React, { useContext, useState, ReactNode } from 'react';

import { generateMockAppointments, AppointmentType } from '../lib/agendaLogic';

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
}

export interface StaffMember {
    id: string;
    nombres: string;
    organizacion: string;
    fechaNacimiento: string;
    email: string;
    domicilio: string;
    pais: string;
    telefono: string;
    genero: string;
    estadoCivil: string;
    ciudad: string;
    especialidad: string;
    comentario: string;
    foto?: string; // Base64 string
    colorTheme?: string; // Hex color or pre-defined class for agenda (e.g. '#3b82f6')
}

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
    redesSociales?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
    };
    servicios: Record<string, Record<string, number>>; // Category -> { Service Name: Price }
    logo?: string; // Base64 logo
    staff?: StaffMember[];
    depositos?: DirectoryEntity[];
    laboratorios?: DirectoryEntity[];
    proveedores?: DirectoryEntity[];
    aseguradoras?: DirectoryEntity[];
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
    baseLocation: { lat: 19.4326, lng: -99.1332 }, // Default: Mexico City
    setBaseLocation: () => { },
    clinicProfile: null,
    setClinicProfile: () => { },
    appointments: [],
    setAppointments: () => { },
    financeStats: { weeklyIncome: 0, weeklyGoal: 80000, monthlyIncome: 0, monthlyPatientsTreated: 0 },
    setFinanceStats: () => { },
    patients: [],
    setPatients: () => { }
};

const MarketContext = React.createContext<MarketContextType>(defaultContext);

export const useMarket = () => useContext(MarketContext);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [intelligence, setIntelligence] = useState<MarketIntelligence>(defaultContext.intelligence);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [baseLocation, setBaseLocation] = useState<{ lat: number, lng: number }>(defaultContext.baseLocation);

    // New Global States
    const [appointments, setAppointments] = useState<AppointmentType[]>(generateMockAppointments());
    const [financeStats, setFinanceStats] = useState<FinanceStats>({
        weeklyIncome: 65000, // Starts below the 80k goal to test traffic light
        weeklyGoal: 80000,
        monthlyIncome: 120000,
        monthlyPatientsTreated: 80
    });
    const [patients, setPatients] = useState<Patient[]>([
        { id: '1', folio: '000001', nombres: 'Carlos', apellidos: 'Gómez', email: 'carlos@gmail.com', telefono: '555-123-4567', genero: 'Masculino', estadoCivil: 'Soltero', fechaNacimiento: '1990-05-14', tipoPaciente: 'Frecuente', alertaMedica: 'Alergia a Penicilina', alertaAdministrativa: 'Sin alerta', domicilio: 'Calle Principal 123', ciudad: 'Ciudad de México', pais: 'México', saldo: 1500, ultimaVisita: '2026-02-15' },
        { id: '2', folio: '000002', nombres: 'Lucía', apellidos: 'Fernández', email: 'lucia.f@hotmail.com', telefono: '555-987-6543', genero: 'Femenino', estadoCivil: 'Casada', fechaNacimiento: '1985-08-22', tipoPaciente: 'Nuevo', alertaMedica: 'Sin alerta', alertaAdministrativa: 'Deuda Pendiente', domicilio: 'Av. Secundaria 456', ciudad: 'Guadalajara', pais: 'México', saldo: -500, ultimaVisita: '2026-03-01' },
        { id: '3', folio: '000003', nombres: 'Roberto', apellidos: 'Medina', email: 'roberto.m@yahoo.com', telefono: '555-456-7890', genero: 'Masculino', estadoCivil: 'Divorciado', fechaNacimiento: '1975-11-30', tipoPaciente: 'General', alertaMedica: 'Hipertensión', alertaAdministrativa: 'Paciente VIP', domicilio: 'Boulevard Tercero 789', ciudad: 'Monterrey', pais: 'México', saldo: 0, ultimaVisita: '2026-03-05' },
        { id: '4', folio: '000004', nombres: 'Sofía', apellidos: 'Reyes', email: 'sofia.reyes@empresa.com', telefono: '555-789-0123', genero: 'Femenino', estadoCivil: 'Soltera', fechaNacimiento: '2000-02-14', tipoPaciente: 'Seguro Médico', alertaMedica: 'Sin alerta', alertaAdministrativa: 'Sin alerta', domicilio: 'Andador Cuarto 101', ciudad: 'Puebla', pais: 'México', saldo: 250, ultimaVisita: '2026-01-20' },
        { id: '5', folio: '000005', nombres: 'Daniel', apellidos: 'Lewis', email: 'daniellewis@gmail.com', telefono: '555-321-0987', genero: 'Masculino', estadoCivil: 'Soltero', fechaNacimiento: '1995-07-07', tipoPaciente: 'Frecuente', alertaMedica: 'Diabético Tipo 2', alertaAdministrativa: 'Sin alerta', domicilio: 'Retorno Quinto 202', ciudad: 'Tijuana', pais: 'México', saldo: 0, ultimaVisita: '2026-03-06' }
    ]);

    // Initialize profile with mock data but try to load from localStorage first
    const [clinicProfile, setClinicProfileState] = useState<ClinicProfile | null>(() => {
        const saved = localStorage.getItem('clinicProfile');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved clinic profile", e);
            }
        }
        return {
            nombre: 'Mi Clínica VIP',
            lat: 19.4326,
            lng: -99.1332,
            direccion: 'CDMX Centro',
            servicios: {
                'Preventivo': { 'Limpieza': 1200 },
                'Restauradores': { 'Implantes': 18000 },
                'Ortodónticos': { 'Ortodoncia': 30000 }
            },
            logo: '',
            staff: [
                {
                    id: '1', nombres: 'Dr. Alejandro Vargas', organizacion: 'Market Agent Pro Clínica',
                    fechaNacimiento: '1985-04-12', email: 'dr.vargas@clinica.com', domicilio: 'Av. Principal 123',
                    pais: 'México', telefono: '555-010-2020', genero: 'Masculino', estadoCivil: 'Casado',
                    ciudad: 'Ciudad de México', especialidad: 'Cirujano Maxilofacial', comentario: 'Especialista principal',
                    colorTheme: 'bg-blue-500/20 border-blue-500 text-blue-300'
                },
                {
                    id: '2', nombres: 'Dra. María Antonieta', organizacion: 'Market Agent Pro Clínica',
                    fechaNacimiento: '1990-08-22', email: 'dra.maria@clinica.com', domicilio: 'Av. Secundaria 456',
                    pais: 'México', telefono: '555-010-3030', genero: 'Femenino', estadoCivil: 'Soltera',
                    ciudad: 'Ciudad de México', especialidad: 'Ortodoncia', comentario: 'Ortodoncista',
                    colorTheme: 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                },
                {
                    id: '3', nombres: 'Dr. Carlos Mendoza', organizacion: 'Market Agent Pro Clínica',
                    fechaNacimiento: '1988-11-05', email: 'dr.carlos@clinica.com', domicilio: 'Calle Tercera 789',
                    pais: 'México', telefono: '555-010-4040', genero: 'Masculino', estadoCivil: 'Casado',
                    ciudad: 'Ciudad de México', especialidad: 'Endodoncia', comentario: 'Endodoncista',
                    colorTheme: 'bg-purple-500/20 border-purple-500 text-purple-300'
                },
                {
                    id: '4', nombres: 'Dra. Sofía Reyes', organizacion: 'Market Agent Pro Clínica',
                    fechaNacimiento: '1992-02-14', email: 'dra.sofia@clinica.com', domicilio: 'Calle Cuarta 101',
                    pais: 'México', telefono: '555-010-5050', genero: 'Femenino', estadoCivil: 'Soltera',
                    ciudad: 'Ciudad de México', especialidad: 'Odontopediatría', comentario: 'Odontopediatra',
                    colorTheme: 'bg-rose-500/20 border-rose-500 text-rose-300'
                }
            ],
            depositos: [
                {
                    id: 'd1', clave: 'DEP-01', nombre: 'Dental Depod', razonSocial: 'Fernando Lerma',
                    domicilio: 'Calle 35', codigoPostal: '', ciudad: 'Playa del Carmen', telefonos: 'Sin teléfonos',
                    email: 'facturas@dentaldepod.com', nombreContacto: '', emailContacto: '', telefonoContacto: '', comentario: 'Sin comentario'
                },
                {
                    id: 'd2', clave: 'DEP-02', nombre: 'Depósito Dental del Caribe', razonSocial: 'Raúl Gonzalez',
                    domicilio: 'Cancún Centro', codigoPostal: '77500', ciudad: 'Cancún', telefonos: 'Sin teléfonos',
                    email: '', nombreContacto: '', emailContacto: '', telefonoContacto: '', comentario: 'Proveedor rápido'
                }
            ],
            laboratorios: [
                {
                    id: 'l1', clave: 'LAB-01', nombre: 'Laboratorio A1', razonSocial: 'Laboratorio A1',
                    domicilio: 'Cancún', codigoPostal: '', ciudad: 'Cancún', telefonos: '(+52) 998 840 6062',
                    email: '', nombreContacto: '', emailContacto: '', telefonoContacto: '', comentario: 'Coronas y puentes'
                },
                {
                    id: 'l2', clave: 'LAB-02', nombre: 'Laboratorio Dental Escalante', razonSocial: '',
                    domicilio: 'Quintana Roo', codigoPostal: '77710', ciudad: 'Playa del Carmen', telefonos: '998 147 6363',
                    email: 'gustavolabor@gmail.com', nombreContacto: 'Gustavo', emailContacto: '', telefonoContacto: '', comentario: 'Ortodoncia'
                }
            ],
            proveedores: [
                {
                    id: 'p1', clave: 'PRV-01', nombre: '3B Design Laboratorio', razonSocial: 'Ivan Gonzalez',
                    domicilio: '', codigoPostal: '', ciudad: '', telefonos: '(+52) 984 278 7523',
                    email: '', nombreContacto: 'Ivan', emailContacto: '', telefonoContacto: '', comentario: 'Insumos 3D'
                }
            ],
            aseguradoras: []
        };
    });

    const setClinicProfile = (profile: ClinicProfile | null) => {
        setClinicProfileState(profile);
        if (profile) {
            localStorage.setItem('clinicProfile', JSON.stringify(profile));
        } else {
            localStorage.removeItem('clinicProfile');
        }
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
            patients, setPatients
        }}>
            {children}
        </MarketContext.Provider>
    );
};
