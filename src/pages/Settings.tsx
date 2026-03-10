import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMarket, ClinicProfile, StaffMember, ModulePermissions } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import {
    Users, Plus, Trash2, X, Key, RefreshCw, Save,
    AlertCircle, Building2, UserCircle, MapPin, Upload,
    CheckCircle2, XCircle
} from 'lucide-react';

const CATEGORIES = ['Preventivo', 'Restauradores', 'Estéticos', 'Ortodónticos', 'Periodontales', 'Merchandising'];

// ⚠️  IMPORTANTE: Cada vez que se agregue o elimine una página/módulo del proyecto,
//     se debe actualizar esta lista Y la interfaz ModulePermissions en MarketContext.tsx.
const MODULE_LABELS: { key: keyof ModulePermissions; label: string }[] = [
    { key: 'dashboard',   label: 'Dashboard' },
    { key: 'radar',       label: 'Radar Dental' },
    { key: 'agenda',      label: 'Agenda & CRM' },
    { key: 'clinica',     label: 'Clínica' },
    { key: 'inventario',  label: 'Inventario' },
    { key: 'catalogo',    label: 'Catálogo de Productos' },
    { key: 'proveedores', label: 'Proveedores' },
    { key: 'campanas',    label: 'Campañas' },
    { key: 'turismo',     label: 'Turismo Dental' },
    { key: 'finanzas',    label: 'Finanzas' },
    { key: 'caja',        label: 'Caja del Día' },
    { key: 'reportes',    label: 'Informes' },
    { key: 'settings',    label: 'Configuración' },
];

export const Settings: React.FC = () => {
    const { clinicProfile, setClinicProfile, setBaseLocation, updateStaffPermissions, updateStaffPassword, updateStaffMember, setMasterAdmin, currentUserId, syncError, hasSyncedFromCloud } = useMarket();
    const { refreshUser } = useAuth();
    const currentUser = clinicProfile?.staff?.find(s => s.id === currentUserId);
    const isMasterAdmin = currentUser?.isMasterAdmin;
    const hasFullAccess = isMasterAdmin;

    const [activeTab, setActiveTab] = useState<'perfil' | 'mi_perfil' | 'equipo'>(hasFullAccess ? 'perfil' : 'mi_perfil');
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ClinicProfile>({
        nombre: clinicProfile?.nombre || '',
        direccion: clinicProfile?.direccion || '',
        lat: clinicProfile?.lat || 19.4326,
        lng: clinicProfile?.lng || -99.1332,
        servicios: clinicProfile?.servicios || { 'Preventivo': { 'Limpieza': 1200 } },
        logo: clinicProfile?.logo,
        telefono: clinicProfile?.telefono || '',
        email: clinicProfile?.email || '',
        medicoResponsable: clinicProfile?.medicoResponsable || '',
        cedProfesional: clinicProfile?.cedProfesional || '',
        redesSociales: {
            facebook: clinicProfile?.redesSociales?.facebook || '',
            instagram: clinicProfile?.redesSociales?.instagram || '',
            whatsapp: clinicProfile?.redesSociales?.whatsapp || ''
        },
        whatsappTemplate: clinicProfile?.whatsappTemplate || '',
    });

    const [newService, setNewService] = useState({ category: 'Preventivo', name: '', price: '' });
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [profileEditData, setProfileEditData] = useState<Partial<StaffMember>>({
        nombres: currentUser?.nombres || '',
        especialidad: currentUser?.especialidad || '',
        domicilio: currentUser?.domicilio || '',
        telefono: currentUser?.telefono || '',
        email: currentUser?.email || '',
        ciudad: currentUser?.ciudad || '',
        pais: currentUser?.pais || '',
        fechaNacimiento: currentUser?.fechaNacimiento || '',
        genero: currentUser?.genero || '',
        estadoCivil: currentUser?.estadoCivil || ''
    });

    // Update profile data when currentUser changes (e.g. after cloud fetch)
    React.useEffect(() => {
        if (currentUser) {
            setProfileEditData({
                nombres: currentUser.nombres || '',
                especialidad: currentUser.especialidad || '',
                domicilio: currentUser.domicilio || '',
                telefono: currentUser.telefono || '',
                email: currentUser.email || '',
                ciudad: currentUser.ciudad || '',
                pais: currentUser.pais || '',
                fechaNacimiento: currentUser.fechaNacimiento || '',
                genero: currentUser.genero || '',
                estadoCivil: currentUser.estadoCivil || ''
            });
        }
    }, [currentUser]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, logo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logo: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCitySearch = async () => {
        if (!formData.direccion.trim()) return;
        setIsGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.direccion)}&limit=1`,
                { headers: { 'Accept': 'application/json', 'User-Agent': 'NumiaDental/1.0' } }
            );
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
                alert('Ubicación encontrada y validada exitosamente.');
            } else {
                alert('No se encontró la ubicación. Intenta nuevamente.');
            }
        } catch (e) {
            console.error('Geocoding failed', e);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleAddService = () => {
        if (newService.name && newService.price) {
            setFormData(prev => {
                const updatedCategories = { ...prev.servicios };
                if (!updatedCategories[newService.category]) updatedCategories[newService.category] = {};
                updatedCategories[newService.category] = {
                    ...updatedCategories[newService.category],
                    [newService.name]: Number(newService.price)
                };
                return { ...prev, servicios: updatedCategories };
            });
            setNewService({ ...newService, name: '', price: '' });
        }
    };

    const handleRemoveService = (category: string, serviceName: string) => {
        setFormData(prev => {
            const updatedCategories = { ...prev.servicios };
            if (updatedCategories[category]) {
                const updatedServices = { ...updatedCategories[category] };
                delete updatedServices[serviceName];
                updatedCategories[category] = updatedServices;
                if (Object.keys(updatedServices).length === 0) delete updatedCategories[category];
            }
            return { ...prev, servicios: updatedCategories };
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            if (clinicProfile) {
                const updatedProfile = { ...clinicProfile, ...formData };
                setClinicProfile(updatedProfile);
            } else {
                setClinicProfile(formData);
            }
            setBaseLocation({ lat: formData.lat, lng: formData.lng });
            setIsSaving(false);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
            alert('Perfil de clínica guardado correctamente en la nube.');
        }, 1000);
    };

    const handlePasswordSave = () => {
        if (!passwordData.new || passwordData.new !== passwordData.confirm) {
            alert('Las contraseñas no coinciden o están vacías.');
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            updateStaffPassword(currentUserId, passwordData.new);
            if (currentUser) {
                refreshUser({ ...currentUser, password: passwordData.new });
            }
            setIsSaving(false);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
            setPasswordData({ current: '', new: '', confirm: '' });
            alert('Contraseña actualizada con éxito.');
        }, 1000);
    };

    const handleProfileUpdate = () => {
        if (!currentUserId || !currentUser) return;
        setIsSaving(true);
        setTimeout(() => {
            updateStaffMember(currentUserId, profileEditData);
            refreshUser({ ...currentUser, ...profileEditData });
            setIsSaving(false);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
            alert('Datos de perfil actualizados.');
        }, 1000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Configuración</h1>
                        {syncError ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold animate-pulse">
                                <AlertCircle className="w-3 h-3" /> ERROR NUBE: {syncError}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> SINCRONIZADO
                            </div>
                        )}
                    </div>
                    <p className="text-clinical/40 text-sm mt-1">Gestiona tu clínica, equipo y permisos de acceso.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                setIsSaving(true);
                                if (clinicProfile) await setClinicProfile(clinicProfile);
                                setIsSaving(false);
                                alert('Sincronización manual forzada completada.');
                            }}
                            disabled={isSaving}
                            className="bg-white/5 border border-white/10 text-clinical/60 hover:text-electric hover:border-electric/30 p-2 rounded-xl transition-all"
                            title="Forzar Sincronización Nube"
                        >
                            <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={activeTab === 'perfil' ? handleSave : (activeTab === 'mi_perfil' ? handleProfileUpdate : undefined)}
                            disabled={isSaving || activeTab === 'equipo' || !hasSyncedFromCloud}
                            className={`font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-electric/10 ${activeTab === 'mi_perfil' ? 'bg-premium text-cobalt hover:bg-premium/80' : 'bg-electric text-cobalt hover:bg-electric/80'} ${(!hasSyncedFromCloud && activeTab !== 'equipo') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isSaving
                                ? <><span className="w-4 h-4 rounded-full border-2 border-cobalt border-t-transparent animate-spin" /> Guardando...</>
                                : <><Save className="w-4 h-4" /> {activeTab === 'perfil' ? 'Guardar Perfil' : 'Guardar Datos Perfil'}</>
                            }
                        </button>
                    </div>
                    {showSavedMsg && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">¡Cambios guardados en la nube!</span>}
                    {!hasSyncedFromCloud && <span className="text-[10px] text-red-400 font-bold">Botón bloqueado: Esperando sincronización...</span>}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                {hasFullAccess && (
                    <button onClick={() => setActiveTab('perfil')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'perfil' ? 'bg-electric text-cobalt shadow-md' : 'text-clinical/60 hover:text-clinical hover:bg-white/5'}`}>
                        <Building2 className="w-4 h-4" /> Perfil de Clínica
                    </button>
                )}
                <button onClick={() => setActiveTab('mi_perfil')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all border ${activeTab === 'mi_perfil' ? 'bg-premium text-cobalt border-premium/50 shadow-lg shadow-premium/20' : 'text-clinical/60 border-transparent hover:text-clinical hover:bg-white/5'}`}>
                    <UserCircle className="w-4 h-4" /> Mi Perfil
                </button>
                {hasFullAccess && (
                    <button onClick={() => setActiveTab('equipo')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'equipo' ? 'bg-electric text-cobalt shadow-md' : 'text-clinical/60 hover:text-clinical hover:bg-white/5'}`}>
                        <Users className="w-4 h-4" /> Equipo &amp; Permisos
                    </button>
                )}
            </div>

            {/* TAB CONTENT: MI PERFIL */}
            {activeTab === 'mi_perfil' && (
                <div className="max-w-xl mx-auto space-y-6">
                    <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="w-16 h-16 rounded-2xl bg-electric/20 border border-electric/30 flex items-center justify-center text-electric text-2xl font-bold">
                                {currentUser?.nombres.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-syne text-clinical">{currentUser?.nombres}</h2>
                                <p className="text-clinical/60">{currentUser?.email}</p>
                            </div>
                        </div>

                        {/* Profile Info Form */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-premium flex items-center gap-2 uppercase tracking-widest">
                                <UserCircle className="w-4 h-4" /> Datos Personales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Nombre Completo</label>
                                    <input title="Nombres" type="text" value={profileEditData.nombres}
                                        onChange={e => setProfileEditData({ ...profileEditData, nombres: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Email (Acceso)</label>
                                    <input title="Email" type="email" value={profileEditData.email} disabled
                                        className="w-full bg-cobalt/50 border border-white/10 rounded-lg px-4 py-2 text-clinical/50 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Especialidad / Cargo</label>
                                    <input title="Especialidad" type="text" value={profileEditData.especialidad}
                                        onChange={e => setProfileEditData({ ...profileEditData, especialidad: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Teléfono</label>
                                    <input title="Teléfono" type="text" value={profileEditData.telefono}
                                        onChange={e => setProfileEditData({ ...profileEditData, telefono: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Ciudad</label>
                                    <input title="Ciudad" type="text" value={profileEditData.ciudad}
                                        onChange={e => setProfileEditData({ ...profileEditData, ciudad: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">País</label>
                                    <input title="País" type="text" value={profileEditData.pais}
                                        onChange={e => setProfileEditData({ ...profileEditData, pais: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Fecha de Nacimiento</label>
                                    <input title="Nacimiento" type="date" value={profileEditData.fechaNacimiento}
                                        onChange={e => setProfileEditData({ ...profileEditData, fechaNacimiento: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Domicilio</label>
                                    <input title="Domicilio" type="text" value={profileEditData.domicilio}
                                        onChange={e => setProfileEditData({ ...profileEditData, domicilio: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-electric flex items-center gap-2 uppercase tracking-widest">
                                <Key className="w-4 h-4" /> Cambiar Contraseña
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Nueva Contraseña</label>
                                    <input title="Nueva" type="password" value={passwordData.new}
                                        onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">Confirmar Contraseña</label>
                                    <input title="Confirmar" type="password" value={passwordData.confirm}
                                        onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                                </div>
                                <button onClick={handlePasswordSave} className="bg-electric/10 border border-electric/30 text-electric text-xs font-bold px-4 py-2 rounded-lg hover:bg-electric/20 transition-all flex items-center gap-2">
                                    <Key className="w-3 h-3" /> Actualizar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PERFIL DE CLÍNICA */}
            {activeTab === 'perfil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                        <h2 className="font-syne text-xl text-clinical border-b border-white/10 pb-2">Información y Ubicación</h2>
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-electric/50">
                                    {formData.logo
                                        ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        : <><Upload className="w-8 h-8 text-clinical/30 mb-2" /><span className="text-[10px] text-clinical/40 uppercase font-bold">Subir Logo</span></>
                                    }
                                </div>
                                {formData.logo && (
                                    <button title="Quitar logo" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <input title="Logo" type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-clinical/60 block mb-2">Nombre de la Clínica</label>
                            <input title="Nombre" type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-clinical focus:outline-none focus:border-electric" />
                        </div>
                        <div>
                            <label className="text-sm text-clinical/60 block mb-2">Dirección Completa</label>
                            <div className="flex gap-2">
                                <input title="Dirección" type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                    className="flex-1 bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-clinical focus:outline-none focus:border-electric" />
                                <button onClick={handleCitySearch} disabled={isGeocoding} className="bg-white/10 hover:bg-white/20 text-clinical px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[100px]">
                                    {isGeocoding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Validar <MapPin className="w-4 h-4 ml-1" /></>}
                                </button>
                            </div>
                        </div>

                        {/* Contact & Responsibility */}
                        <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-clinical/60 block mb-2">Teléfono Clínica</label>
                                <input title="Teléfono" type="text" value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                            </div>
                            <div>
                                <label className="text-sm text-clinical/60 block mb-2">Email Contacto</label>
                                <input title="Email" type="email" value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                            </div>
                            <div>
                                <label className="text-sm text-clinical/60 block mb-2">Médico Responsable</label>
                                <input title="Médico Responsable" type="text" value={formData.medicoResponsable}
                                    onChange={e => setFormData({ ...formData, medicoResponsable: e.target.value })}
                                    className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                            </div>
                            <div>
                                <label className="text-sm text-clinical/60 block mb-2">Cédula Profesional</label>
                                <input title="Cédula Profesional" type="text" value={formData.cedProfesional ?? ''}
                                    onChange={e => setFormData({ ...formData, cedProfesional: e.target.value })}
                                    placeholder="Ej. 12345678"
                                    className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" />
                            </div>
                        </div>

                        {/* Redes Sociales */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <h3 className="text-xs font-bold text-premium uppercase tracking-widest">Presencia Digital</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(['facebook', 'instagram', 'whatsapp'] as const).map(red => (
                                    <div key={red} className={red === 'whatsapp' ? 'md:col-span-2' : ''}>
                                        <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">{red}</label>
                                        <input title={red} type="text"
                                            value={formData.redesSociales?.[red] || ''}
                                            onChange={e => setFormData({ ...formData, redesSociales: { ...formData.redesSociales, [red]: e.target.value } })}
                                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical text-sm focus:outline-none focus:border-premium" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WhatsApp reminder template */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <div>
                                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest">Recordatorio WhatsApp</h3>
                                <p className="text-[10px] text-clinical/40 mt-0.5">Variables disponibles: <span className="text-electric font-mono">{'{{nombre}} {{clinica}} {{fecha}} {{hora}} {{procedimiento}}'}</span></p>
                            </div>
                            <textarea
                                title="Template de recordatorio WhatsApp"
                                rows={3}
                                value={formData.whatsappTemplate || ''}
                                onChange={e => setFormData({ ...formData, whatsappTemplate: e.target.value })}
                                placeholder="Hola {{nombre}}, te recordamos tu cita en {{clinica}} el día {{fecha}} a las {{hora}} para {{procedimiento}}. ¡Te esperamos!"
                                className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical text-sm focus:outline-none focus:border-green-400 resize-none"
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 flex flex-col">
                        <h2 className="font-syne text-xl text-clinical border-b border-white/10 pb-2">Servicios y Precios</h2>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-[300px]">
                            {Object.entries(formData.servicios).map(([category, services]) => (
                                <div key={category} className="space-y-2">
                                    <h3 className="text-xs font-bold text-electric uppercase tracking-widest px-1">{category}</h3>
                                    {Object.entries(services as Record<string, number>).map(([name, price]) => (
                                        <div key={name} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg ml-2 group">
                                            <span className="text-clinical text-sm">{name}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-electric font-syne font-bold text-sm">${price.toLocaleString()}</span>
                                                <button title="Borrar" onClick={() => handleRemoveService(category, name)} className="text-clinical/20 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <select title="Categoría" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })}
                                    className="bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical text-xs focus:outline-none focus:border-electric">
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input title="Servicio" type="text" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })}
                                    className="flex-1 min-w-[120px] bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical text-xs" placeholder="Servicio" />
                                <input title="Precio" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })}
                                    className="w-24 bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical text-xs" placeholder="Precio" />
                                <button title="Añadir" onClick={handleAddService} disabled={!newService.name || !newService.price}
                                    className="bg-electric text-cobalt p-2 rounded-lg hover:bg-electric/80 disabled:opacity-50 transition-all">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: EQUIPO */}
            {activeTab === 'equipo' && (
                <div className="space-y-4">
                    {clinicProfile?.staff?.map(member => {
                        const perms = member.modulePermissions ?? {} as ModulePermissions;
                        const isAdmin = member.role === 'admin';
                        return (
                            <div key={member.id} className="glass-panel rounded-2xl border border-white/10 p-5">
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-electric/20 border border-electric/30 flex items-center justify-center text-white font-bold text-xl">
                                        {member.nombres.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-clinical">{member.nombres}</p>
                                            {member.isMasterAdmin && (
                                                <span className="text-[10px] bg-premium text-cobalt px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-premium/20 font-black">
                                                    Administrador Maestro
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            <select
                                                title="Tipo de Staff"
                                                value={member.staffType}
                                                onChange={(e) => updateStaffMember(member.id, { staffType: e.target.value as any })}
                                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-electric uppercase focus:outline-none focus:border-electric/40"
                                            >
                                                <option value="admin">Administrativo</option>
                                                <option value="doctor">Doctor</option>
                                                <option value="external_doctor">Doctor Externo</option>
                                            </select>
                                            <span className="text-clinical/40 text-[10px]">•</span>
                                            <p className="text-[10px] font-medium text-clinical/60">{member.especialidad}</p>
                                            {(member.staffType === 'doctor' || member.staffType === 'external_doctor') && (
                                                <>
                                                    <span className="text-clinical/40 text-[10px]">•</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-clinical/40">Comisión</span>
                                                        <input
                                                            title="Porcentaje de comisión"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={member.porcentajeComision ?? 30}
                                                            onChange={e => updateStaffMember(member.id, { porcentajeComision: Number(e.target.value) })}
                                                            className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-electric focus:outline-none focus:border-electric/40 text-center"
                                                        />
                                                        <span className="text-[10px] text-clinical/40">%</span>
                                                    </div>
                                                    <span className="text-clinical/40 text-[10px]">•</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-clinical/40">Céd. Prof.</span>
                                                        <input
                                                            title="Cédula Profesional"
                                                            type="text"
                                                            value={member.cedProfesional ?? ''}
                                                            onChange={e => updateStaffMember(member.id, { cedProfesional: e.target.value })}
                                                            placeholder="Ej. 12345678"
                                                            className="w-24 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-electric focus:outline-none focus:border-electric/40"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <span className="text-clinical/40 text-[10px]">•</span>
                                            <p className="text-[10px] font-medium text-clinical/60">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isMasterAdmin && member.id !== currentUserId && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const p = prompt(`Nueva contraseña para ${member.nombres}:`, '12345');
                                                        if (p) updateStaffPassword(member.id, p);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold bg-white/5 border border-white/10 text-clinical/60 hover:text-electric hover:border-electric/30 hover:bg-electric/5 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    <Key className="w-3 h-3" /> Cambiar Pass
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Transferir control MAESTRO a ${member.nombres}?`)) setMasterAdmin(member.id);
                                                    }}
                                                    disabled={member.isMasterAdmin}
                                                    className={`text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-lg ${member.isMasterAdmin
                                                        ? 'bg-premium/20 text-premium/50 cursor-not-allowed'
                                                        : 'bg-premium text-cobalt hover:scale-105 active:scale-95 shadow-premium/20'}`}
                                                >
                                                    {member.isMasterAdmin ? 'ES MAESTRO' : 'CONVERTIR MAESTRO'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-white/5">
                                    {MODULE_LABELS.map(({ key, label }) => {
                                        const granted = isAdmin ? true : (perms[key] ?? false);
                                        return (
                                            <button key={key} disabled={isAdmin}
                                                onClick={() => updateStaffPermissions(member.id, { ...perms, [key]: !granted })}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-bold transition-all
                                                        ${granted ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-clinical/30'}
                                                        ${isAdmin ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}>
                                                {granted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                {label.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};
