import React from 'react';

// ─── Data Model ───────────────────────────────────────────────────────────────

export interface PeriodoData {
    probingDepth: { buccal: [number, number, number]; lingual: [number, number, number] };
    gingivalMargin: { buccal: [number, number, number]; lingual: [number, number, number] };
    bleeding: { buccal: boolean; lingual: boolean };
    furcation: 0 | 1 | 2 | 3;
    mobility: 0 | 1 | 2 | 3;
    absent: boolean;
    implant: boolean;
}

export const defaultPeriodoData = (): PeriodoData => ({
    probingDepth: { buccal: [2, 2, 2], lingual: [2, 2, 2] },
    gingivalMargin: { buccal: [0, 0, 0], lingual: [0, 0, 0] },
    bleeding: { buccal: false, lingual: false },
    furcation: 0, mobility: 0, absent: false, implant: false,
});

// ─── Layout constants ─────────────────────────────────────────────────────────
const TW = 36;       // px per tooth column

const CH = 110;      // px chart height
const CEJ = 32;      // Y of cemento-enamel junction
const MPX = 4;       // px per mm probing
// 3 site x-offsets within one tooth column
const SX = [TW * 0.2, TW * 0.5, TW * 0.8];

// ─── Tooth SVG path generator ─────────────────────────────────────────────────

function toothPaths(x: number, n: number): { crown: string; roots: string[] } {
    const ones = n % 10;
    const quad = Math.floor(n / 10);
    const cx = x + TW / 2;
    const isUpper = quad === 1 || quad === 2;
    const isMolar = ones >= 6;
    const isPrem = ones === 4 || ones === 5;
    const isCanine = ones === 3;

    const bw = isMolar ? 13 : isPrem ? 10 : isCanine ? 7 : ones === 1 ? 8 : 6;
    const tw2 = bw * 0.55; // top half-width

    const crown = `M ${cx - bw} ${CEJ} C ${cx - bw} ${CEJ - 14} ${cx - tw2} 3 ${cx} 2 C ${cx + tw2} 3 ${cx + bw} ${CEJ - 14} ${cx + bw} ${CEJ} Z`;

    const rH = CH - CEJ - 3; // root height
    const roots: string[] = [];

    if (isMolar && isUpper) {
        // 3 roots: MB, P, DB
        roots.push(`M ${cx - 12} ${CEJ} C ${cx - 13} ${CEJ + rH * 0.5} ${cx - 11} ${CEJ + rH * 0.8} ${cx - 9} ${CH - 3} C ${cx - 7} ${CEJ + rH * 0.8} ${cx - 5} ${CEJ + rH * 0.5} ${cx - 4} ${CEJ} Z`);
        roots.push(`M ${cx - 1} ${CEJ} C ${cx - 2} ${CEJ + rH * 0.55} ${cx - 1} ${CEJ + rH * 0.85} ${cx + 1} ${CH - 1} C ${cx + 3} ${CEJ + rH * 0.85} ${cx + 4} ${CEJ + rH * 0.55} ${cx + 3} ${CEJ} Z`);
        roots.push(`M ${cx + 6} ${CEJ} C ${cx + 5} ${CEJ + rH * 0.5} ${cx + 8} ${CEJ + rH * 0.82} ${cx + 10} ${CH - 4} C ${cx + 12} ${CEJ + rH * 0.82} ${cx + 13} ${CEJ + rH * 0.5} ${cx + 12} ${CEJ} Z`);
    } else if (isMolar && !isUpper) {
        // 2 roots: mesial, distal
        roots.push(`M ${cx - 9} ${CEJ} C ${cx - 10} ${CEJ + rH * 0.5} ${cx - 8} ${CEJ + rH * 0.82} ${cx - 5} ${CH - 3} C ${cx - 2} ${CEJ + rH * 0.82} ${cx - 1} ${CEJ + rH * 0.5} ${cx - 1} ${CEJ} Z`);
        roots.push(`M ${cx + 1} ${CEJ} C ${cx + 1} ${CEJ + rH * 0.5} ${cx + 3} ${CEJ + rH * 0.78} ${cx + 6} ${CH - 5} C ${cx + 9} ${CEJ + rH * 0.78} ${cx + 10} ${CEJ + rH * 0.5} ${cx + 9} ${CEJ} Z`);
    } else if (isPrem && isUpper) {
        // 2 roots (buccal + palatal)
        roots.push(`M ${cx - 7} ${CEJ} C ${cx - 8} ${CEJ + rH * 0.55} ${cx - 6} ${CEJ + rH * 0.82} ${cx - 4} ${CH - 5} C ${cx - 2} ${CEJ + rH * 0.82} ${cx - 1} ${CEJ + rH * 0.55} ${cx - 1} ${CEJ} Z`);
        roots.push(`M ${cx + 1} ${CEJ} C ${cx + 1} ${CEJ + rH * 0.5} ${cx + 3} ${CEJ + rH * 0.78} ${cx + 5} ${CH - 3} C ${cx + 7} ${CEJ + rH * 0.78} ${cx + 8} ${CEJ + rH * 0.5} ${cx + 7} ${CEJ} Z`);
    } else {
        // Single root
        const rw = bw * 0.6;
        roots.push(`M ${cx - rw} ${CEJ} C ${cx - rw} ${CEJ + rH * 0.65} ${cx - 2} ${CEJ + rH * 0.9} ${cx} ${CH - 2} C ${cx + 2} ${CEJ + rH * 0.9} ${cx + rw} ${CEJ + rH * 0.65} ${cx + rw} ${CEJ} Z`);
    }
    return { crown, roots };
}

// ─── SVG chart for one side (buccal or lingual) ───────────────────────────────

interface ChartProps {
    teeth: number[];
    data: Record<number, PeriodoData>;
    side: 'buccal' | 'lingual';
    label: string;
}

const ChartSection: React.FC<ChartProps> = ({ teeth, data, side, label }) => {
    const N = teeth.length;
    const W = N * TW;

    // Build measurement polyline points
    const gPts: [number, number][] = [];
    const dPts: [number, number][] = [];

    teeth.forEach((n, i) => {
        const d = data[n];
        if (!d || d.absent) return;
        SX.forEach((sx, j) => {
            const px = i * TW + sx;
            const margin = d.gingivalMargin[side][j] ?? 0;
            const depth = d.probingDepth[side][j] ?? 2;
            const gy = Math.max(2, Math.min(CH - 2, CEJ + margin * MPX));
            const dy = Math.max(gy, Math.min(CH - 2, gy + depth * MPX));
            gPts.push([px, gy]);
            dPts.push([px, dy]);
        });
    });

    const ptsToStr = (pts: [number, number][]) =>
        pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    const pocketPts = [...gPts, ...[...dPts].reverse()];

    return (
        <div className="flex items-stretch border-y border-white/10">
            {/* Label */}
            <div className="w-[80px] flex-shrink-0 flex items-center justify-end pr-2 bg-white/5 border-r border-white/10">
                <span className="text-[9px] font-bold text-electric/70 uppercase tracking-wider text-right">{label}</span>
            </div>

            {/* SVG chart */}
            <svg width={W} height={CH} className="block flex-shrink-0" role="img" aria-label={`Periodontograma ${label}`}>
                {/* Dark background */}
                <rect width={W} height={CH} fill="#0b1929" />

                {/* Horizontal mm scale lines */}
                {[2, 4, 6, 8, 10].map(mm => {
                    const y = CEJ + mm * MPX;
                    return y < CH - 2
                        ? <line key={mm} x1={0} y1={y} x2={W} y2={y}
                            stroke="rgba(100,160,220,0.18)" strokeWidth={0.5}
                            strokeDasharray={mm % 4 === 0 ? '3,2' : '1,3'} />
                        : null;
                })}

                {/* CEJ baseline */}
                <line x1={0} y1={CEJ} x2={W} y2={CEJ}
                    stroke="rgba(218,182,100,0.4)" strokeWidth={0.8} strokeDasharray="4,3" />

                {/* Tooth column separators */}
                {teeth.map((_, i) => (
                    <line key={i} x1={i * TW} y1={0} x2={i * TW} y2={CH}
                        stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                ))}

                {/* Tooth shapes */}
                {teeth.map((n, i) => {
                    const { crown, roots } = toothPaths(i * TW, n);
                    const isAbsent = data[n]?.absent;
                    const isImpl = data[n]?.implant;
                    return (
                        <g key={n} opacity={isAbsent ? 0.15 : 1}>
                            {roots.map((r, j) => (
                                <path key={j} d={r}
                                    fill={isImpl ? '#0e7490' : '#c8ae88'}
                                    stroke="#8b7355" strokeWidth={0.8} />
                            ))}
                            <path d={crown}
                                fill={isImpl ? '#155e75' : '#f0e6cc'}
                                stroke="#8b7355" strokeWidth={0.9} />
                            {isAbsent && <>
                                <line x1={i * TW + 3} y1={3} x2={(i + 1) * TW - 3} y2={CH - 3} stroke="#ef4444" strokeWidth={1.5} />
                                <line x1={(i + 1) * TW - 3} y1={3} x2={i * TW + 3} y2={CH - 3} stroke="#ef4444" strokeWidth={1.5} />
                            </>}
                        </g>
                    );
                })}

                {/* Pocket shaded area */}
                {pocketPts.length > 3 && (
                    <polygon
                        points={ptsToStr(pocketPts)}
                        fill="rgba(59,130,246,0.22)" />
                )}

                {/* Gingival margin line (ORANGE) */}
                {gPts.length > 2 && (
                    <polyline
                        points={ptsToStr(gPts)}
                        fill="none" stroke="#f97316" strokeWidth={2.2}
                        strokeLinejoin="round" strokeLinecap="round" />
                )}

                {/* Probing depth line (BLUE) */}
                {dPts.length > 2 && (
                    <polyline
                        points={ptsToStr(dPts)}
                        fill="none" stroke="#60a5fa" strokeWidth={2.2}
                        strokeLinejoin="round" strokeLinecap="round" />
                )}

                {/* Site dots */}
                {teeth.map((n, i) => {
                    const d = data[n];
                    if (!d || d.absent) return null;
                    return SX.map((sx, j) => {
                        const gy = Math.max(2, Math.min(CH - 2, CEJ + (d.gingivalMargin[side][j] ?? 0) * MPX));
                        const dy = Math.max(gy, Math.min(CH - 2, gy + (d.probingDepth[side][j] ?? 2) * MPX));
                        return (
                            <g key={`${n}-${j}`}>
                                <circle cx={i * TW + sx} cy={gy} r={2.5} fill="#f97316" />
                                <circle cx={i * TW + sx} cy={dy} r={2.5} fill="#60a5fa" />
                            </g>
                        );
                    });
                })}

                {/* Bleeding dots (top of chart) */}
                {teeth.map((n, i) => data[n]?.bleeding[side] && (
                    <circle key={`bl-${n}`} cx={i * TW + TW / 2} cy={7}
                        r={4.5} fill="#ef4444" opacity={0.9} />
                ))}

                {/* Mm scale labels on left edge */}
                {[2, 4, 6, 8].map(mm => {
                    const y = CEJ + mm * MPX;
                    return y < CH - 4
                        ? <text key={mm} x={2} y={y + 3} fontSize={6}
                            fill="rgba(150,200,255,0.5)" fontFamily="monospace">{mm}</text>
                        : null;
                })}
            </svg>
        </div>
    );
};

// ─── Compact inputs ───────────────────────────────────────────────────────────

const DepthInput: React.FC<{ v: number; onChange: (n: number) => void; hi?: boolean }> = ({ v, onChange, hi }) => {
    const cl = hi
        ? v >= 6 ? 'bg-red-600 text-white' : v >= 4 ? 'bg-orange-500 text-white' : v >= 3 ? 'bg-yellow-400 text-black' : 'bg-transparent text-clinical/70'
        : 'bg-transparent text-clinical/70';
    return (
        <input type="number" min={0} max={12} value={v} aria-label="Medición"
            onChange={e => onChange(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
            className={`w-[10px] h-[18px] text-center text-[9px] font-bold border-0 outline-none rounded-sm focus:ring-1 focus:ring-electric/50 p-0 ${cl}`}
        />
    );
};

const CheckDot: React.FC<{ v: boolean; color: string; onChange: (v: boolean) => void }> = ({ v, color, onChange }) => (
    <button onClick={() => onChange(!v)} title={v ? 'Presente' : 'Ausente'}
        className={`w-4 h-4 rounded border transition-all ${v ? `${color} border-transparent` : 'bg-transparent border-white/25 hover:border-white/50'}`}>
        {v && <span className="text-white text-[8px] font-bold flex items-center justify-center">✓</span>}
    </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface PeriodoGridProps {
    teethNumbers: number[];
    data: Record<number, PeriodoData>;
    onChange: (toothNum: number, updated: PeriodoData) => void;
}

export const PeriodoGrid: React.FC<PeriodoGridProps> = ({ teethNumbers, data, onChange }) => {
    const patch = (n: number, p: Partial<PeriodoData>) => onChange(n, { ...data[n], ...p });

    const setDepth = (n: number, side: 'buccal' | 'lingual', i: 0 | 1 | 2, v: number) => {
        const a = [...data[n].probingDepth[side]] as [number, number, number];
        a[i] = v;
        onChange(n, { ...data[n], probingDepth: { ...data[n].probingDepth, [side]: a } });
    };
    const setMargin = (n: number, side: 'buccal' | 'lingual', i: 0 | 1 | 2, v: number) => {
        const a = [...data[n].gingivalMargin[side]] as [number, number, number];
        a[i] = v;
        onChange(n, { ...data[n], gingivalMargin: { ...data[n].gingivalMargin, [side]: a } });
    };

    // Row builders
    const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="flex items-center py-0.5">
            <div className="w-[80px] flex-shrink-0 text-right pr-2 text-[9px] font-bold text-clinical/40 uppercase tracking-wide">{label}</div>
            <div className="flex flex-nowrap">{children}</div>
        </div>
    );

    const cell3 = (n: number, side: 'buccal' | 'lingual', field: 'probingDepth' | 'gingivalMargin', hi?: boolean) => (
        <div key={n} className="w-[36px] flex-shrink-0 flex justify-center items-center gap-px">
            {([0, 1, 2] as const).map(i => (
                <DepthInput key={i}
                    v={data[n]?.[field][side][i] ?? 0}
                    onChange={v => field === 'probingDepth' ? setDepth(n, side, i, v) : setMargin(n, side, i, v)}
                    hi={hi} />
            ))}
        </div>
    );

    const cell1Check = (n: number, field: 'absent' | 'implant' | 'buccal-bleed' | 'lingual-bleed') => {
        const val = field === 'absent' ? data[n]?.absent
            : field === 'implant' ? data[n]?.implant
                : field === 'buccal-bleed' ? data[n]?.bleeding.buccal
                    : data[n]?.bleeding.lingual;
        return (
            <div key={n} className="w-[36px] flex-shrink-0 flex justify-center items-center">
                <CheckDot
                    v={val ?? false}
                    color={field.includes('bleed') ? 'bg-red-500' : 'bg-cyan-500'}
                    onChange={v => {
                        if (field === 'absent') patch(n, { absent: v });
                        else if (field === 'implant') patch(n, { implant: v });
                        else if (field === 'buccal-bleed') patch(n, { bleeding: { ...data[n].bleeding, buccal: v } });
                        else patch(n, { bleeding: { ...data[n].bleeding, lingual: v } });
                    }}
                />
            </div>
        );
    };

    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-cobalt/50 text-clinical">

            {/* Single horizontal scroll */}
            <div className="overflow-x-auto">
                <div className="min-w-max">

                    {/* Tooth numbers header */}
                    <div className="flex items-center py-1 bg-white/5 border-b border-white/10">
                        <div className="w-[80px] flex-shrink-0" />
                        {teethNumbers.map(n => (
                            <div key={n} className="w-[36px] flex-shrink-0 text-center text-[9px] font-bold text-electric/70">{n}</div>
                        ))}
                    </div>

                    {/* ── Buccal (Vestibular) data rows ── */}
                    <div className="bg-blue-950/20 border-b border-white/5">
                        <Row label="Implante">{teethNumbers.map(n => cell1Check(n, 'implant'))}</Row>
                        <Row label="Ausente">{teethNumbers.map(n => cell1Check(n, 'absent'))}</Row>
                        <Row label="Sangrado">{teethNumbers.map(n => cell1Check(n, 'buccal-bleed'))}</Row>
                        <Row label="Marg. Ves.">{teethNumbers.map(n => cell3(n, 'buccal', 'gingivalMargin'))}</Row>
                        <Row label="Sond. Ves.">{teethNumbers.map(n => cell3(n, 'buccal', 'probingDepth', true))}</Row>
                    </div>

                    {/* ── Vestibular SVG chart ── */}
                    <ChartSection teeth={teethNumbers} data={data} side="buccal" label="Vestibular" />

                    {/* ── Palatino SVG chart ── */}
                    <ChartSection teeth={teethNumbers} data={data} side="lingual" label="Palatino" />

                    {/* ── Lingual (Palatino) data rows ── */}
                    <div className="bg-purple-950/20 border-t border-white/5">
                        <Row label="Sond. Pal.">{teethNumbers.map(n => cell3(n, 'lingual', 'probingDepth', true))}</Row>
                        <Row label="Marg. Pal.">{teethNumbers.map(n => cell3(n, 'lingual', 'gingivalMargin'))}</Row>
                        <Row label="Sangrado">{teethNumbers.map(n => cell1Check(n, 'lingual-bleed'))}</Row>
                    </div>

                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-5 items-center px-5 py-2 bg-white/5 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-0.5 bg-orange-400 rounded" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">Margen Gingival</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-0.5 bg-blue-400 rounded" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">Profundidad de Sondaje</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">Sangrado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-yellow-400" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">3mm</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-orange-500" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">4-5mm</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-red-600" />
                    <span className="text-[9px] text-clinical/50 uppercase font-bold">≥6mm</span>
                </div>
            </div>
        </div>
    );
};
