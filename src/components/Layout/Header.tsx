import React, { useState } from 'react';
import { Bell, User as UserIcon, Search, AlertTriangle, TrendingUp, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../../context/MarketContext';

export const Header: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
    const { intelligence } = useMarket();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="h-20 w-full glass-panel border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="md:hidden text-clinical p-2 hover:bg-white/5 rounded-lg">
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:flex items-center bg-cobalt/50 border border-white/10 rounded-full px-4 py-2 w-96 backdrop-blur-md">
                    <Search className="w-5 h-5 text-clinical/50" />
                    <input title="Campo" type="text"
                        placeholder="Buscar clínicas, servicios o campañas..."
                        className="bg-transparent border-none focus:outline-none text-clinical ml-3 w-full placeholder:text-clinical/30"
                    />
                </div>

                <div className="flex items-center space-x-6">
                    {intelligence.alerts.length > 0 && (
                        <div className="flex items-center space-x-2 bg-premium/10 border border-premium/30 px-4 py-1.5 rounded-full text-premium text-sm font-medium animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-premium"></span>
                            <span>{intelligence.alerts.length} Alertas Activas</span>
                        </div>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                            className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-white/10 text-clinical' : 'text-clinical/70 hover:text-clinical hover:bg-white/5'}`}
                        >
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-2 w-2 h-2 bg-electric rounded-full shadow-[0_0_10px_#00D4FF]"></span>
                        </button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-cobalt rounded-xl border border-white/10 shadow-2xl p-4 z-50">
                                <h3 className="font-syne font-bold text-sm mb-3">Notificaciones de Mercado</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-3 text-sm">
                                        <div className="p-2 bg-premium/10 text-premium rounded-lg h-min"><AlertTriangle className="w-4 h-4" /></div>
                                        <div>
                                            <p className="font-bold">Nueva Clínica Detectada</p>
                                            <p className="text-xs text-clinical/60">"Dental Care" se registró a 2km de tu ubicación.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-sm">
                                        <div className="p-2 bg-electric/10 text-electric rounded-lg h-min"><TrendingUp className="w-4 h-4" /></div>
                                        <div>
                                            <p className="font-bold">Tendencia al Alza</p>
                                            <p className="text-xs text-clinical/60">Búsquedas de "Ortodoncia Invisible" subieron 15%.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <div
                            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-electric to-cobalt border-2 border-electric/30 flex items-center justify-center cursor-pointer shadow-lg shadow-electric/20 overflow-hidden"
                        >
                            <UserIcon className="w-5 h-5 text-clinical" />
                        </div>

                        {showProfile && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-cobalt rounded-xl border border-white/10 shadow-2xl p-2 z-50 border-r-electric/30 border-b-electric/30">
                                <div className="px-3 py-2 border-b border-white/5 mb-2">
                                    <p className="font-bold text-sm">Dr. Vázquez</p>
                                    <p className="text-xs text-clinical/50">Plan Pro</p>
                                </div>
                                <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="w-full text-left px-3 py-2 text-sm text-clinical/70 hover:bg-white/5 hover:text-clinical rounded-lg transition-colors">Ajustes Generales</button>
                                <button onClick={() => alert("Abriendo soporte...")} className="w-full text-left px-3 py-2 text-sm text-clinical/70 hover:bg-white/5 hover:text-clinical rounded-lg transition-colors">Soporte Técnico</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
