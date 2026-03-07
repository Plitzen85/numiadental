import React from 'react';

export type ToothSurface = 'mesial' | 'distal' | 'oclusal' | 'vestibular' | 'lingual';
export type ToothCondition = 'healthy' | 'caries' | 'resin' | 'amalgam' | 'crown' | 'extracted' | 'implant' | 'root_canal' | 'bridge' | 'veneer' | 'fracture';

export const CONDITION_COLORS: Record<ToothCondition, string> = {
    healthy: 'transparent',
    caries: '#ef4444',
    resin: '#3b82f6',
    amalgam: '#8b5cf6',
    crown: '#eab308',
    extracted: '#000000',
    implant: '#06b6d4',
    root_canal: '#f97316',
    bridge: '#a855f7',
    veneer: '#ec4899',
    fracture: '#6b7280',
};

export const CONDITION_LABELS: Record<ToothCondition, string> = {
    healthy: 'Sano',
    caries: 'Caries',
    resin: 'Resina',
    amalgam: 'Amalgama',
    crown: 'Corona',
    extracted: 'Extraído',
    implant: 'Implante',
    root_canal: 'Endodoncia',
    bridge: 'Puente',
    veneer: 'Carilla',
    fracture: 'Fractura',
};

export interface ToothSurfaceMap {
    mesial: ToothCondition;
    distal: ToothCondition;
    oclusal: ToothCondition;
    vestibular: ToothCondition;
    lingual: ToothCondition;
}

const defaultSurfaces = (): ToothSurfaceMap => ({
    mesial: 'healthy', distal: 'healthy', oclusal: 'healthy', vestibular: 'healthy', lingual: 'healthy'
});

interface ToothSVGProps {
    number: number;
    surfaces: ToothSurfaceMap;
    onSurfaceClick: (surface: ToothSurface) => void;
    isSelected?: boolean;
}

export const ToothSVG: React.FC<ToothSVGProps> = ({ number, surfaces, onSurfaceClick, isSelected }) => {

    const isExtracted = Object.values(surfaces).every(s => s === 'extracted');
    const isCrown = Object.values(surfaces).every(s => s === 'crown');

    const getFill = (surface: ToothSurface): string => {
        if (isExtracted) return 'transparent';
        if (isCrown) return CONDITION_COLORS.crown;
        return CONDITION_COLORS[surfaces[surface]];
    };

    const stroke = isSelected ? '#00d4ff' : '#374151';
    const strokeW = isSelected ? '2' : '1';

    return (
        <div className="flex flex-col items-center gap-0.5 group">
            <span className={`text-[9px] font-bold tabular-nums ${isSelected ? 'text-electric' : 'text-clinical/50'}`}>
                {number}
            </span>
            <div
                className={`relative w-9 h-9 cursor-pointer transition-transform duration-150 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}`}
                title={`Diente ${number}`}
            >
                <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm" style={{ filter: isSelected ? 'drop-shadow(0 0 4px #00d4ff)' : undefined }}>
                    {/* Vestibular (top) */}
                    <polygon
                        points="0,0 40,0 30,10 10,10"
                        fill={getFill('vestibular')} stroke={stroke} strokeWidth={strokeW}
                        className="hover:opacity-70 transition-opacity"
                        onClick={() => onSurfaceClick('vestibular')}
                    />
                    {/* Distal (right) */}
                    <polygon
                        points="40,0 40,40 30,30 30,10"
                        fill={getFill('distal')} stroke={stroke} strokeWidth={strokeW}
                        className="hover:opacity-70 transition-opacity"
                        onClick={() => onSurfaceClick('distal')}
                    />
                    {/* Lingual (bottom) */}
                    <polygon
                        points="40,40 0,40 10,30 30,30"
                        fill={getFill('lingual')} stroke={stroke} strokeWidth={strokeW}
                        className="hover:opacity-70 transition-opacity"
                        onClick={() => onSurfaceClick('lingual')}
                    />
                    {/* Mesial (left) */}
                    <polygon
                        points="0,40 0,0 10,10 10,30"
                        fill={getFill('mesial')} stroke={stroke} strokeWidth={strokeW}
                        className="hover:opacity-70 transition-opacity"
                        onClick={() => onSurfaceClick('mesial')}
                    />
                    {/* Oclusal/Incisal (center) */}
                    <rect
                        x="10" y="10" width="20" height="20"
                        fill={getFill('oclusal')} stroke={stroke} strokeWidth={strokeW}
                        className="hover:opacity-70 transition-opacity"
                        onClick={() => onSurfaceClick('oclusal')}
                    />
                    {/* White base for transparency */}
                    {!isExtracted && <rect x="0" y="0" width="40" height="40" fill="none" stroke={stroke} strokeWidth={strokeW} />}
                </svg>
                {/* Extracted X overlay */}
                {isExtracted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg viewBox="0 0 40 40" className="w-full h-full text-red-500">
                            <line x1="4" y1="4" x2="36" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            <line x1="36" y1="4" x2="4" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export { defaultSurfaces };
