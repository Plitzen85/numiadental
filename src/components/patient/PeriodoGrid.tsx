import React from 'react';

export interface PeriodoData {
    probingDepth: { buccal: [number, number, number]; lingual: [number, number, number] };
    bleeding: { buccal: [boolean, boolean, boolean]; lingual: [boolean, boolean, boolean] };
    plaque: { buccal: [boolean, boolean, boolean]; lingual: [boolean, boolean, boolean] };
    furcation: 0 | 1 | 2 | 3;
    mobility: 0 | 1 | 2 | 3;
    absent: boolean;
}

export const defaultPeriodoData = (): PeriodoData => ({
    probingDepth: { buccal: [2, 2, 2], lingual: [2, 2, 2] },
    bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
    plaque: { buccal: [false, false, false], lingual: [false, false, false] },
    furcation: 0,
    mobility: 0,
    absent: false,
});

interface PeriodoGridProps {
    teethNumbers: number[];
    data: Record<number, PeriodoData>;
    onChange: (toothNum: number, updated: PeriodoData) => void;
}

const depthColor = (val: number) => {
    if (val >= 6) return 'bg-red-600 text-white';
    if (val >= 4) return 'bg-orange-500 text-white';
    if (val >= 3) return 'bg-yellow-400 text-black';
    return 'bg-transparent text-clinical/70';
};

const DepthInput: React.FC<{
    value: number;
    onChange: (v: number) => void;
}> = ({ value, onChange }) => (
    <input
        title="Profundidad de sondaje"
        type="number"
        min={0} max={12}
        value={value}
        onChange={e => onChange(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
        className={`w-7 h-7 text-center text-xs font-bold rounded border border-white/10 focus:outline-none focus:border-electric transition-colors ${depthColor(value)}`}
    />
);


const BoolDot: React.FC<{
    value: boolean;
    color: string;
    onChange: (v: boolean) => void;
}> = ({ value, color, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`w-4 h-4 rounded-full border-2 transition-all ${value ? `${color} border-transparent` : 'bg-transparent border-white/20 hover:border-white/50'}`}
        title={value ? 'Presente' : 'Ausente'}
    />
);

export const PeriodoGrid: React.FC<PeriodoGridProps> = ({ teethNumbers, data, onChange }) => {
    const update = (tNum: number, patch: Partial<PeriodoData>) => {
        onChange(tNum, { ...data[tNum], ...patch });
    };

    const updateDepth = (tNum: number, side: 'buccal' | 'lingual', idx: 0 | 1 | 2, val: number) => {
        const current = data[tNum].probingDepth[side];
        const updated: [number, number, number] = [...current] as [number, number, number];
        updated[idx] = val;
        onChange(tNum, { ...data[tNum], probingDepth: { ...data[tNum].probingDepth, [side]: updated } });
    };

    const updateBool = (tNum: number, field: 'bleeding' | 'plaque', side: 'buccal' | 'lingual', idx: 0 | 1 | 2, val: boolean) => {
        const current = data[tNum][field][side];
        const updated: [boolean, boolean, boolean] = [...current] as [boolean, boolean, boolean];
        updated[idx] = val;
        onChange(tNum, { ...data[tNum], [field]: { ...data[tNum][field], [side]: updated } });
    };

    return (
        <div className="overflow-x-auto">
            <table className="border-collapse text-[10px] min-w-max">
                <tbody>
                    {/* Tooth numbers */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase w-20">Diente</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="text-center px-1 py-1">
                                <span className="font-bold text-clinical/60">{n}</span>
                            </td>
                        ))}
                    </tr>

                    {/* Furcación */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Furc.</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="text-center px-1 py-0.5">
                                <select
                                    title="Furcación"
                                    value={data[n]?.furcation ?? 0}
                                    onChange={e => update(n, { furcation: parseInt(e.target.value) as 0 | 1 | 2 | 3 })}
                                    className="w-7 h-7 text-center text-[10px] bg-transparent border border-white/10 text-clinical/70 rounded focus:outline-none"
                                >
                                    {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </td>
                        ))}
                    </tr>

                    {/* Movilidad */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Movil.</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="text-center px-1 py-0.5">
                                <select
                                    title="Movilidad"
                                    value={data[n]?.mobility ?? 0}
                                    onChange={e => update(n, { mobility: parseInt(e.target.value) as 0 | 1 | 2 | 3 })}
                                    className="w-7 h-7 text-center text-[10px] bg-transparent border border-white/10 text-clinical/70 rounded focus:outline-none"
                                >
                                    {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </td>
                        ))}
                    </tr>

                    {/* Plaque Buccal */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Placa V</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-1 py-0.5">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <BoolDot key={i} value={data[n]?.plaque.buccal[i] ?? false} color="bg-yellow-400"
                                            onChange={v => updateBool(n, 'plaque', 'buccal', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* BOP Buccal */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Sangrado V</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-1 py-0.5">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <BoolDot key={i} value={data[n]?.bleeding.buccal[i] ?? false} color="bg-red-500"
                                            onChange={v => updateBool(n, 'bleeding', 'buccal', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Probing Depth Buccal */}
                    <tr className="bg-white/5">
                        <td className="text-electric text-right pr-2 py-1 font-bold text-[9px] uppercase">Sondaje V</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-0.5 py-1">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <DepthInput key={i} value={data[n]?.probingDepth.buccal[i] ?? 2}
                                            onChange={v => updateDepth(n, 'buccal', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Probing Depth Lingual */}
                    <tr className="bg-white/5">
                        <td className="text-premium text-right pr-2 py-1 font-bold text-[9px] uppercase">Sondaje L</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-0.5 py-1">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <DepthInput key={i} value={data[n]?.probingDepth.lingual[i] ?? 2}
                                            onChange={v => updateDepth(n, 'lingual', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* BOP Lingual */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Sangrado L</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-1 py-0.5">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <BoolDot key={i} value={data[n]?.bleeding.lingual[i] ?? false} color="bg-red-500"
                                            onChange={v => updateBool(n, 'bleeding', 'lingual', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Plaque Lingual */}
                    <tr>
                        <td className="text-clinical/40 text-right pr-2 py-1 font-bold text-[9px] uppercase">Placa L</td>
                        {teethNumbers.map(n => (
                            <td key={n} className="px-1 py-0.5">
                                <div className="flex gap-0.5 justify-center">
                                    {([0, 1, 2] as const).map(i => (
                                        <BoolDot key={i} value={data[n]?.plaque.lingual[i] ?? false} color="bg-yellow-400"
                                            onChange={v => updateBool(n, 'plaque', 'lingual', i, v)} />
                                    ))}
                                </div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
