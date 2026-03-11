import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, FileText, CheckCircle2, Activity, Stethoscope, Save, MessageSquare, X } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { ToothSVG, ToothSurface, ToothCondition, ToothSurfaceMap, CONDITION_LABELS, defaultSurfaces } from './ToothSVG';
import { PeriodoGrid, PeriodoData, defaultPeriodoData } from './PeriodoGrid';
import { loadPatientRecord, savePatientRecord, OdontogramSnapshot } from '../../lib/supabase';

// ─── Tooth layout ─────────────────────────────────────────────────────────────
const UPPER_ADULT = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ADULT = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// ─── Treatment catalog defaults ───────────────────────────────────────────────
export const DEFAULT_TREATMENT_PRICES: Record<ToothCondition, { name: string; price: number }> = {
    healthy: { name: 'Limpieza / Revisión', price: 0 },
    caries: { name: 'Tratamiento de Caries', price: 850 },
    resin: { name: 'Resina Compuesta', price: 1200 },
    amalgam: { name: 'Amalgama', price: 750 },
    crown: { name: 'Corona de Porcelana', price: 3500 },
    extracted: { name: 'Extracción Simple', price: 1500 },
    implant: { name: 'Implante Dental', price: 18000 },
    root_canal: { name: 'Endodoncia', price: 4500 },
    bridge: { name: 'Puente', price: 9000 },
    veneer: { name: 'Carilla', price: 5000 },
    fracture: { name: 'Restauración/Fractura', price: 1800 },
};

// ─── Condition color class maps (replaces inline hex styles) ──────────────────
const CONDITION_ITEM_STYLE: Record<ToothCondition, string> = {
    healthy: 'bg-white/20 text-blue-400',
    caries: 'bg-red-500/20 text-red-400',
    resin: 'bg-blue-500/20 text-blue-400',
    amalgam: 'bg-purple-500/20 text-purple-400',
    crown: 'bg-yellow-500/20 text-yellow-400',
    extracted: 'bg-gray-600/20 text-gray-300',
    implant: 'bg-cyan-500/20 text-cyan-400',
    root_canal: 'bg-orange-500/20 text-orange-400',
    bridge: 'bg-purple-400/20 text-purple-300',
    veneer: 'bg-pink-500/20 text-pink-400',
    fracture: 'bg-gray-500/20 text-gray-400',
};

// ─── Condition toolbar definition ─────────────────────────────────────────────
const TOOLBAR: { condition: ToothCondition; dotClass: string; activeClass: string }[] = [
    { condition: 'healthy', dotClass: 'bg-white', activeClass: 'bg-white text-black' },
    { condition: 'caries', dotClass: 'bg-red-500', activeClass: 'bg-red-500/20 text-red-400 border border-red-500/40' },
    { condition: 'resin', dotClass: 'bg-blue-500', activeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/40' },
    { condition: 'amalgam', dotClass: 'bg-purple-500', activeClass: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
    { condition: 'crown', dotClass: 'bg-yellow-500', activeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
    { condition: 'extracted', dotClass: 'bg-gray-500', activeClass: 'bg-white/20 text-white border border-white/40' },
    { condition: 'implant', dotClass: 'bg-cyan-500', activeClass: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
    { condition: 'root_canal', dotClass: 'bg-orange-500', activeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/40' },
    { condition: 'veneer', dotClass: 'bg-pink-500', activeClass: 'bg-pink-500/20 text-pink-400 border border-pink-500/40' },
    { condition: 'fracture', dotClass: 'bg-gray-500', activeClass: 'bg-gray-500/20 text-gray-400 border border-gray-500/40' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppliedTreatment {
    id: string;
    toothNumber: number;
    surface: ToothSurface;
    condition: ToothCondition;
    price: number;
    name: string;
}

type ChartMode = 'odontogram' | 'periodonto';

// ─── Component ───────────────────────────────────────────────────────────────
export const HybridChart: React.FC<{ patientId?: string }> = ({ patientId }) => {
    const { clinicProfile, currentUserId } = useMarket();
    const currentStaff = clinicProfile?.staff?.find(s => s.id === currentUserId);
    const ic = clinicProfile?.identidadCorporativa;
    const [chartMode, setChartMode] = useState<ChartMode>('odontogram');

    // Merge clinic's custom prices on top of defaults
    const treatmentPrices: Record<ToothCondition, { name: string; price: number }> = {
        ...DEFAULT_TREATMENT_PRICES,
        ...(clinicProfile?.odontogramPrices as Record<ToothCondition, { name: string; price: number }> | undefined),
    };

    // Odontogram state
    const allTeeth = [...UPPER_ADULT, ...LOWER_ADULT];
    const [surfaces, setSurfaces] = useState<Record<number, ToothSurfaceMap>>(
        Object.fromEntries(allTeeth.map(n => [n, defaultSurfaces()]))
    );
    const [activeTool, setActiveTool] = useState<ToothCondition>('caries');
    const [treatments, setTreatments] = useState<AppliedTreatment[]>([]);
    const [discountActive, setDiscountActive] = useState(false);

    // Periodontal state
    const [periodoData, setPeriodoData] = useState<Record<number, PeriodoData>>(
        Object.fromEntries(allTeeth.map(n => [n, defaultPeriodoData()]))
    );

    // Per-tooth clinical notes
    const [toothNotes, setToothNotes] = useState<Record<number, string>>({});
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    // Odontogram history (approved snapshots)
    const [odontogramHistory, setOdontogramHistory] = useState<OdontogramSnapshot[]>([]);

    // ── Persist state ────────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load chart data on mount
    useEffect(() => {
        if (!patientId) return;
        loadPatientRecord(patientId).then(record => {
            if (record.chartData) {
                setSurfaces(record.chartData.surfaces as unknown as Record<number, ToothSurfaceMap>);
                setTreatments(record.chartData.treatments as unknown as AppliedTreatment[]);
                setPeriodoData(record.chartData.periodoData as unknown as Record<number, PeriodoData>);
                const cd = record.chartData as unknown as { toothNotes?: Record<number, string> };
                if (cd.toothNotes) setToothNotes(cd.toothNotes);
            }
            if (record.odontogramHistory) setOdontogramHistory(record.odontogramHistory);
        });
    }, [patientId]);

    // Debounced auto-save whenever chart state changes
    useEffect(() => {
        if (!patientId) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            setIsSaving(true);
            await savePatientRecord(patientId, {
                chartData: { surfaces, treatments, periodoData, toothNotes } as unknown as { surfaces: Record<number, unknown>; treatments: { id: string; toothNumber: number; surface: string; condition: string; price: number; name: string }[]; periodoData: Record<number, unknown> },
            });
            setIsSaving(false);
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2000);
        }, 1500);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [patientId, surfaces, treatments, periodoData, toothNotes]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleSurfaceClick = (toothNum: number, surface: ToothSurface) => {
        const newCondition = activeTool;
        setSurfaces(prev => ({
            ...prev,
            [toothNum]: { ...prev[toothNum], [surface]: newCondition }
        }));

        setTreatments(prev => {
            const id = `${toothNum}-${surface}`;
            const without = prev.filter(t => t.id !== id);
            if (newCondition === 'healthy') return without;
            return [...without, {
                id,
                toothNumber: toothNum,
                surface,
                condition: newCondition,
                price: treatmentPrices[newCondition].price,
                name: treatmentPrices[newCondition].name,
            }];
        });
    };

    const reset = () => {
        if (!window.confirm('¿Está seguro de limpiar todo el odontograma?')) return;
        setSurfaces(Object.fromEntries(allTeeth.map(n => [n, defaultSurfaces()])));
        setTreatments([]);
        setPeriodoData(Object.fromEntries(allTeeth.map(n => [n, defaultPeriodoData()])));
        setToothNotes({});
        setSelectedTooth(null);
    };

    // ── Approve: push treatments to TreatmentPlan ────────────────────────────
    const [isApproving, setIsApproving] = useState(false);
    const [approvedOk, setApprovedOk] = useState(false);

    const handleApprove = async () => {
        if (!patientId || treatments.length === 0) return;
        if (!window.confirm(`¿Aprobar ${treatments.length} tratamiento(s) y añadirlos al plan?\n\nSe generará un PDF de historial y el odontograma/periodontograma se limpiará para la siguiente consulta.`)) return;
        setIsApproving(true);

        const nowIso = new Date().toISOString();
        const today = nowIso.split('T')[0];

        // Save snapshot to history BEFORE clearing
        const snapshot: OdontogramSnapshot = {
            id: `snap-${Date.now()}`,
            createdAt: nowIso,
            doctorId: currentUserId,
            doctorName: currentStaff?.nombres ?? '',
            surfaces: surfaces as unknown as Record<number, unknown>,
            periodoData: periodoData as unknown as Record<number, unknown>,
            toothNotes,
            treatments: treatments as unknown as OdontogramSnapshot['treatments'],
            discountActive,
            total,
        };
        const updatedHistory = [...odontogramHistory, snapshot];
        setOdontogramHistory(updatedHistory);

        // Generate history snapshot PDF BEFORE clearing
        generateHistoryPDF();

        const record = await loadPatientRecord(patientId);
        const newItems = treatments.map(t => ({
            id: `odo-${t.id}-${Date.now()}`,
            name: t.name,
            toothNumber: t.toothNumber,
            surface: t.surface,
            phase: 1,
            status: 'pending' as const,
            price: t.price,
            discount: discountActive ? 10 : 0,
            estimatedDate: today,
            createdAt: nowIso,
            doctorId: currentUserId,
            doctorName: currentStaff?.nombres ?? '',
            notes: t.toothNumber && toothNotes[t.toothNumber] ? toothNotes[t.toothNumber] : '',
        }));
        const existingItems = record.treatmentPlan?.items ?? [];
        await savePatientRecord(patientId, {
            treatmentPlan: {
                items: [...existingItems, ...newItems],
                notes: record.treatmentPlan?.notes ?? '',
                updatedAt: nowIso,
            },
            odontogramHistory: updatedHistory,
        });
        // Clear entire chart for new consultation
        setSurfaces(Object.fromEntries(allTeeth.map(n => [n, defaultSurfaces()])));
        setPeriodoData(Object.fromEntries(allTeeth.map(n => [n, defaultPeriodoData()])));
        setTreatments([]);
        setToothNotes({});
        setSelectedTooth(null);
        setDiscountActive(false);
        setIsApproving(false);
        setApprovedOk(true);
        setTimeout(() => setApprovedOk(false), 3000);
    };

    // ── PDF: generate VIP-style print window ─────────────────────────────────
    // ── Shared PDF header builder (identidadCorporativa) ────────────────────
    const buildClinicHeader = (today: string) => {
        const clinicName = clinicProfile?.nombre ?? 'Nümia Dental';
        const primary = ic?.colorPrimario ?? '#1e40af';
        const logoHtml = ic?.logo
            ? `<img src="${ic.logo}" alt="Logo" style="height:56px;object-fit:contain;margin-bottom:4px" />`
            : `<div style="font-size:26px;font-weight:900;color:${primary};letter-spacing:-0.5px">${clinicName}</div>`;
        const doctorLine = currentStaff
            ? `<div>Dr. ${currentStaff.nombres}${currentStaff.cedProfesional ? ` · Céd. ${currentStaff.cedProfesional}` : ''}</div>`
            : '';
        const phone = ic?.telefonoDocumentos || clinicProfile?.telefono || '';
        const email = ic?.emailDocumentos || clinicProfile?.email || '';
        const address = ic?.direccionDocumentos || clinicProfile?.direccion || '';
        const slogan = ic?.slogan ?? '';
        return { clinicName, primary, logoHtml, doctorLine, phone, email, address, slogan,
            footer: ic?.pieDePagina ?? `${clinicName} · Plan generado el ${today}`,
        };
    };

    const handlePDF = () => {
        if (treatments.length === 0) return;
        const patient = clinicProfile?.patients?.find(p => p.id === patientId);
        const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        const { clinicName, primary, logoHtml, doctorLine, phone, email, address, slogan, footer } = buildClinicHeader(today);

        const rows = treatments.map(t => {
            const noteHtml = t.toothNumber && toothNotes[t.toothNumber]
                ? `<div style="font-size:10px;color:#64748b;margin-top:2px;font-style:italic">${toothNotes[t.toothNumber]}</div>` : '';
            return `<tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
                    <div style="font-weight:600;color:#1e293b">${t.name}</div>${noteHtml}
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;text-align:center">Diente ${t.toothNumber} · ${t.surface}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;color:${primary}">$${t.price.toLocaleString('es-MX')}</td>
            </tr>`;
        }).join('');

        const discountRow = discountActive ? `<tr>
            <td colspan="2" style="padding:8px 12px;color:${primary};font-weight:600">Descuento Comercial (10%)</td>
            <td style="padding:8px 12px;text-align:right;color:${primary};font-weight:700">−$${discountAmt.toLocaleString('es-MX')}</td>
        </tr>` : '';

        // ── Perio evaluation ─────────────────────────────────────────────────
        let deepSites = 0, bleedingTeeth = 0, totalDepth = 0, totalSites = 0, maxGlobalDepth = 0;
        const periAffected: Array<{ tooth: number; maxDepth: number; bleeding: boolean }> = [];
        allTeeth.forEach(n => {
            const pd = periodoData[n] as any;
            if (!pd || pd.absent) return;
            const depths = [...(pd.probingDepth?.buccal ?? []), ...(pd.probingDepth?.lingual ?? [])];
            const max = depths.length ? Math.max(...depths) : 0;
            const bleed = pd.bleeding?.buccal || pd.bleeding?.lingual;
            depths.forEach(v => { totalDepth += v; totalSites++; if (v >= 4) deepSites++; });
            if (max > maxGlobalDepth) maxGlobalDepth = max;
            if (bleed) bleedingTeeth++;
            if (max >= 4 || bleed) periAffected.push({ tooth: n, maxDepth: max, bleeding: bleed });
        });
        const avgDepth = totalSites > 0 ? (totalDepth / totalSites).toFixed(1) : '0.0';

        // Clinical interpretation
        let periInterpretation = '';
        let periColor = '#22c55e';
        if (maxGlobalDepth === 0 && bleedingTeeth === 0) {
            periInterpretation = 'Sin datos periodontales registrados.';
            periColor = '#94a3b8';
        } else if (maxGlobalDepth <= 3 && bleedingTeeth === 0) {
            periInterpretation = 'Periodonto dentro de parámetros normales. Sin signos de enfermedad periodontal activa.';
            periColor = '#22c55e';
        } else if (maxGlobalDepth <= 3 && bleedingTeeth > 0) {
            periInterpretation = `Gingivitis leve — sangrado presente en ${bleedingTeeth} diente${bleedingTeeth > 1 ? 's' : ''}. Profundidades dentro de rango normal. Se recomienda refuerzo de higiene oral.`;
            periColor = '#f59e0b';
        } else if (maxGlobalDepth <= 5) {
            periInterpretation = `Periodontitis estadio inicial — bolsas de 4–5 mm detectadas en ${deepSites} sitio${deepSites > 1 ? 's' : ''}. Se recomienda raspado y alisado radicular.`;
            periColor = '#f97316';
        } else {
            periInterpretation = `Periodontitis estadio avanzado — profundidades de sondeo ≥ 6 mm. Requiere evaluación periodontal especializada y tratamiento inmediato.`;
            periColor = '#ef4444';
        }

        const periAffectedRows = periAffected.map(({ tooth, maxDepth, bleeding }) => `
            <tr>
                <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:700;font-size:12px">${tooth}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;color:${maxDepth >= 6 ? '#ef4444' : maxDepth >= 4 ? '#f97316' : '#1e293b'};font-weight:${maxDepth >= 4 ? '700' : '400'}">${maxDepth} mm</td>
                <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;color:${bleeding ? '#ef4444' : '#94a3b8'}">${bleeding ? '● Sí' : '○ No'}</td>
            </tr>`).join('');

        const periSection = `
        <div style="margin-top:28px;page-break-inside:avoid">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${primary};margin-bottom:10px;padding-bottom:4px;border-bottom:2px solid ${primary}">Evaluación Periodontal</div>
            <div style="display:flex;gap:12px;margin-bottom:14px">
                <div style="flex:1;background:#f8fafc;border-radius:10px;padding:10px 14px;text-align:center">
                    <div style="font-size:22px;font-weight:900;color:${primary}">${avgDepth}</div>
                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-top:2px">Prom. sondaje (mm)</div>
                </div>
                <div style="flex:1;background:#fff5f5;border-radius:10px;padding:10px 14px;text-align:center">
                    <div style="font-size:22px;font-weight:900;color:#ef4444">${deepSites}</div>
                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-top:2px">Sitios ≥ 4 mm</div>
                </div>
                <div style="flex:1;background:#fff8f0;border-radius:10px;padding:10px 14px;text-align:center">
                    <div style="font-size:22px;font-weight:900;color:#f97316">${bleedingTeeth}</div>
                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-top:2px">Dientes c/ sangrado</div>
                </div>
            </div>
            ${periAffected.length > 0 ? `
            <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:12px">
                <thead><tr style="background:${primary};color:#fff">
                    <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Diente</th>
                    <th style="padding:7px 10px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Prof. sondeo máx.</th>
                    <th style="padding:7px 10px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Sangrado</th>
                </tr></thead>
                <tbody>${periAffectedRows}</tbody>
            </table>` : ''}
            <div style="background:${periColor}15;border-left:4px solid ${periColor};border-radius:4px;padding:10px 14px;font-size:11px;color:#1e293b;line-height:1.6">
                <span style="font-weight:700;color:${periColor}">Interpretación: </span>${periInterpretation}
            </div>
        </div>`;

        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>Presupuesto — ${clinicName}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:36px}
            .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid ${primary}}
            .clinic-sub{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:3px}
            .clinic-contact{text-align:right;font-size:11px;color:#64748b;line-height:1.9}
            .badge{display:inline-block;background:#eff6ff;color:${primary};font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;padding:4px 10px;border-radius:20px;border:1px solid #bfdbfe;margin-bottom:6px}
            .patient-box{background:#f8fafc;border-radius:12px;padding:18px 20px;margin-bottom:28px;display:flex;justify-content:space-between;gap:12px}
            .patient-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:2px}
            .patient-val{font-size:14px;font-weight:700;color:#1e293b}
            table{width:100%;border-collapse:collapse;margin-bottom:8px}
            thead tr{background:${primary};color:#fff}
            thead th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
            thead th:last-child{text-align:right}
            .totals{background:#f0f7ff;border-radius:10px;padding:14px 20px;margin-top:20px;text-align:right}
            .total-line{font-size:12px;color:#475569;margin-bottom:4px}
            .total-main{font-size:24px;font-weight:900;color:${primary};margin-top:6px}
            .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;line-height:2}
            @media print{body{padding:20px}button{display:none}}
        </style></head><body>
        <div style="text-align:right;margin-bottom:16px"><button onclick="window.print()" style="background:${primary};color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">Imprimir / Guardar PDF</button></div>
        <div class="header">
            <div>
                <div class="badge">Propuesta VIP</div>
                ${logoHtml}
                ${slogan ? `<div class="clinic-sub">${slogan}</div>` : '<div class="clinic-sub">Plan de Tratamiento Dental</div>'}
            </div>
            <div class="clinic-contact">
                <div style="font-weight:700;color:#1e293b;margin-bottom:4px">${today}</div>
                ${doctorLine}
                ${phone ? `<div>${phone}</div>` : ''}
                ${email ? `<div>${email}</div>` : ''}
                ${address ? `<div>${address}</div>` : ''}
            </div>
        </div>
        <div class="patient-box">
            <div>
                <div class="patient-label">Paciente</div>
                <div class="patient-val">${patient ? `${patient.nombres} ${patient.apellidos}` : 'Sin nombre registrado'}</div>
            </div>
            <div style="text-align:right">
                <div class="patient-label">Folio</div>
                <div class="patient-val">${patient?.folio ?? '—'}</div>
            </div>
        </div>
        <table>
            <thead><tr>
                <th>Tratamiento</th>
                <th style="text-align:center">Localización</th>
                <th style="text-align:right">Precio</th>
            </tr></thead>
            <tbody>${rows}${discountRow}</tbody>
        </table>
        <div class="totals">
            <div class="total-line">Subtotal: $${subtotal.toLocaleString('es-MX')}</div>
            <div class="total-main">Total: $${total.toLocaleString('es-MX')}</div>
        </div>
        ${periSection}
        <div class="footer">${footer}<br>Este documento es una propuesta de tratamiento. Los precios pueden variar.</div>
        </body></html>`;

        const win = window.open('', '_blank', 'width=900,height=700');
        if (win) { win.document.write(html); win.document.close(); }
    };

    // ── History snapshot PDF (odontogram + perio + notes) ───────────────────
    const generateHistoryPDF = (snap?: OdontogramSnapshot) => {
        const patient = clinicProfile?.patients?.find(p => p.id === patientId);
        const snapDate = snap
            ? new Date(snap.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        const { clinicName, primary, logoHtml, doctorLine, phone, email, footer } = buildClinicHeader(snapDate);

        // Use snapshot data or current state
        const _surfaces = snap ? snap.surfaces as unknown as Record<number, ToothSurfaceMap> : surfaces;
        const _periodoData = snap ? snap.periodoData as unknown as Record<number, PeriodoData> : periodoData;
        const _toothNotes = snap ? snap.toothNotes : toothNotes;
        const _treatments = snap ? snap.treatments as unknown as AppliedTreatment[] : treatments;
        const _discountActive = snap ? snap.discountActive : discountActive;
        const _subtotal = _treatments.reduce((s, t) => s + t.price, 0);
        const _discountAmt = _discountActive ? _subtotal * 0.1 : 0;
        const _total = _subtotal - _discountAmt;
        const snapDoctorLine = snap?.doctorName
            ? `<div>${snap.doctorName}</div>`
            : doctorLine;

        // Odontogram findings (non-healthy surfaces)
        const SURFACE_LABELS: Record<string, string> = { vestibular: 'Vestibular', lingual: 'Lingual', mesial: 'Mesial', distal: 'Distal', oclusal: 'Oclusal' };
        const odontogramRows = allTeeth.map(n => {
            const s = _surfaces[n];
            if (!s) return '';
            const findings = Object.entries(s)
                .filter(([, cond]) => cond !== 'healthy')
                .map(([surf, cond]) => `${SURFACE_LABELS[surf] ?? surf}: ${CONDITION_LABELS[cond as ToothCondition]}`);
            const note = _toothNotes[n] ?? '';
            if (findings.length === 0 && !note) return '';
            return `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1e293b">${n}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#475569;font-size:12px">${findings.join(', ') || '—'}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;font-size:11px;font-style:italic">${note || '—'}</td>
            </tr>`;
        }).filter(Boolean).join('');

        // Treatment list
        const txRows = _treatments.map(t => `<tr>
            <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;font-weight:600">${t.name}</td>
            <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;text-align:center">D${t.toothNumber} · ${t.surface}</td>
            <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;color:${primary}">$${t.price.toLocaleString('es-MX')}</td>
        </tr>`).join('');

        // Perio summary (teeth with probing depth ≥ 4 or bleeding)
        const periRows = allTeeth.map(n => {
            const pd = _periodoData[n] as any;
            if (!pd || pd.absent) return '';
            const depths = [...(pd.probingDepth?.buccal ?? []), ...(pd.probingDepth?.lingual ?? [])];
            const maxDepth = depths.length ? Math.max(...depths) : 0;
            const bleeding = pd.bleeding?.buccal || pd.bleeding?.lingual;
            if (maxDepth < 4 && !bleeding) return '';
            return `<tr>
                <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-weight:700">${n}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px">${maxDepth} mm</td>
                <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;color:${bleeding ? '#ef4444' : '#22c55e'}">${bleeding ? 'Sí' : 'No'}</td>
            </tr>`;
        }).filter(Boolean).join('');

        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>Historial Odontológico — ${clinicName}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;font-size:13px}
            .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid ${primary};margin-bottom:24px}
            .clinic-contact{text-align:right;font-size:11px;color:#64748b;line-height:1.8}
            .section{margin-bottom:24px}
            .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${primary};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
            table{width:100%;border-collapse:collapse}
            thead tr{background:${primary};color:#fff}
            thead th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
            .patient-box{background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;gap:32px}
            .lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:2px}
            .val{font-size:14px;font-weight:700}
            .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;line-height:1.9}
            @media print{body{padding:16px}button{display:none}}
        </style></head><body>
        <div style="text-align:right;margin-bottom:14px"><button onclick="window.print()" style="background:${primary};color:#fff;border:none;padding:8px 20px;border-radius:7px;font-weight:700;cursor:pointer">Imprimir / Guardar PDF</button></div>
        <div class="header">
            <div>${logoHtml}<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:3px">Historial Odontológico</div></div>
            <div class="clinic-contact"><div style="font-weight:700;color:#1e293b">${snapDate}</div>${snapDoctorLine}${phone ? `<div>${phone}</div>` : ''}${email ? `<div>${email}</div>` : ''}</div>
        </div>
        <div class="patient-box">
            <div><div class="lbl">Paciente</div><div class="val">${patient ? `${patient.nombres} ${patient.apellidos}` : '—'}</div></div>
            <div><div class="lbl">Folio</div><div class="val">${patient?.folio ?? '—'}</div></div>
            <div><div class="lbl">Fecha de registro</div><div class="val">${snapDate}</div></div>
        </div>
        ${odontogramRows ? `<div class="section"><div class="section-title">Hallazgos Odontograma</div>
        <table><thead><tr><th>Diente</th><th>Condición por superficie</th><th>Nota clínica</th></tr></thead>
        <tbody>${odontogramRows}</tbody></table></div>` : ''}
        ${txRows ? `<div class="section"><div class="section-title">Tratamientos Cotizados</div>
        <table><thead><tr><th>Tratamiento</th><th style="text-align:center">Localización</th><th style="text-align:right">Precio</th></tr></thead>
        <tbody>${txRows}</tbody></table>
        <div style="text-align:right;margin-top:10px;font-size:14px;font-weight:700;color:${primary}">Total: $${_total.toLocaleString('es-MX')}</div></div>` : ''}
        ${periRows ? `<div class="section"><div class="section-title">Alertas Periodontales (PS ≥ 4 mm o sangrado)</div>
        <table><thead><tr><th>Diente</th><th style="text-align:center">Prof. sondeo máx.</th><th style="text-align:center">Sangrado</th></tr></thead>
        <tbody>${periRows}</tbody></table></div>` : ''}
        <div class="footer">${footer}<br>Documento generado automáticamente al aprobar el plan de tratamiento.</div>
        </body></html>`;

        const win = window.open('', '_blank', 'width=950,height=750');
        if (win) { win.document.write(html); win.document.close(); }
    };

    // ── Delete odontogram snapshot ───────────────────────────────────────────
    const deleteSnapshot = async (snapId: string) => {
        if (!patientId) return;
        if (!window.confirm('¿Eliminar este registro del historial? Esta acción no se puede deshacer.')) return;
        const updated = odontogramHistory.filter(s => s.id !== snapId);
        setOdontogramHistory(updated);
        await savePatientRecord(patientId, { odontogramHistory: updated });
    };

    // ── Quote calculations ───────────────────────────────────────────────────
    const subtotal = treatments.reduce((s, t) => s + t.price, 0);
    const discountAmt = discountActive ? subtotal * 0.1 : 0;
    const total = subtotal - discountAmt;

    // ── Services from clinic profile ─────────────────────────────────────────
    const clinicServices = clinicProfile?.servicios
        ? Object.values(clinicProfile.servicios).flatMap(cat => Object.entries(cat as Record<string, number>))
        : [];

    // ── Arc helper ──────────────────────────────────────────────────────────
    const Arc: React.FC<{ teeth: number[]; flip?: boolean }> = ({ teeth, flip }) => (
        <div className={`flex justify-center gap-1 ${flip ? 'flex-row-reverse' : ''}`}>
            {/* Right quadrant */}
            <div className={`flex gap-1 pr-3 border-r-2 border-dashed border-electric/30 ${flip ? 'justify-end' : ''}`}>
                {teeth.slice(0, 8).map(n => (
                    <ToothSVG
                        key={n}
                        number={n}
                        surfaces={surfaces[n]}
                        onSurfaceClick={s => handleSurfaceClick(n, s)}
                        isSelected={selectedTooth === n}
                        onSelect={() => setSelectedTooth(prev => prev === n ? null : n)}
                        hasNote={!!toothNotes[n]}
                    />
                ))}
            </div>
            {/* Left quadrant */}
            <div className="flex gap-1 pl-3">
                {teeth.slice(8).map(n => (
                    <ToothSVG
                        key={n}
                        number={n}
                        surfaces={surfaces[n]}
                        onSurfaceClick={s => handleSurfaceClick(n, s)}
                        isSelected={selectedTooth === n}
                        onSelect={() => setSelectedTooth(prev => prev === n ? null : n)}
                        hasNote={!!toothNotes[n]}
                    />
                ))}
            </div>
        </div>
    );

    const fmtSnapDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-full flex flex-col gap-5">
        <div className="w-full flex gap-6 min-h-[600px]">
            {/* ── LEFT: Quote Panel ─────────────────────────────────────────── */}
            <div className="w-72 flex-shrink-0 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto quote-panel-gradient">
                <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Presupuesto</p>
                    <p className="font-syne text-4xl font-bold text-white">${total.toLocaleString('es-MX')}</p>
                </div>

                <div className="bg-white rounded-xl p-4 flex-1 flex flex-col text-gray-800 shadow-inner overflow-hidden">
                    {/* Discount toggle */}
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-400">Descuento Comercial</span>
                        <button type="button" onClick={() => setDiscountActive(d => !d)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${discountActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                            {discountActive ? '10% Activo' : 'Aplicar 10%'}
                        </button>
                    </div>

                    {/* Treatment list */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[80px]">
                        {treatments.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center mt-6">Haz clic en las superficies del diente para cotizar.</p>
                        ) : treatments.map(item => (
                            <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-50 pb-2">
                                <div className="flex gap-2 items-start">
                                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[9px] ${CONDITION_ITEM_STYLE[item.condition]}`}>
                                        {item.toothNumber}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-700 leading-tight">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 capitalize">{item.surface}</p>
                                    </div>
                                </div>
                                <span className="font-mono font-semibold text-gray-600 ml-2">${item.price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="pt-3 border-t border-gray-100 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span><span>${subtotal.toLocaleString('es-MX')}</span>
                        </div>
                        {discountActive && (
                            <div className="flex justify-between font-bold text-blue-500">
                                <span>Descuento 10%</span><span>-${discountAmt.toLocaleString('es-MX')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-800 text-base pt-1">
                            <span>Total</span><span className="text-blue-600">${total.toLocaleString('es-MX')}</span>
                        </div>
                    </div>
                </div>

                {/* Clinic services quick-add hint */}
                {clinicServices.length > 0 && (
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-2">Servicios de tu clínica</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {clinicServices.map(([name, price]) => (
                                <div key={name} className="flex justify-between text-[10px] text-white/70">
                                    <span>{name}</span><span>${price.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handlePDF}
                        disabled={treatments.length === 0}
                        className="flex-1 bg-white text-blue-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={!patientId || treatments.length === 0 || isApproving}
                        className="flex-1 bg-blue-600 border border-white/20 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {approvedOk
                            ? <><CheckCircle2 className="w-4 h-4" /> ¡Aprobado!</>
                            : isApproving
                                ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
                                : <><CheckCircle2 className="w-4 h-4" /> Aprobar</>
                        }
                    </button>
                </div>
            </div>

            {/* ── RIGHT: Chart Panel ────────────────────────────────────────── */}
            <div className="flex-1 glass-panel border border-white/10 rounded-2xl p-5 flex flex-col overflow-hidden">
                {/* Mode switcher */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button type="button" onClick={() => setChartMode('odontogram')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'odontogram' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-clinical'}`}>
                            <Stethoscope className="w-3.5 h-3.5" /> Odontograma
                        </button>
                        <button type="button" onClick={() => setChartMode('periodonto')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'periodonto' ? 'bg-electric text-cobalt' : 'text-clinical/60 hover:text-clinical'}`}>
                            <Activity className="w-3.5 h-3.5" /> Periodontograma
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {patientId && (
                            isSaving
                                ? <Save className="w-3 h-3 text-clinical/40 animate-pulse" />
                                : savedOk
                                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    : null
                        )}
                        <button type="button" onClick={() => generateHistoryPDF()} className="p-2 text-clinical/30 hover:text-amber-400 transition-colors" title="Generar PDF historial (odontograma + perio + notas)">
                            <FileText className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={reset} className="p-2 text-clinical/30 hover:text-red-400 transition-colors" title="Reiniciar todo">
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {chartMode === 'odontogram' && (
                        <motion.div key="odo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4 overflow-auto flex-1">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-1.5 bg-black/20 p-2 rounded-xl border border-white/5 self-center">
                                {TOOLBAR.map(({ condition, dotClass, activeClass }) => (
                                    <button type="button" key={condition}
                                        onClick={() => setActiveTool(condition)}
                                        title={CONDITION_LABELS[condition]}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTool === condition ? activeClass : 'text-white/50 hover:bg-white/10'}`}>
                                        <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${dotClass}`} />
                                        {CONDITION_LABELS[condition]}
                                    </button>
                                ))}
                            </div>

                            {/* Legend */}
                            <p className="text-[10px] text-clinical/30 text-center -mt-2">Haz clic en una superficie del diente para aplicar el tratamiento seleccionado</p>

                            {/* Upper arch */}
                            <div className="overflow-x-auto pb-2">
                                <Arc teeth={UPPER_ADULT} />
                            </div>

                            {/* Midline */}
                            <div className="w-full flex items-center gap-3 my-1">
                                <div className="flex-1 h-px bg-electric/20" />
                                <span className="text-[9px] text-electric/40 font-bold uppercase tracking-widest">Línea Media</span>
                                <div className="flex-1 h-px bg-electric/20" />
                            </div>

                            {/* Lower arch */}
                            <div className="overflow-x-auto pb-2">
                                <Arc teeth={LOWER_ADULT} />
                            </div>

                            {/* Per-tooth note panel */}
                            <AnimatePresence>
                                {selectedTooth !== null && (
                                    <motion.div
                                        key="tooth-note"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="bg-black/30 border border-amber-500/25 rounded-xl p-3 flex gap-3 items-start"
                                    >
                                        <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                                                Nota clínica — Diente {selectedTooth}
                                            </p>
                                            <textarea
                                                title={`Nota clínica diente ${selectedTooth}`}
                                                rows={2}
                                                value={toothNotes[selectedTooth] ?? ''}
                                                onChange={e => setToothNotes(prev => ({
                                                    ...prev,
                                                    [selectedTooth]: e.target.value,
                                                }))}
                                                placeholder="Ej: Caries incipiente mesial, vigilar en próxima consulta…"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs resize-none focus:border-amber-400/50 outline-none transition-colors"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            title="Cerrar nota"
                                            onClick={() => setSelectedTooth(null)}
                                            className="text-clinical/30 hover:text-white transition-colors mt-0.5"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {chartMode === 'periodonto' && (
                        <motion.div key="perio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-6 overflow-auto flex-1 pr-1">
                            <div>
                                <h3 className="text-xs font-bold text-electric uppercase tracking-widest mb-3">Cuadrante Superior</h3>
                                <PeriodoGrid
                                    teethNumbers={UPPER_ADULT}
                                    data={periodoData}
                                    onChange={(n, d) => setPeriodoData(prev => ({ ...prev, [n]: d }))}
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-premium uppercase tracking-widest mb-3">Cuadrante Inferior</h3>
                                <PeriodoGrid
                                    teethNumbers={LOWER_ADULT}
                                    data={periodoData}
                                    onChange={(n, d) => setPeriodoData(prev => ({ ...prev, [n]: d }))}
                                />
                            </div>

                            {/* Summary badges */}
                            <div className="flex gap-4 flex-wrap">
                                {(() => {
                                    let deepSites = 0;
                                    let bleedingTeeth = 0;
                                    let totalDepth = 0;
                                    let totalSites = 0;
                                    allTeeth.forEach(n => {
                                        const pd = periodoData[n];
                                        if (!pd || pd.absent) return;
                                        if (pd.bleeding.buccal || pd.bleeding.lingual) bleedingTeeth++;
                                        (['buccal', 'lingual'] as const).forEach(side => {
                                            pd.probingDepth[side].forEach(v => {
                                                if (v >= 4) deepSites++;
                                                totalDepth += v;
                                                totalSites++;
                                            });
                                        });
                                    });
                                    const avgDepth = totalSites > 0 ? (totalDepth / totalSites).toFixed(1) : '0.0';
                                    return (
                                        <>
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-red-400 font-bold text-lg">{deepSites}</p>
                                                <p className="text-[10px] text-red-400/70 uppercase font-bold">Sitios ≥ 4mm</p>
                                            </div>
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-orange-400 font-bold text-lg">{bleedingTeeth}</p>
                                                <p className="text-[10px] text-orange-400/70 uppercase font-bold">Dientes c/ Sangrado</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 text-center">
                                                <p className="text-blue-400 font-bold text-lg">{avgDepth}</p>
                                                <p className="text-[10px] text-blue-400/70 uppercase font-bold">Promedio Sondaje</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* ── Odontogram History ─────────────────────────────────────────── */}
        {odontogramHistory.length > 0 && (
            <div className="border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-white/4 border-b border-white/8">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Historial Odontológico</span>
                    <span className="ml-auto text-[10px] text-clinical/40">{odontogramHistory.length} registro{odontogramHistory.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-white/5">
                    {[...odontogramHistory].reverse().map(snap => (
                        <div key={snap.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors group">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white">{fmtSnapDate(snap.createdAt)}</p>
                                <p className="text-[10px] text-clinical/50 mt-0.5">
                                    {snap.doctorName ? `Dr. ${snap.doctorName} · ` : ''}
                                    {snap.treatments.length} tratamiento{snap.treatments.length !== 1 ? 's' : ''}
                                    {snap.total > 0 ? ` · $${snap.total.toLocaleString('es-MX')}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => generateHistoryPDF(snap)}
                                title="Ver PDF de este registro"
                                className="flex items-center gap-1.5 text-[10px] font-bold text-electric border border-electric/25 rounded-lg px-3 py-1.5 hover:bg-electric/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FileText className="w-3 h-3" /> PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteSnapshot(snap.id)}
                                title="Eliminar registro"
                                className="p-1.5 text-clinical/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        </div>
    );
};
