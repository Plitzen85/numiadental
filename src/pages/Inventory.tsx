import { useState } from 'react';
import { PackageSearch, AlertTriangle, Plus, Search, Filter, TrendingDown, Box, Syringe, Sparkles, AlertOctagon, FileDown, ScanText, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
type Category = 'Resinas' | 'Desechables' | 'Implantes' | 'Instrumental' | 'Anestesia';

interface InventoryItem {
    id: string;
    name: string;
    category: Category;
    stock: number;
    minStock: number;
    unit: string;
    lastRestock: string;
    cost: number;
}

const initialInventory: InventoryItem[] = [
    { id: 'INV-001', name: 'Resina Compuesta A2 (3M)', category: 'Resinas', stock: 12, minStock: 15, unit: 'jeringas', lastRestock: '2024-02-15', cost: 850 },
    { id: 'INV-002', name: 'Guantes de Nitrilo (M)', category: 'Desechables', stock: 4, minStock: 10, unit: 'cajas', lastRestock: '2024-02-20', cost: 180 },
    { id: 'INV-003', name: 'Implante Titanio 4.0x10mm', category: 'Implantes', stock: 8, minStock: 5, unit: 'unidades', lastRestock: '2024-01-10', cost: 2500 },
    { id: 'INV-004', name: 'Anestesia Mepivacaína 2%', category: 'Anestesia', stock: 45, minStock: 30, unit: 'cartuchos', lastRestock: '2024-02-05', cost: 450 },
    { id: 'INV-005', name: 'Resina Fluida A3', category: 'Resinas', stock: 2, minStock: 5, unit: 'jeringas', lastRestock: '2024-01-25', cost: 720 },
    { id: 'INV-006', name: 'Eyector de Saliva', category: 'Desechables', stock: 1500, minStock: 500, unit: 'unidades', lastRestock: '2024-02-01', cost: 2 },
];

export const Inventory = () => {
    const [items, setItems] = useState<InventoryItem[]>(initialInventory);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<Category | 'Todas'>('Todas');

    // Add Article State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isAISuccess, setIsAISuccess] = useState(false);

    const emptyForm = {
        name: '', category: 'Resinas' as Category, stock: 0, minStock: 5, unit: 'unidades', cost: 0
    };
    const [formData, setFormData] = useState(emptyForm);

    const handleExport = () => {
        // Mock CSV Export
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Nombre,Categoria,Stock,Unidad,Costo\n"
            + items.map(e => `${e.id},${e.name},${e.category},${e.stock},${e.unit},${e.cost}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventario_numia.csv");
        document.body.appendChild(link);
        link.click();
    };

    const handleAIScan = () => {
        setIsAILoading(true);
        // Simulate reading PDF/Image invoice
        setTimeout(() => {
            setIsAILoading(false);
            setIsAISuccess(true);
            setFormData({
                name: 'Cartucho Alta Velocidad Kavo',
                category: 'Instrumental',
                stock: 3,
                minStock: 2,
                unit: 'piezas',
                cost: 2150
            });
            setTimeout(() => setIsAISuccess(false), 3000);
        }, 2000);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: InventoryItem = {
            id: `INV-00${items.length + 1}`,
            name: formData.name,
            category: formData.category,
            stock: Number(formData.stock),
            minStock: Number(formData.minStock),
            unit: formData.unit,
            lastRestock: new Date().toISOString().split('T')[0],
            cost: Number(formData.cost)
        };
        setItems([...items, newItem]);
        setIsAddModalOpen(false);
        setFormData(emptyForm);
    };

    const lowStockItems = items.filter(i => i.stock <= i.minStock);
    const totalValue = items.reduce((sum, item) => sum + (item.stock * item.cost), 0);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-cobalt p-8 overflow-y-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-syne text-4xl text-white font-bold tracking-tight mb-2">Inventario</h1>
                    <p className="text-clinical/60 font-sans">Control de almacén, insumos médicos y órdenes de compra de la clínica.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">
                        <FileDown className="w-5 h-5 text-emerald-400" /> Exportar Reporte
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-electric text-cobalt hover:bg-electric/90 shadow-[0_0_15px_rgba(0,212,255,0.3)] rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" /> Nuevo Artículo
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <PackageSearch className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-electric/20 rounded-lg"><Box className="w-5 h-5 text-electric" /></div>
                        <h3 className="text-sm font-bold text-clinical/60 uppercase tracking-widest">Total Artículos</h3>
                    </div>
                    <p className="font-syne text-4xl font-bold text-white">{items.length}</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingDown className="w-24 h-24 text-japandi-wood" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-japandi-wood/20 rounded-lg"><TrendingDown className="w-5 h-5 text-japandi-wood" /></div>
                        <h3 className="text-sm font-bold text-clinical/60 uppercase tracking-widest">Activos Totales</h3>
                    </div>
                    <p className="font-syne text-4xl font-bold text-white">${totalValue.toLocaleString()} <span className="text-sm text-clinical/50">MXN</span></p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group col-span-1 md:col-span-2 bg-gradient-to-r from-red-500/10 to-transparent border-red-500/30">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertOctagon className="w-24 h-24 text-red-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Alertas de Bajo Stock</h3>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <p className="font-syne text-4xl font-bold text-white">{lowStockItems.length}</p>
                        <p className="text-sm text-clinical/70">artículos requieren reabastecimiento urgente.</p>
                    </div>
                </div>
            </div>

            {/* AI Optimization Banner */}
            <div className="glass-panel p-4 rounded-xl mb-8 bg-gradient-to-r from-premium/10 via-transparent flex items-center justify-between border-premium/30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-premium/20 flex items-center justify-center border border-premium/40">
                        <Sparkles className="w-5 h-5 text-premium" />
                    </div>
                    <div>
                        <h4 className="font-syne font-bold text-white text-sm">NÜMIA AI Logistics</h4>
                        <p className="text-xs text-clinical/70">Basado en el historial de citas (Agenda), se proyecta falta de "Resinas" para la próxima semana.</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-premium text-cobalt text-xs font-bold rounded-lg shadow-lg hover:bg-premium/90 hidden sm:block">
                    Generar Órden de Compra Automática
                </button>
            </div>

            {/* Main Table Area */}
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Search & Filters */}
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5">
                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 text-clinical/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            title="Buscar inventario"
                            type="text"
                            placeholder="Buscar por código o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-clinical/40 focus:border-electric outline-none transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Filter className="w-5 h-5 text-clinical/40" />
                        <select
                            title="Filtrar categoría"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="w-full md:w-48 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none appearance-none cursor-pointer"
                        >
                            <option value="Todas">Todas las Categorías</option>
                            <option value="Resinas">Resinas / Composites</option>
                            <option value="Desechables">Desechables</option>
                            <option value="Implantes">Implantes / Hueso</option>
                            <option value="Instrumental">Instrumental</option>
                            <option value="Anestesia">Anestesia</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-clinical/50 bg-black/40 uppercase font-sans tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 font-medium">Código</th>
                                <th className="px-6 py-4 font-medium">Artículo</th>
                                <th className="px-6 py-4 font-medium">Categoría</th>
                                <th className="px-6 py-4 font-medium">Stock Actual</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Último Abastecimiento</th>
                                <th className="px-6 py-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans">
                            {filteredItems.map((item, idx) => {
                                const isLowStock = item.stock <= item.minStock;
                                return (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id}
                                        className="hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-electric bg-electric/10 px-2 py-1 rounded">{item.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs text-clinical/70">
                                                {item.category === 'Desechables' && <Box className="w-3 h-3" />}
                                                {item.category === 'Anestesia' && <Syringe className="w-3 h-3" />}
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-lg font-bold ${isLowStock ? 'text-red-400' : 'text-white'}`}>{item.stock}</span>
                                                <span className="text-[10px] text-clinical/50 uppercase">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-500 border border-red-500/30">
                                                    <AlertTriangle className="w-3 h-3" /> Bajo Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Saludable
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-clinical/60">{item.lastRestock}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-xs text-electric hover:text-white transition-colors font-bold underline decoration-electric/30 underline-offset-4">
                                                Ajustar
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredItems.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Box className="w-12 h-12 text-clinical/20 mb-4" />
                            <p className="text-clinical/60 text-sm">No se encontraron artículos que coincidan con los filtros.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* ADD ITEM MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-cobalt/95 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-cobalt border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
                            <h2 className="font-syne text-2xl font-bold text-white flex items-center gap-3">
                                <PackageSearch className="text-electric" /> Ingresar Inventario
                            </h2>
                            <button title="Cerrar modal" aria-label="Cerrar modal" onClick={() => setIsAddModalOpen(false)} className="text-clinical/60 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* AI INVOICE SCANNER */}
                            <div className="mb-8 p-6 rounded-2xl border border-electric/30 bg-electric/5 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ScanText className="w-32 h-32 text-electric" />
                                </div>
                                <h3 className="font-syne font-bold text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-electric" /> Ingreso Rápido con NÜMIA AI
                                </h3>
                                <p className="text-sm text-clinical/80 mb-4 max-w-md">
                                    Sube tu factura de compra comercial (PDF o Foto) y dejaremos que la IA identifique códigos, cantidades y calcule automáticamente el precio unitario base.
                                </p>

                                {isAISuccess ? (
                                    <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-xl text-emerald-400 font-bold flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5" /> Factura procesada. Formularios autocompletados con éxito.
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleAIScan}
                                        disabled={isAILoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-electric/20 text-electric border border-electric/40 hover:bg-electric/30 rounded-xl font-bold transition-all"
                                    >
                                        {isAILoading ? (
                                            <><span className="w-4 h-4 border-2 border-electric/30 border-t-electric rounded-full animate-spin"></span> Procesando Factura...</>
                                        ) : (
                                            <><ScanText className="w-5 h-5" /> Leer Factura (IA)</>
                                        )}
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="text-xs text-clinical/60 mb-1 block">Nombre del Artículo</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-electric outline-none" placeholder="Ej. Resina P60 3M" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-clinical/60 mb-1 block">Categoría</label>
                                        <select title="Categoría" aria-label="Categoría" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as Category })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-electric outline-none appearance-none cursor-pointer">
                                            <option value="Resinas">Resinas</option>
                                            <option value="Desechables">Desechables</option>
                                            <option value="Implantes">Implantes</option>
                                            <option value="Instrumental">Instrumental</option>
                                            <option value="Anestesia">Anestesia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-clinical/60 mb-1 block">Unidad de Medida</label>
                                        <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-electric outline-none" placeholder="Ej. cajas, piezas..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-clinical/60 mb-1 block">Stock Base</label>
                                        <input title="Stock Base" aria-label="Stock Base" placeholder="0" required type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-electric outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-clinical/60 mb-1 block">Stock Mínimo (Alerta)</label>
                                        <input title="Stock Mínimo" aria-label="Stock Mínimo" placeholder="0" required type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-red-400 focus:border-electric outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-clinical/60 mb-1 block">Costo Unitario (MXN)</label>
                                        <input title="Costo Unitario" aria-label="Costo Unitario" placeholder="0" required type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-japanese-sand font-bold focus:border-electric outline-none" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-electric text-cobalt font-bold rounded-xl mt-6 hover:opacity-90 transition-opacity">
                                    Guardar en Inventario
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
