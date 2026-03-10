import { MetodoPago } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CajaMovimiento {
    id: string;
    time: string;               // HH:mm
    tipo: 'ingreso' | 'egreso' | 'retiro';
    concepto: string;
    monto: number;
    metodoPago: MetodoPago;
    patientId?: string;
    patientName?: string;
    paymentId?: string;         // Links to PatientPayment.id
    operadorId: string;
    operadorName: string;
}

export interface CajaCierre {
    efectivoContado: number;    // Physical cash counted at close
    diferencia: number;         // Counted - expected
    notas: string;
    closedById: string;
    closedAt: string;
}

export interface CajaDay {
    id: string;                 // 'caja-YYYY-MM-DD'
    date: string;               // YYYY-MM-DD
    apertura: number;           // Opening cash balance
    movimientos: CajaMovimiento[];
    cierre?: CajaCierre;
    status: 'open' | 'closed';
    openedById: string;
    openedByName: string;
    openedAt: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'numia_caja_data';

const getAll = (): CajaDay[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CajaDay[];
    } catch {
        return [];
    }
};

const saveAll = (days: CajaDay[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayKey = () => {
    const now = new Date();
    return `caja-${now.toISOString().split('T')[0]}`;
};

export const todayDate = () => new Date().toISOString().split('T')[0];

// ─── API ──────────────────────────────────────────────────────────────────────

/** Get today's caja, or null if not opened */
export const getTodayCaja = (): CajaDay | null => {
    const all = getAll();
    return all.find(d => d.id === todayKey()) ?? null;
};

/** Get all historical cajas, newest first */
export const getAllCajas = (): CajaDay[] => {
    return getAll().sort((a, b) => b.date.localeCompare(a.date));
};

/** Open today's caja */
export const abrirCaja = (
    apertura: number,
    operadorId: string,
    operadorName: string,
): CajaDay => {
    const all = getAll();
    const id = todayKey();
    const existing = all.find(d => d.id === id);
    if (existing) return existing; // Already open

    const caja: CajaDay = {
        id,
        date: todayDate(),
        apertura,
        movimientos: [],
        status: 'open',
        openedById: operadorId,
        openedByName: operadorName,
        openedAt: new Date().toISOString(),
    };
    saveAll([...all, caja]);
    return caja;
};

/** Add a movement to today's caja */
export const addMovimiento = (
    mov: Omit<CajaMovimiento, 'id' | 'time'>
): CajaDay | null => {
    const all = getAll();
    const idx = all.findIndex(d => d.id === todayKey());
    if (idx === -1) return null;

    const caja = all[idx];
    if (caja.status === 'closed') return caja;

    const now = new Date();
    const newMov: CajaMovimiento = {
        ...mov,
        id: `mov-${Date.now()}`,
        time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    caja.movimientos.push(newMov);
    all[idx] = caja;
    saveAll(all);
    return caja;
};

/** Close today's caja */
export const cerrarCaja = (
    efectivoContado: number,
    notas: string,
    operadorId: string,
): CajaDay | null => {
    const all = getAll();
    const idx = all.findIndex(d => d.id === todayKey());
    if (idx === -1) return null;

    const caja = all[idx];
    const efectivoEsperado = calcEfectivoEsperado(caja);

    caja.cierre = {
        efectivoContado,
        diferencia: efectivoContado - efectivoEsperado,
        notas,
        closedById: operadorId,
        closedAt: new Date().toISOString(),
    };
    caja.status = 'closed';
    all[idx] = caja;
    saveAll(all);
    return caja;
};

// ─── Computed totals ──────────────────────────────────────────────────────────

export interface CajaTotals {
    ingresos: number;
    egresos: number;
    retiros: number;
    neto: number;
    efectivoEsperado: number;
    byMetodo: Record<MetodoPago, number>;
}

export const calcTotals = (caja: CajaDay): CajaTotals => {
    const byMetodo: Record<MetodoPago, number> = {
        efectivo: 0, tarjeta_credito: 0, tarjeta_debito: 0,
        transferencia: 0, cripto: 0,
    };

    let ingresos = 0, egresos = 0, retiros = 0;

    for (const mov of caja.movimientos) {
        if (mov.tipo === 'ingreso') {
            ingresos += mov.monto;
            byMetodo[mov.metodoPago] = (byMetodo[mov.metodoPago] ?? 0) + mov.monto;
        } else if (mov.tipo === 'egreso') {
            egresos += mov.monto;
        } else {
            retiros += mov.monto;
        }
    }

    const neto = ingresos - egresos - retiros;
    const efectivoEsperado = caja.apertura + (byMetodo.efectivo) - egresos - retiros;

    return { ingresos, egresos, retiros, neto, efectivoEsperado, byMetodo };
};

const calcEfectivoEsperado = (caja: CajaDay): number =>
    calcTotals(caja).efectivoEsperado;

/** Re-open a closed caja (for corrections; admin use) */
export const reabrirCaja = (cajaId: string): CajaDay | null => {
    const all = getAll();
    const idx = all.findIndex(d => d.id === cajaId);
    if (idx === -1) return null;
    all[idx].status = 'open';
    delete all[idx].cierre;
    saveAll(all);
    return all[idx];
};

/** Edit closure notes / efectivo contado of a historical caja */
export const editCajaCierre = (
    cajaId: string,
    efectivoContado: number,
    notas: string,
): CajaDay | null => {
    const all = getAll();
    const idx = all.findIndex(d => d.id === cajaId);
    if (idx === -1 || !all[idx].cierre) return null;
    const caja = all[idx];
    const efectivoEsperado = calcEfectivoEsperado(caja);
    caja.cierre = {
        ...caja.cierre!,
        efectivoContado,
        diferencia: efectivoContado - efectivoEsperado,
        notas,
    };
    all[idx] = caja;
    saveAll(all);
    return caja;
};

/** Add a correction movement to any caja day (historical correction) */
export const addMovimientoToCaja = (
    cajaId: string,
    mov: Omit<CajaMovimiento, 'id' | 'time'>
): CajaDay | null => {
    const all = getAll();
    const idx = all.findIndex(d => d.id === cajaId);
    if (idx === -1) return null;
    const now = new Date();
    const newMov: CajaMovimiento = {
        ...mov,
        id: `mov-${Date.now()}`,
        time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    all[idx].movimientos.push(newMov);
    saveAll(all);
    return all[idx];
};
