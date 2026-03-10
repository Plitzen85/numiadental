import React, { useState, useMemo } from 'react';
import {
    Truck, Plus, Search, Phone, Mail, Globe, Pencil, Trash2,
    X, Loader2, CheckCircle2, Building2, Filter, Tag,
    ExternalLink, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarket, DirectoryEntity } from '../context/MarketContext';

// ─── Extended Proveedor type ──────────────────────────────────────────────────

type ProveedorCategoria =
    | 'materiales'
    | 'equipos'
    | 'laboratorio'
    | 'farmacia'
    | 'software'
    | 'mantenimiento'
    | 'otro';

interface Proveedor extends DirectoryEntity {
    categoria?: ProveedorCategoria;
    activo?: boolean;
    web?: string;
    favorito?: boolean;
}

const CATEGORIA_LABELS: Record<ProveedorCategoria, string> = {
    materiales:    'Materiales Dentales',
    equipos:       'Equipos y Mobiliario',
    laboratorio:   'Laboratorio Dental',
    farmacia:      'Farmacia / Medicamentos',
    software:      'Software y Tecnología',
    mantenimiento: 'Mantenimiento',
    otro:          'Otro',
};

const CATEGORIA_COLORS: Record<ProveedorCategoria, string> = {
    materiales:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    equipos:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
    laboratorio:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    farmacia:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    software:      'bg-electric/10 text-electric border-electric/20',
    mantenimiento: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    otro:          'bg-white/5 text-clinical/50 border-white/10',
};

const EMPTY_PROVEEDOR: Proveedor = {
    id: '', clave: '', nombre: '', razonSocial: '', domicilio: '',
    codigoPostal: '', ciudad: '', telefonos: '', email: '',
    nombreContacto: '', emailContacto: '', telefonoContacto: '',
    comentario: '', categoria: 'materiales', activo: true, web: '', favorito: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Proveedores: React.FC = () => {
    const { clinicProfile, setClinicProfile } = useMarket();

    const proveedores: Proveedor[] = useMemo(
        () => (clinicProfile?.proveedores ?? []) as Proveedor[],
        [clinicProfile]
    );

    // ── Filters ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<ProveedorCategoria | 'all'>('all');
    const [showInactive, setShowInactive] = useState(false);

    // ── Modal ────────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Proveedor>(EMPTY_PROVEEDOR);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    // ── Delete confirm ───────────────────────────────────────────────────────
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const saveProveedores = (list: Proveedor[]) => {
        if (!clinicProfile) return;
        setClinicProfile({ ...clinicProfile, proveedores: list as DirectoryEntity[] });
    };

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = proveedores;
        if (!showInactive) list = list.filter(p => p.activo !== false);
        if (catFilter !== 'all') list = list.filter(p => (p.categoria ?? 'otro') === catFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                p.nombreContacto?.toLowerCase().includes(q) ||
                p.ciudad?.toLowerCase().includes(q) ||
                p.telefonos?.includes(q) ||
                p.email?.toLowerCase().includes(q)
            );
        }
        // Favorites first
        return [...list].sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0));
    }, [proveedores, search, catFilter, showInactive]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const openNew = () => {
        setForm({ ...EMPTY_PROVEEDOR, id: `prov-${Date.now()}` });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (p: Proveedor) => {
        setForm({ ...p });
        setEditingId(p.id);
        setModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre.trim()) return;
        setSaving(true);
        const updated = editingId
            ? proveedores.map(p => p.id === editingId ? form : p)
            : [...proveedores, form];
        saveProveedores(updated);
        setSaving(false);
        setModalOpen(false);
        showToast(editingId ? 'Proveedor actualizado' : 'Proveedor agregado');
    };

    const handleDelete = () => {
        if (!deleteId) return;
        saveProveedores(proveedores.filter(p => p.id !== deleteId));
        setDeleteId(null);
        showToast('Proveedor eliminado');
    };

    const toggleFavorito = (id: string) => {
        saveProveedores(proveedores.map(p => p.id === id ? { ...p, favorito: !p.favorito } : p));
    };

    const toggleActivo = (id: string) => {
        saveProveedores(proveedores.map(p => p.id === id ? { ...p, activo: !(p.activo !== false) } : p));
    };

    const field = (k: keyof Proveedor, v: string | boolean) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const inputCls = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-electric outline-none transition-colors";
    const labelCls = "text-xs text-clinical/50 font-bold uppercase tracking-wider mb-1 block";

    // Category counts
    const catCounts = useMemo(() => {
        const counts: Record<string, number> = { all: proveedores.filter(p => p.activo !== false).length };
        proveedores.filter(p => p.activo !== false).forEach(p => {
            const cat = p.categoria ?? 'otro';
            counts[cat] = (counts[cat] ?? 0) + 1;
        });
        return counts;
    }, [proveedores]);

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-syne text-3xl font-bold text-white flex items-center gap-3">
                        <Truck className="text-electric" /> Proveedores
                    </h1>
                    <p className="text-clinical/40 text-sm mt-1">
                        {proveedores.filter(p => p.activo !== false).length} proveedor{proveedores.filter(p => p.activo !== false).length !== 1 ? 'es' : ''} activo{proveedores.filter(p => p.activo !== false).length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openNew}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-electric text-cobalt font-black hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                >
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                </button>
            </div>

            {/* ── Toast ───────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4" /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Search + Filters ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical/30" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, contacto, ciudad…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-clinical/30 focus:border-electric outline-none transition-colors"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-clinical/50 cursor-pointer select-none px-4 py-2.5 rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-colors">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={e => setShowInactive(e.target.checked)}
                        className="accent-electric"
                    />
                    Ver inactivos
                </label>
            </div>

            {/* ── Category tabs ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setCatFilter('all')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${catFilter === 'all' ? 'bg-electric/10 border-electric/30 text-electric' : 'border-white/10 text-clinical/40 hover:border-white/20'}`}
                >
                    <Filter className="w-3 h-3 inline mr-1" />
                    Todos ({catCounts.all ?? 0})
                </button>
                {(Object.keys(CATEGORIA_LABELS) as ProveedorCategoria[]).map(cat => (
                    catCounts[cat] ? (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCatFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${catFilter === cat ? 'bg-electric/10 border-electric/30 text-electric' : 'border-white/10 text-clinical/40 hover:border-white/20'}`}
                        >
                            {CATEGORIA_LABELS[cat]} ({catCounts[cat]})
                        </button>
                    ) : null
                ))}
            </div>

            {/* ── Grid ─────────────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/3 border border-white/10 rounded-3xl p-16 text-center"
                >
                    <Building2 className="w-14 h-14 text-electric/20 mx-auto mb-4" />
                    <h3 className="font-syne text-xl font-bold text-white mb-2">Sin proveedores</h3>
                    <p className="text-clinical/40 text-sm max-w-xs mx-auto">
                        {search || catFilter !== 'all' ? 'Sin resultados para los filtros actuales.' : 'Agrega tu primer proveedor para comenzar.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(prov => {
                        const cat = (prov.categoria ?? 'otro') as ProveedorCategoria;
                        return (
                            <motion.div
                                key={prov.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white/3 border rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/5 transition-colors ${prov.activo === false ? 'opacity-50' : 'border-white/10'}`}
                            >
                                {/* Card header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-syne font-bold text-white text-sm truncate">{prov.nombre}</h3>
                                            <button
                                                type="button"
                                                title={prov.favorito ? 'Quitar favorito' : 'Marcar favorito'}
                                                onClick={() => toggleFavorito(prov.id)}
                                                className={`transition-colors ${prov.favorito ? 'text-premium' : 'text-clinical/20 hover:text-premium'}`}
                                            >
                                                <Star className="w-3.5 h-3.5" fill={prov.favorito ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                        {prov.razonSocial && prov.razonSocial !== prov.nombre && (
                                            <p className="text-[11px] text-clinical/35 truncate">{prov.razonSocial}</p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${CATEGORIA_COLORS[cat]}`}>
                                        {CATEGORIA_LABELS[cat]}
                                    </span>
                                </div>

                                {/* Contact info */}
                                <div className="space-y-1.5">
                                    {prov.nombreContacto && (
                                        <p className="text-xs text-clinical/50 flex items-center gap-1.5">
                                            <Tag className="w-3 h-3 flex-shrink-0" />
                                            {prov.nombreContacto}
                                            {prov.ciudad ? ` · ${prov.ciudad}` : ''}
                                        </p>
                                    )}
                                    {prov.telefonos && (
                                        <a
                                            href={`tel:${prov.telefonos}`}
                                            className="text-xs text-clinical/50 hover:text-electric flex items-center gap-1.5 transition-colors"
                                        >
                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                            {prov.telefonos}
                                        </a>
                                    )}
                                    {prov.email && (
                                        <a
                                            href={`mailto:${prov.email}`}
                                            className="text-xs text-clinical/50 hover:text-electric flex items-center gap-1.5 transition-colors truncate"
                                        >
                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                            {prov.email}
                                        </a>
                                    )}
                                    {(prov as Proveedor).web && (
                                        <a
                                            href={(prov as Proveedor).web}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-electric/60 hover:text-electric flex items-center gap-1.5 transition-colors truncate"
                                        >
                                            <Globe className="w-3 h-3 flex-shrink-0" />
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            Sitio web
                                        </a>
                                    )}
                                </div>

                                {/* Notes */}
                                {prov.comentario && (
                                    <p className="text-[11px] text-clinical/35 leading-relaxed line-clamp-2 border-t border-white/5 pt-2">
                                        {prov.comentario}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(prov)}
                                        className="flex items-center gap-1.5 text-xs text-clinical/40 hover:text-electric px-2 py-1 rounded-lg hover:bg-electric/10 transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" /> Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleActivo(prov.id)}
                                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${prov.activo === false ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-clinical/40 hover:text-amber-400 hover:bg-amber-500/10'}`}
                                    >
                                        {prov.activo === false ? 'Activar' : 'Desactivar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteId(prov.id)}
                                        className="ml-auto flex items-center gap-1.5 text-xs text-clinical/30 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ════ MODAL PROVEEDOR ════ */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-[#0d1b2a] border border-white/15 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h3 className="font-syne text-xl font-bold text-white">
                                    {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h3>
                                <button type="button" title="Cerrar" onClick={() => setModalOpen(false)}
                                    className="text-clinical/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

                                {/* Categoría */}
                                <div>
                                    <label className={labelCls}>Categoría</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(CATEGORIA_LABELS) as ProveedorCategoria[]).map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => field('categoria', cat)}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${form.categoria === cat ? 'bg-electric/10 border-electric/40 text-electric' : 'border-white/10 text-clinical/40 hover:border-white/20'}`}
                                            >
                                                {CATEGORIA_LABELS[cat]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Nombre + Razón social */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Nombre comercial *</label>
                                        <input required className={inputCls} value={form.nombre}
                                            onChange={e => field('nombre', e.target.value)} placeholder="Ej. DentSupply MX" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Razón social</label>
                                        <input className={inputCls} value={form.razonSocial}
                                            onChange={e => field('razonSocial', e.target.value)} placeholder="Nombre fiscal…" />
                                    </div>
                                </div>

                                {/* Contacto */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Nombre del contacto</label>
                                        <input className={inputCls} value={form.nombreContacto}
                                            onChange={e => field('nombreContacto', e.target.value)} placeholder="Persona de contacto…" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Ciudad</label>
                                        <input className={inputCls} value={form.ciudad}
                                            onChange={e => field('ciudad', e.target.value)} placeholder="Ciudad…" />
                                    </div>
                                </div>

                                {/* Teléfonos + Email */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Teléfono</label>
                                        <input className={inputCls} value={form.telefonos}
                                            onChange={e => field('telefonos', e.target.value)} placeholder="+52 984…" type="tel" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Correo electrónico</label>
                                        <input className={inputCls} value={form.email}
                                            onChange={e => field('email', e.target.value)} placeholder="ventas@proveedor.com" type="email" />
                                    </div>
                                </div>

                                {/* Web + Domicilio */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Sitio web</label>
                                        <input className={inputCls} value={form.web ?? ''}
                                            onChange={e => field('web', e.target.value)} placeholder="https://…" type="url" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Domicilio</label>
                                        <input className={inputCls} value={form.domicilio}
                                            onChange={e => field('domicilio', e.target.value)} placeholder="Calle, colonia…" />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className={labelCls}>Notas</label>
                                    <textarea className={`${inputCls} resize-none h-20`} value={form.comentario}
                                        onChange={e => field('comentario', e.target.value)}
                                        placeholder="Condiciones de pago, tiempo de entrega, productos principales…" />
                                </div>

                                {/* Favorito + Activo */}
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 text-sm text-clinical/60 cursor-pointer">
                                        <input type="checkbox" className="accent-yellow-400"
                                            checked={form.favorito ?? false}
                                            onChange={e => field('favorito', e.target.checked)} />
                                        Marcar como favorito
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-clinical/60 cursor-pointer">
                                        <input type="checkbox" className="accent-emerald-400"
                                            checked={form.activo !== false}
                                            onChange={e => field('activo', e.target.checked)} />
                                        Proveedor activo
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 rounded-2xl bg-electric text-cobalt font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Truck className="w-5 h-5" /> {editingId ? 'Actualizar Proveedor' : 'Agregar Proveedor'}</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════ DELETE CONFIRM ════ */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#0d1b2a] border border-red-500/20 rounded-3xl w-full max-w-sm p-6 shadow-2xl"
                        >
                            <h3 className="font-syne text-xl font-bold text-white mb-2">¿Eliminar proveedor?</h3>
                            <p className="text-sm text-clinical/50 mb-6">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setDeleteId(null)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-clinical/60 hover:bg-white/5 transition-colors font-bold">
                                    Cancelar
                                </button>
                                <button type="button" onClick={handleDelete}
                                    className="flex-1 py-3 rounded-2xl bg-red-500/80 text-white font-black hover:bg-red-500/90 transition-colors">
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
