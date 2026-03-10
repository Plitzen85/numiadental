import React, { useState, useEffect, useRef } from 'react';
import {
    User, Activity, FileText, BriefcaseMedical, Camera,
    Sparkles, Trash2, Loader2, CheckCircle2, Plus, Layers,
    AlertTriangle, ShieldAlert, Printer, Link2, Landmark,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AIClinicalViewer } from './AIClinicalViewer';
import { HybridChart } from './patient/HybridChart';
import { VisitRecord } from './patient/VisitRecord';
import { TreatmentPipeline } from './patient/TreatmentPipeline';
import { PatientFinanzas } from './patient/PatientFinanzas';
import { useMarket } from '../context/MarketContext';
import { printPatientRecord, getOrCreateToken } from '../utils/patientPrint';
import {
    loadPatientRecord, savePatientRecord, uploadPatientFile, deletePatientFile,
    PatientMedicalHistory, PatientFile,
    PatientVisit, TreatmentPlan, VisitStatus, PatientPayment,
} from '../lib/supabase';

interface PatientProfileProps {
    patientId: string;
    patientName: string;
    onClose: () => void;
    initialTab?: TabId;
}

// ─── Visit status config (for list sidebar) ───────────────────────────────────
const VISIT_STATUS_DOT: Record<VisitStatus, string> = {
    attended:          'bg-emerald-500',
    cancelled_patient: 'bg-red-500',
    cancelled_clinic:  'bg-orange-500',
    no_show:           'bg-gray-500',
};

type TabId = 'historial' | 'odontograma' | 'consultas' | 'plan_tratamiento' | 'finanzas';

export const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, patientName, onClose, initialTab }) => {
    const { currentUserId, clinicProfile, patients, setPatients } = useMarket();
    const currentDoctor = clinicProfile?.staff?.find(s => s.id === currentUserId);
    const patient = patients.find(p => p.id === patientId);
    const hasMedAlert  = patient?.alertaMedica  && patient.alertaMedica  !== 'Sin alerta' && patient.alertaMedica !== '';
    // Admin alert: use configured alert from patient data, or auto-detect real adeudo (saldo < 0)
    const configuredAdminAlert = patient?.alertaAdministrativa && patient.alertaAdministrativa !== 'Sin alerta' && patient.alertaAdministrativa !== ''
        ? patient.alertaAdministrativa
        : null;
    const adeudoAlert = (patient?.saldo !== undefined && patient.saldo < 0)
        ? `Saldo deudor: $${Math.abs(patient.saldo).toLocaleString('es-MX')}`
        : null;
    const adminAlertText = configuredAdminAlert ?? adeudoAlert;
    const hasAdminAlert = !!adminAlertText;

    const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'historial');
    const [isAIViewerOpen, setIsAIViewerOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handlePrint = () => {
        if (!patient) return;
        printPatientRecord(patient, clinicProfile?.nombre ?? 'Nümia Dental', medicalHistory);
    };

    const handleGenerateLink = () => {
        if (!patient) return;
        let token = patient.registroToken;
        if (!token) {
            token = getOrCreateToken();
            setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, registroToken: token! } : p));
        }
        const url = `${window.location.origin}/registro/${token}`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        });
    };

    // ── Payments state ───────────────────────────────────────────────────────
    const [payments, setPayments] = useState<PatientPayment[]>([]);

    // ── Clinical record state ────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingHistory, setIsSavingHistory] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory>({
        alergias: false, diabetes: false, hipertension: false,
        cardiopatia: false, embarazo: false, medicamentos: '', notas: '',
    });
    const [files, setFiles] = useState<PatientFile[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Visits & Treatment Plan state ────────────────────────────────────────
    const [visits, setVisits] = useState<PatientVisit[]>([]);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan>({ items: [], notes: '', updatedAt: '' });
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

    // ── Load record on mount ─────────────────────────────────────────────────
    useEffect(() => {
        setIsLoading(true);
        loadPatientRecord(patientId).then(record => {
            setMedicalHistory(record.medicalHistory ?? {
                alergias: false, diabetes: false, hipertension: false,
                cardiopatia: false, embarazo: false, medicamentos: '', notas: '',
            });
            setFiles(record.files ?? []);
            setVisits(record.visits ?? []);
            setTreatmentPlan(record.treatmentPlan ?? { items: [], notes: '', updatedAt: '' });
            setPayments(record.payments ?? []);
            // pre-select most recent visit
            if (record.visits?.length) {
                const sorted = [...record.visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setSelectedVisitId(sorted[0].id);
            }
            setIsLoading(false);
        });
    }, [patientId]);

    const showSaved = (msg = '¡Guardado!') => {
        setSavedMsg(msg);
        setTimeout(() => setSavedMsg(''), 2500);
    };

    // ── Medical history ──────────────────────────────────────────────────────
    const handleSaveHistory = async () => {
        setIsSavingHistory(true);
        await savePatientRecord(patientId, { medicalHistory });
        setIsSavingHistory(false);
        showSaved('Historial actualizado');
    };

    // ── Global files (radiografías, documentos) ──────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        const result = await uploadPatientFile(patientId, file);
        if (result) {
            const newFile: PatientFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                storagePath: result.storagePath,
                url: result.url,
                createdAt: new Date().toISOString(),
                type: file.type.startsWith('image/') ? 'radiografia' : 'documento',
            };
            const updatedFiles = [...files, newFile];
            await savePatientRecord(patientId, { files: updatedFiles });
            setFiles(updatedFiles);
            showSaved('Archivo subido');
        }
        setIsUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteFile = async (fileItem: PatientFile) => {
        if (!confirm(`¿Eliminar "${fileItem.name}"?`)) return;
        await deletePatientFile(fileItem.storagePath);
        const updated = files.filter(f => f.id !== fileItem.id);
        await savePatientRecord(patientId, { files: updated });
        setFiles(updated);
    };

    // ── Visits ───────────────────────────────────────────────────────────────
    const handleCreateVisit = async () => {
        const newVisit: PatientVisit = {
            id: `visit-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            doctorId: currentUserId,
            doctorName: currentDoctor?.nombres ?? 'Doctor',
            chiefComplaint: '',
            diagnosis: '',
            procedures: '',
            evolutionNote: '',
            status: 'attended',
            duration: 30,
            files: [],
        };
        const updatedVisits = [newVisit, ...visits];
        await savePatientRecord(patientId, { visits: updatedVisits });
        setVisits(updatedVisits);
        setSelectedVisitId(newVisit.id);
        showSaved('Nueva consulta creada');
    };

    const handleSaveVisit = async (updated: PatientVisit) => {
        const updatedVisits = visits.map(v => v.id === updated.id ? updated : v);
        await savePatientRecord(patientId, { visits: updatedVisits });
        setVisits(updatedVisits);
    };

    const handleDeleteVisit = async (id: string) => {
        if (!confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
        const updatedVisits = visits.filter(v => v.id !== id);
        await savePatientRecord(patientId, { visits: updatedVisits });
        setVisits(updatedVisits);
        const sorted = [...updatedVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSelectedVisitId(sorted[0]?.id ?? null);
    };

    // ── Treatment Plan ───────────────────────────────────────────────────────
    const handleSaveTreatmentPlan = async (plan: TreatmentPlan) => {
        await savePatientRecord(patientId, { treatmentPlan: plan });
        setTreatmentPlan(plan);
    };

    // ── Payments ──────────────────────────────────────────────────────────────
    const handleSavePayment = async (payment: PatientPayment) => {
        const updated = [payment, ...payments];
        await savePatientRecord(patientId, { payments: updated });
        setPayments(updated);
    };

    const formatVisitDate = (iso: string) => {
        const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Sorted visits newest first
    const sortedVisits = [...visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const selectedVisit = visits.find(v => v.id === selectedVisitId) ?? null;

    // ── Tab definition ───────────────────────────────────────────────────────
    const TABS: { id: TabId; label: string; icon: React.ReactNode; accent: string }[] = [
        { id: 'historial',        label: 'Historial Clínico',    icon: <User           className="w-4 h-4" />, accent: 'border-electric text-electric' },
        { id: 'odontograma',      label: 'Odontograma / Perio',  icon: <Activity       className="w-4 h-4" />, accent: 'border-emerald-400 text-emerald-400' },
        { id: 'consultas',        label: 'Consultas',            icon: <BriefcaseMedical className="w-4 h-4" />, accent: 'border-blue-400 text-blue-400' },
        { id: 'plan_tratamiento', label: 'Plan de Tratamiento',  icon: <Layers         className="w-4 h-4" />, accent: 'border-japandi-wood text-japandi-wood' },
        { id: 'finanzas',         label: 'Caja',                 icon: <Landmark       className="w-4 h-4" />, accent: 'border-premium text-premium' },
    ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-cobalt/95 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-cobalt border border-white/10 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-white/5 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-electric/20 flex items-center justify-center border border-electric/40">
                            <span className="font-syne font-bold text-2xl text-electric">{patientName.charAt(0)}</span>
                        </div>
                        <div>
                            <h2 className="font-syne text-2xl font-bold text-white">{patientName}</h2>
                            <p className="text-clinical/60 text-sm">
                                ID: {patientId} · Expediente Clínico
                                {visits.length > 0 && <span className="ml-2 text-clinical/40">· {visits.length} consultas</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {savedMsg && (
                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-pulse">
                                <CheckCircle2 className="w-4 h-4" /> {savedMsg}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handlePrint}
                            title="Imprimir expediente"
                            className="text-clinical/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateLink}
                            title="Generar link de pre-registro"
                            className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-clinical/70 hover:text-white"
                        >
                            <Link2 className="w-4 h-4" />
                            <span className="hidden sm:inline">{linkCopied ? '¡Copiado!' : 'Link'}</span>
                        </button>
                        <button onClick={() => setIsAIViewerOpen(true)} className="bg-electric/20 text-electric hover:bg-electric/30 border border-electric/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                            <Sparkles className="w-4 h-4" /> NÜMIA AI
                        </button>
                        <button onClick={onClose} className="text-clinical/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">Cerrar</button>
                    </div>
                </div>

                {/* ── Alert banners (persistent across all tabs) ──────────── */}
                {(hasMedAlert || hasAdminAlert) && (
                    <div className="flex gap-2 px-6 pt-3 pb-1 flex-shrink-0 flex-wrap">
                        {hasMedAlert && (
                            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-2 flex-1 min-w-[220px]">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-red-400/70 uppercase tracking-widest font-bold">Alerta Médica</p>
                                    <p className="text-red-300 text-sm font-bold leading-tight">{patient?.alertaMedica}</p>
                                </div>
                            </div>
                        )}
                        {hasAdminAlert && (
                            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-2 flex-1 min-w-[220px]">
                                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-amber-400/70 uppercase tracking-widest font-bold">Alerta Administrativa</p>
                                    <p className="text-amber-300 text-sm font-bold leading-tight">{adminAlertText}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex border-b border-white/10 px-6 flex-shrink-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-4 text-sm font-bold flex gap-2 items-center whitespace-nowrap transition-colors border-b-2 flex-shrink-0 ${activeTab === tab.id ? tab.accent : 'border-transparent text-clinical/60 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Content ─────────────────────────────────────────────── */}
                <div className={`flex-1 overflow-hidden ${activeTab === 'consultas' ? '' : 'overflow-y-auto'}`}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-electric animate-spin" />
                            <span className="ml-3 text-clinical/50">Cargando expediente...</span>
                        </div>
                    ) : (
                        <>
                            {/* ══ HISTORIAL CLÍNICO ══ */}
                            {activeTab === 'historial' && (
                                <div className="p-6 space-y-6 overflow-y-auto h-full animate-in fade-in duration-300">

                                    {/* Active alert detail cards */}
                                    {(hasMedAlert || hasAdminAlert) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {hasMedAlert && (
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-red-400/70 uppercase tracking-widest font-bold mb-0.5">⚠ Alerta Médica Activa</p>
                                                        <p className="text-red-300 font-bold text-base">{patient?.alertaMedica}</p>
                                                        <p className="text-red-400/50 text-[10px] mt-1">Verificar antes de administrar cualquier medicamento o tratamiento</p>
                                                    </div>
                                                </div>
                                            )}
                                            {hasAdminAlert && (
                                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold mb-0.5">⚠ Alerta Administrativa</p>
                                                        <p className="text-amber-300 font-bold text-base">{adminAlertText}</p>
                                                        <p className="text-amber-400/50 text-[10px] mt-1">Verificar situación antes de procesar cobros o emitir facturas</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <h3 className="font-syne text-lg text-white">Antecedentes Médicos</h3>
                                        <button onClick={handleSaveHistory} disabled={isSavingHistory} className="flex items-center gap-2 bg-electric/10 border border-electric/30 text-electric text-xs font-bold px-4 py-2 rounded-lg hover:bg-electric/20 transition-all disabled:opacity-40">
                                            {isSavingHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Guardar Historial
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            {([
                                                { key: 'alergias',     label: 'Alergias a Medicamentos', color: 'red' },
                                                { key: 'diabetes',     label: 'Diabetes',                color: 'orange' },
                                                { key: 'hipertension', label: 'Hipertensión',            color: 'yellow' },
                                                { key: 'cardiopatia',  label: 'Cardiopatía',             color: 'red' },
                                                { key: 'embarazo',     label: 'Embarazo',                color: 'pink' },
                                            ] as const).map(({ key, label, color }) => (
                                                <label key={key} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${medicalHistory[key] ? `border-${color}-500/50 bg-${color}-500/10` : 'border-white/10 bg-white/5'}`}>
                                                    <input
                                                        title={label} type="checkbox"
                                                        checked={medicalHistory[key]}
                                                        onChange={e => setMedicalHistory(h => ({ ...h, [key]: e.target.checked }))}
                                                        className="w-5 h-5 rounded"
                                                    />
                                                    <span className={medicalHistory[key] ? 'text-white font-bold' : 'text-clinical/90'}>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Medicamentos actuales</label>
                                                <textarea title="Medicamentos actuales"
                                                    className="w-full min-h-[80px] bg-black/30 border border-white/10 rounded-xl p-4 text-clinical/80 focus:border-electric outline-none resize-none text-sm"
                                                    placeholder="Lista de medicamentos que toma actualmente..."
                                                    value={medicalHistory.medicamentos ?? ''}
                                                    onChange={e => setMedicalHistory(h => ({ ...h, medicamentos: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">Notas adicionales</label>
                                                <textarea title="Notas adicionales"
                                                    className="w-full min-h-[80px] bg-black/30 border border-white/10 rounded-xl p-4 text-clinical/80 focus:border-electric outline-none resize-none text-sm"
                                                    placeholder="Antecedentes adicionales, enfermedades sistémicas..."
                                                    value={medicalHistory.notas ?? medicalHistory.notes ?? ''}
                                                    onChange={e => setMedicalHistory(h => ({ ...h, notas: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Global files section */}
                                    <div className="pt-6 border-t border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-syne text-lg text-white">Archivos Generales</h3>
                                            <p className="text-xs text-clinical/40">Radiografías, documentos e imágenes del expediente</p>
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}
                                                className="flex items-center gap-2 bg-white/5 border border-white/20 text-clinical text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40">
                                                {isUploadingFile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} Subir Archivo
                                            </button>
                                            <input ref={fileInputRef} type="file" title="Subir archivo" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {files.map(f => (
                                                <div key={f.id} className="aspect-square border border-white/10 rounded-xl bg-black/50 p-2 relative group overflow-hidden">
                                                    {f.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
                                                        ? <img src={f.url} alt={f.name} className="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity" />
                                                        : <div className="w-full h-full flex flex-col items-center justify-center text-clinical/40"><FileText className="w-10 h-10 mb-1" /><span className="text-[9px] text-center break-all px-1">{f.name}</span></div>
                                                    }
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                        <a href={f.url} target="_blank" rel="noreferrer" className="text-[10px] text-white font-bold bg-electric/80 px-3 py-1 rounded-lg">Ver</a>
                                                        <button onClick={() => handleDeleteFile(f)} className="text-[10px] text-red-400 font-bold bg-red-500/20 px-3 py-1 rounded-lg flex items-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                                                    </div>
                                                    <span className="absolute bottom-2 left-2 right-2 text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-white font-bold truncate">{f.name}</span>
                                                </div>
                                            ))}
                                            <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-clinical/50 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                <Camera className="w-8 h-8 mb-2" />
                                                <span className="text-xs text-center px-2">Subir Archivo</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ ODONTOGRAMA / PERIO ══ */}
                            {activeTab === 'odontograma' && (
                                <div className="p-6 space-y-4 overflow-y-auto h-full animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2 bg-electric/5 border border-electric/20 rounded-xl px-4 py-2">
                                        <Activity className="w-4 h-4 text-electric" />
                                        <p className="text-electric text-sm font-bold">Odontograma + Periodontograma Interactivo</p>
                                        <span className="ml-auto text-[10px] text-clinical/40 uppercase tracking-widest">Haz clic en las superficies para marcar tratamientos</span>
                                    </div>
                                    <div className="w-full min-h-[600px]">
                                        <HybridChart patientId={patientId} />
                                    </div>
                                </div>
                            )}

                            {/* ══ CONSULTAS ══ */}
                            {activeTab === 'consultas' && (
                                <div className="flex h-full animate-in fade-in duration-300">
                                    {/* Left: Visit list */}
                                    <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col">
                                        <div className="p-4 border-b border-white/10 flex-shrink-0">
                                            <button onClick={handleCreateVisit} className="w-full bg-electric/10 border border-electric/30 text-electric text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-electric/20 transition-all flex items-center justify-center gap-2">
                                                <Plus className="w-4 h-4" /> Nueva Consulta
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto py-1">
                                            {sortedVisits.length === 0 ? (
                                                <div className="text-center py-12 px-4">
                                                    <BriefcaseMedical className="w-8 h-8 text-clinical/20 mx-auto mb-2" />
                                                    <p className="text-clinical/30 text-xs">Sin consultas registradas</p>
                                                    <p className="text-clinical/20 text-[10px] mt-1">Crea la primera consulta con el botón de arriba</p>
                                                </div>
                                            ) : sortedVisits.map(visit => {
                                                const isSelected = visit.id === selectedVisitId;
                                                return (
                                                    <button
                                                        key={visit.id}
                                                        onClick={() => setSelectedVisitId(visit.id)}
                                                        className={`w-full text-left px-4 py-3 transition-all border-l-2 ${isSelected ? 'bg-blue-500/10 border-blue-400' : 'border-transparent hover:bg-white/5 hover:border-white/20'}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${VISIT_STATUS_DOT[visit.status]}`} />
                                                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                                                                {formatVisitDate(visit.date)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-clinical/50 ml-4 truncate">Dr. {visit.doctorName}</p>
                                                        {visit.chiefComplaint && (
                                                            <p className="text-[10px] text-clinical/40 ml-4 truncate mt-0.5">{visit.chiefComplaint}</p>
                                                        )}
                                                        {(visit.prescription?.medications?.length || visit.files.length > 0) && (
                                                            <div className="flex gap-1.5 ml-4 mt-1.5">
                                                                {(visit.prescription?.medications?.length ?? 0) > 0 && (
                                                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Rx</span>
                                                                )}
                                                                {visit.files.length > 0 && (
                                                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">{visit.files.length} arch.</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right: Visit detail */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {selectedVisit ? (
                                            <VisitRecord
                                                visit={selectedVisit}
                                                patientId={patientId}
                                                onSave={handleSaveVisit}
                                                canDelete={selectedVisit.doctorId === currentUserId || !!(currentDoctor as any)?.isMasterAdmin}
                                                onDelete={() => handleDeleteVisit(selectedVisit.id)}
                                            />
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-clinical/30">
                                                <BriefcaseMedical className="w-12 h-12 mb-3 opacity-30" />
                                                <p className="text-sm">Selecciona una consulta o crea una nueva</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ══ PLAN DE TRATAMIENTO ══ */}
                            {activeTab === 'plan_tratamiento' && (
                                <div className="p-6 overflow-y-auto h-full animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2 bg-electric/5 border border-electric/20 rounded-xl px-4 py-2 mb-6">
                                        <Layers className="w-4 h-4 text-electric" />
                                        <p className="text-electric text-sm font-bold">Pipeline de Tratamiento</p>
                                        <span className="ml-auto text-[10px] text-clinical/40 uppercase tracking-widest">
                                            Plan médico completo con seguimiento por fases
                                        </span>
                                    </div>
                                    <TreatmentPipeline plan={treatmentPlan} onSave={handleSaveTreatmentPlan} />
                                </div>
                            )}

                            {/* ══ COBROS / FINANZAS ══ */}
                            {activeTab === 'finanzas' && (
                                <PatientFinanzas
                                    patientId={patientId}
                                    patientName={patientName}
                                    treatmentPlan={treatmentPlan}
                                    payments={payments}
                                    onSavePayment={handleSavePayment}
                                />
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            <AIClinicalViewer isOpen={isAIViewerOpen} onClose={() => setIsAIViewerOpen(false)} patientName={patientName} />
        </div>
    );
};
