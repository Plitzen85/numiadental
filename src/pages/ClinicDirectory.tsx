import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMarket, DirectoryEntity, ClinicProfile } from '../context/MarketContext';
import { Users, Truck, FlaskConical, Building, ShieldCheck, Search, Plus, Edit2, Trash2, X, Camera } from 'lucide-react';

const TABS = [
    { id: 'staff', label: 'Staff de la Clínica', icon: Users },
    { id: 'depositos', label: 'Depósitos Dentales', icon: Truck },
    { id: 'laboratorios', label: 'Laboratorios', icon: FlaskConical },
    { id: 'proveedores', label: 'Proveedores', icon: Building },
    { id: 'aseguradoras', label: 'Aseguradoras', icon: ShieldCheck },
] as const;

type TabId = typeof TABS[number]['id'];

export const ClinicDirectory: React.FC = () => {
    const { clinicProfile, setClinicProfile } = useMarket();
    const [activeTab, setActiveTab] = useState<TabId>('staff');
    const [searchTerm, setSearchTerm] = useState('');

    // CRUD State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPhone2, setShowPhone2] = useState(false);

    // Generic form state that covers both Staff and Entity fields
    const defaultFormState = {
        nombres: '', organizacion: '', fechaNacimiento: '', email: '',
        domicilio: '', pais: 'México', telefono: '', telefono2: '', genero: 'Femenino',
        estadoCivil: 'Soltero', ciudad: '', especialidad: '', comentario: '', foto: '',
        // Generic Entity specific
        clave: '', nombre: '', razonSocial: '', codigoPostal: '',
        telefonos: '', nombreContacto: '', emailContacto: '', telefonoContacto: ''
    };

    const [formData, setFormData] = useState(defaultFormState);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, foto: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getActiveDataArray = () => {
        if (!clinicProfile) return [];
        switch (activeTab) {
            case 'staff': return clinicProfile.staff || [];
            case 'depositos': return clinicProfile.depositos || [];
            case 'laboratorios': return clinicProfile.laboratorios || [];
            case 'proveedores': return clinicProfile.proveedores || [];
            case 'aseguradoras': return clinicProfile.aseguradoras || [];
            default: return [];
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({ ...defaultFormState, ...item });
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (!clinicProfile || !confirm("¿Eliminar este registro permanentemente?")) return;

        const updatedProfile = { ...clinicProfile };
        if (activeTab === 'staff') {
            updatedProfile.staff = updatedProfile.staff?.filter(s => s.id !== id);
        } else {
            const key = activeTab as keyof ClinicProfile;
            (updatedProfile[key] as any) = (updatedProfile[key] as DirectoryEntity[] | undefined)?.filter(e => e.id !== id);
        }
        setClinicProfile(updatedProfile);
    };

    const handleSave = () => {
        if (!clinicProfile) return;

        const updatedProfile = { ...clinicProfile };
        const newRecord = { ...formData, id: editingId || Date.now().toString() };

        if (activeTab === 'staff') {
            const list = updatedProfile.staff || [];
            if (editingId) {
                updatedProfile.staff = list.map(item => item.id === editingId ? newRecord as any : item);
            } else {
                updatedProfile.staff = [...list, newRecord as any];
            }
        } else {
            const key = activeTab as keyof ClinicProfile;
            const list = (updatedProfile[key] as DirectoryEntity[]) || [];
            if (editingId) {
                (updatedProfile[key] as any) = list.map(item => item.id === editingId ? newRecord as any : item);
            } else {
                (updatedProfile[key] as any) = [...list, newRecord as any];
            }
        }

        setClinicProfile(updatedProfile);
        setShowForm(false);
        setEditingId(null);
        setFormData(defaultFormState);
        setShowPhone2(false);
    };

    // --- RENDER TABLE ---
    const renderTable = () => {
        const data = getActiveDataArray().filter((item: any) => {
            const searchStr = Object.values(item).join(' ').toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });

        if (data.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-clinical/40 min-h-[400px]">
                    <IconPlaceholder />
                    <p className="mt-4">No hay registros de {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} en el sistema.</p>
                </div>
            );
        }

        const isStaff = activeTab === 'staff';

        return (
            <div className="w-full relative overflow-x-auto rounded-xl">
                <table className="w-full text-left text-sm text-clinical/80">
                    <thead className="bg-white/5 text-electric font-syne uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 w-16 text-center">Opt</th>
                            {isStaff ? (
                                <>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Domicilio</th>
                                    <th className="px-4 py-3">Teléfono</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Especialidad</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-4 py-3">Clave</th>
                                    <th className="px-4 py-3">Razón Social</th>
                                    <th className="px-4 py-3">Ciudad</th>
                                    <th className="px-4 py-3">Teléfonos</th>
                                    <th className="px-4 py-3">Email Contacto</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((item: any) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button title="Editar" aria-label="Editar" onClick={() => handleEdit(item)} className="text-clinical/60 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button title="Eliminar" aria-label="Eliminar" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                {isStaff ? (
                                    <>
                                        <td className="px-4 py-3 font-bold text-white flex items-center gap-3">
                                            {item.foto ? (
                                                <img src={item.foto} alt="Staff" className="w-8 h-8 rounded-full border border-electric/30 object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                            )}
                                            {item.nombres}
                                        </td>
                                        <td className="px-4 py-3">{item.domicilio}</td>
                                        <td className="px-4 py-3">{item.telefono}</td>
                                        <td className="px-4 py-3">{item.email}</td>
                                        <td className="px-4 py-3 text-premium">{item.especialidad}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-white/50">{item.clave || 'Sin Clave'}</td>
                                        <td className="px-4 py-3 font-bold text-white">{item.razonSocial}</td>
                                        <td className="px-4 py-3">{item.ciudad}</td>
                                        <td className="px-4 py-3">{item.telefonos}</td>
                                        <td className="px-4 py-3">{item.emailContacto}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderForm = () => {
        const isStaff = activeTab === 'staff';

        if (isStaff) {
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 md:p-14 rounded-3xl text-gray-800 shadow-2xl relative mt-4 mb-12 max-w-5xl mx-auto border border-gray-100">
                    {/* Header */}
                    <div className="mb-12">
                        <h2 className="font-syne text-3xl font-bold text-[#00529B]">
                            Registro Staff
                        </h2>
                    </div>

                    {/* Photo Upload - Top Right */}
                    <div className="absolute top-10 right-10 md:top-14 md:right-14">
                        <div className="relative group w-28 h-28">
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden transition-all group-hover:bg-gray-200 border-2 border-dashed border-gray-300">
                                {formData.foto ? (
                                    <img src={formData.foto} alt="Staff" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-10 h-10 text-gray-400 group-hover:text-gray-500" />
                                )}
                            </div>
                            <input title="Campo" type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        {/* Organización */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Organización</label>
                            <input title="Campo" type="text"
                                value={formData.organizacion || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, organizacion: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Nombres y Apellidos */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Nombres y Apellidos*</label>
                            <input title="Campo" type="text"
                                value={formData.nombres}
                                onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Fecha de nacimiento */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha de nacimiento</label>
                                <input title="Campo" type="text"
                                    placeholder="DD/MM/YYYY"
                                    value={formData.fechaNacimiento || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            {/* Correo electrónico */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Correo electrónico</label>
                                <input title="Campo" type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Domicilio */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Domicilio</label>
                            <input title="Campo" type="text"
                                value={formData.domicilio}
                                onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* País */}
                        <div className="w-1/4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">País</label>
                            <select title="Opciones" value={formData.pais || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="México">México</option>
                                <option value="Estados Unidos">Estados Unidos</option>
                                <option value="Colombia">Colombia</option>
                                <option value="España">España</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {/* Teléfono */}
                        <div className="w-1/2 flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono 1 *</label>
                                <input title="Campo" type="text"
                                    placeholder="(+52)"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            {!showPhone2 && !formData.telefono2 && (
                                <button title="Añadir Teléfono 2" aria-label="Añadir Teléfono 2" onClick={() => setShowPhone2(true)} className="pb-1.5 text-gray-600 hover:text-black">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Teléfono 2 (Condicional) */}
                        {(showPhone2 || formData.telefono2) && (
                            <div className="w-1/2 flex items-end gap-2 mt-2">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono 2</label>
                                    <input title="Campo" type="text"
                                        placeholder="(+52)"
                                        value={formData.telefono2 || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, telefono2: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button title="Eliminar Teléfono 2" aria-label="Eliminar Teléfono 2" onClick={() => { setShowPhone2(false); setFormData(prev => ({ ...prev, telefono2: '' })); }} className="pb-1.5 text-red-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Género */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Género</label>
                                <select title="Opciones" value={formData.genero || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, genero: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                    <option value="Femenino">Femenino</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            {/* Estado civil */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Estado civil</label>
                                <select title="Opciones" value={formData.estadoCivil || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, estadoCivil: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                    <option value="Soltero">Soltero(a)</option>
                                    <option value="Casado">Casado(a)</option>
                                    <option value="Divorciado">Divorciado(a)</option>
                                    <option value="Viudo">Viudo(a)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Ciudad */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Ciudad</label>
                                <input title="Campo" type="text"
                                    value={formData.ciudad}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            {/* Especialidad */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Especialidad</label>
                                <input title="Campo" type="text"
                                    value={formData.especialidad}
                                    onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Comentario */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Comentario</label>
                            <input title="Campo" type="text"
                                value={formData.comentario}
                                onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button onClick={handleSave} className="bg-[#9CDAB5] hover:bg-[#8BC9A4] text-white font-bold px-8 py-2 rounded-lg transition-colors text-sm">
                            Guardar
                        </button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); setFormData(defaultFormState); }} className="bg-[#E67E7E] hover:bg-[#D56D6D] text-white font-bold px-8 py-2 rounded-lg transition-colors text-sm">
                            Cancelar
                        </button>
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="font-syne text-xl text-electric">
                        {editingId ? 'Editar Registro' : 'Nuevo Registro'} - {TABS.find(t => t.id === activeTab)?.label}
                    </h2>
                    <button title="Cerrar" aria-label="Cerrar" onClick={() => { setShowForm(false); setEditingId(null); setFormData(defaultFormState); }} className="text-clinical/60 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Razón Social / Nombre Comercial</label>
                        <input title="Campo" type="text"
                            value={formData.razonSocial}
                            onChange={(e) => setFormData(prev => ({ ...prev, razonSocial: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Clave / ID Interno</label>
                        <input title="Campo" type="text"
                            value={formData.clave}
                            onChange={(e) => setFormData(prev => ({ ...prev, clave: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Domicilio Completo</label>
                        <input title="Campo" type="text"
                            value={formData.domicilio}
                            onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Ciudad</label>
                        <input title="Campo" type="text"
                            value={formData.ciudad}
                            onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Teléfonos de Oficina</label>
                        <input title="Campo" type="text"
                            value={formData.telefonos}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefonos: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Nombre del Contacto Principal</label>
                        <input title="Campo" type="text"
                            value={formData.nombreContacto}
                            onChange={(e) => setFormData(prev => ({ ...prev, nombreContacto: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Email del Contacto</label>
                        <input title="Campo" type="email"
                            value={formData.emailContacto}
                            onChange={(e) => setFormData(prev => ({ ...prev, emailContacto: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric"
                        />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <label className="text-xs text-clinical/60 uppercase block mb-1">Comentarios Adicionales</label>
                        <textarea title="Texto" value={formData.comentario}
                            onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
                            className="w-full bg-cobalt border border-white/20 rounded-lg px-4 py-2 text-clinical focus:outline-none focus:border-electric h-24 resize-none"
                            placeholder="Notas internas..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                    <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-clinical/60 hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="bg-electric text-cobalt font-bold px-8 py-2 rounded-xl hover:bg-electric/80 transition-colors">
                        Guardar Registro
                    </button>
                </div>
            </motion.div>
        );
    };

    const renderContent = () => {
        if (showForm) return renderForm();
        return renderTable();
    };

    const IconPlaceholder = () => {
        const activeDef = TABS.find(t => t.id === activeTab);
        if (!activeDef) return null;
        const Icon = activeDef.icon;
        return <Icon className="w-16 h-16 opacity-20" />;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-syne text-3xl font-bold text-electric">Clínica & Directorio</h1>
                    <p className="text-clinical/60 mt-1">Gestión centralizada de personal, proveedores y aliados estratégicos.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-clinical/40" />
                        <input title="Campo" type="text"
                            placeholder="Buscar en el directorio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-cobalt border border-white/10 rounded-xl pl-10 pr-4 py-2 w-64 text-clinical focus:outline-none focus:border-electric transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData(defaultFormState);
                            setShowForm(true);
                        }}
                        className="bg-electric hover:bg-electric/80 text-cobalt font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Nuevo Registro
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 shrink-0 flex flex-col gap-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold text-left ${isActive
                                    ? 'bg-gradient-to-r from-electric/20 to-transparent border-l-4 border-electric text-electric'
                                    : 'text-clinical/60 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-electric' : 'text-clinical/40'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-6 overflow-y-auto custom-scrollbar">
                    {renderContent()}
                </div>
            </div>
        </motion.div>
    );
};
