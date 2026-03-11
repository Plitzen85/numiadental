import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, CheckCircle2, AlertTriangle, Loader2, ClipboardList, User, ListChecks, FileSignature, CheckSquare, Square } from 'lucide-react';
import { loadClinicProfile, loadPatientRecord, CLINIC_ID, supabase } from '../lib/supabase';
import { TreatmentPlanItem, TreatmentStatus } from '../lib/supabase';
import { ClinicProfile, Patient } from '../context/MarketContext';
import { printPatientRecord, printConsentDocument } from '../utils/patientPrint';

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

// ─── Consent items ─────────────────────────────────────────────────────────────
const CONSENT_ITEMS = [
    'Autorizo a la clínica a realizar los procedimientos indicados en mi plan de tratamiento.',
    'He sido informado/a sobre los riesgos, beneficios y alternativas de los tratamientos propuestos.',
    'Entiendo que los resultados pueden variar y que se requiere seguimiento y mantenimiento.',
    'Autorizo el uso de radiografías y materiales de diagnóstico necesarios para mi atención.',
    'Consiento que mis datos clínicos sean utilizados con fines estadísticos de forma anónima.',
];

// ─── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<TreatmentStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completado',
    paid: 'Pagado',
    cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<TreatmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    paid: 'bg-purple-100 text-purple-700 border-purple-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

type ActiveSection = 'datos' | 'historial' | 'plan' | 'consentimiento';

export const RegistroPaciente: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [clinicName, setClinicName] = useState('Nümia Dental');
    const [notFound, setNotFound] = useState(false);
    const [form, setForm] = useState<PreRegForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<ActiveSection>('datos');

    // Treatment plan
    const [planItems, setPlanItems] = useState<TreatmentPlanItem[]>([]);
    const [planNotes, setPlanNotes] = useState('');

    // Consent
    const [consentChecks, setConsentChecks] = useState<boolean[]>(Array(CONSENT_ITEMS.length).fill(false));
    const [consentName, setConsentName] = useState('');
    const [consentSaved, setConsentSaved] = useState(false);
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentDate, setConsentDate] = useState('');

    useEffect(() => {
        const load = async () => {
            const profile = await loadClinicProfile<ClinicProfile>();
            if (!profile) { setNotFound(true); setLoading(false); return; }
            setClinicName(profile.nombre ?? 'Nümia Dental');
            const found = profile.patients?.find(p => p.registroToken === token);
            if (found) {
                setPatient(found);
                setConsentName(`${found.nombres} ${found.primerApellido}`);
                setForm(prev => ({
                    ...prev,
                    nombres: found.nombres, apellidos: found.primerApellido, // Changed from found.apellidos to found.primerApellido
                    email: found.email, telefono: found.telefono,
                    fechaNacimiento: found.fechaNacimiento,
                    genero: found.genero, estadoCivil: found.estadoCivil,
                    domicilio: found.domicilio, ciudad: found.ciudad,
                    motivoConsulta: '', alergias: '', enfermedades: '',
                    medicamentos: '', fumador: 'No', alcohol: 'No',
                }));
                // Load patient record — treatment plan + consent
                try {
                    const rec = await loadPatientRecord(found.id);
                    if (rec.treatmentPlan?.items?.length) {
                        const active = rec.treatmentPlan.items.filter(i => i.status !== 'cancelled');
                        setPlanItems(active);
                        setPlanNotes(rec.treatmentPlan.notes ?? '');
                    }
                } catch { /* no record yet */ }

                // Load pre-registration data
                try {
                    const { data } = await supabase
                        .from('patient_records')
                        .select('data_json')
                        .eq('clinic_id', CLINIC_ID)
                        .eq('patient_id', found.id)
                        .single();
                    if (data?.data_json) {
                        const raw = data.data_json as Record<string, unknown>;
                        if (raw._preregistro) {
                            setForm(prev => ({ ...prev, ...(raw._preregistro as Partial<PreRegForm>) }));
                        }
                        if (raw._consentimiento) {
                            const c = raw._consentimiento as { checks: boolean[]; name: string; date: string };
                            setConsentChecks(c.checks ?? Array(CONSENT_ITEMS.length).fill(false));
                            setConsentName(c.name ?? `${found.nombres} ${found.primerApellido}`); // Changed from found.apellidos to found.primerApellido
                            setConsentDate(c.date ?? '');
                            if (c.checks?.every(Boolean) && c.name) setConsentSaved(true);
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
            const { data: existing } = await supabase
                .from('patient_records')
                .select('data_json')
                .eq('clinic_id', CLINIC_ID)
                .eq('patient_id', patient.id)
                .single();

            const current = (existing?.data_json as Record<string, unknown>) ?? {};
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

    const handleConsentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient || !consentChecks.every(Boolean) || !consentName.trim()) return;
        setConsentSaving(true);
        try {
            const { data: existing } = await supabase
                .from('patient_records')
                .select('data_json')
                .eq('clinic_id', CLINIC_ID)
                .eq('patient_id', patient.id)
                .single();

            const current = (existing?.data_json as Record<string, unknown>) ?? {};
            const dateStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
            const consentPayload = { checks: consentChecks, name: consentName.trim(), date: dateStr };
            const updated = { ...current, _consentimiento: consentPayload };

            await supabase
                .from('patient_records')
                .upsert({
                    clinic_id: CLINIC_ID,
                    patient_id: patient.id,
                    data_json: updated,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'clinic_id,patient_id' });

            setConsentDate(dateStr);
            setConsentSaved(true);
            // Auto-open consent PDF so the patient can save/print it
            printConsentDocument(
                `${patient.nombres} ${patient.primerApellido}`,
                clinicName,
                consentPayload,
            );
        } catch (err) {
            console.error('Failed to save consent:', err);
        } finally {
            setConsentSaving(false);
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

    const TABS: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
        { id: 'datos', label: 'Mis Datos', icon: <User className="w-4 h-4" /> },
        { id: 'historial', label: 'Pre-registro', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'plan', label: 'Mi Plan', icon: <ListChecks className="w-4 h-4" /> },
        { id: 'consentimiento', label: 'Consentimiento', icon: <FileSignature className="w-4 h-4" /> },
    ];

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
                            onClick={() => printPatientRecord(patient, clinicName, undefined, undefined, form)}
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
                                <h1 className="text-xl font-black text-gray-800">{patient.nombres} {patient.primerApellido}</h1>
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
                <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSection(tab.id)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-sm font-bold transition-all ${activeSection === tab.id ? 'bg-white text-[#00d4ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.icon}
                            <span className="leading-tight text-center">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Datos personales ── */}
                {activeSection === 'datos' && (
                    saved ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-emerald-800 mb-1">¡Información guardada!</h3>
                            <p className="text-sm text-emerald-700">Tus datos han sido enviados a la clínica. Te esperamos.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                    )
                )}

                {/* ── Pre-registro clínico ── */}
                {activeSection === 'historial' && (
                    saved ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-emerald-800 mb-1">¡Historial guardado!</h3>
                            <p className="text-sm text-emerald-700">Tus datos clínicos han sido enviados a la clínica.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                    )
                )}

                {/* ── Mi Plan de Tratamiento ── */}
                {activeSection === 'plan' && (
                    <div className="space-y-4">
                        {planItems.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                                <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Tu plan de tratamiento aún no está disponible.</p>
                                <p className="text-gray-400 text-sm mt-1">Consulta con tu doctor para más información.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                                            Plan de Tratamiento — {planItems.length} procedimiento{planItems.length !== 1 ? 's' : ''}
                                        </h2>
                                        {planNotes && (
                                            <p className="text-xs text-gray-500 mt-1">{planNotes}</p>
                                        )}
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {planItems.map((item, i) => {
                                            const finalPrice = item.price * (1 - (item.discount ?? 0) / 100);
                                            return (
                                                <div key={item.id ?? i} className="flex items-start justify-between gap-3 px-5 py-3.5">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {item.toothNumber ? `Diente #${item.toothNumber}` : 'General'}
                                                            {item.phase ? ` · Fase ${item.phase}` : ''}
                                                            {item.doctorName ? ` · ${item.doctorName}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[item.status]}`}>
                                                            {STATUS_LABEL[item.status]}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-700">
                                                            ${finalPrice.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Total del plan</span>
                                        <span className="font-black text-gray-800 text-lg">
                                            ${planItems.filter(i => i.status !== 'cancelled').reduce((acc, i) => acc + i.price * (1 - (i.discount ?? 0) / 100), 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-emerald-600">Completado / Pagado</span>
                                        <span className="font-bold text-emerald-600">
                                            ${planItems.filter(i => i.status === 'completed' || i.status === 'paid').reduce((acc, i) => acc + i.price * (1 - (i.discount ?? 0) / 100), 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-yellow-600">Pendiente</span>
                                        <span className="font-bold text-yellow-600">
                                            ${planItems.filter(i => i.status === 'pending' || i.status === 'in_progress').reduce((acc, i) => acc + i.price * (1 - (i.discount ?? 0) / 100), 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Consentimiento informado ── */}
                {activeSection === 'consentimiento' && (
                    consentSaved ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                            <h3 className="text-lg font-bold text-emerald-800">Consentimiento firmado</h3>
                            <p className="text-sm text-emerald-700">
                                Firmado digitalmente por <strong>{consentName}</strong>
                            </p>
                            {consentDate && (
                                <p className="text-xs text-emerald-600">{consentDate}</p>
                            )}
                            <p className="text-xs text-emerald-600/70 pt-2">
                                Este consentimiento quedó registrado en tu expediente clínico.
                            </p>
                            <button
                                type="button"
                                onClick={() => patient && printConsentDocument(`${patient.nombres} ${patient.primerApellido}`, clinicName, { checks: consentChecks, name: consentName, date: consentDate })}
                                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                            >
                                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleConsentSubmit} className="space-y-5">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
                                    Consentimiento Informado
                                </h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Por favor, lee y confirma cada punto antes de firmar digitalmente tu consentimiento informado.
                                </p>

                                <div className="space-y-3">
                                    {CONSENT_ITEMS.map((item, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setConsentChecks(prev => prev.map((v, idx) => idx === i ? !v : v))}
                                            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${consentChecks[i] ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200 hover:border-[#00d4ff]/40'}`}
                                        >
                                            {consentChecks[i]
                                                ? <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                : <Square className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                                            }
                                            <span className={`text-sm leading-relaxed ${consentChecks[i] ? 'text-emerald-800' : 'text-gray-600'}`}>
                                                {item}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Digital signature */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Firma Digital</h3>
                                <p className="text-xs text-gray-400">
                                    Escribe tu nombre completo para firmar digitalmente este consentimiento.
                                </p>
                                <input
                                    className={inputCls}
                                    value={consentName}
                                    onChange={e => setConsentName(e.target.value)}
                                    placeholder="Nombre completo..."
                                />
                                {!consentChecks.every(Boolean) && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Debes confirmar todos los puntos para continuar.
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={consentSaving || !consentChecks.every(Boolean) || !consentName.trim()}
                                className="w-full bg-[#00d4ff] hover:bg-[#00bfe8] text-[#0a0a1a] font-black py-3 rounded-xl transition-colors shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {consentSaving
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Firmando...</>
                                    : <><FileSignature className="w-4 h-4" /> Firmar Consentimiento</>
                                }
                            </button>

                            <p className="text-center text-xs text-gray-400 pb-4">
                                Tu consentimiento digital tiene validez legal equivalente a una firma autógrafa. · COFEPRIS
                            </p>
                        </form>
                    )
                )}
            </div>
        </div>
    );
};
