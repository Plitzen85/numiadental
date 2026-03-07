import React, { useState } from 'react';
import { LayoutDashboard, Radar, Megaphone, Plane, Settings, LogOut, User as UserIcon, Landmark, FileBarChart, Calendar, Hospital, PackageSearch, Users } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { ModulePermissions } from '../../context/MarketContext';

interface SidebarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

const allNavItems: { id: string; label: string; icon: React.ElementType; path: string; module: keyof ModulePermissions }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', module: 'dashboard' },
    { id: 'radar', label: 'Radar Dental', icon: Radar, path: '/radar', module: 'radar' },
    { id: 'agenda', label: 'Agenda & CRM', icon: Calendar, path: '/agenda', module: 'agenda' },
    { id: 'clinica', label: 'Clínica', icon: Hospital, path: '/clinica', module: 'clinica' },
    { id: 'inventario', label: 'Inventario', icon: PackageSearch, path: '/inventory', module: 'inventario' },
    { id: 'campanas', label: 'Campañas', icon: Megaphone, path: '/campaigns', module: 'campanas' },
    { id: 'turismo', label: 'Turismo Dental', icon: Plane, path: '/tourism', module: 'turismo' },
    { id: 'finanzas', label: 'Finanzas', icon: Landmark, path: '/finanzas', module: 'finanzas' },
    { id: 'reportes', label: 'Informes', icon: FileBarChart, path: '/reportes', module: 'reportes' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
    const [showSettings, setShowSettings] = useState(false);
    const { hasPermission, clinicProfile, currentUserId, setCurrentUserId } = useMarket();

    const visibleItems = allNavItems.filter(item => hasPermission(item.module));
    const currentUser = clinicProfile?.staff?.find(s => s.id === currentUserId);

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/5 flex flex-col z-50">
            <div className="p-6">
                <h2 className="font-syne text-2xl font-bold bg-gradient-to-r from-electric to-premium text-transparent bg-clip-text">
                    NÜMIA
                </h2>
                <p className="text-clinical/50 text-xs tracking-widest mt-1 uppercase">Dental Wellness</p>
            </div>

            <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto">
                {visibleItems.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-electric/10 text-electric border border-electric/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                                : 'text-clinical/70 hover:bg-white/5 hover:text-clinical'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-sans font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Current user indicator */}
            {currentUser && (
                <div className="px-4 py-2 mx-4 mb-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-clinical/40 uppercase tracking-widest mb-1">Usuario activo</p>
                    <p className="text-xs text-clinical/80 font-medium truncate">{currentUser.nombres}</p>
                    <p className="text-[10px] text-clinical/40 capitalize">{currentUser.role ?? 'admin'}</p>
                </div>
            )}

            {/* Staff switcher (demo) */}
            {clinicProfile?.staff && clinicProfile.staff.length > 1 && (
                <div className="px-4 pb-2">
                    <select
                        title="Cambiar usuario activo"
                        value={currentUserId}
                        onChange={e => setCurrentUserId(e.target.value)}
                        aria-label="Cambiar usuario activo"
                        className="w-full text-xs bg-white/5 border border-white/10 text-clinical/70 rounded-lg px-2 py-1.5 focus:outline-none focus:border-electric/40"
                    >

                        {clinicProfile.staff.map(s => (
                            <option key={s.id} value={s.id} className="bg-slate-900">{s.nombres}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="p-4 border-t border-white/5 relative">
                {showSettings && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-cobalt rounded-xl border border-white/10 shadow-2xl z-50">
                        <button onClick={() => { onNavigate('/settings'); setShowSettings(false); }} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-clinical/70 hover:bg-white/5 hover:text-clinical rounded-lg transition-colors">
                            <UserIcon className="w-4 h-4" /> <span>Mi Clínica</span>
                        </button>
                        <button onClick={() => { onNavigate('/settings'); setShowSettings(false); }} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-clinical/70 hover:bg-white/5 hover:text-clinical rounded-lg transition-colors mt-1">
                            <Users className="w-4 h-4" /> <span>Equipo & Permisos</span>
                        </button>
                        <button onClick={() => alert("Cerrando sesión...")} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1">
                            <LogOut className="w-4 h-4" /> <span>Cerrar Sesión</span>
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${showSettings ? 'bg-white/10 text-clinical' : 'text-clinical/70 hover:bg-white/5'
                        }`}
                >
                    <Settings className={`w-5 h-5 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
                    <span className="font-sans font-medium">Configuración</span>
                </button>
            </div>
        </aside>
    );
};
