import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMarket } from '../context/MarketContext';
import {
    Users, Search, Plus, Edit2, Trash2, X, Camera, Palette,
    Globe, Instagram, Facebook, Phone, Mail, MapPin, FileText, CheckCircle2, Loader2,
} from 'lucide-react';

const TABS = [
    { id: 'staff',     label: 'Staff de la Clínica',    icon: Users },
    { id: 'identidad', label: 'Identidad Corporativa',   icon: Palette },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Identidad Corporativa defaults ──────────────────────────────────────────

type IdentidadForm = {
    logo: string; slogan: string; colorPrimario: string;
    website: string; facebook: string; instagram: string;
    whatsapp: string; twitter: string; tiktok: string;
    pieDePagina: string; direccionDocumentos: string;
    telefonoDocumentos: string; emailDocumentos: string;
};

const DEFAULT_IDENTIDAD: IdentidadForm = {
    logo: '', slogan: '', colorPrimario: '#00d4ff',
    website: '', facebook: '', instagram: '',
    whatsapp: '', twitter: '', tiktok: '',
    pieDePagina: '', direccionDocumentos: '',
    telefonoDocumentos: '', emailDocumentos: '',
};

export const ClinicDirectory: React.FC = () => {
    const { clinicProfile, setClinicProfile } = useMarket();
    const [activeTab, setActiveTab] = useState<TabId>('staff');
    const [searchTerm, setSearchTerm] = useState('');

    // ── Staff CRUD ────────────────────────────────────────────────────────────
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [showPhone2, setShowPhone2] = useState(false);

    const defaultFormState = {
        nombres: '', organizacion: '', fechaNacimiento: '', email: '',
        domicilio: '', pais: 'México', telefono: '', telefono2: '', genero: 'Femenino',
        estadoCivil: 'Soltero', ciudad: '', especialidad: '', comentario: '', foto: '',
    };
    const [formData, setFormData] = useState(defaultFormState);

    // ── Identidad Corporativa ─────────────────────────────────────────────────
    const [identidad, setIdentidad] = useState<IdentidadForm>({
        ...DEFAULT_IDENTIDAD,
        ...(clinicProfile?.identidadCorporativa ?? {}),
        logo: clinicProfile?.identidadCorporativa?.logo ?? '',
        slogan: clinicProfile?.identidadCorporativa?.slogan ?? '',
        colorPrimario: clinicProfile?.identidadCorporativa?.colorPrimario ?? '#00d4ff',
        website: clinicProfile?.identidadCorporativa?.website ?? '',
        facebook: clinicProfile?.identidadCorporativa?.facebook ?? '',
        instagram: clinicProfile?.identidadCorporativa?.instagram ?? '',
        whatsapp: clinicProfile?.identidadCorporativa?.whatsapp ?? '',
        twitter: clinicProfile?.identidadCorporativa?.twitter ?? '',
        tiktok: clinicProfile?.identidadCorporativa?.tiktok ?? '',
        pieDePagina: clinicProfile?.identidadCorporativa?.pieDePagina ?? '',
        direccionDocumentos: clinicProfile?.identidadCorporativa?.direccionDocumentos ?? '',
        telefonoDocumentos: clinicProfile?.identidadCorporativa?.telefonoDocumentos ?? '',
        emailDocumentos: clinicProfile?.identidadCorporativa?.emailDocumentos ?? '',
    });
    const [savingIdentidad, setSavingIdentidad] = useState(false);
    const [savedIdentidad, setSavedIdentidad] = useState(false);

    // ── Staff handlers ────────────────────────────────────────────────────────
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, foto: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({ ...defaultFormState, ...item });
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (!clinicProfile || !confirm('¿Eliminar este registro permanentemente?')) return;
        setClinicProfile({ ...clinicProfile, staff: clinicProfile.staff?.filter(s => s.id !== id) });
    };

    const handleSave = () => {
        if (!clinicProfile) return;
        const list = clinicProfile.staff || [];
        if (editingId) {
            setClinicProfile({ ...clinicProfile, staff: list.map(item => item.id === editingId ? { ...item, ...formData } : item) });
        } else {
            const newStaff = {
                ...formData,
                id: Date.now().toString(),
                password: '12345',
                staffType: 'doctor',
                modulePermissions: {
                    dashboard: true, radar: false, agenda: true, clinica: true,
                    inventario: false, campanas: false, turismo: false, finanzas: false,
                    reportes: false, settings: false, catalogo: false, proveedores: false,
                },
            };
            setClinicProfile({ ...clinicProfile, staff: [...list, newStaff as any] });
        }
        setShowForm(false);
        setEditingId(null);
        setFormData(defaultFormState);
        setShowPhone2(false);
    };

    // ── Identidad Corporativa handlers ────────────────────────────────────────
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setIdentidad(prev => ({ ...prev, logo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handleSaveIdentidad = async () => {
        if (!clinicProfile) return;
        setSavingIdentidad(true);
        setClinicProfile({ ...clinicProfile, identidadCorporativa: identidad });
        await new Promise(r => setTimeout(r, 400));
        setSavingIdentidad(false);
        setSavedIdentidad(true);
        setTimeout(() => setSavedIdentidad(false), 2500);
    };

    // ── Filtered staff ────────────────────────────────────────────────────────
    const staffData = (clinicProfile?.staff ?? []).filter((item: any) =>
        Object.values(item).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Input style helpers ───────────────────────────────────────────────────
    const inputCls = 'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-clinical focus:outline-none focus:border-electric text-sm';
    const labelCls = 'text-[10px] text-clinical/40 uppercase tracking-widest mb-1.5 block font-bold';

    // ── Staff form ────────────────────────────────────────────────────────────
    const renderStaffForm = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 md:p-14 rounded-3xl text-gray-800 shadow-2xl relative mt-4 mb-12 max-w-5xl mx-auto border border-gray-100">
            <div className="mb-12">
                <h2 className="font-syne text-3xl font-bold text-[#00529B]">Registro Staff</h2>
            </div>

            {/* Photo */}
            <div className="absolute top-10 right-10 md:top-14 md:right-14">
                <div className="relative group w-28 h-28">
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden transition-all group-hover:bg-gray-200 border-2 border-dashed border-gray-300">
                        {formData.foto
                            ? <img src={formData.foto} alt="Staff" className="w-full h-full object-cover" />
                            : <Camera className="w-10 h-10 text-gray-400 group-hover:text-gray-500" />
                        }
                    </div>
                    <input title="Foto" type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Organización</label>
                    <input title="Organización" type="text" value={formData.organizacion || ''} onChange={e => setFormData(p => ({ ...p, organizacion: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nombres y Apellidos *</label>
                    <input title="Nombre" type="text" value={formData.nombres} onChange={e => setFormData(p => ({ ...p, nombres: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de nacimiento</label>
                        <input title="Fecha" type="text" placeholder="DD/MM/YYYY" value={formData.fechaNacimiento || ''} onChange={e => setFormData(p => ({ ...p, fechaNacimiento: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Correo electrónico</label>
                        <input title="Email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Domicilio</label>
                    <input title="Domicilio" type="text" value={formData.domicilio} onChange={e => setFormData(p => ({ ...p, domicilio: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="w-1/2 flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono 1 *</label>
                        <input title="Tel" type="text" placeholder="(+52)" value={formData.telefono} onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    {!showPhone2 && !formData.telefono2 && (
                        <button type="button" title="Tel 2" onClick={() => setShowPhone2(true)} className="pb-1.5 text-gray-600 hover:text-black"><Plus className="w-5 h-5" /></button>
                    )}
                </div>
                {(showPhone2 || formData.telefono2) && (
                    <div className="w-1/2 flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono 2</label>
                            <input title="Tel2" type="text" placeholder="(+52)" value={formData.telefono2 || ''} onChange={e => setFormData(p => ({ ...p, telefono2: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <button type="button" title="Quitar" onClick={() => { setShowPhone2(false); setFormData(p => ({ ...p, telefono2: '' })); }} className="pb-1.5 text-red-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Ciudad</label>
                        <input title="Ciudad" type="text" value={formData.ciudad} onChange={e => setFormData(p => ({ ...p, ciudad: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Especialidad</label>
                        <input title="Especialidad" type="text" value={formData.especialidad} onChange={e => setFormData(p => ({ ...p, especialidad: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Comentario</label>
                    <input title="Comentario" type="text" value={formData.comentario} onChange={e => setFormData(p => ({ ...p, comentario: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
                <button type="button" onClick={handleSave} className="bg-[#9CDAB5] hover:bg-[#8BC9A4] text-white font-bold px-8 py-2 rounded-lg transition-colors text-sm">Guardar</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setFormData(defaultFormState); }} className="bg-[#E67E7E] hover:bg-[#D56D6D] text-white font-bold px-8 py-2 rounded-lg transition-colors text-sm">Cancelar</button>
            </div>
        </motion.div>
    );

    // ── Staff table ───────────────────────────────────────────────────────────
    const renderStaffTable = () => (
        staffData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-clinical/40 min-h-[400px]">
                <Users className="w-16 h-16 opacity-20" />
                <p className="mt-4">No hay registros de staff en el sistema.</p>
            </div>
        ) : (
            <div className="w-full overflow-x-auto rounded-xl">
                <table className="w-full text-left text-sm text-clinical/80">
                    <thead className="bg-white/5 text-electric font-syne uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 w-16 text-center">Opt</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Domicilio</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Especialidad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {staffData.map((item: any) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button title="Editar" onClick={() => handleEdit(item)} className="text-clinical/60 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button title="Eliminar" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-white">
                                    <div className="flex items-center gap-3">
                                        {item.foto
                                            ? <img src={item.foto} alt="Staff" className="w-8 h-8 rounded-full border border-electric/30 object-cover" />
                                            : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                                        }
                                        {item.nombres}
                                    </div>
                                </td>
                                <td className="px-4 py-3">{item.domicilio}</td>
                                <td className="px-4 py-3">{item.telefono}</td>
                                <td className="px-4 py-3">{item.email}</td>
                                <td className="px-4 py-3 text-premium">{item.especialidad}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    );

    // ── Identidad Corporativa form ────────────────────────────────────────────
    const renderIdentidad = () => (
        <div className="space-y-8 max-w-3xl">
            {/* Logo */}
            <div>
                <h3 className="font-syne text-base font-bold text-white mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-electric" /> Logo y Marca</h3>
                <div className="flex items-start gap-6">
                    <div className="relative group w-36 h-20 rounded-xl border-2 border-dashed border-white/20 bg-black/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-electric/40 transition-colors"
                        onClick={() => logoInputRef.current?.click()}>
                        {identidad.logo
                            ? <img src={identidad.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                            : <div className="text-center"><Camera className="w-8 h-8 text-clinical/30 mx-auto" /><span className="text-[10px] text-clinical/30 mt-1 block">Subir logo</span></div>
                        }
                        <input title="Logo" type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className={labelCls}>Slogan / Tagline</label>
                            <input title="Slogan" type="text" value={identidad.slogan} onChange={e => setIdentidad(p => ({ ...p, slogan: e.target.value }))}
                                className={inputCls} placeholder="Ej. Sonrisas que transforman vidas" />
                        </div>
                        <div>
                            <label className={labelCls}>Color Principal (hex)</label>
                            <div className="flex items-center gap-3">
                                <input title="Color" type="color" value={identidad.colorPrimario} onChange={e => setIdentidad(p => ({ ...p, colorPrimario: e.target.value }))}
                                    className="w-12 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer" />
                                <input title="Hex" type="text" value={identidad.colorPrimario} onChange={e => setIdentidad(p => ({ ...p, colorPrimario: e.target.value }))}
                                    className={`${inputCls} flex-1`} placeholder="#00d4ff" />
                                {identidad.colorPrimario && (
                                    <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0" style={{ background: identidad.colorPrimario }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {identidad.logo && (
                    <button type="button" onClick={() => setIdentidad(p => ({ ...p, logo: '' }))} className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><X className="w-3 h-3" /> Eliminar logo</button>
                )}
            </div>

            {/* Redes Sociales */}
            <div>
                <h3 className="font-syne text-base font-bold text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-electric" /> Presencia Digital</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { key: 'website',   label: 'Sitio Web', icon: <Globe className="w-4 h-4" />, placeholder: 'www.numiadental.com' },
                        { key: 'facebook',  label: 'Facebook', icon: <Facebook className="w-4 h-4" />, placeholder: '/numiadental' },
                        { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, placeholder: '@numiadental' },
                        { key: 'whatsapp',  label: 'WhatsApp', icon: <Phone className="w-4 h-4" />, placeholder: '+52 984 000 0000' },
                        { key: 'twitter',   label: 'X / Twitter', icon: <span className="text-sm font-black">𝕏</span>, placeholder: '@numiadental' },
                        { key: 'tiktok',    label: 'TikTok', icon: <span className="text-sm">♪</span>, placeholder: '@numiadental' },
                    ].map(({ key, label, icon, placeholder }) => (
                        <div key={key}>
                            <label className={labelCls}>{label}</label>
                            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 focus-within:border-electric transition-colors">
                                <span className="text-clinical/40">{icon}</span>
                                <input title={label} type="text" value={(identidad as any)[key]} onChange={e => setIdentidad(p => ({ ...p, [key]: e.target.value }))}
                                    className="flex-1 bg-transparent py-2.5 text-sm text-clinical focus:outline-none" placeholder={placeholder} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Datos para documentos */}
            <div>
                <h3 className="font-syne text-base font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-electric" /> Datos para Documentos PDF</h3>
                <p className="text-xs text-clinical/40 mb-4">Esta información aparecerá en el encabezado y pie de página de todos los PDFs generados por la app.</p>
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}><MapPin className="w-3 h-3 inline mr-1" />Dirección para documentos</label>
                        <input title="Dirección" type="text" value={identidad.direccionDocumentos} onChange={e => setIdentidad(p => ({ ...p, direccionDocumentos: e.target.value }))}
                            className={inputCls} placeholder="Calle, Col., Ciudad, CP" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Teléfono para documentos</label>
                            <input title="Teléfono" type="text" value={identidad.telefonoDocumentos} onChange={e => setIdentidad(p => ({ ...p, telefonoDocumentos: e.target.value }))}
                                className={inputCls} placeholder="+52 984 000 0000" />
                        </div>
                        <div>
                            <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Email para documentos</label>
                            <input title="Email" type="email" value={identidad.emailDocumentos} onChange={e => setIdentidad(p => ({ ...p, emailDocumentos: e.target.value }))}
                                className={inputCls} placeholder="contacto@numiadental.com" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Pie de página personalizado</label>
                        <textarea title="Pie de página" value={identidad.pieDePagina} onChange={e => setIdentidad(p => ({ ...p, pieDePagina: e.target.value }))}
                            className={`${inputCls} resize-none h-16`}
                            placeholder="Ej. Nümia Dental — Av. Tulum #340, Cancún, QR · Tel: +52 998 123 4567 · www.numiadental.com" />
                    </div>
                </div>
            </div>

            {/* Preview */}
            {(identidad.logo || identidad.colorPrimario !== '#00d4ff') && (
                <div className="border border-white/10 rounded-2xl overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 text-[10px] text-clinical/40 uppercase tracking-widest font-bold border-b border-white/10">Vista previa — encabezado de documentos</div>
                    <div className="bg-white p-4">
                        <div className="flex justify-between items-center" style={{ borderBottom: `3px solid ${identidad.colorPrimario}`, paddingBottom: '12px' }}>
                            <div>
                                {identidad.logo
                                    ? <img src={identidad.logo} alt="Logo" className="max-h-12 object-contain" />
                                    : <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '3px', color: identidad.colorPrimario }}>{clinicProfile?.nombre?.toUpperCase() ?? 'NÜMIA DENTAL'}</div>
                                }
                                {identidad.slogan && <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginTop: '2px' }}>{identidad.slogan}</div>}
                                {identidad.direccionDocumentos && <div style={{ fontSize: '9px', color: '#888', marginTop: '1px' }}>{identidad.direccionDocumentos}</div>}
                                {identidad.telefonoDocumentos && <div style={{ fontSize: '9px', color: '#888' }}>Tel: {identidad.telefonoDocumentos}</div>}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '11px', color: '#666' }}>
                                <strong style={{ color: '#1a1a2e', fontSize: '13px' }}>Documento Oficial</strong><br />
                                Generado: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                        {identidad.pieDePagina && (
                            <div style={{ marginTop: '12px', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                                {identidad.pieDePagina}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save button */}
            <div className="flex items-center gap-4 pt-2">
                <button type="button" onClick={handleSaveIdentidad} disabled={savingIdentidad}
                    className="bg-electric text-cobalt font-bold px-8 py-2.5 rounded-xl hover:bg-electric/80 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {savingIdentidad ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Guardar Identidad Corporativa
                </button>
                {savedIdentidad && (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold animate-pulse">
                        <CheckCircle2 className="w-4 h-4" /> ¡Guardado! Se aplicará a todos los documentos.
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-syne text-3xl font-bold text-electric">Clínica</h1>
                    <p className="text-clinical/60 mt-1">Gestión de personal e identidad corporativa.</p>
                </div>
                {activeTab === 'staff' && (
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-clinical/40" />
                            <input title="Buscar" type="text" placeholder="Buscar staff..." value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-cobalt border border-white/10 rounded-xl pl-10 pr-4 py-2 w-56 text-clinical focus:outline-none focus:border-electric transition-colors" />
                        </div>
                        <button type="button"
                            onClick={() => { setEditingId(null); setFormData(defaultFormState); setShowForm(true); }}
                            className="bg-electric hover:bg-electric/80 text-cobalt font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Nuevo Registro
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 shrink-0 flex flex-col gap-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} type="button"
                                onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                                className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold text-left ${isActive
                                    ? 'bg-gradient-to-r from-electric/20 to-transparent border-l-4 border-electric text-electric'
                                    : 'text-clinical/60 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'text-electric' : 'text-clinical/40'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'staff' && (showForm ? renderStaffForm() : renderStaffTable())}
                    {activeTab === 'identidad' && renderIdentidad()}
                </div>
            </div>
        </motion.div>
    );
};
