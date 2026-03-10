import { TreatmentPlanItem, PatientPayment } from './supabase';
import { StaffMember } from '../context/MarketContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientSummaryForLiquidacion {
    patientId: string;
    patientName: string;
    payments: PatientPayment[];
    treatmentItems: TreatmentPlanItem[];
}

export interface LiquidacionLinea {
    tratamiento: string;
    toothNumber?: number;
    paciente: string;
    fecha: string;          // completedDate of the treatment item
    precio: number;         // price - discount
    porcentaje: number;     // doctor's commission %
    comision: number;       // precio * porcentaje / 100
    estatus: 'pendiente' | 'pagado';
    paymentId?: string;     // PatientPayment.id that covers this
}

export interface LiquidacionDoctor {
    doctorId: string;
    doctorName: string;
    especialidad: string;
    porcentajeComision: number;
    lineas: LiquidacionLinea[];
    totalGenerado: number;     // Sum of all line prices
    totalComision: number;     // Sum of all commissions
    totalPagado: number;       // Commissions already paid out
    totalPendiente: number;    // Commissions not yet paid
    periodo: { desde: string; hasta: string };
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Calculates doctor liquidation for a given period.
 *
 * @param staff         - All clinic staff
 * @param patientData   - Per-patient data (payments + treatment items)
 * @param desde         - Start date YYYY-MM-DD (inclusive)
 * @param hasta         - End date YYYY-MM-DD (inclusive)
 * @param doctorIds     - Optional filter to specific doctors
 */
export function calcularLiquidaciones(
    staff: StaffMember[],
    patientData: PatientSummaryForLiquidacion[],
    desde: string,
    hasta: string,
    doctorIds?: string[],
): LiquidacionDoctor[] {
    const doctors = staff.filter(s =>
        (s.staffType === 'doctor' || s.staffType === 'external_doctor') &&
        (!doctorIds || doctorIds.includes(s.id))
    );

    return doctors.map(doctor => {
        const pct = doctor.porcentajeComision ?? 30; // default 30% if not set
        const lineas: LiquidacionLinea[] = [];

        for (const p of patientData) {
            // Items completed by this doctor in the period
            const items = p.treatmentItems.filter(item => {
                if (item.doctorId !== doctor.id) return false;
                if (item.status !== 'completed' && item.status !== 'paid') return false;
                const fecha = item.completedDate ?? '';
                return fecha >= desde && fecha <= hasta;
            });

            // Build a set of treatment item IDs covered by payments
            const coveredByPayment = new Map<string, PatientPayment>();
            for (const pay of p.payments) {
                for (const tid of pay.treatmentItemIds) {
                    if (!coveredByPayment.has(tid)) {
                        coveredByPayment.set(tid, pay);
                    }
                }
            }

            for (const item of items) {
                const precio = item.price - item.discount;
                const payment = coveredByPayment.get(item.id);
                lineas.push({
                    tratamiento: item.name,
                    toothNumber: item.toothNumber,
                    paciente: p.patientName,
                    fecha: item.completedDate ?? hasta,
                    precio,
                    porcentaje: pct,
                    comision: Math.round(precio * pct / 100),
                    estatus: item.status === 'paid' || payment ? 'pagado' : 'pendiente',
                    paymentId: payment?.id,
                });
            }
        }

        const totalGenerado = lineas.reduce((s, l) => s + l.precio, 0);
        const totalComision = lineas.reduce((s, l) => s + l.comision, 0);
        const totalPagado   = lineas.filter(l => l.estatus === 'pagado').reduce((s, l) => s + l.comision, 0);

        return {
            doctorId: doctor.id,
            doctorName: doctor.nombres,
            especialidad: doctor.especialidad ?? '',
            porcentajeComision: pct,
            lineas,
            totalGenerado,
            totalComision,
            totalPendiente: totalComision - totalPagado,
            totalPagado,
            periodo: { desde, hasta },
        };
    });
}

/** Quick helper: first day of current month */
export const primerDiaMes = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

/** Quick helper: today */
export const hoy = (): string => new Date().toISOString().split('T')[0];
