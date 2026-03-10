import React, { useState, useRef } from 'react';
import {
    Save, Trash2, Camera, Loader2, Pill, FileText, Heart, X, Plus,
} from 'lucide-react';
import {
    PatientVisit, PatientFile, PrescriptionMedication, VisitStatus,
    uploadPatientFile, deletePatientFile,
} from '../../lib/supabase';
import { printPrescription } from '../../utils/patientPrint';

// ─── Status config ────────────────────────────────────────────────────────────
const VISIT_STATUS_CONFIG: Record<VisitStatus, { label: string; dot: string }> = {
    attended:          { label: 'Asistida',               dot: 'bg-emerald-500' },
    cancelled_patient: { label: 'Cancelada por paciente', dot: 'bg-red-500' },
    cancelled_clinic:  { label: 'Cancelada por clínica',  dot: 'bg-orange-500' },
    no_show:           { label: 'No asistió',             dot: 'bg-gray-500' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface VisitRecordProps {
    visit: PatientVisit;
    patientId: string;
    onSave: (updated: PatientVisit) => Promise<void>;
    canDelete: boolean;
    onDelete: () => void;
    patientName?: string;
    clinicName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const VisitRecord: React.FC<VisitRecordProps> = ({
    visit, patientId, onSave, canDelete, onDelete, patientName = 'Paciente', clinicName = 'Nümia Dental',
}) => {
    const [local, setLocal] = useState<PatientVisit>(visit);
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [activeSection, setActiveSection] = useState<'clinical' | 'prescription' | 'files'>('clinical');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync when parent selects a different visit
    React.useEffect(() => { setLocal(visit); setActiveSection('clinical'); }, [visit.id]);

    const update = (patch: Partial<PatientVisit>) => setLocal(prev => ({ ...prev, ...patch }));

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(local);
        setIsSaving(false);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        const result = await uploadPatientFile(patientId, file, `visits/${visit.id}`);
        if (result) {
            const newFile: PatientFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                storagePath: result.storagePath,
                url: result.url,
                createdAt: new Date().toISOString(),
                type: file.type.startsWith('image/') ? 'imagen' : 'documento',
            };
            const updated = { ...local, files: [...local.files, newFile] };
            setLocal(updated);
            await onSave(updated);
        }
        setIsUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteFile = async (fileItem: PatientFile) => {
        if (!confirm(`¿Eliminar "${fileItem.name}"?`)) return;
        await deletePatientFile(fileItem.storagePath);
        const updated = { ...local, files: local.files.filter(f => f.id !== fileItem.id) };
        setLocal(updated);
        await onSave(updated);
    };

    const addMedication = () => {
        const med: PrescriptionMedication = { name: '', dose: '', frequency: '', duration: '' };
        const rx = local.prescription ?? { id: `rx-${Date.now()}`, medications: [], freeText: '' };
        update({ prescription: { ...rx, medications: [...rx.medications, med] } });
    };

    const updateMedication = (idx: number, patch: Partial<PrescriptionMedication>) => {
        if (!local.prescription) return;
        const meds = local.prescription.medications.map((m, i) => i === idx ? { ...m, ...patch } : m);
        update({ prescription: { ...local.prescription, medications: meds } });
    };

    const removeMedication = (idx: number) => {
        if (!local.prescription) return;
        const meds = local.prescription.medications.filter((_, i) => i !== idx);
        update({ prescription: { ...local.prescription, medications: meds } });
    };

    return (
        <div className="flex flex-col h-full">
            {/* ── Visit header ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${VISIT_STATUS_CONFIG[local.status].dot}`} />
                    <input
                        type="date"
                        value={local.date.split('T')[0]}
                        onChange={e => update({ date: e.target.value })}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-electric outline-none"
                    />
                </div>
                <select
                    value={local.status}
                    onChange={e => update({ status: e.target.value as VisitStatus })}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-electric outline-none text-clinical/90"
                >
                    {(Object.entries(VISIT_STATUS_CONFIG) as [VisitStatus, { label: string; dot: string }][]).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
                <select
                    value={local.duration ?? 30}
                    onChange={e => update({ duration: Number(e.target.value) })}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-electric outline-none text-clinical/90"
                >
                    {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
                <input
                    type="text"
                    value={local.doctorName}
                    onChange={e => update({ doctorName: e.target.value })}
                    placeholder="Doctor"
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-clinical/90 text-sm focus:border-electric outline-none flex-1 min-w-[120px]"
                />
                <div className="flex items-center gap-2 ml-auto">
                    {savedOk && <span className="text-emerald-400 text-xs font-bold">¡Guardado!</span>}
                    {canDelete && (
                        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-clinical/30 hover:text-red-400 transition-colors px-3 py-2">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-electric/10 border border-electric/30 text-electric text-xs font-bold px-5 py-2 rounded-xl hover:bg-electric/20 transition-all disabled:opacity-40">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar Consulta
                    </button>
                </div>
            </div>

            {/* ── Section switcher ───────────────────────────────────────────── */}
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl w-fit mb-5 flex-shrink-0">
                {([
                    { key: 'clinical'     as const, label: 'Datos Clínicos',               icon: null },
                    { key: 'prescription' as const, label: 'Receta',                        icon: <Pill   className="w-3.5 h-3.5" /> },
                    { key: 'files'        as const, label: `Archivos (${local.files.length})`, icon: <Camera className="w-3.5 h-3.5" /> },
                ]).map(({ key, label, icon }) => (
                    <button key={key} onClick={() => setActiveSection(key)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSection === key ? 'bg-electric/20 text-electric' : 'text-clinical/40 hover:text-clinical'}`}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

                {/* ── DATOS CLÍNICOS ── */}
                {activeSection === 'clinical' && (
                    <div className="space-y-4">
                        {/* Vitals */}
                        <div>
                            <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Heart className="w-3 h-3" /> Signos Vitales
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['bloodPressure', 'pulse', 'weight', 'temperature'] as const).map((key, idx) => (
                                    <div key={key} className="relative">
                                        <span className="absolute left-2.5 top-2 text-[9px] text-clinical/30 font-bold uppercase">
                                            {['T.A.', 'Pulso', 'Peso', 'Temp'][idx]}
                                        </span>
                                        <input
                                            type="text"
                                            value={local.vitals?.[key] ?? ''}
                                            onChange={e => update({ vitals: { ...local.vitals, [key]: e.target.value } })}
                                            placeholder={['120/80', '72 bpm', '70 kg', '36.5°C'][idx]}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-2.5 pt-6 pb-2 text-white text-xs focus:border-electric outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Clinical text fields */}
                        {([
                            { key: 'chiefComplaint',  label: 'Motivo de Consulta',                      placeholder: '¿Por qué viene el paciente hoy?',                                     rows: 2 },
                            { key: 'diagnosis',        label: 'Diagnóstico',                              placeholder: 'Diagnóstico clínico...',                                              rows: 2 },
                            { key: 'procedures',       label: 'Plan de Trabajo y Tratamientos Realizados', placeholder: 'Procedimientos y tratamientos realizados en esta consulta...',        rows: 3 },
                            { key: 'evolutionNote',    label: 'Nota de Evolución',                        placeholder: 'Evolución, observaciones, indicaciones al paciente...',               rows: 3 },
                            { key: 'nextAppointment',  label: 'Próxima Cita (observaciones)',              placeholder: 'Ej. Cita en 3 semanas para revisión del tratamiento...',             rows: 1 },
                        ] as const).map(({ key, label, placeholder, rows }) => (
                            <div key={key}>
                                <label className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block">{label}</label>
                                <textarea
                                    value={(local as unknown as Record<string, string>)[key] ?? ''}
                                    onChange={e => update({ [key]: e.target.value } as Partial<PatientVisit>)}
                                    placeholder={placeholder}
                                    rows={rows}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-clinical/90 text-sm focus:border-electric outline-none resize-none"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── RECETA ── */}
                {activeSection === 'prescription' && (
                    <div className="bg-white rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <FileText className="w-32 h-32 text-black" />
                        </div>
                        <p className="font-syne font-black text-black text-2xl border-b border-black/10 pb-3 mb-4">℞</p>

                        <div className="space-y-3 mb-4">
                            {(local.prescription?.medications ?? []).map((med, idx) => (
                                <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-2 relative group bg-gray-50">
                                    <button onClick={() => removeMedication(idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={med.name}
                                        onChange={e => updateMedication(idx, { name: e.target.value })}
                                        placeholder="Nombre del medicamento"
                                        className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-1 text-sm font-bold text-gray-800 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="text" value={med.dose}      onChange={e => updateMedication(idx, { dose: e.target.value })}      placeholder="Dosis"      className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:border-gray-400 outline-none" />
                                        <input type="text" value={med.frequency} onChange={e => updateMedication(idx, { frequency: e.target.value })} placeholder="Frecuencia" className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:border-gray-400 outline-none" />
                                        <input type="text" value={med.duration}  onChange={e => updateMedication(idx, { duration: e.target.value })}  placeholder="Duración"   className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:border-gray-400 outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={addMedication} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5 mb-4">
                            <Plus className="w-3.5 h-3.5" /> Agregar Medicamento
                        </button>

                        <textarea
                            value={local.prescription?.freeText ?? ''}
                            onChange={e => update({
                                prescription: {
                                    id: local.prescription?.id ?? `rx-${Date.now()}`,
                                    medications: local.prescription?.medications ?? [],
                                    freeText: e.target.value,
                                },
                            })}
                            placeholder="Indicaciones especiales al paciente..."
                            rows={3}
                            className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 placeholder:text-gray-300 outline-none resize-none border border-gray-100 mb-4"
                        />

                        <button
                            type="button"
                            onClick={() => printPrescription(patientName, local, clinicName)}
                            className="bg-black hover:bg-black/80 text-white w-full text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Imprimir Receta (PDF)
                        </button>
                    </div>
                )}

                {/* ── ARCHIVOS ── */}
                {activeSection === 'files' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}
                                className="flex items-center gap-2 bg-white/5 border border-white/20 text-clinical text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-40">
                                {isUploadingFile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} Subir Archivo
                            </button>
                            <input ref={fileInputRef} type="file" title="Subir archivo" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {local.files.map(f => (
                                <div key={f.id} className="aspect-square border border-white/10 rounded-xl bg-black/50 p-2 relative group overflow-hidden">
                                    {f.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
                                        ? <img src={f.url} alt={f.name} className="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity" />
                                        : <div className="w-full h-full flex flex-col items-center justify-center text-clinical/40"><FileText className="w-8 h-8 mb-1" /><span className="text-[9px] text-center break-all px-1">{f.name}</span></div>
                                    }
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        <a href={f.url} target="_blank" rel="noreferrer" className="text-[10px] text-white font-bold bg-electric/80 px-2 py-1 rounded">Ver</a>
                                        <button onClick={() => handleDeleteFile(f)} className="text-[10px] text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded flex items-center gap-1"><Trash2 className="w-3 h-3" />Borrar</button>
                                    </div>
                                    <span className="absolute bottom-2 left-2 right-2 text-[8px] bg-black/80 px-1.5 py-0.5 rounded text-white font-bold truncate">{f.name}</span>
                                </div>
                            ))}
                            <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-clinical/50 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-[9px] text-center px-2">Agregar</span>
                            </div>
                        </div>

                        {local.files.length === 0 && (
                            <p className="text-clinical/30 text-xs text-center py-8">Sin archivos en esta consulta.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
