import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Printer, Link2 } from 'lucide-react';

import { useMarket } from '../context/MarketContext';
import { printPatientRecord, getOrCreateToken } from '../utils/patientPrint';

export const PatientProfileForm: React.FC<{ isOpen: boolean; onClose: () => void; patientId?: string }> = ({ isOpen, onClose, patientId }) => {
    const { patients, setPatients, clinicProfile } = useMarket();
    const [activeTab, setActiveTab] = useState<'personales' | 'clinico'>('personales');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [formState, setFormState] = useState<Record<string, string>>({});
    const [linkCopied, setLinkCopied] = useState(false);
    const handleInput = (key: string, val: string) => setFormState(prev => ({ ...prev, [key]: val }));

    const currentPatient = patientId ? patients.find(p => p.id === patientId) : undefined;

    const handlePrint = () => {
        if (!currentPatient) return;
        printPatientRecord(currentPatient, clinicProfile?.nombre ?? 'Nümia Dental');
    };

    const handleGenerateLink = () => {
        if (!currentPatient) return;
        let token = currentPatient.registroToken;
        if (!token) {
            token = getOrCreateToken();
            setPatients(prev => prev.map(p => p.id === currentPatient.id ? { ...p, registroToken: token! } : p));
        }
        const url = `${window.location.origin}/registro/${token}`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        });
    };

    React.useEffect(() => {
        if (isOpen && patientId) {
            const p = patients.find(x => x.id === patientId);
            if (p) {
                setFormState({
                    text_1: p.folio,
                    text_3: p.nombres + ' ' + p.apellidos,
                    text_7: p.domicilio,
                    text_8: p.telefono,
                    email_1: p.email,
                    date_1: p.fechaNacimiento,
                    text_5: p.ciudad,
                    select_2: p.genero,
                    select_3: p.estadoCivil,
                    select_1: p.tipoPaciente.toUpperCase(),
                    text_10: p.alertaMedica !== 'Sin alerta' ? p.alertaMedica : '',
                    text_11: p.alertaAdministrativa !== 'Sin alerta' ? p.alertaAdministrativa : ''
                });
                setPhoto(p.foto || null);
            }
        } else if (!isOpen) {
            setFormState({});
            setPhoto(null);
            setActiveTab('personales');
        } else {
            setFormState({});
            setPhoto(null);
        }
    }, [isOpen, patientId, patients]);

    const handleSave = () => {
        const dateNow = new Date().toISOString().split('T')[0];
        const names = formState.text_3?.split(' ') || [];
        const existingPatient = patientId ? patients.find(p => p.id === patientId) : undefined;
        // Consecutive ID: keep existing one on edit, assign next available on creation
        const nextNumero = existingPatient?.numeroPaciente ??
            (patients.length > 0 ? Math.max(...patients.map(p => p.numeroPaciente ?? 0)) + 1 : 1);
        const newPatient = {
            id: patientId || Date.now().toString(),
            numeroPaciente: nextNumero,
            folio: formState.text_1 || String(nextNumero).padStart(6, '0'),
            nombres: names[0] || 'Nuevo',
            apellidos: names.slice(1).join(' ') || 'Paciente',
            email: formState.email_1 || '',
            telefono: formState.text_8 || '',
            genero: formState.select_2 || 'Otro',
            estadoCivil: formState.select_3 || 'Soltero',
            fechaNacimiento: formState.date_1 || '',
            tipoPaciente: formState.select_1 || 'GENERAL',
            alertaMedica: formState.text_10 || 'Sin alerta',
            alertaAdministrativa: formState.text_11 || 'Sin alerta',
            domicilio: formState.text_7 || '',
            ciudad: formState.text_5 || '',
            pais: 'México',
            foto: photo || undefined,
            saldo: 0,
            ultimaVisita: dateNow
        };

        setPatients(prev => {
            const exists = prev.find(p => p.id === newPatient.id);
            if (exists) {
                return prev.map(p => p.id === newPatient.id ? { ...exists, ...newPatient } : p);
            }
            return [...prev, newPatient as any];
        });

        handleClose();
    };

    const handleDelete = () => {
        if (!patientId) return;
        if (confirm('¿Seguro que deseas eliminar este paciente?')) {
            setPatients(prev => prev.filter(p => p.id !== patientId));
            handleClose();
        }
    };

    if (!isOpen) return null;

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleClose = () => {
        setFormState({});
        setPhoto(null);
        setActiveTab('personales');
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-50 overflow-hidden font-syne text-gray-800">
            {/* Header Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 px-8 pt-4 flex justify-between items-end shrink-0">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('personales')}
                        className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'personales' ? 'border-electric text-electric' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Datos Personales
                    </button>
                    <button
                        onClick={() => setActiveTab('clinico')}
                        className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'clinico' ? 'border-electric text-electric' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Historial Clínico
                    </button>
                </div>
                <button title="Cerrar modal" aria-label="Cerrar modal" onClick={handleClose} className="mb-3 p-1 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-8">
                {activeTab === 'personales' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                        {/* Title and Print/Link Actions */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">DATOS PERSONALES</h1>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    title="Imprimir expediente"
                                    onClick={handlePrint}
                                    disabled={!currentPatient}
                                    className="text-electric hover:text-cobalt transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateLink}
                                    disabled={!currentPatient}
                                    className="bg-electric text-cobalt font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <Link2 className="w-4 h-4" />
                                    {linkCopied ? '¡Link copiado!' : 'Generar link'}
                                </button>
                            </div>
                        </div>

                        {/* Top Section (Folio, Patient #, Type & Photo) */}
                        <div className="flex justify-between items-start">
                            <div className="grid grid-cols-3 gap-6 flex-1 pr-12">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Folio</label>
                                    <input title="Campo" value={formState["text_1"] || ""} onChange={e => handleInput("text_1", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Núm. de Paciente</label>
                                    <input
                                        title="Número de paciente asignado automáticamente"
                                        type="text"
                                        readOnly
                                        value={
                                            patientId
                                                ? String(patients.find(p => p.id === patientId)?.numeroPaciente ?? '—')
                                                : `#${patients.length > 0 ? Math.max(...patients.map(p => p.numeroPaciente ?? 0)) + 1 : 1}`
                                        }
                                        className="w-full bg-gray-100 border border-gray-200 rounded-md p-2 text-sm font-bold text-gray-700 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de paciente*</label>
                                    <select title="Opciones" value={formState["select_1"] || ""} onChange={e => handleInput("select_1", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors">
                                        <option>GENERAL</option>
                                        <option>VIP</option>
                                        <option>TURISMO MEDICO</option>
                                    </select>
                                </div>
                            </div>

                            {/* Photo Uploader */}
                            <div className="flex flex-col items-center">
                                {photo && <button onClick={() => setPhoto(null)} className="text-[10px] bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full mb-2 hover:bg-blue-200">Eliminar Foto</button>}
                                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-electric transition-colors">
                                    {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full text-gray-300 rounded-full bg-gray-300 relative scale-90 [clip-path:circle(50%_at_50%_50%)]"><div className="absolute bottom-0 w-full h-1/2 bg-gray-400 rounded-t-[100px]"></div><div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-400"></div></div>}
                                </div>
                                <input title="Campo" type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            </div>
                        </div>

                        {/* Name & Basic Demographics */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombres y Apellidos*</label>
                                <input title="Campo" value={formState["text_3"] || ""} onChange={e => handleInput("text_3", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre Favorito / Alias</label>
                                <input title="Campo" value={formState["text_4"] || ""} onChange={e => handleInput("text_4", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de nacimiento*</label>
                                        <input title="Campo" value={formState["date_1"] || ""} onChange={e => handleInput("date_1", e.target.value)} type="date" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                    </div>
                                    <span className="text-sm text-gray-600 font-bold self-end mb-2">Edad: --</span>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Género</label>
                                    <select title="Opciones" value={formState["select_2"] || ""} onChange={e => handleInput("select_2", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors">
                                        <option>Femenino</option>
                                        <option>Masculino</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Lugar de nacimiento</label>
                                    <input title="Campo" value={formState["text_5"] || ""} onChange={e => handleInput("text_5", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Estado civil</label>
                                    <select title="Opciones" value={formState["select_3"] || ""} onChange={e => handleInput("select_3", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors">
                                        <option>Otro</option><option>Soltero/a</option><option>Casado/a</option><option>Divorciado/a</option><option>Viudo/a</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Ocupación</label>
                                <input title="Campo" value={formState["text_6"] || ""} onChange={e => handleInput("text_6", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Domicilio</label>
                                <input title="Campo" value={formState["text_7"] || ""} onChange={e => handleInput("text_7", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono Celular</label>
                                    <input title="Campo" value={formState["text_8"] || ""} onChange={e => handleInput("text_8", e.target.value)} type="text" defaultValue="(+52)" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors tracking-widest" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono 2</label>
                                    <input title="Campo" value={formState["text_9"] || ""} onChange={e => handleInput("text_9", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors tracking-widest" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Correo electrónico</label>
                                <input title="Campo" value={formState["email_1"] || ""} onChange={e => handleInput("email_1", e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>
                        </div>

                        {/* Medical Alerts (Highlighted) */}
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="text-xs font-bold text-red-500 mb-1 block">Alerta médica</label>
                                <input title="Campo" value={formState["text_10"] || ""} onChange={e => handleInput("text_10", e.target.value)} type="text" className="w-full bg-red-50/50 border border-red-200 rounded-md p-2 text-sm focus:border-red-400 outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 mb-1 block">Alerta administrativa</label>
                                <input title="Campo" value={formState["text_11"] || ""} onChange={e => handleInput("text_11", e.target.value)} type="text" className="w-full bg-blue-50/50 border border-blue-200 rounded-md p-2 text-sm focus:border-blue-400 outline-none transition-colors" />
                            </div>
                        </div>

                        {/* Financial Information */}
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <h3 className="text-sm font-bold text-blue-600">Datos de facturación</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre o razón social</label>
                                    <input title="Campo" value={formState["text_12"] || ""} onChange={e => handleInput("text_12", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">RFC / Tax ID</label>
                                    <input title="Campo" value={formState["text_13"] || ""} onChange={e => handleInput("text_13", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Dirección fiscal</label>
                                <input title="Campo" value={formState["text_14"] || ""} onChange={e => handleInput("text_14", e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Email de facturación</label>
                                <input title="Campo" value={formState["email_2"] || ""} onChange={e => handleInput("email_2", e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>
                        </div>

                        {/* Actions Footers */}
                        <div className="flex flex-col items-center gap-3 pt-8 pb-4">
                            <div className="flex gap-4">
                                <button onClick={handleSave} className="bg-emerald-300/80 hover:bg-emerald-400 text-white font-bold py-2 px-8 rounded-md transition-colors shadow-sm">Guardar</button>
                                <button className="bg-red-400/80 hover:bg-red-500 text-white font-bold py-2 px-8 rounded-md transition-colors shadow-sm" onClick={handleClose}>Cancelar</button>
                            </div>
                            {patientId && (
                                <button onClick={handleDelete} className="bg-red-400/80 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md transition-colors shadow-sm text-sm mt-2">Eliminar paciente</button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 pb-24">
                        {/* Clinical History Section */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-2">ANTECEDENTES GENERALES</h2>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">Medio por el cual nos conoce</label>
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <label className="flex items-center gap-2 cursor-pointer"><input title="Campo" type="radio" name="source" className="text-blue-500" /> Búsqueda en internet</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input title="Campo" type="radio" name="source" className="text-blue-500" /> Redes sociales</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input title="Campo" type="radio" name="source" className="text-blue-500" /> Recomendación</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input title="Campo" type="radio" name="source" className="text-blue-500" /> Otro</label>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">Tiene algún familiar que sea atendido por nosotros, en caso afirmativo, favor de nombrarlos</label>
                                <input title="Campo" value={formState["text_15"] || ""} onChange={e => handleInput("text_15", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-2">HISTORIAL CLÍNICO MÉDICO</h2>

                            {/* Medical Boolean Questions */}
                            <div className="space-y-5">
                                <BoolQuestion label="¿Considera bueno su estado de salud?" />
                                <BoolQuestion label="¿Ha observado cambios en su salud en el último año?" />
                                <div className="space-y-2">
                                    <BoolQuestion label="¿Se encuentra bajo tratamiento médico?" />
                                    <input title="Campo" value={formState["text_16"] || ""} onChange={e => handleInput("text_16", e.target.value)} type="text" placeholder="Especifique" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <BoolQuestion label="¿Ha tenido una cirugía o enfermedad grave en los últimos 5 años?" />
                                    <input title="Campo" value={formState["text_17"] || ""} onChange={e => handleInput("text_17", e.target.value)} type="text" placeholder="Especifique" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre de su médico:</label>
                                        <input title="Campo" value={formState["text_18"] || ""} onChange={e => handleInput("text_18", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                    </div>
                                    <div className="w-1/3">
                                        <label className="text-xs font-bold text-gray-600 mb-1 block">Teléfono</label>
                                        <input title="Campo" value={formState["text_19"] || ""} onChange={e => handleInput("text_19", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Fuma (frecuencia)</label>
                                    <input title="Campo" value={formState["text_20"] || ""} onChange={e => handleInput("text_20", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Consume bebidas alcohólicas (frecuencia)</label>
                                    <input title="Campo" value={formState["text_21"] || ""} onChange={e => handleInput("text_21", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Consume algún tipo de droga? (especifique)</label>
                                    <input title="Campo" value={formState["text_22"] || ""} onChange={e => handleInput("text_22", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>

                                <BoolQuestion label="¿Se encuentra en embarazo o lactancia?" />
                            </div>

                            {/* Pathologies Checklist */}
                            <div className="pt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">¿Padece usted alguna de las siguientes enfermedades?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                    <BoolQuestion label="Diabetes" />
                                    <BoolQuestion label="Hipertensión arterial" />
                                    <BoolQuestion label="Hipotensión arterial" />
                                    <BoolQuestion label="Enfermedades cardiovasculares" />
                                    <BoolQuestion label="Asma" />
                                    <BoolQuestion label="Tuberculosis" />
                                    <BoolQuestion label="Hepatitis" />
                                    <BoolQuestion label="Enfermedades renales" />
                                    <BoolQuestion label="Gastritis" />
                                    <BoolQuestion label="Úlcera gástrica" />
                                    <BoolQuestion label="Piel hipersensible" />
                                    <BoolQuestion label="Defectos de coagulación" />
                                    <BoolQuestion label="Anemia" />
                                    <BoolQuestion label="Artritis reumatoide" />
                                    <BoolQuestion label="Epilepsia" />
                                    <BoolQuestion label="Recibido transfusiones sanguíneas" />
                                    <BoolQuestion label="Recibido terapias de radiación" />
                                </div>
                            </div>

                            {/* Specifies */}
                            <div className="space-y-4 pt-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 block">Sífilis, Gonorrea, Sida, Etc.</label>
                                    <input title="Campo" value={formState["text_23"] || ""} onChange={e => handleInput("text_23", e.target.value)} type="text" placeholder="Especifique" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 block">Alergias (Alimentos, pólen, etc)</label>
                                    <input title="Campo" value={formState["text_24"] || ""} onChange={e => handleInput("text_24", e.target.value)} type="text" placeholder="Especifique" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 block">Alguna otra enfermedad no mencionada</label>
                                    <input title="Campo" value={formState["text_25"] || ""} onChange={e => handleInput("text_25", e.target.value)} type="text" placeholder="Especifique" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                            </div>

                            {/* Drug Allergies */}
                            <div className="pt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Es alérgico o ha tenido alguna complicación con los siguientes fármacos o materiales:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <BoolQuestion label="Anestésicos locales" />
                                    <BoolQuestion label="Penicilina" />
                                    <BoolQuestion label="Sulfas" />
                                    <BoolQuestion label="Barbitúricos, sedantes, o pastillas para dormir" />
                                    <BoolQuestion label="Aspirina" />
                                    <BoolQuestion label="Peróxido de hidrógeno (Agua oxigenada)" />
                                    <BoolQuestion label="Hipoclorito de sodio (Cloro)" />
                                    <BoolQuestion label="Polvo" />
                                    <BoolQuestion label="Hule o látex" />
                                </div>
                            </div>
                        </div>

                        {/* Dental History Section */}
                        <div className="space-y-6 pt-8">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-2">HISTORIAL CLÍNICO DENTAL</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Cuándo fue tu última visita al dentista?</label>
                                    <input title="Campo" value={formState["text_26"] || ""} onChange={e => handleInput("text_26", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Tratamiento realizado</label>
                                    <input title="Campo" value={formState["text_27"] || ""} onChange={e => handleInput("text_27", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Cómo fue tu experiencia?</label>
                                    <input title="Campo" value={formState["text_28"] || ""} onChange={e => handleInput("text_28", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Existe algún temor a la visita dental?</label>
                                    <input title="Campo" value={formState["text_29"] || ""} onChange={e => handleInput("text_29", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Frecuencia de cepillado al día?</label>
                                    <input title="Campo" value={formState["text_30"] || ""} onChange={e => handleInput("text_30", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Te gustan tus dientes?</label>
                                    <input title="Campo" value={formState["text_31"] || ""} onChange={e => handleInput("text_31", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">¿Te sientes cómodo con tus dientes?</label>
                                    <input title="Campo" value={formState["text_32"] || ""} onChange={e => handleInput("text_32", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Del 1 al 10 califica tu comodidad funcional para masticar los alimentos, líquidos, dulces, etc.</label>
                                    <select title="Opciones" value={formState["select_4"] || ""} onChange={e => handleInput("select_4", e.target.value)} className="w-1/3 bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors">
                                        <option>Selecciona Calificación</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <option key={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Del 1 al 10 califica tu sonrisa</label>
                                    <select title="Opciones" value={formState["select_5"] || ""} onChange={e => handleInput("select_5", e.target.value)} className="w-1/3 bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors">
                                        <option>Selecciona Calificación</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <option key={i}>{i}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="text-sm font-bold text-gray-700 mb-1 block">¿Motivo o expectativas de la consulta?</label>
                                <input title="Campo" value={formState["text_33"] || ""} onChange={e => handleInput("text_33", e.target.value)} type="text" placeholder="Escribe aquí" className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:border-electric outline-none transition-colors" />
                            </div>

                            {/* Signatures */}
                            <div className="flex justify-between items-end pt-24">
                                <div className="w-1/3 border-t border-gray-800 text-center pt-2 font-bold text-sm text-gray-800">
                                    Firma Física Paciente o Tutor
                                </div>
                                <div className="w-1/3 border-t border-gray-800 text-center pt-2 font-bold text-sm text-gray-800">
                                    Firma Digital Paciente o Tutor
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>,
        document.body
    );
};

const BoolQuestion: React.FC<{ label: string }> = ({ label }) => {
    // Local unique name for radio groups
    const id = React.useId();
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <div className="flex gap-4">
                <label className="text-xs font-bold text-gray-600 flex items-center gap-1 cursor-pointer">
                    <input title="Campo" type="radio" name={id} value="si" className="text-blue-500" /> SI
                </label>
                <label className="text-xs font-bold text-gray-600 flex items-center gap-1 cursor-pointer">
                    <input title="Campo" type="radio" name={id} value="no" defaultChecked className="text-blue-500" /> NO
                </label>
            </div>
        </div>
    );
};
