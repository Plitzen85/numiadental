import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, CheckCircle2, AlertTriangle, Loader2, ClipboardList, User } from 'lucide-react';
import { loadClinicProfile, CLINIC_ID, supabase } from '../lib/supabase';
import { ClinicProfile, Patient } from '../context/MarketContext';
import { printPatientRecord } from '../utils/patientPrint';

// ─── Pre-registration form state ─────────────────────────────────────────────
interface PreRegForm {
    nombres: string; apellidos: string; email: string; telefono: string;
    fechaNacimiento: string; genero: string; estadoCivil: string;
    domicilio: string; ciudad: string;
    motivoConsulta: string; alergias: string; enfermedades: string;
    medicamentos: string; fumador: string; alcohol: string;
}

const EMPTY_FORM: PreRegForm = {
    nombres: '', apellidos: '', email: '', telefono: '',
    fechaNacimiento: '', genero: '', estadoCivil: '',
    domicilio: '', ciudad: '',
    motivoConsulta: '', alergias: '', enfermedades: '', medicamentos: '',
    fumador: 'No', alcohol: 'No',
};

export const RegistroPaciente: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [clinicName, setClinicName] = useState('Nümia Dental');
    const [notFound, setNotFound] = useState(false);
    const [form, setForm] = useState<PreRegForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'datos' | 'historial'>('datos');

    useEffect(() => {
        const load = async () => {
            const profile = await loadClinicProfile<ClinicProfile>();
            if (!profile) { setNotFound(true); setLoading(false); return; }
            setClinicName(profile.nombre ?? 'Nümia Dental');
            const found = profile.patients?.find(p => p.registroToken === token);
            if (found) {
                setPatient(found);
                setForm({
                    nombres: found.nombres, apellidos: found.apellidos,
                    email: found.email, telefono: found.telefono,
                    fechaNacimiento: found.fechaNacimiento,
                    genero: found.genero, estadoCivil: found.estadoCivil,
                    domicilio: found.domicilio, ciudad: found.ciudad,
                    motivoConsulta: '', alergias: '', enfermedades: '',
                    medicamentos: '', fumador: 'No', alcohol: 'No',
                });
                // Try to load any existing pre-registration data
                try {
                    const { data } = await supabase
                        .from('patient_records')
                        .select('data_json')
                        .eq('clinic_id', CLINIC_ID)
                        .eq('patient_id', found.id)
                        .single();
                    if (data?.data_json) {
                        const rec = data.data_json as any;
                        if (rec._preregistro) {
                            setForm(prev => ({ ...prev, ...rec._preregistro }));
                        }
                    }
                } catch { /* no previous record */ }
            } else {
                setNotFound(true);
            }
            setLoading(false);
        };
        load();
    }, [token]);

    const handleInput = (k: keyof PreRegForm, v: string) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient) return;
        setSaving(true);
        try {
            // Load existing record, merge pre-registration data
            const { data: existing } = await supabase
                .from('patient_records')
                .select('data_json')
                .eq('clinic_id', CLINIC_ID)
                .eq('patient_id', patient.id)
                .single();

            const current = (existing?.data_json as any) ?? {};
            const updated = { ...current, _preregistro: { ...form, _fecha: new Date().toISOString() } };

            await supabase
                .from('patient_records')
                .upsert({
                    clinic_id: CLINIC_ID,
                    patient_id: patient.id,
                    data_json: updated,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'clinic_id,patient_id' });

            setSaved(true);
        } catch (err) {
            console.error('Failed to save pre-registration:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-[#00d4ff] animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Cargando expediente...</p>
            </div>
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Enlace no válido</h2>
                <p className="text-gray-500 text-sm">Este enlace ha expirado o no existe. Solicita uno nuevo en la clínica.</p>
            </div>
        </div>
    );

    const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all";
    const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div>
                        <span className="text-lg font-black tracking-widest text-[#00d4ff]">
                            {clinicName.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 hidden sm:inline">Portal del Paciente</span>
                    </div>
                    {patient && (
                        <button
                            type="button"
                            onClick={() => printPatientRecord(patient, clinicName)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#00d4ff] transition-colors border border-gray-200 hover:border-[#00d4ff]/40 px-3 py-1.5 rounded-lg"
                        >
                            <Printer className="w-4 h-4" /> Imprimir
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Patient identity card */}
                {patient && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[#00d4ff]/10 border-2 border-[#00d4ff]/30 flex items-center justify-center flex-shrink-0">
                                {patient.foto
                                    ? <img src={patient.foto} alt="Foto" className="w-full h-full rounded-full object-cover" />
                                    : <User className="w-7 h-7 text-[#00d4ff]" />
                                }
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-gray-800">{patient.nombres} {patient.apellidos}</h1>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Paciente #{patient.numeroPaciente} · {patient.tipoPaciente}
                                </p>
                                {patient.alertaMedica && patient.alertaMedica !== 'Sin alerta' && patient.alertaMedica !== '' && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                        <AlertTriangle className="w-3 h-3" /> {patient.alertaMedica}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Section tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveSection('datos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'datos' ? 'bg-white text-[#00d4ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="w-4 h-4" /> Mis Datos
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('historial')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'historial' ? 'bg-white text-[#00d4ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ClipboardList className="w-4 h-4" /> Pre-registro Clínico
                    </button>
                </div>

                {saved ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-emerald-800 mb-1">¡Información guardada!</h3>
                        <p className="text-sm text-emerald-700">Tus datos han sido enviados a la clínica. Te esperamos.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeSection === 'datos' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
                                    Datos Personales
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Nombre(s)</label>
                                        <input className={inputCls} value={form.nombres} onChange={e => handleInput('nombres', e.target.value)} placeholder="Tu nombre" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Apellidos</label>
                                        <input className={inputCls} value={form.apellidos} onChange={e => handleInput('apellidos', e.target.value)} placeholder="Tus apellidos" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Teléfono</label>
                                        <input className={inputCls} value={form.telefono} onChange={e => handleInput('telefono', e.target.value)} placeholder="(+52) 984..." type="tel" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Correo electrónico</label>
                                        <input className={inputCls} value={form.email} onChange={e => handleInput('email', e.target.value)} placeholder="tu@email.com" type="email" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Fecha de nacimiento</label>
                                        <input className={inputCls} value={form.fechaNacimiento} onChange={e => handleInput('fechaNacimiento', e.target.value)} type="date" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Género</label>
                                        <select className={inputCls} value={form.genero} onChange={e => handleInput('genero', e.target.value)}>
                                            <option value="">Seleccionar</option>
                                            <option>Femenino</option><option>Masculino</option><option>Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Estado civil</label>
                                        <select className={inputCls} value={form.estadoCivil} onChange={e => handleInput('estadoCivil', e.target.value)}>
                                            <option value="">Seleccionar</option>
                                            <option>Soltero/a</option><option>Casado/a</option><option>Divorciado/a</option><option>Viudo/a</option><option>Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Ciudad</label>
                                        <input className={inputCls} value={form.ciudad} onChange={e => handleInput('ciudad', e.target.value)} placeholder="Tu ciudad" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Domicilio</label>
                                    <input className={inputCls} value={form.domicilio} onChange={e => handleInput('domicilio', e.target.value)} placeholder="Calle, número, colonia..." />
                                </div>
                            </div>
                        )}

                        {activeSection === 'historial' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
                                    Pre-registro Clínico
                                </h2>
                                <div>
                                    <label className={labelCls}>¿Motivo de consulta o expectativas?</label>
                                    <textarea className={`${inputCls} resize-none h-20`} value={form.motivoConsulta} onChange={e => handleInput('motivoConsulta', e.target.value)} placeholder="Describe brevemente por qué visitas la clínica..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Alergias conocidas (medicamentos, materiales, alimentos)</label>
                                    <input className={inputCls} value={form.alergias} onChange={e => handleInput('alergias', e.target.value)} placeholder="Ej. Penicilina, látex..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Enfermedades o condiciones médicas</label>
                                    <input className={inputCls} value={form.enfermedades} onChange={e => handleInput('enfermedades', e.target.value)} placeholder="Ej. Diabetes, hipertensión..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Medicamentos que toma actualmente</label>
                                    <input className={inputCls} value={form.medicamentos} onChange={e => handleInput('medicamentos', e.target.value)} placeholder="Nombre y dosis..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>¿Fuma?</label>
                                        <select className={inputCls} value={form.fumador} onChange={e => handleInput('fumador', e.target.value)}>
                                            <option>No</option><option>Ocasionalmente</option><option>Frecuentemente</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>¿Consume alcohol?</label>
                                        <select className={inputCls} value={form.alcohol} onChange={e => handleInput('alcohol', e.target.value)}>
                                            <option>No</option><option>Ocasionalmente</option><option>Frecuentemente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-[#00d4ff] hover:bg-[#00bfe8] text-[#0a0a1a] font-black py-3 rounded-xl transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                                : <><CheckCircle2 className="w-4 h-4" /> Enviar información a la clínica</>
                            }
                        </button>

                        <p className="text-center text-xs text-gray-400 pb-4">
                            Tu información es confidencial y se usa únicamente para fines clínicos. · COFEPRIS
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};