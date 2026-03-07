import React from 'react';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center max-w-md mx-auto px-6">
                {/* Icon */}
                <div className="relative mx-auto w-32 h-32 mb-8">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-red-500/10 border border-red-500/30">
                        <ShieldOff className="w-14 h-14 text-red-400" />
                    </div>
                </div>

                {/* Code */}
                <p className="text-red-500 font-mono text-sm font-bold tracking-widest uppercase mb-3">
                    Error 403
                </p>

                {/* Title */}
                <h1 className="text-4xl font-syne font-bold text-white mb-4">
                    Acceso Restringido
                </h1>

                {/* Description */}
                <p className="text-slate-400 text-base leading-relaxed mb-10">
                    No tienes permiso para acceder a este módulo. Contacta al administrador de la clínica si crees que esto es un error.
                </p>

                {/* CTA */}
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all duration-300 hover:scale-105"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver al Dashboard
                </button>
            </div>
        </div>
    );
};
