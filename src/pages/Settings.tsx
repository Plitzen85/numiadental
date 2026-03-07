import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMarket, ClinicProfile, ModulePermissions } from '../context/MarketContext';
import { Save, MapPin, Building2, Plus, Trash2, Upload, X, Users, Shield, CheckCircle2, XCircle } from 'lucide-react';

const CATEGORIES = ['Preventivo', 'Restauradores', 'Estéticos', 'Ortodónticos', 'Periodontales', 'Merchandising'];

const MODULE_LABELS: { key: keyof ModulePermissions; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'radar', label: 'Radar Dental' },
    { key: 'agenda', label: 'Agenda & CRM' },
    { key: 'clinica', label: 'Clínica' },
    { key: 'inventario', label: 'Inventario' },
    { key: 'campanas', label: 'Campañas' },
    { key: 'turismo', label: 'Turismo Dental' },
    { key: 'finanzas', label: 'Finanzas' },
    { key: 'reportes', label: 'Informes' },
    { key: 'settings', label: 'Configuración' },
];

export const Settings: React.FC = () => {
    const { clinicProfile, setClinicProfile, setBaseLocation, updateStaffPermissions } = useMarket();
    const [activeTab, setActiveTab] = useState<'perfil' | 'equipo'>('perfil');
    const [isSaving, setIsSaving] = useState(false);
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
        redesSociales: {
            facebook: clinicProfile?.redesSociales?.facebook || '',
            instagram: clinicProfile?.redesSociales?.instagram || '',
            whatsapp: clinicProfile?.redesSociales?.whatsapp || ''
        }
    });

    const [newService, setNewService] = useState({ category: 'Preventivo', name: '', price: '' });

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
            setClinicProfile(formData);
            setBaseLocation({ lat: formData.lat, lng: formData.lng });
            setIsSaving(false);
            alert('Perfil de clínica guardado correctamente.');
        }, 1000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-syne text-3xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text flex items-center gap-2">
                        <Building2 className="text-electric w-8 h-8" /> Configuración
                    </h1>
                    <p className="text-clinical/60 mt-2">Gestiona tu clínica, equipo y permisos de acceso.</p>
                </div>
                {activeTab === 'perfil' && (
                    <button onClick={handleSave} disabled={isSaving}
                        className="bg-electric hover:bg-electric/80 text-cobalt font-bold px-6 py-2 rounded-xl transition-colors flex items-center gap-2">
                        {isSaving
                            ? <><span className="w-4 h-4 rounded-full border-2 border-cobalt border-t-transparent animate-spin" /> Guardando...</>
                            : <><Save className="w-4 h-4" /> Guardar Perfil</>
                        }
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                <button onClick={() => setActiveTab('perfil')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'perfil' ? 'bg-electric text-cobalt shadow-md' : 'text-clinical/60 hover:text-clinical hover:bg-white/5'}`}>
                    <Building2 className="w-4 h-4" /> Perfil de Clínica
                </button>
                <button onClick={() => setActiveTab('equipo')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'equipo' ? 'bg-electric text-cobalt shadow-md' : 'text-clinical/60 hover:text-clinical hover:bg-white/5'}`}>
                    <Users className="w-4 h-4" /> Equipo &amp; Permisos
                </button>
            </div>

            {/* ── PERFIL TAB ── */}
            {activeTab === 'perfil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Info */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                        <h2 className="font-syne text-xl text-clinical border-b border-white/10 pb-2">Información y Ubicación</h2>

                        {/* Logo */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-electric/50">
                                    {formData.logo
                                        ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        : <><Upload className="w-8 h-8 text-clinical/30 mb-2" /><span className="text-[10px] text-clinical/40 uppercase font-bold">Subir Logo</span></>
                                    }
                                </div>
                                {formData.logo && (
                                    <button title="Eliminar logo" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <input title="Logo" type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-xs text-clinical/40">Sube el logotipo de tu clínica (JPG, PNG)</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="text-sm text-clinical/60 block mb-2">Nombre de la Clínica</label>
                            <input title="Nombre" type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-clinical focus:outline-none focus:border-electric" placeholder="Ej. Mi Clínica Dental" />
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <label className="text-sm text-clinical/60 block mb-2">Ciudad o Dirección Completa</label>
                            <div className="flex gap-2">
                                <input title="Dirección" type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                    className="flex-1 bg-cobalt border border-white/20 rounded-lg px-4 py-3 text-clinical focus:outline-none focus:border-electric" placeholder="Ej. Polanco, CDMX" />
                                <button onClick={handleCitySearch} disabled={isGeocoding} className="bg-white/10 hover:bg-white/20 text-clinical px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[100px]">
                                    {isGeocoding ? <span className="w-4 h-4 rounded-full border-2 border-electric border-t-transparent animate-spin" /> : <>Validar <MapPin className="w-4 h-4 ml-1" /></>}
                                </button>
                            </div>
                            <p className="text-xs text-clinical/40">Validar la dirección asegurará que el radar inicie en tus coordenadas exactas.</p>
                        </div>

                        {/* Contacto */}
                        <div className="pt-4 border-t border-white/10 space-y-4">
                            <h3 className="text-xs font-bold text-electric uppercase tracking-widest">Contacto Directo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-clinical/60 block mb-2">Teléfono</label>
                                    <input title="Teléfono" type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" placeholder="+52..." />
                                </div>
                                <div>
                                    <label className="text-sm text-clinical/60 block mb-2">Email</label>
                                    <input title="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" placeholder="contacto@clinica.com" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-clinical/60 block mb-2">Médico Responsable</label>
                                <input title="Médico Responsable" type="text" value={formData.medicoResponsable} onChange={e => setFormData({ ...formData, medicoResponsable: e.target.value })}
                                    className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric" placeholder="Dr. Nombre Apellido" />
                            </div>
                        </div>

                        {/* Redes Sociales */}
                        <div className="pt-4 border-t border-white/10 space-y-4">
                            <h3 className="text-xs font-bold text-premium uppercase tracking-widest">Redes Sociales</h3>
                            <div className="space-y-3">
                                {(['instagram', 'facebook', 'whatsapp'] as const).map(red => (
                                    <div key={red}>
                                        <label className="text-[10px] text-clinical/40 uppercase font-bold block mb-1">{red.charAt(0).toUpperCase() + red.slice(1)}</label>
                                        <input title={red} type="text"
                                            value={formData.redesSociales?.[red] ?? ''}
                                            onChange={e => setFormData({ ...formData, redesSociales: { ...formData.redesSociales, [red]: e.target.value } })}
                                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-premium"
                                            placeholder={red === 'instagram' ? '@clinica...' : red === 'facebook' ? 'facebook.com/clinica...' : '+52...'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Services */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 flex flex-col">
                        <h2 className="font-syne text-xl text-clinical border-b border-white/10 pb-2">Tus Precios y Servicios</h2>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-[200px]">
                            {Object.keys(formData.servicios).length === 0
                                ? <p className="text-sm text-clinical/40 text-center py-8">No hay servicios. Agrega uno abajo.</p>
                                : Object.entries(formData.servicios).map(([category, services]) => (
                                    <div key={category} className="space-y-2">
                                        <h3 className="text-sm font-bold text-electric px-1">{category}</h3>
                                        {Object.entries(services as Record<string, number>).map(([name, price]) => (
                                            <div key={name} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg ml-2">
                                                <span className="text-clinical text-sm">{name}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-electric font-syne font-bold text-sm">${price.toLocaleString()} MXN</span>
                                                    <button title="Eliminar" onClick={() => handleRemoveService(category, name)} className="text-red-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            }
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <label className="text-sm text-clinical/60 block">Agregar Nuevo Servicio</label>
                            <div className="flex flex-wrap gap-2">
                                <select title="Categoría" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })}
                                    className="bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical focus:outline-none focus:border-electric text-sm">
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input title="Servicio" type="text" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })}
                                    className="flex-1 min-w-[120px] bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical focus:outline-none focus:border-electric text-sm" placeholder="Tratamiento" />
                                <input title="Precio" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })}
                                    className="w-28 bg-cobalt border border-white/20 rounded-lg px-3 py-2 text-clinical focus:outline-none focus:border-electric text-sm" placeholder="MXN" />
                                <button title="Agregar" onClick={handleAddService} disabled={!newService.name || !newService.price}
                                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-clinical p-2 rounded-lg transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EQUIPO TAB ── */}
            {activeTab === 'equipo' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-electric" />
                        <p className="text-clinical/50 text-sm">Activa o desactiva módulos para cada miembro del equipo. Los cambios se aplican inmediatamente.</p>
                    </div>

                    {(!clinicProfile?.staff || clinicProfile.staff.length === 0) ? (
                        <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center">
                            <Users className="w-12 h-12 text-clinical/30 mx-auto mb-4" />
                            <p className="text-clinical/50">No hay miembros configurados. Ve a Clínica para agregar personal.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clinicProfile.staff.map(member => {
                                const perms = member.modulePermissions ?? {} as ModulePermissions;
                                const isAdmin = member.role === 'admin';
                                return (
                                    <div key={member.id} className="glass-panel rounded-2xl border border-white/10 p-5">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                                style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>
                                                {member.nombres.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-clinical">{member.nombres}</p>
                                                <p className="text-xs text-clinical/50">{member.especialidad} · <span className="capitalize text-electric/70">{member.role ?? 'doctor'}</span></p>
                                            </div>
                                            {isAdmin && (
                                                <span className="flex items-center gap-1.5 text-xs font-bold bg-electric/10 border border-electric/30 text-electric px-3 py-1 rounded-full">
                                                    <Shield className="w-3 h-3" /> Administrador
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                            {MODULE_LABELS.map(({ key, label }) => {
                                                const granted = isAdmin ? true : (perms[key] ?? false);
                                                return (
                                                    <button key={key} disabled={isAdmin}
                                                        onClick={() => {
                                                            if (isAdmin) return;
                                                            updateStaffPermissions(member.id, { ...perms, [key]: !granted });
                                                        }}
                                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all
                                                            ${granted ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-clinical/40 hover:bg-white/10 hover:text-clinical/70'}
                                                            ${isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                        {granted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
